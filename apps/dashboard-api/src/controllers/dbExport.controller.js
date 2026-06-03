const { AppError } = require('@urbackend/common');
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

        if (project.owner.toString() !== userId.toString()) {
            return next(new AppError(403, "Access denied. You are not the owner of this project."));
        }
        
        if (!project.collections.some(c => c.name === collectionName)) {
            return next(new AppError(404, "Collection not found in project."));
        }

        
        const developer = await Developer.findById(userId).select('email plan').lean();
        if (!developer) {
            return next(new AppError(404, "Authenticated developer not found."));
        }
        const { email, plan = 'free' } = developer;

        console.log(`[Dashboard API] Received export request for collection ${collectionName} in project ${projectId} from user ${userId} (${email})`);


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

        return res.status(202).json({
            success: true,
            data: {},
            message: `Collection export request received. You will receive an email with a download link shortly. Usage today: ${newCount}/${maxExports}.`,
        });

    } catch (err) {
        console.error("[Dashboard API] Error handling export request for project - ", req.params.projectId, ": ", err);
        return next(new AppError(500, err.message || "Failed to initiate database export."));
    }
};
