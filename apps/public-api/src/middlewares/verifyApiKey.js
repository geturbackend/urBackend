const {Project} = require('@urbackend/common');
const { hashApiKey } = require('@urbackend/common');
const {
    setProjectByApiKeyCache,
    getProjectByApiKeyCache
} = require("@urbackend/common");

module.exports = async (req, res, next) => {
    try {
        // x-api-key header is preferred. For browser-navigation endpoints (e.g. social OAuth start),
        // a publishable key may be supplied via the `key` query parameter instead.
        const headerKey = req.header('x-api-key');
        const queryKey = typeof req.query?.key === 'string' ? req.query.key : undefined;

        // Only allow publishable keys (pk_live_) via query param; secret keys must use the header.
        const apiKey = headerKey || (queryKey?.startsWith('pk_live_') ? queryKey : undefined);

        // Strip the key from req.query immediately after reading so it is not forwarded to
        // downstream middleware, controllers, or access logs.
        if (req.query && typeof req.query === 'object') {
            delete req.query.key;
        }

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
                    name
                    owner
                    resources
                    collections
                    databaseLimit
                    databaseUsed
                    storageLimit
                    storageUsed
                    jwtSecret
                    allowedDomains
                    isAuthEnabled
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
                    const parsedOrigin = new URL(origin);
                    const originUrl = parsedOrigin.origin; 
                    const originHostname = parsedOrigin.hostname;

                    const isAllowed = allowedDomains.some(domain => {
                        let cleanDomain = domain.trim();
                        if (cleanDomain.endsWith('/')) {
                            cleanDomain = cleanDomain.slice(0, -1);
                        }

                        if (cleanDomain.startsWith('*.')) {
                            const baseDomain = cleanDomain.substring(2);
                            return originHostname === baseDomain || originHostname.endsWith('.' + baseDomain);
                        }

                        return originUrl === cleanDomain || originHostname === cleanDomain;
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
