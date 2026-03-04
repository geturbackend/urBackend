const Project = require('../models/Project');
const { hashApiKey } = require('../utils/api');
const {
    setProjectByApiKeyCache,
    getProjectByApiKeyCache
} = require("../services/redisCaching");

module.exports = async (req, res, next) => {
    try {
        const apiKey = req.header('x-api-key');
        if (!apiKey) {
            return res.status(401).json({ error: 'API key not found' });
        }

        const isSecret = apiKey.startsWith('sk_live_');
        const keyField = isSecret ? 'secretKey' : 'publishableKey';
        const hashedApi = hashApiKey(apiKey);

        let project = await getProjectByApiKeyCache(hashedApi);

        if (!project) {
            project = await Project.findOne({ [keyField]: hashedApi })
                .select(`
                    owner
                    resources
                    collections
                    databaseLimit
                    databaseUsed
                    storageLimit
                    storageUsed
                    jwtSecret
                    allowedDomains
                `)
                .populate('owner', 'isVerified')
                .lean();

            if (!project) {
                return res.status(401).json({
                    error: "API key is expired or invalid.",
                    action: "Please use a valid API key or regenerate a new one from the dashboard."
                });
            }

            await setProjectByApiKeyCache(hashedApi, project);
        }

        if (!project.owner.isVerified) {
            return res.status(401).json({
                error: 'Owner not verified',
                fix: 'Verify your account on https://urbackend.bitbros.in/dashboard'
            });
        }

        if (!project.resources) project.resources = {};
        if (!project.resources.db) project.resources.db = { isExternal: false };
        if (!project.resources.storage) project.resources.storage = { isExternal: false };

        if (!isSecret) {
            let allowedDomains = project.allowedDomains || ['*'];
            const origin = req.headers.origin || req.headers.referer;

            if (!allowedDomains.includes('*')) {
                if (!origin) {
                    return res.status(403).json({ error: "Forbidden: Origin header missing and this key is restricted to specific domains." });
                }

                try {
                    const originUrl = new URL(origin).origin; 
                    const isAllowed = allowedDomains.some(domain => {
                        if (domain.startsWith('*.')) {
                            const baseDomain = domain.substring(2);
                            return originUrl === baseDomain || originUrl.endsWith('.' + baseDomain);
                        }
                        return originUrl === domain;
                    });

                    if (!isAllowed) {
                        return res.status(403).json({ error: `Forbidden: Origin ${originUrl} is not allowed by this project's CORS policy.` });
                    }
                } catch (err) {
                    return res.status(400).json({ error: "Invalid Origin header format." });
                }
            }
        }

        req.project = project;
        req.hashedApiKey = hashedApi;
        req.keyRole = isSecret ? 'secret' : 'publishable';
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
