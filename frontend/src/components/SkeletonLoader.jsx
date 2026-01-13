/**
 * SkeletonLoader Component - Loading placeholder animations
 * Issue #238: Performance Optimization - Skeleton loading states
 */

import './SkeletonLoader.css';

export const SkeletonLoader = ({
  variant = 'rectangular',
  width = '100%',
  height = '20px',
  animation = 'pulse',
  count = 1,
  className = '',
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
      style={{ width, height }}
      aria-label="Loading content..."
      role="status"
    />
  ));

  return count > 1 ? <div className="skeleton-group">{skeletons}</div> : skeletons[0];
};

// Predefined skeleton patterns
export const PostSkeleton = () => (
  <div className="skeleton-post">
    <div className="skeleton-post-header">
      <SkeletonLoader variant="circular" width="40px" height="40px" />
      <div className="skeleton-post-user">
        <SkeletonLoader width="120px" height="16px" />
        <SkeletonLoader width="80px" height="12px" />
      </div>
    </div>
    <SkeletonLoader width="100%" height="16px" count={3} />
    <SkeletonLoader variant="rectangular" width="100%" height="300px" />
    <div className="skeleton-post-actions">
      <SkeletonLoader width="60px" height="32px" count={3} />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="skeleton-card">
    <SkeletonLoader variant="rectangular" width="100%" height="200px" />
    <div className="skeleton-card-content">
      <SkeletonLoader width="80%" height="24px" />
      <SkeletonLoader width="100%" height="16px" count={2} />
      <SkeletonLoader width="40%" height="16px" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 5 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="skeleton-list-item">
        <SkeletonLoader variant="circular" width="32px" height="32px" />
        <div className="skeleton-list-content">
          <SkeletonLoader width="70%" height="16px" />
          <SkeletonLoader width="50%" height="12px" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
