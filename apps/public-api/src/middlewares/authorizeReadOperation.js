const { AppError } = require('@urbackend/common');
module.exports = async (req, res, next) => {
    try {
        if (req.keyRole === 'secret') {
            req.rlsFilter = {};
            return next();
        }

        const { collectionName } = req.params;
        const project = req.project;
        const collectionConfig = project.collections.find(c => c.name === collectionName);

        if (!collectionConfig) {
            return next(new AppError(404, 'Collection not found'));
        }

        const rls = collectionConfig.rls || {};
        if (!rls.enabled) {
            req.rlsFilter = {};
            return next();
        }

        const modeRaw = rls.mode || 'public-read';
        const mode = modeRaw === 'owner-write-only' ? 'public-read' : modeRaw;

        if (mode === 'private') {
            if (!req.authUser?.userId) {
                return next(new AppError(401, 'Provide a valid user Bearer token for private reads.', 'Authentication required'));
            }

            const ownerField = rls.ownerField || 'userId';
            req.rlsFilter = { [ownerField]: req.authUser.userId };
            return next();
        }

        if (mode === 'public-read') {
            req.rlsFilter = {};
            return next();
        }

        return next(new AppError(403, 'Unsupported RLS mode'));
    } catch (err) {
        console.error('[authorizeReadOperation] Unexpected error:', err);
        return next(new AppError(500, 'Internal Server Error'));
    }
};
