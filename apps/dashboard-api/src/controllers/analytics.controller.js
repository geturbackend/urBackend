const { Project, Log, Developer, resolveEffectivePlan, getPlanLimits } = require("@urbackend/common");
const mongoose = require("mongoose");

/**
 * Aggregates global usage metrics across all user projects.
 */
module.exports.getGlobalStats = async (req, res) => {
  try {
    const user_id = req.user._id;
    // Bulletproof matching: string or ObjectId
    const userId = new mongoose.Types.ObjectId(user_id);

    const [stats, dev] = await Promise.all([
      Project.aggregate([
        { 
          $match: { 
            $or: [
              { owner: user_id },
              { owner: userId }
            ]
          } 
        },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            totalDatabaseUsed: { $sum: { $ifNull: ["$databaseUsed", 0] } },
            totalStorageUsed: { $sum: { $ifNull: ["$storageUsed", 0] } },
            totalCollections: { $sum: { $size: { $ifNull: ["$collections", []] } } }
          }
        }
      ]),
      Developer.findById(user_id).select("maxProjects maxCollections")
    ]);

    const globalStats = stats[0] || {
      totalProjects: 0,
      totalDatabaseUsed: 0,
      totalStorageUsed: 0,
      totalCollections: 0
    };

    // Robust request counting
    const projectIds = await Project.find({ owner: user_id }).distinct("_id");
    const totalRequests = await Log.countDocuments({ projectId: { $in: projectIds } });

    const effectivePlan = resolveEffectivePlan(dev);
    const limits = getPlanLimits({
      plan: effectivePlan,
      legacyLimits: {
        maxProjects: dev?.maxProjects,
        maxCollections: dev?.maxCollections
      }
    });

    res.json({
      ...globalStats,
      totalRequests,
      limits: {
        maxProjects: limits.maxProjects,
        maxCollections: limits.maxCollections
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Fetches the most recent activity across all user projects.
 */
module.exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const projectIds = await Project.find({ owner: userId }).distinct("_id");

    const logs = await Log.find({ projectId: { $in: projectIds } })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('projectId', 'name')
      .lean();

    const formattedLogs = logs.map(log => ({
      id: log._id,
      projectName: log.projectId?.name || 'Unknown Project',
      projectId: log.projectId?._id || log.projectId,
      method: log.method,
      path: log.path,
      status: log.status,
      timestamp: log.timestamp
    }));

    res.json(formattedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
