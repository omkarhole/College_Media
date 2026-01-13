/**
 * =====================================================================
 * Redis Manager – Centralized Cache, Namespace & TTL Controller
 * =====================================================================
 * ✔ Centralized Redis client
 * ✔ Configurable namespaces
 * ✔ Configurable TTLs
 * ✔ Safe JSON serialization
 * ✔ Cache wrapper helpers
 * ✔ Invalidation utilities
 * ✔ Observability hooks
 * ✔ Production hardened
 * =====================================================================
 */

"use strict";

/* =====================================================================
   📦 DEPENDENCIES
===================================================================== */
const Redis = require("ioredis");
const crypto = require("crypto");
const os = require("os");

/* =====================================================================
   ⚙️ ENVIRONMENT
===================================================================== */
const ENV = process.env.NODE_ENV || "development";
const APP_NAME = "college-media";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

/* =====================================================================
   🧠 NAMESPACE DEFINITIONS
   Format: app:env:domain:identifier
===================================================================== */
const NAMESPACES = Object.freeze({
  AUTH_SESSION: "auth:session",
  REFRESH_TOKEN: "auth:refresh",
  USER_PROFILE: "user:profile",
  USER_SETTINGS: "user:settings",
  SEARCH_CACHE: "search",
  RATE_LIMIT: "ratelimit",
  FEATURE_FLAG: "feature-flag",
  AUDIT_LOG: "audit",
  GENERIC: "generic",
});

/* =====================================================================
   ⏱️ TTL CONFIGURATION (SECONDS)
===================================================================== */
const TTL = Object.freeze({
  AUTH_SESSION: Number(process.env.REDIS_TTL_AUTH_SESSION || 3600), // 1h
  REFRESH_TOKEN: Number(process.env.REDIS_TTL_REFRESH || 604800), // 7d
  USER_PROFILE: Number(process.env.REDIS_TTL_USER || 600), // 10m
  USER_SETTINGS: Number(process.env.REDIS_TTL_USER_SETTINGS || 1800),
  SEARCH_CACHE: Number(process.env.REDIS_TTL_SEARCH || 300),
  FEATURE_FLAG: Number(process.env.REDIS_TTL_FEATURE_FLAG || 60),
  RATE_LIMIT: Number(process.env.REDIS_TTL_RATE_LIMIT || 60),
  AUDIT_LOG: Number(process.env.REDIS_TTL_AUDIT || 86400),
  GENERIC: Number(process.env.REDIS_TTL_GENERIC || 120),
});

/* =====================================================================
   🔌 REDIS CLIENT (SINGLETON)
===================================================================== */
const redis = new Redis(REDIS_URL, {
  enableReadyCheck: true,
  maxRetriesPerRequest: 5,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

/* =====================================================================
   📡 REDIS EVENTS
===================================================================== */
redis.on("connect", () => {
  console.log("[Redis] Connected");
});

redis.on("ready", () => {
  console.log("[Redis] Ready");
});

redis.on("error", (err) => {
  console.error("[Redis] Error", err);
});

redis.on("close", () => {
  console.warn("[Redis] Connection closed");
});

/* =====================================================================
   🧩 UTILITY HELPERS
===================================================================== */
const buildKey = (namespace, identifier) => {
  return `${APP_NAME}:${ENV}:${namespace}:${identifier}`;
};

const hash = (value) => {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

/* =====================================================================
   🧠 REDIS MANAGER CLASS
===================================================================== */
class RedisManager {
  constructor(client) {
    this.client = client;
  }

  /* ================================================================
     📥 SET
  ================================================================= */
  async set({ namespace, id, value, ttlKey, overwrite = true }) {
    if (!namespace || !id) {
      throw new Error("Redis set requires namespace and id");
    }

    const ttl = TTL[ttlKey] || TTL.GENERIC;
    const key = buildKey(namespace, id);
    const payload = safeStringify({
      data: value,
      meta: {
        cachedAt: Date.now(),
        host: os.hostname(),
      },
    });

    if (!payload) return;

    if (!overwrite) {
      const exists = await this.client.exists(key);
      if (exists) return;
    }

    await this.client.set(key, payload, "EX", ttl);
  }

  /* ================================================================
     📤 GET
  ================================================================= */
  async get({ namespace, id }) {
    if (!namespace || !id) return null;

    const key = buildKey(namespace, id);
    const raw = await this.client.get(key);
    if (!raw) return null;

    const parsed = safeParse(raw);
    return parsed?.data ?? null;
  }

  /* ================================================================
     ❌ DELETE SINGLE KEY
  ================================================================= */
  async del({ namespace, id }) {
    const key = buildKey(namespace, id);
    await this.client.del(key);
  }

  /* ================================================================
     🧹 INVALIDATE ENTIRE NAMESPACE
  ================================================================= */
  async invalidateNamespace(namespace) {
    const pattern = `${APP_NAME}:${ENV}:${namespace}:*`;
    const keys = await this.client.keys(pattern);

    if (keys.length) {
      await this.client.del(keys);
    }
  }

  /* ================================================================
     🔁 GET OR SET (CACHE WRAPPER)
  ================================================================= */
  async getOrSet({ namespace, id, ttlKey, fetcher }) {
    const cached = await this.get({ namespace, id });
    if (cached) return cached;

    const fresh = await fetcher();
    if (fresh !== undefined) {
      await this.set({
        namespace,
        id,
        value: fresh,
        ttlKey,
      });
    }
    return fresh;
  }

  /* ================================================================
     📊 METRICS
  ================================================================= */
  async stats() {
    const info = await this.client.info();
    return {
      connected: this.client.status === "ready",
      info,
    };
  }

  /* ================================================================
     🔒 SAFE RATE LIMIT COUNTER
  ================================================================= */
  async incrementRateLimit({ key, limit, windowSec }) {
    const redisKey = buildKey(NAMESPACES.RATE_LIMIT, hash(key));

    const count = await this.client.incr(redisKey);
    if (count === 1) {
      await this.client.expire(redisKey, windowSec);
    }

    return {
      allowed: count <= limit,
      count,
      limit,
    };
  }

  /* ================================================================
     🔐 TOKEN BLACKLIST SUPPORT
  ================================================================= */
  async blacklistToken(token, ttlSec) {
    const tokenHash = hash(token);
    const key = buildKey(NAMESPACES.AUTH_SESSION, `blacklist:${tokenHash}`);
    await this.client.set(key, "1", "EX", ttlSec);
  }

  async isTokenBlacklisted(token) {
    const tokenHash = hash(token);
    const key = buildKey(NAMESPACES.AUTH_SESSION, `blacklist:${tokenHash}`);
    return Boolean(await this.client.exists(key));
  }

  /* ================================================================
     🧪 HEALTH CHECK
  ================================================================= */
  async healthCheck() {
    try {
      await this.client.ping();
      return { status: "healthy" };
    } catch (err) {
      return { status: "unhealthy", error: err.message };
    }
  }
}

/* =====================================================================
   🚀 EXPORT SINGLETON
===================================================================== */
const redisManager = new RedisManager(redis);

module.exports = {
  redisManager,
  redis,
  NAMESPACES,
  TTL,
};
