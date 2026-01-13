/**
 * Offline Indicator Component
 * Issue #249: Show offline/online status
 */

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Icon } from '@iconify/react';

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Show reconnection message
  if (isOnline && wasOffline) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
        <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
          <Icon icon="mdi:wifi" width={20} />
          <span className="font-medium">Back Online!</span>
        </div>
      </div>
    );
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
        <div className="bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
          <Icon icon="mdi:wifi-off" width={20} />
          <span className="font-medium">You're Offline</span>
          <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
