module.exports = (req, res, next) => {
    if (req.keyRole !== 'secret') {
        return res.status(403).json({ 
            error: "Forbidden. This action requires a Secret Key (sk_live_...)." 
        });
    }
    next();
};
