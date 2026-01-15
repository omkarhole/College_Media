import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { notificationsApi } from '../api/endpoints';
import { toast } from 'react-hot-toast';

const NotificationCenter = () => {
  const { 
    notifications: contextNotifications, 
    unreadCount, 
    markAllAsRead, 
    clearAll,
    loading: contextLoading 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Load more notifications with pagination
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const data = await notificationsApi.getAll({ 
        page: page + 1, 
        limit: 20,
        type: filter !== 'all' ? filter : undefined 
      });
      
      if (data.notifications.length === 0) {
        setHasMore(false);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
      toast.error('Failed to load more notifications');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, filter]);

  // Reset notifications when filter changes
  useEffect(() => {
    setNotifications(
      filter === 'all' 
        ? contextNotifications 
        : contextNotifications.filter(n => n.type === filter)
    );
    setPage(1);
    setHasMore(true);
  }, [filter, contextNotifications]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 500
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, filter, loadMore]);

  const filters = [
    { value: 'all', label: 'All', icon: 'mdi:bell' },
    { value: 'like', label: 'Likes', icon: 'mdi:heart' },
    { value: 'comment', label: 'Comments', icon: 'mdi:comment' },
    { value: 'follow', label: 'Follows', icon: 'mdi:account-plus' },
    { value: 'mention', label: 'Mentions', icon: 'mdi:at' },
    { value: 'share', label: 'Shares', icon: 'mdi:share-variant' },
    { value: 'reply', label: 'Replies', icon: 'mdi:reply' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon icon="mdi:bell" width={28} />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all notifications?')) {
                      clearAll();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon icon={f.icon} width={18} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {contextLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="mdi:loading" width={32} className="animate-spin text-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Icon 
                icon="mdi:bell-outline" 
                width={64} 
                className="text-gray-400 dark:text-gray-600 mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                {filter === 'all' 
                  ? "You're all caught up! We'll notify you when something happens."
                  : `No ${filter} notifications to show.`}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="p-4 text-center border-t border-gray-200 dark:border-gray-800">
                  {loading ? (
                    <Icon icon="mdi:loading" width={24} className="animate-spin text-blue-600 mx-auto" />
                  ) : (
                    <button
                      onClick={loadMore}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
