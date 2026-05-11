import {
  auditLogs as demoAuditLogs,
  cashRegisters as demoCashRegisters,
  cashMovements as demoCashMovements,
  customerInteractions as demoCustomerInteractions,
  customers as demoCustomers,
  employees as demoEmployees,
  foodSafetyLogs as demoFoodSafetyLogs,
  inventoryMovements as demoInventoryMovements,
  orders as demoOrders,
  productCategories as demoProductCategories,
  products as demoProducts,
  purchaseItems as demoPurchaseItems,
  purchases as demoPurchases,
  rawMaterials as demoRawMaterials,
  recipes as demoRecipes,
  reservations as demoReservations,
  reportPoints as demoReportPoints,
  restaurantTables as demoRestaurantTables,
  suppliers as demoSuppliers,
} from "@/lib/demo-data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AuditLog,
  CashMovement,
  CashRegister,
  Customer,
  CustomerInteraction,
  Employee,
  FoodSafetyLog,
  InventoryMovement,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  Purchase,
  PurchaseItem,
  RawMaterial,
  Recipe,
  RecipeIngredient,
  Reservation,
  ReservationStatus,
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
  purchaseItems: PurchaseItem[];
  employees: Employee[];
  cashMovements: CashMovement[];
  cashRegisters: CashRegister[];
  inventoryMovements: InventoryMovement[];
  foodSafetyLogs: FoodSafetyLog[];
  customers: Customer[];
  reservations: Reservation[];
  customerInteractions: CustomerInteraction[];
  auditLogs: AuditLog[];
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
  user_id: string | null;
  full_name: string;
  role_id: string;
  rut: string | null;
  phone: string | null;
  shift: string | null;
  hourly_cost: number | string | null;
  status: string | null;
  hired_at: string | null;
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
  reference_sale_price: number | string | null;
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

type DbPurchaseItem = {
  id: string;
  purchase_id: string;
  raw_material_id: string | null;
  description: string;
  quantity: number | string;
  unit: string;
  unit_cost: number | string | null;
  yield_percent: number | string | null;
  expiration_date: string | null;
  lot: string | null;
  total_cost: number | string | null;
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

type DbCashRegister = {
  id: string;
  opened_by: string | null;
  closed_by: string | null;
  opening_amount: number | string | null;
  expected_amount: number | string | null;
  counted_amount: number | string | null;
  difference_amount: number | string | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  notes: string | null;
};

type DbInventoryMovement = {
  id: string;
  raw_material_id: string;
  movement_type: string;
  quantity: number | string;
  unit_cost: number | string | null;
  reason: string | null;
  responsible_id: string | null;
  created_at: string;
};

type DbFoodSafetyLog = {
  id: string;
  raw_material_id: string | null;
  check_type: string;
  measured_temperature: string | null;
  result: string | null;
  notes: string | null;
  responsible_id: string | null;
  created_at: string;
};

type DbCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  document_id: string | null;
  preferences: string | null;
  allergies: string[] | null;
  tags: string[] | null;
  visit_count: number | string | null;
  total_spent: number | string | null;
  last_visit_at: string | null;
  notes: string | null;
  created_at: string;
};

type DbReservation = {
  id: string;
  customer_id: string | null;
  table_id: string | null;
  party_size: number | string | null;
  reservation_date: string;
  reservation_time: string;
  status: string;
  channel: string | null;
  occasion: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
};

type DbCustomerInteraction = {
  id: string;
  customer_id: string;
  interaction_type: string;
  summary: string;
  due_at: string | null;
  completed_at: string | null;
  responsible_id: string | null;
  created_at: string;
};

type DbAuditLog = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  metadata: unknown;
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
  purchaseItems: demoPurchaseItems,
  employees: demoEmployees,
  cashMovements: demoCashMovements,
  cashRegisters: demoCashRegisters,
  inventoryMovements: demoInventoryMovements,
  foodSafetyLogs: demoFoodSafetyLogs,
  customers: demoCustomers,
  reservations: demoReservations,
  customerInteractions: demoCustomerInteractions,
  auditLogs: demoAuditLogs,
  reportPoints: demoReportPoints,
};

export async function loadRestaurantSnapshot(): Promise<RestaurantSnapshot> {
  if (!isSupabaseConfigured()) {
    return demoSnapshot;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    const shouldLoadAuthenticatedTables = Boolean(authData.user);
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
      purchaseItemsResult,
      cashMovementsResult,
      cashRegistersResult,
      inventoryMovementsResult,
      foodSafetyLogsResult,
      customersResult,
      reservationsResult,
      customerInteractionsResult,
      auditLogsResult,
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
      supabase.from("purchase_items").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("cash_movements").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("cash_registers").select("*").order("opened_at", {
        ascending: false,
      }),
      supabase.from("inventory_movements").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("food_safety_logs").select("*").order("created_at", {
        ascending: false,
      }),
      shouldLoadAuthenticatedTables
        ? supabase.from("customers").select("*").order("full_name")
        : Promise.resolve({ data: [], error: null }),
      shouldLoadAuthenticatedTables
        ? supabase
            .from("reservations")
            .select("*")
            .order("reservation_date", { ascending: true })
            .order("reservation_time", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      shouldLoadAuthenticatedTables
        ? supabase
            .from("customer_interactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(80)
        : Promise.resolve({ data: [], error: null }),
      shouldLoadAuthenticatedTables
        ? supabase
            .from("audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(80)
        : Promise.resolve({ data: [], error: null }),
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
      purchaseItemsResult.error,
      cashMovementsResult.error,
      cashRegistersResult.error,
      inventoryMovementsResult.error,
      foodSafetyLogsResult.error,
      customersResult.error,
      reservationsResult.error,
      customerInteractionsResult.error,
      auditLogsResult.error,
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
          !["paid", "cancelled"].includes(order.status),
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

    const purchaseItems = mapPurchaseItems(
      (purchaseItemsResult.data ?? []) as DbPurchaseItem[],
      rawMaterialById,
    );
    const purchases = mapPurchases(
      (purchasesResult.data ?? []) as DbPurchase[],
      supplierById,
      purchaseItems,
    );
    const cashMovements = mapCashMovements(
      (cashMovementsResult.data ?? []) as DbCashMovement[],
      employeeById,
    );
    const cashRegisters = mapCashRegisters(
      (cashRegistersResult.data ?? []) as DbCashRegister[],
      employeeById,
    );
    const inventoryMovements = mapInventoryMovements(
      (inventoryMovementsResult.data ?? []) as DbInventoryMovement[],
      rawMaterialById,
      employeeById,
    );
    const foodSafetyLogs = mapFoodSafetyLogs(
      (foodSafetyLogsResult.data ?? []) as DbFoodSafetyLog[],
      rawMaterialById,
      employeeById,
    );
    const customers = mapCustomers((customersResult.data ?? []) as DbCustomer[]);
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));
    const reservations = mapReservations(
      (reservationsResult.data ?? []) as DbReservation[],
      customerById,
      tableById,
      employeeById,
    );
    const customerInteractions = mapCustomerInteractions(
      (customerInteractionsResult.data ?? []) as DbCustomerInteraction[],
      customerById,
      employeeById,
    );
    const auditLogs = mapAuditLogs(
      (auditLogsResult.data ?? []) as DbAuditLog[],
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
      purchaseItems: purchaseItems.length ? purchaseItems : demoPurchaseItems,
      employees: employees.length ? employees : demoEmployees,
      cashMovements: cashMovements.length ? cashMovements : demoCashMovements,
      cashRegisters: cashRegisters.length ? cashRegisters : demoCashRegisters,
      inventoryMovements: inventoryMovements.length
        ? inventoryMovements
        : demoInventoryMovements,
      foodSafetyLogs: foodSafetyLogs.length ? foodSafetyLogs : demoFoodSafetyLogs,
      customers: customers.length ? customers : demoCustomers,
      reservations: reservations.length ? reservations : demoReservations,
      customerInteractions: customerInteractions.length
        ? customerInteractions
        : demoCustomerInteractions,
      auditLogs: auditLogs.length ? auditLogs : demoAuditLogs,
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
    userId: row.user_id ?? undefined,
    name: row.full_name,
    role: toRoleId(row.role_id),
    rut: row.rut ?? "",
    phone: row.phone ?? "",
    shift: row.shift ?? "Sin turno",
    hourlyCost: toNumber(row.hourly_cost),
    status: row.status === "break" ? "break" : row.status === "offline" ? "offline" : "active",
    hiredAt: row.hired_at ?? undefined,
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
      salePrice: product?.price ?? toNumber(row.reference_sale_price),
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
  purchaseItems: PurchaseItem[],
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
      items: purchaseItems.filter((item) => item.purchaseId === row.id),
    };
  });
}

function mapPurchaseItems(
  rows: DbPurchaseItem[],
  rawMaterialById: Map<string, RawMaterial>,
): PurchaseItem[] {
  return rows.map((row) => {
    const material = row.raw_material_id
      ? rawMaterialById.get(row.raw_material_id)
      : undefined;

    return {
      id: row.id,
      purchaseId: row.purchase_id,
      rawMaterialId: row.raw_material_id ?? "",
      materialName: material?.name ?? row.description,
      description: row.description,
      quantity: toNumber(row.quantity),
      unit: isUnit(row.unit) ? row.unit : material?.unit ?? "unit",
      unitCost: toNumber(row.unit_cost),
      yieldPercent: toNumber(row.yield_percent) || 100,
      totalCost: toNumber(row.total_cost) || toNumber(row.quantity) * toNumber(row.unit_cost),
      expirationDate: row.expiration_date ?? undefined,
      lot: row.lot ?? undefined,
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

function mapCashRegisters(
  rows: DbCashRegister[],
  employeeById: Map<string, Employee>,
): CashRegister[] {
  return rows.map((row) => {
    const openedBy = row.opened_by ? employeeById.get(row.opened_by) : undefined;
    const closedBy = row.closed_by ? employeeById.get(row.closed_by) : undefined;

    return {
      id: row.id,
      openingAmount: toNumber(row.opening_amount),
      expectedAmount: toNumber(row.expected_amount),
      countedAmount:
        row.counted_amount === null ? undefined : toNumber(row.counted_amount),
      differenceAmount:
        row.difference_amount === null
          ? undefined
          : toNumber(row.difference_amount),
      status: row.status === "closed" ? "closed" : "open",
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? undefined,
      openedBy: openedBy?.name ?? "Sin responsable",
      closedBy: closedBy?.name,
      notes: row.notes ?? undefined,
    };
  });
}

function mapInventoryMovements(
  rows: DbInventoryMovement[],
  rawMaterialById: Map<string, RawMaterial>,
  employeeById: Map<string, Employee>,
): InventoryMovement[] {
  return rows.map((row) => {
    const material = rawMaterialById.get(row.raw_material_id);
    const responsible = row.responsible_id
      ? employeeById.get(row.responsible_id)
      : undefined;

    return {
      id: row.id,
      rawMaterialId: row.raw_material_id,
      materialName: material?.name ?? "Materia prima",
      type: toInventoryMovementType(row.movement_type),
      quantity: toNumber(row.quantity),
      unitCost: toNumber(row.unit_cost),
      reason: row.reason ?? "Movimiento de inventario",
      responsible: responsible?.name ?? "Sin responsable",
      time: new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.created_at)),
      createdAt: row.created_at,
    };
  });
}

function mapFoodSafetyLogs(
  rows: DbFoodSafetyLog[],
  rawMaterialById: Map<string, RawMaterial>,
  employeeById: Map<string, Employee>,
): FoodSafetyLog[] {
  return rows.map((row) => {
    const material = row.raw_material_id
      ? rawMaterialById.get(row.raw_material_id)
      : undefined;
    const responsible = row.responsible_id
      ? employeeById.get(row.responsible_id)
      : undefined;

    return {
      id: row.id,
      rawMaterialId: row.raw_material_id ?? "",
      materialName: material?.name ?? "Materia prima",
      checkType: row.check_type,
      measuredTemperature: row.measured_temperature ?? "Sin medicion",
      result: toFoodSafetyResult(row.result),
      notes: row.notes ?? "",
      responsible: responsible?.name ?? "Sin responsable",
      time: new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.created_at)),
      createdAt: row.created_at,
    };
  });
}

function mapCustomers(rows: DbCustomer[]): Customer[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    documentId: row.document_id ?? "",
    preferences: row.preferences ?? "",
    allergies: row.allergies ?? [],
    tags: row.tags ?? [],
    visitCount: toNumber(row.visit_count),
    totalSpent: toNumber(row.total_spent),
    lastVisitAt: row.last_visit_at ?? undefined,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  }));
}

function mapReservations(
  rows: DbReservation[],
  customerById: Map<string, Customer>,
  tableById: Map<string, RestaurantTable>,
  employeeById: Map<string, Employee>,
): Reservation[] {
  return rows.map((row) => {
    const customer = row.customer_id ? customerById.get(row.customer_id) : undefined;
    const table = row.table_id ? tableById.get(row.table_id) : undefined;
    const employee = row.assigned_to ? employeeById.get(row.assigned_to) : undefined;

    return {
      id: row.id,
      customerId: row.customer_id ?? "",
      customerName: customer?.name ?? "Cliente sin ficha",
      customerPhone: customer?.phone ?? "",
      tableId: row.table_id ?? undefined,
      tableNumber: table?.number,
      partySize: Math.max(1, toNumber(row.party_size)),
      date: row.reservation_date,
      time: row.reservation_time.slice(0, 5),
      status: toReservationStatus(row.status),
      channel: toReservationChannel(row.channel),
      occasion: row.occasion ?? "",
      notes: row.notes ?? "",
      assignedTo: employee?.name,
      createdAt: row.created_at,
    };
  });
}

function mapCustomerInteractions(
  rows: DbCustomerInteraction[],
  customerById: Map<string, Customer>,
  employeeById: Map<string, Employee>,
): CustomerInteraction[] {
  return rows.map((row) => {
    const customer = customerById.get(row.customer_id);
    const employee = row.responsible_id
      ? employeeById.get(row.responsible_id)
      : undefined;

    return {
      id: row.id,
      customerId: row.customer_id,
      customerName: customer?.name ?? "Cliente sin ficha",
      type: toCustomerInteractionType(row.interaction_type),
      summary: row.summary,
      dueAt: row.due_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      responsible: employee?.name ?? "Sin responsable",
      createdAt: row.created_at,
    };
  });
}

function mapAuditLogs(
  rows: DbAuditLog[],
  employeeById: Map<string, Employee>,
): AuditLog[] {
  return rows.map((row) => {
    const actor = row.actor_id ? employeeById.get(row.actor_id) : undefined;

    return {
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id ?? undefined,
      summary: row.summary ?? "",
      actor: actor?.name ?? "Sistema",
      actorRole: toRoleIdOrUndefined(row.actor_role),
      metadata: isRecord(row.metadata) ? row.metadata : {},
      time: new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.created_at)),
      createdAt: row.created_at,
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
    value === "paid" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "pending";
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

function toRoleIdOrUndefined(value: string | null): RoleId | undefined {
  if (!value) {
    return undefined;
  }

  return toRoleId(value);
}

function toPaymentMethod(value: string | null): PaymentMethod | undefined {
  return value === "cash" ||
    value === "debit" ||
    value === "credit" ||
    value === "transfer"
    ? value
    : undefined;
}

function toReservationStatus(value: string): ReservationStatus {
  if (
    value === "pending" ||
    value === "confirmed" ||
    value === "seated" ||
    value === "completed" ||
    value === "cancelled" ||
    value === "no_show"
  ) {
    return value;
  }

  return "pending";
}

function toReservationChannel(value: string | null): Reservation["channel"] {
  return value === "phone" ||
    value === "whatsapp" ||
    value === "web" ||
    value === "walk_in"
    ? value
    : "phone";
}

function toCustomerInteractionType(
  value: string,
): CustomerInteraction["type"] {
  if (
    value === "note" ||
    value === "call" ||
    value === "message" ||
    value === "complaint" ||
    value === "preference" ||
    value === "follow_up"
  ) {
    return value;
  }

  return "note";
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

function toInventoryMovementType(value: string): InventoryMovement["type"] {
  return value === "initial" ||
    value === "purchase" ||
    value === "sale" ||
    value === "manual_out" ||
    value === "adjustment" ||
    value === "waste"
    ? value
    : "adjustment";
}

function toFoodSafetyResult(value: string | null): FoodSafetyLog["result"] {
  if (value === "ok" || value === "warning" || value === "critical") {
    return value;
  }

  return "ok";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
