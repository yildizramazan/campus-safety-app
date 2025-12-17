import { auth } from '@/config/firebaseConfig';
import { createUserProfile, getUserProfile } from '@/services/database';
import { NotificationPreferences, User } from '@/types';
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

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? overrides.email ?? '',
    fullName:
      overrides.fullName ??
      firebaseUser.displayName ??
      firebaseUser.email?.split('@')[0] ??
      'User',
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
    },
  });

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
          } else {
            console.warn('User profile not found for', firebaseUser.uid);
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

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        const resolvedUser = userProfile ?? buildFallbackUser(firebaseUser);

        setState(prev => ({
          ...prev,
          user: resolvedUser,
          isAuthenticated: true,
          isLoading: false,
        }));

        if (!userProfile) {
          return {
            success: true,
            message:
              'Signed in, but your profile could not be found yet. Some features may be limited until it is created.',
          };
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
          user: buildFallbackUser(firebaseUser),
          isAuthenticated: true,
          isLoading: false,
        }));

        return {
          success: true,
          message: isProbablyOfflineError(profileError)
            ? 'Signed in, but your profile could not be loaded while offline. Some features may be limited until you are online.'
            : 'Signed in, but your profile could not be loaded. Please try again shortly.',
        };
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
    fullName: string,
    department: string
  ): Promise<AuthResult> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        email,
        fullName,
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
      await AsyncStorage.setItem('preferences', JSON.stringify(newPreferences));
      setState(prev => ({
        ...prev,
        preferences: newPreferences,
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
