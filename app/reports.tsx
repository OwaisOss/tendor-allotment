import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useTheme } from "../context/ThemeContext";
import {
  DataService,
  ReportService,
  FarmerService,
  PattiService,
} from "../utils/storage";
import { generateAndShareFarmerBill } from "../utils/pdfGenerator";
import {
  FarmerReport,
  BuyerReport,
  DailySummary,
  CommissionReport,
  PattiRecord,
} from "../types";

type ReportTab =
  | "farmer"
  | "buyer"
  | "daily"
  | "commission"
  | "product"
  | "pattis";

export default function Reports() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ReportTab>("farmer");

  // Data states
  const [farmerReports, setFarmerReports] = useState<FarmerReport[]>([]);
  const [buyerReports, setBuyerReports] = useState<BuyerReport[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [commissionReport, setCommissionReport] =
    useState<CommissionReport | null>(null);
  const [productReports, setProductReports] = useState<
    ReturnType<typeof ReportService.getProductSalesReport>
  >([]);
  const [allPattis, setAllPattis] = useState<PattiRecord[]>([]);

  // Modal states
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerReport | null>(
    null
  );
  const [selectedPatti, setSelectedPatti] = useState<PattiRecord | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [showPattiModal, setShowPattiModal] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    setFarmerReports(ReportService.getFarmerReports());
    setBuyerReports(ReportService.getBuyerReports());
    setDailySummaries(ReportService.getDailySummaries());
    setCommissionReport(ReportService.getCommissionReport());
    setProductReports(ReportService.getProductSalesReport());
    setAllPattis(PattiService.getAll());
  };

  // ============== FARMER REPORTS ==============

  const handleFarmerClick = (report: FarmerReport) => {
    setSelectedFarmer(report);
    setShowFarmerModal(true);
  };

  const handlePrintFarmerBill = async (patti: PattiRecord) => {
    const success = await generateAndShareFarmerBill(patti.farmerName, patti);
    if (success) {
      Alert.alert("Success", "Bill shared successfully");
    } else {
      Alert.alert("Error", "Failed to generate PDF");
    }
  };

  const renderFarmerReports = () => {
    if (farmerReports.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No farmer data available</Text>
        </View>
      );
    }

    return (
      <>
        {farmerReports.map((report) => (
          <TouchableOpacity
            key={report.farmerId}
            onPress={() => handleFarmerClick(report)}
          >
            <Card style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <Text
                    style={[styles.reportName, { color: theme.colors.text }]}
                  >
                    {report.farmerName}
                  </Text>
                  <Text style={styles.reportSubtitle}>
                    {report.totalPattis} pattis • {report.totalProducts} products
                  </Text>
                </View>
                <View style={styles.reportStats}>
                  <Text
                    style={[
                      styles.reportAmount,
                      { color: theme.colors.success },
                    ]}
                  >
                    ₹{report.totalSales.toFixed(2)}
                  </Text>
                  <Text style={styles.reportBags}>
                    {report.totalBags} bags
                  </Text>
                </View>
              </View>

              <View style={styles.reportSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Commission:</Text>
                  <Text
                    style={[styles.summaryValue, { color: theme.colors.danger }]}
                  >
                    ₹{report.totalCommission.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Payable:</Text>
                  <Text
                    style={[styles.summaryValue, { color: theme.colors.primary }]}
                  >
                    ₹{report.totalPayable.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  // ============== BUYER REPORTS ==============

  const handleBuyerClick = (report: BuyerReport) => {
    setSelectedBuyer(report);
    setShowBuyerModal(true);
  };

  const renderBuyerReports = () => {
    if (buyerReports.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No buyer data available</Text>
        </View>
      );
    }

    return (
      <>
        {buyerReports.map((report) => (
          <TouchableOpacity
            key={report.buyerId}
            onPress={() => handleBuyerClick(report)}
          >
            <Card style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <Text
                    style={[styles.reportName, { color: theme.colors.text }]}
                  >
                    {report.buyerName}
                  </Text>
                  <Text style={styles.reportSubtitle}>
                    {report.totalPurchases} purchases
                  </Text>
                </View>
                <View style={styles.reportStats}>
                  <Text
                    style={[
                      styles.reportAmount,
                      { color: theme.colors.primary },
                    ]}
                  >
                    ₹{report.totalAmount.toFixed(2)}
                  </Text>
                  <Text style={styles.reportBags}>
                    {report.totalBags} bags
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  // ============== DAILY SUMMARY ==============

  const renderDailySummaries = () => {
    if (dailySummaries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No daily data available</Text>
        </View>
      );
    }

    return (
      <>
        {dailySummaries.map((summary) => (
          <Card key={summary.date} style={styles.reportCard}>
            <View style={styles.dailyHeader}>
              <Text style={[styles.dailyDate, { color: theme.colors.text }]}>
                {new Date(summary.date).toDateString()}
              </Text>
              <Text
                style={[styles.dailyTotal, { color: theme.colors.success }]}
              >
                ₹{summary.totalSales.toFixed(2)}
              </Text>
            </View>

            <View style={styles.dailyStats}>
              <View style={styles.dailyStat}>
                <Text style={styles.dailyStatValue}>{summary.totalPattis}</Text>
                <Text style={styles.dailyStatLabel}>Pattis</Text>
              </View>
              <View style={styles.dailyStat}>
                <Text style={styles.dailyStatValue}>
                  {summary.totalFarmers}
                </Text>
                <Text style={styles.dailyStatLabel}>Farmers</Text>
              </View>
              <View style={styles.dailyStat}>
                <Text style={styles.dailyStatValue}>{summary.totalBuyers}</Text>
                <Text style={styles.dailyStatLabel}>Buyers</Text>
              </View>
              <View style={styles.dailyStat}>
                <Text style={styles.dailyStatValue}>{summary.totalBags}</Text>
                <Text style={styles.dailyStatLabel}>Bags</Text>
              </View>
            </View>

            <View style={styles.dailyBreakdown}>
              <Text style={styles.breakdownTitle}>Expenses:</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Commission:</Text>
                <Text
                  style={[styles.breakdownValue, { color: theme.colors.danger }]}
                >
                  ₹{summary.totalCommission.toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Hamalli:</Text>
                <Text style={styles.breakdownValue}>
                  ₹{summary.totalHamalli.toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Lorry:</Text>
                <Text style={styles.breakdownValue}>
                  ₹{summary.totalLorry.toFixed(2)}
                </Text>
              </View>
            </View>

            {summary.products.length > 0 && (
              <View style={styles.productsSection}>
                <Text style={styles.breakdownTitle}>Products:</Text>
                {summary.products.map((product) => (
                  <View key={product.productId} style={styles.productRow}>
                    <Text style={styles.productName}>
                      {product.productName}
                    </Text>
                    <Text style={styles.productQty}>
                      {product.totalQuantity} bags
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </>
    );
  };

  // ============== COMMISSION REPORT ==============

  const renderCommissionReport = () => {
    if (!commissionReport || commissionReport.pattisWithCommission.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No commission data available</Text>
        </View>
      );
    }

    return (
      <>
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Commission Earned</Text>
          <Text style={[styles.totalValue, { color: theme.colors.success }]}>
            ₹{commissionReport.totalCommission.toFixed(2)}
          </Text>
        </Card>

        {commissionReport.pattisWithCommission.map((patti) => (
          <Card key={patti.pattiId} style={styles.reportCard}>
            <View style={styles.commissionHeader}>
              <View>
                <Text
                  style={[styles.reportName, { color: theme.colors.text }]}
                >
                  {patti.farmerName}
                </Text>
                <Text style={styles.reportSubtitle}>
                  {new Date(patti.date).toDateString()}
                </Text>
              </View>
              <View style={styles.reportStats}>
                <Text
                  style={[
                    styles.reportAmount,
                    { color: theme.colors.success },
                  ]}
                >
                  ₹{patti.commissionAmount.toFixed(2)}
                </Text>
                <Text style={styles.commissionPercent}>
                  {patti.commissionPercentage}%
                </Text>
              </View>
            </View>
            <View style={styles.commissionDetails}>
              <Text style={styles.commissionBase}>
                Patti Amount: ₹{patti.pattiAmount.toFixed(2)}
              </Text>
            </View>
          </Card>
        ))}
      </>
    );
  };

  // ============== PRODUCT REPORTS ==============

  const renderProductReports = () => {
    if (productReports.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No product data available</Text>
        </View>
      );
    }

    return (
      <>
        {productReports.map((product) => (
          <Card key={product.productId} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View>
                <Text
                  style={[styles.reportName, { color: theme.colors.text }]}
                >
                  {product.productName}
                </Text>
                <Text style={styles.reportSubtitle}>
                  {product.totalTransactions} transactions
                </Text>
              </View>
              <View style={styles.reportStats}>
                <Text
                  style={[
                    styles.reportAmount,
                    { color: theme.colors.primary },
                  ]}
                >
                  ₹{product.totalAmount.toFixed(2)}
                </Text>
                <Text style={styles.reportBags}>
                  {product.totalQuantity} bags
                </Text>
              </View>
            </View>

            {product.farmerBreakdown.length > 0 && (
              <View style={styles.farmerBreakdown}>
                <Text style={styles.breakdownTitle}>By Farmer:</Text>
                {product.farmerBreakdown.map((farmer) => (
                  <View key={farmer.farmerId} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      {farmer.farmerName}
                    </Text>
                    <Text style={styles.breakdownValue}>
                      {farmer.quantity} bags (₹{farmer.amount.toFixed(2)})
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </>
    );
  };

  // ============== ALL PATTIS ==============

  const handlePattiClick = (patti: PattiRecord) => {
    setSelectedPatti(patti);
    setShowPattiModal(true);
  };

  const renderAllPattis = () => {
    if (allPattis.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pattis available</Text>
        </View>
      );
    }

    // Sort by date descending
    const sortedPattis = [...allPattis].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
      <>
        {sortedPattis.map((patti) => (
          <TouchableOpacity
            key={patti.id}
            onPress={() => handlePattiClick(patti)}
          >
            <Card style={styles.reportCard}>
              <View style={styles.pattiHeader}>
                <View>
                  <Text
                    style={[styles.reportName, { color: theme.colors.text }]}
                  >
                    {patti.farmerName}
                  </Text>
                  <Text style={styles.reportSubtitle}>
                    {new Date(patti.date).toDateString()} • {patti.products.length}{" "}
                    products
                  </Text>
                </View>
                <View style={styles.reportStats}>
                  <Text
                    style={[
                      styles.reportAmount,
                      { color: theme.colors.success },
                    ]}
                  >
                    ₹{patti.totalPattiAmount.toFixed(2)}
                  </Text>
                  <Text style={styles.reportBags}>
                    {patti.isClosed ? "Closed" : "Active"}
                  </Text>
                </View>
              </View>

              <View style={styles.pattiSummary}>
                <Text style={styles.pattiProducts}>
                  {patti.products.map((p) => p.productName).join(", ")}
                </Text>
              </View>

              <View style={styles.pattiFooter}>
                <Text style={styles.pattiDeductions}>
                  Deductions: ₹{patti.totalDeductions.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.pattiPayable,
                    { color: theme.colors.primary },
                  ]}
                >
                  Payable: ₹{patti.finalPayableAmount.toFixed(2)}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  // ============== MODALS ==============

  const renderFarmerModal = () => {
    if (!selectedFarmer) return null;

    return (
      <Modal
        visible={showFarmerModal}
        onClose={() => setShowFarmerModal(false)}
        title={selectedFarmer.farmerName}
        actions={[
          {
            label: "Close",
            onPress: () => setShowFarmerModal(false),
            variant: "secondary",
          },
        ]}
      >
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSectionTitle}>All Pattis</Text>
          {selectedFarmer.pattis.map((patti) => (
            <View key={patti.pattiId} style={styles.modalPattiCard}>
              <View style={styles.modalPattiHeader}>
                <Text style={styles.modalPattiDate}>
                  {new Date(patti.date).toDateString()}
                </Text>
                <Text style={styles.modalPattiAmount}>
                  ₹{patti.totalAmount.toFixed(2)}
                </Text>
              </View>

              {patti.products.map((product, idx) => (
                <View key={idx} style={styles.modalProductRow}>
                  <Text style={styles.modalProductName}>
                    {product.productName}
                  </Text>
                  <Text style={styles.modalProductDetails}>
                    {product.quantity} bags @ ₹{product.rate} = ₹
                    {product.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.modalBuyers}>
                    Buyers: {product.buyers.join(", ") || "None"}
                  </Text>
                </View>
              ))}

              <View style={styles.modalPattiFooter}>
                <Text style={styles.modalDeductions}>
                  Deductions: ₹{patti.deductions.toFixed(2)}
                </Text>
                <Text style={styles.modalPayable}>
                  Payable: ₹{patti.finalPayable.toFixed(2)}
                </Text>
              </View>

              {(() => {
                const fullPatti = allPattis.find(p => p.id === patti.pattiId);
                if (!fullPatti) return null;
                return (
                  <Button
                    title="Share Bill"
                    onPress={() => handlePrintFarmerBill(fullPatti)}
                    variant="success"
                    style={styles.shareButton}
                    icon={<AntDesign name="sharealt" size={16} color="white" />}
                  />
                );
              })()}
            </View>
          ))}

          <View style={styles.modalTotals}>
            <Text style={styles.modalTotalText}>
              Total Sales: ₹{selectedFarmer.totalSales.toFixed(2)}
            </Text>
            <Text style={styles.modalTotalText}>
              Total Commission: ₹{selectedFarmer.totalCommission.toFixed(2)}
            </Text>
            <Text style={styles.modalTotalText}>
              Total Payable: ₹{selectedFarmer.totalPayable.toFixed(2)}
            </Text>
          </View>
        </ScrollView>
      </Modal>
    );
  };

  const renderBuyerModal = () => {
    if (!selectedBuyer) return null;

    return (
      <Modal
        visible={showBuyerModal}
        onClose={() => setShowBuyerModal(false)}
        title={selectedBuyer.buyerName}
        actions={[
          {
            label: "Close",
            onPress: () => setShowBuyerModal(false),
            variant: "secondary",
          },
        ]}
      >
        <ScrollView style={styles.modalContent}>
          <View style={styles.buyerStats}>
            <Text style={styles.buyerStat}>
              Total Purchases: {selectedBuyer.totalPurchases}
            </Text>
            <Text style={styles.buyerStat}>
              Total Bags: {selectedBuyer.totalBags}
            </Text>
            <Text style={styles.buyerStat}>
              Total Amount: ₹{selectedBuyer.totalAmount.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.modalSectionTitle}>Purchase History</Text>
          {selectedBuyer.purchases.map((purchase, idx) => (
            <View key={idx} style={styles.buyerPurchaseCard}>
              <Text style={styles.purchaseDate}>
                {new Date(purchase.date).toDateString()}
              </Text>
              <Text style={styles.purchaseDetails}>
                {purchase.farmerName} - {purchase.productName}
              </Text>
              <Text style={styles.purchaseAmount}>
                {purchase.quantity} bags @ ₹{purchase.rate} = ₹
                {purchase.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Modal>
    );
  };

  const renderPattiModal = () => {
    if (!selectedPatti) return null;

    return (
      <Modal
        visible={showPattiModal}
        onClose={() => setShowPattiModal(false)}
        title={`Patti - ${selectedPatti.farmerName}`}
        actions={[
          {
            label: "Close",
            onPress: () => setShowPattiModal(false),
            variant: "secondary",
          },
          {
            label: "Print PDF",
            onPress: () => handlePrintFarmerBill(selectedPatti),
            variant: "success",
          },
        ]}
      >
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalDate}>
            Date: {new Date(selectedPatti.date).toDateString()}
          </Text>

          <Text style={styles.modalSectionTitle}>Products</Text>
          {selectedPatti.products.map((product) => (
            <View key={product.productId} style={styles.pattiProductCard}>
              <Text style={styles.pattiProductName}>
                {product.productName}
              </Text>
              <Text style={styles.pattiProductDetails}>
                Total: {product.totalQuantity} bags • Remaining:{" "}
                {product.remainingQuantity} bags
              </Text>
              <Text style={styles.pattiProductDetails}>
                Rate: ₹{product.rate} • Weight: {product.weight} kg
              </Text>
              <Text style={styles.pattiProductAmount}>
                Amount: ₹{product.totalAmount.toFixed(2)}
              </Text>

              {product.purchases.length > 0 && (
                <View style={styles.pattiPurchases}>
                  <Text style={styles.purchasesTitle}>Purchases:</Text>
                  {product.purchases.map((purchase) => (
                    <Text key={purchase.id} style={styles.purchaseDetail}>
                      • {purchase.buyerName || "Anonymous"}:{" "}
                      {purchase.quantity} bags = ₹
                      {purchase.totalAmount.toFixed(2)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <View style={styles.pattiExpenses}>
            <Text style={styles.modalSectionTitle}>Expenses</Text>
            <View style={styles.expenseRow}>
              <Text>Commission ({selectedPatti.commissionPercentage}%):</Text>
              <Text style={{ color: theme.colors.danger }}>
                ₹{selectedPatti.commissionAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.expenseRow}>
              <Text>Hamalli:</Text>
              <Text>₹{selectedPatti.hamalliAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text>Lorry:</Text>
              <Text>₹{selectedPatti.lorryAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text>Cash:</Text>
              <Text>₹{selectedPatti.cashAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text>Other:</Text>
              <Text>₹{selectedPatti.otherExpenses.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.pattiFinal}>
            <View style={styles.expenseRow}>
              <Text style={styles.finalLabel}>Total Sales:</Text>
              <Text style={styles.finalValue}>
                ₹{selectedPatti.totalPattiAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.finalLabel}>Total Deductions:</Text>
              <Text style={[styles.finalValue, { color: theme.colors.danger }]}>
                ₹{selectedPatti.totalDeductions.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.expenseRow, styles.finalPayableRow]}>
              <Text style={styles.finalPayableLabel}>Final Payable:</Text>
              <Text
                style={[
                  styles.finalPayableValue,
                  { color: theme.colors.success },
                ]}
              >
                ₹{selectedPatti.finalPayableAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Modal>
    );
  };

  // ============== RENDER ==============

  const tabs = [
    { id: "farmer", label: "Farmers", icon: "user" },
    { id: "buyer", label: "Buyers", icon: "team" },
    { id: "daily", label: "Daily", icon: "calendar" },
    { id: "commission", label: "Commission", icon: "creditcard" },
    { id: "product", label: "Products", icon: "appstore-o" },
    { id: "pattis", label: "All Pattis", icon: "profile" },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Tab Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              title={tab.label}
              onPress={() => setActiveTab(tab.id as ReportTab)}
              variant={activeTab === tab.id ? "primary" : "secondary"}
              style={styles.tabButton}
              icon={
                <AntDesign
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.id ? "white" : theme.colors.primary}
                />
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Reports Content */}
      <ScrollView style={styles.reportsContainer}>
        {activeTab === "farmer" && renderFarmerReports()}
        {activeTab === "buyer" && renderBuyerReports()}
        {activeTab === "daily" && renderDailySummaries()}
        {activeTab === "commission" && renderCommissionReport()}
        {activeTab === "product" && renderProductReports()}
        {activeTab === "pattis" && renderAllPattis()}
      </ScrollView>

      {/* Modals */}
      {renderFarmerModal()}
      {renderBuyerModal()}
      {renderPattiModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabsContainer: {
    maxHeight: 70,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabs: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  tabButton: {
    minWidth: 100,
  },
  reportsContainer: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reportName: {
    fontSize: 18,
    fontWeight: "600",
  },
  reportSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  reportStats: {
    alignItems: "flex-end",
  },
  reportAmount: {
    fontSize: 18,
    fontWeight: "600",
  },
  reportBags: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  reportSummary: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  // Daily summary styles
  dailyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: "600",
  },
  dailyTotal: {
    fontSize: 18,
    fontWeight: "600",
  },
  dailyStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dailyStat: {
    alignItems: "center",
  },
  dailyStatValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  dailyStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  dailyBreakdown: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#666",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  productsSection: {
    marginTop: 8,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  productName: {
    fontSize: 13,
    color: "#333",
  },
  productQty: {
    fontSize: 13,
    color: "#666",
  },
  // Commission styles
  totalCard: {
    marginBottom: 16,
    alignItems: "center",
    padding: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  commissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  commissionPercent: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  commissionDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  commissionBase: {
    fontSize: 13,
    color: "#666",
  },
  // Product styles
  farmerBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  // Patti styles
  pattiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  pattiSummary: {
    marginBottom: 8,
  },
  pattiProducts: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  pattiFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  pattiDeductions: {
    fontSize: 13,
    color: "#666",
  },
  pattiPayable: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
  modalContent: {
    maxHeight: 400,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },
  modalDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  modalPattiCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modalPattiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalPattiDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalPattiAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007bff",
  },
  modalProductRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalProductName: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalProductDetails: {
    fontSize: 12,
    color: "#666",
  },
  modalBuyers: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  modalPattiFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  modalDeductions: {
    fontSize: 12,
    color: "#666",
  },
  modalPayable: {
    fontSize: 13,
    fontWeight: "600",
    color: "#28a745",
  },
  modalTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#333",
  },
  modalTotalText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  // Buyer modal styles
  buyerStats: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buyerStat: {
    fontSize: 14,
    marginBottom: 4,
  },
  buyerPurchaseCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  purchaseDate: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  purchaseDetails: {
    fontSize: 13,
    color: "#666",
  },
  purchaseAmount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007bff",
    marginTop: 4,
  },
  // Patti modal styles
  pattiProductCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pattiProductName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  pattiProductDetails: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  pattiProductAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007bff",
    marginTop: 4,
  },
  pattiPurchases: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  purchasesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  purchaseDetail: {
    fontSize: 12,
    color: "#555",
    paddingVertical: 2,
  },
  pattiExpenses: {
    marginTop: 16,
  },
  pattiFinal: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#333",
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  finalLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  finalValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  finalPayableRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  finalPayableLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  finalPayableValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  shareButton: {
    marginTop: 8,
  },
});
