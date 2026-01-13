/**
 * LazyImage Component - Optimized lazy-loaded image component
 * Issue #238: Performance Optimization - Lazy loading images
 */

import { useState, useEffect } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import {
  createBlurPlaceholder,
  getOptimizedImageUrl,
} from "../utils/imageOptimization";

export const LazyImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  style = {},
  loading = "lazy",
  placeholder = "blur",
  quality = 80,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(
    placeholder === "blur" ? createBlurPlaceholder() : null
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver({
    rootMargin: "100px",
  });

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    // Load optimized image
    img.src = getOptimizedImageUrl(src, { width, quality });

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [hasIntersected, src, width, quality, onLoad, onError]);

  if (hasError) {
    return (
      <div
        ref={targetRef}
        className={`lazy-image-error ${className}`}
        style={{ width, height, ...style }}
        aria-label="Image failed to load"
      >
        <span>⚠️ Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      ref={targetRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={`lazy-image ${
        imageLoaded ? "loaded" : "loading"
      } ${className}`}
      style={{
        transition: "opacity 0.3s ease-in-out",
        opacity: imageLoaded ? 1 : 0.5,
        ...style,
      }}
      {...props}
    />
  );
};

export default LazyImage;
