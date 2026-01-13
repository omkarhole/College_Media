/**
 * Accessibility Settings Panel
 * Issue #246: User accessibility preferences
 */

import { useAccessibility } from '../context/AccessibilityContext';
import { Icon } from '@iconify/react';

const AccessibilitySettings = ({ isOpen, onClose }) => {
  const { preferences, updatePreference } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-labelledby="a11y-title"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id="a11y-title" className="text-2xl font-bold">
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Icon icon="mdi:close" width={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <label htmlFor="reduced-motion" className="flex items-center gap-2 cursor-pointer">
              <Icon icon="mdi:motion-pause" width={20} />
              <span>Reduce Motion</span>
            </label>
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
              className="w-12 h-6"
              aria-describedby="reduced-motion-desc"
            />
          </div>
          <p id="reduced-motion-desc" className="text-sm text-gray-600 dark:text-gray-400">
            Minimize animations and transitions
          </p>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
              <Icon icon="mdi:contrast-box" width={20} />
              <span>High Contrast</span>
            </label>
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => updatePreference('highContrast', e.target.checked)}
              className="w-12 h-6"
              aria-describedby="high-contrast-desc"
            />
          </div>
          <p id="high-contrast-desc" className="text-sm text-gray-600 dark:text-gray-400">
            Increase color contrast for better visibility
          </p>

          {/* Large Text */}
          <div className="flex items-center justify-between">
            <label htmlFor="large-text" className="flex items-center gap-2 cursor-pointer">
              <Icon icon="mdi:format-size" width={20} />
              <span>Large Text</span>
            </label>
            <input
              id="large-text"
              type="checkbox"
              checked={preferences.largeText}
              onChange={(e) => updatePreference('largeText', e.target.checked)}
              className="w-12 h-6"
              aria-describedby="large-text-desc"
            />
          </div>
          <p id="large-text-desc" className="text-sm text-gray-600 dark:text-gray-400">
            Increase font size across the app
          </p>

          {/* Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <Icon icon="mdi:keyboard" width={20} />
              <span>Keyboard Navigation</span>
            </label>
            <span className={`px-3 py-1 rounded-full text-sm ${preferences.keyboardOnly ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {preferences.keyboardOnly ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically detected when using Tab key
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
