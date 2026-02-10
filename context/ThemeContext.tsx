import React, { createContext, useContext, useState } from "react";

// Define theme colors and styles
export const theme = {
  colors: {
    primary: "#2563EB", // Modern Blue
    secondary: "#64748B", // Slate 500
    success: "#10B981", // Emerald 500
    danger: "#EF4444", // Red 500
    warning: "#F59E0B", // Amber 500
    info: "#3B82F6", // Blue 500
    light: "#F8FAFC", // Slate 50
    dark: "#1E293B", // Slate 800
    white: "#FFFFFF",
    background: "#F1F5F9", // Slate 100
    text: "#0F172A", // Slate 900
    textSecondary: "#64748B", // Slate 500
    border: "#E2E8F0", // Slate 200
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
      color: "#0F172A",
    },
    h2: {
      fontSize: 22,
      fontWeight: "600",
      letterSpacing: -0.5,
      color: "#1E293B",
    },
    h3: {
      fontSize: 18,
      fontWeight: "600",
      color: "#334155",
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: "#334155",
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: "#64748B",
    },
    small: {
      fontSize: 13,
      color: "#94A3B8",
    },
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
  },
  shadows: {
    sm: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1.5,
      elevation: 1, // Reduced for performance
    },
    md: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2, // Reduced for performance
    },
    lg: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4, // Reduced for performance
    },
  },
};

type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
