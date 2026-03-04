import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "../context/ThemeContext";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  AppState,
  ActivityIndicator,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { ProfileService } from "../utils/storage";

const CHECK_SUBSCRIPTION_URL =
  "https://tender-allotment-portal.vercel.app/api/check-subscription";

type GuardStatus = "loading" | "ok" | "expired" | "inactive" | "no_internet";

// ── Navigation Guard ─────────────────────────────────────────────────────────

function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    const isOnProfile = segments[0] === "profile";
    if (!isOnProfile && !ProfileService.isProfileComplete()) {
      router.replace("/profile");
    }
  }, [navigationState, segments]);

  return null;
}

// ── Subscription Guard ───────────────────────────────────────────────────────

function SubscriptionGuard() {
  const segments = useSegments();
  const prevSegment = useRef<string | undefined>(undefined);
  const isChecking = useRef(false);

  const [status, setStatus] = useState<GuardStatus>(() =>
    ProfileService.isProfileComplete() ? "loading" : "ok"
  );
  const [toDate, setToDate] = useState("");

  const check = useCallback(async () => {
    if (isChecking.current) return;
    isChecking.current = true;

    if (!ProfileService.isProfileComplete()) {
      setStatus("ok");
      isChecking.current = false;
      return;
    }

    setStatus("loading");
    const { phoneNumber } = ProfileService.getProfile();

    try {
      const res = await fetch(CHECK_SUBSCRIPTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!res.ok) throw new Error("server");

      const data = await res.json();
      const normalizedStatus = data.status?.toLowerCase();

      // Block if explicitly inactive (case-insensitive)
      if (normalizedStatus === "inactive") {
        setToDate(data.toDate ?? "");
        setStatus("inactive");
        isChecking.current = false;
        return;
      }

      // Compare toDate with today (date-only, no time component)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(data.toDate);
      expiry.setHours(0, 0, 0, 0);

      if (today > expiry) {
        setToDate(data.toDate ?? "");
        setStatus("expired");
        isChecking.current = false;
        return;
      }

      // Safety net: only allow access if status is explicitly "active"
      if (normalizedStatus !== "active") {
        setToDate(data.toDate ?? "");
        setStatus("inactive");
        isChecking.current = false;
        return;
      }

      setStatus("ok");
    } catch {
      // Any network failure → treat as no internet
      setStatus("no_internet");
    }

    isChecking.current = false;
  }, []);

  // Initial check on mount
  useEffect(() => {
    check();
  }, []);

  // Re-check when user navigates away from profile screen (profile was just saved)
  useEffect(() => {
    const curr = segments[0];
    if (prevSegment.current === "profile" && curr !== "profile") {
      check();
    }
    prevSegment.current = curr;
  }, [segments, check]);

  // Re-check every time the app returns to the foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  // Periodic re-check every 30 minutes while the app is actively in use
  useEffect(() => {
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [check]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (status === "ok") return null;

  if (status === "loading") {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Verifying subscription…</Text>
      </View>
    );
  }

  if (status === "no_internet") {
    return (
      <View style={styles.overlay}>
        <View style={[styles.iconCircle, { backgroundColor: "#FFF7ED" }]}>
          <AntDesign name="exclamationcircle" size={44} color="#F97316" />
        </View>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          An active internet connection is required to use this app.{"\n"}
          Please check your network settings and try again.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#F97316" }]}
          onPress={check}
          activeOpacity={0.8}
        >
          <AntDesign name="reload1" size={16} color="#fff" />
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // inactive
  if (status === "inactive") {
    return (
      <View style={styles.overlay}>
        <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2" }]}>
          <AntDesign name="closecircle" size={44} color="#EF4444" />
        </View>
        <Text style={styles.title}>Subscription Inactive</Text>
        <Text style={styles.message}>
          Your subscription is currently inactive.{"\n"}
          Please contact your administrator to activate your plan.
        </Text>
      </View>
    );
  }

  // expired
  const formattedDate = toDate
    ? new Date(toDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <View style={styles.overlay}>
      <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2" }]}>
        <AntDesign name="closecircle" size={44} color="#EF4444" />
      </View>
      <Text style={styles.title}>Subscription Expired</Text>
      {!!formattedDate && (
        <Text style={styles.subtitle}>Expired on {formattedDate}</Text>
      )}
      <Text style={styles.message}>
        Your subscription has expired.{"\n"}
        Please contact your administrator to renew your plan.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

// ── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="dark" />
        <NavigationGuard />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#FFFFFF" },
            headerShadowVisible: false,
            headerTintColor: "#0F172A",
            headerTitleStyle: { fontWeight: "700", fontSize: 18 },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="index"
            options={({ navigation }) => ({
              title: "Dashboard",
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("profile")}
                  style={{ marginRight: 4, padding: 6 }}
                  activeOpacity={0.7}
                >
                  <AntDesign name="setting" size={22} color="#0F172A" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="allotments"   options={{ title: "Add Allotments" }} />
          <Stack.Screen name="reports"      options={{ title: "Reports" }} />
          <Stack.Screen name="modify"       options={{ title: "Modify Allotments" }} />
          <Stack.Screen name="data-sources" options={{ title: "Data Sources" }} />
          <Stack.Screen
            name="profile"
            options={{ title: "Profile", headerBackTitle: "Back" }}
          />
        </Stack>
        {/* Rendered after Stack so its absolute overlay sits on top of everything */}
        <SubscriptionGuard />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
