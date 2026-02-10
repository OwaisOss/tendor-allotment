import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useTheme } from "../context/ThemeContext";
import { PattiService, StorageService } from "../utils/storage";
import { PattiRecord, AllotmentRecord } from "../types";
import { useFocusEffect } from "expo-router";

export default function ModifyRecords() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPatti, setSelectedPatti] = useState<PattiRecord | null>(null);
  const [selectedAllotment, setSelectedAllotment] =
    useState<AllotmentRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<"patti" | "allotment">("patti");

  const [editForm, setEditForm] = useState({
    commissionPercentage: "",
    hamalliPerBag: "",
    lorryAmount: "",
    cashAmount: "",
    otherExpenses: "",
  });

  const [pattis, setPattis] = useState<PattiRecord[]>([]);
  const [allotments, setAllotments] = useState<AllotmentRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPattis(PattiService.getAll());
      setAllotments(StorageService.getAllotments());
    }, [])
  );

  const pattiDates = [...new Set(pattis.map((p) => p.date))].sort().reverse();
  const allotmentDates = [...new Set(allotments.map((a) => a.date))]
    .sort()
    .reverse();
  const uniqueDates = [...new Set([...pattiDates, ...allotmentDates])]
    .sort()
    .reverse();

  const datePattis = selectedDate
    ? pattis.filter((p) => p.date === selectedDate)
    : [];
  const dateAllotments = selectedDate
    ? allotments.filter((a) => a.date === selectedDate)
    : [];

  const handleEditPatti = (patti: PattiRecord) => {
    setSelectedPatti(patti);
    setEditForm({
      commissionPercentage: patti.commissionPercentage.toString(),
      hamalliPerBag: patti.hamalliPerBag.toString(),
      lorryAmount: patti.lorryAmount.toString(),
      cashAmount: patti.cashAmount.toString(),
      otherExpenses: patti.otherExpenses.toString(),
    });
    setShowEditModal(true);
  };

  const handleDeletePatti = (patti: PattiRecord) => {
    setSelectedPatti(patti);
    setDeleteType("patti");
    setShowDeleteModal(true);
  };

  const handleDeleteAllotment = (record: AllotmentRecord) => {
    setSelectedAllotment(record);
    setDeleteType("allotment");
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteType === "patti" && selectedPatti) {
      PattiService.delete(selectedPatti.id);
      setPattis(PattiService.getAll());
      Alert.alert("Success", "Patti record deleted successfully!");
    } else if (deleteType === "allotment" && selectedAllotment) {
      const updated = allotments.filter((a) => a.id !== selectedAllotment.id);
      StorageService.saveAllotments(updated);
      setAllotments(StorageService.getAllotments());
      Alert.alert("Success", "Allotment record deleted successfully!");
    }

    setShowDeleteModal(false);
    setSelectedPatti(null);
    setSelectedAllotment(null);
  };

  const savePattiChanges = () => {
    if (!selectedPatti) return;

    const allPattis = PattiService.getAll();
    const index = allPattis.findIndex((p) => p.id === selectedPatti.id);
    if (index === -1) return;

    const updatedPatti = { ...allPattis[index] };

    updatedPatti.commissionPercentage =
      parseFloat(editForm.commissionPercentage) || 0;
    updatedPatti.hamalliPerBag = parseFloat(editForm.hamalliPerBag) || 0;
    updatedPatti.lorryAmount = parseFloat(editForm.lorryAmount) || 0;
    updatedPatti.cashAmount = parseFloat(editForm.cashAmount) || 0;
    updatedPatti.otherExpenses = parseFloat(editForm.otherExpenses) || 0;

    let totalBags = 0;
    let totalSales = 0;
    updatedPatti.products.forEach((product) => {
      totalBags += product.totalQuantity;
      totalSales += product.totalAmount;
    });

    updatedPatti.totalPattiAmount = totalSales;
    updatedPatti.commissionAmount =
      (totalSales * updatedPatti.commissionPercentage) / 100;
    updatedPatti.hamalliAmount = totalBags * updatedPatti.hamalliPerBag;
    updatedPatti.totalDeductions =
      updatedPatti.commissionAmount +
      updatedPatti.hamalliAmount +
      updatedPatti.lorryAmount +
      updatedPatti.cashAmount +
      updatedPatti.otherExpenses;
    updatedPatti.finalPayableAmount =
      totalSales - updatedPatti.totalDeductions;
    updatedPatti.updatedAt = Date.now();

    allPattis[index] = updatedPatti;
    PattiService.save(allPattis);
    setPattis(PattiService.getAll());

    setShowEditModal(false);
    setSelectedPatti(null);
    Alert.alert("Success", "Patti updated successfully!");
  };

  const renderDateList = () => (
    <Card>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Select Date
      </Text>
      {uniqueDates.length === 0 ? (
        <Text style={styles.emptyText}>No records found</Text>
      ) : (
        <View style={styles.dateList}>
          {uniqueDates.map((date) => (
            <Button
              key={date}
              title={new Date(date).toDateString()}
              onPress={() => setSelectedDate(date)}
              variant={selectedDate === date ? "primary" : "secondary"}
              style={styles.dateButton}
              icon={<AntDesign name="calendar" size={20} color="white" />}
            />
          ))}
        </View>
      )}
    </Card>
  );

  const renderPattisList = () => {
    if (datePattis.length === 0) return null;

    return (
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Patti Records
        </Text>
        {datePattis.map((patti) => (
          <View key={patti.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={[styles.farmerName, { color: theme.colors.text }]}>
                {patti.farmerName}
              </Text>
              <View style={styles.actions}>
                <Button
                  title="Edit"
                  onPress={() => handleEditPatti(patti)}
                  variant="warning"
                  style={styles.actionButton}
                  icon={<AntDesign name="edit" size={16} color="white" />}
                />
                <Button
                  title="Delete"
                  onPress={() => handleDeletePatti(patti)}
                  variant="danger"
                  style={styles.actionButton}
                  icon={<AntDesign name="delete" size={16} color="white" />}
                />
              </View>
            </View>

            <View style={styles.recordDetails}>
              <Text style={styles.subHeader}>Products:</Text>
              {patti.products.map((product, idx) => (
                <View key={idx} style={styles.productSection}>
                  <Text style={styles.productName}>{product.productName}</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Qty:</Text>
                    <Text style={styles.detailValue}>
                      {product.totalQuantity} bags
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rate:</Text>
                    <Text style={styles.detailValue}>₹{product.rate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>
                      ₹{product.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                  {product.purchases.length > 0 && (
                    <View style={styles.buyersList}>
                      <Text style={styles.buyersHeader}>Buyers:</Text>
                      {product.purchases.map((purchase, pIdx) => (
                        <Text key={pIdx} style={styles.buyerItem}>
                          • {purchase.buyerName}: {purchase.quantity} bags @
                          ₹{purchase.rate} = ₹{purchase.totalAmount.toFixed(2)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Sales:</Text>
                <Text style={styles.detailValue}>
                  ₹{patti.totalPattiAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Commission ({patti.commissionPercentage}%):
                </Text>
                <Text style={styles.detailValue}>
                  ₹{patti.commissionAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hamalli:</Text>
                <Text style={styles.detailValue}>
                  ₹{patti.hamalliAmount.toFixed(2)}
                </Text>
              </View>
              {patti.lorryAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lorry:</Text>
                  <Text style={styles.detailValue}>
                    ₹{patti.lorryAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              {patti.cashAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cash:</Text>
                  <Text style={styles.detailValue}>
                    ₹{patti.cashAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              {patti.otherExpenses > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Other Expenses:</Text>
                  <Text style={styles.detailValue}>
                    ₹{patti.otherExpenses.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Deductions:</Text>
                <Text style={[styles.detailValue, { color: "#dc3545" }]}>
                  ₹{patti.totalDeductions.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.detailRow, styles.finalRow]}>
                <Text style={[styles.detailLabel, styles.finalLabel]}>
                  Final Payable:
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    styles.finalValue,
                    { color: theme.colors.success },
                  ]}
                >
                  ₹{patti.finalPayableAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    );
  };

  const renderLegacyAllotments = () => {
    if (dateAllotments.length === 0) return null;

    return (
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Legacy Allotments
        </Text>
        {dateAllotments.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={[styles.farmerName, { color: theme.colors.text }]}>
                {record.farmerName}
              </Text>
              <View style={styles.actions}>
                <Button
                  title="Delete"
                  onPress={() => handleDeleteAllotment(record)}
                  variant="danger"
                  style={styles.actionButton}
                  icon={<AntDesign name="delete" size={16} color="white" />}
                />
              </View>
            </View>

            <View style={styles.recordDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product:</Text>
                <Text style={styles.detailValue}>{record.productName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Buyer:</Text>
                <Text style={styles.detailValue}>{record.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{record.bagQuantity} bags</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight:</Text>
                <Text style={styles.detailValue}>{record.weight}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate:</Text>
                <Text style={styles.detailValue}>₹{record.rate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.success }]}
                >
                  ₹{record.totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    );
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      onClose={() => setShowEditModal(false)}
      title="Edit Patti Expenses"
      actions={[
        {
          label: "Cancel",
          onPress: () => setShowEditModal(false),
          variant: "secondary",
        },
        {
          label: "Save Changes",
          onPress: savePattiChanges,
          variant: "success",
        },
      ]}
    >
      <ScrollView style={styles.editForm}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Commission %</Text>
          <TextInput
            style={styles.formInput}
            value={editForm.commissionPercentage}
            onChangeText={(text) =>
              setEditForm({ ...editForm, commissionPercentage: text })
            }
            keyboardType="numeric"
            placeholder="e.g., 2"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Hamalli per Bag (₹)</Text>
          <TextInput
            style={styles.formInput}
            value={editForm.hamalliPerBag}
            onChangeText={(text) =>
              setEditForm({ ...editForm, hamalliPerBag: text })
            }
            keyboardType="numeric"
            placeholder="e.g., 2"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Lorry Amount (₹)</Text>
          <TextInput
            style={styles.formInput}
            value={editForm.lorryAmount}
            onChangeText={(text) =>
              setEditForm({ ...editForm, lorryAmount: text })
            }
            keyboardType="numeric"
            placeholder="e.g., 500"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Cash Amount (₹)</Text>
          <TextInput
            style={styles.formInput}
            value={editForm.cashAmount}
            onChangeText={(text) =>
              setEditForm({ ...editForm, cashAmount: text })
            }
            keyboardType="numeric"
            placeholder="e.g., 1000"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Other Expenses (₹)</Text>
          <TextInput
            style={styles.formInput}
            value={editForm.otherExpenses}
            onChangeText={(text) =>
              setEditForm({ ...editForm, otherExpenses: text })
            }
            keyboardType="numeric"
            placeholder="e.g., 100"
          />
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {renderDateList()}
      {selectedDate && renderPattisList()}
      {selectedDate && renderLegacyAllotments()}

      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={deleteType === "patti" ? "Delete Patti" : "Delete Allotment"}
        actions={[
          {
            label: "Cancel",
            onPress: () => setShowDeleteModal(false),
            variant: "secondary",
          },
          {
            label: "Delete",
            onPress: confirmDelete,
            variant: "danger",
          },
        ]}
      >
        <Text>
          Are you sure you want to delete this{" "}
          {deleteType === "patti" ? "patti" : "allotment"} record? This action
          cannot be undone.
        </Text>
      </Modal>

      {renderEditModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  dateList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateButton: {
    minWidth: 150,
  },
  recordCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    minWidth: 90,
  },
  recordDetails: {
    gap: 6,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginTop: 4,
  },
  productSection: {
    marginLeft: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007bff",
    marginBottom: 6,
  },
  buyersList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  buyersHeader: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
  },
  buyerItem: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  finalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  finalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  editForm: {
    maxHeight: 350,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});
