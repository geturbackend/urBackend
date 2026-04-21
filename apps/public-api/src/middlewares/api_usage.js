const rateLimit = require('express-rate-limit');
const { Log, redis } = require('@urbackend/common');
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

// Logger 
const logger = (req, res, next) => {
    console.time("logger middleware")
    // Check for Data, Storage, AND UserAuth routes
    if (
        req.originalUrl.startsWith('/api/data') ||
        req.originalUrl.startsWith('/api/storage') ||
        req.originalUrl.startsWith('/api/userAuth')
    ) {

        res.on('finish', async () => {
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
                    const day = getDayKey();
                    const reqCountKey = `project:usage:req:count:${req.project._id}:${day}`;
                    incrWithTtlAtomic(redis, reqCountKey, DEFAULT_DAILY_TTL_SECONDS).catch(() => {});

                    console.log(`📝 Logged: ${req.method} ${req.originalUrl} (${res.statusCode})`);
                } catch (e) {
                    console.error("Logging failed:", e.message);
                }
            }
        });
    }
    console.timeEnd("logger middleware")
    next();
};

module.exports = { limiter, logger };
