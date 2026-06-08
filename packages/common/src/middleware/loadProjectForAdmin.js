// FUNCTION - LOAD PROJECT FOR ADMIN (MIDDLEWARE)
const Project = require('../models/Project');
const AppError = require('../utils/AppError');

module.exports = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        if (!projectId) return next(new AppError(400, "Project ID is required"));

        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) {
            return next(new AppError(404, "Project not found or access denied"));
        }

        req.project = project;
        next();
    } catch (err) {
        console.error("loadProjectForAdmin Error:", err);
        next(new AppError(500, "Internal Server Error"));
    }
};
