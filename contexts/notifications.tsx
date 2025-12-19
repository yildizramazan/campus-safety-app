import { db } from '@/config/firebaseConfig';
import {
  createEmergencyAlertInDb,
  createNotificationInDb,
  deleteNotificationFromDb,
  updateNotificationInDb
} from '@/services/database';
import { EmergencyAlert, Notification, NotificationStatus, NotificationType } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
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
  photoUrl?: string | null;
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs to track previous state for alert logic
  const prevNotificationsRef = useRef<Notification[]>([]);
  const prevAlertsRef = useRef<EmergencyAlert[]>([]);
  const isFirstLoad = useRef(true);

  // Real-time listener for Notifications
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          title: data.title,
          description: data.description,
          location: data.location,
          status: data.status,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          photoUrl: data.photoUrl,
          followedBy: data.followedBy || [],
        } as Notification;
      });

      setNotifications(newNotifications);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for Emergency Alerts
  useEffect(() => {
    const q = query(collection(db, 'emergency_alerts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAlerts: EmergencyAlert[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          createdBy: data.createdBy,
        } as EmergencyAlert;
      });

      setEmergencyAlerts(newAlerts);
    }, (error) => {
      console.error("Error listening to emergency alerts:", error);
    });

    return () => unsubscribe();
  }, []);

  // Alert Logic
  useEffect(() => {
    if (isFirstLoad.current) {
      if (!loading) {
        prevNotificationsRef.current = notifications;
        prevAlertsRef.current = emergencyAlerts;
        isFirstLoad.current = false;
      }
      return;
    }

    // Check for new Emergency Alerts
    if (emergencyAlerts.length > prevAlertsRef.current.length) {
      const latestAlert = emergencyAlerts[0];
      // Only show if it's actually new (top of the list)
      if (!prevAlertsRef.current.find(a => a.id === latestAlert.id)) {
        Alert.alert(
          `🚨 EMERGENCY ALERT: ${latestAlert.title}`,
          latestAlert.message,
          [{ text: 'Dismiss' }]
        );
      }
    }

    // Check for Status Updates on Followed Notifications
    if (user) {
      notifications.forEach(curr => {
        const prev = prevNotificationsRef.current.find(p => p.id === curr.id);

        // If we were following it, and status changed
        if (prev && curr.followedBy.includes(user.id) && prev.status !== curr.status) {
          Alert.alert(
            'Status Update',
            `The status of "${curr.title}" has moved to: ${curr.status.toUpperCase().replace('_', ' ')}`
          );
        }
      });
    }

    prevNotificationsRef.current = notifications;
    prevAlertsRef.current = emergencyAlerts;
  }, [notifications, emergencyAlerts, user, loading]);


  // Placeholder for manual refresh if needed (now handled by listeners mainly)
  const refreshNotifications = useCallback(async () => {
    // No-op or maybe re-init listeners if we wanted complex error recovery
    console.log("Refreshed called - listeners are active");
  }, []);

  const createNotification = useCallback(async (data: CreateNotificationData): Promise<Notification> => {
    if (!user) throw new Error('User not authenticated');

    const timestamp = new Date().toISOString();
    const newNotificationData: Omit<Notification, 'id'> = {
      ...data,
      status: 'open',
      createdBy: user.id,
      createdByName: user.fullName,
      createdAt: timestamp,
      updatedAt: timestamp,
      followedBy: [user.id],
    };

    const id = await createNotificationInDb(newNotificationData);
    // State update handled by listener
    return { id, ...newNotificationData };
  }, [user]);

  const updateNotificationStatus = useCallback(async (id: string, status: NotificationStatus) => {
    try {
      await updateNotificationInDb(id, { status, updatedAt: new Date().toISOString() });
      // State update handled by listener
    } catch (error) {
      console.error("Failed to update status", error);
      throw error;
    }
  }, []);

  const updateNotification = useCallback(async (id: string, updates: Partial<Notification>) => {
    try {
      await updateNotificationInDb(id, { ...updates, updatedAt: new Date().toISOString() });
      // State update handled by listener
    } catch (error) {
      console.error("Failed to update notification", error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteNotificationFromDb(id);
      // State update handled by listener
    } catch (error) {
      console.error("Failed to delete notification", error);
      throw error;
    }
  }, []);

  const toggleFollow = useCallback(async (notificationId: string) => {
    if (!user) return;

    // Optimistic check (actual update via DB)
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    const isFollowing = notification.followedBy.includes(user.id);
    const newFollowers = isFollowing
      ? notification.followedBy.filter(id => id !== user.id)
      : [...notification.followedBy, user.id];

    try {
      await updateNotificationInDb(notificationId, { followedBy: newFollowers });
    } catch (error) {
      console.error("Failed to toggle follow", error);
    }
  }, [user, notifications]);

  const createEmergencyAlert = useCallback(async (title: string, message: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can create emergency alerts');
    }

    const timestamp = new Date().toISOString();
    const alertData: Omit<EmergencyAlert, 'id'> = {
      title,
      message,
      createdAt: timestamp,
      createdBy: user.id,
    };

    try {
      const id = await createEmergencyAlertInDb(alertData);
      const newAlert = { id, ...alertData };
      return newAlert;
    } catch (error) {
      console.error("Failed to create emergency alert", error);
      throw error;
    }
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
    loading,
    refreshNotifications,
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
