"use strict";

const featureService = require("../services/featureFlag.service");

module.exports = (flagKey) => {
  return async (req, res, next) => {
    const enabled = await featureService.isEnabled(flagKey, {
      userId: req.user?.id,
    });

    if (!enabled) {
      return res.status(403).json({
        success: false,
        message: "Feature is currently disabled",
      });
    }

    next();
  };
};
