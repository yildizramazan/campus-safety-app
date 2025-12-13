import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useState } from 'react';
import { Notification, NotificationStatus, NotificationType, EmergencyAlert } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/mocks/data';
import { useAuth } from './auth';

interface CreateNotificationData {
  type: NotificationType;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photoUrl?: string;
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  const createNotification = useCallback((data: CreateNotificationData): Notification => {
    if (!user) throw new Error('User not authenticated');

    const newNotification: Notification = {
      id: Date.now().toString(),
      ...data,
      status: 'open',
      createdBy: user.id,
      createdByName: user.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followedBy: [user.id],
    };

    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  }, [user]);

  const updateNotificationStatus = useCallback((id: string, status: NotificationStatus) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, status, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleFollow = useCallback((notificationId: string) => {
    if (!user) return;

    setNotifications(prev =>
      prev.map(n => {
        if (n.id !== notificationId) return n;

        const isFollowing = n.followedBy.includes(user.id);
        return {
          ...n,
          followedBy: isFollowing
            ? n.followedBy.filter(id => id !== user.id)
            : [...n.followedBy, user.id],
        };
      })
    );
  }, [user]);

  const createEmergencyAlert = useCallback((title: string, message: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can create emergency alerts');
    }

    const alert: EmergencyAlert = {
      id: Date.now().toString(),
      title,
      message,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    setEmergencyAlerts(prev => [alert, ...prev]);
    return alert;
  }, [user]);

  const getNotificationById = useCallback((id: string) => {
    return notifications.find(n => n.id === id);
  }, [notifications]);

  const getFollowedNotifications = useCallback(() => {
    if (!user) return [];
    return notifications.filter(n => n.followedBy.includes(user.id));
  }, [notifications, user]);

  return {
    notifications,
    emergencyAlerts,
    createNotification,
    updateNotificationStatus,
    updateNotification,
    deleteNotification,
    toggleFollow,
    createEmergencyAlert,
    getNotificationById,
    getFollowedNotifications,
  };
});
