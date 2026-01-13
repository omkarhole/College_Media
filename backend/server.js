/**
 * ============================================================
 *  College Media – Backend Server (HARDENED)
 * ============================================================
 * ✔ Refresh Token Ready
 * ✔ Cookie Security Enabled
 * ✔ Startup Self-Checks
 * ✔ Token Abuse Protection
 * ✔ Graceful Shutdown
 * ✔ Observability Enabled
 * ============================================================
 */

"use strict";

/* ============================================================
   📦 CORE DEPENDENCIES
============================================================ */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const os = require("os");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const passport = require("passport");

/* ============================================================
   🔧 INTERNAL IMPORTS
============================================================ */
const { initDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const logger = require("./utils/logger");

const resumeRoutes = require("./routes/resume");
const uploadRoutes = require("./routes/upload");

const {
  globalLimiter,
  authLimiter,
  searchLimiter,
  adminLimiter,
} = require("./middleware/rateLimiter");

const { slidingWindowLimiter } = require("./middleware/slidingWindowLimiter");
const { warmUpCache } = require("./utils/cache");

/* ============================================================
   📊 OBSERVABILITY
============================================================ */
const metricsMiddleware = require("./middleware/metrics.middleware");
const { client: metricsClient } = require("./utils/metrics");

/* ============================================================
   🌱 ENV SETUP
============================================================ */
dotenv.config();

const ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 5000;
const TRUST_PROXY = process.env.TRUST_PROXY === "true";
const METRICS_TOKEN = process.env.METRICS_TOKEN || "metrics-secret";

const COOKIE_SECURE = ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

/* ============================================================
   🔍 STARTUP ENV CHECK
============================================================ */
logger.info("Environment check", {
  nodeEnv: ENV,
  mistralKeyLoaded: Boolean(process.env.MISTRAL_API_KEY),
});

/* ============================================================
   🚀 APP INIT
============================================================ */
const app = express();
const server = http.createServer(app);

if (TRUST_PROXY) app.set("trust proxy", 1);
app.disable("x-powered-by");

/* ============================================================
   🔐 SECURITY MIDDLEWARE
============================================================ */
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(passport.initialize());

/* ============================================================
   ⏱️ TIMEOUT PROTECTION
============================================================ */
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000);
  res.setTimeout(10 * 60 * 1000);
  next();
});

/* ============================================================
   🐢 SLOW REQUEST LOGGER
============================================================ */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 5000) {
      logger.warn("Slow request", {
        method: req.method,
        url: req.originalUrl,
        duration,
        status: res.statusCode,
      });
    }
  });
  next();
});

/* ============================================================
   📊 METRICS
============================================================ */
app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  if (ENV === "production" && req.headers["x-metrics-token"] !== METRICS_TOKEN) {
    return res.status(403).json({ success: false });
  }
  res.set("Content-Type", metricsClient.register.contentType);
  res.end(await metricsClient.register.metrics());
});

/* ============================================================
   ⏱️ RATE LIMITING
============================================================ */
if (ENV !== "test") {
  app.use(globalLimiter);
}
app.use("/api", slidingWindowLimiter);

/* ============================================================
   📁 STATIC FILES
============================================================ */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1h",
    etag: true,
  })
);

/* ============================================================
   ❤️ HEALTH CHECK
============================================================ */
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "College Media API",
    env: ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    refreshTokenCookie: {
      httpOnly: true,
      secure: COOKIE_SECURE,
      domain: COOKIE_DOMAIN || "auto",
    },
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   🔐 ROUTES
============================================================ */
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/search", searchLimiter, require("./routes/search"));
app.use("/api/admin", adminLimiter, require("./routes/admin"));
app.use("/api/resume", resumeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", require("./routes/messages"));
app.use("/api/account", require("./routes/account"));

/* ============================================================
   ❌ ERROR HANDLING
============================================================ */
app.use(notFound);
app.use(errorHandler);

/* ============================================================
   🚦 START SERVER
============================================================ */
let dbConnection;

const startServer = async () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    logger.critical("Auth secrets missing");
    process.exit(1);
  }

  try {
    dbConnection = await initDB();
    logger.info("Database connected");
  } catch (err) {
    logger.critical("DB connection failed", err);
    process.exit(1);
  }

  setImmediate(() => {
    warmUpCache({
      User: require("./models/User"),
      Resume: require("./models/Resume"),
    });
  });

  server.listen(PORT, () => {
    logger.info("Server running", { port: PORT, env: ENV });
  });
};

/* ============================================================
   🧨 GRACEFUL SHUTDOWN
============================================================ */
const shutdown = async (signal) => {
  logger.warn("Shutdown signal received", { signal });

  server.close(async () => {
    if (dbConnection?.mongoose) {
      await dbConnection.mongoose.connection.close(false);
    }
    logger.info("Shutdown complete");
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ============================================================
   ▶️ BOOTSTRAP
============================================================ */
if (require.main === module) {
  startServer();
}

module.exports = app;
