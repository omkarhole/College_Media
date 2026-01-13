/**
 * Performance Monitor - Track and report performance metrics
 * Issue #238: Performance Optimization - Performance monitoring
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
  }

  /**
   * Mark a performance point
   */
  mark(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name, startMark, endMark) {
    if (typeof performance === 'undefined') return null;

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      this.metrics.set(name, measure.duration);
      return measure.duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return null;
    }
  }

  /**
   * Get all performance metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming() {
    if (typeof performance === 'undefined' || !performance.timing) {
      return null;
    }

    const timing = performance.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
      load: timing.loadEventEnd - timing.loadEventStart,
      total: timing.loadEventEnd - timing.navigationStart,
    };
  }

  /**
   * Log performance report
   */
  report() {
    console.group('Performance Report');
    console.table(this.getMetrics());
    console.log('Navigation Timing:', this.getNavigationTiming());
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
