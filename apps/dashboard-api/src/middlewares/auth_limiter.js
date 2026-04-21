const rateLimit = require('express-rate-limit');

// limiter for sensitive auth endpoints (login, register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many attempts. Please try again in 15 minutes." },
    skip: (req) => process.env.NODE_ENV === 'development',
    standardHeaders: true,
    legacyHeaders: false,
});

const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { error: "Too many requests. Please try again later." },
    skip: (req) => process.env.NODE_ENV === 'development',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, publicLimiter };
