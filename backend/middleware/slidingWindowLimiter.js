import redisClient from "../config/redisClient.js";

const WINDOW_SIZE = 60; // seconds
const MAX_REQUESTS = 100;

export const slidingWindowLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    const key = `sliding:${userId}`;
    const now = Date.now();

    const windowStart = now - WINDOW_SIZE * 1000;

    // Remove old requests
    await redisClient.zRemRangeByScore(key, 0, windowStart);

    // Count current requests
    const requestCount = await redisClient.zCard(key);

    if (requestCount >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please slow down.",
      });
    }

    // Add current request
    await redisClient.zAdd(key, [{ score: now, value: `${now}` }]);

    // Set expiry so Redis auto-cleans
    await redisClient.expire(key, WINDOW_SIZE);

    next();
  } catch (error) {
    next(error);
  }
};
