/**
 * ============================================================
 * SLA / SLO IMPLEMENTATION – NODE.JS
 * Issue: No SLA / SLO Definitions (#705)
 * ============================================================
 */

'use strict';

const express = require('express');
const app = express();

app.use(express.json());

/* ============================================================
   SECTION 1: SLA & SLO DEFINITIONS
============================================================ */
const SLA = {
  availability: 99.9,
  latency_p95_ms: 500,
  error_rate_percent: 1,
};

const SLO = {
  availability: 99.95,
  latency_p95_ms: 400,
  error_rate_percent: 0.5,
};

/* ============================================================
   SECTION 2: METRICS STORE (SLIs)
============================================================ */
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  latencies: [],
  startTime: Date.now(),
};

/* ============================================================
   SECTION 3: UTILS
============================================================ */
function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

function availability() {
  if (metrics.totalRequests === 0) return 100;
  return (metrics.successfulRequests / metrics.totalRequests) * 100;
}

function errorRate() {
  if (metrics.totalRequests === 0) return 0;
  return (metrics.failedRequests / metrics.totalRequests) * 100;
}

function errorBudgetRemaining() {
  const allowedErrors =
    (1 - SLO.availability / 100) * metrics.totalRequests;
  return Math.max(allowedErrors - metrics.failedRequests, 0);
}

/* ============================================================
   SECTION 4: METRICS MIDDLEWARE
============================================================ */
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - start;

    metrics.totalRequests++;
    metrics.latencies.push(latency);

    if (res.statusCode >= 500) {
      metrics.failedRequests++;
    } else {
      metrics.successfulRequests++;
    }
  });

  next();
});

/* ============================================================
   SECTION 5: SAMPLE API
============================================================ */
app.get('/api/data', async (req, res) => {
  await new Promise((r) => setTimeout(r, Math.random() * 300));
  res.json({ data: 'ok' });
});

app.get('/api/error', async (req, res) => {
  await new Promise((r) => setTimeout(r, 200));
  res.status(500).json({ error: 'failure' });
});

/* ============================================================
   SECTION 6: HEALTH CHECK
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime_seconds: Math.floor(
      (Date.now() - metrics.startTime) / 1000
    ),
  });
});

/* ============================================================
   SECTION 7: SLA / SLO STATUS
============================================================ */
app.get('/slo/status', (req, res) => {
  const p95 = percentile(metrics.latencies, 95);

  res.json({
    availability: availability(),
    latency_p95_ms: p95,
    error_rate_percent: errorRate(),
    error_budget_remaining: errorBudgetRemaining(),

    slo_breached:
      availability() < SLO.availability ||
      p95 > SLO.latency_p95_ms ||
      errorRate() > SLO.error_rate_percent,
  });
});

/* ============================================================
   SECTION 8: SLA / SLO DEFINITIONS ENDPOINT
============================================================ */
app.get('/slo/definitions', (req, res) => {
  res.json({
    sla: SLA,
    slo: SLO,
  });
});

/* ============================================================
   SECTION 9: METRICS RESET (ADMIN)
============================================================ */
app.post('/admin/metrics/reset', (req, res) => {
  metrics.totalRequests = 0;
  metrics.successfulRequests = 0;
  metrics.failedRequests = 0;
  metrics.latencies = [];
  metrics.startTime = Date.now();

  res.json({ message: 'Metrics reset' });
});

/* ============================================================
   SECTION 10: SERVER START
============================================================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 SLA/SLO monitor running on port ${PORT}`
  );
});

/* ============================================================
   END OF FILE (~300 LINES)
============================================================ */
