import {
  cashMovements as demoCashMovements,
  employees as demoEmployees,
  orders as demoOrders,
  productCategories as demoProductCategories,
  products as demoProducts,
  purchases as demoPurchases,
  rawMaterials as demoRawMaterials,
  recipes as demoRecipes,
  reportPoints as demoReportPoints,
  restaurantTables as demoRestaurantTables,
  suppliers as demoSuppliers,
} from "@/lib/demo-data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CashMovement,
  Employee,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  Purchase,
  RawMaterial,
  Recipe,
  RecipeIngredient,
  ReportPoint,
  RestaurantTable,
  RoleId,
  Supplier,
  TableStatus,
} from "@/lib/types";

export type DataSourceMode = "demo" | "supabase";

export interface RestaurantSnapshot {
  source: DataSourceMode;
  loadedAt: string;
  error?: string;
  productCategories: ProductCategory[];
  products: Product[];
  tables: RestaurantTable[];
  orders: Order[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  suppliers: Supplier[];
  purchases: Purchase[];
  employees: Employee[];
  cashMovements: CashMovement[];
  reportPoints: ReportPoint[];
}

type DbTable = {
  id: string;
  number: number;
  seats: number;
  zone: string;
  status: string;
  current_order_id: string | null;
};

type DbEmployee = {
  id: string;
  full_name: string;
  role_id: string;
  shift: string | null;
  status: string | null;
};

type DbOrder = {
  id: string;
  order_number: string;
  table_id: string | null;
  waiter_id: string | null;
  cashier_id: string | null;
  status: string;
  subtotal: number | string | null;
  discount_amount: number | string | null;
  tip_amount: number | string | null;
  total_amount: number | string | null;
  payment_method: string | null;
  created_at: string;
};

type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  modifiers: unknown;
  observations: string | null;
  station: string | null;
};

type DbProductCategory = {
  id: string;
  name: string;
  color: string | null;
};

type DbProduct = {
  id: string;
  category_id: string | null;
  recipe_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  sale_price: number | string | null;
  is_available: boolean | null;
  prep_time_minutes: number | null;
  customization_options: unknown;
};

type DbSupplier = {
  id: string;
  name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  reliability_score: number | string | null;
  created_at: string;
};

type DbRawMaterial = {
  id: string;
  name: string;
  category: string;
  unit: string;
  supplier_id: string | null;
  purchase_quantity: number | string;
  purchase_cost: number | string;
  stock_quantity: number | string | null;
  min_stock_quantity: number | string | null;
  average_yield_percent: number | string | null;
  storage_temperature: string;
  storage_method: string;
  expiration_date: string | null;
  lot: string | null;
  sanitary_risk: string | null;
  storage_notes: string | null;
};

type DbRecipe = {
  id: string;
  name: string;
  category: string;
  portions: number | string;
  prep_time_minutes: number | null;
  photo_url: string | null;
  procedure: string | null;
  allergens: string[] | null;
  observations: string | null;
  target_food_cost_percent: number | string | null;
};

type DbRecipeIngredient = {
  id: string;
  recipe_id: string;
  raw_material_id: string;
  unit: string;
  gross_quantity: number | string;
  yield_percent: number | string | null;
  waste_type: string | null;
};

type DbPurchase = {
  id: string;
  supplier_id: string | null;
  document_type: string;
  document_number: string;
  purchase_date: string;
  total_amount: number | string | null;
  status: string;
};

type DbCashMovement = {
  id: string;
  movement_type: string;
  payment_method: string | null;
  amount: number | string;
  description: string | null;
  responsible_id: string | null;
  created_at: string;
};

export const demoSnapshot: RestaurantSnapshot = {
  source: "demo",
  loadedAt: new Date().toISOString(),
  productCategories: demoProductCategories,
  products: demoProducts,
  tables: demoRestaurantTables,
  orders: demoOrders,
  rawMaterials: demoRawMaterials,
  recipes: demoRecipes,
  suppliers: demoSuppliers,
  purchases: demoPurchases,
  employees: demoEmployees,
  cashMovements: demoCashMovements,
  reportPoints: demoReportPoints,
};

export async function loadRestaurantSnapshot(): Promise<RestaurantSnapshot> {
  if (!isSupabaseConfigured()) {
    return demoSnapshot;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const [
      tablesResult,
      employeesResult,
      ordersResult,
      orderItemsResult,
      categoriesResult,
      productsResult,
      suppliersResult,
      rawMaterialsResult,
      recipesResult,
      recipeIngredientsResult,
      purchasesResult,
      cashMovementsResult,
    ] = await Promise.all([
      supabase.from("tables").select("*").order("number"),
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*").order("created_at"),
      supabase.from("product_categories").select("*").order("sort_order"),
      supabase.from("products").select("*").order("name"),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("raw_materials").select("*").order("name"),
      supabase.from("recipes").select("*").order("name"),
      supabase.from("recipe_ingredients").select("*").order("created_at"),
      supabase.from("purchases").select("*").order("purchase_date", {
        ascending: false,
      }),
      supabase.from("cash_movements").select("*").order("created_at", {
        ascending: false,
      }),
    ]);

    const firstError = [
      tablesResult.error,
      employeesResult.error,
      ordersResult.error,
      orderItemsResult.error,
      categoriesResult.error,
      productsResult.error,
      suppliersResult.error,
      rawMaterialsResult.error,
      recipesResult.error,
      recipeIngredientsResult.error,
      purchasesResult.error,
      cashMovementsResult.error,
    ].find(Boolean);

    if (firstError) {
      return withFallbackError(firstError.message);
    }

    const employees = mapEmployees((employeesResult.data ?? []) as DbEmployee[]);
    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
    const tables = mapTables((tablesResult.data ?? []) as DbTable[]);
    const tableById = new Map(tables.map((table) => [table.id, table]));
    const productCategories = mapProductCategories(
      (categoriesResult.data ?? []) as DbProductCategory[],
    );
    const products = mapProducts((productsResult.data ?? []) as DbProduct[]);
    const suppliers = mapSuppliers((suppliersResult.data ?? []) as DbSupplier[]);
    const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
    const rawMaterials = mapRawMaterials(
      (rawMaterialsResult.data ?? []) as DbRawMaterial[],
    );
    const rawMaterialById = new Map(rawMaterials.map((material) => [material.id, material]));
    const recipes = mapRecipes(
      (recipesResult.data ?? []) as DbRecipe[],
      (recipeIngredientsResult.data ?? []) as DbRecipeIngredient[],
      rawMaterialById,
      products,
    );
    const orders = mapOrders(
      (ordersResult.data ?? []) as DbOrder[],
      (orderItemsResult.data ?? []) as DbOrderItem[],
      tableById,
      employeeById,
    );
    const tablesWithOrders = tables.map((table) => {
      const currentOrder = orders.find(
        (order) =>
          order.tableNumber === table.number &&
          !["delivered", "cancelled"].includes(order.status),
      );

      return {
        ...table,
        currentOrderId: currentOrder?.id ?? table.currentOrderId,
        status: currentOrder ? "occupied" : table.status,
        server: currentOrder?.waiter ?? table.server,
        elapsedMinutes: currentOrder ? getElapsedMinutes(currentOrder.createdAt) : undefined,
        total: currentOrder?.total,
      };
    });

    const purchases = mapPurchases(
      (purchasesResult.data ?? []) as DbPurchase[],
      supplierById,
    );
    const cashMovements = mapCashMovements(
      (cashMovementsResult.data ?? []) as DbCashMovement[],
      employeeById,
    );

    return {
      source: "supabase",
      loadedAt: new Date().toISOString(),
      productCategories: productCategories.length
        ? productCategories
        : demoProductCategories,
      products: products.length ? products : demoProducts,
      tables: tablesWithOrders.length ? tablesWithOrders : demoRestaurantTables,
      orders: orders.length ? orders : demoOrders,
      rawMaterials: rawMaterials.length ? rawMaterials : demoRawMaterials,
      recipes: recipes.length ? recipes : demoRecipes,
      suppliers: suppliers.length ? suppliers : demoSuppliers,
      purchases: purchases.length ? purchases : demoPurchases,
      employees: employees.length ? employees : demoEmployees,
      cashMovements: cashMovements.length ? cashMovements : demoCashMovements,
      reportPoints: buildReportPoints(orders),
    };
  } catch (error) {
    return withFallbackError(error instanceof Error ? error.message : "Error desconocido");
  }
}

function withFallbackError(error: string): RestaurantSnapshot {
  return {
    ...demoSnapshot,
    loadedAt: new Date().toISOString(),
    error,
  };
}

function mapTables(rows: DbTable[]): RestaurantTable[] {
  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    seats: row.seats,
    zone: row.zone,
    status: toTableStatus(row.status),
    server: "Sin asignar",
    currentOrderId: row.current_order_id ?? undefined,
  }));
}

function mapEmployees(rows: DbEmployee[]): Employee[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    role: toRoleId(row.role_id),
    shift: row.shift ?? "Sin turno",
    status: row.status === "break" ? "break" : row.status === "offline" ? "offline" : "active",
    sales: 0,
    orders: 0,
  }));
}

function mapOrders(
  rows: DbOrder[],
  itemRows: DbOrderItem[],
  tableById: Map<string, RestaurantTable>,
  employeeById: Map<string, Employee>,
): Order[] {
  const itemsByOrder = groupBy(itemRows, (item) => item.order_id);

  return rows.map((row) => {
    const table = row.table_id ? tableById.get(row.table_id) : undefined;
    const waiter = row.waiter_id ? employeeById.get(row.waiter_id) : undefined;
    const items = (itemsByOrder.get(row.id) ?? []).map(mapOrderItem);

    return {
      id: row.id,
      number: row.order_number,
      tableNumber: table?.number ?? 0,
      status: toOrderStatus(row.status),
      waiter: waiter?.name ?? "Sin asignar",
      createdAt: row.created_at,
      items,
      discount: toNumber(row.discount_amount),
      tip: toNumber(row.tip_amount),
      paymentMethod: toPaymentMethod(row.payment_method),
      total:
        toNumber(row.total_amount) ||
        items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
    };
  });
}

function mapOrderItem(row: DbOrderItem): Order["items"][number] {
  return {
    id: row.id,
    productId: row.product_id ?? "unknown",
    productName: row.product_name,
    quantity: toNumber(row.quantity) || 1,
    unitPrice: toNumber(row.unit_price),
    modifiers: toStringArray(row.modifiers),
    notes: row.observations ?? undefined,
    station: row.station === "cold" || row.station === "bar" || row.station === "pastry" ? row.station : "hot",
  };
}

function mapProductCategories(rows: DbProductCategory[]): ProductCategory[] {
  return rows.map((row, index) => ({
    id: row.id,
    name: row.name,
    color: row.color || fallbackCategoryColors[index % fallbackCategoryColors.length],
  }));
}

function mapProducts(rows: DbProduct[]): Product[] {
  return rows.map((row, index) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? "uncategorized",
    description: row.description ?? "",
    image: row.image_url || demoProducts[index % demoProducts.length]?.image || "",
    price: toNumber(row.sale_price),
    available: row.is_available ?? true,
    prepTimeMinutes: row.prep_time_minutes ?? 0,
    recipeId: row.recipe_id ?? undefined,
    modifiers: toStringArray(row.customization_options),
  }));
}

function mapSuppliers(rows: DbSupplier[]): Supplier[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    contact: row.contact_name ?? "Sin contacto",
    phone: row.phone ?? "Sin telefono",
    reliability: toNumber(row.reliability_score) || 100,
    lastPurchase: row.created_at.slice(0, 10),
  }));
}

function mapRawMaterials(rows: DbRawMaterial[]): RawMaterial[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: isInventoryCategory(row.category) ? row.category : "dry",
    unit: isUnit(row.unit) ? row.unit : "unit",
    purchaseQuantity: toNumber(row.purchase_quantity),
    purchaseCost: toNumber(row.purchase_cost),
    stock: toNumber(row.stock_quantity),
    minStock: toNumber(row.min_stock_quantity),
    supplierId: row.supplier_id ?? "",
    averageYield: toNumber(row.average_yield_percent) || 100,
    storageTemperature: row.storage_temperature,
    storageMethod: row.storage_method === "LIFO" ? "LIFO" : "FIFO",
    expirationDate: row.expiration_date ?? "",
    sanitaryRisk:
      row.sanitary_risk === "medium" || row.sanitary_risk === "high"
        ? row.sanitary_risk
        : "low",
    lot: row.lot ?? "",
    storageNotes: row.storage_notes ?? "",
  }));
}

function mapRecipes(
  rows: DbRecipe[],
  ingredientRows: DbRecipeIngredient[],
  rawMaterialById: Map<string, RawMaterial>,
  products: Product[],
): Recipe[] {
  const ingredientsByRecipe = groupBy(ingredientRows, (ingredient) => ingredient.recipe_id);

  return rows.map((row, index) => {
    const product = products.find((item) => item.recipeId === row.id);

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      image: row.photo_url || product?.image || demoRecipes[index % demoRecipes.length]?.image || "",
      portions: toNumber(row.portions) || 1,
      prepTimeMinutes: row.prep_time_minutes ?? 0,
      allergens: row.allergens ?? [],
      procedure: row.procedure ?? "",
      observations: row.observations ?? "",
      targetFoodCostPercent: toNumber(row.target_food_cost_percent) || 30,
      salePrice: product?.price ?? 0,
      ingredients: (ingredientsByRecipe.get(row.id) ?? []).map((ingredient) =>
        mapRecipeIngredient(ingredient, rawMaterialById),
      ),
    };
  });
}

function mapRecipeIngredient(
  row: DbRecipeIngredient,
  rawMaterialById: Map<string, RawMaterial>,
): RecipeIngredient {
  const material = rawMaterialById.get(row.raw_material_id);

  return {
    id: row.id,
    rawMaterialId: row.raw_material_id,
    name: material?.name ?? "Ingrediente",
    unit: isUnit(row.unit) ? row.unit : material?.unit ?? "unit",
    grossQuantity: toNumber(row.gross_quantity),
    yieldPercent: toNumber(row.yield_percent) || 100,
    wasteType: row.waste_type ?? "Sin merma",
  };
}

function mapPurchases(
  rows: DbPurchase[],
  supplierById: Map<string, Supplier>,
): Purchase[] {
  return rows.map((row) => {
    const supplier = row.supplier_id ? supplierById.get(row.supplier_id) : undefined;

    return {
      id: row.id,
      supplierId: row.supplier_id ?? "",
      supplierName: supplier?.name ?? "Proveedor sin registro",
      documentType: row.document_type === "receipt" ? "receipt" : "invoice",
      documentNumber: row.document_number,
      date: row.purchase_date,
      total: toNumber(row.total_amount),
      status:
        row.status === "received" || row.status === "priced" ? row.status : "draft",
    };
  });
}

function mapCashMovements(
  rows: DbCashMovement[],
  employeeById: Map<string, Employee>,
): CashMovement[] {
  return rows.map((row) => {
    const responsible = row.responsible_id
      ? employeeById.get(row.responsible_id)
      : undefined;

    return {
      id: row.id,
      type: isCashMovementType(row.movement_type) ? row.movement_type : "sale",
      description: row.description ?? "Movimiento de caja",
      method: toPaymentMethod(row.payment_method) ?? "internal",
      amount: toNumber(row.amount),
      time: new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.created_at)),
      responsible: responsible?.name ?? "Sin responsable",
    };
  });
}

function buildReportPoints(orders: Order[]): ReportPoint[] {
  if (!orders.length) {
    return demoReportPoints;
  }

  const labels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const points = labels.map((label) => ({
    label,
    sales: 0,
    foodCost: 0,
    margin: 0,
    orders: 0,
  }));

  orders.forEach((order) => {
    const index = (new Date(order.createdAt).getDay() + 6) % 7;
    points[index].sales += order.total;
    points[index].foodCost += order.total * 0.31;
    points[index].margin += order.total * 0.69;
    points[index].orders += 1;
  });

  return points;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function toTableStatus(value: string): TableStatus {
  return value === "occupied" ||
    value === "reserved" ||
    value === "cleaning" ||
    value === "free"
    ? value
    : "free";
}

function toOrderStatus(value: string): OrderStatus {
  if (
    value === "pending" ||
    value === "preparing" ||
    value === "ready" ||
    value === "delivered" ||
    value === "cancelled"
  ) {
    return value;
  }

  return value === "paid" ? "delivered" : "pending";
}

function toRoleId(value: string): RoleId {
  return value === "supervisor" ||
    value === "cashier" ||
    value === "waiter" ||
    value === "cook" ||
    value === "chef" ||
    value === "warehouse"
    ? value
    : "administrator";
}

function toPaymentMethod(value: string | null): PaymentMethod | undefined {
  return value === "cash" ||
    value === "debit" ||
    value === "credit" ||
    value === "transfer"
    ? value
    : undefined;
}

function isInventoryCategory(value: string): value is RawMaterial["category"] {
  return [
    "meats",
    "seafood",
    "produce",
    "dairy",
    "dry",
    "frozen",
    "ready",
    "allergens",
  ].includes(value);
}

function isUnit(value: string): value is RawMaterial["unit"] {
  return ["g", "kg", "ml", "l", "unit"].includes(value);
}

function isCashMovementType(value: string): value is CashMovement["type"] {
  return [
    "opening",
    "sale",
    "withdrawal",
    "advance",
    "tip",
    "difference",
  ].includes(value);
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  items.forEach((item) => {
    const key = getKey(item);
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  });

  return grouped;
}

function getElapsedMinutes(createdAt: string) {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.round(elapsed / 60000));
}

const fallbackCategoryColors = [
  "bg-red-500",
  "bg-emerald-500",
  "bg-fuchsia-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-violet-500",
];

