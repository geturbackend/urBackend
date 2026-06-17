const { Project, AppError } = require("@urbackend/common");
const { getProjectAccessQuery, getProjectRole } = require("@urbackend/common");
const mongoose = require("mongoose");

/**
 * Middleware factory: loads a project by ID, checks owner OR member access,
 * and attaches req.project + req.projectRole.
 *
 * Usage:
 *   authorizeProject()          — any member or owner can proceed
 *   authorizeProject('admin')   — owner or admin member required
 *   authorizeProject('owner')   — only the project owner can proceed
 *
 * @param {'owner' | 'admin' | undefined} requiredRole
 */
module.exports = function authorizeProject(requiredRole) {
  return async (req, res, next) => {
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

      const role = getProjectRole(project, req.user._id);
      req.project = project;
      req.projectRole = role;

      if (requiredRole === "owner" && role !== "owner") {
        return next(
          new AppError(403, "Only the project owner can perform this action"),
        );
      }

      if (requiredRole === "admin" && role === "viewer") {
        return next(
          new AppError(403, "Viewers do not have write access to this project"),
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
