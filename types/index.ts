// Legacy types - maintained for backward compatibility
export interface AllotmentRecord {
  id: string;
  date: string;
  farmerName: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  bagQuantity: number;
  weight: number;
  rate: number;
  totalAmount: number;
}

export interface Customer {
  label: string;
  value: string;
}

export interface Product {
  label: string;
  value: string;
}

export interface CustomerReport {
  customerId: string;
  customerName: string;
  totalItems: number;
  totalBags: number;
  totalAmount: number;
  itemsPurchased: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
}

export interface ItemReport {
  productId: string;
  productName: string;
  totalCustomers: number;
  totalBags: number;
  totalAmount: number;
  customers: {
    customerId: string;
    customerName: string;
    quantity: number;
  }[];
}

export interface DashboardStats {
  totalBagsPerItem: {
    productId: string;
    productName: string;
    totalBags: number;
  }[];
  totalAmountPerItem: {
    productId: string;
    productName: string;
    totalAmount: number;
  }[];
  topBuyer: {
    customerId: string;
    customerName: string;
    totalAmount: number;
  };
}

// ============== NEW DATA MODEL ==============

// Individual buyer purchase within a product
export interface BuyerPurchase {
  id: string;
  buyerName: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  timestamp: number;
}

// Product within a patti with stock tracking
export interface PattiProduct {
  productId: string;
  productName: string;
  totalQuantity: number;       // Initial stock
  remainingQuantity: number;   // Available stock
  weight: number;
  rate: number;
  totalAmount: number;         // Calculated: totalQuantity * weight * rate
  purchases: BuyerPurchase[];
}

// Patti (Bill) - Main record structure
export interface PattiRecord {
  id: string;
  date: string;
  farmerId: string;
  farmerName: string;
  products: PattiProduct[];
  // Expenses and calculations
  commissionPercentage: number;
  commissionAmount: number;    // (Total Patti Amount * Commission %) / 100
  hamalliPerBag: number;
  hamalliAmount: number;       // hamalliPerBag * total bags
  lorryAmount: number;
  cashAmount: number;
  otherExpenses: number;
  totalPattiAmount: number;    // Sum of all product sales
  totalDeductions: number;     // Sum of all expenses
  finalPayableAmount: number;  // totalPattiAmount - totalDeductions
  isClosed: boolean;           // Whether patti is finalized
  createdAt: number;
  updatedAt: number;
}

// Farmer entity
export interface Farmer {
  id: string;
  name: string;
  createdAt: number;
}

// Buyer entity (for tracking unique buyers)
export interface Buyer {
  id: string;
  name: string;
  createdAt: number;
}

// ============== REPORT TYPES ==============

// Farmer-wise report
export interface FarmerReport {
  farmerId: string;
  farmerName: string;
  totalPattis: number;
  totalProducts: number;
  totalBags: number;
  totalSales: number;
  totalCommission: number;
  totalPayable: number;
  outstandingAmount: number;
  pattis: {
    pattiId: string;
    date: string;
    products: {
      productName: string;
      quantity: number;
      rate: number;
      amount: number;
      buyers: string[];
    }[];
    totalAmount: number;
    deductions: number;
    finalPayable: number;
  }[];
}

// Buyer-wise report
export interface BuyerReport {
  buyerId: string;
  buyerName: string;
  totalPurchases: number;
  totalBags: number;
  totalAmount: number;
  purchases: {
    date: string;
    farmerName: string;
    productName: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

// Daily summary report
export interface DailySummary {
  date: string;
  totalPattis: number;
  totalFarmers: number;
  totalBuyers: number;
  totalBags: number;
  totalSales: number;
  totalCommission: number;
  totalHamalli: number;
  totalLorry: number;
  totalCash: number;
  totalOtherExpenses: number;
  products: {
    productId: string;
    productName: string;
    totalQuantity: number;
  }[];
}

// Commission report
export interface CommissionReport {
  totalCommission: number;
  pattisWithCommission: {
    pattiId: string;
    date: string;
    farmerName: string;
    pattiAmount: number;
    commissionPercentage: number;
    commissionAmount: number;
  }[];
}

// Product-wise sales report
export interface ProductSalesReport {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
  totalTransactions: number;
  farmerBreakdown: {
    farmerId: string;
    farmerName: string;
    quantity: number;
    amount: number;
  }[];
}

// Updated dashboard stats
export interface NewDashboardStats {
  totalFarmers: number;
  totalBuyers: number;
  totalPattis: number;
  totalProducts: number;
  totalBags: number;
  totalSales: number;
  totalCommission: number;
  todayStats: {
    pattis: number;
    sales: number;
    commission: number;
  };
  topFarmers: {
    farmerId: string;
    farmerName: string;
    totalSales: number;
  }[];
  topBuyers: {
    buyerId: string;
    buyerName: string;
    totalBags: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    totalQuantity: number;
  }[];
}

// Profile/Settings type for defaults
export interface AppProfile {
  defaultCommissionPercentage: number;
  defaultHamalliPerBag: number;
  defaultLorryAmount: number;
  defaultCashAmount: number;
  defaultOtherExpenses: number;
}
