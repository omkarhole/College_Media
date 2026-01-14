/**
 * ============================================================
 * Circuit Breaker Service (Custom Implementation)
 * ============================================================
 * Issue: Third-Party API Failure Circuit Breaker Missing (#590)
 * Type: Resilience / Reliability
 * Severity: High
 *
 * Author: Ayaan Shaikh
 *
 * Features:
 * - CLOSED / OPEN / HALF_OPEN states
 * - Failure threshold
 * - Success threshold
 * - Timeout handling
 * - Fallback support
 * - Metrics & logging
 * - Config driven
 * ============================================================
 */

const axios = require("axios");

/**
 * ============================================================
 * Circuit States
 * ============================================================
 */
const CIRCUIT_STATES = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN"
};

/**
 * ============================================================
 * Default Configuration
 * ============================================================
 */
const DEFAULT_CONFIG = {
  failureThreshold: 5,          // failures before opening circuit
  successThreshold: 2,          // successes to close circuit
  timeout: 8000,                // API timeout (ms)
  resetTimeout: 15000,          // time before HALF_OPEN
  monitoring: true,
  fallback: null                // optional fallback fn
};

/**
 * ============================================================
 * Circuit Breaker Class
 * ============================================================
 */
class CircuitBreaker {
  constructor(serviceName, action, config = {}) {
    this.serviceName = serviceName;
    this.action = action;

    this.config = { ...DEFAULT_CONFIG, ...config };

    // Internal state
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;

    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      shortCircuited: 0
    };
  }

  /**
   * ============================================================
   * Public Execute Method
   * ============================================================
   */
  async execute(...args) {
    this.metrics.totalRequests++;

    if (this.state === CIRCUIT_STATES.OPEN) {
      if (this._canAttemptReset()) {
        this._moveToHalfOpen();
      } else {
        this.metrics.shortCircuited++;
        return this._handleOpenCircuit();
      }
    }

    try {
      const response = await this._executeAction(...args);
      this._onSuccess();
      return response;
    } catch (error) {
      this._onFailure(error);
      throw error;
    }
  }

  /**
   * ============================================================
   * Execute Protected Action
   * ============================================================
   */
  async _executeAction(...args) {
    return await Promise.race([
      this.action(...args),
      this._timeoutPromise()
    ]);
  }

  /**
   * ============================================================
   * Timeout Guard
   * ============================================================
   */
  _timeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Third-party API timeout"));
      }, this.config.timeout);
    });
  }

  /**
   * ============================================================
   * Success Handler
   * ============================================================
   */
  _onSuccess() {
    this.metrics.successfulRequests++;

    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this._resetCircuit();
      }
    } else {
      this.failureCount = 0;
    }
  }

  /**
   * ============================================================
   * Failure Handler
   * ============================================================
   */
  _onFailure(error) {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === CIRCUIT_STATES.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this._openCircuit();
    }

    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this._openCircuit();
    }

    if (this.config.monitoring) {
      this._logFailure(error);
    }
  }

  /**
   * ============================================================
   * State Transitions
   * ============================================================
   */
  _openCircuit() {
    this.state = CIRCUIT_STATES.OPEN;
    this.successCount = 0;
  }

  _resetCircuit() {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }

  _moveToHalfOpen() {
    this.state = CIRCUIT_STATES.HALF_OPEN;
    this.successCount = 0;
  }

  /**
   * ============================================================
   * Open Circuit Handling
   * ============================================================
   */
  _handleOpenCircuit() {
    if (typeof this.config.fallback === "function") {
      return this.config.fallback();
    }

    throw new Error(
      `Circuit OPEN for service: ${this.serviceName}`
    );
  }

  /**
   * ============================================================
   * Reset Eligibility Check
   * ============================================================
   */
  _canAttemptReset() {
    return (
      Date.now() - this.lastFailureTime >=
      this.config.resetTimeout
    );
  }

  /**
   * ============================================================
   * Logging & Monitoring
   * ============================================================
   */
  _logFailure(error) {
    console.error(
      `[CIRCUIT BREAKER] ${this.serviceName}`,
      {
        state: this.state,
        failures: this.failureCount,
        error: error.message
      }
    );
  }

  /**
   * ============================================================
   * Health & Metrics
   * ============================================================
   */
  getStatus() {
    return {
      service: this.serviceName,
      state: this.state,
      metrics: this.metrics,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * ============================================================
 * Helper: Axios-based Circuit
 * ============================================================
 */
function createAxiosCircuit(serviceName, axiosConfig, options = {}) {
  const axiosInstance = axios.create(axiosConfig);

  const action = async (requestConfig) => {
    const response = await axiosInstance(requestConfig);
    return response.data;
  };

  return new CircuitBreaker(serviceName, action, options);
}

/**
 * ============================================================
 * Example Fallback
 * ============================================================
 */
function defaultFallback() {
  return {
    success: false,
    message: "Service temporarily unavailable",
    source: "circuit-breaker-fallback"
  };
}

/**
 * ============================================================
 * Export
 * ============================================================
 */
module.exports = {
  CircuitBreaker,
  createAxiosCircuit,
  CIRCUIT_STATES,
  defaultFallback
};
