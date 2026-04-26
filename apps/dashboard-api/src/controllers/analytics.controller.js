const { Project, Log, Developer, Webhook, getConnection, resolveEffectivePlan, getPlanLimits } = require("@urbackend/common");
const mongoose = require("mongoose");

/**
 * Aggregates global usage metrics across all user projects.
 */
module.exports.getGlobalStats = async (req, res) => {
  try {
    const user_id = req.user._id;
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
      Developer.findById(user_id).select("maxProjects maxCollections plan planExpiresAt")
    ]);

    const globalStats = stats[0] || {
      totalProjects: 0,
      totalDatabaseUsed: 0,
      totalStorageUsed: 0,
      totalCollections: 0
    };

    const projects = await Project.find({ owner: user_id }).select("_id").lean();
    const projectIds = projects.map(p => p._id);
    
    // Calculate total requests
    const totalRequests = await Log.countDocuments({ projectId: { $in: projectIds } });

    // Calculate total webhooks
    const totalWebhooks = await Webhook.countDocuments({ projectId: { $in: projectIds } });

    // Calculate total users across all project databases
    let totalUsers = 0;
    for (const project of projects) {
      try {
        const conn = await getConnection(project._id.toString());
        const userCount = await conn.collection('users').countDocuments();
        totalUsers += userCount;
      } catch (err) {
        console.error(`Failed to count users for project ${project._id}:`, err.message);
      }
    }

    const effectivePlan = resolveEffectivePlan(dev);
    const limits = getPlanLimits({
      plan: effectivePlan,
      legacyLimits: {
        maxProjects: dev?.maxProjects ?? null,
        maxCollections: dev?.maxCollections ?? null
      }
    });

    res.json({
      success: true,
      data: {
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
          totalUsers
        }
      },
      message: ""
    });
  } catch (err) {
    res.status(500).json({ success: false, data: {}, message: err.message });
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
