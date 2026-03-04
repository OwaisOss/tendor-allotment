import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
// @ts-ignore
import Papa from "papaparse";
import { Button } from "../components/Button";
import { useTheme } from "../context/ThemeContext";
import { StorageService } from "../utils/storage";

export default function DataSources() {
  const theme = useTheme();

  const [custImported, setCustImported] = useState(
    StorageService.isCustomersImported()
  );
  const [itemsImported, setItemsImported] = useState(
    StorageService.isProductsImported()
  );

  const pickCsvFile = async (fileType: "cust" | "items") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });

      if (result.canceled) return;

      const fileUri = result.assets[0]?.uri;
      const fileName = result.assets[0]?.name;

      if (!fileName?.endsWith(".csv")) {
        Alert.alert("Error", "Please select a CSV file");
        return;
      }

      const label = fileType === "cust" ? "customers" : "items";

      Alert.alert(
        "Confirm Import",
        `Import "${fileName}" as ${label}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: async () => {
              try {
                const fileContents = await FileSystem.readAsStringAsync(fileUri);
                Papa.parse(fileContents, {
                  header: false,
                  complete: (results: { data: any[][] }) => {
                    if (fileType === "cust") {
                      const customers = results.data
                        .map((row: any[]) => ({
                          value: row[0]?.toString()?.trim(),
                          label: row[1]?.toString()?.trim(),
                        }))
                        .filter((item: any) => item.value && item.label);
                      StorageService.saveCustomers(customers);
                      setCustImported(true);
                      Alert.alert("Success", `${customers.length} customers imported`);
                    } else {
                      const products = results.data
                        .map((row: any[]) => ({
                          value: row[0]?.toString()?.trim(),
                          label: row[1]?.toString()?.trim(),
                          unit: parseFloat(row[2]?.toString()?.trim()) || 0,
                        }))
                        .filter((item: any) => item.value && item.label);
                      StorageService.saveProducts(products);
                      setItemsImported(true);
                      Alert.alert("Success", `${products.length} items imported`);
                    }
                  },
                  error: (error: any) => {
                    console.error(`Error parsing ${fileType} CSV:`, error);
                    Alert.alert("Error", `Failed to parse CSV file`);
                  },
                });
              } catch (e) {
                Alert.alert("Error", "Failed to read file");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(`Error picking ${fileType} file:`, error);
      Alert.alert("Error", `Failed to select file`);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Import CSV files to populate the buyers and items lists used when creating pattis.
      </Text>

      {/* Customers */}
      <View style={[styles.card, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.info + "18" }]}>
            <AntDesign name="team" size={22} color={theme.colors.info} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Customers / Buyers</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              Format: ID, Name (one per row)
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: custImported ? theme.colors.success + "18" : theme.colors.light }]}>
            <AntDesign
              name={custImported ? "checkcircle" : "minuscircleo"}
              size={14}
              color={custImported ? theme.colors.success : theme.colors.textSecondary}
            />
            <Text style={[styles.statusText, { color: custImported ? theme.colors.success : theme.colors.textSecondary }]}>
              {custImported ? "Imported" : "Not set"}
            </Text>
          </View>
        </View>
        <Button
          title={custImported ? "Re-import Customers" : "Import Customers CSV"}
          onPress={() => pickCsvFile("cust")}
          variant={custImported ? "secondary" : "primary"}
          icon={<AntDesign name="upload" size={16} color={custImported ? theme.colors.text : "white"} />}
          style={styles.importBtn}
        />
      </View>

      {/* Items */}
      <View style={[styles.card, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.warning + "18" }]}>
            <AntDesign name="appstore-o" size={22} color={theme.colors.warning} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Items / Products</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              Format: ID, Name, Unit (one per row)
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: itemsImported ? theme.colors.success + "18" : theme.colors.light }]}>
            <AntDesign
              name={itemsImported ? "checkcircle" : "minuscircleo"}
              size={14}
              color={itemsImported ? theme.colors.success : theme.colors.textSecondary}
            />
            <Text style={[styles.statusText, { color: itemsImported ? theme.colors.success : theme.colors.textSecondary }]}>
              {itemsImported ? "Imported" : "Not set"}
            </Text>
          </View>
        </View>
        <Button
          title={itemsImported ? "Re-import Items" : "Import Items CSV"}
          onPress={() => pickCsvFile("items")}
          variant={itemsImported ? "secondary" : "primary"}
          icon={<AntDesign name="upload" size={16} color={itemsImported ? theme.colors.text : "white"} />}
          style={styles.importBtn}
        />
      </View>

      {/* CSV Format hint */}
      <View style={[styles.hintBox, { backgroundColor: theme.colors.light, borderColor: theme.colors.border }]}>
        <AntDesign name="infocirlceo" size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
          CSV files should have no headers. Each row contains the values separated by commas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  importBtn: {
    borderRadius: 10,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
