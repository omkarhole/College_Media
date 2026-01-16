const redis = require('redis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const DEFAULT_TTL = 3600; // 1 hour

class CacheService {
    constructor() {
        this.client = redis.createClient({
            url: REDIS_URL
        });

        this.client.on('error', (err) => {
            logger.error('Redis Client Error', err);
        });

        this.client.connect().then(() => {
            logger.info('Connected to Redis Cache');
        }).catch(err => {
            logger.error('Failed to connect to Redis', err);
        });
    }

    /**
     * Get value from cache
     * @param {string} key 
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl Seconds
     */
    async set(key, value, ttl = DEFAULT_TTL) {
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: ttl
            });
            return true;
        } catch (error) {
            logger.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete key from cache
     * @param {string} key 
     */
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache DEL error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Look-aside caching pattern
     * @param {string} key 
     * @param {Function} fetchFn Async function to fetch data if cache miss
     * @param {number} ttl 
     */
    async getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
        const cached = await this.get(key);
        if (cached) {
            return cached;
        }

        const freshData = await fetchFn();
        if (freshData) {
            await this.set(key, freshData, ttl);
        }
        return freshData;
    }
}

// Export singleton
module.exports = new CacheService();
