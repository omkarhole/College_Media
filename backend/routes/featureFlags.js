"use strict";

const express = require("express");
const router = express.Router();
const FeatureFlag = require("../models/FeatureFlag");

// CREATE / UPDATE FLAG
router.post("/", async (req, res) => {
  const { key, enabled, environments, rolloutPercentage, description } =
    req.body;

  const flag = await FeatureFlag.findOneAndUpdate(
    { key },
    { enabled, environments, rolloutPercentage, description },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: flag });
});

// LIST FLAGS
router.get("/", async (req, res) => {
  const flags = await FeatureFlag.find();
  res.json({ success: true, data: flags });
});

module.exports = router;
