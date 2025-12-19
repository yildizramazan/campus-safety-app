import { db } from '@/config/firebaseConfig';
import { EmergencyAlert, Notification, User, UserRole } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';

export const createUserProfile = async (profile: {
    uid: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    department: string;
    role?: UserRole;
}) => {
    const {
        uid,
        email,
        fullName,
        firstName,
        lastName,
        department,
        role = 'user',
    } = profile;
    const firstNameClean = (firstName ?? '').trim();
    const lastNameClean = (lastName ?? '').trim();
    const fullNameClean =
        (fullName ?? '').trim() ||
        [firstNameClean, lastNameClean].filter(Boolean).join(' ') ||
        email.split('@')[0];

    await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        fullName: fullNameClean,
        firstName: firstNameClean,
        lastName: lastNameClean,
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
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        department: data.department ?? '',
        role: (data.role as UserRole) ?? 'user',
        photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
        createdAt,
    };
};

export const updateUserProfileFields = async (
    uid: string,
    fields: {
        firstName: string;
        lastName: string;
        department: string;
    }
): Promise<void> => {
    const firstNameClean = fields.firstName.trim();
    const lastNameClean = fields.lastName.trim();
    const departmentClean = fields.department.trim();

    // Validation: ensure no empty strings
    if (!firstNameClean || firstNameClean.length < 2) {
        throw new Error('First name must be at least 2 characters');
    }
    if (!lastNameClean || lastNameClean.length < 2) {
        throw new Error('Last name must be at least 2 characters');
    }
    if (!departmentClean) {
        throw new Error('Department is required');
    }

    // Compute fullName from firstName + lastName
    const fullNameClean = [firstNameClean, lastNameClean].filter(Boolean).join(' ');

    // Only write non-empty, valid values
    await updateDoc(doc(db, 'users', uid), {
        firstName: firstNameClean,
        lastName: lastNameClean,
        fullName: fullNameClean,
        department: departmentClean,
        updatedAt: serverTimestamp(),
    });
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
