/*****************************************************************************************
 * Advanced Rate Limiter (Single File)
 * ---------------------------------------------------------------------------------------
 * Issue: No Request Rate Limiting per Service / Endpoint (#944)
 * Author: Ayaan Shaikh
 *
 * Description:
 *   This file implements a FULLY CUSTOM, production-grade rate limiting system.
 *
 * Supported:
 *   - Per Service Rate Limiting
 *   - Per Endpoint Rate Limiting
 *   - Per IP Limiting
 *   - Per User Limiting
 *   - Sliding Window Algorithm
 *   - Token Bucket Algorithm
 *   - Express Middleware Support
 *   - Configurable Limits
 *   - Abuse Protection
 *
 *****************************************************************************************/

"use strict";

/*****************************************************************************************
 * SECTION 1: Imports
 *****************************************************************************************/

const crypto = require("crypto");

/*****************************************************************************************
 * SECTION 2: Global Configuration
 *****************************************************************************************/

const DEFAULT_RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 100,           // max requests per window
  burstCapacity: 20,          // token bucket burst
  refillRate: 1,              // tokens per second
  blockDurationMs: 5 * 60 * 1000, // 5 minutes block
};

/*****************************************************************************************
 * SECTION 3: Utility Helpers
 *****************************************************************************************/

function now() {
  return Date.now();
}

function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "UNKNOWN_IP"
  );
}

function hashKey(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/*****************************************************************************************
 * SECTION 4: Memory Stores (Redis ready)
 *****************************************************************************************/

const slidingWindowStore = new Map();
const tokenBucketStore = new Map();
const blockedStore = new Map();

/*****************************************************************************************
 * SECTION 5: Sliding Window Logic
 *****************************************************************************************/

function checkSlidingWindow(key, config) {
  const currentTime = now();

  if (!slidingWindowStore.has(key)) {
    slidingWindowStore.set(key, []);
  }

  const timestamps = slidingWindowStore.get(key);

  // Remove expired timestamps
  while (timestamps.length && timestamps[0] <= currentTime - config.windowMs) {
    timestamps.shift();
  }

  if (timestamps.length >= config.maxRequests) {
    return false;
  }

  timestamps.push(currentTime);
  return true;
}

/*****************************************************************************************
 * SECTION 6: Token Bucket Logic
 *****************************************************************************************/

function checkTokenBucket(key, config) {
  const currentTime = now();

  if (!tokenBucketStore.has(key)) {
    tokenBucketStore.set(key, {
      tokens: config.burstCapacity,
      lastRefill: currentTime,
    });
  }

  const bucket = tokenBucketStore.get(key);

  const elapsed = (currentTime - bucket.lastRefill) / 1000;
  const refill = elapsed * config.refillRate;

  bucket.tokens = Math.min(
    config.burstCapacity,
    bucket.tokens + refill
  );

  bucket.lastRefill = currentTime;

  if (bucket.tokens < 1) {
    return false;
  }

  bucket.tokens -= 1;
  return true;
}

/*****************************************************************************************
 * SECTION 7: Blocking Logic
 *****************************************************************************************/

function isBlocked(key) {
  const blockInfo = blockedStore.get(key);
  if (!blockInfo) return false;

  if (now() > blockInfo.blockUntil) {
    blockedStore.delete(key);
    return false;
  }
  return true;
}

function blockKey(key, durationMs) {
  blockedStore.set(key, {
    blockUntil: now() + durationMs,
  });
}

/*****************************************************************************************
 * SECTION 8: Rate Limit Evaluation
 *****************************************************************************************/

function evaluateRateLimit(key, config) {
  if (isBlocked(key)) {
    return { allowed: false, reason: "BLOCKED" };
  }

  const slidingAllowed = checkSlidingWindow(key, config);
  const tokenAllowed = checkTokenBucket(key, config);

  if (!slidingAllowed || !tokenAllowed) {
    blockKey(key, config.blockDurationMs);
    return { allowed: false, reason: "RATE_LIMIT_EXCEEDED" };
  }

  return { allowed: true };
}

/*****************************************************************************************
 * SECTION 9: Key Generation Strategy
 *****************************************************************************************/

function buildRateLimitKey({
  service,
  endpoint,
  ip,
  user,
}) {
  return hashKey(
    `${service || "GLOBAL"}::${endpoint || "ALL"}::${ip || "IP"}::${user || "ANON"}`
  );
}

/*****************************************************************************************
 * SECTION 10: Express Middleware Factory
 *****************************************************************************************/

function rateLimiter(serviceName, options = {}) {
  const config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...options };

  return function rateLimitMiddleware(req, res, next) {
    try {
      const ip = getClientIP(req);
      const user =
        req.user?.id ||
        req.headers["x-user-id"] ||
        "ANONYMOUS";

      const endpoint = req.originalUrl || req.url;

      const key = buildRateLimitKey({
        service: serviceName,
        endpoint,
        ip,
        user,
      });

      const result = evaluateRateLimit(key, config);

      // Response headers
      res.setHeader("X-RateLimit-Window", config.windowMs);
      res.setHeader("X-RateLimit-Limit", config.maxRequests);

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          reason: result.reason,
          service: serviceName,
        });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Rate limiter internal error",
      });
    }
  };
}

/*****************************************************************************************
 * SECTION 11: Per Service Limiter
 *****************************************************************************************/

function serviceRateLimiter(serviceName, config) {
  return rateLimiter(serviceName, config);
}

/*****************************************************************************************
 * SECTION 12: Per Endpoint Limiter
 *****************************************************************************************/

function endpointRateLimiter(serviceName, endpoint, config) {
  return function (req, res, next) {
    const ip = getClientIP(req);
    const user =
      req.user?.id ||
      req.headers["x-user-id"] ||
      "ANON";

    const key = buildRateLimitKey({
      service: serviceName,
      endpoint,
      ip,
      user,
    });

    const result = evaluateRateLimit(key, {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config,
    });

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: "Endpoint rate limit exceeded",
        endpoint,
      });
    }

    next();
  };
}

/*****************************************************************************************
 * SECTION 13: Admin / Debug Helpers
 *****************************************************************************************/

function getRateLimiterStats() {
  return {
    slidingWindowKeys: slidingWindowStore.size,
    tokenBuckets: tokenBucketStore.size,
    blockedKeys: blockedStore.size,
  };
}

function resetRateLimiter() {
  slidingWindowStore.clear();
  tokenBucketStore.clear();
  blockedStore.clear();
}

/*****************************************************************************************
 * SECTION 14: Example Usage (Commented)
 *****************************************************************************************/

/*
const express = require("express");
const app = express();

app.use("/api", serviceRateLimiter("MEDIA_SERVICE", {
  maxRequests: 200,
}));

app.post(
  "/api/login",
  endpointRateLimiter("AUTH_SERVICE", "/login", {
    maxRequests: 5,
    windowMs: 60 * 1000,
  }),
  loginHandler
);

app.listen(3000);
*/

/*****************************************************************************************
 * SECTION 15: Exports
 *****************************************************************************************/

module.exports = {
  rateLimiter,
  serviceRateLimiter,
  endpointRateLimiter,
  getRateLimiterStats,
  resetRateLimiter,
};
