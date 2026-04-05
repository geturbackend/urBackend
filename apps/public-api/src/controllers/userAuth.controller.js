const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const mongoose = require('mongoose');
const crypto = require('crypto');
const {redis} = require('@urbackend/common');
const {Project} = require('@urbackend/common');
const { authEmailQueue } = require('@urbackend/common');
const { getRefreshSession, persistRefreshSession, revokeSessionChain } = require('@urbackend/common');
const { loginSchema, userSignupSchema, resetPasswordSchema, onlyEmailSchema, verifyOtpSchema, changePasswordSchema, sanitize } = require('@urbackend/common');
const { getConnection } = require('@urbackend/common');
const { getCompiledModel } = require('@urbackend/common');
const { decrypt } = require('@urbackend/common');
const {
    assertRefreshRateLimits,
    clearRefreshCookie,
    hashRefreshToken,
    issueAuthTokens,
    parseRefreshToken,
    readRefreshTokenFromRequest,
    shouldExposeRefreshToken
} = require('../utils/refreshToken');

const SOCIAL_PROVIDER_KEYS = ['github', 'google'];
const SOCIAL_STATE_TTL_SECONDS = 600;
const SOCIAL_REFRESH_EXCHANGE_TTL_SECONDS = 60;

const getPublicApiBaseUrl = () => {
    const configured = process.env.PUBLIC_API_URL?.trim();
    if (configured) return configured.replace(/\/$/, '');
    const port = process.env.USER_PORT || 1235;
    return `http://localhost:${port}`;
};

const getSocialStateKey = (state) => `project:auth:oauth:state:${state}`;
const getSocialRefreshExchangeKey = (rtCode) => `project:social-auth:refresh-exchange:${rtCode}`;
const getFrontendCallbackBaseUrl = (project) => {
    const configured = String(project?.siteUrl || '').trim();
    const base = configured || process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${base.replace(/\/$/, '')}/auth/callback`;
};
const toBase64UrlBuffer = (input) => Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '='), 'base64');

const assertAuthProjectReady = (project) => {
    if (!project?.isAuthEnabled) {
        const err = new Error('Authentication service is disabled');
        err.statusCode = 403;
        throw err;
    }

    const usersCollection = project.collections?.find(c => c.name === 'users');
    if (!usersCollection) {
        const err = new Error("User Schema Missing");
        err.statusCode = 403;
        err.publicMessage = "Authentication is enabled, but the 'users' collection has not been defined.";
        throw err;
    }

    const hasEmail = usersCollection.model.find(f => f.key === 'email' && f.type === 'String' && f.required);
    const hasPassword = usersCollection.model.find(f => f.key === 'password' && f.type === 'String' && f.required);
    if (!hasEmail || !hasPassword) {
        const err = new Error('Invalid Users Schema');
        err.statusCode = 422;
        err.publicMessage = "The 'users' collection must contain required 'email' and 'password' String fields.";
        throw err;
    }

    return usersCollection;
};

const getSocialProviderConfig = async (projectId, provider) => {
    const selectClause = `name resources collections jwtSecret isAuthEnabled authProviders.${provider} +authProviders.${provider}.clientSecret.encrypted +authProviders.${provider}.clientSecret.iv +authProviders.${provider}.clientSecret.tag`;
    const project = await Project.findById(projectId).select(selectClause).lean();
    if (!project) return null;

    const providerConfig = project.authProviders?.[provider];
    if (!providerConfig?.enabled || !providerConfig.clientId || !providerConfig.clientSecret) {
        return { project, providerConfig: null };
    }

    const decryptedSecret = decrypt(providerConfig.clientSecret);
    if (!decryptedSecret) {
        return { project, providerConfig: null };
    }

    return {
        project,
        providerConfig: {
            enabled: true,
            clientId: providerConfig.clientId,
            clientSecret: decryptedSecret,
            redirectUri: `${getPublicApiBaseUrl()}/api/userAuth/social/${provider}/callback`
        }
    };
};

const buildGithubAuthorizeUrl = ({ clientId, redirectUri, state }) => {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

const buildGoogleAuthorizeUrl = ({ clientId, redirectUri, state }) => {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const exchangeGithubCodeForToken = async ({ code, clientId, clientSecret, redirectUri }) => {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
        }),
    });

    const payload = await response.json();
    if (!response.ok || payload.error || !payload.access_token) {
        throw new Error(payload.error_description || payload.error || 'GitHub token exchange failed');
    }

    return {
        accessToken: payload.access_token,
        tokenType: payload.token_type || 'bearer',
    };
};

const exchangeGoogleCodeForToken = async ({ code, clientId, clientSecret, redirectUri }) => {
    const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    const payload = await response.json();
    if (!response.ok || payload.error || !payload.id_token) {
        throw new Error(payload.error_description || payload.error || 'Google token exchange failed');
    }

    return payload;
};

const fetchGithubProfile = async (accessToken) => {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'urBackend-social-auth',
    };

    const [profileResponse, emailsResponse] = await Promise.all([
        fetch('https://api.github.com/user', { headers }),
        fetch('https://api.github.com/user/emails', { headers }),
    ]);

    const profile = await profileResponse.json();
    const emails = await emailsResponse.json();

    if (!profileResponse.ok) {
        throw new Error(profile.message || 'Failed to fetch GitHub profile');
    }
    if (!emailsResponse.ok || !Array.isArray(emails)) {
        throw new Error('Failed to fetch GitHub email addresses');
    }

    const verifiedEmail = emails.find((entry) => entry.primary && entry.verified) || emails.find((entry) => entry.verified);
    return {
        providerUserId: String(profile.id || ''),
        email: verifiedEmail?.email || profile.email || '',
        emailVerified: !!verifiedEmail?.verified,
        username: profile.login || '',
        name: profile.name || profile.login || '',
        avatarUrl: profile.avatar_url || '',
        rawProfile: profile,
    };
};

const verifyGoogleIdToken = async ({ idToken, clientId }) => {
    const parts = String(idToken || '').split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid Google id_token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(toBase64UrlBuffer(encodedHeader).toString('utf8'));
    const payload = JSON.parse(toBase64UrlBuffer(encodedPayload).toString('utf8'));

    if (header.alg !== 'RS256' || !header.kid) {
        throw new Error('Unsupported Google id_token signature');
    }

    const certsResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    const certsPayload = await certsResponse.json();
    const signingKey = certsPayload.keys?.find((key) => key.kid === header.kid);
    if (!certsResponse.ok || !signingKey) {
        throw new Error('Unable to verify Google id_token signing key');
    }

    const publicKey = crypto.createPublicKey({ key: signingKey, format: 'jwk' });
    const verified = crypto.verify(
        'RSA-SHA256',
        Buffer.from(`${encodedHeader}.${encodedPayload}`),
        publicKey,
        toBase64UrlBuffer(encodedSignature)
    );

    if (!verified) {
        throw new Error('Invalid Google id_token signature');
    }

    const validIssuers = new Set(['accounts.google.com', 'https://accounts.google.com']);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const audienceMatches = Array.isArray(payload.aud)
        ? payload.aud.includes(clientId)
        : payload.aud === clientId;

    if (!audienceMatches) {
        throw new Error('Google id_token audience mismatch');
    }
    if (!validIssuers.has(payload.iss)) {
        throw new Error('Google id_token issuer mismatch');
    }
    if (!payload.exp || Number(payload.exp) <= nowSeconds) {
        throw new Error('Google id_token has expired');
    }

    return payload;
};

const fetchGoogleProfile = async ({ idToken, clientId }) => {
    const claims = await verifyGoogleIdToken({ idToken, clientId });
    return {
        providerUserId: String(claims.sub || ''),
        email: claims.email || '',
        emailVerified: !!claims.email_verified,
        username: claims.email ? String(claims.email).split('@')[0] : '',
        name: claims.name || '',
        avatarUrl: claims.picture || '',
        rawProfile: claims,
    };
};

const socialProviders = {
    github: {
        buildAuthorizeUrl: buildGithubAuthorizeUrl,
        exchangeCodeForToken: exchangeGithubCodeForToken,
        fetchProfile: async ({ tokenResponse }) => fetchGithubProfile(tokenResponse.accessToken),
    },
    google: {
        buildAuthorizeUrl: buildGoogleAuthorizeUrl,
        exchangeCodeForToken: exchangeGoogleCodeForToken,
        fetchProfile: async ({ tokenResponse, providerConfig }) => fetchGoogleProfile({
            idToken: tokenResponse.id_token,
            clientId: providerConfig.clientId,
        }),
    },
};

const buildSocialAuthUserPayload = async (usersColConfig, profile) => {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    return buildAuthUserPayload(
        usersColConfig,
        {
            email: profile.email,
            password: randomPassword,
            username: profile.username,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
        },
        hashedPassword,
        profile.emailVerified
    );
};

const findOrCreateSocialUser = async ({ project, usersColConfig, Model, provider, profile }) => {
    const providerIdField = `${provider}Id`;
    const providerName = provider;

    let user = await Model.findOne({ [providerIdField]: profile.providerUserId });
    if (user) {
        return { user, isNewUser: false, linkedByEmail: false };
    }

    if (!profile.email) {
        const err = new Error(`${providerName} did not return an email address for this account.`);
        err.statusCode = 422;
        throw err;
    }

    user = await Model.findOne({ email: profile.email });
    if (user && profile.emailVerified) {
        const update = {
            $set: {
                [providerIdField]: profile.providerUserId,
                ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
            },
            $addToSet: { authProviders: providerName },
        };

        if (profile.emailVerified) {
            const verificationField = getVerificationField(usersColConfig);
            if (verificationField) {
                update.$set[verificationField] = true;
            }
        }

        await Model.updateOne({ _id: user._id }, update);
        user = await Model.findOne({ _id: user._id });
        return { user, isNewUser: false, linkedByEmail: true };
    }

    const newUserPayload = await buildSocialAuthUserPayload(usersColConfig, profile);
    newUserPayload[providerIdField] = profile.providerUserId;
    newUserPayload.authProviders = [providerName];
    if (profile.avatarUrl && newUserPayload.avatarUrl === undefined) {
        newUserPayload.avatarUrl = profile.avatarUrl;
    }

    user = await Model.create(newUserPayload);
    return { user, isNewUser: true, linkedByEmail: false };
};

const getUsersModel = async (project) => {
    const usersColConfig = project.collections.find(c => c.name === 'users');
    if (!usersColConfig) return { usersColConfig: null, Model: null };
    const connection = await getConnection(project._id);
    const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);
    return { usersColConfig, Model };
};

const hasRequiredField = (usersColConfig, fieldKey) => {
    const model = usersColConfig?.model || [];
    return model.some((f) => f?.key === fieldKey && !!f?.required);
};

const getVerificationField = (usersColConfig) => {
    const modelKeys = (usersColConfig?.model || []).map((f) => f?.key);
    if (modelKeys.includes('emailVerified')) return 'emailVerified';
    if (modelKeys.includes('isVerified')) return 'isVerified';
    if (modelKeys.includes('isverified')) return 'isverified';
    return null;
};

const buildAuthUserPayload = (usersColConfig, parsedData, hashedPassword, verifiedValue) => {
    const { email, password: _password, username, ...otherData } = parsedData;

    const payload = {
        email,
        password: hashedPassword,
        ...otherData,
        createdAt: new Date()
    };

    if (username !== undefined) {
        payload.username = username;
    }

    const verificationField = getVerificationField(usersColConfig);
    if (verificationField !== null) {
        payload[verificationField] = verifiedValue;
    }

    if (hasRequiredField(usersColConfig, 'name') && (payload.name === undefined || payload.name === null || payload.name === '')) {
        const generatedName = username || email.split('@')[0];
        payload.name = generatedName.length >= 3 ? generatedName : generatedName.padEnd(3, '0');
    }

    if (hasRequiredField(usersColConfig, 'username') && (payload.username === undefined || payload.username === null || payload.username === '')) {
        const baseUsername = typeof payload.name === 'string' ? payload.name : email.split('@')[0];
        const generatedUsername = baseUsername;
        payload.username = generatedUsername.length >= 3 ? generatedUsername : generatedUsername.padEnd(3, '0');
    }

    return payload;
};

const SENSITIVE_PROFILE_KEYS = [
    'password',
    'email',
    'token',
    'otp',
    'secret',
    'session',
    'refresh'
];

const sanitizePublicProfile = (userDoc, usersColConfig) => {
    const result = { _id: userDoc._id };
    const schemaKeys = (usersColConfig?.model || []).map((f) => f?.key).filter(Boolean);

    for (const key of schemaKeys) {
        const lowered = String(key).toLowerCase();
        const isSensitive = SENSITIVE_PROFILE_KEYS.some((needle) => lowered.includes(needle));
        if (isSensitive) continue;
        if (userDoc[key] !== undefined) {
            result[key] = userDoc[key];
        }
    }

    if (userDoc.createdAt) result.createdAt = userDoc.createdAt;
    if (userDoc.updatedAt) result.updatedAt = userDoc.updatedAt;
    return result;
};

module.exports.startSocialAuth = async (req, res) => {
    try {
        const provider = String(req.params.provider || '').trim().toLowerCase();
        if (!SOCIAL_PROVIDER_KEYS.includes(provider)) {
            return res.status(404).json({ error: 'Unsupported social auth provider' });
        }

        assertAuthProjectReady(req.project);

        const { project, providerConfig } = await getSocialProviderConfig(req.project._id, provider);
        if (!project || !providerConfig) {
            return res.status(422).json({
                error: 'Provider not configured',
                message: `${provider} social auth is disabled or incomplete for this project.`,
            });
        }

        const state = crypto.randomBytes(24).toString('hex');
        await redis.set(
            getSocialStateKey(state),
            JSON.stringify({
                projectId: String(project._id),
                provider,
                callbackUrl: getFrontendCallbackBaseUrl(project),
            }),
            'EX',
            SOCIAL_STATE_TTL_SECONDS
        );

        const authUrl = socialProviders[provider].buildAuthorizeUrl({
            clientId: providerConfig.clientId,
            redirectUri: providerConfig.redirectUri,
            state,
        });

        return res.redirect(authUrl);
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            error: err.publicMessage || err.message,
        });
    }
};

module.exports.handleSocialAuthCallback = async (req, res) => {
    try {
        const provider = String(req.params.provider || '').trim().toLowerCase();
        if (!SOCIAL_PROVIDER_KEYS.includes(provider)) {
            return res.status(404).json({ error: 'Unsupported social auth provider' });
        }

        const code = String(req.query.code || '').trim();
        const state = String(req.query.state || '').trim();
        if (!code || !state) {
            return res.status(400).json({ error: 'Missing code or state' });
        }

        const stateKey = getSocialStateKey(state);
        const rawState = await redis.get(stateKey);
        if (!rawState) {
            return res.status(400).json({ error: 'Invalid or expired OAuth state' });
        }

        await redis.del(stateKey);

        let parsedState;
        try {
            parsedState = JSON.parse(rawState);
        } catch (parseErr) {
            return res.status(400).json({ error: 'Invalid or expired OAuth state' });
        }
        if (parsedState.provider !== provider || !parsedState.projectId) {
            return res.status(400).json({ error: 'OAuth state mismatch' });
        }

        const { project, providerConfig } = await getSocialProviderConfig(parsedState.projectId, provider);
        if (!project || !providerConfig) {
            return res.status(422).json({
                error: 'Provider not configured',
                message: `${provider} social auth is disabled or incomplete for this project.`,
            });
        }

        const usersColConfig = assertAuthProjectReady(project);
        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const tokenResponse = await socialProviders[provider].exchangeCodeForToken({
            code,
            clientId: providerConfig.clientId,
            clientSecret: providerConfig.clientSecret,
            redirectUri: providerConfig.redirectUri,
        });

        const profile = await socialProviders[provider].fetchProfile({
            tokenResponse,
            providerConfig,
        });
        const { user, isNewUser, linkedByEmail } = await findOrCreateSocialUser({
            project,
            usersColConfig,
            Model,
            provider,
            profile,
        });

        const issuedTokens = await issueAuthTokens({
            project,
            userId: user._id,
            req,
            res,
        });
        const rtCode = crypto.randomBytes(16).toString('hex');
        await redis.set(
            getSocialRefreshExchangeKey(rtCode),
            JSON.stringify({
                token: issuedTokens.accessToken,
                refreshToken: issuedTokens.refreshToken,
            }),
            'EX',
            SOCIAL_REFRESH_EXCHANGE_TTL_SECONDS
        );

        const callbackBaseUrl = parsedState.callbackUrl || getFrontendCallbackBaseUrl(project);
        const callbackUrl = new URL(callbackBaseUrl);
        callbackUrl.searchParams.set('rtCode', rtCode);
        callbackUrl.searchParams.set('provider', provider);
        callbackUrl.searchParams.set('userId', String(user._id));
        callbackUrl.searchParams.set('projectId', String(project._id));
        callbackUrl.searchParams.set('isNewUser', String(isNewUser));
        callbackUrl.searchParams.set('linkedByEmail', String(linkedByEmail));
        const fragmentParams = new URLSearchParams();
        fragmentParams.set('token', issuedTokens.accessToken);
        callbackUrl.hash = fragmentParams.toString();

        return res.redirect(callbackUrl.toString());
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            error: err.message || 'Social authentication failed',
        });
    }
};

module.exports.exchangeSocialRefreshToken = async (req, res) => {
    try {
        const rtCode = String(req.body?.rtCode || '').trim();
        const token = String(req.body?.token || '').trim();

        if (!rtCode || !token) {
            return res.status(400).json({
                success: false,
                message: 'rtCode and token are required',
            });
        }

        const exchangeKey = getSocialRefreshExchangeKey(rtCode);
        const rawExchange = await redis.get(exchangeKey);
        if (!rawExchange) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired refresh token exchange code',
            });
        }

        let parsedExchange;
        try {
            parsedExchange = JSON.parse(rawExchange);
        } catch (err) {
            await redis.del(exchangeKey);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired refresh token exchange code',
            });
        }

        if (parsedExchange.token !== token || !parsedExchange.refreshToken) {
            await redis.del(exchangeKey);
            return res.status(403).json({
                success: false,
                message: 'Invalid refresh token exchange payload',
            });
        }

        await redis.del(exchangeKey);
        return res.status(200).json({
            success: true,
            data: {
                refreshToken: parsedExchange.refreshToken,
            },
            message: 'Refresh token exchanged successfully',
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to exchange refresh token',
        });
    }
};


// POST REQ FOR SIGNUP
module.exports.signup = async (req, res) => {
    try {
        const project = req.project;

        const { email, password, username, ...otherData } = userSignupSchema.parse(req.body);

        // Get Mongoose Model
        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const existingUser = await Model.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const newUserPayload = buildAuthUserPayload(
            usersColConfig,
            { email, password, username, ...otherData },
            hashedPassword,
            false
        );

        // Model.create handles validation and default values
        const result = await Model.create(newUserPayload);

        await redis.set(`project:${project._id}:otp:verification:${email}`, otp, 'EX', 300);

        await authEmailQueue.add('send-verification-email', {
            email,
            otp,
            type: 'verification',
            pname: project.name
        });

        const issuedTokens = await issueAuthTokens({
            project,
            userId: result._id,
            req,
            res
        });

        res.status(201).json({
            message: "User registered successfully. Please verify your email.",
            token: issuedTokens.accessToken,
            accessToken: issuedTokens.accessToken,
            expiresIn: issuedTokens.expiresIn,
            ...(shouldExposeRefreshToken(req) ? { refreshToken: issuedTokens.refreshToken } : {}),
            userId: result._id
        });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues?.[0]?.message || err.errors?.[0]?.message || "Validation failed" });
        }
        res.status(500).json({ error: err.message });
        console.log(err)
    }
}

// POST REQ FOR LOGIN
module.exports.login = async (req, res) => {
    try {
        const project = req.project;
        const { email, password } = loginSchema.parse(req.body);

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const user = await Model.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Invalid email or password" });

        const issuedTokens = await issueAuthTokens({
            project,
            userId: user._id,
            req,
            res
        });

        res.json({
            token: issuedTokens.accessToken,
            accessToken: issuedTokens.accessToken,
            expiresIn: issuedTokens.expiresIn,
            ...(shouldExposeRefreshToken(req) ? { refreshToken: issuedTokens.refreshToken } : {})
        });

    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        res.status(500).json({ error: err.message }); // Fixed: .json()
    }
}

// FUNCTION - GET CURRENT USER
module.exports.me = async (req, res) => {
    try {
        const project = req.project;
        const tokenHeader = req.header('Authorization');

        if (!tokenHeader) return res.status(401).json({ error: "Access Denied: No Token Provided" });

        const token = tokenHeader.replace("Bearer ", "");

        try {
            const decoded = jwt.verify(token, project.jwtSecret);
            const usersColConfig = project.collections.find(c => c.name === 'users');
            if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

            const connection = await getConnection(project._id);
            const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

            const user = await Model.findOne(
                { _id: new mongoose.Types.ObjectId(decoded.userId) },
                { password: 0 }
            ).lean();

            if (!user) return res.status(404).json({ error: "User not found" });

            res.json(user);

        } catch (err) {
            return res.status(401).json({ error: "Invalid or Expired Token" });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// GET PUBLIC PROFILE BY USERNAME
module.exports.publicProfile = async (req, res) => {
    try {
        const project = req.project;
        const username = String(req.params.username || '').trim();
        if (!username) return res.status(400).json({ error: "Username is required" });

        const { usersColConfig, Model } = await getUsersModel(project);
        if (!usersColConfig || !Model) return res.status(404).json({ error: "Auth collection not found" });

        const hasUsernameField = (usersColConfig.model || []).some((f) => String(f?.key || '').trim() === 'username');
        if (!hasUsernameField) {
            return res.status(400).json({ error: "Public profile requires a 'username' field in users schema" });
        }

        const user = await Model.findOne({ username }, { password: 0 }).lean();
        if (!user) return res.status(404).json({ error: "User not found" });

        const profile = sanitizePublicProfile(user, usersColConfig);
        return res.json(profile);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// POST REQ FOR ADMIN CREATE USER
module.exports.createAdminUser = async (req, res) => {
    try {
        const project = req.project;

        const parsedData = userSignupSchema.parse(req.body);
        const { email, password, username, ...otherData } = parsedData;

        // Get Mongoose Model
        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const existingUser = await Model.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUserPayload = buildAuthUserPayload(
            usersColConfig,
            { email, password, username, ...otherData },
            hashedPassword,
            true
        );

        const result = await Model.create(newUserPayload);

        res.status(201).json({
            message: "User created successfully",
            user: { _id: result._id, email, username, createdAt: newUserPayload.createdAt }
        });

    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error(err);
            return res.status(400).json({ error: err.issues?.[0]?.message || err.errors?.[0]?.message || "Validation failed" });
        }
        res.status(500).json({ error: err.message });
    }
}

// PATCH REQ FOR ADMIN RESET PASSWORD
module.exports.resetPassword = async (req, res) => {
    try {
        const project = req.project;
        const { userId } = req.params;

        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const result = await Model.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST REQ FOR EMAIL VERIFICATION
module.exports.verifyEmail = async (req, res) => {
    try {
        const project = req.project;
        const { email, otp } = verifyOtpSchema.parse(req.body);

        const redisKey = `project:${project._id}:otp:verification:${email}`;
        const storedOtp = await redis.get(redisKey);

        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const verificationField = getVerificationField(usersColConfig);
        if (!verificationField) {
            return res.status(500).json({ error: "No verification field found in users schema" });
        }
        const result = await Model.updateOne(
            { email },
            { $set: { [verificationField]: true } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

        await redis.del(redisKey);
        res.json({ message: "Email verified successfully" });

    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || "Validation failed" });
        res.status(500).json({ error: err.message });
    }
};

// POST REQ FOR PASSWORD RESET REQUEST
module.exports.requestPasswordReset = async (req, res) => {
    try {
        const project = req.project;
        const { email } = onlyEmailSchema.parse(req.body);

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);
        
        const user = await Model.findOne({ email });
        if (!user) {
            return res.json({ message: "If that email exists, a reset code has been sent." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(`project:${project._id}:otp:reset:${email}`, otp, 'EX', 300);

        await authEmailQueue.add('send-reset-email', { email, otp, type: 'password_reset', pname: project.name });

        res.json({ message: "If that email exists, a reset code has been sent." });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || "Validation failed" });
        res.status(500).json({ error: err.message });
    }
};

// POST REQ FOR PASSWORD RESET CONFIRMATION
module.exports.resetPasswordUser = async (req, res) => {
    try {
        const project = req.project;
        const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

        const redisKey = `project:${project._id}:otp:reset:${email}`;
        const storedOtp = await redis.get(redisKey);

        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { Model: collection } = await getUsersModel(project);
        if (!collection) return res.status(404).json({ error: "Auth collection not found" });

        const result = await collection.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

        await redis.del(redisKey);
        res.json({ message: "Password updated successfully" });

    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || "Validation failed" });
        res.status(500).json({ error: err.message });
    }
};

// PATCH REQ FOR UPDATE PROFILE
module.exports.updateProfile = async (req, res) => {
    try {
        const project = req.project;
        
        const tokenHeader = req.header('Authorization');
        if (!tokenHeader) return res.status(401).json({ error: "Access Denied: No Token Provided" });
        const token = tokenHeader.replace("Bearer ", "");
        
        let decoded;
        try {
            decoded = jwt.verify(token, project.jwtSecret);
        } catch (err) {
            return res.status(401).json({ error: "Access Denied: Invalid or expired token" });
        }

        const updateData = { ...req.body };
        delete updateData.password;
        delete updateData.email;
        delete updateData._id;

        if (updateData.username !== undefined) {
            const username = updateData.username;
            if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
                return res.status(400).json({ error: "Username must be between 3 and 50 characters." });
            }
        }

        const sanitizedUpdateData = sanitize(updateData);

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const result = await Model.updateOne(
            { _id: new mongoose.Types.ObjectId(decoded.userId) },
            { $set: sanitizedUpdateData },
            { runValidators: true }
        );

        res.json({ message: "Profile updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST REQ FOR CHANGE PASSWORD
module.exports.changePasswordUser = async (req, res) => {
    try {
        const project = req.project;
        
        const tokenHeader = req.header('Authorization');
        if (!tokenHeader) return res.status(401).json({ error: "Access Denied: No Token Provided" });
        const token = tokenHeader.replace("Bearer ", "");
        
        let decoded;
        try {
            decoded = jwt.verify(token, project.jwtSecret);
        } catch (err) {
            return res.status(401).json({ error: "Access Denied: Invalid or expired token" });
        }

        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const user = await Model.findOne({ _id: new mongoose.Types.ObjectId(decoded.userId) });
        if (!user) return res.status(404).json({ error: "User not found" });

        const validPass = await bcrypt.compare(currentPassword, user.password);
        if (!validPass) return res.status(400).json({ error: "Invalid current password" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await Model.updateOne(
            { _id: new mongoose.Types.ObjectId(decoded.userId) },
            { $set: { password: hashedPassword } }
        );

        res.json({ message: "Password changed successfully" });

    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || "Validation failed" });
        res.status(500).json({ error: err.message });
    }
};

module.exports.refreshToken = async (req, res) => {
    try {
        const rawRefreshToken = readRefreshTokenFromRequest(req);
        if (!rawRefreshToken) {
            clearRefreshCookie(res);
            return res.status(401).json({ error: 'Refresh token missing' });
        }

        const parsedToken = parseRefreshToken(rawRefreshToken);
        if (!parsedToken) {
            clearRefreshCookie(res);
            return res.status(401).json({ error: 'Invalid refresh token format' });
        }

        const earlyRateLimit = await assertRefreshRateLimits({ req, tokenId: parsedToken.tokenId });
        if (earlyRateLimit.limited) {
            clearRefreshCookie(res);
            return res.status(429).json({ error: earlyRateLimit.message });
        }

        const session = await getRefreshSession(parsedToken.tokenId);
        if (!session) {
            clearRefreshCookie(res);
            return res.status(401).json({ error: 'Refresh session not found' });
        }

        if (String(req.project._id) !== String(session.projectId)) {
            return res.status(403).json({ error: 'Refresh token does not belong to this project' });
        }

        const rateResult = await assertRefreshRateLimits({ req, tokenId: session.tokenId, userId: session.userId });
        if (rateResult.limited) {
            clearRefreshCookie(res);
            return res.status(429).json({ error: rateResult.message });
        }

        const now = Date.now();
        const isExpired = new Date(session.expiresAt).getTime() <= now;
        if (session.revokedAt || session.isUsed || isExpired) {
            await revokeSessionChain(session.tokenId);
            clearRefreshCookie(res);
            return res.status(403).json({ error: 'Refresh token is invalid or already used' });
        }

        if (hashRefreshToken(rawRefreshToken) !== session.tokenHash) {
            await revokeSessionChain(session.tokenId);
            clearRefreshCookie(res);
            return res.status(403).json({ error: 'Refresh token mismatch' });
        }

        session.isUsed = true;
        session.lastUsedAt = new Date().toISOString();
        await persistRefreshSession(session);

        const project = await Project.findById(session.projectId)
            .select('name resources collections jwtSecret isAuthEnabled')
            .lean();

        if (!project || !project.isAuthEnabled) {
            await revokeSessionChain(session.tokenId);
            clearRefreshCookie(res);
            return res.status(401).json({ error: 'Project auth is unavailable' });
        }

        const { Model } = await getUsersModel(project);
        if (!Model) {
            await revokeSessionChain(session.tokenId);
            clearRefreshCookie(res);
            return res.status(404).json({ error: 'Auth collection not found' });
        }

        const user = await Model.findOne(
            { _id: new mongoose.Types.ObjectId(session.userId) },
            { _id: 1 }
        ).lean();
        if (!user) {
            await revokeSessionChain(session.tokenId);
            clearRefreshCookie(res);
            return res.status(401).json({ error: 'User not found for refresh token' });
        }

        const newTokens = await issueAuthTokens({
            project,
            userId: user._id,
            req,
            res,
            rotatedFrom: session.tokenId
        });

        session.rotatedTo = newTokens.tokenId;
        session.lastUsedAt = new Date().toISOString();
        await persistRefreshSession(session);

        const usedHeaderToken = !!req.header('x-refresh-token');
        return res.status(200).json({
            token: newTokens.accessToken,
            accessToken: newTokens.accessToken,
            expiresIn: newTokens.expiresIn,
            ...(usedHeaderToken ? { refreshToken: newTokens.refreshToken } : {})
        });
    } catch (err) {
        clearRefreshCookie(res);
        return res.status(500).json({ error: err.message });
    }
};

module.exports.logout = async (req, res) => {
    try {
        const rawRefreshToken = readRefreshTokenFromRequest(req);
        if (rawRefreshToken) {
            const parsedToken = parseRefreshToken(rawRefreshToken);
            if (parsedToken) {
                const session = await getRefreshSession(parsedToken.tokenId);
                if (session && hashRefreshToken(rawRefreshToken) === session.tokenHash) {
                    if (String(req.project._id) !== String(session.projectId)) {
                        return res.status(403).json({ error: 'Refresh token does not belong to this project' });
                    }
                    session.revokedAt = new Date().toISOString();
                    session.isUsed = true;
                    session.lastUsedAt = new Date().toISOString();
                    await persistRefreshSession(session);
                }
            }
        }

        clearRefreshCookie(res);
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        clearRefreshCookie(res);
        return res.status(500).json({ error: err.message });
    }
};

// FUNCTION - GET USER DETAILS (ADMIN)
module.exports.getUserDetails = async (req, res) => {
    try {
        const project = req.project;
        const { userId } = req.params;

        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const user = await Model.findOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { password: 0 }
        ).lean();
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT REQ FOR UPDATE ADMIN USER
module.exports.updateAdminUser = async (req, res) => {
    try {
        const project = req.project;
        const { userId } = req.params;
        const updateData = req.body;

        delete updateData.password;
        delete updateData._id;

        const sanitizedUpdateData = sanitize(updateData);

        // Get Mongoose Model
        const usersColConfig = project.collections.find(c => c.name === 'users');
        if (!usersColConfig) return res.status(404).json({ error: "Auth collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, usersColConfig, project._id, project.resources.db.isExternal);

        const result = await Model.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $set: sanitizedUpdateData },
            { runValidators: true }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
