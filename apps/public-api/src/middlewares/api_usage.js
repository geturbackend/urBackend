const rateLimit = require('express-rate-limit');
const { Log, redis, ApiAnalytics, getDayKey, DEFAULT_DAILY_TTL_SECONDS, incrWithTtlAtomic } = require('@urbackend/common');

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
                    }).catch((e) => {
                        console.error("Logging failed:", e.message);
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
                        console.error('Failed to save API analytics:', err.message || err);
                    }
                });
            }

            // --- Activation funnel: first_api_call ---
            // Fires once per developer, only after a successful real data API call.
            if (
                req.project &&
                req.originalUrl.startsWith('/api/data') &&
                res.statusCode >= 200 &&
                res.statusCode < 300
            ) {
                setImmediate(async () => {
                    try {
                        const { Project, PlatformEvent, markDeveloperActivated } = require('@urbackend/common');
                        const projectOwner = req.project.owner?._id || req.project.owner;
                        const ownerId = projectOwner || (await Project.findById(req.project._id).select('owner').lean())?.owner;
                        if (!ownerId) return;

                        const { activated } = await markDeveloperActivated(ownerId);
                        if (activated) {
                            const existingEvent = await PlatformEvent.findOne({ developerId: ownerId, event: 'first_api_call' }).lean();
                            if (!existingEvent) {
                                await PlatformEvent.create({
                                    developerId: ownerId,
                                    projectId: req.project._id,
                                    event: 'first_api_call',
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
                        console.error('[activation] first_api_call check failed:', err.message);
                    }
                });
            }
        });
    }
   
    next();
};

module.exports = { limiter, logger };
