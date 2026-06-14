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
    verifyOtpSchema,
    AppError,
    ApiResponse
} = require("@urbackend/common");
const { emitEvent } = require('../utils/emitEvent');

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
        sameSite: 'lax'
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
        sameSite: 'lax',
        expires: new Date(Date.now() + 10 * 1000),
    });
};

const OAUTH_FETCH_TIMEOUT_MS = 10000;

const fetchJson = async (url, options, defaultMessage) => {
    // Prevent OAuth requests from hanging forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OAUTH_FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...(options || {}),
            signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            const message =
                payload?.error_description ||
                payload?.error ||
                payload?.message ||
                defaultMessage;
            throw new AppError(response.status || 502, message);
        }

        return payload;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new AppError(504, 'OAuth request timed out.');
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
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
        throw new AppError(422, 'GitHub account must have a verified email address.');
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
    // Activation funnel — GitHub signup counts as both signup + verified
    emitEvent(developer._id, 'signup_completed', { method: 'github' });
    emitEvent(developer._id, 'email_verified', { method: 'github' });
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

    return new ApiResponse({
        user: {
            _id: user._id,
            email: user.email,
            isVerified: user.isVerified,
            maxProjects: user.maxProjects,
            isAdmin: user.email === process.env.ADMIN_EMAIL
        }
    }).send(res, statusCode);
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
    if (!otpDoc) throw new AppError(400, "No OTP found. Please request a new one.");

    if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
        await otpDoc.deleteOne();
        throw new AppError(429, "Too many incorrect attempts. Please request a new OTP.");
    }

    const isMatch = await bcrypt.compare(passedOtp.toString(), otpDoc.otp);
    if (!isMatch) {
        otpDoc.attempts += 1;
        await otpDoc.save();
        const remaining = OTP_MAX_ATTEMPTS - otpDoc.attempts;
        throw new AppError(400, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
    }

    return otpDoc;
}

async function checkOtpCooldown(userId) {
    const existingOtp = await Otp.findOne({ userId });
    if (existingOtp) {
        const secondsSinceCreated = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
        if (secondsSinceCreated < 60) {
            const waitTime = Math.ceil(60 - secondsSinceCreated);
            throw new AppError(429, `Please wait ${waitTime} seconds before requesting a new OTP.`);
        }
    }
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const existingUser = await Developer.findOne({ email });
        if (existingUser) return next(new AppError(400, "Email already exists"));

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDev = new Developer({ email: email.toLowerCase().trim(), password: hashedPassword });
        await newDev.save();

        // Activation funnel — signup completed
        emitEvent(newDev._id, 'signup_completed', { method: 'email' });

        return new ApiResponse({}, "Registered successfully").send(res, 201);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError(400, err.issues?.[0]?.message || 'Validation failed'));
        next(err);
    }
}


module.exports.login = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const dev = await Developer.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!dev) return next(new AppError(400, "Invalid email or password"));

        const validPass = await bcrypt.compare(password, dev.password);
        if (!validPass) return next(new AppError(400, "Invalid email or password"));

        await sendTokenResponse(dev, 200, res);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new AppError(400, err.issues[0]?.message || 'Validation Failed'));
        }
        next(err);
    }
}

module.exports.startGithubAuth = async (req, res, next) => {
    if (!process.env.DASHBOARD_GITHUB_CLIENT_ID || !process.env.DASHBOARD_GITHUB_CLIENT_SECRET) {
        return next(new AppError(503, 'GitHub login is not configured.'));
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
        sameSite: 'lax',
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


module.exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        const dev = await Developer.findById(req.user._id).select('+password');
        if (!dev) return next(new AppError(404, "User not found"));

        const validPass = await bcrypt.compare(currentPassword, dev.password);
        if (!validPass) return next(new AppError(400, "Incorrect current password"));

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        dev.password = hashedPassword;
        await dev.save();

        return new ApiResponse({}, "Password updated successfully").send(res);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError(400, err.issues?.[0]?.message || 'Validation failed'));
        next(err);
    }
}


module.exports.deleteAccount = async (req, res, next) => {
    try {
        const { password } = deleteAccountSchema.parse(req.body);

        const dev = await Developer.findById(req.user._id).select('+password');
        if (!dev) return next(new AppError(404, "User not found"));

        const validPass = await bcrypt.compare(password, dev.password);
        if (!validPass) return next(new AppError(400, "Incorrect password. Cannot delete account."));

        await Project.deleteMany({ owner: req.user._id });
        await Developer.findByIdAndDelete(req.user._id);

        return new ApiResponse({}, "Account and all projects deleted.").send(res);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError(400, err.issues?.[0]?.message || 'Validation failed'));
        next(err);
    }
}


module.exports.sendOtp = async (req, res, next) => {
    try {
        const { email } = onlyEmailSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await Developer.findOne({ email: normalizedEmail });
        if (!existingUser) {
            return next(new AppError(400, "User not found. Ensure you are using the correct email."));
        }


        if (existingUser.isVerified) {
            return next(new AppError(400, "Account is already verified. Please login."));
        }

        // Check 60s cooldown — checkOtpCooldown now throws AppError directly
        await checkOtpCooldown(existingUser._id);

        const otp = await createAndStoreOtp(existingUser._id);

        await sendOtp(email, otp); // Send raw OTP to user's email
        return new ApiResponse({}, "OTP sent successfully").send(res);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return next(new AppError(400, 'Invalid email format'));
        }
        next(err);
    }
}


module.exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = verifyOtpSchema.parse(req.body);

        const existingUser = await Developer.findOne({ email }).select('+password');
        if (!existingUser) return next(new AppError(400, "User not found"));

        const otpDoc = await validateOtp(existingUser._id, otp);

        await otpDoc.deleteOne();
        existingUser.isVerified = true;
        await existingUser.save();

        // Activation funnel — email verified
        emitEvent(existingUser._id, 'email_verified', { method: 'otp' });

        await sendTokenResponse(existingUser, 200, res);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError(400, err.issues?.[0]?.message || 'Validation failed'));
        next(err);
    }
}


// FORGOT PASSWORD
module.exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = onlyEmailSchema.parse(req.body);

        const dev = await Developer.findOne({ email });
        if (!dev) return new ApiResponse({}, "If this email is registered, an OTP has been sent.").send(res, 200);

        const otp = await createAndStoreOtp(dev._id);

        await sendOtp(email, otp, { subject: "Password Reset OTP \u2014 urBackend" });
        return new ApiResponse({}, "If this email is registered, an OTP has been sent.").send(res, 200);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError(400, err.issues?.[0]?.message || 'Validation failed'));
        next(err);
    }
}


// RESET PASSWORD
module.exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

        const dev = await Developer.findOne({ email }).select('+password');
        if (!dev) return next(new AppError(400, "User not found"));

        const otpDoc = await validateOtp(dev._id, otp);

        await otpDoc.deleteOne();
        const salt = await bcrypt.genSalt(10);
        dev.password = await bcrypt.hash(newPassword, salt);
        // Invalidate existing dashboard refresh sessions after a successful reset.
        dev.refreshToken = null;
        await dev.save();

        res.cookie('accessToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.cookie('refreshToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return new ApiResponse({}, "Password reset successfully. Please log in with your new password.").send(res, 200);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError(400, err.issues?.[0]?.message || 'Validation failed'));
        next(err);
    }
}

// LOGOUT
module.exports.logout = async (req, res, next) => {
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
            sameSite: 'lax'
        });
        res.cookie('refreshToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return new ApiResponse({}, "Logged out successfully").send(res, 200);
    } catch (err) {
        next(err);
    }
};

// REFRESH TOKEN
module.exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return next(new AppError(401, "No refresh token provided"));
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await Developer.findById(decoded._id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return next(new AppError(403, "Invalid refresh token"));
        }

        await sendTokenResponse(user, 200, res);
    } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return next(new AppError(403, "Invalid or expired refresh token"));
        }
        next(err);
    }
};

// GET ME
module.exports.getMe = async (req, res, next) => {
    try {
        const user = await Developer.findById(req.user._id).select("-password -refreshToken");
        if (!user) return next(new AppError(404, "User not found"));
        const userData = typeof user.toObject === 'function' ? user.toObject() : { ...user };
        userData.isAdmin = userData.email === process.env.ADMIN_EMAIL;
        return new ApiResponse({ user: userData }).send(res);
    } catch (err) {
        next(err);
    }
};
