import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.white,
          borderRadius: 14,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Icon on the left */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.light },
        ]}
      >
        {icon}
      </View>

      {/* Name and count on the right */}
      <View style={styles.textGroup}>
        <Text style={[styles.title, { color: theme.colors.secondary }]}>
          {title}
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {value}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    width: "48%",
    borderWidth: 1,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  textGroup: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
});
