/**
 * ================================
 *  College Media – Backend Server
 *  Timeout-Safe | Large-File Ready
 *  Background-Job Hardened
 *  Production Hardened
 * ================================
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const os = require("os");

/* ------------------
   🔧 INTERNAL IMPORTS
------------------ */
// 🔐 Security Headers
const helmet = require("helmet");
const securityHeaders = require("./config/securityHeaders");


const { initDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const resumeRoutes = require("./routes/resume");
const uploadRoutes = require("./routes/upload");

const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");
const { slidingWindowLimiter } = require("./middleware/slidingWindowLimiter");
const { warmUpCache } = require("./utils/cache");
const logger = require("./utils/logger");

// 🔍 Observability
const metricsMiddleware = require("./middleware/metrics.middleware");
const { client: metricsClient } = require("./utils/metrics");

// 🔁 Background Job
const sampleJob = require("./jobs/sampleJob");

/* ------------------
   🌱 ENV SETUP
------------------ */
dotenv.config();

const ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 5000;
const METRICS_TOKEN = process.env.METRICS_TOKEN || "metrics-secret";

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

/* ------------------
   🔐 SECURITY HEADERS
------------------ */
app.use(helmet(securityHeaders(ENV)));

/* ------------------
   🌍 CORS
------------------ */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

/* ------------------
   📦 BODY PARSERS
------------------ */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ------------------
   📊 OBSERVABILITY
------------------ */
app.use(metricsMiddleware);

/* ------------------
   ⏱️ REQUEST TIMEOUT GUARD
------------------ */
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000);
  res.setTimeout(10 * 60 * 1000);
  next();
});

/* ------------------
   🐢 SLOW REQUEST LOGGER
------------------ */
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 5000) {
      logger.warn("Slow request detected", {
        method: req.method,
        url: req.originalUrl,
        durationMs: duration,
      });
    }
  });

  next();
});

/* ------------------
   🔁 API VERSIONING
------------------ */
app.use((req, res, next) => {
  req.apiVersion = req.headers["x-api-version"] || "v1";
  res.setHeader("X-API-Version", req.apiVersion);
  next();
});

/* ------------------
   ⏱️ RATE LIMITING
------------------ */
app.use("/api", slidingWindowLimiter);
if (ENV === "production") {
  app.use("/api", globalLimiter);
}

/* ------------------
   📁 STATIC FILES
------------------ */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1h",
    etag: true,
  })
);

/* ------------------
   ❤️ HEALTH CHECK
------------------ */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "College Media API running",
    env: ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
  });
});

/* ------------------
   📈 METRICS
------------------ */
app.get("/metrics", async (req, res) => {
  const token = req.headers["x-metrics-token"];

  if (ENV === "production" && token !== METRICS_TOKEN) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    res.set("Content-Type", metricsClient.register.contentType);
    res.end(await metricsClient.register.metrics());
  } catch (err) {
    logger.error("Metrics endpoint failed", { error: err.message });
    res.status(500).json({ success: false, message: "Metrics error" });
  }
});

/* ------------------
   🔁 BACKGROUND JOB BOOTSTRAP
------------------ */
const startBackgroundJobs = () => {
  logger.info("Starting background jobs");

  setImmediate(async () => {
    try {
      await sampleJob.run({ shouldFail: false });
      logger.info("Background job executed successfully");
    } catch (err) {
      logger.error("Background job execution failed", {
        job: "sample_background_job",
        error: err.message,
      });
    }
  });
};

/* ------------------
   🚀 START SERVER
------------------ */
let dbConnection = null;

const startServer = async () => {
  try {
    dbConnection = await initDB();
    logger.info("Database connected");
  } catch (err) {
    logger.critical("DB connection failed", { error: err.message });
    process.exit(1);
  }

  /* 🔥 CACHE WARM-UP */
  setImmediate(() => {
    warmUpCache({
      User: require("./models/User"),
      Resume: require("./models/Resume"),
    });
  });

  /* 🔁 BACKGROUND JOBS */
  startBackgroundJobs();

  /* ---------- ROUTES ---------- */
  app.use("/api/auth", authLimiter, require("./routes/auth"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/resume", resumeRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/messages", require("./routes/messages"));
  app.use("/api/account", require("./routes/account"));

  app.use(notFound);
  app.use(errorHandler);

  /* ---------- SERVER TIMEOUTS ---------- */
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 130000;
  server.requestTimeout = 0;

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

/* ------------------
   🧹 GRACEFUL SHUTDOWN
------------------ */
const shutdown = async (signal) => {
  logger.warn("Shutdown signal", { signal });

  server.close(async () => {
    if (dbConnection?.mongoose) {
      await dbConnection.mongoose.connection.close(false);
    }

    dbConnection = await initDB();
    app.set('dbConnection', dbConnection);
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    dbConnection = { useMongoDB: false, mongoose: null };
    app.set('dbConnection', dbConnection);
    logger.warn('Using file-based database as fallback');
  }
};

// Start server only if run directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  });
}

module.exports = app;
