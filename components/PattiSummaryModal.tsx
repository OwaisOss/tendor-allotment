import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Modal } from "./Modal";
import { PattiRecord, PattiProduct } from "../types";

interface PattiSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (expenses: {
    commissionPercentage: number;
    hamalliPerBag: number;
    lorryAmount: number;
    cashAmount: number;
    otherExpenses: number;
  }) => void;
  patti: PattiRecord | null;
  defaultExpenses: {
    commissionPercentage: number;
    hamalliPerBag: number;
    lorryAmount: number;
    cashAmount: number;
    otherExpenses: number;
  };
}

// Returns "" when value is 0 so placeholder "0" is shown instead
const toInput = (val: number) => (val === 0 ? "" : val.toString());

export const PattiSummaryModal: React.FC<PattiSummaryModalProps> = ({
  visible,
  onClose,
  onSave,
  patti,
  defaultExpenses,
}) => {
  const theme = useTheme();

  const [commissionPercentage, setCommissionPercentage] = useState(
    toInput(defaultExpenses.commissionPercentage),
  );
  const [hamalliPerBag, setHamalliPerBag] = useState(
    toInput(defaultExpenses.hamalliPerBag),
  );
  const [lorryAmount, setLorryAmount] = useState(
    toInput(defaultExpenses.lorryAmount),
  );
  const [cashAmount, setCashAmount] = useState(
    toInput(defaultExpenses.cashAmount),
  );
  const [otherExpenses, setOtherExpenses] = useState(
    toInput(defaultExpenses.otherExpenses),
  );

  const [commSel, setCommSel] = useState<{ start: number; end: number } | undefined>();
  const [hamSel, setHamSel] = useState<{ start: number; end: number } | undefined>();

  // Reset values each time modal opens
  useEffect(() => {
    if (visible) {
      setCommissionPercentage(toInput(defaultExpenses.commissionPercentage));
      setHamalliPerBag(toInput(defaultExpenses.hamalliPerBag));
      setLorryAmount(toInput(defaultExpenses.lorryAmount));
      setCashAmount(toInput(defaultExpenses.cashAmount));
      setOtherExpenses(toInput(defaultExpenses.otherExpenses));
    }
  }, [visible, defaultExpenses]);

  if (!patti) return null;

  // Live calculations
  let totalBags = 0;
  let totalSales = 0;
  patti.products.forEach((product) => {
    totalBags += product.totalQuantity;
    totalSales += product.totalAmount;
  });

  const commissionPct = parseFloat(commissionPercentage) || 0;
  const hamalliPerBagNum = parseFloat(hamalliPerBag) || 0;
  const lorryAmt = parseFloat(lorryAmount) || 0;
  const cashAmt = parseFloat(cashAmount) || 0;
  const otherExp = parseFloat(otherExpenses) || 0;

  const commissionAmount = (totalSales * commissionPct) / 100;
  const hamalliAmount = totalBags * hamalliPerBagNum;
  const totalDeductions =
    commissionAmount + hamalliAmount + lorryAmt + cashAmt + otherExp;
  const finalPayable = totalSales - totalDeductions;

  const handleSave = () => {
    onSave({
      commissionPercentage: commissionPct,
      hamalliPerBag: hamalliPerBagNum,
      lorryAmount: lorryAmt,
      cashAmount: cashAmt,
      otherExpenses: otherExp,
    });
  };

  // Clear "0" on focus so user can type without deleting first
  const onFocusClear = (value: string, setter: (v: string) => void) => {
    if (value === "0") setter("");
  };

  const renderProductSummary = (product: PattiProduct, index: number) => {
    const soldQty = product.totalQuantity - product.remainingQuantity;
    return (
      <View key={product.productId} style={styles.productCard}>
        <Text style={[styles.productTitle, { color: theme.colors.text }]}>
          {index + 1}. {product.productName}
        </Text>
        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Quantity:</Text>
            <Text style={styles.detailValue}>{product.totalQuantity} bags</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sold:</Text>
            <Text style={styles.detailValue}>{soldQty} bags</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.warning }]}>
              {product.remainingQuantity} bags
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate:</Text>
            <Text style={styles.detailValue}>₹{product.rate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{product.weight} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.success }]}>
              ₹{Math.round(product.totalAmount)}
            </Text>
          </View>
          {product.purchases.length > 0 && (
            <View style={styles.buyersSection}>
              <Text style={styles.buyersTitle}>Buyers:</Text>
              {product.purchases.map((purchase, idx) => (
                <View key={purchase.id} style={styles.buyerRow}>
                  <Text style={styles.buyerText}>
                    {idx + 1}. {purchase.buyerName || "Anonymous"} -{" "}
                    {purchase.quantity} bags @ ₹{purchase.rate}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Patti — ${patti.farmerName}`}
      actions={[
        { label: "Cancel", onPress: onClose, variant: "secondary" },
        { label: "Save Patti", onPress: handleSave, variant: "success" },
      ]}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Products */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Products ({patti.products.length})
          </Text>
          {patti.products.map((product, index) =>
            renderProductSummary(product, index),
          )}
        </View>

        {/* Total Sales card */}
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: theme.colors.primary + "10",
              borderColor: theme.colors.primary + "25",
            },
          ]}
        >
          <View style={styles.totalRow}>
            <Text
              style={[styles.totalLabel, { color: theme.colors.secondary }]}
            >
              Total Bags
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>
              {totalBags}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text
              style={[styles.totalLabel, { color: theme.colors.secondary }]}
            >
              Total Sales
            </Text>
            <Text
              style={[
                styles.totalValue,
                { color: theme.colors.success, fontSize: 18 },
              ]}
            >
              ₹{Math.round(totalSales)}
            </Text>
          </View>
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Deductions
          </Text>

          {/* Commission */}
          <View
            style={[styles.deductionCard, { borderColor: theme.colors.border }]}
          >
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Commission
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.light,
                      color: theme.colors.text,
                    },
                  ]}
                  value={commissionPercentage}
                  onChangeText={setCommissionPercentage}
                  onFocus={() => {
                    onFocusClear(commissionPercentage, setCommissionPercentage);
                    const len = commissionPercentage === "0" ? 0 : commissionPercentage.length;
                    setCommSel({ start: len, end: len });
                    setTimeout(() => setCommSel(undefined), 0);
                  }}
                  selection={commSel}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.secondary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.colors.secondary }]}
                >
                  %
                </Text>
              </View>
            </View>
            <View style={styles.calcRow}>
              <Text
                style={[styles.calcLabel, { color: theme.colors.secondary }]}
              >
                Commission amount
              </Text>
              <Text style={[styles.calcValue, { color: theme.colors.danger }]}>
                ₹{Math.round(commissionAmount)}
              </Text>
            </View>
          </View>

          {/* Hamalli */}
          <View
            style={[styles.deductionCard, { borderColor: theme.colors.border }]}
          >
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Hamalli / bag
              </Text>
              <View style={styles.inputWrapper}>
                <Text
                  style={[styles.inputUnit, { color: theme.colors.secondary }]}
                >
                  ₹
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
                  value={hamalliPerBag}
                  onChangeText={setHamalliPerBag}
                  onFocus={() => {
                    onFocusClear(hamalliPerBag, setHamalliPerBag);
                    const len = hamalliPerBag === "0" ? 0 : hamalliPerBag.length;
                    setHamSel({ start: len, end: len });
                    setTimeout(() => setHamSel(undefined), 0);
                  }}
                  selection={hamSel}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.secondary}
                />
              </View>
            </View>
            <View style={styles.calcRow}>
              <Text
                style={[styles.calcLabel, { color: theme.colors.secondary }]}
              >
                Hamalli amount ({totalBags} bags)
              </Text>
              <Text style={[styles.calcValue, { color: theme.colors.danger }]}>
                ₹{Math.round(hamalliAmount)}
              </Text>
            </View>
          </View>

          {/* Lorry */}
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Lorry amount
            </Text>
            <View style={styles.inputWrapper}>
              <Text
                style={[styles.inputUnit, { color: theme.colors.secondary }]}
              >
                ₹
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
                value={lorryAmount}
                onChangeText={setLorryAmount}
                onFocus={() => onFocusClear(lorryAmount, setLorryAmount)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>
          </View>

          {/* Cash */}
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Cash amount
            </Text>
            <View style={styles.inputWrapper}>
              <Text
                style={[styles.inputUnit, { color: theme.colors.secondary }]}
              >
                ₹
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
                value={cashAmount}
                onChangeText={setCashAmount}
                onFocus={() => onFocusClear(cashAmount, setCashAmount)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>
          </View>

          {/* Other */}
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Other expenses
            </Text>
            <View style={styles.inputWrapper}>
              <Text
                style={[styles.inputUnit, { color: theme.colors.secondary }]}
              >
                ₹
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
                value={otherExpenses}
                onChangeText={setOtherExpenses}
                onFocus={() => onFocusClear(otherExpenses, setOtherExpenses)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.secondary}
              />
            </View>
          </View>
        </View>

        {/* Final Summary */}
        <View
          style={[
            styles.finalCard,
            {
              backgroundColor: theme.colors.primary + "10",
              borderColor: theme.colors.primary + "25",
            },
          ]}
        >
          <View style={styles.totalRow}>
            <Text
              style={[styles.totalLabel, { color: theme.colors.secondary }]}
            >
              Total Deductions
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.danger }]}>
              ₹{Math.round(totalDeductions)}
            </Text>
          </View>
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />
          <View style={styles.totalRow}>
            <Text
              style={[styles.finalPayableLabel, { color: theme.colors.text }]}
            >
              Final Payable
            </Text>
            <Text
              style={[
                styles.finalPayableValue,
                { color: theme.colors.success },
              ]}
            >
              ₹{Math.round(finalPayable)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 520,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  productCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  productDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  buyerText: {
    fontSize: 12,
    color: "#555",
  },
  productStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statBlock: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 54,
  },
  amountBlock: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  buyersSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  buyersTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  buyerRow: {
    paddingVertical: 2,
  },
  totalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  deductionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 90,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "600",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  calcLabel: {
    fontSize: 12,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  finalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 8,
  },
  divider: {
    height: 1,
  },
  finalPayableLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  finalPayableValue: {
    fontSize: 20,
    fontWeight: "800",
  },
});
