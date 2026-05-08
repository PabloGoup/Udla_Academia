"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Boxes,
  Calculator,
  ChefHat,
  ClipboardCheck,
  Clock,
  CreditCard,
  Database,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  Lock,
  Moon,
  PackagePlus,
  Printer,
  RefreshCw,
  ReceiptText,
  Salad,
  ShieldCheck,
  ShoppingCart,
  SplitSquareHorizontal,
  Store,
  Sun,
  Table2,
  UserRound,
  Users,
  Utensils,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import {
  educationSteps,
  visualPanels,
} from "@/lib/demo-data";
import {
  demoSnapshot,
  loadRestaurantSnapshot,
  type RestaurantSnapshot,
} from "@/lib/data-source";
import {
  getCurrentAuthProfile,
  persistKitchenTicket,
  persistOrderItem,
  persistOrderStatus,
  persistTableStatus,
  signInOperator,
  signOutOperator,
  type AuthProfile,
  type OperationResult,
} from "@/lib/operations";
import { subscribeToRestaurantRealtime } from "@/lib/realtime";
import {
  calculateRealNetUnitCost,
  calculateRecipeSummary,
  formatCurrency,
  formatPercent,
  numberFormatter,
} from "@/lib/costing";
import { canAccessModule, getRoleProfile, roleProfiles } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  InventoryCategory,
  ModuleId,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  RawMaterial,
  Recipe,
  ReportPoint,
  RestaurantTable,
  RoleId,
  TableStatus,
} from "@/lib/types";

type ConnectionState = "demo" | "loading" | "ready" | "fallback";
type AuthState = "demo" | "checking" | "anonymous" | "authenticated";
type RealtimeState = "off" | "connecting" | "live" | "error";

interface OperationNotice {
  tone: "success" | "warning";
  message: string;
}

const RestaurantDataContext = createContext<RestaurantSnapshot>(demoSnapshot);

function useRestaurantData() {
  return useContext(RestaurantDataContext);
}

const modules: Array<{
  id: ModuleId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    id: "dashboard",
    label: "Panel operativo",
    shortLabel: "Panel",
    icon: LayoutDashboard,
    accent: "bg-zinc-900 text-white",
  },
  {
    id: "tables",
    label: "Mesas y salon",
    shortLabel: "Mesas",
    icon: Table2,
    accent: "bg-emerald-600 text-white",
  },
  {
    id: "orders",
    label: "Pedidos presenciales",
    shortLabel: "Pedidos",
    icon: Utensils,
    accent: "bg-amber-500 text-zinc-950",
  },
  {
    id: "kitchen",
    label: "Cocina en tiempo real",
    shortLabel: "Cocina",
    icon: ChefHat,
    accent: "bg-red-600 text-white",
  },
  {
    id: "cash",
    label: "Caja",
    shortLabel: "Caja",
    icon: CreditCard,
    accent: "bg-cyan-600 text-white",
  },
  {
    id: "products",
    label: "Productos",
    shortLabel: "Productos",
    icon: Salad,
    accent: "bg-lime-600 text-white",
  },
  {
    id: "recipes",
    label: "Recetario tecnico",
    shortLabel: "Recetas",
    icon: BookOpen,
    accent: "bg-violet-600 text-white",
  },
  {
    id: "inventory",
    label: "Inventario y bodega",
    shortLabel: "Bodega",
    icon: Boxes,
    accent: "bg-orange-600 text-white",
  },
  {
    id: "purchases",
    label: "Compras y proveedores",
    shortLabel: "Compras",
    icon: ShoppingCart,
    accent: "bg-sky-600 text-white",
  },
  {
    id: "reports",
    label: "Reportes",
    shortLabel: "Reportes",
    icon: BarChart3,
    accent: "bg-fuchsia-600 text-white",
  },
  {
    id: "foodSafety",
    label: "Seguridad alimentaria",
    shortLabel: "Seguridad",
    icon: ShieldCheck,
    accent: "bg-rose-600 text-white",
  },
  {
    id: "employees",
    label: "Trabajadores",
    shortLabel: "Equipo",
    icon: Users,
    accent: "bg-teal-600 text-white",
  },
  {
    id: "education",
    label: "Modulo educativo",
    shortLabel: "Educacion",
    icon: GraduationCap,
    accent: "bg-indigo-600 text-white",
  },
  {
    id: "architecture",
    label: "Arquitectura",
    shortLabel: "Arquitectura",
    icon: Database,
    accent: "bg-stone-700 text-white",
  },
];

const tableStatusMeta: Record<
  TableStatus,
  { label: string; className: string; dot: string }
> = {
  free: {
    label: "Libre",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
  },
  occupied: {
    label: "Ocupada",
    className: "border-red-300 bg-red-50 text-red-900",
    dot: "bg-red-500",
  },
  reserved: {
    label: "Reservada",
    className: "border-amber-300 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  cleaning: {
    label: "Limpieza",
    className: "border-sky-300 bg-sky-50 text-sky-900",
    dot: "bg-sky-500",
  },
};

const orderStatusMeta: Record<
  OrderStatus,
  { label: string; className: string; next?: OrderStatus }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-900",
    next: "preparing",
  },
  preparing: {
    label: "En preparacion",
    className: "bg-red-100 text-red-900",
    next: "ready",
  },
  ready: {
    label: "Listo",
    className: "bg-emerald-100 text-emerald-900",
    next: "delivered",
  },
  delivered: {
    label: "Entregado",
    className: "bg-sky-100 text-sky-900",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-zinc-200 text-zinc-700",
  },
};

const categoryMeta: Record<
  InventoryCategory,
  { label: string; className: string; bar: string }
> = {
  meats: {
    label: "Carnes",
    className: "bg-red-100 text-red-900 border-red-200",
    bar: "bg-red-500",
  },
  seafood: {
    label: "Pescados y mariscos",
    className: "bg-blue-100 text-blue-900 border-blue-200",
    bar: "bg-blue-500",
  },
  produce: {
    label: "Verduras y frutas",
    className: "bg-green-100 text-green-900 border-green-200",
    bar: "bg-green-500",
  },
  dairy: {
    label: "Lacteos",
    className: "bg-cyan-100 text-cyan-900 border-cyan-200",
    bar: "bg-cyan-500",
  },
  dry: {
    label: "Abarrotes y secos",
    className: "bg-yellow-100 text-yellow-900 border-yellow-200",
    bar: "bg-yellow-500",
  },
  frozen: {
    label: "Congelados",
    className: "bg-purple-100 text-purple-900 border-purple-200",
    bar: "bg-purple-500",
  },
  ready: {
    label: "Listos para consumo",
    className: "bg-white text-zinc-900 border-zinc-200",
    bar: "bg-white",
  },
  allergens: {
    label: "Alergenos",
    className: "bg-orange-100 text-orange-900 border-orange-200",
    bar: "bg-orange-500",
  },
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  debit: "Debito",
  credit: "Credito",
  transfer: "Transferencia",
};

export function RestaurantPlatform() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot>(demoSnapshot);
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    isSupabaseConfigured() ? "loading" : "demo",
  );
  const [authState, setAuthState] = useState<AuthState>(() =>
    isSupabaseConfigured() ? "checking" : "demo",
  );
  const [realtimeState, setRealtimeState] = useState<RealtimeState>(() =>
    isSupabaseConfigured() ? "connecting" : "off",
  );
  const [lastRealtimeSync, setLastRealtimeSync] = useState<string | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [operationNotice, setOperationNotice] =
    useState<OperationNotice | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [selectedRole, setSelectedRole] = useState<RoleId>("administrator");
  const [darkMode, setDarkMode] = useState(false);
  const [tableState, setTableState] =
    useState<RestaurantTable[]>(demoSnapshot.tables);
  const [orderState, setOrderState] = useState<Order[]>(demoSnapshot.orders);
  const [selectedTableId, setSelectedTableId] = useState("t-2");
  const [selectedOrderId, setSelectedOrderId] = useState("ord-2");
  const [selectedRecipeId, setSelectedRecipeId] = useState("rec-lomo");

  const applyRestaurantSnapshot = useCallback((nextSnapshot: RestaurantSnapshot) => {
    setSnapshot(nextSnapshot);
    setTableState(nextSnapshot.tables);
    setOrderState(nextSnapshot.orders);
    setSelectedTableId((current) =>
      nextSnapshot.tables.some((table) => table.id === current)
        ? current
        : nextSnapshot.tables[0]?.id ?? "",
    );
    setSelectedOrderId((current) =>
      nextSnapshot.orders.some((order) => order.id === current)
        ? current
        : nextSnapshot.orders[0]?.id ?? "",
    );
    setSelectedRecipeId((current) =>
      nextSnapshot.recipes.some((recipe) => recipe.id === current)
        ? current
        : nextSnapshot.recipes[0]?.id ?? "",
    );
    setConnectionState(
      nextSnapshot.source === "supabase" && !nextSnapshot.error
        ? "ready"
        : "fallback",
    );
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;

    loadRestaurantSnapshot().then((nextSnapshot) => {
      if (cancelled) {
        return;
      }

      applyRestaurantSnapshot(nextSnapshot);
    });

    return () => {
      cancelled = true;
    };
  }, [applyRestaurantSnapshot]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;
    let reloadTimer: number | undefined;

    const refreshFromRealtime = () => {
      if (reloadTimer) {
        window.clearTimeout(reloadTimer);
      }

      reloadTimer = window.setTimeout(() => {
        loadRestaurantSnapshot().then((nextSnapshot) => {
          if (cancelled) {
            return;
          }

          applyRestaurantSnapshot(nextSnapshot);
          setLastRealtimeSync(new Date().toISOString());
        });
      }, 250);
    };

    const unsubscribe = subscribeToRestaurantRealtime({
      onChange: refreshFromRealtime,
      onStatus: (status) => {
        if (cancelled) {
          return;
        }

        if (status === "SUBSCRIBED") {
          setRealtimeState("live");
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeState("error");
          return;
        }

        setRealtimeState("connecting");
      },
    });

    return () => {
      cancelled = true;
      if (reloadTimer) {
        window.clearTimeout(reloadTimer);
      }
      unsubscribe();
    };
  }, [applyRestaurantSnapshot]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;

    getCurrentAuthProfile().then((profile) => {
      if (cancelled) {
        return;
      }

      setAuthProfile(profile);
      setAuthState(profile ? "authenticated" : "anonymous");
      if (profile) {
        setSelectedRole(profile.role);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const role = getRoleProfile(selectedRole);
  const selectedTable =
    tableState.find((table) => table.id === selectedTableId) ?? tableState[0];
  const selectedOrder =
    orderState.find((order) => order.id === selectedOrderId) ?? orderState[0];
  const selectedRecipe =
    snapshot.recipes.find((recipe) => recipe.id === selectedRecipeId) ??
    snapshot.recipes[0] ??
    demoSnapshot.recipes[0];
  const recipeSummary = calculateRecipeSummary(
    selectedRecipe,
    snapshot.rawMaterials,
  );
  const activeAccess = canAccessModule(selectedRole, activeModule);

  const dashboardStats = useMemo(() => {
    const totalSales = orderState.reduce((total, order) => total + order.total, 0);
    const activeOrders = orderState.filter(
      (order) => !["delivered", "cancelled"].includes(order.status),
    );
    const occupiedTables = tableState.filter(
      (table) => table.status === "occupied",
    ).length;
    const stockAlerts = snapshot.rawMaterials.filter(
      (material) => material.stock <= material.minStock,
    ).length;

    return {
      totalSales,
      activeOrders: activeOrders.length,
      occupiedTables,
      stockAlerts,
      foodCost: 31.4,
      kitchenAverage: 18,
    };
  }, [orderState, tableState, snapshot.rawMaterials]);

  function showOperationResult(result: OperationResult) {
    setOperationNotice({
      tone: result.ok ? "success" : "warning",
      message: result.message,
    });
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState("checking");
    const { result, profile } = await signInOperator(authEmail, authPassword);
    showOperationResult(result);
    setAuthProfile(profile);
    setAuthState(profile ? "authenticated" : "anonymous");
    if (profile) {
      setSelectedRole(profile.role);
      setAuthOpen(false);
      setAuthPassword("");
    }
  }

  async function handleSignOut() {
    const result = await signOutOperator();
    showOperationResult(result);
    setAuthProfile(null);
    setAuthState(isSupabaseConfigured() ? "anonymous" : "demo");
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = orderState.find((item) => item.id === orderId);
    const table = tableState.find((item) => item.number === order?.tableNumber);

    setOrderState((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );

    if (status === "delivered") {
      const tableNumber = orderState.find((order) => order.id === orderId)
        ?.tableNumber;
      setTableState((current) =>
        current.map((table) =>
          table.number === tableNumber ? { ...table, status: "cleaning" } : table,
        ),
      );
    }

    if (snapshot.source === "supabase") {
      void persistOrderStatus(orderId, status, table?.id).then(showOperationResult);
    }
  }

  function cycleTableStatus(tableId: string) {
    const nextStatus: Record<TableStatus, TableStatus> = {
      free: "occupied",
      occupied: "cleaning",
      cleaning: "free",
      reserved: "occupied",
    };
    const table = tableState.find((item) => item.id === tableId);
    const status = table ? nextStatus[table.status] : "free";

    setTableState((current) =>
      current.map((table) =>
        table.id === tableId
          ? { ...table, status }
          : table,
      ),
    );

    if (snapshot.source === "supabase") {
      void persistTableStatus(tableId, status).then(showOperationResult);
    }
  }

  function addProductToSelectedOrder(product: Product) {
    setOrderState((current) =>
      current.map((order) => {
        if (order.id !== selectedOrder.id) {
          return order;
        }

        return {
          ...order,
          status: order.status === "delivered" ? "pending" : order.status,
          total: order.total + product.price,
          items: [
            ...order.items,
            {
              id: `oi-${Date.now()}`,
              productId: product.id,
              productName: product.name,
              quantity: 1,
              unitPrice: product.price,
              modifiers: product.modifiers.slice(0, 1),
              notes: "Agregado desde demo POS",
              station: product.categoryId === "cat-bar" ? "bar" : "hot",
            },
          ],
        };
      }),
    );

    if (snapshot.source === "supabase" && selectedOrder) {
      void persistOrderItem(selectedOrder, product).then(showOperationResult);
    }
  }

  function sendOrderToKitchen(orderId: string) {
    const order = orderState.find((item) => item.id === orderId);
    updateOrderStatus(orderId, "pending");

    if (snapshot.source === "supabase" && order) {
      void persistKitchenTicket(order).then(showOperationResult);
    }
  }

  const content = activeAccess ? (
    renderModule()
  ) : (
    <AccessBlocked roleLabel={role.label} moduleLabel={getModuleLabel(activeModule)} />
  );

  function renderModule() {
    switch (activeModule) {
      case "dashboard":
        return (
          <DashboardModule
            stats={dashboardStats}
            orders={orderState}
            tables={tableState}
          />
        );
      case "tables":
        return (
          <TablesModule
            tables={tableState}
            selectedTable={selectedTable}
            onSelect={setSelectedTableId}
            onCycle={cycleTableStatus}
          />
        );
      case "orders":
        return (
          <OrdersModule
            orders={orderState}
            products={snapshot.products}
            productCategories={snapshot.productCategories}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrderId}
            onAddProduct={addProductToSelectedOrder}
            onSendToKitchen={sendOrderToKitchen}
          />
        );
      case "kitchen":
        return (
          <KitchenModule orders={orderState} onUpdateStatus={updateOrderStatus} />
        );
      case "cash":
        return <CashModule orders={orderState} />;
      case "products":
        return (
          <ProductsModule
            products={snapshot.products}
            onAddProduct={addProductToSelectedOrder}
          />
        );
      case "recipes":
        return (
          <RecipesModule
            selectedRecipeId={selectedRecipeId}
            onSelectRecipe={setSelectedRecipeId}
            selectedRecipe={selectedRecipe}
            recipeSummary={recipeSummary}
            recipes={snapshot.recipes}
          />
        );
      case "inventory":
        return <InventoryModule />;
      case "purchases":
        return <PurchasesModule />;
      case "reports":
        return <ReportsModule />;
      case "foodSafety":
        return <FoodSafetyModule />;
      case "employees":
        return <EmployeesModule />;
      case "education":
        return <EducationModule />;
      case "architecture":
        return <ArchitectureModule />;
    }
  }

  return (
    <RestaurantDataContext.Provider value={snapshot}>
      <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen overflow-x-hidden bg-[#f5f7f8] text-zinc-950 transition-colors dark:bg-[#101112] dark:text-zinc-100">
        <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#101112]/90">
          <div className="flex min-w-0 flex-col gap-4 px-4 py-4 lg:px-6">
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <Store className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    UDLA Academia Gastronomica
                  </p>
                  <h1 className="text-xl font-semibold md:text-2xl">
                    Sistema integral de restaurante presencial
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ConnectionBadge
                  status={connectionState}
                  error={snapshot.error}
                />
                <RealtimeBadge
                  status={realtimeState}
                  lastSync={lastRealtimeSync}
                />
                <AuthControl
                  authState={authState}
                  profile={authProfile}
                  email={authEmail}
                  password={authPassword}
                  open={authOpen}
                  onEmailChange={setAuthEmail}
                  onPasswordChange={setAuthPassword}
                  onOpenChange={setAuthOpen}
                  onSignIn={handleSignIn}
                  onSignOut={handleSignOut}
                />
                <button
                  type="button"
                  onClick={() => setDarkMode((current) => !current)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {darkMode ? "Claro" : "Oscuro"}
                </button>
              </div>
            </div>

            <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
              {roleProfiles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRole(item.id)}
                  className={`h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold transition ${
                    selectedRole === item.id
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-black/10 bg-white text-zinc-700 hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {operationNotice ? (
              <OperationNoticeBar
                notice={operationNotice}
                onDismiss={() => setOperationNotice(null)}
              />
            ) : null}
          </div>
        </header>

        <div className="grid min-w-0 min-h-[calc(100vh-149px)] lg:grid-cols-[276px_1fr]">
          <aside className="min-w-0 border-b border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#151617] lg:border-b-0 lg:border-r lg:p-4">
            <div className="mb-4 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Perfil activo
              </p>
              <p className="mt-1 text-base font-semibold">{role.label}</p>
              <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                {role.description}
              </p>
            </div>

            <nav className="flex min-w-0 max-w-full gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {modules.map((module) => {
                const Icon = module.icon;
                const allowed = canAccessModule(selectedRole, module.id);
                const active = activeModule === module.id;

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setActiveModule(module.id)}
                    className={`flex h-12 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition lg:w-full ${
                      active
                        ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                        : "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    } ${allowed ? "" : "opacity-50"}`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        active ? module.accent : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      {allowed ? <Icon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </span>
                    <span className="hidden lg:inline">{module.label}</span>
                    <span className="lg:hidden">{module.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 p-4 md:p-6">{content}</main>
        </div>
      </div>
      </div>
    </RestaurantDataContext.Provider>
  );
}

function DashboardModule({
  stats,
  orders,
  tables,
}: {
  stats: {
    totalSales: number;
    activeOrders: number;
    occupiedTables: number;
    stockAlerts: number;
    foodCost: number;
    kitchenAverage: number;
  };
  orders: Order[];
  tables: RestaurantTable[];
}) {
  const latestOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operacion en vivo"
        title="Control comercial, academico y productivo"
        description="Vista ejecutiva para coordinar salon, cocina, caja, inventario, costos y seguridad alimentaria."
      />

      <VisualOperationsStrip />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Ventas turno"
          value={formatCurrency(stats.totalSales)}
          icon={BadgeDollarSign}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Pedidos activos"
          value={stats.activeOrders.toString()}
          icon={ReceiptText}
          tone="bg-amber-500"
        />
        <MetricCard
          label="Mesas ocupadas"
          value={`${stats.occupiedTables}/${tables.length}`}
          icon={Table2}
          tone="bg-red-600"
        />
        <MetricCard
          label="Food cost"
          value={formatPercent(stats.foodCost)}
          icon={Calculator}
          tone="bg-violet-600"
        />
        <MetricCard
          label="Promedio cocina"
          value={`${stats.kitchenAverage} min`}
          icon={Clock}
          tone="bg-cyan-600"
        />
        <MetricCard
          label="Alertas stock"
          value={stats.stockAlerts.toString()}
          icon={AlertTriangle}
          tone="bg-orange-600"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Pulso de ventas semanal" icon={Activity}>
          <div className="h-[310px] min-w-0">
            <SalesTrendChart />
          </div>
        </Panel>

        <Panel title="Comandas recientes" icon={ChefHat}>
          <div className="space-y-3">
            {latestOrders.map((order) => (
              <OrderSummaryRow key={order.id} order={order} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TablesModule({
  tables,
  selectedTable,
  onSelect,
  onCycle,
}: {
  tables: RestaurantTable[];
  selectedTable: RestaurantTable;
  onSelect: (tableId: string) => void;
  onCycle: (tableId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Salon presencial"
        title="Mapa de mesas, estados y cuentas"
        description="Control visual para abrir mesas, mover pedidos, dividir cuentas, unir cuentas y revisar historial de atencion."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel title="Mapa del salon" icon={Table2}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {tables.map((table) => {
              const meta = tableStatusMeta[table.status];
              const selected = selectedTable.id === table.id;

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelect(table.id)}
                  className={`min-h-[154px] rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${meta.className} ${
                    selected ? "ring-2 ring-zinc-950 dark:ring-white" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-80">{table.zone}</p>
                      <p className="text-3xl font-semibold">Mesa {table.number}</p>
                    </div>
                    <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm font-medium">
                    <span>{table.seats} puestos</span>
                    <span>{meta.label}</span>
                  </div>
                  <p className="mt-2 text-sm opacity-80">Mesero: {table.server}</p>
                  {table.total ? (
                    <p className="mt-1 text-sm font-semibold">
                      Cuenta: {formatCurrency(table.total)}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={`Mesa ${selectedTable.number}`} icon={ClipboardCheck}>
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${tableStatusMeta[selectedTable.status].className}`}>
              <p className="text-sm font-medium">Estado actual</p>
              <p className="mt-1 text-2xl font-semibold">
                {tableStatusMeta[selectedTable.status].label}
              </p>
              <p className="mt-2 text-sm">
                {selectedTable.elapsedMinutes
                  ? `${selectedTable.elapsedMinutes} min desde apertura`
                  : "Sin atencion activa"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCycle(selectedTable.id)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <ListChecks className="h-4 w-4" />
              Cambiar estado
            </button>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={SplitSquareHorizontal} label="Dividir cuenta" />
              <ActionButton icon={Table2} label="Mover pedido" />
              <ActionButton icon={ReceiptText} label="Unir cuenta" />
              <ActionButton icon={Clock} label="Historial" />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function OrdersModule({
  orders,
  products,
  productCategories,
  selectedOrder,
  onSelectOrder,
  onAddProduct,
  onSendToKitchen,
}: {
  orders: Order[];
  products: Product[];
  productCategories: ProductCategory[];
  selectedOrder: Order;
  onSelectOrder: (orderId: string) => void;
  onAddProduct: (product: Product) => void;
  onSendToKitchen: (orderId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="POS de mesero"
        title="Pedidos presenciales con modificadores"
        description="Permite asociar mesa, agregar productos, aplicar observaciones, descuentos y enviar comanda automaticamente a cocina."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel title="Carta operativa" icon={Utensils}>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {productCategories.map((category) => (
              <span
                key={category.id}
                className="inline-flex h-9 shrink-0 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold dark:border-white/10 dark:bg-zinc-900"
              >
                <CategoryColorDot color={category.color} />
                {category.name}
              </span>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                onAdd={() => onAddProduct(product)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Cuenta activa" icon={ReceiptText}>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.id)}
                className={`h-10 shrink-0 rounded-lg px-3 text-sm font-semibold ${
                  selectedOrder.id === order.id
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                Mesa {order.tableNumber}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Pedido {selectedOrder.number}</p>
                <p className="text-xl font-semibold">Mesa {selectedOrder.tableNumber}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>
            {selectedOrder.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">
                    {item.quantity}x {item.productName}
                  </p>
                  <p className="font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {item.modifiers.join(" · ")}
                </p>
                {item.notes ? (
                  <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-900">
                    {item.notes}
                  </p>
                ) : null}
              </div>
            ))}
            <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
              <div className="flex justify-between text-sm">
                <span>Descuento</span>
                <span>{formatCurrency(selectedOrder.discount)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>Propina sugerida</span>
                <span>{formatCurrency(selectedOrder.tip)}</span>
              </div>
              <div className="mt-4 flex justify-between text-xl font-semibold">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSendToKitchen(selectedOrder.id)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Printer className="h-4 w-4" />
              Enviar comanda a cocina
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function KitchenModule({
  orders,
  onUpdateStatus,
}: {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}) {
  const kitchenOrders = orders.filter((order) => order.status !== "delivered");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Monitor KDS"
        title="Comandas en tiempo real por estacion"
        description="La vista esta preparada para suscribirse a Supabase Realtime sobre orders y order_items."
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {kitchenOrders.map((order) => {
          const next = orderStatusMeta[order.status].next;
          const elapsed = getElapsedMinutes(order.createdAt);

          return (
            <div
              key={order.id}
              className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#18191b]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Pedido {order.number}
                  </p>
                  <h3 className="text-2xl font-semibold">Mesa {order.tableNumber}</h3>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <InfoPill label="Ingreso" value={formatTime(order.createdAt)} />
                <InfoPill label="Tiempo" value={`${elapsed} min`} />
              </div>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">
                        {item.quantity}x {item.productName}
                      </p>
                      <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
                        {item.station}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {item.modifiers.join(" · ")}
                    </p>
                    {item.notes ? (
                      <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, "preparing")}
                  className="h-11 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Preparar
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, "ready")}
                  className="h-11 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Listo
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, "delivered")}
                  className="h-11 rounded-lg bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Entregar
                </button>
              </div>
              {next ? (
                <p className="mt-3 text-center text-sm text-zinc-500">
                  Siguiente estado sugerido: {orderStatusMeta[next].label}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CashModule({ orders }: { orders: Order[] }) {
  const { cashMovements } = useRestaurantData();
  const totals = orders.reduce(
    (acc, order, index) => {
      const method: PaymentMethod =
        index % 4 === 0
          ? "cash"
          : index % 4 === 1
            ? "debit"
            : index % 4 === 2
              ? "credit"
              : "transfer";
      acc[method] += order.total;
      return acc;
    },
    { cash: 0, debit: 0, credit: 0, transfer: 0 } as Record<PaymentMethod, number>,
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Caja y pagos"
        title="Apertura, venta, propina, retiro y cierre"
        description="Registra metodos de pago, adelantos, diferencias y reportes diarios por responsable."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Efectivo inicial" value={formatCurrency(120000)} icon={Archive} tone="bg-zinc-900" />
        <MetricCard label="Ventas registradas" value={formatCurrency(orders.reduce((total, order) => total + order.total, 0))} icon={BadgeDollarSign} tone="bg-emerald-600" />
        <MetricCard label="Propinas" value={formatCurrency(orders.reduce((total, order) => total + order.tip, 0))} icon={ReceiptText} tone="bg-cyan-600" />
        <MetricCard label="Diferencia estimada" value={formatCurrency(1800)} icon={AlertTriangle} tone="bg-amber-500" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Metodos de pago" icon={CreditCard}>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(totals).map(([method, amount]) => (
              <div
                key={method}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="text-sm font-medium text-zinc-500">
                  {paymentLabels[method as PaymentMethod]}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(amount)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ActionButton icon={CreditCard} label="Registrar pago" />
            <ActionButton icon={BadgeDollarSign} label="Retiro" />
            <ActionButton icon={ReceiptText} label="Adelanto" />
            <ActionButton icon={ClipboardCheck} label="Cerrar caja" />
          </div>
        </Panel>

        <Panel title="Historial de movimientos" icon={ReceiptText}>
          <div className="space-y-3">
            {cashMovements.map((movement) => (
              <div
                key={movement.id}
                className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[80px_1fr_150px]"
              >
                <span className="font-mono text-sm text-zinc-500">
                  {movement.time}
                </span>
                <div>
                  <p className="font-semibold">{movement.description}</p>
                  <p className="text-sm text-zinc-500">{movement.responsible}</p>
                </div>
                <p
                  className={`text-left font-semibold md:text-right ${
                    movement.amount < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(movement.amount)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ProductsModule({
  products,
  onAddProduct,
}: {
  products: Product[];
  onAddProduct: (product: Product) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Carta y disponibilidad"
        title="Productos vinculados a recetas tecnicas"
        description="Cada producto tiene imagen, precio, receta asociada, tiempo de preparacion, estado y opciones de personalizacion."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductTile
            key={product.id}
            product={product}
            onAdd={() => onAddProduct(product)}
            expanded
          />
        ))}
      </div>
    </div>
  );
}

function RecipesModule({
  selectedRecipeId,
  onSelectRecipe,
  selectedRecipe,
  recipeSummary,
  recipes,
}: {
  selectedRecipeId: string;
  onSelectRecipe: (recipeId: string) => void;
  selectedRecipe: Recipe;
  recipeSummary: ReturnType<typeof calculateRecipeSummary>;
  recipes: Recipe[];
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Costeo profesional"
        title="Recetario tecnico, rendimiento y rentabilidad"
        description="Calcula cantidad neta, costo real del ingrediente, costo por porcion, precio sugerido, margen y rentabilidad."
      />

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Panel title="Recetas" icon={BookOpen}>
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onSelectRecipe(recipe.id)}
                className={`flex min-h-20 w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                  selectedRecipeId === recipe.id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-black/10 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900"
                }`}
              >
                <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </span>
                <div>
                  <p className="font-semibold">{recipe.name}</p>
                  <p className="text-sm text-zinc-500">{recipe.category}</p>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Panel title={selectedRecipe.name} icon={Calculator}>
              <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                <div className="relative h-56 w-full overflow-hidden rounded-lg">
                  <Image
                    src={selectedRecipe.image}
                    alt={selectedRecipe.name}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 240px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoPill label="Porciones" value={selectedRecipe.portions.toString()} />
                    <InfoPill label="Tiempo" value={`${selectedRecipe.prepTimeMinutes} min`} />
                    <InfoPill label="Precio venta" value={formatCurrency(selectedRecipe.salePrice)} />
                    <InfoPill label="Food cost real" value={formatPercent(recipeSummary.foodCostPercent)} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {selectedRecipe.procedure}
                  </p>
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    {selectedRecipe.observations}
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Resultado de costeo" icon={BadgeDollarSign}>
              <div className="space-y-3">
                <CostLine label="Costo neto receta" value={recipeSummary.netCost} />
                <CostLine label="Costo por porcion" value={recipeSummary.costPerPortion} />
                <CostLine label="Precio sugerido" value={recipeSummary.suggestedPrice} />
                <CostLine label="Margen unitario" value={recipeSummary.margin} />
                <div className="rounded-lg bg-emerald-50 p-4 text-emerald-950">
                  <p className="text-sm font-medium">Rentabilidad real</p>
                  <p className="text-3xl font-semibold">
                    {formatPercent(recipeSummary.profitability)}
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Ingredientes, rendimiento y merma" icon={PackagePlus}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-3 font-semibold">Ingrediente</th>
                    <th className="py-3 font-semibold">Bruto</th>
                    <th className="py-3 font-semibold">Rendimiento</th>
                    <th className="py-3 font-semibold">Neto aprovechable</th>
                    <th className="py-3 font-semibold">Merma</th>
                    <th className="py-3 font-semibold">Costo real neto</th>
                    <th className="py-3 text-right font-semibold">Costo receta</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeSummary.ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="py-3 font-semibold">{ingredient.name}</td>
                      <td className="py-3">{numberFormatter.format(ingredient.grossQuantity)}</td>
                      <td className="py-3">{formatPercent(ingredient.yieldPercent)}</td>
                      <td className="py-3">{numberFormatter.format(ingredient.netQuantity)}</td>
                      <td className="py-3">{ingredient.wasteType}</td>
                      <td className="py-3">{formatCurrency(ingredient.realNetUnitCost)}</td>
                      <td className="py-3 text-right font-semibold">
                        {formatCurrency(ingredient.ingredientCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InventoryModule() {
  const { rawMaterials } = useRestaurantData();
  const lowStock = rawMaterials.filter((material) => material.stock <= material.minStock);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Bodega"
        title="Inventario, mermas, vencimientos y valor real"
        description="Controla entradas, salidas por venta, ajustes, stock minimo, lotes, FIFO/LIFO y riesgo sanitario."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Materias primas" value={rawMaterials.length.toString()} icon={Boxes} tone="bg-orange-600" />
        <MetricCard label="Alertas stock" value={lowStock.length.toString()} icon={AlertTriangle} tone="bg-red-600" />
        <MetricCard label="Inventario valorizado" value={formatCurrency(642000)} icon={BadgeDollarSign} tone="bg-emerald-600" />
        <MetricCard label="Mermas estimadas" value={formatCurrency(38400)} icon={Activity} tone="bg-violet-600" />
      </div>

      <Panel title="Materias primas" icon={Archive}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-3 font-semibold">Producto</th>
                <th className="py-3 font-semibold">Categoria</th>
                <th className="py-3 font-semibold">Stock</th>
                <th className="py-3 font-semibold">Minimo</th>
                <th className="py-3 font-semibold">Rendimiento</th>
                <th className="py-3 font-semibold">Costo neto real</th>
                <th className="py-3 font-semibold">Vencimiento</th>
                <th className="py-3 font-semibold">Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((material) => (
                <InventoryRow key={material.id} material={material} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function PurchasesModule() {
  const { purchases, suppliers } = useRestaurantData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Abastecimiento"
        title="Compras, proveedores y precios historicos"
        description="Registra facturas, boletas, recepcion a inventario, comparacion de costos y confiabilidad por proveedor."
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Proveedores" icon={Store}>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{supplier.name}</p>
                    <p className="text-sm text-zinc-500">{supplier.category}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-900">
                    {supplier.reliability}%
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {supplier.contact} · {supplier.phone}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Compras recientes" icon={ShoppingCart}>
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_150px_120px]"
              >
                <div>
                  <p className="font-semibold">{purchase.supplierName}</p>
                  <p className="text-sm text-zinc-500">
                    {purchase.documentType === "invoice" ? "Factura" : "Boleta"}{" "}
                    {purchase.documentNumber} · {purchase.date}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(purchase.total)}</p>
                <span className="h-8 rounded-lg bg-zinc-100 px-3 py-1 text-center text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {purchase.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ReportsModule() {
  const { reportPoints } = useRestaurantData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analitica"
        title="Reportes de ventas, costos, mermas y desempeno"
        description="Dashboards listos para ventas diarias, productos mas vendidos, utilidad, inventario valorizado, tiempos de cocina y diferencias de caja."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Venta mensual" value={formatCurrency(21840000)} icon={BadgeDollarSign} tone="bg-emerald-600" />
        <MetricCard label="Utilidad estimada" value={formatCurrency(7860000)} icon={BarChart3} tone="bg-cyan-600" />
        <MetricCard label="Merma mensual" value={formatCurrency(418000)} icon={AlertTriangle} tone="bg-red-600" />
        <MetricCard label="Pedidos cancelados" value="14" icon={ReceiptText} tone="bg-zinc-900" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Ventas y margen" icon={BarChart3}>
          <div className="h-[320px] min-w-0">
            <SalesBarsChart reportPoints={reportPoints} />
          </div>
        </Panel>
        <Panel title="Indicadores criticos" icon={Activity}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Producto mas vendido", "Lomo salteado"],
              ["Producto menos vendido", "Tabla caliente"],
              ["Mayor merma", "Palta hass"],
              ["Tiempo cocina promedio", "18 min"],
              ["Food cost promedio", "31,4%"],
              ["Diferencia caja", "$1.800"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="text-sm text-zinc-500">{label}</p>
                <p className="mt-2 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FoodSafetyModule() {
  const { rawMaterials } = useRestaurantData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Higiene y almacenamiento"
        title="Seguridad alimentaria por color, temperatura y lote"
        description="Estandariza almacenamiento profesional, riesgo sanitario, vencimientos, alergenos, FIFO/LIFO y trazabilidad."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(categoryMeta).map(([key, meta]) => (
          <div
            key={key}
            className={`rounded-lg border p-4 ${meta.className}`}
          >
            <span className={`mb-4 block h-2 rounded-full ${meta.bar}`} />
            <p className="font-semibold">{meta.label}</p>
            <p className="mt-1 text-sm opacity-80">
              {rawMaterials.filter((item) => item.category === key).length} insumos controlados
            </p>
          </div>
        ))}
      </div>

      <Panel title="Control sanitario por lote" icon={ShieldCheck}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rawMaterials.slice(0, 6).map((material) => (
            <div
              key={material.id}
              className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{material.name}</p>
                  <p className="text-sm text-zinc-500">Lote {material.lot}</p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${categoryMeta[material.category].className}`}>
                  {categoryMeta[material.category].label}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <InfoPill label="Temperatura" value={material.storageTemperature} />
                <InfoPill label="Rotacion" value={material.storageMethod} />
                <InfoPill label="Vence" value={material.expirationDate} />
              </div>
              <p className="mt-3 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                {material.storageNotes}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function EmployeesModule() {
  const { employees } = useRestaurantData();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Equipo y permisos"
        title="Trabajadores, roles y desempeno por turno"
        description="Administra personal, permisos, ventas por mesero, tiempos de cocina y estados de turno."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Trabajadores" icon={Users}>
          <div className="space-y-3">
            {employees.map((employee) => {
              const role = getRoleProfile(employee.role);
              return (
                <div
                  key={employee.id}
                  className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_140px_130px]"
                >
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-zinc-500">
                      {role.label} · {employee.shift}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(employee.sales)}</p>
                  <span className="rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {employee.status}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Matriz de roles" icon={Lock}>
          <div className="space-y-3">
            {roleProfiles.map((role) => (
              <div
                key={role.id}
                className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="font-semibold">{role.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{role.description}</p>
                <p className="mt-2 text-sm font-medium">
                  {role.permissions.length} permisos asignados
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EducationModule() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Demo academico"
        title="Simulador educativo sin depender de la base de datos"
        description="Permite al docente ensenar todos los modulos con datos controlados, escenarios guiados y practicas de administracion gastronomica."
      />

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase">Modo educativo activo</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Este modulo trabaja con demo local y no escribe en Supabase
            </h2>
          </div>
          <GraduationCap className="h-10 w-10" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Ruta docente sugerida" icon={GraduationCap}>
          <div className="space-y-3">
            {educationSteps.map((step, index) => (
              <div
                key={step}
                className="flex gap-3 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6">{step}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Escenarios de practica" icon={ClipboardCheck}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Servicio lleno", "Mesas ocupadas, cocina con espera y caja activa."],
              ["Merma de bodega", "Palta con rendimiento bajo y vencimiento cercano."],
              ["Cierre de caja", "Ventas mixtas, propinas, retiro y diferencia."],
              ["Costeo real", "Lomo con 70% de rendimiento y precio sugerido."],
              ["Alergenos", "Pedido con restriccion y comanda visible."],
              ["Proveedor caro", "Comparacion historica de precio por insumo."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ArchitectureModule() {
  const stages = [
    "Arquitectura general",
    "Modelo de base de datos",
    "Estructura del proyecto",
    "Diseno UI/UX",
    "Sistema de roles",
    "Flujo de pedidos",
    "Cocina en tiempo real",
    "Caja",
    "Inventario",
    "Recetario tecnico",
    "Costeo real",
    "Reportes y dashboards",
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Base tecnica"
        title="Arquitectura preparada para crecer por etapas"
        description="Next.js App Router, Supabase como backend, datos demo desacoplados, permisos por rol y modulos listos para evolucionar a rutas independientes."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Frontend" icon={LayoutDashboard}>
          <ArchitectureList
            items={[
              "Next.js 16 con App Router",
              "Componentes modulares por area operativa",
              "Tailwind CSS v4 con modo oscuro",
              "Graficos de reportes con Recharts",
              "UX responsive para desktop, tablet y movil",
            ]}
          />
        </Panel>
        <Panel title="Backend Supabase" icon={Database}>
          <ArchitectureList
            items={[
              "SQL en supabase/schema.sql",
              "RLS por roles y permisos",
              "Realtime para mesas, pedidos y cocina",
              "Vistas de costos y rentabilidad",
              "Variables en .env.local",
            ]}
          />
        </Panel>
        <Panel title="Dominio gastronomico" icon={ChefHat}>
          <ArchitectureList
            items={[
              "Recetas tecnicas con rendimiento",
              "Costo real sobre neto aprovechable",
              "Inventario con FIFO/LIFO y vencimientos",
              "Caja con movimientos trazables",
              "Modo educativo sin escritura en DB",
            ]}
          />
        </Panel>
      </div>

      <Panel title="Roadmap por etapas" icon={ListChecks}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage, index) => (
            <div
              key={stage}
              className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <p className="text-sm font-semibold text-zinc-500">
                Etapa {index + 1}
              </p>
              <p className="mt-1 font-semibold">{stage}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function VisualOperationsStrip() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {visualPanels.map((panel) => (
        <div
          key={panel.title}
          className="relative min-h-[170px] overflow-hidden rounded-lg bg-zinc-900 text-white"
        >
          <Image
            src={panel.image}
            alt={panel.title}
            fill
            unoptimized
            loading="eager"
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="relative flex h-full min-h-[170px] flex-col justify-end p-4">
            <p className="text-2xl font-semibold">{panel.title}</p>
            <p className="mt-1 text-sm text-white/85">{panel.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductTile({
  product,
  onAdd,
  expanded = false,
}: {
  product: Product;
  onAdd: () => void;
  expanded?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#18191b]">
      <div className="relative h-36 w-full overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{product.name}</p>
            <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              product.available
                ? "bg-emerald-100 text-emerald-900"
                : "bg-red-100 text-red-900"
            }`}
          >
            {product.available ? "Disponible" : "No disponible"}
          </span>
        </div>
        {expanded ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {product.modifiers.map((modifier) => (
              <span
                key={modifier}
                className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {modifier}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{formatCurrency(product.price)}</p>
            <p className="text-sm text-zinc-500">{product.prepTimeMinutes} min</p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={!product.available}
            className="h-11 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryRow({ material }: { material: RawMaterial }) {
  const meta = categoryMeta[material.category];
  const low = material.stock <= material.minStock;

  return (
    <tr className="border-t border-black/10 dark:border-white/10">
      <td className="py-3">
        <p className="font-semibold">{material.name}</p>
        <p className="text-xs text-zinc-500">Lote {material.lot}</p>
      </td>
      <td className="py-3">
        <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${meta.className}`}>
          {meta.label}
        </span>
      </td>
      <td className={`py-3 font-semibold ${low ? "text-red-600" : ""}`}>
        {numberFormatter.format(material.stock)} {material.unit}
      </td>
      <td className="py-3">
        {numberFormatter.format(material.minStock)} {material.unit}
      </td>
      <td className="py-3">{formatPercent(material.averageYield)}</td>
      <td className="py-3">{formatCurrency(calculateRealNetUnitCost(material))}</td>
      <td className="py-3">{material.expirationDate}</td>
      <td className="py-3">
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {material.sanitaryRisk}
        </span>
      </td>
    </tr>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-4xl">
      <p className="text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-3xl font-semibold leading-tight md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#18191b] md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#18191b]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ConnectionBadge({
  status,
  error,
}: {
  status: ConnectionState;
  error?: string;
}) {
  const meta: Record<
    ConnectionState,
    { label: string; className: string; title?: string }
  > = {
    demo: {
      label: "Modo demo local",
      className: "border-amber-300 bg-amber-50 text-amber-900",
    },
    loading: {
      label: "Conectando Supabase",
      className: "border-sky-300 bg-sky-50 text-sky-900",
    },
    ready: {
      label: "Supabase conectado",
      className: "border-emerald-300 bg-emerald-50 text-emerald-900",
    },
    fallback: {
      label: "Demo por fallback",
      className: "border-red-300 bg-red-50 text-red-900",
      title: error,
    },
  };

  return (
    <span
      title={meta[status].title}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${meta[status].className}`}
    >
      <Database className="h-4 w-4" />
      {meta[status].label}
    </span>
  );
}

function RealtimeBadge({
  status,
  lastSync,
}: {
  status: RealtimeState;
  lastSync: string | null;
}) {
  const meta: Record<RealtimeState, { label: string; className: string }> = {
    off: {
      label: "Realtime demo",
      className: "border-zinc-200 bg-white text-zinc-700",
    },
    connecting: {
      label: "Realtime conectando",
      className: "border-sky-300 bg-sky-50 text-sky-900",
    },
    live: {
      label: "Tiempo real activo",
      className: "border-emerald-300 bg-emerald-50 text-emerald-900",
    },
    error: {
      label: "Realtime sin canal",
      className: "border-red-300 bg-red-50 text-red-900",
    },
  };
  const Icon = status === "live" ? Wifi : WifiOff;
  const title = lastSync
    ? `Ultima sincronizacion: ${new Date(lastSync).toLocaleTimeString("es-CL")}`
    : undefined;

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${meta[status].className}`}
    >
      {status === "connecting" ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {meta[status].label}
    </span>
  );
}

function AuthControl({
  authState,
  profile,
  email,
  password,
  open,
  onEmailChange,
  onPasswordChange,
  onOpenChange,
  onSignIn,
  onSignOut,
}: {
  authState: AuthState;
  profile: AuthProfile | null;
  email: string;
  password: string;
  open: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onOpenChange: (value: boolean) => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
  onSignOut: () => void;
}) {
  if (authState === "demo") {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200">
        <UserRound className="h-4 w-4" />
        Sesion demo
      </span>
    );
  }

  if (profile) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-900 dark:border-white/10 dark:bg-zinc-900 dark:text-emerald-200">
          <UserRound className="h-4 w-4" />
          {profile.name}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {authState === "checking" ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Iniciar sesion
      </button>
      {open ? (
        <form
          onSubmit={onSignIn}
          className="absolute right-0 top-12 z-40 w-[min(88vw,320px)] rounded-lg border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        >
          <label className="block text-xs font-semibold uppercase text-zinc-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
            required
          />
          <label className="mt-3 block text-xs font-semibold uppercase text-zinc-500">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
            required
          />
          <button
            type="submit"
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
        </form>
      ) : null}
    </div>
  );
}

function OperationNoticeBar({
  notice,
  onDismiss,
}: {
  notice: OperationNotice;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium ${
        notice.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <span>{notice.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md px-2 py-1 text-xs font-semibold hover:bg-black/5"
      >
        Cerrar
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = orderStatusMeta[status];
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function CategoryColorDot({ color }: { color: string }) {
  if (color.startsWith("#") || color.startsWith("rgb")) {
    return (
      <span
        className="mr-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    );
  }

  return <span className={`mr-2 h-2 w-2 rounded-full ${color}`} />;
}

function OrderSummaryRow({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            Mesa {order.tableNumber} · {order.number}
          </p>
          <p className="text-sm text-zinc-500">
            {order.items.length} items · {order.waiter}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function CostLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-3 last:border-0 dark:border-white/10">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="font-semibold">{formatCurrency(value)}</p>
    </div>
  );
}

function ArchitectureList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex gap-3 text-sm leading-6">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function SalesTrendChart() {
  const { reportPoints } = useRestaurantData();
  const maxSales = Math.max(...reportPoints.map((point) => point.sales));
  const salesPoints = reportPoints
    .map((point, index) => {
      const x = 40 + index * 56;
      const y = 230 - (point.sales / maxSales) * 170;
      return `${x},${y}`;
    })
    .join(" ");
  const costPoints = reportPoints
    .map((point, index) => {
      const x = 40 + index * 56;
      const y = 230 - (point.foodCost / maxSales) * 170;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="h-full rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
      <svg viewBox="0 0 420 260" className="h-full w-full" role="img" aria-label="Ventas y food cost semanal">
        <defs>
          <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="40"
            x2="388"
            y1={60 + line * 48}
            y2={60 + line * 48}
            stroke="#d4d4d8"
            strokeDasharray="4 4"
          />
        ))}
        <polyline
          points={`40,230 ${salesPoints} 376,230`}
          fill="url(#salesFill)"
          stroke="none"
        />
        <polyline
          points={salesPoints}
          fill="none"
          stroke="#059669"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <polyline
          points={costPoints}
          fill="none"
          stroke="#dc2626"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {reportPoints.map((point, index) => (
          <text key={point.label} x={40 + index * 56} y="252" textAnchor="middle" className="fill-zinc-500 text-xs">
            {point.label}
          </text>
        ))}
        <text x="40" y="24" className="fill-zinc-500 text-xs">
          Ventas
        </text>
        <text x="112" y="24" className="fill-red-600 text-xs">
          Food cost
        </text>
      </svg>
    </div>
  );
}

function SalesBarsChart({ reportPoints }: { reportPoints: ReportPoint[] }) {
  const maxSales = Math.max(...reportPoints.map((point) => point.sales));

  return (
    <div className="flex h-full items-end gap-3 rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
      {reportPoints.map((point) => (
        <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2">
          <div className="flex flex-1 items-end gap-1">
            <span
              className="w-1/2 rounded-t-md bg-cyan-600"
              title={`Ventas ${formatCurrency(point.sales)}`}
              style={{ height: `${Math.max(8, (point.sales / maxSales) * 100)}%` }}
            />
            <span
              className="w-1/2 rounded-t-md bg-emerald-600"
              title={`Margen ${formatCurrency(point.margin)}`}
              style={{ height: `${Math.max(8, (point.margin / maxSales) * 100)}%` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-zinc-500">{point.label}</p>
        </div>
      ))}
    </div>
  );
}

function AccessBlocked({
  roleLabel,
  moduleLabel,
}: {
  roleLabel: string;
  moduleLabel: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg rounded-lg border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-[#18191b]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold">Acceso restringido</h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">
          El rol {roleLabel} no tiene permisos para operar el modulo {moduleLabel}.
          Cambia de rol o ajusta la matriz de permisos.
        </p>
      </div>
    </div>
  );
}

function getModuleLabel(moduleId: ModuleId) {
  return modules.find((module) => module.id === moduleId)?.label ?? moduleId;
}

function getElapsedMinutes(createdAt: string) {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.round(elapsed / 60000));
}

function formatTime(createdAt: string) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}
