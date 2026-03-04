const Release = require("../models/Release");
const Developer = require("../models/Developer");
const { emailQueue } = require("../queues/emailQueue");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// GET ALL RELEASES
exports.getAllReleases = async (req, res) => {
    try {
        const releases = await Release.find().sort({ createdAt: -1 });
        res.json(releases);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// CREATE RELEASE (Admin Only)
exports.createRelease = async (req, res) => {
    try {
        const { version, title, content } = req.body;

        // Verify Admin
        if (req.user.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "Access denied. Admin only." });
        }

        if (!version || !title || !content) {
            return res.status(400).json({ error: "Missing version, title, or content" });
        }

        const newRelease = new Release({ 
            version, 
            title, 
            content,
            publishedBy: req.user.email
        });
        await newRelease.save();

        // 1. Fetch all verified developers
        const developers = await Developer.find({ isVerified: true }, 'email');
        const emails = developers.map(dev => dev.email);

        // 2. Queue emails
        await Promise.all(emails.map(email => 
            emailQueue.add('release-email', {
                email,
                version,
                title,
                content
            })
        ));

        res.status(201).json({ 
            message: "Release published! Emails queued.", 
            count: emails.length 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
