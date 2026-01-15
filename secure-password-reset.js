/**
 * ============================================================
 * SECURE PASSWORD RESET FLOW – NODE.JS
 * Issue: Insecure Password Reset Flow (#712)
 * ============================================================
 */

'use strict';

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  PORT: process.env.PORT || 3000,
  RESET_TOKEN_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
  BCRYPT_ROUNDS: 10,
};

/* ============================================================
   IN-MEMORY USER STORE (MOCK DB)
============================================================ */
const users = {};
const resetTokens = {};

/* ============================================================
   UTILS
============================================================ */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password) {
  return bcrypt.hash(password, CONFIG.BCRYPT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/* ============================================================
   CREATE USER (TESTING)
============================================================ */
app.post('/users', async (req, res) => {
  const { email, password } = req.body;
  const passwordHash = await hashPassword(password);

  users[email] = {
    email,
    passwordHash,
  };

  res.status(201).json({ message: 'User created' });
});

/* ============================================================
   LOGIN (TESTING)
============================================================ */
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful' });
});

/* ============================================================
   REQUEST PASSWORD RESET
============================================================ */
app.post('/auth/password-reset/request', async (req, res) => {
  const { email } = req.body;
  const user = users[email];

  if (!user) {
    return res.json({ message: 'If user exists, reset link sent' });
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  resetTokens[tokenHash] = {
    email,
    expiresAt: Date.now() + CONFIG.RESET_TOKEN_EXPIRY_MS,
    used: false,
  };

  // In real app: send via email
  res.json({
    message: 'Password reset link generated',
    resetLink: `/auth/password-reset/confirm?token=${rawToken}`,
  });
});

/* ============================================================
   CONFIRM PASSWORD RESET
============================================================ */
app.post('/auth/password-reset/confirm', async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenHash = hashToken(token);
  const record = resetTokens[tokenHash];

  if (
    !record ||
    record.used ||
    Date.now() > record.expiresAt
  ) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const user = users[record.email];
  if (!user) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  user.passwordHash = await hashPassword(newPassword);

  // invalidate token
  record.used = true;

  // invalidate all other tokens for user
  Object.keys(resetTokens).forEach((key) => {
    if (resetTokens[key].email === record.email) {
      resetTokens[key].used = true;
    }
  });

  res.json({ message: 'Password reset successful' });
});

/* ============================================================
   HEALTH
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    users: Object.keys(users).length,
    activeResetTokens: Object.values(resetTokens).filter(
      (t) => !t.used && Date.now() < t.expiresAt
    ).length,
  });
});

/* ============================================================
   SERVER
============================================================ */
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Secure password reset server running on ${CONFIG.PORT}`);
});
