const { 
  redis, 
  Developer, 
  resolveEffectivePlan, 
  getPlanLimits, 
  getDeveloperPlanCache, 
  setDeveloperPlanCache,
  AppError,
  sanitizeObjectId,
  getConnection,
  getCompiledModel,
  getDayKey,
  DEFAULT_DAILY_TTL_SECONDS,
  incrWithTtlAtomic
} = require('@urbackend/common');

/**
 * Resolves the plan context for the current project's owner.
 * Uses Redis cache to avoid DB hits on every public API request.
 */
async function resolveDeveloperPlanContext(req) {
    const rawOwner = req.project.owner;
    const developerId = (rawOwner && typeof rawOwner === 'object' && rawOwner._id)
        ? rawOwner._id.toString()
        : rawOwner.toString();
    
    // Sanitize to prevent NoSQL injection if owner was somehow corrupted
    const cleanDeveloperId = sanitizeObjectId(developerId);
    if (!cleanDeveloperId) return { plan: 'free', legacyLimits: {} };

    // Try cache first
    let cached = await getDeveloperPlanCache(cleanDeveloperId);
    if (cached) return cached;

    // Cache miss: Load from DB
    const developer = await Developer.findById(cleanDeveloperId).select('plan planExpiresAt maxProjects maxCollections').lean();
    
    const context = {
        plan: developer?.plan || 'free',
        planExpiresAt: developer?.planExpiresAt || null,
        legacyLimits: {
            maxProjects: developer?.maxProjects ?? null,
            maxCollections: developer?.maxCollections ?? null
        }
    };

    // Store in cache (5 mins)
    await setDeveloperPlanCache(cleanDeveloperId, context);
    return context;
}

/**
 * Middleware to check daily request limits and per-minute spikes.
 */
exports.checkUsageLimits = async (req, res, next) => {
    try {
        if (!req.project) return next();

        const planContext = await resolveDeveloperPlanContext(req);
        const effectivePlan = resolveEffectivePlan(planContext);

        const limits = getPlanLimits({
            plan: effectivePlan,
            customLimits: req.project.customLimits,
            legacyLimits: planContext.legacyLimits
        });

        req.planLimits = limits;

        const minKey = `project:usage:min:${req.project._id}:${new Date().toISOString().substring(0, 16)}`;
        const minCount = await incrWithTtlAtomic(redis, minKey, 65);

        if (limits.reqPerMinute !== -1 && minCount > limits.reqPerMinute) {
            return next(new AppError(429, 'Rate limit exceeded (per minute). Please slow down or upgrade your plan.'));
        }

        const day = getDayKey();
        const reqCountKey = `project:usage:req:count:${req.project._id}:${day}`;
        const newDailyCount = await incrWithTtlAtomic(redis, reqCountKey, DEFAULT_DAILY_TTL_SECONDS);

        if (limits.reqPerDay !== -1 && newDailyCount > limits.reqPerDay) {
            await redis.decr(reqCountKey);
            return next(new AppError(429, 'Daily request limit reached. Upgrade your plan to increase limits.'));
        }

        req._dailyCountIncremented = true;
        next();
    } catch (err) {
        console.error("Usage limit check failed:", err);
        next();
    }
};

/**
 * Middleware to enforce Auth User limits (e.g., 200 for Free).
 * Applied to signup and social auth routes.
 */
exports.checkAuthUsersLimit = async (req, res, next) => {
    try {
        if (!req.project) return next();

        // 1. Resolve limits if not already attached by checkUsageLimits
        if (!req.planLimits) {
            const planContext = await resolveDeveloperPlanContext(req);
            const effectivePlan = resolveEffectivePlan(planContext);
            req.planLimits = getPlanLimits({
                plan: effectivePlan,
                customLimits: req.project.customLimits,
                legacyLimits: planContext.legacyLimits
            });
        }

        const limit = req.planLimits.authUsersLimit;
        if (limit === -1) return next(); // Unlimited

        // 2. Count existing users
        const usersCol = req.project.collections.find(c => c.name === 'users');
        if (!usersCol) return next();

        const connection = await getConnection(req.project._id);
        const Model = getCompiledModel(connection, usersCol, req.project._id, req.project.resources.db.isExternal);
        
        const count = await Model.countDocuments();
        if (count >= limit) {
            return next(new AppError(403, `User limit reached (${limit}). Please upgrade your plan to allow more users.`));
        }

        next();
    } catch (err) {
        console.error("Auth user limit check failed:", err);
        next();
    }
};