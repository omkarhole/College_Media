/**
 * Install PWA Component
 * Issue #249: A2HS (Add to Home Screen) prompt
 */

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User ${outcome} the install prompt`);

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
        <Icon icon="mdi:check-circle" width={20} />
        <span className="font-medium">App Installed!</span>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-2xl p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Icon icon="mdi:cellphone-arrow-down" width={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install College Media</h3>
            <p className="text-sm text-white/90 mb-3">
              Get the full app experience with offline access!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setIsInstallable(false)}
                className="bg-white/20 px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsInstallable(false)}
            className="text-white/80 hover:text-white"
            aria-label="Close install prompt"
          >
            <Icon icon="mdi:close" width={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
