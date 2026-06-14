const { AppError } = require('@urbackend/common');
module.exports = (req, res, next) => {
    if (req.keyRole !== 'secret') {
        return next(new AppError(403, 'Forbidden. This action requires a Secret Key (sk_live_...).'));
    }
    next();
};
