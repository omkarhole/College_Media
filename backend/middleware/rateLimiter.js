const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redisClient'); // agar redis hai

// 🔐 Global API limiter
const globalLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      })
    : undefined, // fallback to memory
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔥 Strict limiter for auth routes
const authLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      })
    : undefined,
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20, // very strict
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🧠 Multi-key limiter helper
const keyGenerator = (req) => {
  return (
    req.user?.id ||
    req.headers.authorization ||
    req.ip
  );
};

module.exports = {
  globalLimiter,
  authLimiter,
  keyGenerator,
};
