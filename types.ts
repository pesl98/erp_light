export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  PURCHASING = 'PURCHASING',
  SUPPLIERS = 'SUPPLIERS',
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stockLevel: number;
  reorderPoint: number;
  unitPrice: number;
  supplierId: string;
  lastUpdated: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  leadTimeDays: number;
}

export enum POStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
}

export enum PRStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED'
}

export interface POItem {
  productId: string;
  quantity: number;
  unitPrice: number; // Snapshot of price at time of order
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: POStatus;
  dateCreated: string;
  dateExpected?: string;
  items: POItem[];
  totalAmount: number;
  originalRequisitionId?: string;
}

export interface PurchaseRequisition {
  id: string;
  reqNumber: string;
  suggestedSupplierId?: string;
  status: PRStatus;
  dateCreated: string;
  items: POItem[];
  reason: string;
}

// Data Context Interface
export interface ERPData {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  requisitions: PurchaseRequisition[];
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePOStatus: (id: string, status: POStatus) => void;
  seedData: (products: Product[], suppliers: Supplier[]) => void;
}

export interface AIAnalysisResult {
  summary: string;
  requisitions: PurchaseRequisition[];
}