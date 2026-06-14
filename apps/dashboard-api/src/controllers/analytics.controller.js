const { Project, Log, Developer, Webhook, getConnection, resolveEffectivePlan, getPlanLimits, PlatformEvent, DeveloperActivity, AppError, ApiResponse, getProjectAccessQuery } = require("@urbackend/common");
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
    
    const totalRequests = await Log.countDocuments({ projectId: { $in: projectIds } });
    const totalWebhooks = await Webhook.countDocuments({ projectId: { $in: projectIds } });

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
        totalUsers
      }
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
    const projectIds = await Project.find(getProjectAccessQuery(userId)).distinct("_id");

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

    return new ApiResponse(formattedLogs).send(res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// ACTIVATION FUNNEL
// Returns step-by-step conversion rates for the current developer.
// ---------------------------------------------------------------------------
module.exports.getActivationFunnel = async (req, res, next) => {
  try {
    const developerId = req.user._id;

    const FUNNEL_STEPS = [
      'signup_completed',
      'email_verified',
      'project_created',
      'collection_created',
      'first_api_success',
    ];

    // Fetch one event per step (we only need existence, not count)
    const events = await PlatformEvent.find({
      developerId,
      event: { $in: FUNNEL_STEPS },
    })
      .sort({ timestamp: 1 })
      .select('event timestamp')
      .lean();

    const completed = {};
    for (const e of events) {
      if (!completed[e.event]) completed[e.event] = e.timestamp;
    }

    const steps = FUNNEL_STEPS.map((step, i) => ({
      step,
      order: i + 1,
      completed: !!completed[step],
      completedAt: completed[step] || null,
    }));

    return new ApiResponse({ steps }).send(res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// RETENTION  (D1 / D7 / D30)
// Checks whether the developer was active on Day+1, Day+7, Day+30 after signup.
// ---------------------------------------------------------------------------
module.exports.getRetention = async (req, res, next) => {
  try {
    const developerId = req.user._id;

    // Find signup event to anchor the cohort start date
    const signupEvent = await PlatformEvent.findOne({
      developerId,
      event: 'signup_completed',
    }).sort({ timestamp: 1 }).lean();

    if (!signupEvent) {
      return new ApiResponse({ d1: false, d7: false, d30: false, signupDate: null }).send(res);
    }

    const signupDate = new Date(signupEvent.timestamp);
    signupDate.setUTCHours(0, 0, 0, 0);

    const checkDay = async (daysAfter) => {
      const targetDate = new Date(signupDate);
      targetDate.setUTCDate(targetDate.getUTCDate() + daysAfter);
      const nextDate = new Date(targetDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);

      const activity = await DeveloperActivity.findOne({
        developerId,
        date: { $gte: targetDate, $lt: nextDate },
      }).lean();
      return !!activity;
    };

    const [d1, d7, d30] = await Promise.all([
      checkDay(1),
      checkDay(7),
      checkDay(30),
    ]);

    return new ApiResponse({ d1, d7, d30, signupDate }).send(res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// FEATURE ENGAGEMENT  (trailing 30 days)
// Returns per-feature usage totals across all projects for the developer.
// ---------------------------------------------------------------------------
module.exports.getEngagement = async (req, res, next) => {
  try {
    const developerId = req.user._id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const agg = await DeveloperActivity.aggregate([
      {
        $match: {
          developerId: new mongoose.Types.ObjectId(developerId),
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalApiCalls: { $sum: '$apiCallCount' },
          totalMailSent: { $sum: '$mailSentCount' },
          totalStorageUploads: { $sum: '$storageUploadsCount' },
          totalWebhooksFired: { $sum: '$webhookTriggeredCount' },
          activeDays: { $sum: 1 },
          allProjectIds: { $push: '$activeProjectIds' },
        },
      },
    ]);

    const result = agg[0] || {
      totalApiCalls: 0,
      totalMailSent: 0,
      totalStorageUploads: 0,
      totalWebhooksFired: 0,
      activeDays: 0,
    };

    // Unique active projects in the 30-day window
    const flatProjectIds = (result.allProjectIds || []).flat();
    const uniqueActiveProjects = new Set(flatProjectIds.map(String)).size;

    return new ApiResponse({
      window: '30d',
      totalApiCalls: result.totalApiCalls,
      totalMailSent: result.totalMailSent,
      totalStorageUploads: result.totalStorageUploads,
      totalWebhooksFired: result.totalWebhooksFired,
      activeDays: result.activeDays,
      uniqueActiveProjects,
    }).send(res);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// NORTH STAR METRIC
// "Projects making successful API calls in the last 7 days"
// ---------------------------------------------------------------------------
module.exports.getNorthStar = async (req, res, next) => {
  try {
    const developerId = req.user._id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    // Projects owned by this developer (North Star should be owner-only)
    const allProjects = await Project.find({ owner: developerId }).select('_id name').lean();
    const projectIds = allProjects.map((p) => p._id);
    const totalProjects = projectIds.length;

    if (totalProjects === 0) {
      return new ApiResponse({ activeProjects: 0, totalProjects: 0, percentage: 0 }).send(res);
    }

    // Projects with at least one 2xx log in the last 7 days
    const activeProjectIds = await Log.distinct('projectId', {
      projectId: { $in: projectIds },
      status: { $gte: 200, $lt: 300 },
      timestamp: { $gte: sevenDaysAgo },
    });

    const activeProjects = activeProjectIds.length;
    const percentage = totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0;

    return new ApiResponse({ activeProjects, totalProjects, percentage }).send(res);
  } catch (err) {
    next(err);
  }
};
