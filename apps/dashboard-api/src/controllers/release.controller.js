const {Release} = require("@urbackend/common");
const {Developer} = require("@urbackend/common");
const { emailQueue } = require("@urbackend/common");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const getValidHttpUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const candidate = raw.trim();
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch (_) {
        return null;
    }
    return null;
};

const extractReleaseLinkFromContent = (content) => {
    if (!content || typeof content !== 'string') return null;

    // Find all markdown links safely, avoiding ReDoS (Polynomial regular expression)
    const mdLinkRegex = /\[([^\[\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
    const mdLinks = [...content.matchAll(mdLinkRegex)];

    // 1) Prefer markdown links whose label mentions changelog.
    for (const match of mdLinks) {
        if (match[1].toLowerCase().includes('changelog')) {
            const valid = getValidHttpUrl(match[2]);
            if (valid) return valid;
        }
    }

    // 2) Prefer explicit line style: Full changelog: https://...
    const explicitLine = content.match(/full\s*changelog\s*:\s*(https?:\/\/[^\s<)]+)/i);
    if (explicitLine?.[1]) {
        const valid = getValidHttpUrl(explicitLine[1]);
        if (valid) return valid;
    }

    // 3) Any markdown link.
    for (const match of mdLinks) {
        const valid = getValidHttpUrl(match[2]);
        if (valid) return valid;
    }

    // 4) Any raw URL.
    const anyRawUrl = content.match(/https?:\/\/[^\s<)]+/i);
    if (anyRawUrl?.[0]) {
        const valid = getValidHttpUrl(anyRawUrl[0]);
        if (valid) return valid;
    }

    return null;
};

// GET FOR - ALL RELEASES
exports.getAllReleases = async (req, res) => {
    try {
        const releases = await Release.find().sort({ createdAt: -1 });
        res.json(releases);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// POST FOR - CREATE RELEASE
exports.createRelease = async (req, res) => {
    try {
        const { version, title, content } = req.body;
        const changelogUrlFromContent = extractReleaseLinkFromContent(content);

        const dev = await Developer.findById(req.user._id);
        if (!dev || dev.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: "Access denied. Admin only." });
        }

        if (!version || !title || !content) {
            return res.status(400).json({ error: "Missing version, title, or content" });
        }

        const newRelease = new Release({ 
            version, 
            title, 
            content,
            publishedBy: dev.email
        });
        await newRelease.save();
        const developers = await Developer.find({ isVerified: true })
            .select("email")
            .lean();
        const emails = developers.map(({ email }) => email);
        await Promise.all(emails.map(email => 
            emailQueue.add('release-email', {
                email,
                version,
                title,
                content,
                changelogUrl: changelogUrlFromContent
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
