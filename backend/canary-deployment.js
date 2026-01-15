/**
 * ============================================================
 * CANARY DEPLOYMENT STRATEGY – NODE.JS
 * Issue: No Canary Deployment Strategy (#710)
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

  CANARY_ENABLED: true,
  CANARY_PERCENTAGE: 10, // % traffic to canary

  THRESHOLDS: {
    MAX_ERROR_RATE: 5, // %
    MAX_P95_LATENCY_MS: 800,
  },

  METRICS_WINDOW_MS: 60 * 1000,
};

/* ============================================================
   METRICS STORE
============================================================ */
const metrics = {
  stable: { req: 0, err: 0, lat: [] },
  canary: { req: 0, err: 0, lat: [] },
  lastReset: Date.now(),
};

/* ============================================================
   UTILS
============================================================ */
function hashToBucket(value) {
  const hash = crypto.createHash('sha1').update(value).digest('hex');
  return parseInt(hash.slice(0, 2), 16) % 100;
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, i)];
}

function errorRate(track) {
  const m = metrics[track];
  return m.req ? (m.err / m.req) * 100 : 0;
}

function resetWindowIfNeeded() {
  if (Date.now() - metrics.lastReset > CONFIG.METRICS_WINDOW_MS) {
    metrics.stable = { req: 0, err: 0, lat: [] };
    metrics.canary = { req: 0, err: 0, lat: [] };
    metrics.lastReset = Date.now();
  }
}

/* ============================================================
   CANARY ROUTING
============================================================ */
function routeToCanary(req) {
  if (!CONFIG.CANARY_ENABLED) return false;
  const key = req.headers['x-user-id'] || req.ip || crypto.randomUUID();
  return hashToBucket(key) < CONFIG.CANARY_PERCENTAGE;
}

/* ============================================================
   METRICS MIDDLEWARE
============================================================ */
app.use((req, res, next) => {
  resetWindowIfNeeded();
  const start = Date.now();
  const isCanary = routeToCanary(req);
  req.release = isCanary ? 'canary' : 'stable';

  res.on('finish', () => {
    const d = Date.now() - start;
    const m = metrics[req.release];
    m.req++;
    m.lat.push(d);
    if (res.statusCode >= 500) m.err++;
  });

  next();
});

/* ============================================================
   APIs
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    release: req.release,
    canaryEnabled: CONFIG.CANARY_ENABLED,
    trafficPercent: CONFIG.CANARY_PERCENTAGE,
  });
});

app.get('/api/data', async (req, res) => {
  if (req.release === 'canary') {
    await new Promise(r => setTimeout(r, 300));
    return res.json({ release: 'canary', version: '1.1.0', data: [1, 2, 3] });
  }
  await new Promise(r => setTimeout(r, 120));
  res.json({ release: 'stable', version: '1.0.0', data: [1, 2] });
});

app.get('/api/fail-canary', async (req, res) => {
  if (req.release === 'canary') {
    await new Promise(r => setTimeout(r, 200));
    return res.status(500).json({ error: 'canary failure' });
  }
  res.json({ ok: true });
});

/* ============================================================
   AUTO ROLLBACK
============================================================ */
function autoRollback() {
  const er = errorRate('canary');
  const p95 = percentile(metrics.canary.lat, 95);

  if (
    er > CONFIG.THRESHOLDS.MAX_ERROR_RATE ||
    p95 > CONFIG.THRESHOLDS.MAX_P95_LATENCY_MS
  ) {
    CONFIG.CANARY_ENABLED = false;
  }
}

setInterval(autoRollback, 5000);

/* ============================================================
   ADMIN CONTROLS
============================================================ */
app.post('/admin/canary/enable', (req, res) => {
  CONFIG.CANARY_ENABLED = true;
  res.json({ enabled: true });
});

app.post('/admin/canary/disable', (req, res) => {
  CONFIG.CANARY_ENABLED = false;
  res.json({ enabled: false });
});

app.post('/admin/canary/traffic', (req, res) => {
  const { percent } = req.body;
  if (percent < 0 || percent > 100) {
    return res.status(400).json({ error: 'invalid percent' });
  }
  CONFIG.CANARY_PERCENTAGE = percent;
  res.json({ percent });
});

app.get('/admin/metrics', (req, res) => {
  res.json({
    stable: {
      req: metrics.stable.req,
      errRate: errorRate('stable'),
      p95: percentile(metrics.stable.lat, 95),
    },
    canary: {
      req: metrics.canary.req,
      errRate: errorRate('canary'),
      p95: percentile(metrics.canary.lat, 95),
    },
  });
});

/* ============================================================
   SERVER
============================================================ */
app.listen(CONFIG.PORT, () => {
  console.log(`Canary server running on ${CONFIG.PORT}`);
});
