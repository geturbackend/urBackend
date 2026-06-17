const rateLimit = require('express-rate-limit');
const { AppError } = require('@urbackend/common');

const projectRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    
    keyGenerator: (req, res) => {
        if (!req.project || !req.project._id) {
            return 'unauthorized'; 
        }
        return req.project._id.toString();
    },

    handler: (req, res, next, options) => {
        next(new AppError(options.statusCode, "Project Rate limit exceeded. Please try again later.", "Too Many Requests"));
    },
    
    limit: async (req, res) => {
        if (req.project && req.project.rateLimit) {
            return req.project.rateLimit;
        }
        return 500;
    }
});

module.exports = projectRateLimiter;
