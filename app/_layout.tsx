import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#FFFFFF",
            },
            headerShadowVisible: false,
            headerTintColor: "#0F172A",
            headerTitleStyle: {
              fontWeight: "700",
              fontSize: 18,
            },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "Dashboard",
            }}
          />
          <Stack.Screen
            name="allotments"
            options={{
              title: "Add Allotments",
            }}
          />
          <Stack.Screen
            name="reports"
            options={{
              title: "Reports",
            }}
          />
          <Stack.Screen
            name="modify"
            options={{
              title: "Modify Allotments",
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
