import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { notificationsApi } from '../api/endpoints';
import { playNotificationSound } from '../utils/notificationSound';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    soundEnabled: true,
    desktopEnabled: true,
    doNotDisturb: false,
    types: {
      like: true,
      comment: true,
      follow: true,
      mention: true,
      share: true,
      reply: true,
    },
  });
  const socket = useSocket();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll({ limit: 20 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // Check if notification type is enabled
      if (!preferences.types[notification.type]) return;
      
      // Check do not disturb mode
      if (preferences.doNotDisturb) return;

      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Update document title
      document.title = `(${unreadCount + 1}) College Media`;

      // Show toast notification
      if (!notification.silent) {
        toast.success(notification.message, {
          icon: getNotificationIcon(notification.type),
          duration: 4000,
        });
      }

      // Play sound
      if (preferences.soundEnabled) {
        playNotificationSound();
      }

      // Show desktop notification
      if (preferences.desktopEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('College Media', {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
        });
      }
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, preferences, unreadCount]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update document title
      const newCount = Math.max(0, unreadCount - 1);
      document.title = newCount > 0 ? `(${newCount}) College Media` : 'College Media';
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  }, [unreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Reset document title
      document.title = 'College Media';
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsApi.delete(notificationId);
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await notificationsApi.clearAll();
      
      setNotifications([]);
      setUnreadCount(0);
      document.title = 'College Media';
      
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error('Failed to clear notifications');
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
    
    // Request desktop notification permission if enabled
    if (newPreferences.desktopEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Save to localStorage
    localStorage.setItem('notificationPreferences', JSON.stringify({ ...preferences, ...newPreferences }));
  }, [preferences]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to get notification icon
function getNotificationIcon(type) {
  const icons = {
    like: '❤️',
    comment: '💬',
    follow: '👥',
    mention: '🔔',
    share: '🔄',
    reply: '↩️',
  };
  return icons[type] || '🔔';
}
