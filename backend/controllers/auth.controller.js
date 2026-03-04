const Developer = require("../models/Developer");
const otpSchema = require("../models/otp");
const Project = require("../models/Project")
const bcrypt = require("bcryptjs");
const z = require("zod");
const jwt = require("jsonwebtoken");
const sendOtp = require("../utils/emailService");
const crypto = require("crypto");
const {
    loginSchema,
    changePasswordSchema,
    deleteAccountSchema,
    onlyEmailSchema,
    resetPasswordSchema,
    verifyOtpSchema
} = require("../utils/input.validation");

const JWT_EXPIRES_IN = '7d';
const OTP_MAX_ATTEMPTS = 5;

async function createAndStoreOtp(userId) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    
    // Delete any existing OTP for this user
    await otpSchema.deleteOne({ userId });

    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    await new otpSchema({ userId, otp: hashedOtp }).save();
    return otp;
}

// HELPER: Validate OTP with attempt tracking
async function validateOtp(userId, passedOtp) {
    const otpDoc = await otpSchema.findOne({ userId });
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

module.exports.register = async (req, res) => {
    try {
        // Validate with Zod
        const { email, password } = loginSchema.parse(req.body);

        const existingUser = await Developer.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDev = new Developer({ email, password: hashedPassword });
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

        const dev = await Developer.findOne({ email });
        if (!dev) return res.status(400).json({ error: "User not found" });

        const validPass = await bcrypt.compare(password, dev.password);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });

        // FIX 1: JWT now expires in 7 days
        const token = jwt.sign(
            { _id: dev._id, isVerified: dev.isVerified },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        res.json({ token });
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

        const existingUser = await Developer.findOne({ email });
        if (!existingUser) return res.status(400).json({ error: "User not found" });

        if (existingUser.isVerified) return res.status(400).json({ error: "User already verified" });

        const otp = await createAndStoreOtp(existingUser._id);

        await sendOtp(email, otp); // Send raw OTP to user's email
        res.json({ message: "OTP sent successfully" });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
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

        // FIX 1: JWT with expiry
        const token = jwt.sign(
            { _id: existingUser._id, isVerified: true },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({ message: "OTP verified successfully", token });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// FIX 5: Forgot Password — generate + send reset OTP
module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = onlyEmailSchema.parse(req.body);

        const dev = await Developer.findOne({ email });
        // Return same message regardless of whether email exists (prevents user enumeration)
        if (!dev) return res.status(200).json({ message: "If this email is registered, an OTP has been sent." });

        const otp = await createAndStoreOtp(dev._id);

        await sendOtp(email, otp, { subject: "Password Reset OTP — urBackend" });
        res.status(200).json({ message: "If this email is registered, an OTP has been sent." });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// FIX 5: Reset Password — verify OTP then set new password
module.exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

        const dev = await Developer.findOne({ email });
        if (!dev) return res.status(400).json({ error: "User not found" });

        const otpDoc = await validateOtp(dev._id, otp);

        // OTP matched — update password
        await otpDoc.deleteOne();
        const salt = await bcrypt.genSalt(10);
        dev.password = await bcrypt.hash(newPassword, salt);
        await dev.save();

        res.status(200).json({ message: "Password reset successfully. Please log in with your new password." });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}