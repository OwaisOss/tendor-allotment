import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./Button";
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

export const PattiSummaryModal: React.FC<PattiSummaryModalProps> = ({
  visible,
  onClose,
  onSave,
  patti,
  defaultExpenses,
}) => {
  const theme = useTheme();

  const [commissionPercentage, setCommissionPercentage] = useState(
    defaultExpenses.commissionPercentage.toString()
  );
  const [hamalliPerBag, setHamalliPerBag] = useState(
    defaultExpenses.hamalliPerBag.toString()
  );
  const [lorryAmount, setLorryAmount] = useState(
    defaultExpenses.lorryAmount.toString()
  );
  const [cashAmount, setCashAmount] = useState(
    defaultExpenses.cashAmount.toString()
  );
  const [otherExpenses, setOtherExpenses] = useState(
    defaultExpenses.otherExpenses.toString()
  );

  // Reset values when modal opens with new patti
  useEffect(() => {
    if (visible) {
      setCommissionPercentage(defaultExpenses.commissionPercentage.toString());
      setHamalliPerBag(defaultExpenses.hamalliPerBag.toString());
      setLorryAmount(defaultExpenses.lorryAmount.toString());
      setCashAmount(defaultExpenses.cashAmount.toString());
      setOtherExpenses(defaultExpenses.otherExpenses.toString());
    }
  }, [visible, defaultExpenses]);

  if (!patti) return null;

  // Calculate totals
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
              ₹{product.totalAmount.toFixed(2)}
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
      title={`Patti Summary - ${patti.farmerName}`}
      actions={[
        {
          label: "Cancel",
          onPress: onClose,
          variant: "secondary",
        },
        {
          label: "Save Patti",
          onPress: handleSave,
          variant: "success",
        },
      ]}
    >
      <ScrollView style={styles.container}>
        {/* Products Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Products ({patti.products.length})
          </Text>
          {patti.products.map((product, index) =>
            renderProductSummary(product, index)
          )}
        </View>

        {/* Total Sales */}
        <View style={[styles.totalCard, { backgroundColor: theme.colors.light }]}>
          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Bags:</Text>
            <Text style={styles.totalValue}>{totalBags}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Sales:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.success }]}>
              ₹{totalSales.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Deductions
          </Text>

          {/* Commission */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Commission (%):</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border }]}
              value={commissionPercentage}
              onChangeText={setCommissionPercentage}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.calculatedRow}>
            <Text style={styles.calculatedLabel}>Commission Amount:</Text>
            <Text style={[styles.calculatedValue, { color: theme.colors.danger }]}>
              ₹{commissionAmount.toFixed(2)}
            </Text>
          </View>

          {/* Hamalli */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Hamalli per bag (₹):</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border }]}
              value={hamalliPerBag}
              onChangeText={setHamalliPerBag}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.calculatedRow}>
            <Text style={styles.calculatedLabel}>Hamalli Amount:</Text>
            <Text style={[styles.calculatedValue, { color: theme.colors.danger }]}>
              ₹{hamalliAmount.toFixed(2)}
            </Text>
          </View>

          {/* Lorry */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Lorry Amount (₹):</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border }]}
              value={lorryAmount}
              onChangeText={setLorryAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Cash */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Cash Amount (₹):</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border }]}
              value={cashAmount}
              onChangeText={setCashAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Other Expenses */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Other Expenses (₹):</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border }]}
              value={otherExpenses}
              onChangeText={setOtherExpenses}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Final Summary */}
        <View
          style={[
            styles.finalCard,
            { backgroundColor: theme.colors.primary + "20" },
          ]}
        >
          <View style={styles.detailRow}>
            <Text style={styles.finalLabel}>Total Deductions:</Text>
            <Text style={[styles.finalValue, { color: theme.colors.danger }]}>
              ₹{totalDeductions.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.finalPayableLabel}>Final Payable:</Text>
            <Text style={[styles.finalPayableValue, { color: theme.colors.success }]}>
              ₹{finalPayable.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
  buyerText: {
    fontSize: 12,
    color: "#555",
  },
  totalCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    width: 100,
    textAlign: "right",
    fontSize: 14,
  },
  calculatedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 8,
  },
  calculatedLabel: {
    fontSize: 13,
    color: "#666",
  },
  calculatedValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  finalCard: {
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  finalValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  finalPayableLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  finalPayableValue: {
    fontSize: 18,
    fontWeight: "700",
  },
});
