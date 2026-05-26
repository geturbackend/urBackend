const rateLimit = require('express-rate-limit');
const { Log, redis, ApiAnalytics, getDayKey, DEFAULT_DAILY_TTL_SECONDS, incrWithTtlAtomic } = require('@urbackend/common');
const FIRST_API_SUCCESS_FLAG_TTL_SECONDS = 2 * 365 * 24 * 60 * 60;

// Rate Limiter 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
        xForwardedForHeader: false,
        trustProxy: false
    }
});

// Logger with API analytics
const logger = (req, res, next) => {
    // Capture start time for response time measurement
    const startHr = process.hrtime();
    
    // Check for routes included in platform analytics
    if (
        req.originalUrl.startsWith('/api/data') ||
        req.originalUrl.startsWith('/api/storage') ||
        req.originalUrl.startsWith('/api/userAuth') ||
        req.originalUrl.startsWith('/api/mail') ||
        req.originalUrl.startsWith('/api/schemas')
    ) {
        res.on('finish', async () => {
            // --- Existing logging and usage counter ---
            if (req.project) {
                try {
                    Log.create({
                        projectId: req.project._id,
                        method: req.method,
                        path: req.originalUrl,
                        status: res.statusCode,
                        ip: req.ip
                    });

                    // Usage counter (Redis): daily API requests per project
                    if (!req._dailyCountIncremented) {
                        const day = getDayKey();
                        const reqCountKey = `project:usage:req:count:${req.project._id}:${day}`;
                        incrWithTtlAtomic(redis, reqCountKey, DEFAULT_DAILY_TTL_SECONDS).catch(() => {});
                    }

                    console.log(`📝 Logged: ${req.method} ${req.originalUrl} (${res.statusCode})`);
                } catch (e) {
                    console.error("Logging failed:", e.message);
                }
            }
            
            // --- API performance analytics ---
            if (req.project) {
                const diff = process.hrtime(startHr);
                const responseTimeMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
                
                setImmediate(async () => {
                    try {
                        await ApiAnalytics.create({
                            projectId: req.project._id,
                            endpoint: req.originalUrl.split('?')[0],
                            method: req.method,
                            statusCode: res.statusCode,
                            responseTimeMs: parseFloat(responseTimeMs),
                        });
                    } catch (err) {
                        console.error('Failed to save API analytics:', err);
                    }
                });
            }

            // --- Activation funnel: first_api_success ---
            // Fires only once per project lifetime, on the very first 2xx response.
            // Uses a permanent Redis NX flag so we don't hit MongoDB on every request.
            if (req.project && res.statusCode >= 200 && res.statusCode < 300) {
                setImmediate(async () => {
                    try {
                        const flagKey = `project:activation:first_api_success:${req.project._id}`;
                        const isFirst = await redis.set(
                            flagKey,
                            '1',
                            'EX',
                            FIRST_API_SUCCESS_FLAG_TTL_SECONDS,
                            'NX'
                        );
                        if (isFirst) {
                            const { Project, PlatformEvent } = require('@urbackend/common');
                            const proj = await Project.findById(req.project._id).select('owner').lean();
                            if (proj?.owner) {
                                await PlatformEvent.create({
                                    developerId: proj.owner,
                                    projectId: req.project._id,
                                    event: 'first_api_success',
                                    properties: {
                                        method: req.method,
                                        path: req.originalUrl,
                                        statusCode: res.statusCode,
                                    },
                                    timestamp: new Date(),
                                });
                            }
                        }
                    } catch (err) {
                        console.error('[activation] first_api_success check failed:', err.message);
                    }
                });
            }
        });
    }
   
    next();
};

module.exports = { limiter, logger };
