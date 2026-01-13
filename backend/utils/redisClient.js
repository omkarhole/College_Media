"use strict";

const Redis = require("ioredis");
const logger = require("./logger");

const redis = new Redis(process.env.REDIS_URL, {
  enableReadyCheck: true,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (err) => {
  logger.error("Redis error", err);
});

module.exports = redis;
