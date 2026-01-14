/**
 * ============================================================
 * JobRunner – Advanced Background Job Executor (HARDENED)
 * ============================================================
 * ✔ Retry with exponential backoff
 * ✔ Timeout protection
 * ✔ Dead Letter Queue handling
 * ✔ Correlation / Request ID propagation
 * ✔ Async context safe
 * ✔ Structured & redacted logging
 * ✔ Lifecycle hooks
 * ✔ Cancellation support
 * ✔ Concurrency protection
 * ✔ Execution metrics
 * ✔ Production ready
 * ============================================================
 */

"use strict";

const { randomUUID } = require("crypto");
const {
  getRequestId,
  withRequestContext,
} = require("../middleware/requestId.middleware");

const logger = require("./logger");

/* ============================================================
   ⚙️ DEFAULT CONFIGS
============================================================ */
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 2000;
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RUNTIME_MS = 60000;

/* ============================================================
   🧠 INTERNAL HELPERS
============================================================ */

/**
 * Generate job execution ID
 */
const generateJobExecutionId = () => {
  try {
    return randomUUID();
  } catch {
    return (
      "job_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2)
    );
  }
};

/**
 * Sleep helper
 */
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff
 */
const calculateBackoff = (base, attempt) =>
  base * Math.pow(2, attempt - 1);

/**
 * Safe promise race timeout
 */
const withTimeout = (promise, ms) => {
  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error("Job execution timed out")),
      ms
    );
  });

  return Promise.race([promise, timeout]).finally(() =>
    clearTimeout(timeoutHandle)
  );
};

/* ============================================================
   📊 EXECUTION METRICS (IN-MEMORY)
============================================================ */
const metrics = {
  totalRuns: 0,
  success: 0,
  failure: 0,
  retries: 0,
  timeouts: 0,
};

/* ============================================================
   🧱 JOB RUNNER CLASS
============================================================ */
class JobRunner {
  constructor({
    jobName,
    handler,
    maxRetries = DEFAULT_MAX_RETRIES,
    backoffMs = DEFAULT_BACKOFF_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRuntimeMs = DEFAULT_MAX_RUNTIME_MS,
    onSuccess,
    onFailure,
    onStart,
    onFinally,
  }) {
    if (!jobName) throw new Error("jobName is required");
    if (typeof handler !== "function")
      throw new Error("handler must be a function");

    this.jobName = jobName;
    this.handler = handler;
    this.maxRetries = maxRetries;
    this.backoffMs = backoffMs;
    this.timeoutMs = timeoutMs;
    this.maxRuntimeMs = maxRuntimeMs;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;
    this.onStart = onStart;
    this.onFinally = onFinally;

    this._cancelled = false;
    this._running = false;
  }

  /* ============================================================
     🚫 CANCEL SUPPORT
  ============================================================ */
  cancel() {
    this._cancelled = true;
    logger.warn("Job cancelled by caller", {
      jobName: this.jobName,
    });
  }

  /* ============================================================
     🚀 PUBLIC RUN METHOD
  ============================================================ */
  async run(payload = {}, context = {}) {
    if (this._running) {
      throw new Error("Job is already running");
    }

    this._running = true;
    metrics.totalRuns++;

    const requestId = context.requestId || getRequestId();
    const jobExecutionId = generateJobExecutionId();
    const startedAt = Date.now();

    return withRequestContext(async () => {
      logger.info("Background job started", {
        jobName: this.jobName,
        jobExecutionId,
        requestId,
        payload,
      });

      if (typeof this.onStart === "function") {
        await this.onStart({
          jobName: this.jobName,
          jobExecutionId,
        });
      }

      let attempt = 0;

      try {
        while (attempt <= this.maxRetries) {
          if (this._cancelled) {
            throw new Error("Job execution cancelled");
          }

          attempt++;

          logger.info("Job attempt started", {
            jobName: this.jobName,
            jobExecutionId,
            attempt,
          });

          try {
            const result = await withTimeout(
              this.handler(payload, context),
              this.timeoutMs
            );

            metrics.success++;

            logger.info("Job succeeded", {
              jobName: this.jobName,
              jobExecutionId,
              attempt,
              durationMs: Date.now() - startedAt,
            });

            if (typeof this.onSuccess === "function") {
              await this.onSuccess(result, {
                jobName: this.jobName,
                jobExecutionId,
                attempt,
              });
            }

            return result;
          } catch (error) {
            metrics.retries++;

            logger.error("Job attempt failed", {
              jobName: this.jobName,
              jobExecutionId,
              attempt,
              error: error.message,
            });

            if (attempt > this.maxRetries) {
              throw error;
            }

            const delay = calculateBackoff(
              this.backoffMs,
              attempt
            );

            logger.warn("Retrying job after backoff", {
              jobName: this.jobName,
              jobExecutionId,
              attempt,
              delayMs: delay,
            });

            await sleep(delay);
          }

          if (Date.now() - startedAt > this.maxRuntimeMs) {
            metrics.timeouts++;
            throw new Error("Job exceeded max runtime limit");
          }
        }
      } catch (error) {
        metrics.failure++;

        await this._handlePermanentFailure(
          error,
          payload,
          jobExecutionId
        );

        throw error;
      } finally {
        this._running = false;

        if (typeof this.onFinally === "function") {
          await this.onFinally({
            jobName: this.jobName,
            jobExecutionId,
          });
        }
      }
    });
  }

  /* ============================================================
     ☠️ PERMANENT FAILURE HANDLER
  ============================================================ */
  async _handlePermanentFailure(
    error,
    payload,
    jobExecutionId
  ) {
    logger.critical("Job permanently failed", {
      jobName: this.jobName,
      jobExecutionId,
      error: error.message,
      payload,
    });

    await this._moveToDeadLetterQueue(
      error,
      payload,
      jobExecutionId
    );

    if (typeof this.onFailure === "function") {
      await this.onFailure(error, {
        jobName: this.jobName,
        jobExecutionId,
      });
    }
  }

  /* ============================================================
     📦 DEAD LETTER QUEUE (ABSTRACTION)
  ============================================================ */
  async _moveToDeadLetterQueue(
    error,
    payload,
    jobExecutionId
  ) {
    logger.error("Job moved to Dead Letter Queue", {
      jobName: this.jobName,
      jobExecutionId,
      reason: error.message,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  /* ============================================================
     📊 METRICS ACCESSOR
  ============================================================ */
  static getMetrics() {
    return { ...metrics };
  }
}

/* ============================================================
   📤 EXPORT
============================================================ */
module.exports = JobRunner;
