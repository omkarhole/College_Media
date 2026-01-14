"use strict";

const mongoose = require("mongoose");

/**
 * ============================================================
 * Session Schema – Advanced User Session Management
 * ============================================================
 * ✔ Session concurrency control
 * ✔ Device & location tracking
 * ✔ Session revocation support
 * ✔ Idle & absolute expiry
 * ✔ Security flags
 * ✔ Audit & observability ready
 * ============================================================
 */

const sessionSchema = new mongoose.Schema(
  {
    /* ========================================================
       🔑 CORE IDENTIFIERS
    ======================================================== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /* ========================================================
       🌍 CLIENT CONTEXT
    ======================================================== */
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },

    userAgent: {
      type: String,
      required: true,
    },

    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet", "unknown"],
      default: "unknown",
    },

    deviceId: {
      type: String,
      default: null,
    },

    /* ========================================================
       🕒 SESSION STATE
    ======================================================== */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedReason: {
      type: String,
      enum: [
        "logout",
        "concurrency_limit",
        "password_change",
        "admin_action",
        "security_violation",
        "expired",
      ],
      default: null,
    },

    /* ========================================================
       ⏱️ ACTIVITY TRACKING
    ======================================================== */
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    idleTimeoutMinutes: {
      type: Number,
      default: 30,
    },

    /* ========================================================
       🔐 SECURITY METADATA
    ======================================================== */
    isMfaVerified: {
      type: Boolean,
      default: false,
    },

    riskScore: {
      type: Number,
      default: 0, // can be increased on suspicious behavior
    },

    isTrustedDevice: {
      type: Boolean,
      default: false,
    },

    /* ========================================================
       🔍 OBSERVABILITY / AUDIT
    ======================================================== */
    correlationId: {
      type: String,
      default: null,
    },

    createdByIp: {
      type: String,
    },

    lastSeenIp: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ============================================================
   📌 INDEXES (PERFORMANCE + SCALE)
============================================================ */
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ lastActiveAt: -1 });

/* ============================================================
   🧠 INSTANCE METHODS
============================================================ */

/**
 * Mark session as active and update activity metadata
 */
sessionSchema.methods.touch = function (ip) {
  this.lastActiveAt = new Date();
  this.lastSeenIp = ip;
  return this.save();
};

/**
 * Revoke session safely
 */
sessionSchema.methods.revoke = function (reason = "logout") {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

/**
 * Check if session is expired
 */
sessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

/* ============================================================
   🧩 STATIC METHODS
============================================================ */

/**
 * Revoke all active sessions for a user
 */
sessionSchema.statics.revokeAllForUser = function (
  userId,
  reason = "concurrency_limit"
) {
  return this.updateMany(
    { userId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

/**
 * Cleanup expired sessions manually (backup for TTL)
 */
sessionSchema.statics.cleanupExpiredSessions = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

/* ============================================================
   📤 EXPORT
============================================================ */
module.exports = mongoose.model("Session", sessionSchema);
