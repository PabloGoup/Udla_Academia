export type RoleId =
  | "master"
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
  | "crm:manage"
  | "documents:manage"
  | "reports:read"
  | "food-safety:manage"
  | "employees:manage"
  | "audit:read"
  | "settings:manage"
  | "education:read";

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
  | "crm"
  | "documents"
  | "reports"
  | "foodSafety"
  | "employees"
  | "audit"
  | "settings"
  | "education";

export type TableStatus = "free" | "occupied" | "reserved" | "cleaning";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "paid"
  | "cancelled";

export type PaymentMethod = "cash" | "debit" | "credit" | "transfer";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

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
  userId?: string;
  name: string;
  role: RoleId;
  rut: string;
  phone: string;
  shift: string;
  hourlyCost: number;
  status: "active" | "break" | "offline";
  hiredAt?: string;
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

export type InventoryMovementType =
  | "initial"
  | "purchase"
  | "sale"
  | "manual_out"
  | "adjustment"
  | "waste";

export interface InventoryMovement {
  id: string;
  rawMaterialId: string;
  materialName: string;
  type: InventoryMovementType;
  quantity: number;
  unitCost: number;
  reason: string;
  responsible: string;
  time: string;
  createdAt: string;
}

export type FoodSafetyResult = "ok" | "warning" | "critical";

export interface FoodSafetyLog {
  id: string;
  rawMaterialId: string;
  materialName: string;
  checkType: string;
  measuredTemperature: string;
  result: FoodSafetyResult;
  notes: string;
  responsible: string;
  time: string;
  createdAt: string;
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
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  rawMaterialId: string;
  materialName: string;
  description: string;
  quantity: number;
  unit: RawMaterial["unit"];
  unitCost: number;
  yieldPercent: number;
  totalCost: number;
  expirationDate?: string;
  lot?: string;
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

export interface CashRegister {
  id: string;
  openingAmount: number;
  expectedAmount: number;
  countedAmount?: number;
  differenceAmount?: number;
  status: "open" | "closed";
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  documentId: string;
  preferences: string;
  allergies: string[];
  tags: string[];
  visitCount: number;
  totalSpent: number;
  lastVisitAt?: string;
  notes: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  tableId?: string;
  tableNumber?: number;
  partySize: number;
  date: string;
  time: string;
  status: ReservationStatus;
  channel: "phone" | "whatsapp" | "web" | "walk_in";
  occasion: string;
  notes: string;
  assignedTo?: string;
  createdAt: string;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  customerName: string;
  type: "note" | "call" | "message" | "complaint" | "preference" | "follow_up";
  summary: string;
  dueAt?: string;
  completedAt?: string;
  responsible: string;
  createdAt: string;
}

export type OperationalDocumentType =
  | "kitchen_ticket"
  | "table_prebill"
  | "payment_receipt"
  | "cash_close"
  | "reservation_sheet";

export interface OperationalDocument {
  id: string;
  type: OperationalDocumentType;
  title: string;
  orderId?: string;
  orderNumber?: string;
  cashRegisterId?: string;
  reservationId?: string;
  payload: Record<string, unknown>;
  printedBy: string;
  printedAt: string;
  createdAt: string;
}

export interface DocumentSeriesSetting {
  type: OperationalDocumentType;
  prefix: string;
  nextNumber: number;
  enabled: boolean;
}

export interface PrintStationSetting {
  id: string;
  name: string;
  area: "hot" | "cold" | "bar" | "pastry" | "cash" | "salon";
  printerName: string;
  autoPrint: boolean;
}

export interface OperatingHourSetting {
  day: string;
  open: string;
  close: string;
  enabled: boolean;
}

export interface TableZoneSetting {
  name: string;
  capacity: number;
  color: string;
  active: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  academyName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  locale: string;
  logoUrl: string;
  serviceChargePercent: number;
  taxPercent: number;
  operatingHours: OperatingHourSetting[];
  documentSeries: DocumentSeriesSetting[];
  printStations: PrintStationSetting[];
  tableZones: TableZoneSetting[];
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  actor: string;
  actorRole?: RoleId;
  metadata: Record<string, unknown>;
  time: string;
  createdAt: string;
}

export interface ReportPoint {
  label: string;
  sales: number;
  foodCost: number;
  margin: number;
  orders: number;
}
