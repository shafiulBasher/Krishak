import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Package, Truck, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const NotificationDropdown = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ limit: 20 });
      // API interceptor returns response.data, so response is already the data object
      if (response && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        // Fallback if structure is different
        setNotifications(response?.notifications || []);
        setUnreadCount(response?.unreadCount || 0);
      }
      setConnectionError(false); // Reset on success
    } catch (error) {
      // Stop polling on network errors
      if (error.message?.includes('Network Error') || error.code === 'ERR_CONNECTION_REFUSED') {
        setConnectionError(true);
      }
      // Silently handle - don't show error toast
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      // API interceptor returns response.data, so response is already the data object
      if (response && response.data) {
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        setUnreadCount(response?.unreadCount || 0);
      }
      setConnectionError(false); // Reset on success
    } catch (error) {
      // Stop polling on network errors
      if (error.message?.includes('Network Error') || error.code === 'ERR_CONNECTION_REFUSED') {
        setConnectionError(true);
      }
      // Silently fail for unread count - don't spam errors
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, []);

  // Poll for new notifications every 30 seconds (only if no connection errors)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!connectionError) {
        fetchUnreadCount();
        if (isOpen) {
          fetchNotifications();
        }
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, connectionError]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id
              ? { ...n, isRead: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.relatedOrder) {
      const orderId = typeof notification.relatedOrder === 'object' ? notification.relatedOrder._id : notification.relatedOrder;
      
      if (user?.role === 'farmer') {
        navigate(`/farmer/orders/${orderId}`);
      } else if (user?.role === 'transporter') {
        // Transporters usually go to my-deliveries or active jobs
        navigate(`/transporter/my-deliveries`); 
      } else {
        navigate(`/buyer/orders/${orderId}`);
      }
    } else if (notification.relatedProduct) {
      navigate(`/browse-products`);
    }

    setIsOpen(false);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      toast.success(t('notifications.markedAllRead'));
    } catch (error) {
      toast.error(t('notifications.markAllFailed'));
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (!notification?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success(t('notifications.deleted'));
    } catch (error) {
      toast.error(t('notifications.deleteFailed'));
      console.error('Error deleting notification:', error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'order_placed':
      case 'order_confirmed':
        return <ShoppingCart className={`${iconClass} text-blue-500`} />;
      case 'order_completed':
      case 'order_delivered':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'order_cancelled':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'delivery_assigned':
      case 'delivery_picked':
      case 'delivery_in_transit':
        return <Truck className={`${iconClass} text-purple-500`} />;
      default:
        return <Package className={`${iconClass} text-gray-500`} />;
    }
  };

  // Map notification type to locale key for translated titles
  const getLocalizedTitle = (notification) => {
    const typeMap = {
      order_placed: 'notifications.orderPlaced',
      order_confirmed: 'notifications.orderConfirmed',
      order_completed: 'notifications.orderCompleted',
      order_delivered: 'notifications.orderDelivered',
      order_cancelled: 'notifications.orderCancelled',
      delivery_assigned: 'notifications.deliveryAssigned',
      delivery_picked: 'notifications.deliveryPicked',
      delivery_in_transit: 'notifications.deliveryInTransit',
      payment_received: 'notifications.paymentReceived',
      delivery_payment: 'notifications.deliveryPayment',
    };
    const key = typeMap[notification.type];
    return key ? t(key) : notification.title;
  };

  // Generate localized message body from notification type and metadata
  const getLocalizedMessage = (notification) => {
    const { type, message, metadata } = notification;
    const { orderNumber, quantity, deliveryFee } = metadata || {};
    const fee = Number(deliveryFee || 0).toLocaleString();
    switch (type) {
      case 'order_placed':
        return t('notifications.msgOrderPlaced', { orderNumber, quantity });
      case 'order_confirmed':
        return t('notifications.msgOrderConfirmed', { orderNumber });
      case 'order_cancelled':
        return t('notifications.msgOrderCancelled', { orderNumber });
      case 'order_completed':
        return message?.includes('Your order')
          ? t('notifications.msgOrderCompletedBuyer', { orderNumber })
          : t('notifications.msgOrderCompletedFarmer', { orderNumber });
      case 'delivery_assigned':
        return message?.includes('You have been assigned')
          ? t('notifications.msgDeliveryAssignedTransporter', { orderNumber })
          : t('notifications.msgDeliveryAssignedBuyer', { orderNumber });
      case 'delivery_picked':
        return t('notifications.msgDeliveryPicked', { orderNumber });
      case 'delivery_in_transit':
        return t('notifications.msgDeliveryInTransit', { orderNumber });
      case 'order_delivered':
        return message?.includes('Your order')
          ? t('notifications.msgOrderDeliveredBuyer', { orderNumber })
          : t('notifications.msgOrderDeliveredFarmer', { orderNumber });
      case 'delivery_payment':
        return t('notifications.msgDeliveryPayment', { orderNumber, deliveryFee: fee });
      default:
        return message;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minsAgo', { n: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { n: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { n: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-md hover:bg-primary-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {t('notifications.unread', { count: unreadCount })}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2">{t('notifications.loading')}</p>
            </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {getLocalizedTitle(notification)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {getLocalizedMessage(notification)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification._id, e)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('notifications.viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

