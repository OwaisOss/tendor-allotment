import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useFocusEffect } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { SearchableInput } from "../components/SearchableInput";
import { PattiSummaryModal } from "../components/PattiSummaryModal";
import { useTheme } from "../context/ThemeContext";
import {
  DataService,
  PattiService,
  FarmerService,
  BuyerService,
  DynamicProductService,
  ProfileService,
  StorageService,
} from "../utils/storage";
import { Customer, Product } from "../types";
import { generateAndShareFarmerBill } from "../utils/pdfGenerator";
import { PattiProduct, BuyerPurchase, PattiRecord } from "../types";

// Flow states
enum FlowState {
  FARMER_SELECTION = "farmer_selection",
  PRODUCT_SELECTION = "product_selection",
  START_FLOW = "start_flow",
  BUYER_PURCHASE = "buyer_purchase",
  OUT_OF_STOCK = "out_of_stock",
  PATTI_SUMMARY = "patti_summary",
}

export default function Allotments() {
  const router = useRouter();
  const theme = useTheme();

  // Current flow state
  const [flowState, setFlowState] = useState<FlowState>(
    FlowState.FARMER_SELECTION
  );

  // Active patti
  const [activePatti, setActivePatti] = useState<PattiRecord | null>(null);
  const [currentProduct, setCurrentProduct] = useState<PattiProduct | null>(
    null
  );

  // Farmer selection
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [farmerListKey, setFarmerListKey] = useState(0); // Force refresh when farmers change

  // Product selection
  const [productSearch, setProductSearch] = useState("");
  const [productListKey, setProductListKey] = useState(0); // Force refresh when products change
  const [productQty, setProductQty] = useState("");
  const [productWeight, setProductWeight] = useState("");
  const [productRate, setProductRate] = useState("");

  // Purchase flow
  const [buyerName, setBuyerName] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("");
  const [buyerListKey, setBuyerListKey] = useState(0); // Force refresh when buyers change

  // UI states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPattiModal, setShowPattiModal] = useState(false);
  const [showAnotherProductDialog, setShowAnotherProductDialog] =
    useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingFarmerSwitch, setPendingFarmerSwitch] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Load active patti on mount
  useEffect(() => {
    loadActivePatti();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActivePatti();
    }, [])
  );

  const loadActivePatti = () => {
    const patti = PattiService.getActive();
    if (patti) {
      setActivePatti(patti);
      setSelectedFarmer({ id: patti.farmerId, name: patti.farmerName });

      // Check if there's a current product being worked on (not fully sold)
      const incompleteProduct = patti.products.find(
        (p) => p.remainingQuantity > 0
      );
      if (incompleteProduct) {
        setCurrentProduct(incompleteProduct);
        setFlowState(FlowState.BUYER_PURCHASE);
      } else {
        // All products sold - show out of stock dialog
        setShowAnotherProductDialog(true);
        setFlowState(FlowState.OUT_OF_STOCK);
      }
    }
  };

  // ============== FARMER SELECTION ==============

  const handleFarmerSelect = (name: string) => {
    const farmer = FarmerService.findOrCreate(name);
    setSelectedFarmer({ id: farmer.id, name: farmer.name });
    setFarmerSearch(farmer.name);

    // Check if there's an active patti for this farmer
    const existingPatti = PattiService.getActive();
    if (existingPatti && existingPatti.farmerId !== farmer.id) {
      // Different farmer - ask about printing
      setPendingFarmerSwitch({ id: farmer.id, name: farmer.name });
      setShowPrintDialog(true);
    } else if (!existingPatti) {
      // No active patti - proceed to product selection
      setFlowState(FlowState.PRODUCT_SELECTION);
    }
  };

  const handleFarmerAdd = (name: string) => {
    const farmer = FarmerService.add(name);
    setSelectedFarmer({ id: farmer.id, name: farmer.name });
    setFarmerSearch(farmer.name);
    setFarmerListKey((prev) => prev + 1); // Force refresh of farmer list
    Alert.alert("Success", `Farmer "${name}" added successfully`);
    setFlowState(FlowState.PRODUCT_SELECTION);
  };

  // ============== PRODUCT SELECTION ==============

  const handleProductSelect = (name: string) => {
    const product = DynamicProductService.findOrCreate(name);
    setProductSearch(product.label);
  };

  const handleProductAdd = (name: string) => {
    const product = DynamicProductService.add(name);
    setProductSearch(product.label);
    setProductListKey((prev) => prev + 1); // Force refresh of product list
    Alert.alert("Success", `Product "${name}" added successfully`);
  };

  const handleStartFlow = () => {
    if (!selectedFarmer) {
      Alert.alert("Error", "Please select a farmer");
      return;
    }
    if (!productSearch.trim()) {
      Alert.alert("Error", "Please select a product");
      return;
    }
    if (!productQty.trim() || isNaN(parseFloat(productQty))) {
      Alert.alert("Error", "Please enter valid quantity");
      return;
    }
    if (!productRate.trim() || isNaN(parseFloat(productRate))) {
      Alert.alert("Error", "Please enter valid rate");
      return;
    }

    const product = DynamicProductService.findOrCreate(productSearch);
    const weight = parseFloat(productWeight) || 0;
    const qty = parseFloat(productQty);
    const rate = parseFloat(productRate);

    // Create product entry
    const pattiProduct: PattiProduct = {
      productId: product.value,
      productName: product.label,
      totalQuantity: qty,
      remainingQuantity: qty,
      weight,
      rate,
      totalAmount: qty * weight * rate,
      purchases: [],
    };

    // Create or update active patti
    let patti = PattiService.getActive();
    if (!patti) {
      patti = PattiService.create(
        selectedFarmer.id,
        selectedFarmer.name,
        pattiProduct
      );
    } else {
      PattiService.addProduct(pattiProduct);
      patti = PattiService.getActive();
    }

    setActivePatti(patti);
    setCurrentProduct(pattiProduct);
    setFlowState(FlowState.BUYER_PURCHASE);

    // Clear purchase fields
    setBuyerName("");
    setPurchaseQty("");
  };

  // ============== BUYER PURCHASE ==============

  const handleBuyerAdd = (name: string) => {
    if (name.trim()) {
      BuyerService.findOrCreate(name.trim());
      setBuyerName(name.trim());
      setBuyerListKey((prev) => prev + 1); // Force refresh of buyer list
    }
  };

  const handleAddPurchase = () => {
    if (!currentProduct) return;

    const qty = parseFloat(purchaseQty);
    if (!qty || isNaN(qty)) {
      Alert.alert("Error", "Please enter valid purchase quantity");
      return;
    }

    if (qty > currentProduct.remainingQuantity) {
      Alert.alert(
        "Error",
        `Only ${currentProduct.remainingQuantity} bags remaining`
      );
      return;
    }

    // Ensure buyer is added to BuyerService if name is provided
    const buyerNameToUse = buyerName.trim() || "Anonymous";
    if (buyerNameToUse !== "Anonymous") {
      BuyerService.findOrCreate(buyerNameToUse);
      setBuyerListKey((prev) => prev + 1); // Force refresh of buyer list
    }

    const purchase: BuyerPurchase = {
      id: `purchase_${Date.now()}`,
      buyerName: buyerNameToUse,
      quantity: qty,
      rate: currentProduct.rate,
      totalAmount: qty * currentProduct.weight * currentProduct.rate,
      timestamp: Date.now(),
    };

    const result = PattiService.addPurchase(currentProduct.productId, purchase);

    if (result.success) {
      setActivePatti(result.patti);

      // Find updated product
      const updatedProduct = result.patti?.products.find(
        (p) => p.productId === currentProduct.productId
      );

      if (updatedProduct) {
        setCurrentProduct(updatedProduct);

        // Check if out of stock
        if (updatedProduct.remainingQuantity <= 0) {
          setShowAnotherProductDialog(true);
          setFlowState(FlowState.OUT_OF_STOCK);
        } else {
          // Clear for next purchase
          setBuyerName("");
          setPurchaseQty("");
        }
      }
    } else {
      Alert.alert("Error", "Failed to add purchase. Insufficient stock.");
    }
  };

  // ============== OUT OF STOCK HANDLING ==============

  const handleAnotherProductYes = () => {
    setShowAnotherProductDialog(false);

    // Clear product fields for new product
    setProductSearch("");
    setProductQty("");
    setProductWeight("");
    setProductRate("");
    setCurrentProduct(null);
    setFlowState(FlowState.PRODUCT_SELECTION);
  };

  const handleAnotherProductNo = () => {
    setShowAnotherProductDialog(false);
    setShowPattiModal(true);
    setFlowState(FlowState.PATTI_SUMMARY);
  };

  // ============== PATTI SAVING ==============

  const handleSavePatti = (expenses: {
    commissionPercentage: number;
    hamalliPerBag: number;
    lorryAmount: number;
    cashAmount: number;
    otherExpenses: number;
  }) => {
    const finalizedPatti = PattiService.finalize(expenses);

    if (finalizedPatti) {
      setShowPattiModal(false);

      // Reset all states
      setActivePatti(null);
      setCurrentProduct(null);
      setSelectedFarmer(null);
      setFarmerSearch("");
      setProductSearch("");
      setProductQty("");
      setProductWeight("");
      setProductRate("");
      setBuyerName("");
      setPurchaseQty("");
      setFlowState(FlowState.FARMER_SELECTION);

      Alert.alert("Success", "Patti saved successfully!", [
        {
          text: "OK",
          onPress: () => router.push("/"),
        },
        {
          text: "Print Bill",
          onPress: () => {
            generateAndShareFarmerBill(
              finalizedPatti.farmerName,
              finalizedPatti
            );
            router.push("/");
          },
        },
      ]);
    }
  };

  // ============== PDF PRINT FLOW ==============

  const handlePrintYes = async () => {
    if (activePatti) {
      // First finalize the current patti with default expenses
      const defaultExpenses = ProfileService.getDefaultExpenses();
      const finalizedPatti = PattiService.finalize(defaultExpenses);

      if (finalizedPatti) {
        await generateAndShareFarmerBill(
          finalizedPatti.farmerName,
          finalizedPatti
        );
      }
    }

    setShowPrintDialog(false);

    // Switch to new farmer
    if (pendingFarmerSwitch) {
      setSelectedFarmer(pendingFarmerSwitch);
      setFlowState(FlowState.PRODUCT_SELECTION);
      setPendingFarmerSwitch(null);
    }
  };

  const handlePrintNo = () => {
    setShowPrintDialog(false);

    // Clear current patti without printing
    PattiService.clearActive();
    setActivePatti(null);
    setCurrentProduct(null);

    // Switch to new farmer
    if (pendingFarmerSwitch) {
      setSelectedFarmer(pendingFarmerSwitch);
      setFarmerSearch(pendingFarmerSwitch.name);
      setFlowState(FlowState.PRODUCT_SELECTION);
      setPendingFarmerSwitch(null);
    }
  };

  // ============== CANCEL/CLEAR ==============

  const handleCancel = () => {
    Alert.alert(
      "Cancel Patti",
      "Are you sure you want to cancel? All unsaved data will be lost.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            PattiService.clearActive();
            setActivePatti(null);
            setCurrentProduct(null);
            setSelectedFarmer(null);
            setFarmerSearch("");
            setProductSearch("");
            setProductQty("");
            setProductWeight("");
            setProductRate("");
            setBuyerName("");
            setPurchaseQty("");
            setFlowState(FlowState.FARMER_SELECTION);
          },
        },
      ]
    );
  };

  // ============== RENDER SECTIONS ==============

  const renderFarmerSelection = () => {
    // Check both legacy customers and new farmers
    const farmerNames = FarmerService.getAllNames();
    const legacyCustomers = StorageService.getCustomers();
    const isCustomersImported = StorageService.isCustomersImported();

    console.log("[Allotments] renderFarmerSelection - DATA CHECK:", {
      farmerListKey,
      // New farmers data
      farmerNamesCount: farmerNames.length,
      farmerNames: farmerNames.slice(0, 10),
      // Legacy customers data
      legacyCustomersCount: legacyCustomers.length,
      legacyCustomers: legacyCustomers
        .slice(0, 10)
        .map((c) => ({ value: c.value, label: c.label })),
      isCustomersImported,
      farmerSearch,
    });

    // Combine legacy customers with farmers for display
    const allFarmerOptions = [
      ...legacyCustomers.map((c: Customer) => c.label),
      ...farmerNames,
    ].filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates

    console.log("[Allotments] Combined farmer options:", {
      totalCount: allFarmerOptions.length,
      options: allFarmerOptions.slice(0, 10),
    });

    return (
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Step 1: Select Farmer
        </Text>
        <SearchableInput
          key={`farmer-${farmerListKey}`}
          label="Farmer Name:"
          value={farmerSearch}
          onChangeText={setFarmerSearch}
          onSelect={handleFarmerSelect}
          onAddNew={handleFarmerAdd}
          options={allFarmerOptions}
          placeholder="Type to search or add new farmer"
        />
        <Button
          title="Continue"
          onPress={() => {
            if (selectedFarmer) {
              setFlowState(FlowState.PRODUCT_SELECTION);
            } else if (farmerSearch.trim()) {
              handleFarmerAdd(farmerSearch.trim());
            } else {
              Alert.alert("Error", "Please enter or select a farmer");
            }
          }}
          style={styles.continueButton}
        />
      </Card>
    );
  };

  const renderProductSelection = () => {
    const productLabels = DynamicProductService.getAllLabelsIncludingLegacy();
    const legacyProducts = StorageService.getProducts();
    const isProductsImported = StorageService.isProductsImported();

    console.log("[Allotments] renderProductSelection - DATA CHECK:", {
      productListKey,
      // New dynamic products
      dynamicProductsCount: DynamicProductService.getAll().length,
      dynamicProducts: DynamicProductService.getAll()
        .slice(0, 5)
        .map((p) => ({ value: p.value, label: p.label })),
      // Legacy products
      legacyProductsCount: legacyProducts.length,
      legacyProducts: legacyProducts
        .slice(0, 10)
        .map((p: Product) => ({ value: p.value, label: p.label })),
      isProductsImported,
      // Combined result
      productLabelsCount: productLabels.length,
      productLabels: productLabels.slice(0, 10),
      productSearch,
    });

    return (
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Step 2: Select Product & Initialize Stock
        </Text>

        {/* Date Picker */}
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Date: {selectedDate.toDateString()}
        </Text>
        <Button
          title="Change Date"
          onPress={() => setShowDatePicker(true)}
          variant="secondary"
          style={styles.dateButton}
        />
        {showDatePicker && (
          <RNDateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* Farmer Info */}
        {selectedFarmer && (
          <View style={styles.selectedFarmerBanner}>
            <Text style={styles.selectedFarmerText}>
              Farmer: {selectedFarmer.name}
            </Text>
            <Button
              title="Change"
              onPress={() => {
                if (activePatti) {
                  setPendingFarmerSwitch(null);
                  setShowPrintDialog(true);
                } else {
                  setFlowState(FlowState.FARMER_SELECTION);
                }
              }}
              variant="secondary"
            />
          </View>
        )}

        <SearchableInput
          key={`product-${productListKey}`}
          label="Product Name:"
          value={productSearch}
          onChangeText={setProductSearch}
          onSelect={handleProductSelect}
          onAddNew={handleProductAdd}
          options={productLabels}
          placeholder="Type to search or add new product"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          Total Quantity (bags):
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border }]}
          value={productQty}
          onChangeText={setProductQty}
          keyboardType="numeric"
          placeholder="Enter total stock quantity"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          Weight per bag (kg):
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border }]}
          value={productWeight}
          onChangeText={setProductWeight}
          keyboardType="numeric"
          placeholder="Enter weight per bag"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          Rate (₹):
        </Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border }]}
          value={productRate}
          onChangeText={setProductRate}
          keyboardType="numeric"
          placeholder="Enter rate per bag"
        />

        {/* Calculated Total */}
        {productQty && productRate && productWeight && (
          <View
            style={[
              styles.calculatedBox,
              { backgroundColor: theme.colors.light },
            ]}
          >
            <Text style={styles.calculatedLabel}>Estimated Total:</Text>
            <Text
              style={[styles.calculatedValue, { color: theme.colors.success }]}
            >
              ₹
              {(
                parseFloat(productQty) *
                (parseFloat(productWeight) || 0) *
                parseFloat(productRate)
              ).toFixed(2)}
            </Text>
          </View>
        )}

        <Button
          title="Start Selling"
          onPress={handleStartFlow}
          style={styles.startButton}
          icon={<AntDesign name="playcircleo" size={20} color="white" />}
        />
      </Card>
    );
  };

  const renderBuyerPurchase = () => {
    if (!currentProduct || !activePatti) return null;

    return (
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Step 3: Buyer Purchases
        </Text>

        {/* Current Product Info */}
        <View
          style={[
            styles.productBanner,
            { backgroundColor: theme.colors.primary + "20" },
          ]}
        >
          <Text style={styles.productBannerText}>
            Product: {currentProduct.productName}
          </Text>
          <Text
            style={[
              styles.stockText,
              currentProduct.remainingQuantity <= 5
                ? { color: theme.colors.danger }
                : { color: theme.colors.success },
            ]}
          >
            Remaining: {currentProduct.remainingQuantity} /{" "}
            {currentProduct.totalQuantity} bags
          </Text>
        </View>

        {/* Purchase History for Current Product */}
        {currentProduct.purchases.length > 0 && (
          <View style={styles.purchaseHistory}>
            <Text style={[styles.subTitle, { color: theme.colors.text }]}>
              Purchases so far:
            </Text>
            {currentProduct.purchases.map((purchase) => (
              <View key={purchase.id} style={styles.purchaseRow}>
                <Text style={styles.purchaseText}>
                  {purchase.buyerName || "Anonymous"}: {purchase.quantity} bags
                  @ ₹{purchase.rate} = ₹{purchase.totalAmount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add New Purchase */}
        <View style={styles.purchaseForm}>
          <SearchableInput
            key={`buyer-${buyerListKey}`}
            label="Buyer Name (Optional):"
            value={buyerName}
            onChangeText={setBuyerName}
            onSelect={setBuyerName}
            onAddNew={handleBuyerAdd}
            options={BuyerService.getAllNames()}
            placeholder="Type buyer name or leave empty"
            allowNew={true}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>
            Purchase Quantity (bags):
          </Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border }]}
            value={purchaseQty}
            onChangeText={setPurchaseQty}
            keyboardType="numeric"
            placeholder={`Max ${currentProduct.remainingQuantity} bags`}
          />

          {purchaseQty && (
            <View
              style={[
                styles.calculatedBox,
                { backgroundColor: theme.colors.light },
              ]}
            >
              <Text style={styles.calculatedLabel}>Purchase Amount:</Text>
              <Text
                style={[
                  styles.calculatedValue,
                  { color: theme.colors.primary },
                ]}
              >
                ₹
                {(
                  parseFloat(purchaseQty) *
                  currentProduct.weight *
                  currentProduct.rate
                ).toFixed(2)}
              </Text>
            </View>
          )}

          <Button
            title="Add Purchase"
            onPress={handleAddPurchase}
            style={styles.addButton}
            icon={<AntDesign name="plus" size={20} color="white" />}
          />
        </View>
      </Card>
    );
  };

  const renderActivePattiSummary = () => {
    if (!activePatti) return null;

    const totalSold = activePatti.products.reduce(
      (sum, p) => sum + (p.totalQuantity - p.remainingQuantity),
      0
    );
    const totalStock = activePatti.products.reduce(
      (sum, p) => sum + p.totalQuantity,
      0
    );

    return (
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Current Patti Summary
        </Text>
        <Text style={styles.summaryText}>Farmer: {activePatti.farmerName}</Text>
        <Text style={styles.summaryText}>
          Products: {activePatti.products.length}
        </Text>
        <Text style={styles.summaryText}>
          Total Sold: {totalSold} / {totalStock} bags
        </Text>
        <Button
          title="Finish & Save Patti"
          onPress={() => {
            setShowPattiModal(true);
            setFlowState(FlowState.PATTI_SUMMARY);
          }}
          variant="success"
          style={styles.finishButton}
          icon={<AntDesign name="checkcircle" size={20} color="white" />}
        />
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Progress Indicator */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressStep,
              flowState !== FlowState.FARMER_SELECTION &&
                styles.progressStepActive,
            ]}
          >
            <Text
              style={[
                styles.progressText,
                flowState !== FlowState.FARMER_SELECTION &&
                  styles.progressTextActive,
              ]}
            >
              1. Farmer
            </Text>
          </View>
          <View style={styles.progressArrow}>
            <AntDesign name="right" size={16} color="#999" />
          </View>
          <View
            style={[
              styles.progressStep,
              (flowState === FlowState.BUYER_PURCHASE ||
                flowState === FlowState.OUT_OF_STOCK ||
                flowState === FlowState.PATTI_SUMMARY) &&
                styles.progressStepActive,
            ]}
          >
            <Text
              style={[
                styles.progressText,
                (flowState === FlowState.BUYER_PURCHASE ||
                  flowState === FlowState.OUT_OF_STOCK ||
                  flowState === FlowState.PATTI_SUMMARY) &&
                  styles.progressTextActive,
              ]}
            >
              2. Product
            </Text>
          </View>
          <View style={styles.progressArrow}>
            <AntDesign name="right" size={16} color="#999" />
          </View>
          <View
            style={[
              styles.progressStep,
              (flowState === FlowState.BUYER_PURCHASE ||
                flowState === FlowState.PATTI_SUMMARY) &&
                styles.progressStepActive,
            ]}
          >
            <Text
              style={[
                styles.progressText,
                (flowState === FlowState.BUYER_PURCHASE ||
                  flowState === FlowState.PATTI_SUMMARY) &&
                  styles.progressTextActive,
              ]}
            >
              3. Sales
            </Text>
          </View>
        </View>

        {/* Main Content */}
        {flowState === FlowState.FARMER_SELECTION && renderFarmerSelection()}
        {flowState === FlowState.PRODUCT_SELECTION && renderProductSelection()}
        {flowState === FlowState.BUYER_PURCHASE && renderBuyerPurchase()}
        {(flowState === FlowState.BUYER_PURCHASE ||
          flowState === FlowState.OUT_OF_STOCK ||
          flowState === FlowState.PATTI_SUMMARY) &&
          renderActivePattiSummary()}

        {/* Cancel Button */}
        {activePatti && (
          <Button
            title="Cancel Patti"
            onPress={handleCancel}
            variant="danger"
            style={styles.cancelButton}
            icon={<AntDesign name="closecircle" size={20} color="white" />}
          />
        )}
      </ScrollView>

      {/* Another Product Dialog */}
      <Modal
        visible={showAnotherProductDialog}
        onClose={() => setShowAnotherProductDialog(false)}
        title="Out of Stock"
        actions={[
          {
            label: "No, Save Patti",
            onPress: handleAnotherProductNo,
            variant: "success",
          },
          {
            label: "Yes, Add Product",
            onPress: handleAnotherProductYes,
            variant: "primary",
          },
        ]}
      >
        <Text>The current product is now out of stock.</Text>
        <Text style={styles.dialogText}>
          Does the same farmer have another product to sell?
        </Text>
      </Modal>

      {/* Print Dialog */}
      <Modal
        visible={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        title="Print Bill?"
        actions={[
          {
            label: "No, Continue",
            onPress: handlePrintNo,
            variant: "secondary",
          },
          {
            label: "Yes, Print PDF",
            onPress: handlePrintYes,
            variant: "success",
          },
        ]}
      >
        <Text>Do you want to print the bill (PDF) for this farmer?</Text>
        {activePatti && (
          <Text style={styles.dialogText}>
            Current Patti: {activePatti.farmerName} - ₹
            {activePatti.totalPattiAmount.toFixed(2)}
          </Text>
        )}
      </Modal>

      {/* Patti Summary Modal */}
      <PattiSummaryModal
        visible={showPattiModal}
        onClose={() => {
          setShowPattiModal(false);
          if (activePatti) {
            setFlowState(FlowState.BUYER_PURCHASE);
          }
        }}
        onSave={handleSavePatti}
        patti={activePatti}
        defaultExpenses={ProfileService.getDefaultExpenses()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  progressStep: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressStepActive: {
    backgroundColor: "#007bff20",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#999",
  },
  progressTextActive: {
    color: "#007bff",
    fontWeight: "600",
  },
  progressArrow: {
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dateButton: {
    marginBottom: 16,
  },
  continueButton: {
    marginTop: 16,
  },
  startButton: {
    marginTop: 16,
  },
  addButton: {
    marginTop: 16,
  },
  finishButton: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  selectedFarmerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e8f4f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedFarmerText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  productBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  productBannerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  stockText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  calculatedBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calculatedLabel: {
    fontSize: 14,
    color: "#666",
  },
  calculatedValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  purchaseHistory: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  purchaseRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  purchaseText: {
    fontSize: 13,
    color: "#555",
  },
  purchaseForm: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  dialogText: {
    marginTop: 8,
    fontWeight: "500",
    color: "#333",
  },
});
