import Colors from "@/constants/colors";
import { Tabs } from "expo-router";
import { Bell, Home, Map as MapIcon, PlusCircle, User } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <MapIcon color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Bell color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Report",
          tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
