const { Developer } = require("@urbackend/common");
const { Otp } = require("@urbackend/common");
const { Project } = require("@urbackend/common");
const bcrypt = require("bcryptjs");
const z = require("zod");
const jwt = require("jsonwebtoken");
const { sendOtp } = require("@urbackend/common");
const crypto = require("crypto");
const {
    loginSchema,
    changePasswordSchema,
    deleteAccountSchema,
    onlyEmailSchema,
    resetPasswordSchema,
    verifyOtpSchema
} = require("@urbackend/common");

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const OTP_MAX_ATTEMPTS = 5;
const GITHUB_STATE_COOKIE = 'dashboardGithubOauthState';
const GITHUB_STATE_TTL_MS = 10 * 60 * 1000;

const normalizeOrigin = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        return parsed.origin;
    } catch (_err) {
        return null;
    }
};

const getCookieOptions = () => {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    return cookieOptions;
};

const getDashboardFrontendUrl = () => {
    return (
        normalizeOrigin(process.env.FRONTEND_URL) ||
        'http://localhost:5173'
    ).replace(/\/+$/, '');
};

const buildDashboardApiBaseUrl = (req) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol;
    return `${protocol}://${req.get('host')}`;
};

const getGithubCallbackUrl = (req) => `${buildDashboardApiBaseUrl(req)}/api/auth/github/callback`;

const buildGithubRedirectUrl = (path, params = {}) => {
    const url = new URL(`${getDashboardFrontendUrl()}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
};

const clearGithubStateCookie = (res) => {
    res.cookie(GITHUB_STATE_COOKIE, 'none', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + 10 * 1000),
    });
};

const fetchJson = async (url, options, defaultMessage) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            payload?.error_description ||
            payload?.error ||
            payload?.message ||
            defaultMessage;
        throw new Error(message);
    }

    return payload;
};

const exchangeGithubCodeForToken = async ({ code, req }) => {
    return fetchJson(
        'https://github.com/login/oauth/access_token',
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.DASHBOARD_GITHUB_CLIENT_ID,
                client_secret: process.env.DASHBOARD_GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: getGithubCallbackUrl(req),
            }),
        },
        'Failed to complete GitHub authentication.'
    );
};

const fetchGithubProfile = async (accessToken) => {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'urBackend-dashboard-auth',
    };

    const [profile, emails] = await Promise.all([
        fetchJson('https://api.github.com/user', { headers }, 'Failed to load GitHub profile.'),
        fetchJson('https://api.github.com/user/emails', { headers }, 'Failed to load GitHub email.'),
    ]);

    const primaryEmail = Array.isArray(emails)
        ? emails.find((entry) => entry.primary && entry.verified) ||
          emails.find((entry) => entry.verified)
        : null;

    if (!primaryEmail?.email || !primaryEmail.verified) {
        throw new Error('GitHub account must have a verified email address.');
    }

    return {
        githubId: String(profile.id || ''),
        email: String(primaryEmail.email).toLowerCase().trim(),
        githubUsername: profile.login || null,
        avatarUrl: profile.avatar_url || null,
    };
};

const findOrCreateGithubDeveloper = async (profile) => {
    let developer = await Developer.findOne({ githubId: profile.githubId }).select('+password +refreshToken');
    if (developer) {
        return developer;
    }

    developer = await Developer.findOne({ email: profile.email }).select('+password +refreshToken');
    if (developer) {
        developer.githubId = profile.githubId;
        developer.githubUsername = profile.githubUsername;
        developer.avatarUrl = profile.avatarUrl;
        developer.isVerified = true;
        await developer.save();
        return developer;
    }

    const generatedPassword = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    developer = new Developer({
        email: profile.email,
        password: hashedPassword,
        isVerified: true,
        githubId: profile.githubId,
        githubUsername: profile.githubUsername,
        avatarUrl: profile.avatarUrl,
    });

    await developer.save();
    return developer;
};

const issueDashboardSession = async (user, res) => {
    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    const accessToken = jwt.sign(
        { _id: user._id, isVerified: user.isVerified, maxProjects: user.maxProjects, isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { _id: user._id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    user.refreshToken = refreshToken;
    await user.save();

    const cookieOptions = getCookieOptions();

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        expires: new Date(Date.now() + 15 * 60 * 1000)
    });
    res.cookie('refreshToken', refreshToken, cookieOptions);
};

const sendTokenResponse = async (user, statusCode, res) => {
    await issueDashboardSession(user, res);

    return res.status(statusCode).json({
        success: true,
        user: {
            _id: user._id,
            email: user.email,
            isVerified: user.isVerified,
            maxProjects: user.maxProjects,
            isAdmin: user.email === process.env.ADMIN_EMAIL
        }
    });
};

async function createAndStoreOtp(userId) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    
    await Otp.deleteOne({ userId });

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    await new Otp({ userId, otp: hashedOtp }).save();
    return otp;
}

async function validateOtp(userId, passedOtp) {
    const otpDoc = await Otp.findOne({ userId });
    if (!otpDoc) throw { status: 400, message: "No OTP found. Please request a new one." };

    if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
        await otpDoc.deleteOne();
        throw { status: 429, message: "Too many incorrect attempts. Please request a new OTP." };
    }

    const isMatch = await bcrypt.compare(passedOtp.toString(), otpDoc.otp);
    if (!isMatch) {
        otpDoc.attempts += 1;
        await otpDoc.save();
        const remaining = OTP_MAX_ATTEMPTS - otpDoc.attempts;
        throw { status: 400, message: `Incorrect OTP. ${remaining} attempt(s) remaining.` };
    }

    return otpDoc;
}

async function checkOtpCooldown(userId) {
    const existingOtp = await Otp.findOne({ userId });
    if (existingOtp) {
        const secondsSinceCreated = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
        if (secondsSinceCreated < 60) {
            const waitTime = Math.ceil(60 - secondsSinceCreated);
            throw { status: 429, message: `Please wait ${waitTime} seconds before requesting a new OTP.` };
        }
    }
}

module.exports.register = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const existingUser = await Developer.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDev = new Developer({ email: email.toLowerCase().trim(), password: hashedPassword });
        await newDev.save();

        res.status(201).json({ message: "Registered successfully" });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


module.exports.login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const dev = await Developer.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!dev) return res.status(400).json({ error: "User not found" });

        const validPass = await bcrypt.compare(password, dev.password);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });

        await sendTokenResponse(dev, 200, res);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation Failed",
                details: err.issues
            });
        }
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports.startGithubAuth = async (req, res) => {
    if (!process.env.DASHBOARD_GITHUB_CLIENT_ID || !process.env.DASHBOARD_GITHUB_CLIENT_SECRET) {
        return res.status(503).json({ error: 'GitHub login is not configured.' });
    }

    const state = crypto.randomBytes(24).toString('hex');
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.DASHBOARD_GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', getGithubCallbackUrl(req));
    authUrl.searchParams.set('scope', 'read:user user:email');
    authUrl.searchParams.set('state', state);

    res.cookie(GITHUB_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + GITHUB_STATE_TTL_MS),
    });

    return res.redirect(authUrl.toString());
};

module.exports.handleGithubCallback = async (req, res) => {
    const githubError = String(req.query.error || '').trim();
    const githubErrorDescription = String(req.query.error_description || '').trim();

    if (githubError) {
        clearGithubStateCookie(res);
        return res.redirect(
            buildGithubRedirectUrl('/login', {
                error: githubErrorDescription || githubError || 'GitHub authentication failed.',
            })
        );
    }

    const { code, state } = req.query;
    const storedState = req.cookies?.[GITHUB_STATE_COOKIE];

    if (!code || !state || !storedState || state !== storedState) {
        clearGithubStateCookie(res);
        return res.redirect(
            buildGithubRedirectUrl('/login', {
                error: 'GitHub authentication state is invalid or expired.',
            })
        );
    }

    try {
        const tokenResponse = await exchangeGithubCodeForToken({ code: String(code), req });
        const profile = await fetchGithubProfile(tokenResponse.access_token);
        const developer = await findOrCreateGithubDeveloper(profile);

        clearGithubStateCookie(res);
        await issueDashboardSession(developer, res);
        return res.redirect(buildGithubRedirectUrl('/dashboard'));
    } catch (err) {
        clearGithubStateCookie(res);
        console.error('GitHub dashboard auth failed:', err);
        return res.redirect(
            buildGithubRedirectUrl('/login', {
                error: err.message || 'GitHub authentication failed.',
            })
        );
    }
};


module.exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        const dev = await Developer.findById(req.user._id).select('+password');

        const validPass = await bcrypt.compare(currentPassword, dev.password);
        if (!validPass) return res.status(400).json({ error: "Incorrect current password" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        dev.password = hashedPassword;
        await dev.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


module.exports.deleteAccount = async (req, res) => {
    try {
        const { password } = deleteAccountSchema.parse(req.body);

        const dev = await Developer.findById(req.user._id).select('+password');

        const validPass = await bcrypt.compare(password, dev.password);
        if (!validPass) return res.status(400).json({ error: "Incorrect password. Cannot delete account." });

        await Project.deleteMany({ owner: req.user._id });
        await Developer.findByIdAndDelete(req.user._id);

        res.json({ message: "Account and all projects deleted." });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


module.exports.sendOtp = async (req, res) => {
    try {
        const { email } = onlyEmailSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await Developer.findOne({ email: normalizedEmail });
        if (!existingUser) {
            return res.status(400).json({ error: "User not found. Ensure you are using the correct email." });
        }


        if (existingUser.isVerified) {
            return res.status(400).json({ error: "Account is already verified. Please login." });
        }

        // Check 60s cooldown
        try {
            await checkOtpCooldown(existingUser._id);
        } catch (cooldownErr) {
            return res.status(cooldownErr.status || 429).json({ error: cooldownErr.message });
        }

        const otp = await createAndStoreOtp(existingUser._id);

        await sendOtp(email, otp); // Send raw OTP to user's email
        res.json({ message: "OTP sent successfully" });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Invalid email format",
                details: err.errors 
            });
        }
        
        console.error("🔥 Dashboard OTP Send Error:", {
            email: req.body?.email,
            error: err.message,
            stack: err.stack
        });

        res.status(500).json({ error: "Failed to send OTP. Please try again later." });
    }
}


module.exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = verifyOtpSchema.parse(req.body);

        const existingUser = await Developer.findOne({ email }).select('+password');
        if (!existingUser) return res.status(400).json({ error: "User not found" });

        const otpDoc = await validateOtp(existingUser._id, otp);

        await otpDoc.deleteOne();
        existingUser.isVerified = true;
        await existingUser.save();

        await sendTokenResponse(existingUser, 200, res);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// FORGOT PASSWORD
module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = onlyEmailSchema.parse(req.body);

        const dev = await Developer.findOne({ email });
        if (!dev) return res.status(200).json({ message: "If this email is registered, an OTP has been sent." });

        const otp = await createAndStoreOtp(dev._id);

        await sendOtp(email, otp, { subject: "Password Reset OTP \u2014 urBackend" });
        res.status(200).json({ message: "If this email is registered, an OTP has been sent." });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// RESET PASSWORD
module.exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

        const dev = await Developer.findOne({ email }).select('+password');
        if (!dev) return res.status(400).json({ error: "User not found" });

        const otpDoc = await validateOtp(dev._id, otp);

        await otpDoc.deleteOne();
        const salt = await bcrypt.genSalt(10);
        dev.password = await bcrypt.hash(newPassword, salt);
        // Invalidate existing dashboard refresh sessions after a successful reset.
        dev.refreshToken = null;
        await dev.save();

        res
            .status(200)
            .cookie('accessToken', 'none', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            })
            .cookie('refreshToken', 'none', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            })
            .json({ message: "Password reset successfully. Please log in with your new password." });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// LOGOUT
module.exports.logout = async (req, res) => {
    try {
        if (req.user) {
            const user = await Developer.findById(req.user._id);
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        res.cookie('accessToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.cookie('refreshToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// REFRESH TOKEN
module.exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await Developer.findById(decoded._id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        await sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};

// GET ME
module.exports.getMe = async (req, res) => {
    try {
        const user = await Developer.findById(req.user._id).select("-password -refreshToken");
        if (!user) return res.status(404).json({ error: "User not found" });
        const userData = typeof user.toObject === 'function' ? user.toObject() : { ...user };
        userData.isAdmin = userData.email === process.env.ADMIN_EMAIL;
        res.json({ success: true, user: userData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
