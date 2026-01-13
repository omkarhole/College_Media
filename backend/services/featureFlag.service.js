"use strict";

const FeatureFlag = require("../models/FeatureFlag");

class FeatureFlagService {
  async isEnabled(flagKey, context = {}) {
    const flag = await FeatureFlag.findOne({ key: flagKey });
    if (!flag) return false;

    const env = process.env.NODE_ENV || "development";
    if (!flag.environments.includes(env)) return false;

    if (!flag.enabled) return false;

    // Percentage rollout (optional)
    if (flag.rolloutPercentage < 100) {
      const userId = context.userId || "";
      const hash = this._hash(userId + flagKey);
      return hash % 100 < flag.rolloutPercentage;
    }

    return true;
  }

  _hash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

module.exports = new FeatureFlagService();
