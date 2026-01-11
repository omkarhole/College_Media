/**
 * Centralized Error Handling Middleware
 * Handles 404 and application errors consistently
 */

// ❌ 404 - Route Not Found Handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
};

// ❌ Global Error Handler
const errorHandler = (err, req, res, next) => {
  // Log error (always)
  console.error("Error:", err);

  // Default status code
  const statusCode = err.statusCode || res.statusCode || 500;

  let message = err.message || "Internal Server Error";
  let errorCode = err.code || "INTERNAL_SERVER_ERROR";

  // 🟡 Mongoose Validation Error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    errorCode = "VALIDATION_ERROR";
  }

  // 🟡 Mongoose Cast Error (Invalid ObjectId)
  if (err.name === "CastError") {
    message = "Invalid resource ID format";
    errorCode = "INVALID_ID";
  }

  // 🟡 JWT Errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid authentication token";
    errorCode = "INVALID_TOKEN";
  }

  if (err.name === "TokenExpiredError") {
    message = "Authentication token expired";
    errorCode = "TOKEN_EXPIRED";
  }

  // 🟡 Multer Errors
  if (err.name === "MulterError") {
    errorCode = "FILE_UPLOAD_ERROR";

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds 5MB limit";
    } else {
      message = err.message;
    }
  }

  // ❌ Final standardized error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

module.exports = {
  notFound,
  errorHandler,
};
