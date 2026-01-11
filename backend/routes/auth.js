const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const UserMongo = require('../models/User');
const UserMock = require('../mockdb/userDB');
const { validateRegister, validateLogin, checkValidation } = require('../middleware/validationMiddleware');
const { sendPasswordResetOTP } = require('../services/emailService');
const {
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} = require('../middleware/authRateLimiter');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

// ⚠️ In-memory OTP store (NOTE: Redis recommended for production)
const otpStore = new Map();

/* ---------------- JWT VERIFY MIDDLEWARE ---------------- */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Invalid token.',
    });
  }
};

/* ---------------- REGISTER ---------------- */
router.post('/register', validateRegister, checkValidation, async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const dbConnection = req.app.get('dbConnection');

    if (dbConnection?.useMongoDB) {
      const existingUser = await UserMongo.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'User with this email or username already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await UserMongo.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        data: { ...newUser.toObject(), token },
        message: 'User registered successfully',
      });
    }

    const newUser = await UserMock.create({ username, email, password, firstName, lastName });
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: { ...newUser, token },
      message: 'User registered successfully',
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------- LOGIN (BRUTE FORCE PROTECTED) ---------------- */
router.post(
  '/login',
  loginLimiter,
  validateLogin,
  checkValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const dbConnection = req.app.get('dbConnection');

      const user = dbConnection?.useMongoDB
        ? await UserMongo.findOne({ email })
        : await UserMock.findByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid credentials',
        });
      }

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        data: { ...user, token },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ---------------- FORGOT PASSWORD (OTP SPAM PROTECTED) ---------------- */
router.post('/forgot-password', otpRequestLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, data: null, message: 'Email is required' });
    }

    const dbConnection = req.app.get('dbConnection');
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
      data: null,
      message: 'If an account exists, an OTP has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------- VERIFY OTP (GUESSING BLOCKED) ---------------- */
router.post('/verify-otp', otpVerifyLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const data = otpStore.get(email);

    if (!data || data.otp !== otp || Date.now() > data.expiresAt) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid or expired OTP',
      });
    }

    const resetToken = jwt.sign(
      { userId: data.userId, email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      data: { resetToken },
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------- RESET PASSWORD (TOKEN BRUTE FORCE BLOCKED) ---------------- */
router.post('/reset-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const { resetToken, newPassword, email } = req.body;
    const decoded = jwt.verify(resetToken, JWT_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const dbConnection = req.app.get('dbConnection');

    if (dbConnection?.useMongoDB) {
      await UserMongo.findByIdAndUpdate(decoded.userId, { password: hashedPassword });
    } else {
      await UserMock.updatePassword(decoded.userId, hashedPassword);
    }

    otpStore.delete(email);

    res.json({
      success: true,
      data: null,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
