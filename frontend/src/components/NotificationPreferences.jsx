import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'react-hot-toast';

const NotificationPreferences = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleToggle = (key, value = null) => {
    const newPrefs = value !== null 
      ? { ...localPreferences, [key]: value }
      : { ...localPreferences, [key]: !localPreferences[key] };
    
    setLocalPreferences(newPrefs);
    updatePreferences(newPrefs);
    toast.success('Preferences updated');
  };

  const handleTypeToggle = (type) => {
    const newPrefs = {
      ...localPreferences,
      types: {
        ...localPreferences.types,
        [type]: !localPreferences.types[type]
      }
    };
    setLocalPreferences(newPrefs);
    updatePreferences(newPrefs);
    toast.success('Notification type updated');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Desktop notifications enabled');
      handleToggle('desktopEnabled', true);
    } else {
      toast.error('Desktop notifications denied');
      handleToggle('desktopEnabled', false);
    }
  };

  const notificationTypes = [
    { key: 'like', label: 'Likes on your posts', icon: 'mdi:heart', color: 'text-red-500' },
    { key: 'comment', label: 'Comments on your posts', icon: 'mdi:comment', color: 'text-blue-500' },
    { key: 'follow', label: 'New followers', icon: 'mdi:account-plus', color: 'text-green-500' },
    { key: 'mention', label: 'Mentions in posts', icon: 'mdi:at', color: 'text-purple-500' },
    { key: 'share', label: 'Shares of your posts', icon: 'mdi:share-variant', color: 'text-orange-500' },
    { key: 'reply', label: 'Replies to your comments', icon: 'mdi:reply', color: 'text-indigo-500' },
  ];

  const notificationPermission = 'Notification' in window ? Notification.permission : 'unsupported';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon icon="mdi:cog" width={28} />
            Notification Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize how and when you receive notifications
          </p>
        </div>

        {/* General Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>

          <div className="space-y-4">
            {/* Sound Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:volume-high" width={24} className="text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Sound notifications
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Play a sound when you receive a notification
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.soundEnabled}
                  onChange={() => handleToggle('soundEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:monitor" width={24} className="text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Desktop notifications
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show browser notifications
                    {notificationPermission === 'denied' && (
                      <span className="text-red-500 ml-1">(Blocked by browser)</span>
                    )}
                  </p>
                </div>
              </div>
              {notificationPermission === 'default' ? (
                <button
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Enable
                </button>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.desktopEnabled && notificationPermission === 'granted'}
                    onChange={() => handleToggle('desktopEnabled')}
                    disabled={notificationPermission !== 'granted'}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              )}
            </div>

            {/* Do Not Disturb */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:moon-waning-crescent" width={24} className="text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Do not disturb
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mute all notifications temporarily
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.doNotDisturb}
                  onChange={() => handleToggle('doNotDisturb')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notification Types
          </h2>

          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon icon={type.icon} width={24} className={type.color} />
                  <p className="font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.types[type.key]}
                    onChange={() => handleTypeToggle(type.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Icon icon="mdi:information" width={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">About notifications</p>
              <p>
                Your preferences are saved locally and will be remembered on this device. 
                Desktop notifications require browser permission and may not work if blocked by your browser settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
