import { AuthProvider, useAuth } from "@/contexts/auth";
import { NotificationsProvider } from "@/contexts/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuth =
      firstSegment === 'login' ||
      firstSegment === 'register' ||
      firstSegment === 'forgot-password';

    if (!isAuthenticated && !inAuth) {
      router.replace('/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="notification/[id]"
        options={{
          title: "Notification Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="admin"
        options={{
          title: "Admin Panel",
          headerShown: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
