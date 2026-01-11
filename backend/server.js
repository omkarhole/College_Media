const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const resumeRoutes = require('./routes/resume');
const uploadRoutes = require('./routes/upload');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------
// 🔐 Security Middleware
// ------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ GLOBAL RATE LIMIT (fixes bypass)
app.use('/api', globalLimiter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: null,
    message: 'College Media API is running!',
  });
});

// ------------------
// 🚀 Start Server
// ------------------
const startServer = async () => {
  let dbConnection;

  try {
    dbConnection = await initDB();
    app.set('dbConnection', dbConnection);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    dbConnection = { useMongoDB: false, mongoose: null };
    app.set('dbConnection', dbConnection);
    console.log('Using file-based database as fallback');
  }

  // ------------------
  // 🔐 Routes
  // ------------------

  // 🔥 STRICT rate limit for auth (bruteforce protection)
  app.use('/api/auth', authLimiter, require('./routes/auth'));

  // Normal protected routes
  app.use('/api/users', require('./routes/users'));
  app.use('/api/resume', resumeRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/messages', require('./routes/messages'));
  app.use('/api/account', require('./routes/account'));

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
