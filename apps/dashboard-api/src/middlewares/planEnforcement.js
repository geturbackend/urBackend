console.log('DEBUG: planEnforcement.js loading...');
const mongoose = require('mongoose');

console.log('DEBUG: planEnforcement.js exporting attachDeveloper');
exports.attachDeveloper = async function(req, res, next) {
    const { Developer, AppError } = require('@urbackend/common');
    try {
        if (!req.user || !req.user._id) {
            return next(new AppError(401, 'Unauthorized: Developer context missing'));
        }
        const developer = await Developer.findById(req.user._id);
        if (!developer) return next(new AppError(404, 'Developer not found'));
        req.developer = developer;
        next();
    } catch (err) {
        next(err);
    }
}

console.log('DEBUG: planEnforcement.js exporting checkProjectLimit');
exports.checkProjectLimit = async function(req, res, next) {
    const { resolveEffectivePlan, getPlanLimits } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan });
        if (limits.maxProjects === -1) return next();
        req.projectLimit = limits.maxProjects;
        next();
    } catch (err) {
        next(err);
    }
}

console.log('DEBUG: planEnforcement.js exporting checkCollectionLimit');
exports.checkCollectionLimit = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
        
        const cleanProjectId = sanitizeObjectId(req.body.projectId);
        if (!cleanProjectId) return next(new AppError(400, 'Invalid or missing projectId'));

        const project = await Project.findOne({ _id: cleanProjectId, owner: req.developer._id });
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

console.log('DEBUG: planEnforcement.js exporting checkByodGate');
exports.checkByodGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
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

console.log('DEBUG: planEnforcement.js exporting checkByokGate');
exports.checkByokGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
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

console.log('DEBUG: planEnforcement.js exporting checkWebhookGate');
exports.checkWebhookGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();

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

console.log('DEBUG: planEnforcement.js exporting checkMailTemplatesGate');
exports.checkMailTemplatesGate = async function(req, res, next) {
    const { Project, resolveEffectivePlan, getPlanLimits, AppError, sanitizeObjectId } = require('@urbackend/common');
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();

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