const { Developer, Project, resolveEffectivePlan, getPlanLimits, AppError } = require('@urbackend/common');

/**
 * Middleware to load the full Developer document and attach it to req.developer.
 * req.user (from authMiddleware) contains the decoded JWT data.
 */
exports.attachDeveloper = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new AppError(401, 'Unauthorized: Developer context missing'));
        }

        const developer = await Developer.findById(req.user._id);
        if (!developer) {
            return next(new AppError(404, 'Developer not found'));
        }

        req.developer = developer;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Middleware to check if the developer has reached their project creation limit.
 * Admin bypass uses JWT isAdmin flag (set at login time by auth.controller.js)
 * instead of email string comparison — consistent with existing auth pattern.
 */
exports.checkProjectLimit = async (req, res, next) => {
    try {
        // isAdmin is embedded in the JWT at login time — no extra DB hit needed
        if (req.user?.isAdmin) return next();

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({
            plan: effectivePlan,
            legacyLimits: {
                maxProjects: req.developer.maxProjects ?? null,
                maxCollections: req.developer.maxCollections ?? null
            }
        });

        // -1 means unlimited
        if (limits.maxProjects === -1) return next();

        const currentProjectsCount = await Project.countDocuments({ owner: req.developer._id });
        
        if (currentProjectsCount >= limits.maxProjects) {
            return next(new AppError(403, `Project limit reached (${limits.maxProjects}). Please upgrade your plan to create more projects.`));
        }

        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Middleware to check collection limits within a project.
 * Admin bypass uses JWT isAdmin flag (set at login time by auth.controller.js).
 */
exports.checkCollectionLimit = async (req, res, next) => {
    try {
        // isAdmin is embedded in the JWT at login time — no extra DB hit needed
        if (req.user?.isAdmin) return next();

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({
            plan: effectivePlan,
            legacyLimits: {
                maxProjects: req.developer.maxProjects ?? null,
                maxCollections: req.developer.maxCollections ?? null
            }
        });

        if (limits.maxCollections === -1) return next();

        // For collection creation, the projectId is usually in req.body
        const projectId = req.body.projectId;
        if (!projectId) return next(new AppError(400, 'projectId is required'));

        // Prevent NoSQL Injection (CodeQL Alert: Database query built from user-controlled sources)
        if (typeof projectId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(projectId)) {
            return next(new AppError(400, 'Invalid projectId format'));
        }

        const project = await Project.findById(projectId);
        if (!project) return next(new AppError(404, 'Project not found'));

        if (project.collections.length >= limits.maxCollections) {
            return next(new AppError(403, `Collection limit reached (${limits.maxCollections}). Please upgrade your plan to create more collections.`));
        }

        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Middleware to block BYOK/BYOM features for Free tier users.
 */
exports.checkByokGate = async (req, res, next) => {
    try {
        // Admin always has access to all features
        if (req.user?.isAdmin) return next();

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan });

        if (!limits.byokEnabled) {
            return next(new AppError(403, 'External configuration (BYOK/BYOM) is a Pro feature. Please upgrade to connect your own resources.'));
        }

        next();
    } catch (err) {
        next(err);
    }
};
