import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { ProfileService } from "../utils/storage";
import { AppProfile } from "../types";

const CHECK_USER_URL =
  "https://tender-allotment-portal.vercel.app/api/check-user";

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [form, setForm] = useState({
    name: "",
    address1: "",
    address2: "",
    phoneNumber: "",
    commission: "",
    hamali: "",
  });
  const [loading, setLoading] = useState(false);
  const [userError, setUserError] = useState("");

  // Pre-populate if profile already exists
  useEffect(() => {
    const profile = ProfileService.getProfile();
    if (profile.name || profile.phoneNumber) {
      setForm({
        name: profile.name || "",
        address1: profile.address1 || "",
        address2: profile.address2 || "",
        phoneNumber: profile.phoneNumber || "",
        commission: profile.defaultCommissionPercentage?.toString() || "2",
        hamali: profile.defaultHamalliPerBag?.toString() || "2",
      });
    }
  }, []);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "phoneNumber") setUserError("");
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const phone = form.phoneNumber.trim();

    if (!name) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    setLoading(true);
    setUserError("");

    try {
      const response = await fetch(CHECK_USER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.exists) {
        setUserError("❌ User is not registered on the portal.");
        setLoading(false);
        return;
      }

      // Save profile
      const profile: AppProfile = {
        name,
        address1: form.address1.trim(),
        address2: form.address2.trim(),
        phoneNumber: phone,
        defaultCommissionPercentage: parseFloat(form.commission) || 0,
        defaultHamalliPerBag: parseFloat(form.hamali) || 0,
        defaultLorryAmount: 0,
        defaultCashAmount: 0,
        defaultOtherExpenses: 0,
      };
      ProfileService.saveProfile(profile);

      Alert.alert("Success", "Profile saved successfully!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to connect to server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.primary + "15" },
          ]}
        >
          <AntDesign name="user" size={32} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Business Profile
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
          Set up your profile to get started
        </Text>
      </View>

      {/* Business Info Section */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.white,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Business Information
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.secondary }]}>
            Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.light,
                color: theme.colors.text,
              },
            ]}
            value={form.name}
            onChangeText={set("name")}
            placeholder="e.g. Ramesh Traders"
            placeholderTextColor={theme.colors.secondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.secondary }]}>
            Address Line 1
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.light,
                color: theme.colors.text,
              },
            ]}
            value={form.address1}
            onChangeText={set("address1")}
            placeholder="Street / Area"
            placeholderTextColor={theme.colors.secondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.secondary }]}>
            Address Line 2
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.light,
                color: theme.colors.text,
              },
            ]}
            value={form.address2}
            onChangeText={set("address2")}
            placeholder="City / District"
            placeholderTextColor={theme.colors.secondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.secondary }]}>
            Phone Number *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: userError
                  ? theme.colors.danger
                  : theme.colors.border,
                backgroundColor: theme.colors.light,
                color: theme.colors.text,
              },
            ]}
            value={form.phoneNumber}
            onChangeText={set("phoneNumber")}
            placeholder="e.g. 03001234567"
            placeholderTextColor={theme.colors.secondary}
            keyboardType="phone-pad"
          />
          {!!userError && (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              {userError}
            </Text>
          )}
        </View>
      </View>

      {/* Defaults Section */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.white,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Default Charges
        </Text>
        <Text style={[styles.sectionHint, { color: theme.colors.secondary }]}>
          These values will be pre-filled in every new Patti
        </Text>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.secondary }]}>
              Commission %
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.light,
                  color: theme.colors.text,
                },
              ]}
              value={form.commission}
              onChangeText={set("commission")}
              placeholder="e.g. 2"
              placeholderTextColor={theme.colors.secondary}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.secondary }]}>
              Hamali / Bag ₹
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.light,
                  color: theme.colors.text,
                },
              ]}
              value={form.hamali}
              onChangeText={set("hamali")}
              placeholder="e.g. 2"
              placeholderTextColor={theme.colors.secondary}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          { backgroundColor: loading ? theme.colors.secondary : theme.colors.primary },
        ]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <AntDesign name="checkcircle" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 10 },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
