"use strict";

module.exports = {
  ttl: {
    AUTH_SESSION: Number(process.env.REDIS_TTL_AUTH_SESSION || 60 * 60), // 1h
    REFRESH_TOKEN: Number(process.env.REDIS_TTL_REFRESH || 7 * 24 * 60 * 60), // 7d
    USER_PROFILE: Number(process.env.REDIS_TTL_USER || 10 * 60), // 10 min
    SEARCH_CACHE: Number(process.env.REDIS_TTL_SEARCH || 5 * 60), // 5 min
    FEATURE_FLAG: Number(process.env.REDIS_TTL_FEATURE_FLAG || 60), // 1 min
  },
};
