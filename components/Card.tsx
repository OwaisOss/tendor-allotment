import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "elevated" | "outlined" | "flat";
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "elevated",
  padding
}) => {
  const theme = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case "outlined":
        return {
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.white,
        };
      case "flat":
        return {
          backgroundColor: theme.colors.light,
        };
      case "elevated":
      default:
        return {
          backgroundColor: theme.colors.white,
          ...theme.shadows.sm, // Using smaller shadow for cleaner look
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        { borderRadius: theme.borderRadius.lg },
        getVariantStyle(),
        padding !== undefined && { padding },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20, // Increased default padding
    marginBottom: 16,
  },
});
