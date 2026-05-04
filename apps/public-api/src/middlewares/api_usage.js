const rateLimit = require('express-rate-limit');
const { Log, redis, ApiAnalytics } = require('@urbackend/common');
const { getDayKey, DEFAULT_DAILY_TTL_SECONDS, incrWithTtlAtomic } = require('../utils/usageCounter');


// Rate Limiter 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    validate: { trustProxy: false }
});

// Logger with API analytics
const logger = (req, res, next) => {
    
    
    // Capture start time for response time measurement
    const startHr = process.hrtime();
    
    // Check for Data, Storage, AND UserAuth routes
    if (
        req.originalUrl.startsWith('/api/data') ||
        req.originalUrl.startsWith('/api/storage') ||
        req.originalUrl.startsWith('/api/userAuth')
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
            
            // --- NEW: API performance analytics ---
            if (req.project) {
                const diff = process.hrtime(startHr);
                const responseTimeMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
                
                // Asynchronously store analytics
                setImmediate(async () => {
                    try {
                        await ApiAnalytics.create({
                            projectId: req.project._id,
                            endpoint: req.route?.path || req.originalUrl,
                            method: req.method,
                            statusCode: res.statusCode,
                            responseTimeMs: parseFloat(responseTimeMs),
                        });
                    } catch (err) {
                        console.error('Failed to save API analytics:', err);
                    }
                });
            }
        });
    }
   
    next();
};

module.exports = { limiter, logger };