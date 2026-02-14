import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { useTheme } from "../context/ThemeContext";
import { PattiService, StorageService } from "../utils/storage";
import {
  PattiRecord,
  AllotmentRecord,
  PattiProduct,
  BuyerPurchase,
} from "../types";
import { useFocusEffect } from "expo-router";

export default function ModifyRecords() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPatti, setSelectedPatti] = useState<PattiRecord | null>(null);
  const [selectedAllotment, setSelectedAllotment] =
    useState<AllotmentRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [deleteType, setDeleteType] = useState<"patti" | "allotment">("patti");
  const [editMode, setEditMode] = useState<"expenses" | "item" | "buyer">(
    "expenses",
  );

  const [editForm, setEditForm] = useState({
    farmerName: "",
    commissionPercentage: "",
    hamalliPerBag: "",
    lorryAmount: "",
    cashAmount: "",
    otherExpenses: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<PattiProduct | null>(
    null,
  );
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerPurchase | null>(
    null,
  );
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const [selectedBuyerIndex, setSelectedBuyerIndex] = useState<number>(-1);

  const [itemForm, setItemForm] = useState({
    productName: "",
    totalQuantity: "",
    rate: "",
    weight: "",
  });

  const [buyerForm, setBuyerForm] = useState({
    buyerName: "",
    quantity: "",
  });

  const [pattis, setPattis] = useState<PattiRecord[]>([]);
  const [allotments, setAllotments] = useState<AllotmentRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPattis(PattiService.getAll());
      setAllotments(StorageService.getAllotments());
    }, []),
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
      farmerName: patti.farmerName,
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

  const handleEditItem = (product: PattiProduct, index: number) => {
    setSelectedProduct(product);
    setSelectedProductIndex(index);
    setItemForm({
      productName: product.productName,
      totalQuantity: product.totalQuantity.toString(),
      rate: product.rate.toString(),
      weight: product.weight.toString(),
    });
    setEditMode("item");
    setShowItemModal(true);
  };

  const handleAddItem = () => {
    setSelectedProduct(null);
    setSelectedProductIndex(-1);
    setItemForm({
      productName: "",
      totalQuantity: "",
      rate: "",
      weight: "",
    });
    setEditMode("item");
    setShowItemModal(true);
  };

  const handleDeleteItem = (index: number) => {
    if (!selectedPatti) return;
    const updatedPatti = JSON.parse(JSON.stringify(selectedPatti)) as PattiRecord;
    updatedPatti.products.splice(index, 1);
    recalculateAndSave(updatedPatti);
  };

  const handleEditBuyer = (
    purchase: BuyerPurchase,
    productIndex: number,
    buyerIndex: number,
  ) => {
    setSelectedBuyer(purchase);
    setSelectedProductIndex(productIndex);
    setSelectedBuyerIndex(buyerIndex);
    setBuyerForm({
      buyerName: purchase.buyerName,
      quantity: purchase.quantity.toString(),
    });
    setEditMode("buyer");
    setShowBuyerModal(true);
  };

  const handleAddBuyer = (productIndex: number) => {
    setSelectedBuyer(null);
    setSelectedProductIndex(productIndex);
    setSelectedBuyerIndex(-1);
    setBuyerForm({
      buyerName: "",
      quantity: "",
    });
    setEditMode("buyer");
    setShowBuyerModal(true);
  };

  const handleDeleteBuyer = (productIndex: number, buyerIndex: number) => {
    if (!selectedPatti) return;
    const updatedPatti = JSON.parse(JSON.stringify(selectedPatti)) as PattiRecord;
    updatedPatti.products[productIndex].purchases.splice(buyerIndex, 1);
    recalculateAndSave(updatedPatti);
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

  // Helper: calculate purchase amount based on product unit
  const calcPurchaseAmount = (product: PattiProduct, qty: number, rate: number): number => {
    const productUnit = product.unit || 0;
    if (productUnit > 0) {
      return (product.weight * qty * rate) / 100;
    }
    return qty * rate;
  };

  const recalculateAndSave = (updatedPatti: PattiRecord) => {
    // Recalculate each product: re-derive purchase amounts from product rate, then sum
    updatedPatti.products.forEach((product) => {
      let totalAmount = 0;
      let totalSoldQty = 0;

      product.purchases.forEach((purchase) => {
        // Use the product's current rate for recalculation
        purchase.rate = product.rate;
        purchase.totalAmount = calcPurchaseAmount(product, purchase.quantity, product.rate);
        totalAmount += purchase.totalAmount;
        totalSoldQty += purchase.quantity;
      });

      product.totalAmount = totalAmount;
      // Keep totalQuantity as-is (it's the original stock, not derived from purchases)
      // Only set remainingQuantity based on sold
      product.remainingQuantity = Math.max(0, product.totalQuantity - totalSoldQty);
    });

    // Recalculate patti totals
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
    updatedPatti.finalPayableAmount = totalSales - updatedPatti.totalDeductions;
    updatedPatti.updatedAt = Date.now();

    // Save to storage
    const allPattis = PattiService.getAll();
    const index = allPattis.findIndex((p) => p.id === updatedPatti.id);
    if (index !== -1) {
      allPattis[index] = updatedPatti;
      PattiService.save(allPattis);
    }

    setSelectedPatti(updatedPatti);
    setPattis(PattiService.getAll());
  };

  const savePattiChanges = () => {
    if (!selectedPatti) return;

    const updatedPatti = JSON.parse(JSON.stringify(selectedPatti)) as PattiRecord;

    const trimmedFarmerName = editForm.farmerName.trim();
    if (!trimmedFarmerName) {
      Alert.alert("Error", "Farmer name cannot be empty");
      return;
    }
    updatedPatti.farmerName = trimmedFarmerName;
    updatedPatti.commissionPercentage =
      parseFloat(editForm.commissionPercentage) || 0;
    updatedPatti.hamalliPerBag = parseFloat(editForm.hamalliPerBag) || 0;
    updatedPatti.lorryAmount = parseFloat(editForm.lorryAmount) || 0;
    updatedPatti.cashAmount = parseFloat(editForm.cashAmount) || 0;
    updatedPatti.otherExpenses = parseFloat(editForm.otherExpenses) || 0;

    recalculateAndSave(updatedPatti);

    setShowEditModal(false);
    setSelectedPatti(null);
    Alert.alert("Success", "Patti updated successfully!");
  };

  const saveItemChanges = () => {
    if (!selectedPatti) return;

    const updatedPatti = JSON.parse(JSON.stringify(selectedPatti)) as PattiRecord;
    const productName = itemForm.productName.trim();
    const totalQuantity = parseFloat(itemForm.totalQuantity) || 0;
    const rate = parseFloat(itemForm.rate) || 0;
    const weight = parseFloat(itemForm.weight) || 0;

    if (!productName || totalQuantity <= 0 || rate < 0) {
      Alert.alert("Error", "Please fill all required fields correctly");
      return;
    }

    if (selectedProductIndex === -1) {
      // Add new item
      const newProduct: PattiProduct = {
        entryId: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: `prod_${Date.now()}`,
        productName,
        totalQuantity,
        remainingQuantity: totalQuantity,
        weight,
        rate,
        totalAmount: 0,
        purchases: [],
      };
      updatedPatti.products.push(newProduct);
    } else {
      // Edit existing item - update rate, weight, name, quantity
      const product = updatedPatti.products[selectedProductIndex];
      const soldQty = product.purchases.reduce((sum, p) => sum + p.quantity, 0);

      // Don't allow reducing quantity below what's already sold
      if (totalQuantity < soldQty) {
        Alert.alert(
          "Error",
          `Cannot reduce quantity below ${soldQty} bags (already sold). Delete buyer purchases first if needed.`,
        );
        return;
      }

      product.productName = productName;
      product.weight = weight;
      product.rate = rate;
      product.totalQuantity = totalQuantity;
      // recalculateAndSave will propagate the new rate to all purchases
    }

    recalculateAndSave(updatedPatti);
    setShowItemModal(false);
    setSelectedProduct(null);
    Alert.alert(
      "Success",
      selectedProductIndex === -1
        ? "Item added successfully!"
        : "Item updated successfully!",
    );
  };

  const saveBuyerChanges = () => {
    if (!selectedPatti || selectedProductIndex === -1) return;

    const updatedPatti = JSON.parse(JSON.stringify(selectedPatti)) as PattiRecord;
    const product = updatedPatti.products[selectedProductIndex];

    const buyerName = buyerForm.buyerName.trim();
    const quantity = parseFloat(buyerForm.quantity) || 0;
    // Rate comes from the product, not the buyer form
    const rate = product.rate;

    if (!buyerName || quantity <= 0) {
      Alert.alert("Error", "Please enter buyer name and quantity");
      return;
    }

    // Calculate how much is already sold (excluding the purchase being edited)
    const soldByOthers = product.purchases.reduce((sum, p, i) => {
      if (selectedBuyerIndex !== -1 && i === selectedBuyerIndex) return sum;
      return sum + p.quantity;
    }, 0);
    const available = product.totalQuantity - soldByOthers;

    if (quantity > available) {
      Alert.alert(
        "Error",
        `Only ${available} bags available. ${soldByOthers} out of ${product.totalQuantity} already sold.`,
      );
      return;
    }

    const purchaseAmount = calcPurchaseAmount(product, quantity, rate);

    if (selectedBuyerIndex === -1) {
      // Add new buyer
      const newPurchase: BuyerPurchase = {
        id: `purchase_${Date.now()}`,
        buyerName,
        quantity,
        rate,
        totalAmount: purchaseAmount,
        timestamp: Date.now(),
      };
      product.purchases.push(newPurchase);
    } else {
      // Edit existing buyer
      const purchase = product.purchases[selectedBuyerIndex];
      purchase.buyerName = buyerName;
      purchase.quantity = quantity;
      purchase.rate = rate;
      purchase.totalAmount = purchaseAmount;
    }

    recalculateAndSave(updatedPatti);
    setShowBuyerModal(false);
    setSelectedBuyer(null);
    Alert.alert(
      "Success",
      selectedBuyerIndex === -1
        ? "Buyer added successfully!"
        : "Buyer updated successfully!",
    );
  };

  // ============== RENDER ==============

  const renderDateList = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Select Date
      </Text>
      {uniqueDates.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
          <AntDesign name="calendar" size={32} color={theme.colors.border} />
          <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>No records found</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.dateScroll}>
          {uniqueDates.map((date) => {
            const isSelected = selectedDate === date;
            return (
              <TouchableOpacity
                key={date}
                onPress={() => setSelectedDate(date)}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.white,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <AntDesign name="calendar" size={14} color={isSelected ? "#fff" : theme.colors.secondary} />
                <Text style={[styles.dateChipText, { color: isSelected ? "#fff" : theme.colors.text }]}>
                  {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderPattisList = () => {
    if (datePattis.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Patti Records
        </Text>
        {datePattis.map((patti) => (
          <View key={patti.id} style={[styles.recordCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
            {/* Header */}
            <View style={styles.recordHeader}>
              <View style={styles.farmerInfo}>
                <View style={[styles.farmerAvatar, { backgroundColor: theme.colors.primary + "15" }]}>
                  <AntDesign name="user" size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.farmerName, { color: theme.colors.text }]}>{patti.farmerName}</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => handleEditPatti(patti)} style={[styles.iconBtn, { backgroundColor: theme.colors.warning + "15" }]}>
                  <AntDesign name="edit" size={16} color={theme.colors.warning} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePatti(patti)} style={[styles.iconBtn, { backgroundColor: theme.colors.danger + "15" }]}>
                  <AntDesign name="delete" size={16} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Products */}
            <View style={styles.productsContainer}>
              <View style={styles.productsHeader}>
                <Text style={[styles.subHeader, { color: theme.colors.secondary }]}>Products</Text>
                <TouchableOpacity
                  onPress={() => { setSelectedPatti(patti); handleAddItem(); }}
                  style={[styles.addChip, { backgroundColor: theme.colors.primary + "12" }]}
                >
                  <AntDesign name="plus" size={12} color={theme.colors.primary} />
                  <Text style={[styles.addChipText, { color: theme.colors.primary }]}>Add</Text>
                </TouchableOpacity>
              </View>

              {patti.products.map((product, idx) => (
                <View key={idx} style={[styles.productCard, { borderLeftColor: theme.colors.primary }]}>
                  <View style={styles.productHeader}>
                    <Text style={[styles.productName, { color: theme.colors.primary }]}>{product.productName}</Text>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        onPress={() => { setSelectedPatti(patti); handleEditItem(product, idx); }}
                        style={[styles.tinyIconBtn, { backgroundColor: theme.colors.warning + "15" }]}
                      >
                        <AntDesign name="edit" size={12} color={theme.colors.warning} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setSelectedPatti(patti); handleDeleteItem(idx); }}
                        style={[styles.tinyIconBtn, { backgroundColor: theme.colors.danger + "15" }]}
                      >
                        <AntDesign name="delete" size={12} color={theme.colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.productStats}>
                    <View style={styles.statPill}>
                      <Text style={[styles.statPillLabel, { color: theme.colors.secondary }]}>Total</Text>
                      <Text style={[styles.statPillValue, { color: theme.colors.text }]}>{product.totalQuantity}</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={[styles.statPillLabel, { color: theme.colors.secondary }]}>Sold</Text>
                      <Text style={[styles.statPillValue, { color: theme.colors.warning }]}>
                        {product.totalQuantity - product.remainingQuantity}
                      </Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={[styles.statPillLabel, { color: theme.colors.secondary }]}>Left</Text>
                      <Text style={[styles.statPillValue, { color: product.remainingQuantity > 0 ? theme.colors.success : theme.colors.danger }]}>
                        {product.remainingQuantity}
                      </Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={[styles.statPillLabel, { color: theme.colors.secondary }]}>Rate</Text>
                      <Text style={[styles.statPillValue, { color: theme.colors.text }]}>₹{product.rate}</Text>
                    </View>
                  </View>

                  {/* Amount row */}
                  <View style={[styles.amountRow, { backgroundColor: theme.colors.success + "10" }]}>
                    <Text style={[styles.amountLabel, { color: theme.colors.secondary }]}>Total Amount</Text>
                    <Text style={[styles.amountValue, { color: theme.colors.success }]}>₹{product.totalAmount.toFixed(2)}</Text>
                  </View>

                  {/* Buyers - always show section with Add button */}
                  <View style={[styles.buyersSection, { borderTopColor: theme.colors.border }]}>
                    <View style={styles.buyersSectionHeader}>
                      <Text style={[styles.buyersLabel, { color: theme.colors.secondary }]}>
                        Buyers ({product.purchases.length})
                      </Text>
                      {product.remainingQuantity > 0 ? (
                        <TouchableOpacity
                          onPress={() => { setSelectedPatti(patti); handleAddBuyer(idx); }}
                          style={[styles.addChipSmall, { backgroundColor: theme.colors.primary + "12" }]}
                        >
                          <AntDesign name="plus" size={10} color={theme.colors.primary} />
                          <Text style={[styles.addChipSmallText, { color: theme.colors.primary }]}>
                            Add ({product.remainingQuantity} left)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => Alert.alert("Out of Stock", `All ${product.totalQuantity} bags have been sold. Increase the quantity first by editing the item if needed.`)}
                          style={[styles.addChipSmall, { backgroundColor: theme.colors.danger + "12" }]}
                        >
                          <AntDesign name="warning" size={10} color={theme.colors.danger} />
                          <Text style={[styles.addChipSmallText, { color: theme.colors.danger }]}>
                            Out of Stock
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {product.purchases.length === 0 && (
                      <Text style={[styles.noBuyersText, { color: theme.colors.secondary }]}>
                        No buyers yet. Tap "Add" to add a buyer.
                      </Text>
                    )}
                    {product.purchases.map((purchase, pIdx) => (
                      <View key={pIdx} style={[styles.buyerRow, { borderBottomColor: theme.colors.border }]}>
                        <View style={styles.buyerInfo}>
                          <Text style={[styles.buyerName, { color: theme.colors.text }]}>{purchase.buyerName}</Text>
                          <Text style={[styles.buyerDetail, { color: theme.colors.secondary }]}>
                            {purchase.quantity} bags @ ₹{purchase.rate} = ₹{purchase.totalAmount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.buyerActions}>
                          <TouchableOpacity
                            onPress={() => { setSelectedPatti(patti); handleEditBuyer(purchase, idx, pIdx); }}
                            style={[styles.microBtn, { backgroundColor: theme.colors.warning + "12" }]}
                          >
                            <AntDesign name="edit" size={10} color={theme.colors.warning} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => { setSelectedPatti(patti); handleDeleteBuyer(idx, pIdx); }}
                            style={[styles.microBtn, { backgroundColor: theme.colors.danger + "12" }]}
                          >
                            <AntDesign name="delete" size={10} color={theme.colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={[styles.summarySection, { borderTopColor: theme.colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Total Sales</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{patti.totalPattiAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Commission ({patti.commissionPercentage}%)</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>-₹{patti.commissionAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Hamalli</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>-₹{patti.hamalliAmount.toFixed(2)}</Text>
              </View>
              {patti.lorryAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Lorry</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>-₹{patti.lorryAmount.toFixed(2)}</Text>
                </View>
              )}
              {patti.cashAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Cash</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>-₹{patti.cashAmount.toFixed(2)}</Text>
                </View>
              )}
              {patti.otherExpenses > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Other</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>-₹{patti.otherExpenses.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.finalRow, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.finalLabel, { color: theme.colors.text }]}>Final Payable</Text>
                <Text style={[styles.finalValue, { color: theme.colors.success }]}>₹{patti.finalPayableAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLegacyAllotments = () => {
    if (dateAllotments.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Legacy Allotments
        </Text>
        {dateAllotments.map((record) => (
          <View key={record.id} style={[styles.recordCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
            <View style={styles.recordHeader}>
              <View style={styles.farmerInfo}>
                <View style={[styles.farmerAvatar, { backgroundColor: theme.colors.info + "15" }]}>
                  <AntDesign name="user" size={16} color={theme.colors.info} />
                </View>
                <Text style={[styles.farmerName, { color: theme.colors.text }]}>{record.farmerName}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteAllotment(record)} style={[styles.iconBtn, { backgroundColor: theme.colors.danger + "15" }]}>
                <AntDesign name="delete" size={16} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.legacyGrid}>
              <View style={styles.legacyItem}>
                <Text style={[styles.legacyLabel, { color: theme.colors.secondary }]}>Product</Text>
                <Text style={[styles.legacyValue, { color: theme.colors.text }]}>{record.productName}</Text>
              </View>
              <View style={styles.legacyItem}>
                <Text style={[styles.legacyLabel, { color: theme.colors.secondary }]}>Buyer</Text>
                <Text style={[styles.legacyValue, { color: theme.colors.text }]}>{record.customerName}</Text>
              </View>
              <View style={styles.legacyItem}>
                <Text style={[styles.legacyLabel, { color: theme.colors.secondary }]}>Qty</Text>
                <Text style={[styles.legacyValue, { color: theme.colors.text }]}>{record.bagQuantity} bags</Text>
              </View>
              <View style={styles.legacyItem}>
                <Text style={[styles.legacyLabel, { color: theme.colors.secondary }]}>Rate</Text>
                <Text style={[styles.legacyValue, { color: theme.colors.text }]}>₹{record.rate}</Text>
              </View>
              <View style={[styles.legacyItem, { flex: 1 }]}>
                <Text style={[styles.legacyLabel, { color: theme.colors.secondary }]}>Total</Text>
                <Text style={[styles.legacyValue, { color: theme.colors.success, fontWeight: "700" }]}>₹{record.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      onClose={() => setShowEditModal(false)}
      title="Edit Expenses"
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
          <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Farmer Name</Text>
          <TextInput
            style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
            value={editForm.farmerName}
            onChangeText={(text) => setEditForm({ ...editForm, farmerName: text })}
            placeholder="Farmer name"
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Commission %</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={editForm.commissionPercentage}
              onChangeText={(text) => setEditForm({ ...editForm, commissionPercentage: text })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Hamalli/Bag ₹</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={editForm.hamalliPerBag}
              onChangeText={(text) => setEditForm({ ...editForm, hamalliPerBag: text })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Lorry ₹</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={editForm.lorryAmount}
              onChangeText={(text) => setEditForm({ ...editForm, lorryAmount: text })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Cash ₹</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={editForm.cashAmount}
              onChangeText={(text) => setEditForm({ ...editForm, cashAmount: text })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Other Expenses ₹</Text>
          <TextInput
            style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
            value={editForm.otherExpenses}
            onChangeText={(text) => setEditForm({ ...editForm, otherExpenses: text })}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </ScrollView>
    </Modal>
  );

  const renderItemModal = () => (
    <Modal
      visible={showItemModal}
      onClose={() => setShowItemModal(false)}
      title={selectedProductIndex === -1 ? "Add Item" : "Edit Item"}
      actions={[
        {
          label: "Cancel",
          onPress: () => setShowItemModal(false),
          variant: "secondary",
        },
        {
          label: "Save",
          onPress: saveItemChanges,
          variant: "success",
        },
      ]}
    >
      <ScrollView style={styles.editForm}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Product Name</Text>
          <TextInput
            style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
            value={itemForm.productName}
            onChangeText={(text) => setItemForm({ ...itemForm, productName: text })}
            placeholder="e.g., Wheat"
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Qty (bags)</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={itemForm.totalQuantity}
              onChangeText={(text) => setItemForm({ ...itemForm, totalQuantity: text })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Weight (kg)</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={itemForm.weight}
              onChangeText={(text) => setItemForm({ ...itemForm, weight: text })}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Rate ₹</Text>
          <TextInput
            style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
            value={itemForm.rate}
            onChangeText={(text) => setItemForm({ ...itemForm, rate: text })}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </ScrollView>
    </Modal>
  );

  const renderBuyerModal = () => {
    const product = selectedPatti && selectedProductIndex >= 0
      ? selectedPatti.products[selectedProductIndex]
      : null;
    const qty = parseFloat(buyerForm.quantity) || 0;
    const autoAmount = product ? calcPurchaseAmount(product, qty, product.rate) : 0;
    const soldByOthers = product
      ? product.purchases.reduce((sum, p, i) => {
          if (selectedBuyerIndex !== -1 && i === selectedBuyerIndex) return sum;
          return sum + p.quantity;
        }, 0)
      : 0;
    const available = product ? product.totalQuantity - soldByOthers : 0;

    return (
      <Modal
        visible={showBuyerModal}
        onClose={() => setShowBuyerModal(false)}
        title={selectedBuyerIndex === -1 ? "Add Buyer" : "Edit Buyer"}
        actions={[
          {
            label: "Cancel",
            onPress: () => setShowBuyerModal(false),
            variant: "secondary",
          },
          {
            label: "Save",
            onPress: saveBuyerChanges,
            variant: "success",
          },
        ]}
      >
        <ScrollView style={styles.editForm}>
          {/* Product info banner */}
          {product && (
            <View style={[styles.modalInfoBanner, { backgroundColor: theme.colors.primary + "10", borderColor: theme.colors.primary + "30" }]}>
              <Text style={[styles.modalInfoTitle, { color: theme.colors.primary }]}>{product.productName}</Text>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoText, { color: theme.colors.secondary }]}>Rate: ₹{product.rate}</Text>
                <Text style={[styles.modalInfoText, { color: available > 0 ? theme.colors.success : theme.colors.danger }]}>
                  Available: {available} bags
                </Text>
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Buyer Name</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={buyerForm.buyerName}
              onChangeText={(text) => setBuyerForm({ ...buyerForm, buyerName: text })}
              placeholder="e.g., John Doe"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.colors.secondary }]}>Quantity (bags)</Text>
            <TextInput
              style={[styles.formInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.light }]}
              value={buyerForm.quantity}
              onChangeText={(text) => setBuyerForm({ ...buyerForm, quantity: text })}
              keyboardType="numeric"
              placeholder={`Max ${available} bags`}
            />
          </View>

          {/* Auto-calculated amount */}
          {qty > 0 && product && (
            <View style={[styles.autoCalcBox, { backgroundColor: theme.colors.success + "10", borderColor: theme.colors.success + "30" }]}>
              <Text style={[styles.autoCalcLabel, { color: theme.colors.secondary }]}>Amount (auto)</Text>
              <Text style={[styles.autoCalcValue, { color: theme.colors.success }]}>₹{autoAmount.toFixed(2)}</Text>
            </View>
          )}
        </ScrollView>
      </Modal>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Modify Records</Text>
        <Text style={[styles.headerSub, { color: theme.colors.secondary }]}>Edit or delete your patti records</Text>
      </View>

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
        <Text style={{ color: theme.colors.secondary, lineHeight: 22 }}>
          Are you sure you want to delete this{" "}
          {deleteType === "patti" ? "patti" : "allotment"} record? This action
          cannot be undone.
        </Text>
      </Modal>

      {renderEditModal()}
      {renderItemModal()}
      {renderBuyerModal()}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: -0.3,
  },
  dateScroll: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 8,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },
  recordCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  farmerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  farmerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  farmerName: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tinyIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  productsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  addChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addChipSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 3,
  },
  addChipSmallText: {
    fontSize: 11,
    fontWeight: "600",
  },
  productCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 3,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  productActions: {
    flexDirection: "row",
    gap: 4,
  },
  productStats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  noBuyersText: {
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  buyersSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  buyersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  buyersLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  buyerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  buyerInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  buyerDetail: {
    fontSize: 11,
    marginTop: 1,
  },
  buyerActions: {
    flexDirection: "row",
    gap: 4,
  },
  microBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summarySection: {
    padding: 16,
    borderTopWidth: 1,
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  finalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  finalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  legacyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  legacyItem: {
    width: "47%",
  },
  legacyLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  legacyValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  editForm: {
    maxHeight: 350,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  formCol: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  modalInfoBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalInfoTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  autoCalcBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  autoCalcLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  autoCalcValue: {
    fontSize: 18,
    fontWeight: "800",
  },
});
