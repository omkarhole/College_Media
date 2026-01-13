/**
 * useLazyLoad Hook - Lazy loading components
 * Issue #238: Performance Optimization - Lazy loading hook
 */

import { useState, useEffect } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

export const useLazyLoad = (importFunc, options = {}) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { targetRef, hasIntersected } = useIntersectionObserver(options);

  useEffect(() => {
    if (!hasIntersected || Component) return;

    setLoading(true);
    importFunc()
      .then((module) => {
        setComponent(() => module.default || module);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        console.error('Lazy load error:', err);
      });
  }, [hasIntersected, Component, importFunc]);

  return { Component, loading, error, targetRef };
};
