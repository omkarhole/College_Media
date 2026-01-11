const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait.',
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP attempts. Please request a new OTP.',
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
});

module.exports = {
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
};
