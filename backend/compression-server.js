/**
 * ============================================================
 * GZIP + BROTLI COMPRESSION – NODE.JS (PRODUCTION READY)
 * ============================================================
 * Issue: Missing Gzip / Brotli Compression (#707)
 * Repo: College_Media
 * ============================================================
 */

'use strict';

/* ============================================================
   SECTION 1: IMPORTS
============================================================ */
const express = require('express');
const zlib = require('zlib');
const stream = require('stream');
const os = require('os');

/* ============================================================
   SECTION 2: APP INIT
============================================================ */
const app = express();
app.use(express.json());

/* ============================================================
   SECTION 3: CONFIGURATION
============================================================ */
const CONFIG = {
  PORT: process.env.PORT || 3000,

  // Compression settings
  ENABLE_GZIP: true,
  ENABLE_BROTLI: true,

  MIN_SIZE_TO_COMPRESS: 1024, // bytes (1KB)
  GZIP_LEVEL: zlib.constants.Z_BEST_SPEED,
  BROTLI_QUALITY: 5,

  EXCLUDED_CONTENT_TYPES: [
    'image/',
    'video/',
    'audio/',
    'application/zip',
    'application/octet-stream',
  ],
};

/* ============================================================
   SECTION 4: UTILITY FUNCTIONS
============================================================ */
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function isCompressible(contentType = '') {
  return !CONFIG.EXCLUDED_CONTENT_TYPES.some((type) =>
    contentType.includes(type)
  );
}

function clientSupportsBrotli(req) {
  return req.headers['accept-encoding']?.includes('br');
}

function clientSupportsGzip(req) {
  return req.headers['accept-encoding']?.includes('gzip');
}

/* ============================================================
   SECTION 5: RESPONSE INTERCEPTOR MIDDLEWARE
============================================================ */
app.use((req, res, next) => {
  let originalSend = res.send;

  res.send = function (body) {
    try {
      const contentType = res.getHeader('Content-Type') || '';
      const bodySize = Buffer.byteLength(body || '');

      // Skip compression if not eligible
      if (
        !isCompressible(contentType) ||
        bodySize < CONFIG.MIN_SIZE_TO_COMPRESS
      ) {
        return originalSend.call(this, body);
      }

      // Brotli preferred
      if (CONFIG.ENABLE_BROTLI && clientSupportsBrotli(req)) {
        const compressed = zlib.brotliCompressSync(
          Buffer.from(body),
          {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]:
                CONFIG.BROTLI_QUALITY,
            },
          }
        );

        res.setHeader('Content-Encoding', 'br');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Length', compressed.length);

        return originalSend.call(this, compressed);
      }

      // Fallback to Gzip
      if (CONFIG.ENABLE_GZIP && clientSupportsGzip(req)) {
        const compressed = zlib.gzipSync(Buffer.from(body), {
          level: CONFIG.GZIP_LEVEL,
        });

        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Length', compressed.length);

        return originalSend.call(this, compressed);
      }

      // No compression
      return originalSend.call(this, body);
    } catch (err) {
      log(`Compression error: ${err.message}`);
      return originalSend.call(this, body);
    }
  };

  next();
});

/* ============================================================
   SECTION 6: HEALTH CHECK
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    compression: {
      gzip: CONFIG.ENABLE_GZIP,
      brotli: CONFIG.ENABLE_BROTLI,
    },
    uptime: process.uptime(),
  });
});

/* ============================================================
   SECTION 7: LARGE RESPONSE (COMPRESSIBLE)
============================================================ */
app.get('/api/large-data', (req, res) => {
  const data = [];

  for (let i = 0; i < 1000; i++) {
    data.push({
      id: i,
      title: `Post ${i}`,
      content:
        'This is a large text payload used to demonstrate gzip and brotli compression in Node.js applications.',
    });
  }

  res.setHeader('Content-Type', 'application/json');
  res.json(data);
});

/* ============================================================
   SECTION 8: SMALL RESPONSE (NOT COMPRESSED)
============================================================ */
app.get('/api/small-data', (req, res) => {
  res.json({ message: 'Small payload' });
});

/* ============================================================
   SECTION 9: TEXT RESPONSE
============================================================ */
app.get('/api/text', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(
    'This is a plain text response that will be compressed if large enough.'
  );
});

/* ============================================================
   SECTION 10: ADMIN CONTROLS
============================================================ */
app.post('/admin/compression/gzip/enable', (req, res) => {
  CONFIG.ENABLE_GZIP = true;
  res.json({ message: 'Gzip enabled' });
});

app.post('/admin/compression/gzip/disable', (req, res) => {
  CONFIG.ENABLE_GZIP = false;
  res.json({ message: 'Gzip disabled' });
});

app.post('/admin/compression/brotli/enable', (req, res) => {
  CONFIG.ENABLE_BROTLI = true;
  res.json({ message: 'Brotli enabled' });
});

app.post('/admin/compression/brotli/disable', (req, res) => {
  CONFIG.ENABLE_BROTLI = false;
  res.json({ message: 'Brotli disabled' });
});

/* ============================================================
   SECTION 11: METRICS (BASIC)
============================================================ */
app.get('/metrics/compression', (req, res) => {
  res.json({
    gzipEnabled: CONFIG.ENABLE_GZIP,
    brotliEnabled: CONFIG.ENABLE_BROTLI,
    minSize: CONFIG.MIN_SIZE_TO_COMPRESS,
  });
});

/* ============================================================
   SECTION 12: SERVER START
============================================================ */
app.listen(CONFIG.PORT, () => {
  log(
    `🚀 Server started on port ${CONFIG.PORT} | Gzip=${CONFIG.ENABLE_GZIP} | Brotli=${CONFIG.ENABLE_BROTLI}`
  );
});

/* ============================================================
   END OF FILE (~320 LINES)
============================================================ */
