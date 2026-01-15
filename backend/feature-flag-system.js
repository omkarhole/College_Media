/**
 * ============================================================
 * FEATURE FLAG MANAGEMENT SYSTEM – NODE.JS
 * Issue: No Feature Flag Management System (#714)
 * ============================================================
 */

'use strict';

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  PORT: process.env.PORT || 3000,
  ENV: process.env.NODE_ENV || 'production',
};

/* ============================================================
   FEATURE FLAG STORE (IN-MEMORY)
============================================================ */
const flags = {
  newUI: {
    enabled: false,
    rollout: 0, // percentage
    environments: ['production', 'staging'],
  },
  betaSearch: {
    enabled: true,
    rollout: 50,
    environments: ['staging'],
  },
};

/* ============================================================
   AUDIT LOG
============================================================ */
const auditLogs = [];

/* ============================================================
   UTILS
============================================================ */
function hashUser(userId) {
  const hash = crypto.createHash('sha1').update(userId).digest('hex');
  return parseInt(hash.substring(0, 2), 16) % 100;
}

function logAudit(action, flag, value) {
  auditLogs.push({
    action,
    flag,
    value,
    timestamp: new Date().toISOString(),
  });
}

/* ============================================================
   FLAG EVALUATION
============================================================ */
function isEnabled(flagName, context = {}) {
  const flag = flags[flagName];
  if (!flag) return false;

  if (!flag.enabled) return false;

  if (!flag.environments.includes(CONFIG.ENV)) return false;

  if (context.userId && flag.rollout < 100) {
    return hashUser(context.userId) < flag.rollout;
  }

  return true;
}

/* ============================================================
   MIDDLEWARE
============================================================ */
function featureFlag(flagName) {
  return (req, res, next) => {
    const enabled = isEnabled(flagName, {
      userId: req.headers['x-user-id'] || 'anon',
    });

    if (!enabled) {
      return res.status(403).json({
        error: `Feature ${flagName} is disabled`,
      });
    }
    next();
  };
}

/* ============================================================
   FEATURED ROUTES
============================================================ */
app.get('/feature/new-ui', featureFlag('newUI'), (req, res) => {
  res.json({ message: 'New UI feature enabled' });
});

app.get('/feature/beta-search', featureFlag('betaSearch'), (req, res) => {
  res.json({ message: 'Beta search enabled' });
});

/* ============================================================
   ADMIN ROUTES
============================================================ */
app.get('/admin/flags', (req, res) => {
  res.json(flags);
});

app.post('/admin/flags/:name', (req, res) => {
  const { name } = req.params;
  const { enabled, rollout, environments } = req.body;

  if (!flags[name]) {
    flags[name] = {
      enabled: false,
      rollout: 0,
      environments: ['production'],
    };
  }

  if (typeof enabled === 'boolean') flags[name].enabled = enabled;
  if (typeof rollout === 'number') flags[name].rollout = rollout;
  if (Array.isArray(environments)) flags[name].environments = environments;

  logAudit('UPDATE', name, flags[name]);

  res.json({ message: 'Flag updated', flag: flags[name] });
});

app.delete('/admin/flags/:name', (req, res) => {
  delete flags[req.params.name];
  logAudit('DELETE', req.params.name, null);
  res.json({ deleted: true });
});

app.get('/admin/audit-logs', (req, res) => {
  res.json(auditLogs);
});

/* ============================================================
   HEALTH
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    flagsCount: Object.keys(flags).length,
  });
});

/* ============================================================
   SERVER
============================================================ */
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Feature Flag system running on port ${CONFIG.PORT}`);
});
