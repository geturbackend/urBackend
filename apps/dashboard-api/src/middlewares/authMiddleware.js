const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Check for token in cookies (Primary for Web)
    let token = req.cookies && req.cookies.accessToken;

    // Fallback to Authorization header (For CLI/API)
    if (!token) {
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const parts = authHeader.trim().split(/\s+/);
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                token = parts[1];
            }
        }
    }

    // Check if any token was provided
    if (!token) {
        return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    try {
        // Verify the token using the secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);


        // Attach decoded token data to request object
        req.user = verified;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error(err);

        res.status(400).json({ error: 'Invalid Token' });
    }
};
