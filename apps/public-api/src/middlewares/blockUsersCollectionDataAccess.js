module.exports = (req, res, next) => {
    const collectionName = String(req.params?.collectionName || '').trim().toLowerCase();

    if (collectionName === 'users') {
        return res.status(403).json({
            error: "Users collection is protected",
            message: "Use /api/userAuth endpoints for users collection operations."
        });
    }

    return next();
};
