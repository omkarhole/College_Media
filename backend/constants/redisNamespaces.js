"use strict";

/**
 * Redis Key Namespaces
 * Format: app:env:module:identifier
 */

const APP_NAME = "college-media";
const ENV = process.env.NODE_ENV || "development";

const base = `${APP_NAME}:${ENV}`;

module.exports = {
  AUTH_SESSION: `${base}:auth:session`,
  REFRESH_TOKEN: `${base}:auth:refresh`,
  USER_PROFILE: `${base}:user:profile`,
  SEARCH_CACHE: `${base}:search`,
  RATE_LIMIT: `${base}:ratelimit`,
  FEATURE_FLAG: `${base}:feature-flag`,
};
