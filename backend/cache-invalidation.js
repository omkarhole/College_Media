/**
 * ============================================================
 * CACHE INVALIDATION STRATEGY – NODE.JS
 * Issue: No Cache Invalidation Strategy (#715)
 * File: cache-invalidation.js
 * ============================================================
 */

'use strict';

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

/* ============================================================
   IN-MEMORY CACHE STORE
============================================================ */
class CacheStore {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  del(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }
}

const cache = new CacheStore();

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  PORT: process.env.PORT || 3000,
  DEFAULT_TTL_MS: 60 * 1000, // 1 minute
};

/* ============================================================
   MOCK DATABASE
============================================================ */
const db = {
  users: {},
};

function generateId() {
  return crypto.randomBytes(6).toString('hex');
}

/* ============================================================
   CACHE KEYS
============================================================ */
function userCacheKey(id) {
  return `user:${id}`;
}

const userListKey = 'users:list';

/* ============================================================
   CACHE MIDDLEWARE (READ-THROUGH)
============================================================ */
function cacheMiddleware(keyFn, ttl = CONFIG.DEFAULT_TTL_MS) {
  return (req, res, next) => {
    const key = keyFn(req);
    const cached = cache.get(key);

    if (cached) {
      return res.json({
        source: 'cache',
        data: cached,
      });
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, ttl);
      res.sendResponse({
        source: 'db',
        data: body,
      });
    };

    next();
  };
}

/* ============================================================
   ROUTES
============================================================ */

// CREATE (invalidate list cache)
app.post('/users', (req, res) => {
  const id = generateId();
  const user = { id, ...req.body };

  db.users[id] = user;

  cache.del(userListKey); // event-based invalidation

  res.status(201).json(user);
});

// READ ALL (cached with TTL)
app.get(
  '/users',
  cacheMiddleware(() => userListKey, 30 * 1000),
  (req, res) => {
    res.json(Object.values(db.users));
  }
);

// READ ONE (cached with TTL)
app.get(
  '/users/:id',
  cacheMiddleware((req) => userCacheKey(req.params.id), 60 * 1000),
  (req, res) => {
    const user = db.users[req.params.id];
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  }
);

// UPDATE (invalidate item + list cache)
app.put('/users/:id', (req, res) => {
  const user = db.users[req.params.id];
  if (!user) return res.status(404).json({ error: 'Not found' });

  db.users[req.params.id] = { ...user, ...req.body };

  cache.del(userCacheKey(req.params.id));
  cache.del(userListKey);

  res.json(db.users[req.params.id]);
});

// DELETE (invalidate item + list cache)
app.delete('/users/:id', (req, res) => {
  if (!db.users[req.params.id])
    return res.status(404).json({ error: 'Not found' });

  delete db.users[req.params.id];

  cache.del(userCacheKey(req.params.id));
  cache.del(userListKey);

  res.json({ deleted: true });
});

/* ============================================================
   ADMIN CACHE CONTROLS
============================================================ */
app.post('/admin/cache/clear', (req, res) => {
  cache.clear();
  res.json({ cleared: true });
});

/* ============================================================
   HEALTH
============================================================ */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    cacheEntries: cache.store.size,
  });
});

/* ============================================================
   SERVER
============================================================ */
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Cache Invalidation server running on ${CONFIG.PORT}`);
});
