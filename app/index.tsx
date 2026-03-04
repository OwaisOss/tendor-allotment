import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
  AppState,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { useTheme } from "../context/ThemeContext";
import {
  StorageService,
  NewDashboardService,
  PattiService,
} from "../utils/storage";
import { NewDashboardStats } from "../types";

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();

  const [stats, setStats] = useState<NewDashboardStats | null>(null);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [clearPassword, setClearPassword] = useState("");
  const [showClearPassword, setShowClearPassword] = useState(false);

  // Load stats when component mounts and when app comes to foreground
  useEffect(() => {
    loadStats();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadStats();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadStats = () => {
    const dashboardStats = NewDashboardService.getStats();
    setStats(dashboardStats);
  };

  const getExpectedPassword = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    return (dd + mm + yyyy).split("").reverse().join("");
  };

  const handleClearData = () => {
    if (clearPassword !== getExpectedPassword()) {
      Alert.alert("Wrong Password", "The password you entered is incorrect.");
      return;
    }
    StorageService.clearAllData();
    loadStats();
    setClearPassword("");
    setShowClearDataModal(false);
    Alert.alert("Success", "All data has been cleared");
  };

  // Format legacy allotment records as CSV
  const formatAllotmentsAsCSV = (records: any[]) => {
    if (records.length === 0) {
      return "";
    }

    const headers = [
      "Date",
      "Product Name",
      "Item ID",
      "Buyer Name",
      "Customer ID",
      "Bag Quantity",
      "Weight",
      "Rate",
      "Farmer Name",
      "Total Amount",
    ];

    const csvRows = records.map((record) => [
      record.date,
      `"${record.productName}"`,
      record.productId,
      `"${record.customerName}"`,
      record.customerId,
      record.bagQuantity,
      record.weight,
      record.rate,
      `"${record.farmerName}"`,
      record.totalAmount,
    ]);

    const allRows = [headers, ...csvRows];
    return allRows.map((row) => row.join(",")).join("\n");
  };

  // Format patti records as CSV
  const formatPattisAsCSV = (pattis: any[]) => {
    if (pattis.length === 0) {
      return "";
    }

    const headers = [
      "Date",
      "Patti ID",
      "Farmer Name",
      "Product Name",
      "Buyer Name",
      "Bags",
      "Rate",
      "Amount",
      "Total Sales",
      "Commission",
      "Hamalli",
      "Net Amount",
    ];

    const csvRows: any[][] = [];
    pattis.forEach((patti: any) => {
      patti.products?.forEach((product: any) => {
        product.buyers?.forEach((buyer: any) => {
          csvRows.push([
            patti.date,
            patti.id,
            `"${patti.farmerName}"`,
            `"${product.productName}"`,
            `"${buyer.buyerName}"`,
            buyer.bags,
            buyer.rate,
            buyer.amount,
            patti.totalSales,
            patti.commission,
            patti.hamalli,
            patti.netAmount,
          ]);
        });
      });
    });

    const allRows = [headers, ...csvRows];
    return allRows.map((row) => row.join(",")).join("\n");
  };

  // Export data to CSV (both legacy allotments and new pattis)
  const exportToCSV = async () => {
    try {
      const allotments = StorageService.getAllotments();
      const pattis = PattiService.getAll();

      if (allotments.length === 0 && pattis.length === 0) {
        Alert.alert(
          "No Data",
          "No records to export. Please add some records first.",
        );
        return;
      }

      // Show the Android folder picker via Storage Access Framework
      const result =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      const { granted } = result;
      const directoryUri =
        ((result as any).directoryUri as string | undefined) ?? "";

      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save files.",
        );
        return;
      }

      const currentDate = new Date().toISOString().split("T")[0];
      const exportedFiles: string[] = [];

      // Export legacy allotments if any
      if (allotments.length > 0) {
        const allotmentsCsv = formatAllotmentsAsCSV(allotments);
        const allotmentsFilename = `LegacyAllotments_${currentDate}.csv`;
        const allotmentsFileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            allotmentsFilename,
            "text/csv",
          );
        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          allotmentsFileUri,
          allotmentsCsv,
          { encoding: FileSystem.EncodingType.UTF8 },
        );
        exportedFiles.push(allotmentsFilename);
      }

      // Export pattis if any
      if (pattis.length > 0) {
        const pattisCsv = formatPattisAsCSV(pattis);
        const pattisFilename = `Pattis_${currentDate}.csv`;
        const pattisFileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            pattisFilename,
            "text/csv",
          );
        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          pattisFileUri,
          pattisCsv,
          { encoding: FileSystem.EncodingType.UTF8 },
        );
        exportedFiles.push(pattisFilename);
      }

      Alert.alert(
        "Export Successful",
        `Exported ${exportedFiles.length} file(s): ${exportedFiles.join(", ")}`,
      );

      console.log("CSV exported successfully");
      console.log("Legacy allotments:", allotments.length);
      console.log("Pattis:", pattis.length);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert(
        "Export Failed",
        "There was an error exporting the CSV file. Please try again.",
      );
    }
  };

  const handleExport = async () => {
    const allotments = StorageService.getAllotments();
    const pattis = PattiService.getAll();
    if (allotments.length === 0 && pattis.length === 0) {
      Alert.alert("No Data", "No records to export");
      return;
    }
    setShowExportModal(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text
            style={[styles.greeting, { color: theme.colors.textSecondary }]}
          >
            Overview
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Dashboard
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            title="Export"
            onPress={handleExport}
            variant="secondary"
            style={styles.headerBtn}
            textStyle={{ fontSize: 13 }}
            icon={
              <AntDesign name="download" size={14} color={theme.colors.text} />
            }
          />
        </View>
      </View>

      {/* Statistics Grid */}
      {stats && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            General Statistics
          </Text>
          <View style={styles.grid}>
            <StatCard
              title="Farmers"
              value={stats.totalFarmers.toString()}
              icon={
                <AntDesign name="team" size={20} color={theme.colors.primary} />
              }
            />
            <StatCard
              title="Buyers"
              value={stats.totalBuyers.toString()}
              icon={
                <AntDesign name="user" size={20} color={theme.colors.info} />
              }
            />
            <StatCard
              title="Pattis"
              value={stats.totalPattis.toString()}
              icon={
                <AntDesign
                  name="filetext1"
                  size={20}
                  color={theme.colors.success}
                />
              }
            />
            <StatCard
              title="Total Sales"
              value={`₹${(stats.totalSales / 1000).toFixed(1)}k`}
              subtitle={stats.totalSales.toLocaleString()}
              icon={
                <AntDesign
                  name="wallet"
                  size={20}
                  color={theme.colors.warning}
                />
              }
            />
          </View>
        </View>
      )}

      {/* Actions Strip */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          persistentScrollbar={true}
          contentContainerStyle={styles.actionScroll}
          style={styles.actionScrollContainer}
        >
          <Button
            title="Add Allotment"
            onPress={() => router.push("/allotments")}
            style={styles.actionButton}
            icon={<AntDesign name="plus" size={18} color="white" />}
          />
          <Button
            title="Modify"
            onPress={() => router.push("/modify")}
            variant="warning"
            style={styles.actionButton}
            icon={<AntDesign name="edit" size={18} color="white" />}
          />
          <Button
            title="Reports"
            onPress={() => router.push("/reports")}
            variant="secondary"
            style={styles.actionButton}
            textStyle={{ color: theme.colors.text }}
            icon={
              <AntDesign name="barschart" size={18} color={theme.colors.text} />
            }
          />
        </ScrollView>
      </View>

      {/* Today's Activity */}
      {stats && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Today's Activity
          </Text>
          <View style={styles.todayCard}>
            <View style={styles.todayItem}>
              <Text
                style={[styles.todayLabel, { color: theme.colors.secondary }]}
              >
                Pattis
              </Text>
              <Text style={[styles.todayValue, { color: theme.colors.text }]}>
                {stats.todayStats.pattis}
              </Text>
            </View>
            <View
              style={[
                styles.todayDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View style={styles.todayItem}>
              <Text
                style={[styles.todayLabel, { color: theme.colors.secondary }]}
              >
                Sales
              </Text>
              <Text
                style={[styles.todayValue, { color: theme.colors.success }]}
              >
                ₹{stats.todayStats.sales.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.todayDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View style={styles.todayItem}>
              <Text
                style={[styles.todayLabel, { color: theme.colors.secondary }]}
              >
                Comm.
              </Text>
              <Text
                style={[styles.todayValue, { color: theme.colors.warning }]}
              >
                ₹{stats.todayStats.commission.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Data Sources */}
      <View style={styles.section}>
        <Button
          title="Data Sources"
          onPress={() => router.push("/data-sources")}
          variant="secondary"
          icon={
            <AntDesign name="database" size={16} color={theme.colors.text} />
          }
          textStyle={{ color: theme.colors.text }}
        />
      </View>

      {/* Top Lists Groups */}
      {stats && (
        <View style={styles.rowSection}>
          {stats.topFarmers.length > 0 && (
            <View style={styles.halfSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Farmers
              </Text>
              <Card padding={0} variant="outlined">
                {stats.topFarmers.slice(0, 5).map((farmer, index) => (
                  <View
                    key={farmer.farmerId}
                    style={[
                      styles.listItem,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.rankBadge,
                        { backgroundColor: theme.colors.light },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          { color: theme.colors.secondary },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.listTitle, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {farmer.farmerName}
                      </Text>
                      <Text
                        style={[
                          styles.listSub,
                          { color: theme.colors.secondary },
                        ]}
                      >
                        ₹{farmer.totalSales.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {stats.topProducts.length > 0 && (
            <View style={styles.halfSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Products
              </Text>
              <Card padding={0} variant="outlined">
                {stats.topProducts.slice(0, 5).map((product, index) => (
                  <View
                    key={product.productId}
                    style={[
                      styles.listItem,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.rankBadge,
                        { backgroundColor: theme.colors.light },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          { color: theme.colors.secondary },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.listTitle, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {product.productName}
                      </Text>
                      <Text
                        style={[
                          styles.listSub,
                          { color: theme.colors.secondary },
                        ]}
                      >
                        {product.totalQuantity} qty
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          )}
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.footerSection}>
        <Button
          title="Clear All Data"
          onPress={() => setShowClearDataModal(true)}
          variant="danger"
          style={styles.dangerButton}
          textStyle={{ fontSize: 14 }}
          icon={<AntDesign name="delete" size={16} color="white" />}
        />
        <Text
          style={[styles.versionText, { color: theme.colors.textSecondary }]}
        >
          v1.0.0 • Tendor Allotment
        </Text>
      </View>

      {/* Clear Data Modal */}
      <Modal
        visible={showClearDataModal}
        onClose={() => {
          setShowClearDataModal(false);
          setClearPassword("");
          setShowClearPassword(false);
        }}
        title="Clear All Data"
        actions={[
          {
            label: "Cancel",
            onPress: () => {
              setShowClearDataModal(false);
              setClearPassword("");
              setShowClearPassword(false);
            },
            variant: "secondary",
          },
          {
            label: "Clear Data",
            onPress: handleClearData,
            variant: "danger",
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textSecondary,
            lineHeight: 22,
            marginBottom: 12,
          }}
        >
          This will permanently delete all pattis and allotments. Enter today's
          date in DDMMYYYY format reversed to confirm.
        </Text>
        <View
          style={[
            styles.todayDateBox,
            {
              backgroundColor: theme.colors.light,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.todayDateLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Today's Date
          </Text>
          <Text style={[styles.todayDateValue, { color: theme.colors.text }]}>
            {(() => {
              const now = new Date();
              const dd = String(now.getDate()).padStart(2, "0");
              const mm = String(now.getMonth() + 1).padStart(2, "0");
              const yyyy = now.getFullYear();
              return `${dd} / ${mm} / ${yyyy}`;
            })()}
          </Text>
        </View>
        <View
          style={[
            styles.passwordRow,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.light,
            },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: theme.colors.text }]}
            value={clearPassword}
            onChangeText={setClearPassword}
            placeholder="enter reverse date"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            secureTextEntry={!showClearPassword}
          />
          <TouchableOpacity
            onPress={() => setShowClearPassword((v) => !v)}
            style={styles.eyeButton}
          >
            <AntDesign
              name={showClearPassword ? "eye" : "eyeo"}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Data"
        actions={[
          {
            label: "Cancel",
            onPress: () => setShowExportModal(false),
            variant: "secondary",
          },
          {
            label: "Export & Share",
            onPress: async () => {
              setShowExportModal(false);
              await exportToCSV();
            },
            variant: "success",
          },
        ]}
      >
        <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>
          Do you want to export your data? CSV files will be generated for both
          legacy allotments and pattis (if available).
        </Text>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 0,
    height: 36,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionScrollContainer: {
    paddingBottom: 6,
  },
  actionScroll: {
    paddingRight: 20,
    paddingLeft: 4,
    gap: 12,
  },
  actionButton: {
    marginBottom: 4,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  todayCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  todayItem: {
    alignItems: "center",
    flex: 1,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  todayValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  todayDivider: {
    width: 1,
    height: 30,
    opacity: 0.5,
  },
  importRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  importInfo: {
    flex: 1,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  importSubtitle: {
    fontSize: 13,
  },
  importActions: {
    flexDirection: "row",
    gap: 8,
  },
  miniBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 0,
    height: 36,
    borderRadius: 18,
  },
  rowSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  listSub: {
    fontSize: 12,
  },
  footerSection: {
    marginTop: 32,
    marginBottom: 20,
    alignItems: "center",
    gap: 16,
  },
  dangerButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    minWidth: 180,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.6,
  },
  todayDateBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  todayDateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  todayDateValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
  },
  eyeButton: {
    padding: 12,
  },
});
