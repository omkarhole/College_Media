const express = require('express');
const router = express.Router();
const RecommendationEngine = require('../services/recommendationEngine');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

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
 * /api/feed/recommended:
 *   get:
 *     summary: Get personalized post recommendations
 *     tags: [Feed]
 */
router.get('/recommended', verifyToken, async (req, res) => {
    try {
        const posts = await RecommendationEngine.getFeedRecommendations(req.userId);
        res.json({ success: true, count: posts.length, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/feed/interaction:
 *   post:
 *     summary: Track user interaction for analytics
 *     tags: [Feed]
 */
router.post('/interaction', verifyToken, async (req, res) => {
    try {
        const { targetId, targetModel = 'Post', type } = req.body;

        if (!targetId || !type) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        // Async track (don't block response)
        RecommendationEngine.trackInteraction(req.userId, targetId, targetModel, type);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
