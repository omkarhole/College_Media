const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserMongo = require("../models/User");
const UserMock = require("../mockdb/userDB");
const Session = require("../models/Session");

const { validateRegister, validateLogin, checkValidation } = require("../middleware/validationMiddleware");
const { sendPasswordResetOTP } = require("../services/emailService");
const {
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} = require("../middleware/authRateLimiter");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "college_media_secret_key";

// ⚠️ In-memory OTP store
const otpStore = new Map();

/* ---------------- REGISTER ---------------- */
router.post("/register", validateRegister, checkValidation, async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const dbConnection = req.app.get("dbConnection");

    const existingUser = dbConnection?.useMongoDB
      ? await UserMongo.findOne({ $or: [{ email }, { username }] })
      : await UserMock.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = dbConnection?.useMongoDB
      ? await UserMongo.create({ username, email, password: hashedPassword, firstName, lastName })
      : await UserMock.create({ username, email, password: hashedPassword, firstName, lastName });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------- LOGIN (MULTI-SESSION ENABLED) ---------------- */
router.post(
  "/login",
  loginLimiter,
  validateLogin,
  checkValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const dbConnection = req.app.get("dbConnection");

      const user = dbConnection?.useMongoDB
        ? await UserMongo.findOne({ email })
        : await UserMock.findByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // 🔐 CREATE NEW SESSION
      const sessionId = crypto.randomUUID();

      await Session.create({
        userId: user._id,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        isActive: true,
      });

      // 🔑 JWT BOUND TO SESSION
      const token = jwt.sign(
        {
          userId: user._id,
          sessionId,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        data: { token },
        message: "Login successful",
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------- FORGOT PASSWORD ---------------- */
router.post("/forgot-password", otpRequestLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    const dbConnection = req.app.get("dbConnection");
    const user = dbConnection?.useMongoDB
      ? await UserMongo.findOne({ email })
      : await UserMock.findByEmail(email);

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      otpStore.set(email, {
        otp,
        userId: user._id || user.id,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      await sendPasswordResetOTP(email, otp).catch(() => {});
    }

    res.json({
      success: true,
      message: "If an account exists, an OTP has been sent.",
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------- VERIFY OTP ---------------- */
router.post("/verify-otp", otpVerifyLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const data = otpStore.get(email);

    if (!data || data.otp !== otp || Date.now() > data.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const resetToken = jwt.sign(
      { userId: data.userId },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      data: { resetToken },
      message: "OTP verified successfully",
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------- RESET PASSWORD ---------------- */
router.post("/reset-password", passwordResetLimiter, async (req, res, next) => {
  try {
    const { resetToken, newPassword, email } = req.body;
    const decoded = jwt.verify(resetToken, JWT_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const dbConnection = req.app.get("dbConnection");

    if (dbConnection?.useMongoDB) {
      await UserMongo.findByIdAndUpdate(decoded.userId, { password: hashedPassword });
    } else {
      await UserMock.updatePassword(decoded.userId, hashedPassword);
    }

    otpStore.delete(email);

    // 🔥 LOGOUT ALL SESSIONS AFTER PASSWORD CHANGE
    await Session.updateMany(
      { userId: decoded.userId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: "Password reset successful. All sessions revoked.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
