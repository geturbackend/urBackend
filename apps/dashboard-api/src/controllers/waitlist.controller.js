const { Waitlist, sendWaitlistConfirmationEmail, Developer } = require('@urbackend/common');
const z = require('zod');

const emailSchema = z.object({
    email: z.string().email("Invalid email format")
});

exports.addToWaitlist = async (req, res) => {
    try {
        const { email } = emailSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase().trim();

        const existing = await Waitlist.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: "You're already on the list!" });
        }

        const waitlistEntry = new Waitlist({ email: normalizedEmail });
        await waitlistEntry.save();

        // Send email asynchronously without blocking the response
        sendWaitlistConfirmationEmail(normalizedEmail).catch(err => {
            console.log("\n❌ ================= WAITLIST EMAIL ERROR =================");
            console.error(err.message || err);
            console.log("Hint: Check your RESEND_API_KEY in apps/dashboard-api/.env");
            console.log("If using a free tier, you can ONLY send emails to your verified Resend email address!");
            console.log("=========================================================\n");
        });

        res.status(201).json({ success: true, message: "Added to waitlist successfully." });
    } catch (err) {
        if (err instanceof z.ZodError) {
            const msg = err.errors && err.errors.length > 0 ? err.errors[0].message : "Invalid input";
            return res.status(400).json({ success: false, message: msg });
        }
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

exports.getWaitlistCount = async (req, res) => {
    try {
        const count = await Waitlist.countDocuments();
        res.status(200).json({ success: true, data: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

exports.getWaitlist = async (req, res) => {
    try {
        const user = await Developer.findById(req.user._id);
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const waitlist = await Waitlist.find().sort({ createdAt: -1 });
        const count = await Waitlist.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                count,
                waitlist
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};
