/**
 * ============================================================
 *  College Media – Backend Server
 * ------------------------------------------------------------
 *  ✔ Timeout Safe
 *  ✔ Large File Ready
 *  ✔ Advanced Rate Limiting
 *  ✔ Background Job Hardened
 *  ✔ Observability Enabled
 *  ✔ Graceful Shutdown
 *  ✔ Production Hardened
 * ============================================================
 */

/* ============================================================
   📦 CORE DEPENDENCIES
============================================================ */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const os = require("os");

/* ============================================================
   🔧 INTERNAL IMPORTS
============================================================ */
const helmet = require("helmet");
const securityHeaders = require("./config/securityHeaders");

const { initDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const resumeRoutes = require("./routes/resume");
const uploadRoutes = require("./routes/upload");

const {
  globalLimiter,
  authLimiter,
  otpLimiter,
  searchLimiter,
  adminLimiter,
} = require("./middleware/rateLimiter");

const { slidingWindowLimiter } = require("./middleware/slidingWindowLimiter");
const { warmUpCache } = require("./utils/cache");
const logger = require("./utils/logger");

/* ============================================================
   📊 OBSERVABILITY & METRICS
============================================================ */
const metricsMiddleware = require("./middleware/metrics.middleware");
const { client: metricsClient } = require("./utils/metrics");

/* ============================================================
   🔁 BACKGROUND JOBS
============================================================ */
const sampleJob = require("./jobs/sampleJob");

/* ============================================================
   🌱 ENVIRONMENT SETUP
============================================================ */
dotenv.config();

const ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 5000;
const METRICS_TOKEN = process.env.METRICS_TOKEN || "metrics-secret";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

/* ============================================================
   🚀 APP & SERVER INIT
============================================================ */
const app = express();
const server = http.createServer(app);

if (TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

/* ============================================================
   🔐 SECURITY HEADERS (HELMET)
============================================================ */
app.use(helmet(securityHeaders(ENV)));

/* ============================================================
   🌍 CORS CONFIG
============================================================ */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Version",
      "X-Metrics-Token",
    ],
  })
);

/* ============================================================
   📦 BODY PARSERS
============================================================ */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ============================================================
   📊 REQUEST METRICS
============================================================ */
app.use(metricsMiddleware);

/* ============================================================
   ⏱️ REQUEST TIMEOUT GUARD
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
      logger.warn("Slow request detected", {
        method: req.method,
        url: req.originalUrl,
        durationMs: duration,
        status: res.statusCode,
      });
    }
  });

  next();
});

/* ============================================================
   🔁 API VERSIONING
============================================================ */
app.use((req, res, next) => {
  req.apiVersion = req.headers["x-api-version"] || "v1";
  res.setHeader("X-API-Version", req.apiVersion);
  next();
});

/* ============================================================
   ⏱️ RATE LIMITING (ISSUE #500 FIX)
============================================================ */

/**
 * Sliding window limiter – light protection
 */
app.use("/api", slidingWindowLimiter);

/**
 * Global limiter – protects all APIs
 */
if (ENV === "production") {
  app.use("/api", globalLimiter);
}

/* ============================================================
   📁 STATIC FILES
============================================================ */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1h",
    etag: true,
    immutable: false,
  })
);

/* ============================================================
   ❤️ HEALTH CHECK
============================================================ */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "College Media API running",
    env: ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   📈 METRICS ENDPOINT (SECURED)
============================================================ */
app.get("/metrics", async (req, res) => {
  const token = req.headers["x-metrics-token"];

  if (ENV === "production" && token !== METRICS_TOKEN) {
    logger.warn("Unauthorized metrics access", {
      ip: req.ip,
    });
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  try {
    res.set("Content-Type", metricsClient.register.contentType);
    res.end(await metricsClient.register.metrics());
  } catch (err) {
    logger.error("Metrics endpoint failed", {
      error: err.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to load metrics",
    });
  }
});

/* ============================================================
   🔁 BACKGROUND JOB BOOTSTRAP
============================================================ */
const startBackgroundJobs = () => {
  logger.info("Bootstrapping background jobs");

  setImmediate(async () => {
    try {
      await sampleJob.run({ shouldFail: false });
      logger.info("Background job completed successfully");
    } catch (err) {
      logger.error("Background job failed", {
        job: "sample_background_job",
        error: err.message,
        stack: err.stack,
      });
    }
  });
};

/* ============================================================
   🚀 START SERVER
============================================================ */
let dbConnection = null;

const startServer = async () => {
  logger.info("Starting server bootstrap");

  /* ---------- DB CONNECTION ---------- */
  try {
    dbConnection = await initDB();
    logger.info("Database connected successfully");
  } catch (err) {
    logger.critical("Database connection failed", {
      error: err.message,
    });
    process.exit(1);
  }

  /* ---------- CACHE WARM-UP ---------- */
  setImmediate(() => {
    try {
      warmUpCache({
        User: require("./models/User"),
        Resume: require("./models/Resume"),
      });
      logger.info("Cache warm-up triggered");
    } catch (err) {
      logger.warn("Cache warm-up failed", {
        error: err.message,
      });
    }
  });

  /* ---------- BACKGROUND JOBS ---------- */
  startBackgroundJobs();

  /* ============================================================
     🚦 ROUTES WITH RATE LIMITING
  ============================================================ */

  app.use("/api/auth", authLimiter, require("./routes/auth"));
  app.use("/api/auth/otp", otpLimiter);

  app.use("/api/users", require("./routes/users"));
  app.use("/api/search", searchLimiter, require("./routes/search"));
  app.use("/api/admin", adminLimiter, require("./routes/admin"));

  app.use("/api/resume", resumeRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/messages", require("./routes/messages"));
  app.use("/api/account", require("./routes/account"));

  /* ---------- ERROR HANDLING ---------- */
  app.use(notFound);
  app.use(errorHandler);

  /* ---------- SERVER TIMEOUTS ---------- */
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 130000;
  server.requestTimeout = 0;

  /* ---------- START LISTEN ---------- */
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
      env: ENV,
    });
  });
};

/* ============================================================
   🧹 GRACEFUL SHUTDOWN
============================================================ */
const shutdown = async (signal) => {
  logger.warn("Shutdown initiated", { signal });

  server.close(async () => {
    try {
      if (dbConnection?.mongoose) {
        await dbConnection.mongoose.connection.close(false);
        logger.info("Database connection closed");
      }
    } catch (err) {
      logger.error("Error during DB shutdown", {
        error: err.message,
      });
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.critical("Force shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ============================================================
   🧨 PROCESS SAFETY
============================================================ */
process.on("unhandledRejection", (reason) => {
  logger.critical("Unhandled Promise Rejection", {
    reason,
  });
});

process.on("uncaughtException", (err) => {
  logger.critical("Uncaught Exception", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

/* ============================================================
   ▶️ BOOTSTRAP
============================================================ */
startServer();
