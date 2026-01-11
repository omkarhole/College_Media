const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const { initDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const resumeRoutes = require("./routes/resume");
const uploadRoutes = require("./routes/upload");
const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");
const { slidingWindowLimiter } = require("./middleware/slidingWindowLimiter");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------
// 🔐 GLOBAL MIDDLEWARES
// ------------------

// ✅ FIXED: Proper CORS Configuration (Preflight Support)
const corsOptions = {
  origin: true, // allow all origins (or frontend URL)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "X-API-Version",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ✅ FIXED: Explicitly handle OPTIONS (preflight) requests
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------
// 🔁 API VERSION HANDLING
// ------------------
app.use((req, res, next) => {
  req.apiVersion = req.headers["x-api-version"] || "v1";
  res.setHeader("X-API-Version", req.apiVersion);
  next();
});

// ------------------
// ⏱️ RATE LIMITING
// ------------------
app.use("/api", slidingWindowLimiter);
app.use("/api", globalLimiter);

// ------------------
// 📁 STATIC FILES
// ------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------
// ❤️ HEALTH CHECK
// ------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    apiVersion: req.apiVersion,
    message: "College Media API is running!",
  });
});

// ------------------
// 🚀 START SERVER
// ------------------
const startServer = async () => {
  let dbConnection;

  try {
    dbConnection = await initDB();
    app.set("dbConnection", dbConnection);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    dbConnection = { useMongoDB: false, mongoose: null };
    app.set("dbConnection", dbConnection);
    console.log("Using file-based database as fallback");
  }

  // ------------------
  // 🔐 ROUTES
  // ------------------
  app.use("/api/auth", authLimiter, require("./routes/auth"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/resume", resumeRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/messages", require("./routes/messages"));
  app.use("/api/account", require("./routes/account"));

  // ------------------
  // ❌ ERROR HANDLERS (VERY IMPORTANT ORDER)
  // ------------------
  app.use(notFound);      // 404 handler
  app.use(errorHandler); // global error handler

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
