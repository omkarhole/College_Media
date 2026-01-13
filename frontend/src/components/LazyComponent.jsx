/**
 * LazyComponent - Generic lazy wrapper for components
 * Issue #238: Performance Optimization - Component lazy loading wrapper
 */

import { Suspense, lazy } from "react";
import SkeletonLoader from "./SkeletonLoader";

export const LazyComponent = ({
  importFunc,
  fallback = <SkeletonLoader />,
  ...props
}) => {
  const Component = lazy(importFunc);

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

export default LazyComponent;
