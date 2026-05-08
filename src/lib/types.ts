export type RoleId =
  | "administrator"
  | "supervisor"
  | "cashier"
  | "waiter"
  | "cook"
  | "chef"
  | "warehouse";

export type Permission =
  | "dashboard:read"
  | "tables:manage"
  | "orders:manage"
  | "kitchen:manage"
  | "cash:manage"
  | "products:manage"
  | "recipes:manage"
  | "inventory:manage"
  | "purchases:manage"
  | "reports:read"
  | "food-safety:manage"
  | "employees:manage"
  | "education:read"
  | "architecture:read";

export type ModuleId =
  | "dashboard"
  | "tables"
  | "orders"
  | "kitchen"
  | "cash"
  | "products"
  | "recipes"
  | "inventory"
  | "purchases"
  | "reports"
  | "foodSafety"
  | "employees"
  | "education"
  | "architecture";

export type TableStatus = "free" | "occupied" | "reserved" | "cleaning";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "debit" | "credit" | "transfer";

export type InventoryCategory =
  | "meats"
  | "seafood"
  | "produce"
  | "dairy"
  | "dry"
  | "frozen"
  | "ready"
  | "allergens";

export type StorageMethod = "FIFO" | "LIFO";

export interface RoleProfile {
  id: RoleId;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface Employee {
  id: string;
  name: string;
  role: RoleId;
  shift: string;
  status: "active" | "break" | "offline";
  sales: number;
  orders: number;
  kitchenAverage?: number;
}

export interface RestaurantTable {
  id: string;
  number: number;
  seats: number;
  zone: string;
  status: TableStatus;
  server: string;
  currentOrderId?: string;
  elapsedMinutes?: number;
  total?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  image: string;
  price: number;
  available: boolean;
  prepTimeMinutes: number;
  recipeId?: string;
  modifiers: string[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  modifiers: string[];
  notes?: string;
  station: "hot" | "cold" | "bar" | "pastry";
}

export interface Order {
  id: string;
  number: string;
  tableNumber: number;
  status: OrderStatus;
  waiter: string;
  createdAt: string;
  items: OrderItem[];
  discount: number;
  tip: number;
  paymentMethod?: PaymentMethod;
  total: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: "g" | "kg" | "ml" | "l" | "unit";
  purchaseQuantity: number;
  purchaseCost: number;
  stock: number;
  minStock: number;
  supplierId: string;
  averageYield: number;
  storageTemperature: string;
  storageMethod: StorageMethod;
  expirationDate: string;
  sanitaryRisk: "low" | "medium" | "high";
  lot: string;
  storageNotes: string;
}

export interface RecipeIngredient {
  id: string;
  rawMaterialId: string;
  name: string;
  unit: RawMaterial["unit"];
  grossQuantity: number;
  yieldPercent: number;
  wasteType: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  image: string;
  portions: number;
  prepTimeMinutes: number;
  allergens: string[];
  procedure: string;
  observations: string;
  targetFoodCostPercent: number;
  salePrice: number;
  ingredients: RecipeIngredient[];
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  reliability: number;
  lastPurchase: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  documentType: "invoice" | "receipt";
  documentNumber: string;
  date: string;
  total: number;
  status: "draft" | "received" | "priced";
}

export interface CashMovement {
  id: string;
  type: "opening" | "sale" | "withdrawal" | "advance" | "tip" | "difference";
  description: string;
  method: PaymentMethod | "internal";
  amount: number;
  time: string;
  responsible: string;
}

export interface ReportPoint {
  label: string;
  sales: number;
  foodCost: number;
  margin: number;
  orders: number;
}

