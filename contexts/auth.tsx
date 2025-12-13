import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { User, NotificationPreferences } from '@/types';
import { MOCK_USERS } from '@/mocks/data';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  preferences: NotificationPreferences;
}

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
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, storedPrefs] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('preferences'),
      ]);

      setState({
        user: storedUser ? JSON.parse(storedUser) : null,
        isAuthenticated: !!storedUser,
        isLoading: false,
        preferences: storedPrefs ? JSON.parse(storedPrefs) : {
          pushEnabled: true,
          emailEnabled: true,
          emergencyAlerts: true,
        },
      });
    } catch (error) {
      console.error('Failed to load auth:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = MOCK_USERS.find(u => u.email === email);

      if (!user || password !== 'password123') {
        return { success: false, error: 'Invalid email or password' };
      }

      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
      }));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    department: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      const newUser: User = {
        id: Date.now().toString(),
        email,
        fullName,
        department,
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      MOCK_USERS.push(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setState(prev => ({
        ...prev,
        user: newUser,
        isAuthenticated: true,
      }));

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user');
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
      }));
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
    try {
      if (!state.user) return;

      const updatedUser = { ...state.user, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [state.user]);

  return {
    ...state,
    login,
    register,
    logout,
    updatePreferences,
    updateProfile,
  };
});
