import { EmergencyAlert, Notification, User } from '@/types';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Creates a user profile in Firestore.
 * @param user The user data to save.
 */
export const createUserProfile = async (user: User) => {
    try {
        await setDoc(doc(db, 'users', user.id), {
            ...user,
            createdAt: Timestamp.fromDate(new Date(user.createdAt)),
        });
    } catch (e) {
        console.error("Error creating user profile: ", e);
        throw e;
    }
};

/**
 * Fetches a user profile from Firestore.
 * @param uid The user ID.
 * @returns The user profile data or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                email: data.email,
                fullName: data.fullName,
                role: data.role,
                department: data.department,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            } as User;
        } else {
            return null;
        }
    } catch (e) {
        console.error("Error getting user profile: ", e);
        throw e;
    }
};

/**
 * Adds a new notification to Firestore.
 * @param notification The notification data to save.
 * @returns The ID of the newly created document.
 */
export const createNotificationInDb = async (notification: Omit<Notification, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'notifications'), {
            ...notification,
            createdAt: Timestamp.fromDate(new Date(notification.createdAt)),
            updatedAt: Timestamp.fromDate(new Date(notification.updatedAt)),
        });
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

/**
 * Fetches all notifications from Firestore.
 * @returns A list of notifications.
 */
export const fetchNotificationsFromDb = async (): Promise<Notification[]> => {
    try {
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const notifications: Notification[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore timestamps back to ISO strings if needed, or keep as standard Date handling
            notifications.push({
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
            } as Notification);
        });
        return notifications;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw e;
    }
};

export const updateNotificationInDb = async (id: string, updates: Partial<Notification>) => {
    try {
        const docRef = doc(db, 'notifications', id);
        const updatesToSave: any = { ...updates };
        if (updates.updatedAt) {
            updatesToSave.updatedAt = Timestamp.fromDate(new Date(updates.updatedAt));
        }
        await updateDoc(docRef, updatesToSave);
    } catch (e) {
        console.error("Error updating document: ", e);
        throw e;
    }
};

export const deleteNotificationFromDb = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
};


export const createEmergencyAlertInDb = async (alert: Omit<EmergencyAlert, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'emergency_alerts'), {
            ...alert,
            createdAt: Timestamp.fromDate(new Date(alert.createdAt)),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error creating emergency alert: ", e);
        throw e;
    }
};

export const fetchEmergencyAlertsFromDb = async (): Promise<EmergencyAlert[]> => {
    try {
        const q = query(collection(db, 'emergency_alerts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const alerts: EmergencyAlert[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            alerts.push({
                id: doc.id,
                title: data.title,
                message: data.message,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                createdBy: data.createdBy,
            } as EmergencyAlert);
        });
        return alerts;
    } catch (e) {
        console.error("Error fetching emergency alerts: ", e);
        throw e;
    }
};
