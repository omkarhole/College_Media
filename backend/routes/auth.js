"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");

const UserMongo = require("../models/User");
const UserMock = require("../mockdb/userDB");
const Session = require("../models/Session");

const {
  validateRegister,
  validateLogin,
  checkValidation,
} = require("../middleware/validationMiddleware");

const {
  authLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  apiLimiter,
} = require("../middleware/rateLimitMiddleware");

const {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidName,
  isValidOTP,
} = require("../utils/validators");

const logger = require("../utils/logger");
const passport = require("../config/passport");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "college_media_secret_key";

/* ============================================================
   🔐 SESSION HELPERS
============================================================ */
async function revokeOldSessions(userId, reason = "concurrency_limit") {
  await Session.updateMany(
    { userId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
}

async function createSession(userId, req) {
  const sessionId = crypto.randomUUID();

  await Session.create({
    userId,
    sessionId,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    isActive: true,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    correlationId: req.correlationId,
  });

  return sessionId;
}

/* ============================================================
   🔑 JWT VERIFY (SINGLE SOURCE)
============================================================ */
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;

    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: "Session expired" });
    }

    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

/* ============================================================
   📝 REGISTER
============================================================ */
router.post(
  "/register",
  registerLimiter,
  validateRegister,
  checkValidation,
  async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      if (!isValidEmail(email)) throw new Error("Invalid email");
      if (!isValidUsername(username)) throw new Error("Invalid username");

      const pwdCheck = isValidPassword(password);
      if (!pwdCheck.valid) throw new Error(pwdCheck.message);

      const existing = await UserMongo.findOne({
        $or: [{ email }, { username }],
      });

      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await UserMongo.create({
        username,
        email,
        password: hashed,
        firstName,
        lastName,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { id: user._id },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ============================================================
   🔓 LOGIN (PASSWORD)
============================================================ */
router.post(
  "/login",
  authLimiter,
  validateLogin,
  checkValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await UserMongo.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid credentials" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid credentials" });
      }

      // 🔐 2FA check
      if (user.twoFactorEnabled) {
        return res.json({
          success: true,
          requiresTwoFactor: true,
          userId: user._id,
        });
      }

      // 🔒 Enforce single session
      await revokeOldSessions(user._id);

      const sessionId = await createSession(user._id, req);

      const token = jwt.sign(
        { userId: user._id, sessionId },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Login successful",
        data: { token },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ============================================================
   🔐 2FA VERIFY LOGIN
============================================================ */
router.post("/2fa/verify-login", async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    const user = await UserMongo.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ success: false });
    }

    await revokeOldSessions(user._id);
    const sessionId = await createSession(user._id, req);

    const jwtToken = jwt.sign(
      { userId: user._id, sessionId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "2FA login successful",
      data: { token: jwtToken },
    });
  } catch (err) {
    next(err);
  }
});

/* ============================================================
   🚪 LOGOUT
============================================================ */
router.post("/logout", verifyToken, apiLimiter, async (req, res) => {
  await Session.updateOne(
    { sessionId: req.sessionId },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: "logout",
      },
    }
  );

  res.json({ success: true, message: "Logged out successfully" });
});

/* ============================================================
   📤 EXPORT
============================================================ */
module.exports = router;
