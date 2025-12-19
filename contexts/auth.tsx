import { auth } from '@/config/firebaseConfig';
import { NOTIFICATION_TYPES } from '@/constants/notifications';
import { createUserProfile, getUserProfile } from '@/services/database';
import { NotificationPreferences, NotificationType, User } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  preferences: NotificationPreferences;
}

type AuthResult = { success: boolean; error?: string; message?: string };

const defaultTypePreferences = NOTIFICATION_TYPES.reduce(
  (acc, type) => {
    acc[type.value] = true;
    return acc;
  },
  {} as Record<NotificationType, boolean>
);

const isProbablyOfflineError = (error: any) => {
  const code = error?.code;
  const message = String(error?.message ?? '').toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'auth/network-request-failed' ||
    message.includes('offline') ||
    message.includes('network')
  );
};

const buildFallbackUser = (
  firebaseUser: FirebaseUser,
  overrides: Partial<User> = {}
): User => {
  const creationTime = firebaseUser.metadata.creationTime;
  const createdAt = creationTime
    ? new Date(creationTime).toISOString()
    : new Date().toISOString();
  const fullName =
    overrides.fullName ??
    firebaseUser.displayName ??
    firebaseUser.email?.split('@')[0] ??
    'User';
  const nameParts = fullName.trim().split(' ').filter(Boolean);
  const firstName = overrides.firstName ?? nameParts[0] ?? '';
  const lastName = overrides.lastName ?? nameParts.slice(1).join(' ');

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? overrides.email ?? '',
    fullName,
    firstName,
    lastName,
    department: overrides.department ?? '',
    role: overrides.role ?? 'user',
    createdAt: overrides.createdAt ?? createdAt,
  };
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    preferences: {
      pushEnabled: true,
      emailEnabled: true,
      emergencyAlerts: true,
      typePreferences: defaultTypePreferences,
    },
  });

  useEffect(() => {
    let isMounted = true;
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem('preferences');
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<NotificationPreferences>;
        const typePreferences = {
          ...defaultTypePreferences,
          ...(parsed.typePreferences ?? {}),
        };
        const nextPreferences: NotificationPreferences = {
          pushEnabled: parsed.pushEnabled ?? true,
          emailEnabled: parsed.emailEnabled ?? true,
          emergencyAlerts: parsed.emergencyAlerts ?? true,
          typePreferences,
        };
        if (isMounted) {
          setState(prev => ({
            ...prev,
            preferences: nextPreferences,
          }));
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const fallbackUser = buildFallbackUser(firebaseUser);

        // Never block authentication on profile fetch. If Firestore is offline/unavailable, we still stay signed in.
        setState(prev => ({
          ...prev,
          user: prev.user?.id === firebaseUser.uid ? prev.user : fallbackUser,
          isAuthenticated: true,
          isLoading: false,
        }));

        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setState(prev => ({
              ...prev,
              user: userProfile,
              isAuthenticated: true,
              isLoading: false,
            }));
          }
        } catch (error: any) {
          console.error(
            'Error fetching user profile:',
            error?.code,
            error?.message
          );
        }
      } else {
        setState(prev => ({ ...prev, user: null, isAuthenticated: false, isLoading: false }));
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const fallbackUser = buildFallbackUser(firebaseUser, { email });

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        const resolvedUser = userProfile ?? fallbackUser;

        setState(prev => ({
          ...prev,
          user: resolvedUser,
          isAuthenticated: true,
          isLoading: false,
        }));

        if (!userProfile) {
          try {
            await createUserProfile({
              uid: firebaseUser.uid,
              email: fallbackUser.email,
              fullName: fallbackUser.fullName,
              firstName: fallbackUser.firstName,
              lastName: fallbackUser.lastName,
              department: fallbackUser.department,
              role: fallbackUser.role,
            });
          } catch (profileError: any) {
            console.error(
              'Profile write error:',
              profileError?.code,
              profileError?.message
            );
          }
        }

        return { success: true };
      } catch (profileError: any) {
        console.error(
          'Login profile fetch error:',
          profileError?.code,
          profileError?.message
        );

        setState(prev => ({
          ...prev,
          user: fallbackUser,
          isAuthenticated: true,
          isLoading: false,
        }));

        return { success: true };
      }
    } catch (error: any) {
      console.error('Login error:', error?.code, error?.message);
      let errorMessage = 'An error occurred during login';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    department: string
  ): Promise<AuthResult> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const fullName = `${firstName} ${lastName}`.trim();

      const newUser: User = {
        id: firebaseUser.uid,
        email,
        fullName,
        firstName,
        lastName,
        department,
        role: 'user', // Default role
        createdAt: new Date().toISOString(),
      };

      // Optimistically set local state so navigation can continue even if Firestore is offline.
      setState(prev => ({
        ...prev,
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      }));

      // Create profile in Firestore (non-blocking for auth). Uses serverTimestamp() for createdAt.
      try {
        await createUserProfile({
          uid: firebaseUser.uid,
          email,
          fullName,
          firstName,
          lastName,
          department,
          role: 'user',
        });
      } catch (profileError: any) {
        console.error(
          'Profile write error:',
          profileError?.code,
          profileError?.message
        );

        return {
          success: true,
          message: isProbablyOfflineError(profileError)
            ? 'Account created, but your profile could not be saved while offline. You are still signed in; please connect to the internet to finish setup.'
            : 'Account created, but your profile could not be saved. You are still signed in; please try again shortly.',
        };
      }

      // State will update via onAuthStateChanged listener, but we might want to manually set it 
      // locally if the listener is slower than the nav transition.
      // For now, relying on the listener is safer to ensure data consistency.

      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error?.code, error?.message);
      let errorMessage = 'An error occurred during registration';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // State updates automatically via onAuthStateChanged
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    try {
      const mergedPreferences = {
        ...newPreferences,
        typePreferences: {
          ...defaultTypePreferences,
          ...newPreferences.typePreferences,
        },
      };
      await AsyncStorage.setItem('preferences', JSON.stringify(mergedPreferences));
      setState(prev => ({
        ...prev,
        preferences: mergedPreferences,
      }));
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, ...updates },
      };
    });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updatePreferences,
    updateProfile,
  };
});
