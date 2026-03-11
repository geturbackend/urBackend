const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Retrieve the Authorization header from the request
    const authHeader = req.header('Authorization');

    // Check if the Authorization header exists
    if (!authHeader) {
        return res.status(401).send('Access Denied: No Token Provided');
    }

    // Extract the actual token by removing the "Bearer " prefix
    // We split the header value by space and take the second part
    const token = authHeader.split(' ')[1];

    // If token is missing after splitting, the format is invalid
    if (!token) {
        return res.status(401).send('Access Denied: Malformed Token Format');
    }

    try {
        // Verify the token using the secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);


        // Attach decoded token data to request object
        req.user = verified;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.log("err---------------2")
        console.error(err);

        // Do not expose detailed error information in production
        res.status(400).json({ error: 'Invalid Token' });
    }
};
