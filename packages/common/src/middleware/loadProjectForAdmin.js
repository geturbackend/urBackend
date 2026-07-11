// FUNCTION - LOAD PROJECT FOR ADMIN (MIDDLEWARE)
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const { getProjectAccessQuery } = require('../utils/projectAccess');
const mongoose = require("mongoose");

module.exports = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        if (!projectId) return next(new AppError(400, "Project ID is required"));

       if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new AppError(400, "Invalid project ID format"));
        }

        const project = await Project.findOne({
            _id: projectId,
            ...getProjectAccessQuery(req.user._id),
        });
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
