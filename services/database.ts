import { db } from '@/config/firebaseConfig';
import { EmergencyAlert, Notification, User, UserRole } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

export const createUserProfile = async (profile: {
  uid: string;
  email: string;
  fullName: string;
  department: string;
  role?: UserRole;
}) => {
  const { uid, email, fullName, department, role = 'user' } = profile;

  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    fullName,
    department,
    role,
    createdAt: serverTimestamp(),
  });
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const snapshot = await getDoc(doc(db, 'users', userId));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<User> & {
    uid?: string;
    createdAt?: unknown;
  };

  const createdAtRaw = data.createdAt as any;
  const createdAt =
    createdAtRaw instanceof Timestamp
      ? createdAtRaw.toDate().toISOString()
      : typeof createdAtRaw === 'string'
        ? createdAtRaw
        : new Date().toISOString();

  return {
    id: snapshot.id,
    email: data.email ?? '',
    fullName: data.fullName ?? '',
    department: data.department ?? '',
    role: (data.role as UserRole) ?? 'user',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
    createdAt,
  };
};

export const updateUserProfilePhoto = async (uid: string, photoURL: string) => {
  await updateDoc(doc(db, 'users', uid), { photoURL });
};

export const createNotificationInDb = async (notification: Omit<Notification, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'notifications'), notification);
  return ref.id;
};

export const updateNotificationInDb = async (
  notificationId: string,
  updates: Partial<Notification>
) => {
  await updateDoc(doc(db, 'notifications', notificationId), updates);
};

export const deleteNotificationFromDb = async (notificationId: string) => {
  await deleteDoc(doc(db, 'notifications', notificationId));
};

export const createEmergencyAlertInDb = async (
  alert: Omit<EmergencyAlert, 'id'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'emergency_alerts'), alert);
  return ref.id;
};
