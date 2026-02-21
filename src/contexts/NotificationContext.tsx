import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface Notification {
  _id: string;
  type: 'winner_selected' | 'prize_distributed' | 'campaign_ended' | 'campaign_started' | 'submission_approved' | 'submission_rejected' | 'general';
  title: string;
  message: string;
  campaignId?: {
    _id: string;
    title: string;
    thumbnailImage?: string;
  };
  data?: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  
  // Actions
  fetchNotifications: (skip?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchNotifications = async (skip = 0) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const data = await api.notifications.getNotifications({
        limit: 10,
        skip
      });
      
      if (skip === 0) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api.notifications.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await api.notifications.markAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif._id) 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Update unread count
      const unreadToMark = notifications.filter(n => 
        notificationIds.includes(n._id) && !n.isRead
      ).length;
      setUnreadCount(prev => Math.max(0, prev - unreadToMark));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.notifications.deleteNotification(id);
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const refreshNotifications = async () => {
    await Promise.all([
      fetchNotifications(0),
      fetchUnreadCount()
    ]);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Hook for checking if user has high priority unread notifications
export function useHasUrgentNotifications() {
  const { notifications } = useNotifications();
  
  return notifications.some(
    notification => 
      !notification.isRead && 
      (notification.priority === 'high' || notification.priority === 'urgent')
  );
}

// Hook for getting notifications by type
export function useNotificationsByType(type: string) {
  const { notifications } = useNotifications();
  
  return notifications.filter(notification => notification.type === type);
}

// Hook for winner notifications specifically
export function useWinnerNotifications() {
  return useNotificationsByType('winner_selected');
}

// Hook for prize notifications specifically
export function usePrizeNotifications() {
  return useNotificationsByType('prize_distributed');
}
