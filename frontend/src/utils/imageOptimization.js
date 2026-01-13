/**
 * Image Optimization Utilities - Image loading and optimization helpers
 * Issue #238: Performance Optimization - Image optimization
 */

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (baseUrl, widths = [320, 640, 960, 1280, 1920]) => {
  return widths.map((width) => `${baseUrl}?w=${width} ${width}w`).join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizes = () => {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
};

/**
 * Create blur placeholder from image
 */
export const createBlurPlaceholder = (width = 10, height = 10) => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='1'/%3E%3C/filter%3E%3Crect width='${width}' height='${height}' filter='url(%23b)' fill='%23e5e7eb'/%3E%3C/svg%3E`;
};

/**
 * Check if WebP is supported
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Get optimized image URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const { width, quality = 80, format = 'auto' } = options;
  
  if (!url) return '';
  
  // Add query params for image optimization
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  params.append('q', quality);
  if (format !== 'auto') params.append('fm', format);
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

/**
 * Lazy load image with callback
 */
export const lazyLoadImage = (src, onLoad, onError) => {
  const img = new Image();
  img.onload = () => onLoad?.(img);
  img.onerror = () => onError?.(new Error('Image load failed'));
  img.src = src;
  return img;
};
