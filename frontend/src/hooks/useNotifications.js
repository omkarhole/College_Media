import { useNotifications as useNotificationContext } from "../context/NotificationContext";

// Re-export the hook for convenience
export { useNotifications as default } from "../context/NotificationContext";

// Additional utility hooks for notifications

export const useUnreadCount = () => {
  const { unreadCount } = useNotificationContext();
  return unreadCount;
};

export const useNotificationPreferences = () => {
  const { preferences, updatePreferences } = useNotificationContext();
  return { preferences, updatePreferences };
};

export const useNotificationActions = () => {
  const { markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotificationContext();
  return { markAsRead, markAllAsRead, deleteNotification, clearAll };
};
