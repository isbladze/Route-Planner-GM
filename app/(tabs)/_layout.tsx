import { Tabs } from "expo-router";
import { MapPin, Route, Building2 } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";

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
          title: "Indirizzi",
          tabBarIcon: ({ color }) => <MapPin color={color} />,
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          title: "Percorso",
          tabBarIcon: ({ color }) => <Route color={color} />,
        }}
      />
      <Tabs.Screen
        name="hotels"
        options={{
          title: "Hotel",
          tabBarIcon: ({ color }) => <Building2 color={color} />,
        }}
      />
    </Tabs>
  );
}