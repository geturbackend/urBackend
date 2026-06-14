const { AppError } = require('@urbackend/common');
module.exports = (req, res, next) => {
    const collectionName = String(req.params?.collectionName || '').trim().toLowerCase();

    if (collectionName === 'users') {
        return next(new AppError(403, 'Use /api/userAuth endpoints for users collection operations.', 'Users collection is protected'));
    }

    return next();
};
