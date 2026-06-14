// FUNCTION - LOAD PROJECT FOR ADMIN (MIDDLEWARE)

const { Project, AppError, getProjectAccessQuery } = require('@urbackend/common');

module.exports = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        if (!projectId) return next(new AppError(400, "Project ID is required"));

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
        next(err);
    }
};
