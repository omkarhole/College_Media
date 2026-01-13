"use strict";

const redis = require("../utils/redisClient");
const namespaces = require("../constants/redisNamespaces");
const redisConfig = require("../config/redis.config");

class RedisCacheService {
  _key(namespace, id) {
    return `${namespace}:${id}`;
  }

  async set(namespaceKey, id, value, ttlKey) {
    const key = this._key(namespaceKey, id);
    const ttl = redisConfig.ttl[ttlKey];

    if (!ttl) {
      throw new Error(`TTL missing for ${ttlKey}`);
    }

    await redis.set(key, JSON.stringify(value), "EX", ttl);
  }

  async get(namespaceKey, id) {
    const key = this._key(namespaceKey, id);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(namespaceKey, id) {
    const key = this._key(namespaceKey, id);
    await redis.del(key);
  }

  async invalidateNamespace(namespaceKey) {
    const keys = await redis.keys(`${namespaceKey}:*`);
    if (keys.length) {
      await redis.del(keys);
    }
  }
}

module.exports = new RedisCacheService();
