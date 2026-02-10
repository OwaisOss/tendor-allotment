import { MMKV } from "react-native-mmkv";
import {
  AllotmentRecord,
  Customer,
  Product,
  DashboardStats,
  CustomerReport,
  ItemReport,
  PattiRecord,
  PattiProduct,
  BuyerPurchase,
  Farmer,
  Buyer,
  FarmerReport,
  BuyerReport,
  DailySummary,
  CommissionReport,
  ProductSalesReport,
  NewDashboardStats,
  AppProfile,
} from "../types";

export const storage = new MMKV();

const STORAGE_KEYS = {
  // Legacy keys
  CUSTOMERS: "customers",
  PRODUCTS: "products",
  ALLOTMENTS: "allotments",
  CUST_FILE_IMPORTED: "cust_file_imported",
  ITEMS_FILE_IMPORTED: "items_file_imported",

  // New model keys
  FARMERS: "farmers",
  BUYERS: "buyers",
  DYNAMIC_PRODUCTS: "dynamic_products",
  PATTIS: "pattis",
  ACTIVE_PATTI: "active_patti", // Currently active patti being built
  PROFILE: "profile",
};

// ============== PROFILE/SETTINGS ==============

export const ProfileService = {
  saveProfile: (profile: AppProfile) => {
    storage.set(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getProfile: (): AppProfile => {
    const data = storage.getString(STORAGE_KEYS.PROFILE);
    return (
      data ? JSON.parse(data) : {
        defaultCommissionPercentage: 2,
        defaultHamalliPerBag: 2,
        defaultLorryAmount: 0,
        defaultCashAmount: 0,
        defaultOtherExpenses: 0,
      }
    );
  },

  getDefaultExpenses: () => {
    const profile = ProfileService.getProfile();
    return {
      commissionPercentage: profile.defaultCommissionPercentage,
      hamalliPerBag: profile.defaultHamalliPerBag,
      lorryAmount: profile.defaultLorryAmount,
      cashAmount: profile.defaultCashAmount,
      otherExpenses: profile.defaultOtherExpenses,
    };
  },
};

// ============== FARMER MANAGEMENT ==============

export const FarmerService = {
  getAll: (): Farmer[] => {
    const data = storage.getString(STORAGE_KEYS.FARMERS);
    return data ? JSON.parse(data) : [];
  },

  save: (farmers: Farmer[]) => {
    storage.set(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
  },

  add: (name: string): Farmer => {
    const farmers = FarmerService.getAll();
    const newFarmer: Farmer = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: Date.now(),
    };
    farmers.push(newFarmer);
    FarmerService.save(farmers);
    return newFarmer;
  },

  findOrCreate: (name: string): Farmer => {
    const farmers = FarmerService.getAll();
    const existing = farmers.find(
      (f) => f.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) return existing;
    return FarmerService.add(name);
  },

  findById: (id: string): Farmer | undefined => {
    return FarmerService.getAll().find((f) => f.id === id);
  },

  search: (query: string): Farmer[] => {
    const farmers = FarmerService.getAll();
    if (!query.trim()) return farmers;
    return farmers.filter((f) =>
      f.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  },

  getAllNames: (): string[] => {
    return FarmerService.getAll().map((f) => f.name);
  },
};

// ============== BUYER MANAGEMENT ==============

export const BuyerService = {
  getAll: (): Buyer[] => {
    const data = storage.getString(STORAGE_KEYS.BUYERS);
    return data ? JSON.parse(data) : [];
  },

  save: (buyers: Buyer[]) => {
    storage.set(STORAGE_KEYS.BUYERS, JSON.stringify(buyers));
  },

  add: (name: string): Buyer => {
    const buyers = BuyerService.getAll();
    const newBuyer: Buyer = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: Date.now(),
    };
    buyers.push(newBuyer);
    BuyerService.save(buyers);
    return newBuyer;
  },

  findOrCreate: (name: string): Buyer => {
    const buyers = BuyerService.getAll();
    const existing = buyers.find(
      (b) => b.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) return existing;
    return BuyerService.add(name);
  },

  findByName: (name: string): Buyer | undefined => {
    return BuyerService.getAll().find(
      (b) => b.name.toLowerCase() === name.trim().toLowerCase()
    );
  },

  search: (query: string): Buyer[] => {
    const buyers = BuyerService.getAll();
    if (!query.trim()) return buyers;
    return buyers.filter((b) =>
      b.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  },

  getAllNames: (): string[] => {
    return BuyerService.getAll().map((b) => b.name);
  },
};

// ============== PRODUCT MANAGEMENT (Dynamic) ==============

export const DynamicProductService = {
  getAll: (): Product[] => {
    const data = storage.getString(STORAGE_KEYS.DYNAMIC_PRODUCTS);
    return data ? JSON.parse(data) : [];
  },

  save: (products: Product[]) => {
    storage.set(STORAGE_KEYS.DYNAMIC_PRODUCTS, JSON.stringify(products));
  },

  add: (name: string): Product => {
    const products = DynamicProductService.getAll();
    const newProduct: Product = {
      value: Date.now().toString(),
      label: name.trim(),
    };
    products.push(newProduct);
    DynamicProductService.save(products);
    return newProduct;
  },

  findOrCreate: (name: string): Product => {
    const products = DynamicProductService.getAll();
    const existing = products.find(
      (p) => p.label.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) return existing;
    return DynamicProductService.add(name);
  },

  findByValue: (value: string): Product | undefined => {
    return DynamicProductService.getAll().find((p) => p.value === value);
  },

  search: (query: string): Product[] => {
    const products = DynamicProductService.getAll();
    if (!query.trim()) return products;
    return products.filter((p) =>
      p.label.toLowerCase().includes(query.trim().toLowerCase())
    );
  },

  getAllLabels: (): string[] => {
    return DynamicProductService.getAll().map((p) => p.label);
  },

  // Get all product labels including legacy (CSV imported) products
  getAllLabelsIncludingLegacy: (): string[] => {
    const legacy = StorageService.getProducts();
    const dynamic = DynamicProductService.getAll();
    // Combine and remove duplicates (case-insensitive)
    const allProducts = [...legacy, ...dynamic];
    const uniqueLabels = new Set<string>();
    allProducts.forEach((p) => {
      const label = p.label.trim();
      if (label) {
        // Use lowercase for comparison to avoid duplicates
        const lowerLabel = label.toLowerCase();
        // Check if we already have this label (case-insensitive)
        const exists = Array.from(uniqueLabels).some(
          (existing) => existing.toLowerCase() === lowerLabel
        );
        if (!exists) {
          uniqueLabels.add(label);
        }
      }
    });
    return Array.from(uniqueLabels);
  },

  // Combined with legacy products
  getAllForDropdown: (): Product[] => {
    const legacy = StorageService.getProducts();
    const dynamic = DynamicProductService.getAll();
    return [...legacy, ...dynamic];
  },
};

// ============== PATTI MANAGEMENT ==============

export const PattiService = {
  // Get all pattis
  getAll: (): PattiRecord[] => {
    const data = storage.getString(STORAGE_KEYS.PATTIS);
    return data ? JSON.parse(data) : [];
  },

  save: (pattis: PattiRecord[]) => {
    storage.set(STORAGE_KEYS.PATTIS, JSON.stringify(pattis));
  },

  // Get active patti (currently being built)
  getActive: (): PattiRecord | null => {
    const data = storage.getString(STORAGE_KEYS.ACTIVE_PATTI);
    return data ? JSON.parse(data) : null;
  },

  // Save active patti
  setActive: (patti: PattiRecord | null) => {
    if (patti) {
      storage.set(STORAGE_KEYS.ACTIVE_PATTI, JSON.stringify(patti));
    } else {
      storage.delete(STORAGE_KEYS.ACTIVE_PATTI);
    }
  },

  // Clear active patti
  clearActive: () => {
    storage.delete(STORAGE_KEYS.ACTIVE_PATTI);
  },

  // Create new patti
  create: (
    farmerId: string,
    farmerName: string,
    product: PattiProduct
  ): PattiRecord => {
    const profile = ProfileService.getProfile();
    const now = Date.now();

    const patti: PattiRecord = {
      id: `patti_${now}`,
      date: new Date().toISOString().split("T")[0],
      farmerId,
      farmerName,
      products: [product],
      commissionPercentage: profile.defaultCommissionPercentage,
      commissionAmount: 0,
      hamalliPerBag: profile.defaultHamalliPerBag,
      hamalliAmount: 0,
      lorryAmount: profile.defaultLorryAmount,
      cashAmount: profile.defaultCashAmount,
      otherExpenses: profile.defaultOtherExpenses,
      totalPattiAmount: 0,
      totalDeductions: 0,
      finalPayableAmount: 0,
      isClosed: false,
      createdAt: now,
      updatedAt: now,
    };

    PattiService.setActive(patti);
    return patti;
  },

  // Add product to active patti
  addProduct: (product: PattiProduct): PattiRecord | null => {
    const active = PattiService.getActive();
    if (!active) return null;

    active.products.push(product);
    active.updatedAt = Date.now();
    PattiService.setActive(active);
    return active;
  },

  // Add purchase to a product in active patti
  addPurchase: (
    productId: string,
    purchase: BuyerPurchase
  ): { success: boolean; remaining: number; patti: PattiRecord | null } => {
    const active = PattiService.getActive();
    if (!active) return { success: false, remaining: 0, patti: null };

    const product = active.products.find((p) => p.productId === productId);
    if (!product) return { success: false, remaining: 0, patti: null };

    if (product.remainingQuantity < purchase.quantity) {
      return {
        success: false,
        remaining: product.remainingQuantity,
        patti: active,
      };
    }

    product.purchases.push(purchase);
    product.remainingQuantity -= purchase.quantity;
    active.updatedAt = Date.now();
    PattiService.setActive(active);

    return {
      success: true,
      remaining: product.remainingQuantity,
      patti: active,
    };
  },

  // Calculate and finalize patti
  finalize: (expenseOverrides?: {
    commissionPercentage?: number;
    hamalliPerBag?: number;
    lorryAmount?: number;
    cashAmount?: number;
    otherExpenses?: number;
  }): PattiRecord | null => {
    const active = PattiService.getActive();
    if (!active) return null;

    // Apply overrides if provided
    if (expenseOverrides) {
      if (expenseOverrides.commissionPercentage !== undefined) {
        active.commissionPercentage = expenseOverrides.commissionPercentage;
      }
      if (expenseOverrides.hamalliPerBag !== undefined) {
        active.hamalliPerBag = expenseOverrides.hamalliPerBag;
      }
      if (expenseOverrides.lorryAmount !== undefined) {
        active.lorryAmount = expenseOverrides.lorryAmount;
      }
      if (expenseOverrides.cashAmount !== undefined) {
        active.cashAmount = expenseOverrides.cashAmount;
      }
      if (expenseOverrides.otherExpenses !== undefined) {
        active.otherExpenses = expenseOverrides.otherExpenses;
      }
    }

    // Calculate totals
    let totalBags = 0;
    let totalSales = 0;

    active.products.forEach((product) => {
      totalBags += product.totalQuantity;
      totalSales += product.totalAmount;
    });

    active.totalPattiAmount = totalSales;
    active.commissionAmount = (totalSales * active.commissionPercentage) / 100;
    active.hamalliAmount = totalBags * active.hamalliPerBag;
    active.totalDeductions =
      active.commissionAmount +
      active.hamalliAmount +
      active.lorryAmount +
      active.cashAmount +
      active.otherExpenses;
    active.finalPayableAmount = totalSales - active.totalDeductions;
    active.isClosed = true;
    active.updatedAt = Date.now();

    // Save to permanent storage
    const pattis = PattiService.getAll();
    pattis.push(active);
    PattiService.save(pattis);

    // Clear active
    PattiService.clearActive();

    return active;
  },

  // Get pattis by farmer
  getByFarmer: (farmerId: string): PattiRecord[] => {
    return PattiService.getAll().filter((p) => p.farmerId === farmerId);
  },

  // Get pattis by date
  getByDate: (date: string): PattiRecord[] => {
    return PattiService.getAll().filter((p) => p.date === date);
  },

  // Delete patti (for modify screen)
  delete: (pattiId: string): boolean => {
    const pattis = PattiService.getAll();
    const index = pattis.findIndex((p) => p.id === pattiId);
    if (index === -1) return false;

    pattis.splice(index, 1);
    PattiService.save(pattis);
    return true;
  },

  // Get unique dates
  getUniqueDates: (): string[] => {
    const pattis = PattiService.getAll();
    const dates = [...new Set(pattis.map((p) => p.date))];
    return dates.sort().reverse();
  },
};

// ============== REPORT SERVICES ==============

export const ReportService = {
  // Farmer-wise report
  getFarmerReports: (): FarmerReport[] => {
    const pattis = PattiService.getAll();
    const farmers = FarmerService.getAll();

    return farmers.map((farmer) => {
      const farmerPattis = pattis.filter((p) => p.farmerId === farmer.id);

      let totalProducts = 0;
      let totalBags = 0;
      let totalSales = 0;
      let totalCommission = 0;
      let totalPayable = 0;

      const pattiSummaries = farmerPattis.map((patti) => {
        const products = patti.products.map((prod) => ({
          productName: prod.productName,
          quantity: prod.totalQuantity,
          rate: prod.rate,
          amount: prod.totalAmount,
          buyers: prod.purchases.map((pur) => pur.buyerName),
        }));

        totalProducts += patti.products.length;
        const pattiBags = patti.products.reduce(
          (sum, p) => sum + p.totalQuantity,
          0
        );
        totalBags += pattiBags;
        totalSales += patti.totalPattiAmount;
        totalCommission += patti.commissionAmount;
        totalPayable += patti.finalPayableAmount;

        return {
          pattiId: patti.id,
          date: patti.date,
          products,
          totalAmount: patti.totalPattiAmount,
          deductions: patti.totalDeductions,
          finalPayable: patti.finalPayableAmount,
        };
      });

      return {
        farmerId: farmer.id,
        farmerName: farmer.name,
        totalPattis: farmerPattis.length,
        totalProducts,
        totalBags,
        totalSales,
        totalCommission,
        totalPayable,
        outstandingAmount: totalPayable, // Can be adjusted if payment tracking added
        pattis: pattiSummaries,
      };
    });
  },

  // Buyer-wise report
  getBuyerReports: (): BuyerReport[] => {
    const pattis = PattiService.getAll();
    const buyers = BuyerService.getAll();

    return buyers.map((buyer) => {
      const purchases: BuyerReport["purchases"] = [];

      pattis.forEach((patti) => {
        patti.products.forEach((product) => {
          product.purchases.forEach((purchase) => {
            if (purchase.buyerName === buyer.name) {
              purchases.push({
                date: patti.date,
                farmerName: patti.farmerName,
                productName: product.productName,
                quantity: purchase.quantity,
                rate: purchase.rate,
                amount: purchase.totalAmount,
              });
            }
          });
        });
      });

      const totalBags = purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);

      return {
        buyerId: buyer.id,
        buyerName: buyer.name,
        totalPurchases: purchases.length,
        totalBags,
        totalAmount,
        purchases: purchases.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    });
  },

  // Daily summary report
  getDailySummaries: (): DailySummary[] => {
    const pattis = PattiService.getAll();
    const dates = [...new Set(pattis.map((p) => p.date))].sort().reverse();

    return dates.map((date) => {
      const datePattis = pattis.filter((p) => p.date === date);

      const uniqueFarmers = new Set(datePattis.map((p) => p.farmerId));

      const uniqueBuyers = new Set();
      datePattis.forEach((patti) => {
        patti.products.forEach((product) => {
          product.purchases.forEach((purchase) => {
            uniqueBuyers.add(purchase.buyerName);
          });
        });
      });

      let totalBags = 0;
      let totalSales = 0;
      let totalCommission = 0;
      let totalHamalli = 0;
      let totalLorry = 0;
      let totalCash = 0;
      let totalOther = 0;

      const productMap = new Map<string, { name: string; qty: number }>();

      datePattis.forEach((patti) => {
        totalSales += patti.totalPattiAmount;
        totalCommission += patti.commissionAmount;
        totalHamalli += patti.hamalliAmount;
        totalLorry += patti.lorryAmount;
        totalCash += patti.cashAmount;
        totalOther += patti.otherExpenses;

        patti.products.forEach((prod) => {
          totalBags += prod.totalQuantity;

          const existing = productMap.get(prod.productId);
          if (existing) {
            existing.qty += prod.totalQuantity;
          } else {
            productMap.set(prod.productId, {
              name: prod.productName,
              qty: prod.totalQuantity,
            });
          }
        });
      });

      return {
        date,
        totalPattis: datePattis.length,
        totalFarmers: uniqueFarmers.size,
        totalBuyers: uniqueBuyers.size,
        totalBags,
        totalSales,
        totalCommission,
        totalHamalli,
        totalLorry,
        totalCash,
        totalOtherExpenses: totalOther,
        products: Array.from(productMap.entries()).map(([id, data]) => ({
          productId: id,
          productName: data.name,
          totalQuantity: data.qty,
        })),
      };
    });
  },

  // Commission report
  getCommissionReport: (): CommissionReport => {
    const pattis = PattiService.getAll().filter((p) => p.isClosed);

    const pattisWithCommission = pattis.map((patti) => ({
      pattiId: patti.id,
      date: patti.date,
      farmerName: patti.farmerName,
      pattiAmount: patti.totalPattiAmount,
      commissionPercentage: patti.commissionPercentage,
      commissionAmount: patti.commissionAmount,
    }));

    const totalCommission = pattis.reduce(
      (sum, p) => sum + p.commissionAmount,
      0
    );

    return {
      totalCommission,
      pattisWithCommission: pattisWithCommission.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    };
  },

  // Product-wise sales report
  getProductSalesReport: (): ProductSalesReport[] => {
    const pattis = PattiService.getAll();
    const products = DynamicProductService.getAllForDropdown();

    const productData = new Map<
      string,
      {
        name: string;
        quantity: number;
        amount: number;
        transactions: number;
        farmers: Map<string, { name: string; qty: number; amt: number }>;
      }
    >();

    pattis.forEach((patti) => {
      patti.products.forEach((prod) => {
        const existing = productData.get(prod.productId);

        if (existing) {
          existing.quantity += prod.totalQuantity;
          existing.amount += prod.totalAmount;
          existing.transactions += prod.purchases.length;
        } else {
          productData.set(prod.productId, {
            name: prod.productName,
            quantity: prod.totalQuantity,
            amount: prod.totalAmount,
            transactions: prod.purchases.length,
            farmers: new Map(),
          });
        }

        const data = productData.get(prod.productId)!;
        const farmerEntry = data.farmers.get(patti.farmerId);
        if (farmerEntry) {
          farmerEntry.qty += prod.totalQuantity;
          farmerEntry.amt += prod.totalAmount;
        } else {
          data.farmers.set(patti.farmerId, {
            name: patti.farmerName,
            qty: prod.totalQuantity,
            amt: prod.totalAmount,
          });
        }
      });
    });

    return Array.from(productData.entries()).map(([id, data]) => ({
      productId: id,
      productName: data.name,
      totalQuantity: data.quantity,
      totalAmount: data.amount,
      totalTransactions: data.transactions,
      farmerBreakdown: Array.from(data.farmers.entries()).map(
        ([farmerId, f]) => ({
          farmerId,
          farmerName: f.name,
          quantity: f.qty,
          amount: f.amt,
        })
      ),
    }));
  },
};

// ============== DASHBOARD STATS ==============

export const NewDashboardService = {
  getStats: (): NewDashboardStats => {
    const pattis = PattiService.getAll();
    const farmers = FarmerService.getAll();
    const buyers = BuyerService.getAll();

    const today = new Date().toISOString().split("T")[0];
    const todayPattis = pattis.filter((p) => p.date === today);

    // Calculate totals
    let totalBags = 0;
    let totalSales = 0;
    let totalCommission = 0;
    const productMap = new Map<string, { name: string; qty: number }>();
    const farmerSales = new Map<string, { name: string; sales: number }>();
    const buyerPurchases = new Map<string, { name: string; bags: number }>();

    pattis.forEach((patti) => {
      totalSales += patti.totalPattiAmount;
      totalCommission += patti.commissionAmount;

      // Track farmer sales
      const farmerData = farmerSales.get(patti.farmerId);
      if (farmerData) {
        farmerData.sales += patti.totalPattiAmount;
      } else {
        farmerSales.set(patti.farmerId, {
          name: patti.farmerName,
          sales: patti.totalPattiAmount,
        });
      }

      patti.products.forEach((prod) => {
        totalBags += prod.totalQuantity;

        // Track products
        const prodData = productMap.get(prod.productId);
        if (prodData) {
          prodData.qty += prod.totalQuantity;
        } else {
          productMap.set(prod.productId, {
            name: prod.productName,
            qty: prod.totalQuantity,
          });
        }

        // Track buyers
        prod.purchases.forEach((purchase) => {
          const buyerData = buyerPurchases.get(purchase.buyerName);
          if (buyerData) {
            buyerData.bags += purchase.quantity;
          } else {
            buyerPurchases.set(purchase.buyerName, {
              name: purchase.buyerName,
              bags: purchase.quantity,
            });
          }
        });
      });
    });

    // Today's stats
    const todayStats = {
      pattis: todayPattis.length,
      sales: todayPattis.reduce((sum, p) => sum + p.totalPattiAmount, 0),
      commission: todayPattis.reduce((sum, p) => sum + p.commissionAmount, 0),
    };

    // Top farmers (by sales)
    const topFarmers = Array.from(farmerSales.entries())
      .map(([id, data]) => ({
        farmerId: id,
        farmerName: data.name,
        totalSales: data.sales,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    // Top buyers (by bags)
    const topBuyers = Array.from(buyerPurchases.entries())
      .map(([id, data]) => ({
        buyerId: id,
        buyerName: data.name,
        totalBags: data.bags,
      }))
      .sort((a, b) => b.totalBags - a.totalBags)
      .slice(0, 5);

    // Top products
    const topProducts = Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        totalQuantity: data.qty,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    return {
      totalFarmers: farmers.length,
      totalBuyers: buyers.length,
      totalPattis: pattis.length,
      totalProducts: productMap.size,
      totalBags,
      totalSales,
      totalCommission,
      todayStats,
      topFarmers,
      topBuyers,
      topProducts,
    };
  },
};

// ============== LEGACY STORAGE SERVICE (Preserved) ==============

export const StorageService = {
  // Customers
  saveCustomers: (customers: Customer[]) => {
    storage.set(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    storage.set(STORAGE_KEYS.CUST_FILE_IMPORTED, "true");
  },
  getCustomers: (): Customer[] => {
    const data = storage.getString(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  isCustomersImported: (): boolean => {
    return storage.getString(STORAGE_KEYS.CUST_FILE_IMPORTED) === "true";
  },

  // Products
  saveProducts: (products: Product[]) => {
    storage.set(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    storage.set(STORAGE_KEYS.ITEMS_FILE_IMPORTED, "true");
  },
  getProducts: (): Product[] => {
    const data = storage.getString(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  isProductsImported: (): boolean => {
    return storage.getString(STORAGE_KEYS.ITEMS_FILE_IMPORTED) === "true";
  },

  // Allotments
  saveAllotment: (record: AllotmentRecord) => {
    const allotments = StorageService.getAllotments();
    allotments.push(record);
    storage.set(STORAGE_KEYS.ALLOTMENTS, JSON.stringify(allotments));
  },
  saveAllotments: (allotments: AllotmentRecord[]) => {
    storage.set(STORAGE_KEYS.ALLOTMENTS, JSON.stringify(allotments));
  },
  updateAllotment: (record: AllotmentRecord) => {
    const allotments = StorageService.getAllotments();
    const index = allotments.findIndex((a) => a.id === record.id);
    if (index !== -1) {
      allotments[index] = record;
      storage.set(STORAGE_KEYS.ALLOTMENTS, JSON.stringify(allotments));
    }
  },
  getAllotments: (): AllotmentRecord[] => {
    const data = storage.getString(STORAGE_KEYS.ALLOTMENTS);
    return data ? JSON.parse(data) : [];
  },
  getAllotmentsByDate: (date: string): AllotmentRecord[] => {
    const allotments = StorageService.getAllotments();
    return allotments.filter((a) => a.date === date);
  },

  // Legacy Reports
  getCustomerReport: (): CustomerReport[] => {
    const allotments = StorageService.getAllotments();
    const customerMap = new Map<string, CustomerReport>();

    allotments.forEach((allotment) => {
      if (!customerMap.has(allotment.customerId)) {
        customerMap.set(allotment.customerId, {
          customerId: allotment.customerId,
          customerName: allotment.customerName,
          totalItems: 0,
          totalBags: 0,
          totalAmount: 0,
          itemsPurchased: [],
        });
      }

      const report = customerMap.get(allotment.customerId)!;
      report.totalBags += allotment.bagQuantity;
      report.totalAmount += allotment.totalAmount;

      const itemIndex = report.itemsPurchased.findIndex(
        (i) => i.productId === allotment.productId
      );
      if (itemIndex === -1) {
        report.itemsPurchased.push({
          productId: allotment.productId,
          productName: allotment.productName,
          quantity: allotment.bagQuantity,
        });
        report.totalItems++;
      } else {
        report.itemsPurchased[itemIndex].quantity += allotment.bagQuantity;
      }
    });

    return Array.from(customerMap.values());
  },

  getItemReport: (): ItemReport[] => {
    const allotments = StorageService.getAllotments();
    const itemMap = new Map<string, ItemReport>();

    allotments.forEach((allotment) => {
      if (!itemMap.has(allotment.productId)) {
        itemMap.set(allotment.productId, {
          productId: allotment.productId,
          productName: allotment.productName,
          totalCustomers: 0,
          totalBags: 0,
          totalAmount: 0,
          customers: [],
        });
      }

      const report = itemMap.get(allotment.productId)!;
      report.totalBags += allotment.bagQuantity;
      report.totalAmount += allotment.totalAmount;

      const customerIndex = report.customers.findIndex(
        (c) => c.customerId === allotment.customerId
      );
      if (customerIndex === -1) {
        report.customers.push({
          customerId: allotment.customerId,
          customerName: allotment.customerName,
          quantity: allotment.bagQuantity,
        });
        report.totalCustomers++;
      } else {
        report.customers[customerIndex].quantity += allotment.bagQuantity;
      }
    });

    return Array.from(itemMap.values());
  },

  getDashboardStats: (): DashboardStats => {
    const allotments = StorageService.getAllotments();
    const itemStats = new Map<
      string,
      { totalBags: number; totalAmount: number }
    >();
    const customerStats = new Map<
      string,
      { totalAmount: number; name: string }
    >();

    allotments.forEach((allotment) => {
      if (!itemStats.has(allotment.productId)) {
        itemStats.set(allotment.productId, { totalBags: 0, totalAmount: 0 });
      }
      const itemStat = itemStats.get(allotment.productId)!;
      itemStat.totalBags += allotment.bagQuantity;
      itemStat.totalAmount += allotment.totalAmount;

      if (!customerStats.has(allotment.customerId)) {
        customerStats.set(allotment.customerId, {
          totalAmount: 0,
          name: allotment.customerName,
        });
      }
      const customerStat = customerStats.get(allotment.customerId)!;
      customerStat.totalAmount += allotment.totalAmount;
    });

    let topBuyer = { customerId: "", customerName: "", totalAmount: 0 };
    customerStats.forEach((stat, customerId) => {
      if (stat.totalAmount > topBuyer.totalAmount) {
        topBuyer = {
          customerId,
          customerName: stat.name,
          totalAmount: stat.totalAmount,
        };
      }
    });

    return {
      totalBagsPerItem: Array.from(itemStats.entries()).map(
        ([productId, stat]) => ({
          productId,
          productName:
            allotments.find((a) => a.productId === productId)?.productName ||
            "",
          totalBags: stat.totalBags,
        })
      ),
      totalAmountPerItem: Array.from(itemStats.entries()).map(
        ([productId, stat]) => ({
          productId,
          productName:
            allotments.find((a) => a.productId === productId)?.productName ||
            "",
          totalAmount: stat.totalAmount,
        })
      ),
      topBuyer,
    };
  },

  // Clear all data
  clearAllData: () => {
    storage.clearAll();
  },
};

// Export combined service for convenience
export const DataService = {
  farmer: FarmerService,
  buyer: BuyerService,
  product: DynamicProductService,
  patti: PattiService,
  report: ReportService,
  dashboard: NewDashboardService,
  profile: ProfileService,
  legacy: StorageService,
};
