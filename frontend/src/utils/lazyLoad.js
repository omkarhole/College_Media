/**
 * Lazy Load Utilities - Helper functions for lazy loading
 * Issue #238: Performance Optimization - Lazy loading utilities
 */

import { lazy } from 'react';

/**
 * Enhanced lazy loading with retry logic
 */
export const lazyWithRetry = (componentImport, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (retriesLeft) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }
            console.warn(`Retrying import... (${retriesLeft} attempts left)`);
            setTimeout(() => attemptImport(retriesLeft - 1), 1000);
          });
      };
      attemptImport(retries);
    });
  });
};

/**
 * Preload a lazy component
 */
export const preloadComponent = (componentImport) => {
  return componentImport();
};

/**
 * Create a lazy component with custom loading fallback
 */
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  return { component: LazyComponent, fallback };
};

/**
 * Batch preload multiple components
 */
export const batchPreload = (imports) => {
  return Promise.all(imports.map(preloadComponent));
};
