const { 
  redis, 
  Developer, 
  resolveEffectivePlan, 
  getPlanLimits, 
  getDeveloperPlanCache, 
  setDeveloperPlanCache,
  AppError 
} = require('@urbackend/common');
const { getDayKey, DEFAULT_DAILY_TTL_SECONDS, incrWithTtlAtomic } = require('../utils/usageCounter');

/**
 * Resolves the plan context for the current project's owner.
 * Uses Redis cache to avoid DB hits on every public API request.
 */
async function resolveDeveloperPlanContext(req) {
    // Extract raw string ID — owner can be either a populated object or a raw ObjectId
    const rawOwner = req.project.owner;
    const developerId = (rawOwner && typeof rawOwner === 'object' && rawOwner._id)
        ? rawOwner._id.toString()
        : rawOwner.toString();
    
    // Try cache first
    let cached = await getDeveloperPlanCache(developerId);
    if (cached) return cached;

    // Cache miss: Load from DB
    const developer = await Developer.findById(developerId).select('plan planExpiresAt maxProjects maxCollections').lean();
    
    const context = {
        plan: developer?.plan || 'free',
        planExpiresAt: developer?.planExpiresAt || null,
        // Only store the raw DB values, do NOT apply defaults here — 
        // getPlanLimits handles merging with plan-tier defaults safely.
        legacyLimits: {
            maxProjects: developer?.maxProjects ?? null,
            maxCollections: developer?.maxCollections ?? null
        }
    };

    // Store in cache (5 mins)
    await setDeveloperPlanCache(developerId, context);
    return context;
}

/**
 * Middleware to check daily request limits and per-minute spikes.
 */
exports.checkUsageLimits = async (req, res, next) => {
    try {
        if (!req.project) return next();

        // 1. Resolve Plan context
        const planContext = await resolveDeveloperPlanContext(req);
        const effectivePlan = resolveEffectivePlan(planContext);
        
        const limits = getPlanLimits({
            plan: effectivePlan,
            customLimits: req.project.customLimits,
            legacyLimits: planContext.legacyLimits
        });

        // 2. Per-Minute Limit (Server Protection)
        // Key: project:min:req:{projectId}:{YYYY-MM-DD:HH:MM}
        const minKey = `project:usage:min:${req.project._id}:${new Date().toISOString().substring(0, 16)}`;
        const minCount = await incrWithTtlAtomic(redis, minKey, 65); // 65s TTL
        
        if (limits.reqPerMinute !== -1 && minCount > limits.reqPerMinute) {
            return next(new AppError(429, 'Rate limit exceeded (per minute). Please slow down or upgrade your plan.'));
        }

        // 3. Daily Limit Enforcement
        // Use existing key pattern from api_usage.js for consistency
        const day = getDayKey();
        const reqCountKey = `project:usage:req:count:${req.project._id}:${day}`;
        
        // We use INCRBY 0 to just read the current count if we don't want to double count,
        // BUT actually, we should increment it here and skip it in the logger to be precise.
        // For now, let's just check the current value.
        const currentDailyCount = parseInt(await redis.get(reqCountKey) || '0');

        if (limits.reqPerDay !== -1 && currentDailyCount >= limits.reqPerDay) {
            return next(new AppError(429, 'Daily request limit reached. Upgrade your plan to increase limits.'));
        }

        // Attach limits to request for downstream usage if needed
        req.planLimits = limits;
        next();
    } catch (err) {
        // Fallback to next if redis fails to avoid blocking all traffic
        console.error("Usage limit check failed:", err);
        next();
    }
};
