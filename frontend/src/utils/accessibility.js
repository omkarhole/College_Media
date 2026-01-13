/**
 * Accessibility Utilities
 * Issue #246: WCAG 2.1 AA helper functions
 */

/**
 * Check if color contrast meets WCAG AA standards (4.5:1)
 */
export const calculateContrastRatio = (color1, color2) => {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Generate accessible alt text for images
 */
export const generateAltText = (filename, caption) => {
  if (caption) return caption;
  const cleanName = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/[-_]/g, ' ');
  return `Image: ${cleanName}`;
};

/**
 * Check if element is keyboard accessible
 */
export const isKeyboardAccessible = (element) => {
  const tabindex = element.getAttribute('tabindex');
  const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
  return isInteractive || (tabindex !== null && tabindex !== '-1');
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 3000);
};

/**
 * Get accessible label for element
 */
export const getAccessibleLabel = (element) => {
  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent ||
    element.getAttribute('title') ||
    element.getAttribute('alt')
  );
};

/**
 * Validate form accessibility
 */
export const validateFormAccessibility = (formElement) => {
  const issues = [];

  // Check all inputs have labels
  const inputs = formElement.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const id = input.id;
    const label = formElement.querySelector(`label[for="${id}"]`);
    const ariaLabel = input.getAttribute('aria-label');

    if (!label && !ariaLabel) {
      issues.push(`Input missing label: ${input.name || input.type}`);
    }
  });

  // Check submit button is accessible
  const submitButton = formElement.querySelector('[type="submit"]');
  if (submitButton && !getAccessibleLabel(submitButton)) {
    issues.push('Submit button missing accessible label');
  }

  return { valid: issues.length === 0, issues };
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Create accessible error message
 */
export const createErrorMessage = (fieldName, error) => {
  return {
    id: `${fieldName}-error`,
    role: 'alert',
    'aria-live': 'assertive',
    message: error,
  };
};
