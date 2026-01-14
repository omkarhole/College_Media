const apiManager = require("../utils/externalApiManager");

/**
 * ============================================================
 * Register Payment Service with Circuit Breaker Config
 * ============================================================
 */
apiManager.registerService("payment", {
  // Retry strategy
  retries: 2, // blind retries kam rakho (CB ke saath best practice)

  // Request timeout
  timeout: 4000,

  // Circuit Breaker Settings
  circuitBreaker: {
    enabled: true,

    failureThreshold: 5,      // 5 failures ke baad OPEN
    successThreshold: 2,      // HALF_OPEN me 2 success = CLOSE
    resetTimeout: 15000       // 15 sec ke baad HALF_OPEN try
  },

  // Fallback when circuit is OPEN
  fallback: () => ({
    success: false,
    status: "pending",
    reason: "Payment service temporarily unavailable",
    source: "circuit-breaker-fallback"
  })
});

/**
 * ============================================================
 * Charge User (Protected by Circuit Breaker)
 * ============================================================
 */
const chargeUser = async (payload) => {
  try {
    return await apiManager.callService("payment", {
      method: "POST",
      url: "https://httpstat.us/200",
      data: payload
    });
  } catch (error) {
    /**
     * Fail-fast behavior
     * Controller ko clean error mile
     */
    throw new Error(
      `Payment service failed: ${error.message}`
    );
  }
};

module.exports = { chargeUser };
