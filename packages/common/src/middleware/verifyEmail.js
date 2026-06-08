const AppError = require('../utils/AppError');

module.exports = function (req, res, next) {
    const { isVerified } = req.user;
    if (!isVerified) return next(new AppError(401, "Email not verified"));
    next();
};
