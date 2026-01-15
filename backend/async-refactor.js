/**
 * ============================================================
 * MODERN ASYNC/AWAIT REFACTOR – NODE.JS
 * Issue: Callback-Based Legacy Code Present (#709)
 * ============================================================
 */

'use strict';

const express = require('express');
const fs = require('fs/promises');
const crypto = require('crypto');
const app = express();

app.use(express.json());

/* ============================================================
   LEGACY CALLBACK CODE (REMOVED / REFACTORED)
============================================================ */
// BEFORE (for reference only – not used):
// fs.readFile('data.json', (err, data) => {
//   if (err) {
//     return callback(err);
//   }
//   processData(data, (err, result) => {
//     if (err) {
//       return callback(err);
//     }
//     saveResult(result, callback);
//   });
// });

/* ============================================================
   MODERN PROMISE UTILITIES
============================================================ */
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

async function readJsonFile(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function processData(data) {
  await delay(100);
  return data.map((item) => ({
    id: generateId(),
    value: item.value * 2,
  }));
}

async function saveJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   CENTRALIZED ERROR HANDLER
============================================================ */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

/* ============================================================
   API ROUTES
============================================================ */
app.post(
  '/api/process',
  asyncHandler(async (req, res) => {
    const inputFile = './input.json';
    const outputFile = './output.json';

    const rawData = await readJsonFile(inputFile);
    const processed = await processData(rawData);
    await saveJsonFile(outputFile, processed);

    res.json({
      status: 'success',
      processedCount: processed.length,
    });
  })
);

app.get(
  '/api/data',
  asyncHandler(async (req, res) => {
    const data = await readJsonFile('./output.json');
    res.json(data);
  })
);

/* ============================================================
   HEALTH CHECK
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    pattern: 'async/await',
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   ERROR MIDDLEWARE
============================================================ */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

/* ============================================================
   SERVER START
============================================================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 Async/Await refactored server running on port ${PORT}`
  );
});

/* ============================================================
   END OF FILE
============================================================ */
