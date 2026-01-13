import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClick }) => {
  const { markAsRead } = useNotifications();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (onClick) onClick();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      like: { icon: 'mdi:heart', color: 'text-red-500' },
      comment: { icon: 'mdi:comment', color: 'text-blue-500' },
      follow: { icon: 'mdi:account-plus', color: 'text-green-500' },
      mention: { icon: 'mdi:at', color: 'text-purple-500' },
      share: { icon: 'mdi:share-variant', color: 'text-orange-500' },
      reply: { icon: 'mdi:reply', color: 'text-indigo-500' },
    };
    return icons[type] || { icon: 'mdi:bell', color: 'text-gray-500' };
  };

  const iconData = getNotificationIcon(notification.type);

  return (
    <Link
      to={notification.link || '#'}
      onClick={handleClick}
      className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar or Icon */}
        <div className="flex-shrink-0">
          {notification.actor?.avatar ? (
            <img
              src={notification.actor.avatar}
              alt={notification.actor.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${iconData.color}`}>
              <Icon icon={iconData.icon} width={20} />
            </div>
          )}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {notification.actor?.name && (
              <span className="font-semibold">{notification.actor.name}</span>
            )}{' '}
            <span className="text-gray-700 dark:text-gray-300">
              {notification.message}
            </span>
          </p>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {!notification.read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" aria-label="Unread"></span>
            )}
          </div>
        </div>

        {/* Notification Preview (if available) */}
        {notification.preview && (
          <div className="flex-shrink-0 w-12 h-12 ml-2">
            <img
              src={notification.preview}
              alt="Preview"
              className="w-full h-full object-cover rounded"
            />
          </div>
        )}
      </div>
    </Link>
  );
};

export default NotificationItem;
