const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const isDebug = process.env.DEBUG_AUTH === 'true';
    const logDebug = (...args) => {
        if (isDebug) {
            console.log(...args);
        }
    };

    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    logDebug('Authorization header present:', Boolean(authHeader));

    if (!token) {
        logDebug('No token provided');
        return res.status(401).send('No token');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Extract userId from token - it could be named 'id' or 'userId'
        const userId = decoded.id || decoded.userId || decoded._id;
        if (!userId) {
            logDebug('Invalid token payload');
            return res.status(401).send('Invalid token payload');
        }
        req.userId = userId;
        req.user = decoded;
        logDebug('JWT verified - User ID:', req.userId);
        next();
    } catch (err) {
        console.error('JWT error:', err.message);
        res.status(401).send('Invalid token');
    }
};

module.exports = authMiddleware;
