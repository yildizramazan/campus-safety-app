export type UserRole = 'user' | 'admin';

export type NotificationStatus = 'open' | 'in_review' | 'resolved';

export type NotificationType = 'health' | 'security' | 'environmental' | 'lost_found' | 'technical';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  photoURL?: string;
  createdAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  location: Location;
  status: NotificationStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string;
  followedBy: string[];
}

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  emergencyAlerts: boolean;
}
