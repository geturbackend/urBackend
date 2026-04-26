const { Developer, Project, resolveEffectivePlan, getPlanLimits, AppError } = require('@urbackend/common');
const mongoose = require('mongoose');

const attachDeveloper = async (req, res, next) => {
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
};

const checkProjectLimit = async (req, res, next) => {
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
};

const checkCollectionLimit = async (req, res, next) => {
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
        const projectId = req.body.projectId;
        if (!projectId) return next(new AppError(400, 'projectId is required'));
        const project = await Project.findOne({ _id: projectId, owner: req.developer._id });
        if (!project) return next(new AppError(404, 'Project not found'));
        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan, customLimits: project.customLimits });
        if (limits.maxCollections === -1) return next();
        req.collectionLimit = limits.maxCollections;
        next();
    } catch (err) {
        next(err);
    }
};

const checkByodGate = async (req, res, next) => {
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
        const { dbUri, storageUrl, storageKey } = req.body;
        if (!dbUri && !storageUrl && !storageKey) return next();
        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan });
        if (dbUri && !limits.byomEnabled) return next(new AppError(403, 'BYOM is Pro'));
        if ((storageUrl || storageKey) && !limits.byosEnabled) return next(new AppError(403, 'BYOS is Pro'));
        next();
    } catch (err) {
        next(err);
    }
};

const checkByokGate = async (req, res, next) => {
    try {
        if (req.user?.isAdmin || req.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return next();
        const { resendApiKey, github, google } = req.body;
        if (!resendApiKey && !github?.clientSecret && !google?.clientSecret) return next();
        const effectivePlan = resolveEffectivePlan(req.developer);
        const limits = getPlanLimits({ plan: effectivePlan });
        if (!limits.byokEnabled) return next(new AppError(403, 'BYOK is Pro'));
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    attachDeveloper,
    checkProjectLimit,
    checkCollectionLimit,
    checkByodGate,
    checkByokGate
};