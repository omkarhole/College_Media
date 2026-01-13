"use strict";

const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    environments: {
      type: [String], // ["development", "staging", "production"]
      default: ["development"],
    },

    rolloutPercentage: {
      type: Number, // 0 - 100
      default: 100,
      min: 0,
      max: 100,
    },

    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeatureFlag", featureFlagSchema);
