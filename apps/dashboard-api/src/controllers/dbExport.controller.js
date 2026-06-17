const { AppError, ApiResponse, getProjectRole } = require('@urbackend/common');
const { Developer } = require('@urbackend/common');
const { Project } = require('@urbackend/common');
const { exportQueue } = require('@urbackend/common');
const { redis } = require('@urbackend/common');
const { getProjectById, setProjectById } = require('@urbackend/common');

module.exports.dbExportHandler = async (req, res, next) => {
    try {
        const { projectId, collectionName } = req.params;
        const { _id: userId } = req.user;

        let project = await getProjectById(projectId);
        if (!project) {
            project = await Project.findById(projectId).lean();
            if (!project) {
                return next(new AppError(404, "Project not found."));
            }
            await setProjectById(projectId, project);
        }

        if (!getProjectRole(project, userId)) {
            return next(new AppError(403, "Access denied. You are not a member of this project."));
        }
        
        if (!project.collections.some(c => c.name === collectionName)) {
            return next(new AppError(404, "Collection not found in project."));
        }


        const developer = await Developer.findById(userId).select('email').lean();
        if (!developer) {
            return next(new AppError(404, "Authenticated developer not found."));
        }
        const { email } = developer;

        console.log(`[Dashboard API] Received export request for collection ${collectionName} in project ${projectId} from user ${userId} (${email})`);

        // Derive maxExports from project owner's plan
        const projectOwner = await Developer.findById(project.owner).select('plan').lean();
        if (!projectOwner) {
            return next(new AppError(404, "Project owner not found."));
        }
        const { plan = 'free' } = projectOwner;
        const maxExports = plan === 'pro' ? 5 : 1;
        const today = new Date().toISOString().split('T')[0];
        const key = `project:${projectId}:export_limit:${today}`;

        const currentCount = await redis.get(key);
        if (currentCount && Number(currentCount) >= maxExports) {
            return next(new AppError(429, `Daily export limit reached (${maxExports}/${maxExports}). Please try again tomorrow.`));
        }

        const newCount = await redis.incr(key);
        if (newCount === 1) {
            await redis.expire(key, 86400); // Set expiry to 24 hours
        }

        await exportQueue.add('export-database', { projectId, collectionName, userId, email });

        return new ApiResponse({}, `Collection export request received. You will receive an email with a download link shortly. Usage today: ${newCount}/${maxExports}.`).send(res, 202);

    } catch (err) {
        console.error("[Dashboard API] Error handling export request for project - ", req.params.projectId, ": ", err);
        return next(new AppError(500, err.message || "Failed to initiate database export."));
    }
};
