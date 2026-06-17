const mongoose = require('mongoose');

const UNVERIFIED_PROJECT_LIMIT = 1;
const UNVERIFIED_COLLECTION_LIMIT = 3;

const isAdminRequest = (req) => {
    return req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
};

exports.attachDeveloper = async function(req, res, next) {
    const { Developer, AppError, Project, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (!req.user || !req.user._id) {
            return next(new AppError(401, 'Unauthorized: Developer context missing'));
        }

        let targetDeveloperId = req.user._id;

        const rawProjectId = req.params.projectId || req.body.projectId || req.query.projectId;
        const cleanProjectId = sanitizeObjectId(rawProjectId);
        if (cleanProjectId) {
            const project = await Project.findById(cleanProjectId).select('owner').lean();
            if (project && project.owner) {
                targetDeveloperId = project.owner;
            }
        }

        const developer = await Developer.findById(targetDeveloperId);
        if (!developer) return next(new AppError(404, 'Developer not found'));
        req.developer = developer;
        next();
    } catch (err) {
        next(err);
    }
}

exports.checkProjectLimit = async function(req, res, next) {
    const { resolveEffectivePlan, getPlanLimits } = require('@urbackend/common');
    try {
        if (isAdminRequest(req)) return next();
        if (!req.developer?.isVerified) return next();

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan });
        if (limits.maxProjects === -1) return next();
        req.projectLimit = limits.maxProjects;
        next();
    } catch (err) {
        next(err);
    }
}

exports.checkDeveloperCapability = function(capability) {
    return async function(req, res, next) {
        const { Project, AppError, sanitizeObjectId } = require('@urbackend/common');
        try {
            if (isAdminRequest(req)) {
                return next();
            }

            const isVerified = !!(req.developer?.isVerified ?? req.user?.isVerified);

            if (isVerified) {
                return next();
            }

            if (capability === 'createProject') {
                const currentCount = await Project.countDocuments({ owner: req.user._id });
                if (currentCount >= UNVERIFIED_PROJECT_LIMIT) {
                    return next(new AppError(403, 'Verify your email to create additional projects.'));
                }
                req.projectLimit = Math.min(req.projectLimit ?? UNVERIFIED_PROJECT_LIMIT, UNVERIFIED_PROJECT_LIMIT);
                return next();
            }

            if (capability === 'createCollection') {
                const cleanProjectId = sanitizeObjectId(req.body.projectId || req.params.projectId);
                if (!cleanProjectId) return next(new AppError(400, 'Invalid or missing projectId'));

                const project = await Project.findOne({ _id: cleanProjectId, owner: req.user._id })
                    .select('collections')
                    .lean();
                if (!project) return next(new AppError(404, 'Project not found'));

                if ((project.collections || []).length >= UNVERIFIED_COLLECTION_LIMIT) {
                    return next(new AppError(403, 'Verify your email to create more than 3 collections.'));
                }

                req.collectionLimit = Math.min(req.collectionLimit ?? UNVERIFIED_COLLECTION_LIMIT, UNVERIFIED_COLLECTION_LIMIT);
                return next();
            }

            return next(new AppError(403, 'Email verification is required for this action.'));
        } catch (err) {
            next(err);
        }
    };
}

exports.checkCollectionLimit = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId, getProjectAccessQuery } = require('@urbackend/common');
    try {
        if (isAdminRequest(req)) return next();
        if (!req.developer?.isVerified) return next();
        
        const cleanProjectId = sanitizeObjectId(req.body.projectId);
        if (!cleanProjectId) return next(new AppError(400, 'Invalid or missing projectId'));

        const project = await Project.findOne({
            _id: cleanProjectId,
            ...getProjectAccessQuery(req.developer._id),
        });
        if (!project) return next(new AppError(404, 'Project not found'));

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits: project.customLimits });
        if (limits.maxCollections === -1) return next();
        req.collectionLimit = limits.maxCollections;
        next();
    } catch (err) {
        next(err);
    }
}

exports.checkByodGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (isAdminRequest(req)) return next();
        const { dbUri, storageUrl, storageKey } = req.body;
        if (!dbUri && !storageUrl && !storageKey) return next();

        const rawProjectId = req.params.projectId || req.body.projectId || req.query.projectId;
        const cleanProjectId = sanitizeObjectId(rawProjectId);
        
        let customLimits = null;
        if (cleanProjectId) {
            const project = await Project.findById(cleanProjectId).select('customLimits').lean();
            if (project) customLimits = project.customLimits;
        }

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits });

        if (dbUri && !limits.byomEnabled) return next(new AppError(403, 'External Database (BYOM) is a Pro feature.'));
        if ((storageUrl || storageKey) && !limits.byosEnabled) return next(new AppError(403, 'External Storage (BYOS) is a Pro feature.'));
        next();
    } catch (err) {
        next(err);
    }
}

exports.checkByokGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (isAdminRequest(req)) return next();
        const { resendApiKey, github, google } = req.body;
        if (!resendApiKey && !github?.clientSecret && !google?.clientSecret) return next();

        const rawProjectId = req.params.projectId || req.body.projectId || req.query.projectId;
        const cleanProjectId = sanitizeObjectId(rawProjectId);

        let customLimits = null;
        if (cleanProjectId) {
            const project = await Project.findById(cleanProjectId).select('customLimits').lean();
            if (project) customLimits = project.customLimits;
        }

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits });

        if (!limits.byokEnabled) return next(new AppError(403, 'Bring Your Own Key (BYOK) is a Pro feature. Please upgrade to continue.'));
        next();
    } catch (err) {
        next(err);
    }
}

exports.checkWebhookGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (isAdminRequest(req)) return next();

        const isVerified = !!(req.developer?.isVerified ?? req.user?.isVerified);
        if (!isVerified) {
            return next(new AppError(403, 'Verify your email to create or test webhooks.'));
        }

        const rawProjectId = req.params.projectId || req.body.projectId || req.query.projectId;
        const cleanProjectId = sanitizeObjectId(rawProjectId);

        let customLimits = null;
        if (cleanProjectId) {
            const project = await Project.findById(cleanProjectId).select('customLimits').lean();
            if (project) customLimits = project.customLimits;
        }

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits });

        if (limits.webhooksLimit === 0) {
            return next(new AppError(403, 'Webhooks are a Pro feature. Please upgrade to create integrations.'));
        }

        next();
    } catch (err) {
        next(err);
    }
}

exports.checkMailTemplatesGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (isAdminRequest(req)) return next();

        const rawProjectId = req.params.projectId || req.body.projectId || req.query.projectId;
        const cleanProjectId = sanitizeObjectId(rawProjectId);

        let customLimits = null;
        if (cleanProjectId) {
            const project = await Project.findById(cleanProjectId).select('customLimits').lean();
            if (project) customLimits = project.customLimits;
        }

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits });

        if (!limits.mailTemplatesEnabled) {
            return next(new AppError(403, 'Custom Mail Templates are a Pro feature. Please upgrade to customize your emails.'));
        }

        next();
    } catch (err) {
        next(err);
    }
}

console.log('DEBUG: planEnforcement.js exporting checkMemberLimit');
exports.checkMemberLimit = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId, getProjectAccessQuery } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();

        const rawProjectId = req.params.projectId;
        const cleanProjectId = sanitizeObjectId(rawProjectId);
        if (!cleanProjectId) return next(new AppError(400, 'Invalid or missing projectId'));

        const project = await Project.findOne({
            _id: cleanProjectId,
            ...getProjectAccessQuery(req.user._id),
        }).select('members customLimits owner').lean();
        if (!project) return next(new AppError(404, 'Project not found'));

        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits: project.customLimits });

        // maxMembers includes the owner; current count = 1 (owner) + members.length
        const currentTotal = 1 + (project.members?.length || 0);
        if (limits.maxMembers !== -1 && currentTotal >= limits.maxMembers) {
            return next(new AppError(
                403,
                `Member limit reached (${limits.maxMembers} total). Please upgrade your plan to add more team members.`
            ));
        }

        next();
    } catch (err) {
        next(err);
    }
}
