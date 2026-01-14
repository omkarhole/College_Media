const express = require('express');
const router = express.Router();
const E2EController = require('../controllers/e2eController');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

// Middleware to verify token (locally defined to ensure standalone usage)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

/**
 * @swagger
 * /api/keys/upload:
 *   post:
 *     summary: Upload E2EE key bundle
 *     tags: [Keys]
 */
router.post('/upload', verifyToken, apiLimiter, E2EController.uploadKeys);

/**
 * @swagger
 * /api/keys/fetch/{userId}:
 *   get:
 *     summary: Fetch public keys for a user
 *     tags: [Keys]
 */
router.get('/fetch/:userId', verifyToken, apiLimiter, E2EController.fetchKeys);

/**
 * @swagger
 * /api/keys/count:
 *   get:
 *     summary: Check remaining one-time keys
 *     tags: [Keys]
 */
router.get('/count', verifyToken, E2EController.checkKeyCount);

module.exports = router;
