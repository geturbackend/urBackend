const {
  Project,
  Log,
  Developer,
  Webhook,
  getConnection,
  resolveEffectivePlan,
  getPlanLimits,
  PlatformEvent,
  DeveloperActivity,
  AppError,
  ApiResponse,
  getProjectAccessQuery,
} = require("@urbackend/common");
const mongoose = require("mongoose");

/**
 * Aggregates global usage metrics across all user projects.
 */
module.exports.getGlobalStats = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const userId = new mongoose.Types.ObjectId(user_id);

    const [stats, dev] = await Promise.all([
      Project.aggregate([
        {
          $match: { owner: userId },
        },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            totalDatabaseUsed: { $sum: { $ifNull: ["$databaseUsed", 0] } },
            totalStorageUsed: { $sum: { $ifNull: ["$storageUsed", 0] } },
            totalCollections: {
              $sum: { $size: { $ifNull: ["$collections", []] } },
            },
          },
        },
      ]),
      Developer.findById(user_id).select(
        "maxProjects maxCollections plan planExpiresAt",
      ),
    ]);

    const globalStats = stats[0] || {
      totalProjects: 0,
      totalDatabaseUsed: 0,
      totalStorageUsed: 0,
      totalCollections: 0,
    };

    const projects = await Project.find({ owner: user_id })
      .select("_id")
      .lean();
    const projectIds = projects.map((p) => p._id);

    const totalRequests = await Log.countDocuments({
      projectId: { $in: projectIds },
    });
    const totalWebhooks = await Webhook.countDocuments({
      projectId: { $in: projectIds },
    });

    const USER_COUNT_CONCURRENCY = 5;
    let totalUsers = 0;

    for (let i = 0; i < projects.length; i += USER_COUNT_CONCURRENCY) {
      const batch = projects.slice(i, i + USER_COUNT_CONCURRENCY);
      const batchCounts = await Promise.all(
        batch.map(async (project) => {
          try {
            const conn = await getConnection(project._id.toString());
            return await conn.collection("users").countDocuments();
          } catch (err) {
            console.error(
              `Failed to count users for project ${project._id}:`,
              err.message,
            );
            return 0;
          }
        }),
      );
      totalUsers += batchCounts.reduce((sum, count) => sum + count, 0);
    }

    const effectivePlan = resolveEffectivePlan(dev);
    const limits = getPlanLimits({
      plan: effectivePlan,
      legacyLimits: {
        maxProjects: dev?.maxProjects ?? null,
        maxCollections: dev?.maxCollections ?? null,
      },
    });

    return new ApiResponse({
      plan: effectivePlan,
      planExpiresAt: dev?.planExpiresAt || null,
      limits,
      usage: {
        totalProjects: globalStats.totalProjects,
        totalCollections: globalStats.totalCollections,
        totalStorageUsed: globalStats.totalStorageUsed,
        totalDatabaseUsed: globalStats.totalDatabaseUsed,
        totalRequests,
        totalWebhooks,
        totalUsers,
      },
    }).send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Fetches the most recent activity across all user projects.
 */
module.exports.getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectIds = await Project.find(
      getProjectAccessQuery(userId),
    ).distinct("_id");

    const logs = await Log.find({ projectId: { $in: projectIds } })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate("projectId", "name")
      .lean();

    const formattedLogs = logs.map((log) => ({
      id: log._id,
      projectName: log.projectId?.name || "Unknown Project",
      projectId: log.projectId?._id || log.projectId,
      method: log.method,
      path: log.path,
      status: log.status,
      timestamp: log.timestamp,
    }));

    return new ApiResponse(formattedLogs).send(res);
  } catch (err) {
    next(err);
  }
};

