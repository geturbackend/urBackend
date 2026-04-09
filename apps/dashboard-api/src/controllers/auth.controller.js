const {Developer} = require("@urbackend/common");
const {Otp} = require("@urbackend/common");
const {Project} = require("@urbackend/common")
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

const sendTokenResponse = async (user, statusCode, res) => {
    const accessToken = jwt.sign(
        { _id: user._id, isVerified: user.isVerified, maxProjects: user.maxProjects },
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

    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.status(statusCode)
        .cookie('accessToken', accessToken, { 
            ...cookieOptions, 
            expires: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
        })
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                maxProjects: user.maxProjects
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

        const dev = await Developer.findOne({ email: email.toLowerCase().trim() });
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


module.exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        const dev = await Developer.findById(req.user._id);

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

        const dev = await Developer.findById(req.user._id);

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

        const existingUser = await Developer.findOne({ email });
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

        const dev = await Developer.findOne({ email });
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
        const user = await Developer.findById(decoded._id);

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
        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
