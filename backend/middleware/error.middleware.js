module.exports = (err, req, res, next) => {
  console.error(`[${req.requestId}] ERROR:`, err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
};
