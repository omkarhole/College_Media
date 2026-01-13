/**
 * =====================================
 * Scheduled Secret Rotation Job
 * =====================================
 */

const rotationService = require("../services/secretRotation.service");

const ROTATION_INTERVAL_DAYS = 60;
const GRACE_PERIOD_DAYS = 7;

exports.run = () => {
  console.log("⏳ Running secret rotation job");

  rotationService.rotate("JWT_SECRET");

  setTimeout(() => {
    rotationService.revokePrevious("JWT_SECRET");
  }, GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
};
