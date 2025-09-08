const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    console.log('All headers:', req.headers);
    const authHeader = req.header('Authorization');
    console.log('Raw Authorization header:', authHeader);
    const token = authHeader?.split(' ')[1];
    console.log('Extracted token:', token);
    if (!token) {
        console.log('No token provided');
        return res.status(401).send('No token');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id) {
            console.log('Invalid token payload:', decoded);
            return res.status(401).send('Invalid token payload');
        }
        req.user = decoded;
        console.log('JWT verified - User:', req.user);
        next();
    } catch (err) {
        console.error('JWT error:', err.message, err.stack);
        res.status(401).send('Invalid token');
    }
};

module.exports = authMiddleware;
