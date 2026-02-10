import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { useTheme, theme } from "../context/ThemeContext";

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case "secondary":
        return theme.colors.light;
      case "success":
        return theme.colors.success;
      case "danger":
        return theme.colors.danger;
      case "warning":
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.secondary;
    if (variant === "secondary") return theme.colors.text;
    return theme.colors.white;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor(), borderRadius: theme.borderRadius.xl },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[
        styles.text,
        { color: getTextColor(), fontSize: theme.typography.body.fontSize },
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 100, // Reduced min width for flexibility
    ...theme.shadows.sm,
    elevation: 2,
  },
  disabled: {
    opacity: 0.6,
    elevation: 0,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  iconContainer: {
    marginRight: 8,
  },
});
