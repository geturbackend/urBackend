const rateLimit = require('express-rate-limit');
const Project = require('../models/Project');

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
        res.status(options.statusCode).json({
            error: "Too Many Requests",
            message: "Project Rate limit exceeded. Please try again later."
        });
    },
    
    limit: async (req, res) => {
        if (req.project && req.project.rateLimit) {
            return req.project.rateLimit;
        }
        return 500;
    }
});

module.exports = projectRateLimiter;
