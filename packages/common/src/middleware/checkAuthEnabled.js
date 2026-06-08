// FUNCTION - CHECK AUTH ENABLED (MIDDLEWARE)
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
    const project = req.project;

    if (!project.isAuthEnabled) {
        return next(new AppError(403, "Please enable Auth in the urBackend dashboard for this project to use this endpoint.", "Authentication service is disabled"));
    }

    const usersCollection = project.collections?.find(c => c.name === 'users');
    
    if (!usersCollection) {
        return next(new AppError(403, "Authentication is enabled, but the 'users' collection schema has not been defined. Please create a 'users' collection in the dashboard to define your custom user fields.", "User Schema Missing"));
    }

    const hasEmail = usersCollection.model.find(f => f.key === 'email' && f.type === 'String' && f.required);
    const hasPassword = usersCollection.model.find(f => f.key === 'password' && f.type === 'String' && f.required);
    
    if (!hasEmail || !hasPassword) {
        return next(new AppError(422, "The 'users' collection is missing required 'email' and 'password' string fields. Please fix the schema in the dashboard.", "Invalid Users Schema"));
    }

    req.usersSchema = usersCollection.model;
    
    next();
};
