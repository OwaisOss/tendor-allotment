import React from "react";
import { View, Text, StyleSheet, Modal as RNModal } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./Button";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  }[];
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  actions,
}) => {
  const theme = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, theme.shadows.lg]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <View style={styles.content}>{children}</View>
          {actions && (
            <View style={styles.actions}>
              {actions.map((action, index) => (
                <View key={index} style={styles.actionButton}>
                  <Button
                    title={action.label}
                    onPress={action.onPress}
                    variant={action.variant}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // Darker, cleaner overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20, // Match theme.borderRadius.lg
    padding: 24,
    width: "100%",
    maxWidth: 500,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  content: {
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 8,
  },
});
