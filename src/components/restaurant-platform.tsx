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
  CalendarCheck,
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
  MessageSquare,
  Moon,
  PackagePlus,
  Printer,
  RefreshCw,
  ReceiptText,
  Salad,
  Settings,
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
import { visualPanels } from "@/lib/demo-data";
import {
  demoSnapshot,
  loadRestaurantSnapshot,
  type RestaurantSnapshot,
} from "@/lib/data-source";
import {
  getCurrentAuthProfile,
  persistCustomerInteraction,
  persistCustomerProfile,
  persistCashMovement,
  persistCashPayment,
  persistCashRegisterClose,
  persistCashRegisterOpen,
  persistEmployeeProfile,
  persistFoodSafetyCheck,
  persistInventoryMovement,
  persistKitchenTicket,
  persistOperationalDocument,
  persistOrderItem,
  persistOrderStatus,
  persistProductCatalogItem,
  persistPurchaseReception,
  persistReservation,
  persistRestaurantSettings,
  persistTableStatus,
  persistTechnicalRecipe,
  signInOperator,
  signOutOperator,
  type AuthProfile,
  type CashMovementDraft,
  type CustomerDraft,
  type CustomerInteractionDraft,
  type EmployeeDraft,
  type FoodSafetyCheckDraft,
  type InventoryMovementDraft,
  type OperationResult,
  type OperationalDocumentDraft,
  type ProductCatalogDraft,
  type PurchaseReceptionDraft,
  type ReservationDraft,
  type RestaurantSettingsDraft,
  type TechnicalRecipeDraft,
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
  AuditLog,
  CashMovement,
  CashRegister,
  Customer,
  CustomerInteraction,
  Employee,
  FoodSafetyLog,
  FoodSafetyResult,
  InventoryCategory,
  InventoryMovement,
  ModuleId,
  Order,
  OrderStatus,
  OperationalDocument,
  OperationalDocumentType,
  PaymentMethod,
  Product,
  ProductCategory,
  Purchase,
  PurchaseItem,
  RawMaterial,
  Recipe,
  ReportPoint,
  RestaurantTable,
  RestaurantSettings,
  Reservation,
  ReservationStatus,
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

interface DashboardStats {
  totalSales: number;
  activeOrders: number;
  occupiedTables: number;
  stockAlerts: number;
  foodCost: number;
  kitchenAverage: number;
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
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "tables",
    label: "Mesas y salon",
    shortLabel: "Mesas",
    icon: Table2,
    accent: "bg-[var(--udla-orange)] text-white",
  },
  {
    id: "orders",
    label: "Pedidos presenciales",
    shortLabel: "Pedidos",
    icon: Utensils,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "kitchen",
    label: "Cocina en tiempo real",
    shortLabel: "Cocina",
    icon: ChefHat,
    accent: "bg-[var(--udla-orange-dark)] text-white",
  },
  {
    id: "cash",
    label: "Caja",
    shortLabel: "Caja",
    icon: CreditCard,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "products",
    label: "Productos",
    shortLabel: "Productos",
    icon: Salad,
    accent: "bg-[var(--udla-orange)] text-white",
  },
  {
    id: "recipes",
    label: "Recetario tecnico",
    shortLabel: "Recetas",
    icon: BookOpen,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "inventory",
    label: "Inventario y bodega",
    shortLabel: "Bodega",
    icon: Boxes,
    accent: "bg-[var(--udla-orange)] text-white",
  },
  {
    id: "purchases",
    label: "Compras y proveedores",
    shortLabel: "Compras",
    icon: ShoppingCart,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "crm",
    label: "Clientes y reservas",
    shortLabel: "Clientes",
    icon: CalendarCheck,
    accent: "bg-[var(--udla-orange)] text-white",
  },
  {
    id: "documents",
    label: "Impresion y documentos",
    shortLabel: "Documentos",
    icon: Printer,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "reports",
    label: "Reportes",
    shortLabel: "Reportes",
    icon: BarChart3,
    accent: "bg-[var(--udla-orange)] text-white",
  },
  {
    id: "foodSafety",
    label: "Seguridad alimentaria",
    shortLabel: "Seguridad",
    icon: ShieldCheck,
    accent: "bg-[#b73200] text-white",
  },
  {
    id: "employees",
    label: "Trabajadores",
    shortLabel: "Equipo",
    icon: Users,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "audit",
    label: "Auditoria",
    shortLabel: "Auditoria",
    icon: ListChecks,
    accent: "bg-[var(--udla-graphite)] text-white",
  },
  {
    id: "settings",
    label: "Configuracion",
    shortLabel: "Config",
    icon: Settings,
    accent: "bg-[var(--udla-charcoal)] text-white",
  },
  {
    id: "education",
    label: "Modulo educativo",
    shortLabel: "Educacion",
    icon: GraduationCap,
    accent: "bg-[var(--udla-orange)] text-white",
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
  paid: {
    label: "Pagado",
    className: "bg-emerald-100 text-emerald-900",
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
    className: "bg-slate-100 text-slate-900 border-slate-200",
    bar: "bg-[var(--udla-graphite)]",
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
    className: "bg-zinc-100 text-zinc-900 border-zinc-200",
    bar: "bg-[var(--udla-charcoal)]",
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

const foodSafetyResultMeta: Record<
  FoodSafetyResult,
  { label: string; className: string; dot: string }
> = {
  ok: {
    label: "Conforme",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Observacion",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Critico",
    className: "border-red-200 bg-red-50 text-red-900",
    dot: "bg-red-500",
  },
};

const foodSafetyCheckTypes = [
  "Temperatura de recepcion",
  "Temperatura de almacenamiento",
  "Control de vencimiento",
  "FIFO/LIFO y rotulacion",
  "Alergenos y separacion",
  "Limpieza de contenedor",
] as const;

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  debit: "Debito",
  credit: "Credito",
  transfer: "Transferencia",
};

const cashMovementLabels: Record<CashMovementDraft["type"], string> = {
  withdrawal: "Retiro",
  advance: "Adelanto",
  difference: "Diferencia",
};

const reservationStatusMeta: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-900",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-900",
  },
  seated: {
    label: "Sentada",
    className: "bg-sky-100 text-sky-900",
  },
  completed: {
    label: "Completada",
    className: "bg-zinc-200 text-zinc-800",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-100 text-red-900",
  },
  no_show: {
    label: "No show",
    className: "bg-stone-200 text-stone-900",
  },
};

const reservationChannelLabels: Record<Reservation["channel"], string> = {
  phone: "Telefono",
  whatsapp: "WhatsApp",
  web: "Web",
  walk_in: "Walk-in",
};

const customerInteractionLabels: Record<CustomerInteraction["type"], string> = {
  note: "Nota",
  call: "Llamado",
  message: "Mensaje",
  complaint: "Reclamo",
  preference: "Preferencia",
  follow_up: "Seguimiento",
};

const inventoryMovementLabels: Record<InventoryMovement["type"], string> = {
  initial: "Inicial",
  purchase: "Compra",
  sale: "Venta",
  manual_out: "Salida",
  adjustment: "Ajuste",
  waste: "Merma",
};

const employeeStatusMeta: Record<
  Employee["status"],
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Activo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
  },
  break: {
    label: "Pausa",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Fuera",
    className: "border-zinc-200 bg-zinc-100 text-zinc-700",
    dot: "bg-zinc-400",
  },
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
      (order) => !["paid", "cancelled"].includes(order.status),
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

    if (status === "paid") {
      const tableNumber = orderState.find((order) => order.id === orderId)
        ?.tableNumber;
      setTableState((current) =>
        current.map((table) =>
          table.number === tableNumber
            ? {
                ...table,
                status: "cleaning",
                currentOrderId: undefined,
                elapsedMinutes: undefined,
                total: undefined,
              }
            : table,
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
          status:
            order.status === "delivered" || order.status === "paid"
              ? "pending"
              : order.status,
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

  function openCashRegister(openingAmount: number) {
    const openRegister = snapshot.cashRegisters.find(
      (register) => register.status === "open",
    );

    if (openRegister) {
      showOperationResult({
        ok: false,
        message: "Ya existe una caja abierta para este turno.",
      });
      return;
    }

    const now = new Date().toISOString();
    const register: CashRegister = {
      id: `cr-${Date.now()}`,
      openingAmount,
      expectedAmount: openingAmount,
      status: "open",
      openedAt: now,
      openedBy: authProfile?.name ?? role.label,
      notes: "Apertura desde POS",
    };
    const movement = createLocalCashMovement({
      type: "opening",
      method: "internal",
      amount: openingAmount,
      description: "Apertura de caja",
      responsible: register.openedBy,
    });

    setSnapshot((current) => ({
      ...current,
      cashRegisters: [register, ...current.cashRegisters],
      cashMovements: [movement, ...current.cashMovements],
    }));

    if (snapshot.source === "supabase") {
      void persistCashRegisterOpen(openingAmount).then(showOperationResult);
      return;
    }

    showOperationResult({ ok: true, message: "Caja abierta en demo local." });
  }

  function registerCashMovement(movement: CashMovementDraft) {
    const openRegister = snapshot.cashRegisters.find(
      (register) => register.status === "open",
    );

    if (!openRegister) {
      showOperationResult({
        ok: false,
        message: "Abre una caja antes de registrar movimientos.",
      });
      return;
    }

    const signedAmount = normalizeCashAmount(movement.type, movement.amount);
    const localMovement = createLocalCashMovement({
      type: movement.type,
      method: movement.method,
      amount: signedAmount,
      description: movement.description,
      responsible: authProfile?.name ?? role.label,
    });

    setSnapshot((current) => ({
      ...current,
      cashRegisters: current.cashRegisters.map((register) =>
        register.id === openRegister.id
          ? {
              ...register,
              expectedAmount: register.expectedAmount + signedAmount,
            }
          : register,
      ),
      cashMovements: [localMovement, ...current.cashMovements],
    }));

    if (snapshot.source === "supabase") {
      void persistCashMovement(movement).then(showOperationResult);
      return;
    }

    showOperationResult({ ok: true, message: "Movimiento aplicado en demo local." });
  }

  function settleCashOrder({
    orderId,
    method,
    tipAmount,
    discountAmount,
  }: {
    orderId: string;
    method: PaymentMethod;
    tipAmount: number;
    discountAmount: number;
  }) {
    const openRegister = snapshot.cashRegisters.find(
      (register) => register.status === "open",
    );
    const order = orderState.find((item) => item.id === orderId);

    if (!openRegister) {
      showOperationResult({
        ok: false,
        message: "Abre una caja antes de cobrar una cuenta.",
      });
      return;
    }

    if (!order || order.status === "paid" || order.status === "cancelled") {
      showOperationResult({
        ok: false,
        message: "Selecciona una cuenta pendiente de cobro.",
      });
      return;
    }

    const saleAmount = Math.max(0, order.total - discountAmount);
    const updatedOrder: Order = {
      ...order,
      status: "paid",
      paymentMethod: method,
      discount: discountAmount,
      tip: tipAmount,
      total: saleAmount,
    };
    const saleMovement = createLocalCashMovement({
      type: "sale",
      method,
      amount: saleAmount,
      description: `Pago ${order.number}`,
      responsible: authProfile?.name ?? role.label,
    });
    const tipMovement =
      tipAmount > 0
        ? createLocalCashMovement({
            type: "tip",
            method,
            amount: tipAmount,
            description: `Propina ${order.number}`,
            responsible: authProfile?.name ?? role.label,
          })
        : null;
    const newMovements = tipMovement
      ? [tipMovement, saleMovement]
      : [saleMovement];
    const inventoryConsumption = buildInventoryConsumptionForOrder({
      order,
      products: snapshot.products,
      recipes: snapshot.recipes,
      rawMaterials: snapshot.rawMaterials,
      responsible: authProfile?.name ?? role.label,
    });

    setOrderState((current) =>
      current.map((item) => (item.id === order.id ? updatedOrder : item)),
    );
    setTableState((current) =>
      current.map((table) =>
        table.number === order.tableNumber
          ? {
              ...table,
              status: "cleaning",
              currentOrderId: undefined,
              elapsedMinutes: undefined,
              total: undefined,
            }
          : table,
      ),
    );
    setSnapshot((current) => ({
      ...current,
      orders: current.orders.map((item) =>
        item.id === order.id ? updatedOrder : item,
      ),
      tables: current.tables.map((table) =>
        table.number === order.tableNumber
          ? {
              ...table,
              status: "cleaning",
              currentOrderId: undefined,
              elapsedMinutes: undefined,
              total: undefined,
            }
          : table,
      ),
      cashRegisters: current.cashRegisters.map((register) =>
        register.id === openRegister.id
          ? {
              ...register,
              expectedAmount: register.expectedAmount + saleAmount + tipAmount,
            }
          : register,
      ),
      cashMovements: [...newMovements, ...current.cashMovements],
      rawMaterials: inventoryConsumption.rawMaterials,
      inventoryMovements: [
        ...inventoryConsumption.movements,
        ...current.inventoryMovements,
      ],
    }));

    if (snapshot.source === "supabase") {
      void persistCashPayment({
        order,
        method,
        tipAmount,
        discountAmount,
      }).then(showOperationResult);
      return;
    }

    showOperationResult({ ok: true, message: "Cuenta cobrada en demo local." });
  }

  function closeCashRegister(countedAmount: number) {
    const openRegister = snapshot.cashRegisters.find(
      (register) => register.status === "open",
    );

    if (!openRegister) {
      showOperationResult({
        ok: false,
        message: "No hay caja abierta para cerrar.",
      });
      return;
    }

    const closedAt = new Date().toISOString();
    const differenceAmount = countedAmount - openRegister.expectedAmount;
    const differenceMovement =
      differenceAmount !== 0
        ? createLocalCashMovement({
            type: "difference",
            method: "internal",
            amount: differenceAmount,
            description: "Diferencia al cierre",
            responsible: authProfile?.name ?? role.label,
          })
        : null;

    setSnapshot((current) => ({
      ...current,
      cashRegisters: current.cashRegisters.map((register) =>
        register.id === openRegister.id
          ? {
              ...register,
              countedAmount,
              differenceAmount,
              closedAt,
              closedBy: authProfile?.name ?? role.label,
              status: "closed",
            }
          : register,
      ),
      cashMovements: differenceMovement
        ? [differenceMovement, ...current.cashMovements]
        : current.cashMovements,
    }));

    if (snapshot.source === "supabase") {
      void persistCashRegisterClose({
        registerId: openRegister.id,
        expectedAmount: openRegister.expectedAmount,
        countedAmount,
      }).then(showOperationResult);
      return;
    }

    showOperationResult({ ok: true, message: "Caja cerrada en demo local." });
  }

  function registerInventoryMovement(movement: InventoryMovementDraft) {
    const material = snapshot.rawMaterials.find(
      (item) => item.id === movement.rawMaterialId,
    );

    if (!material) {
      showOperationResult({
        ok: false,
        message: "Selecciona una materia prima valida.",
      });
      return;
    }

    const signedQuantity = normalizeInventoryQuantity(
      movement.type,
      movement.quantity,
    );
    const localMovement = createLocalInventoryMovement({
      material,
      type: movement.type,
      quantity: signedQuantity,
      reason: movement.reason,
      responsible: authProfile?.name ?? role.label,
    });

    setSnapshot((current) => ({
      ...current,
      rawMaterials: current.rawMaterials.map((item) =>
        item.id === material.id
          ? { ...item, stock: Math.max(0, item.stock + signedQuantity) }
          : item,
      ),
      inventoryMovements: [localMovement, ...current.inventoryMovements],
    }));

    if (snapshot.source === "supabase") {
      void persistInventoryMovement(movement).then(showOperationResult);
      return;
    }

    showOperationResult({
      ok: true,
      message: "Movimiento de inventario aplicado en demo local.",
    });
  }

  function registerFoodSafetyCheck(check: FoodSafetyCheckDraft) {
    const material = snapshot.rawMaterials.find(
      (item) => item.id === check.rawMaterialId,
    );

    if (!material) {
      showOperationResult({
        ok: false,
        message: "Selecciona una materia prima valida.",
      });
      return;
    }

    if (!check.checkType.trim()) {
      showOperationResult({
        ok: false,
        message: "Selecciona el tipo de control sanitario.",
      });
      return;
    }

    const now = new Date();
    const localLog: FoodSafetyLog = {
      id: createClientId("fsl", snapshot.source),
      rawMaterialId: material.id,
      materialName: material.name,
      checkType: check.checkType,
      measuredTemperature: check.measuredTemperature || "Sin medicion",
      result: check.result,
      notes: check.notes,
      responsible: authProfile?.name ?? role.label,
      time: formatTime(now.toISOString()),
      createdAt: now.toISOString(),
    };

    setSnapshot((current) => ({
      ...current,
      foodSafetyLogs: [localLog, ...current.foodSafetyLogs],
    }));

    if (snapshot.source === "supabase") {
      void persistFoodSafetyCheck(check).then(showOperationResult);
      return;
    }

    showOperationResult({
      ok: true,
      message: "Control sanitario registrado en demo local.",
    });
  }

  function receivePurchase(purchase: PurchaseReceptionDraft) {
    const supplier = snapshot.suppliers.find(
      (item) => item.id === purchase.supplierId,
    );
    const material = snapshot.rawMaterials.find(
      (item) => item.id === purchase.rawMaterialId,
    );

    if (!supplier || !material) {
      showOperationResult({
        ok: false,
        message: "Selecciona proveedor y materia prima validos.",
      });
      return;
    }

    if (
      purchase.quantity <= 0 ||
      purchase.unitCost <= 0 ||
      purchase.yieldPercent <= 0 ||
      purchase.yieldPercent > 100
    ) {
      showOperationResult({
        ok: false,
        message: "Cantidad, costo unitario y rendimiento deben ser validos.",
      });
      return;
    }

    const totalCost = purchase.quantity * purchase.unitCost;
    const now = new Date();
    const purchaseId = `pur-${Date.now()}`;
    const purchaseItem: PurchaseItem = {
      id: `pi-${Date.now()}`,
      purchaseId,
      rawMaterialId: material.id,
      materialName: material.name,
      description: purchase.description,
      quantity: purchase.quantity,
      unit: material.unit,
      unitCost: purchase.unitCost,
      yieldPercent: purchase.yieldPercent,
      totalCost,
      expirationDate: purchase.expirationDate || undefined,
      lot: purchase.lot || undefined,
    };
    const receivedPurchase: Purchase = {
      id: purchaseId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      documentType: purchase.documentType,
      documentNumber: purchase.documentNumber,
      date: now.toISOString().slice(0, 10),
      total: totalCost,
      status: "received",
      items: [purchaseItem],
    };
    const inventoryMovement = createLocalInventoryMovement({
      material,
      type: "purchase",
      quantity: purchase.quantity,
      unitCost: purchase.unitCost / (purchase.yieldPercent / 100),
      reason: `Recepcion compra ${purchase.documentNumber}`,
      responsible: authProfile?.name ?? role.label,
    });

    setSnapshot((current) => ({
      ...current,
      purchases: [receivedPurchase, ...current.purchases],
      purchaseItems: [purchaseItem, ...current.purchaseItems],
      rawMaterials: current.rawMaterials.map((item) =>
        item.id === material.id
          ? {
              ...item,
              supplierId: supplier.id,
              stock: item.stock + purchase.quantity,
              purchaseQuantity: purchase.quantity,
              purchaseCost: totalCost,
              averageYield: purchase.yieldPercent,
              expirationDate: purchase.expirationDate || item.expirationDate,
              lot: purchase.lot || item.lot,
            }
          : item,
      ),
      inventoryMovements: [inventoryMovement, ...current.inventoryMovements],
    }));

    if (snapshot.source === "supabase") {
      void persistPurchaseReception(purchase).then(showOperationResult);
      return;
    }

    showOperationResult({
      ok: true,
      message: "Compra recibida en demo local.",
    });
  }

  function saveTechnicalRecipe(draft: TechnicalRecipeDraft) {
    const validIngredients = draft.ingredients.filter(
      (ingredient) =>
        ingredient.rawMaterialId &&
        ingredient.grossQuantity > 0 &&
        ingredient.yieldPercent > 0 &&
        ingredient.yieldPercent <= 100,
    );

    if (!draft.name.trim() || !draft.category.trim()) {
      showOperationResult({
        ok: false,
        message: "Nombre y categoria de receta son obligatorios.",
      });
      return;
    }

    if (
      draft.portions <= 0 ||
      draft.targetFoodCostPercent <= 0 ||
      draft.salePrice < 0
    ) {
      showOperationResult({
        ok: false,
        message: "Porciones, food cost objetivo y precio deben ser validos.",
      });
      return;
    }

    if (!validIngredients.length) {
      showOperationResult({
        ok: false,
        message: "Agrega al menos un ingrediente con cantidad y rendimiento.",
      });
      return;
    }

    const recipeId =
      draft.id ??
      (snapshot.source === "supabase" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `rec-${Date.now()}`);
    const recipe = buildRecipeFromTechnicalDraft({
      draft: { ...draft, id: recipeId, ingredients: validIngredients },
      rawMaterials: snapshot.rawMaterials,
    });
    const exists = snapshot.recipes.some((item) => item.id === recipeId);

    setSnapshot((current) => ({
      ...current,
      recipes: exists
        ? current.recipes.map((item) => (item.id === recipeId ? recipe : item))
        : [recipe, ...current.recipes],
    }));
    setSelectedRecipeId(recipeId);

    if (snapshot.source === "supabase") {
      void persistTechnicalRecipe({
        ...draft,
        id: recipeId,
        ingredients: validIngredients,
      }).then(showOperationResult);
      return;
    }

    showOperationResult({
      ok: true,
      message: exists
        ? "Receta tecnica actualizada en demo local."
        : "Receta tecnica creada en demo local.",
    });
  }

  function saveProductCatalogItem(draft: ProductCatalogDraft) {
    if (!draft.name.trim() || !draft.categoryId) {
      showOperationResult({
        ok: false,
        message: "Nombre y categoria del producto son obligatorios.",
      });
      return draft.id ?? "";
    }

    if (draft.salePrice < 0 || draft.prepTimeMinutes < 0) {
      showOperationResult({
        ok: false,
        message: "Precio y tiempo de preparacion deben ser validos.",
      });
      return draft.id ?? "";
    }

    const productId = draft.id ?? createClientId("prod", snapshot.source);
    const product = buildProductFromCatalogDraft({
      draft: { ...draft, id: productId },
      recipes: snapshot.recipes,
    });
    const exists = snapshot.products.some((item) => item.id === productId);

    setSnapshot((current) => ({
      ...current,
      products: exists
        ? current.products.map((item) => (item.id === productId ? product : item))
        : [product, ...current.products],
    }));

    if (snapshot.source === "supabase") {
      void persistProductCatalogItem({ ...draft, id: productId }).then(
        showOperationResult,
      );
      return productId;
    }

    showOperationResult({
      ok: true,
      message: exists
        ? "Producto actualizado en demo local."
        : "Producto creado en demo local.",
    });
    return productId;
  }

  function saveEmployeeProfile(draft: EmployeeDraft) {
    if (!draft.name.trim()) {
      showOperationResult({
        ok: false,
        message: "El nombre del trabajador es obligatorio.",
      });
      return draft.id ?? "";
    }

    if (draft.hourlyCost < 0) {
      showOperationResult({
        ok: false,
        message: "El costo horario no puede ser negativo.",
      });
      return draft.id ?? "";
    }

    const employeeId = draft.id ?? createClientId("emp", snapshot.source);
    const employee: Employee = {
      id: employeeId,
      name: draft.name.trim(),
      role: draft.role,
      rut: draft.rut.trim(),
      phone: draft.phone.trim(),
      shift: draft.shift.trim() || "Sin turno",
      hourlyCost: draft.hourlyCost,
      status: draft.status,
      hiredAt: draft.hiredAt || undefined,
      sales: snapshot.employees.find((item) => item.id === employeeId)?.sales ?? 0,
      orders: snapshot.employees.find((item) => item.id === employeeId)?.orders ?? 0,
      kitchenAverage: snapshot.employees.find((item) => item.id === employeeId)
        ?.kitchenAverage,
    };
    const exists = snapshot.employees.some((item) => item.id === employeeId);

    setSnapshot((current) => ({
      ...current,
      employees: exists
        ? current.employees.map((item) =>
            item.id === employeeId ? { ...item, ...employee } : item,
          )
        : [employee, ...current.employees],
    }));

    if (snapshot.source === "supabase") {
      void persistEmployeeProfile({ ...draft, id: employeeId }).then(
        showOperationResult,
      );
      return employeeId;
    }

    showOperationResult({
      ok: true,
      message: exists
        ? "Trabajador actualizado en demo local."
        : "Trabajador creado en demo local.",
    });
    return employeeId;
  }

  function saveCustomerProfile(draft: CustomerDraft) {
    if (!draft.name.trim()) {
      showOperationResult({
        ok: false,
        message: "El nombre del cliente es obligatorio.",
      });
      return draft.id ?? "";
    }

    const customerId = draft.id ?? createClientId("cust", snapshot.source);
    const existingCustomer = snapshot.customers.find(
      (item) => item.id === customerId,
    );
    const now = new Date().toISOString();
    const customer: Customer = {
      id: customerId,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      documentId: draft.documentId.trim(),
      preferences: draft.preferences.trim(),
      allergies: draft.allergies,
      tags: draft.tags,
      visitCount: existingCustomer?.visitCount ?? 0,
      totalSpent: existingCustomer?.totalSpent ?? 0,
      lastVisitAt: existingCustomer?.lastVisitAt,
      notes: draft.notes.trim(),
      createdAt: existingCustomer?.createdAt ?? now,
    };
    const exists = Boolean(existingCustomer);

    setSnapshot((current) => ({
      ...current,
      customers: exists
        ? current.customers.map((item) =>
            item.id === customerId ? customer : item,
          )
        : [customer, ...current.customers],
    }));

    if (snapshot.source === "supabase") {
      void persistCustomerProfile({ ...draft, id: customerId }).then(
        showOperationResult,
      );
      return customerId;
    }

    showOperationResult({
      ok: true,
      message: exists
        ? "Cliente actualizado en demo local."
        : "Cliente creado en demo local.",
    });
    return customerId;
  }

  function saveReservation(draft: ReservationDraft) {
    const customer = snapshot.customers.find(
      (item) => item.id === draft.customerId,
    );
    const table = draft.tableId
      ? tableState.find((item) => item.id === draft.tableId)
      : undefined;
    const assignedEmployee = draft.assignedTo
      ? snapshot.employees.find((item) => item.id === draft.assignedTo)
      : undefined;

    if (!customer) {
      showOperationResult({
        ok: false,
        message: "Selecciona un cliente para la reserva.",
      });
      return draft.id ?? "";
    }

    if (!draft.date || !draft.time || draft.partySize <= 0) {
      showOperationResult({
        ok: false,
        message: "Fecha, hora y cantidad de comensales son obligatorias.",
      });
      return draft.id ?? "";
    }

    const reservationId = draft.id ?? createClientId("res", snapshot.source);
    const existingReservation = snapshot.reservations.find(
      (item) => item.id === reservationId,
    );
    const reservation: Reservation = {
      id: reservationId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      tableId: table?.id,
      tableNumber: table?.number,
      partySize: draft.partySize,
      date: draft.date,
      time: draft.time,
      status: draft.status,
      channel: draft.channel,
      occasion: draft.occasion.trim(),
      notes: draft.notes.trim(),
      assignedTo: assignedEmployee?.name ?? authProfile?.name ?? role.label,
      createdAt: existingReservation?.createdAt ?? new Date().toISOString(),
    };
    const exists = Boolean(existingReservation);

    setSnapshot((current) => ({
      ...current,
      reservations: exists
        ? current.reservations.map((item) =>
            item.id === reservationId ? reservation : item,
          )
        : [reservation, ...current.reservations],
      tables:
        table && ["pending", "confirmed"].includes(draft.status)
          ? current.tables.map((item) =>
              item.id === table.id ? { ...item, status: "reserved" } : item,
            )
          : current.tables,
    }));

    if (table && ["pending", "confirmed"].includes(draft.status)) {
      setTableState((current) =>
        current.map((item) =>
          item.id === table.id ? { ...item, status: "reserved" } : item,
        ),
      );
    }

    if (snapshot.source === "supabase") {
      void persistReservation({ ...draft, id: reservationId }).then(
        showOperationResult,
      );
      return reservationId;
    }

    showOperationResult({
      ok: true,
      message: exists
        ? "Reserva actualizada en demo local."
        : "Reserva creada en demo local.",
    });
    return reservationId;
  }

  function registerCustomerInteraction(interaction: CustomerInteractionDraft) {
    const customer = snapshot.customers.find(
      (item) => item.id === interaction.customerId,
    );

    if (!customer || !interaction.summary.trim()) {
      showOperationResult({
        ok: false,
        message: "Selecciona cliente y escribe un resumen de seguimiento.",
      });
      return;
    }

    const now = new Date().toISOString();
    const localInteraction: CustomerInteraction = {
      id: createClientId("ci", snapshot.source),
      customerId: customer.id,
      customerName: customer.name,
      type: interaction.type,
      summary: interaction.summary.trim(),
      dueAt: interaction.dueAt || undefined,
      completedAt: interaction.completed ? now : undefined,
      responsible: authProfile?.name ?? role.label,
      createdAt: now,
    };

    setSnapshot((current) => ({
      ...current,
      customerInteractions: [
        localInteraction,
        ...current.customerInteractions,
      ],
    }));

    if (snapshot.source === "supabase") {
      void persistCustomerInteraction(interaction).then(showOperationResult);
      return;
    }

    showOperationResult({
      ok: true,
      message: "Seguimiento CRM registrado en demo local.",
    });
  }

  function generateOperationalDocument(draft: OperationalDocumentDraft) {
    if (!draft.title.trim()) {
      showOperationResult({
        ok: false,
        message: "El documento debe tener un titulo valido.",
      });
      return "";
    }

    const now = new Date().toISOString();
    const order = draft.orderId
      ? orderState.find((item) => item.id === draft.orderId)
      : undefined;
    const document: OperationalDocument = {
      id: createClientId("doc", snapshot.source),
      type: draft.type,
      title: draft.title.trim(),
      orderId: draft.orderId,
      orderNumber: order?.number,
      cashRegisterId: draft.cashRegisterId,
      reservationId: draft.reservationId,
      payload: draft.payload,
      printedBy: authProfile?.name ?? role.label,
      printedAt: now,
      createdAt: now,
    };

    setSnapshot((current) => ({
      ...current,
      operationalDocuments: [document, ...current.operationalDocuments],
    }));

    if (snapshot.source === "supabase") {
      void persistOperationalDocument(draft).then(showOperationResult);
      return document.id;
    }

    showOperationResult({
      ok: true,
      message: "Documento operativo generado en demo local.",
    });
    return document.id;
  }

  function saveRestaurantSettings(draft: RestaurantSettingsDraft) {
    if (!draft.restaurantName.trim() || !draft.legalName.trim()) {
      showOperationResult({
        ok: false,
        message: "Nombre comercial y razon social son obligatorios.",
      });
      return;
    }

    const settings: RestaurantSettings = {
      ...draft,
      restaurantName: draft.restaurantName.trim(),
      academyName: draft.academyName.trim(),
      legalName: draft.legalName.trim(),
      taxId: draft.taxId.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      logoUrl: getSafeLogoUrl(draft.logoUrl),
      serviceChargePercent: Math.max(0, draft.serviceChargePercent),
      taxPercent: Math.max(0, draft.taxPercent),
      updatedAt: new Date().toISOString(),
    };

    setSnapshot((current) => ({
      ...current,
      settings,
    }));

    if (snapshot.source === "supabase") {
      void persistRestaurantSettings(settings).then(showOperationResult);
      return;
    }

    showOperationResult({
      ok: true,
      message: "Configuracion actualizada en demo local.",
    });
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
            onModuleSelect={setActiveModule}
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
        return (
          <CashModule
            orders={orderState}
            onOpenRegister={openCashRegister}
            onRegisterMovement={registerCashMovement}
            onSettleOrder={settleCashOrder}
            onCloseRegister={closeCashRegister}
          />
        );
      case "products":
        return (
          <ProductsModule
            products={snapshot.products}
            productCategories={snapshot.productCategories}
            recipes={snapshot.recipes}
            rawMaterials={snapshot.rawMaterials}
            onAddProduct={addProductToSelectedOrder}
            onSaveProduct={saveProductCatalogItem}
          />
        );
      case "recipes":
        return (
          <RecipesModule
            selectedRecipeId={selectedRecipeId}
            onSelectRecipe={setSelectedRecipeId}
            onSaveRecipe={saveTechnicalRecipe}
            selectedRecipe={selectedRecipe}
            recipeSummary={recipeSummary}
            recipes={snapshot.recipes}
            rawMaterials={snapshot.rawMaterials}
          />
        );
      case "inventory":
        return (
          <InventoryModule
            onRegisterMovement={registerInventoryMovement}
          />
        );
      case "purchases":
        return <PurchasesModule onReceivePurchase={receivePurchase} />;
      case "crm":
        return (
          <CrmModule
            tables={tableState}
            onSaveCustomer={saveCustomerProfile}
            onSaveReservation={saveReservation}
            onRegisterInteraction={registerCustomerInteraction}
          />
        );
      case "documents":
        return <DocumentsModule onGenerateDocument={generateOperationalDocument} />;
      case "reports":
        return <ReportsModule />;
      case "foodSafety":
        return <FoodSafetyModule onRegisterCheck={registerFoodSafetyCheck} />;
      case "employees":
        return <EmployeesModule onSaveEmployee={saveEmployeeProfile} />;
      case "audit":
        return <AuditModule />;
      case "settings":
        return <SettingsModule onSaveSettings={saveRestaurantSettings} />;
      case "education":
        return <EducationModule />;
    }
  }

  return (
    <RestaurantDataContext.Provider value={snapshot}>
      <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen overflow-x-hidden bg-[var(--udla-soft)] text-[var(--udla-charcoal)] transition-colors dark:bg-[#101112] dark:text-zinc-100">
        <header className="sticky top-0 z-30 border-b-4 border-[var(--udla-orange)] bg-white/95 shadow-sm backdrop-blur dark:bg-[#171a21]/95">
          <div className="flex min-w-0 flex-col gap-4 px-4 py-4 lg:px-6">
            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-14 w-44 shrink-0 items-center justify-center rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/10 dark:ring-[var(--udla-orange)]/50">
                  <Image
                    src={getSafeLogoUrl(snapshot.settings.logoUrl)}
                    alt={`Logo ${snapshot.settings.academyName}`}
                    width={160}
                    height={45}
                    className="h-auto max-h-10 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-300">
                    {snapshot.settings.academyName}
                  </p>
                  <h1 className="text-xl font-semibold md:text-2xl">
                    {snapshot.settings.restaurantName}
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
                      ? "border-[var(--udla-orange)] bg-[var(--udla-orange)] text-white shadow-sm"
                      : "border-black/10 bg-white text-zinc-700 hover:border-[var(--udla-orange)] hover:text-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
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
                        ? "bg-[var(--udla-orange)] text-white shadow-sm"
                        : "bg-transparent text-zinc-700 hover:bg-[var(--udla-orange-soft)] hover:text-[var(--udla-orange)] dark:text-zinc-200 dark:hover:bg-[#241a16]"
                    } ${allowed ? "" : "opacity-50"}`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[var(--udla-orange-soft)] text-[var(--udla-orange)] dark:bg-[#2a1d18]"
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

function createLocalCashMovement({
  type,
  method,
  amount,
  description,
  responsible,
}: {
  type: CashMovement["type"];
  method: CashMovement["method"];
  amount: number;
  description: string;
  responsible: string;
}): CashMovement {
  return {
    id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    method,
    amount,
    description,
    responsible,
    time: new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
  };
}

function normalizeCashAmount(type: CashMovement["type"], amount: number) {
  if (type === "withdrawal" || type === "advance") {
    return -Math.abs(amount);
  }

  return amount;
}

function createLocalInventoryMovement({
  material,
  type,
  quantity,
  unitCost,
  reason,
  responsible,
}: {
  material: RawMaterial;
  type: InventoryMovement["type"];
  quantity: number;
  unitCost?: number;
  reason: string;
  responsible: string;
}): InventoryMovement {
  const now = new Date();

  return {
    id: `im-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    rawMaterialId: material.id,
    materialName: material.name,
    type,
    quantity,
    unitCost: unitCost ?? calculateRealNetUnitCost(material),
    reason,
    responsible,
    time: new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
    createdAt: now.toISOString(),
  };
}

function normalizeInventoryQuantity(
  type: InventoryMovementDraft["type"],
  quantity: number,
) {
  if (type === "manual_out" || type === "waste") {
    return -Math.abs(quantity);
  }

  return quantity;
}

function buildInventoryConsumptionForOrder({
  order,
  products,
  recipes,
  rawMaterials,
  responsible,
}: {
  order: Order;
  products: Product[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  responsible: string;
}) {
  const consumedByMaterial = new Map<string, number>();

  order.items.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const recipe = product?.recipeId
      ? recipes.find((candidate) => candidate.id === product.recipeId)
      : undefined;

    if (!recipe) {
      return;
    }

    recipe.ingredients.forEach((ingredient) => {
      const quantityPerPortion = ingredient.grossQuantity / recipe.portions;
      const consumedQuantity = item.quantity * quantityPerPortion;
      consumedByMaterial.set(
        ingredient.rawMaterialId,
        (consumedByMaterial.get(ingredient.rawMaterialId) ?? 0) +
          consumedQuantity,
      );
    });
  });

  const movements = Array.from(consumedByMaterial.entries())
    .map(([rawMaterialId, quantity]) => {
      const material = rawMaterials.find((item) => item.id === rawMaterialId);

      if (!material || quantity <= 0) {
        return null;
      }

      return createLocalInventoryMovement({
        material,
        type: "sale",
        quantity: -quantity,
        reason: `Consumo por venta ${order.number}`,
        responsible,
      });
    })
    .filter((movement): movement is InventoryMovement => Boolean(movement));

  return {
    movements,
    rawMaterials: rawMaterials.map((material) => {
      const consumedQuantity = consumedByMaterial.get(material.id) ?? 0;

      if (consumedQuantity <= 0) {
        return material;
      }

      return {
        ...material,
        stock: Math.max(0, material.stock - consumedQuantity),
      };
    }),
  };
}

function DashboardModule({
  stats,
  orders,
  tables,
  onModuleSelect,
}: {
  stats: DashboardStats;
  orders: Order[];
  tables: RestaurantTable[];
  onModuleSelect: (moduleId: ModuleId) => void;
}) {
  const latestOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operacion en vivo"
        title="Control comercial, academico y productivo"
        description="Vista ejecutiva para coordinar salon, cocina, caja, inventario, costos y seguridad alimentaria."
      />

      <VisualOperationsStrip
        stats={stats}
        tables={tables}
        onModuleSelect={onModuleSelect}
      />

      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 xl:grid-cols-6">
        <DashboardMiniMetric
          label="Ventas"
          value={formatCurrency(stats.totalSales)}
          icon={BadgeDollarSign}
          tone="bg-emerald-600"
        />
        <DashboardMiniMetric
          label="Pedidos"
          value={stats.activeOrders.toString()}
          icon={ReceiptText}
          tone="bg-amber-500"
        />
        <DashboardMiniMetric
          label="Mesas"
          value={`${stats.occupiedTables}/${tables.length}`}
          icon={Table2}
          tone="bg-red-600"
        />
        <DashboardMiniMetric
          label="Food cost"
          value={formatPercent(stats.foodCost)}
          icon={Calculator}
          tone="bg-[var(--udla-charcoal)]"
        />
        <DashboardMiniMetric
          label="Cocina"
          value={`${stats.kitchenAverage} min`}
          icon={Clock}
          tone="bg-[var(--udla-orange)]"
        />
        <DashboardMiniMetric
          label="Stock"
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
          <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-3 2xl:grid-cols-4">
            {tables.map((table) => {
              const meta = tableStatusMeta[table.status];
              const selected = selectedTable.id === table.id;

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelect(table.id)}
                  className={`min-h-[94px] rounded-lg border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md md:min-h-[154px] md:p-4 ${meta.className} ${
                    selected ? "ring-2 ring-zinc-950 dark:ring-white" : ""
                  }`}
                >
                  <div className="flex h-full min-h-[78px] flex-col justify-between md:min-h-[122px]">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium uppercase leading-none opacity-80 md:text-sm md:normal-case md:leading-normal">
                          {table.zone}
                        </p>
                        <p className="mt-1 text-base font-semibold leading-tight md:text-3xl">
                          Mesa {table.number}
                        </p>
                      </div>
                      <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full md:h-3 md:w-3 ${meta.dot}`} />
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-1 text-[11px] font-semibold leading-tight md:mt-6 md:text-sm">
                      <span className="md:hidden">{table.seats}p</span>
                      <span className="hidden md:inline">{table.seats} puestos</span>
                      <span className="truncate text-right">{meta.label}</span>
                    </div>

                    <div className="hidden md:block">
                      <p className="mt-2 text-sm opacity-80">Mesero: {table.server}</p>
                      {table.total ? (
                        <p className="mt-1 text-sm font-semibold">
                          Cuenta: {formatCurrency(table.total)}
                        </p>
                      ) : null}
                    </div>
                  </div>
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
  const kitchenOrders = orders.filter(
    (order) => !["delivered", "paid", "cancelled"].includes(order.status),
  );

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
                  className="h-11 rounded-lg bg-[var(--udla-charcoal)] text-sm font-semibold text-white hover:bg-[var(--udla-graphite)]"
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

function CashModule({
  orders,
  onOpenRegister,
  onRegisterMovement,
  onSettleOrder,
  onCloseRegister,
}: {
  orders: Order[];
  onOpenRegister: (openingAmount: number) => void;
  onRegisterMovement: (movement: CashMovementDraft) => void;
  onSettleOrder: (payload: {
    orderId: string;
    method: PaymentMethod;
    tipAmount: number;
    discountAmount: number;
  }) => void;
  onCloseRegister: (countedAmount: number) => void;
}) {
  const { cashMovements, cashRegisters } = useRestaurantData();
  const openRegister = cashRegisters.find((register) => register.status === "open");
  const payableOrders = orders.filter(
    (order) => !["paid", "cancelled"].includes(order.status),
  );
  const [openingAmount, setOpeningAmount] = useState("120000");
  const [movementType, setMovementType] =
    useState<CashMovementDraft["type"]>("withdrawal");
  const [movementMethod, setMovementMethod] =
    useState<PaymentMethod | "internal">("cash");
  const [movementAmount, setMovementAmount] = useState("10000");
  const [movementDescription, setMovementDescription] =
    useState("Retiro operativo");
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [tipAmount, setTipAmount] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [countedAmount, setCountedAmount] = useState("");
  const selectedPaymentOrder =
    payableOrders.find((order) => order.id === paymentOrderId) ?? payableOrders[0];
  const saleMovements = cashMovements.filter((movement) => movement.type === "sale");
  const tipMovements = cashMovements.filter((movement) => movement.type === "tip");
  const totals = cashMovements.reduce(
    (acc, movement) => {
      if (movement.method !== "internal") {
        acc[movement.method] += movement.amount;
      }
      return acc;
    },
    { cash: 0, debit: 0, credit: 0, transfer: 0 } as Record<PaymentMethod, number>,
  );
  const parsedDiscount = parseCurrencyInput(discountAmount);
  const parsedTip = parseCurrencyInput(tipAmount);
  const payableAmount = selectedPaymentOrder
    ? Math.max(0, selectedPaymentOrder.total - parsedDiscount) + parsedTip
    : 0;
  const countedValue = countedAmount
    ? parseCurrencyInput(countedAmount)
    : openRegister?.expectedAmount ?? 0;
  const differencePreview = openRegister
    ? countedValue - openRegister.expectedAmount
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Caja y pagos"
        title="Apertura, cobro, movimientos y cierre"
        description="Controla efectivo inicial, ventas por metodo, propinas, retiros, adelantos y diferencias de caja por turno."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Estado de caja"
          value={openRegister ? "Abierta" : "Cerrada"}
          icon={Archive}
          tone={openRegister ? "bg-emerald-600" : "bg-zinc-900"}
        />
        <MetricCard
          label="Esperado turno"
          value={formatCurrency(openRegister?.expectedAmount ?? 0)}
          icon={BadgeDollarSign}
          tone="bg-[var(--udla-charcoal)]"
        />
        <MetricCard
          label="Ventas registradas"
          value={formatCurrency(
            saleMovements.reduce((total, movement) => total + movement.amount, 0),
          )}
          icon={ReceiptText}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Propinas"
          value={formatCurrency(
            tipMovements.reduce((total, movement) => total + movement.amount, 0),
          )}
          icon={BadgeDollarSign}
          tone="bg-amber-500"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Turno de caja" icon={Archive}>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoPill
              label="Apertura"
              value={
                openRegister
                  ? `${formatCurrency(openRegister.openingAmount)} · ${formatTime(openRegister.openedAt)}`
                  : "Sin caja abierta"
              }
            />
            <InfoPill
              label="Responsable"
              value={openRegister?.openedBy ?? "Pendiente"}
            />
            <InfoPill
              label="Conteo actual"
              value={formatCurrency(countedValue)}
            />
            <InfoPill
              label="Diferencia"
              value={formatCurrency(differencePreview)}
            />
          </div>

          {!openRegister ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onOpenRegister(parseCurrencyInput(openingAmount));
              }}
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
            >
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Efectivo inicial
                </span>
                <input
                  value={openingAmount}
                  onChange={(event) => setOpeningAmount(event.target.value)}
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <button
                type="submit"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                <Archive className="h-4 w-4" />
                Abrir caja
              </button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onCloseRegister(countedValue);
              }}
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
            >
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Efectivo contado
                </span>
                <input
                  value={countedAmount}
                  onChange={(event) => setCountedAmount(event.target.value)}
                  inputMode="numeric"
                  placeholder={String(openRegister.expectedAmount)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <button
                type="submit"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                <ClipboardCheck className="h-4 w-4" />
                Cerrar caja
              </button>
            </form>
          )}
        </Panel>

        <Panel title="Cobrar cuenta presencial" icon={CreditCard}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedPaymentOrder) {
                return;
              }

              onSettleOrder({
                orderId: selectedPaymentOrder.id,
                method: paymentMethod,
                tipAmount: parsedTip,
                discountAmount: parsedDiscount,
              });
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Cuenta
                </span>
                <select
                  value={selectedPaymentOrder?.id ?? ""}
                  onChange={(event) => setPaymentOrderId(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  {payableOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Mesa {order.tableNumber} · {order.number}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Descuento
                </span>
                <input
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(event.target.value)}
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Propina
                </span>
                <input
                  value={tipAmount}
                  onChange={(event) => setTipAmount(event.target.value)}
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              {Object.entries(paymentLabels).map(([method, label]) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method as PaymentMethod)}
                  className={`h-11 rounded-lg border px-3 text-sm font-semibold transition ${
                    paymentMethod === method
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-black/10 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Total a cobrar
                </p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(payableAmount)}
                </p>
              </div>
              <button
                type="submit"
                disabled={!selectedPaymentOrder || !openRegister}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                Cobrar cuenta
              </button>
            </div>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Movimiento manual" icon={BadgeDollarSign}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onRegisterMovement({
                type: movementType,
                method: movementMethod,
                amount: parseCurrencyInput(movementAmount),
                description: movementDescription,
              });
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Tipo
                </span>
                <select
                  value={movementType}
                  onChange={(event) =>
                    setMovementType(event.target.value as CashMovementDraft["type"])
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  {Object.entries(cashMovementLabels).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Metodo
                </span>
                <select
                  value={movementMethod}
                  onChange={(event) =>
                    setMovementMethod(event.target.value as PaymentMethod | "internal")
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="cash">Efectivo</option>
                  <option value="debit">Debito</option>
                  <option value="credit">Credito</option>
                  <option value="transfer">Transferencia</option>
                  <option value="internal">Interno</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Monto
              </span>
              <input
                value={movementAmount}
                onChange={(event) => setMovementAmount(event.target.value)}
                inputMode="numeric"
                className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Descripcion
              </span>
              <input
                value={movementDescription}
                onChange={(event) => setMovementDescription(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>
            <button
              type="submit"
              disabled={!openRegister}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950"
            >
              <ReceiptText className="h-4 w-4" />
              Registrar movimiento
            </button>
          </form>
        </Panel>

        <Panel title="Historial de movimientos" icon={ReceiptText}>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            {Object.entries(totals).map(([method, amount]) => (
              <InfoPill
                key={method}
                label={paymentLabels[method as PaymentMethod]}
                value={formatCurrency(amount)}
              />
            ))}
          </div>
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
                  <p className="text-sm text-zinc-500">
                    {movement.responsible} ·{" "}
                    {movement.method === "internal"
                      ? "Interno"
                      : paymentLabels[movement.method]}
                  </p>
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
  productCategories,
  recipes,
  rawMaterials,
  onAddProduct,
  onSaveProduct,
}: {
  products: Product[];
  productCategories: ProductCategory[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  onAddProduct: (product: Product) => void;
  onSaveProduct: (product: ProductCatalogDraft) => string;
}) {
  const [editor, setEditor] = useState<ProductCatalogDraft>(() =>
    productToCatalogDraft(products[0], productCategories, recipes),
  );
  const [modifiersInput, setModifiersInput] = useState(
    () => products[0]?.modifiers.join(", ") ?? "",
  );
  const selectedRecipe = editor.recipeId
    ? recipes.find((recipe) => recipe.id === editor.recipeId)
    : undefined;
  const selectedCategory =
    productCategories.find((category) => category.id === editor.categoryId) ??
    productCategories[0];
  const linkedProducts = products.filter((product) => product.recipeId).length;
  const availableProducts = products.filter((product) => product.available).length;
  const unavailableProducts = products.length - availableProducts;
  const averagePrepTime = products.length
    ? Math.round(
        products.reduce((total, product) => total + product.prepTimeMinutes, 0) /
          products.length,
      )
    : 0;
  const recipeSummary = selectedRecipe
    ? calculateRecipeSummary(
        { ...selectedRecipe, salePrice: editor.salePrice },
        rawMaterials,
      )
    : null;
  const suggestedDelta = recipeSummary
    ? editor.salePrice - recipeSummary.suggestedPrice
    : 0;

  function updateEditor<K extends keyof ProductCatalogDraft>(
    key: K,
    value: ProductCatalogDraft[K],
  ) {
    setEditor((current) => ({ ...current, [key]: value }));
  }

  function loadProduct(product: Product) {
    setEditor(productToCatalogDraft(product, productCategories, recipes));
    setModifiersInput(product.modifiers.join(", "));
  }

  function startNewProduct() {
    const category = productCategories[0];
    const recipe = recipes[0];

    setEditor({
      name: "Nuevo producto",
      categoryId: category?.id ?? "",
      recipeId: recipe?.id,
      description: "Descripcion comercial del producto.",
      imageUrl:
        recipe?.image ??
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
      salePrice: recipe?.salePrice || 12000,
      isAvailable: true,
      prepTimeMinutes: recipe?.prepTimeMinutes ?? 15,
      customizationOptions: ["Sin cebolla", "Extra queso"],
    });
    setModifiersInput("Sin cebolla, Extra queso");
  }

  function selectRecipe(recipeId: string) {
    const recipe = recipes.find((item) => item.id === recipeId);

    updateEditor("recipeId", recipeId || undefined);

    if (!recipe) {
      return;
    }

    setEditor((current) => ({
      ...current,
      recipeId: recipe.id,
      imageUrl: current.imageUrl || recipe.image,
      prepTimeMinutes: recipe.prepTimeMinutes,
      salePrice: current.salePrice || recipe.salePrice,
    }));
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Carta y disponibilidad"
        title="Productos y carta editable"
        description="Administra productos de venta, precios, disponibilidad, receta asociada, tiempos de preparacion y opciones de personalizacion."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Productos"
          value={products.length.toString()}
          icon={Salad}
          tone="bg-lime-600"
        />
        <MetricCard
          label="Disponibles"
          value={availableProducts.toString()}
          icon={ClipboardCheck}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Sin venta"
          value={unavailableProducts.toString()}
          icon={AlertTriangle}
          tone="bg-red-600"
        />
        <MetricCard
          label="Con receta"
          value={`${linkedProducts}/${products.length}`}
          icon={BookOpen}
          tone="bg-[var(--udla-orange)]"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Editor de producto" icon={Salad}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const savedId = onSaveProduct({
                ...editor,
                customizationOptions: parseListInput(modifiersInput),
              });

              if (savedId) {
                updateEditor("id", savedId);
              }
            }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Producto seleccionado
                </p>
                <p className="text-xl font-semibold">{editor.name}</p>
              </div>
              <button
                type="button"
                onClick={startNewProduct}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-lime-600 px-4 text-sm font-semibold text-white transition hover:bg-lime-700"
              >
                <PackagePlus className="h-4 w-4" />
                Nuevo producto
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_180px_170px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Nombre
                </span>
                <input
                  value={editor.name}
                  onChange={(event) => updateEditor("name", event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Categoria
                </span>
                <select
                  value={editor.categoryId}
                  onChange={(event) =>
                    updateEditor("categoryId", event.target.value)
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
                >
                  {productCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  checked={editor.isAvailable}
                  onChange={(event) =>
                    updateEditor("isAvailable", event.target.checked)
                  }
                  className="h-5 w-5 rounded border-black/20"
                />
                <span className="text-sm font-semibold">Disponible para venta</span>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Receta tecnica
                </span>
                <select
                  value={editor.recipeId ?? ""}
                  onChange={(event) => selectRecipe(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="">Sin receta vinculada</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Precio venta
                </span>
                <input
                  value={editor.salePrice}
                  onChange={(event) =>
                    updateEditor("salePrice", parseCurrencyInput(event.target.value))
                  }
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Tiempo min
                </span>
                <input
                  value={editor.prepTimeMinutes}
                  onChange={(event) =>
                    updateEditor(
                      "prepTimeMinutes",
                      Math.max(0, Math.round(parseQuantityInput(event.target.value))),
                    )
                  }
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Imagen
              </span>
              <input
                value={editor.imageUrl}
                onChange={(event) => updateEditor("imageUrl", event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Descripcion
              </span>
              <textarea
                value={editor.description}
                onChange={(event) =>
                  updateEditor("description", event.target.value)
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Opciones de personalizacion
              </span>
              <input
                value={modifiersInput}
                onChange={(event) => setModifiersInput(event.target.value)}
                placeholder="Sin cebolla, Extra queso, Punto medio"
                className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-lime-600 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <div className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-4">
              <InfoPill
                label="Categoria"
                value={selectedCategory?.name ?? "Sin categoria"}
              />
              <InfoPill
                label="Costo por porcion"
                value={
                  recipeSummary
                    ? formatCurrency(recipeSummary.costPerPortion)
                    : "Sin receta"
                }
              />
              <InfoPill
                label="Food cost"
                value={
                  recipeSummary
                    ? formatPercent(recipeSummary.foodCostPercent)
                    : "Sin receta"
                }
              />
              <InfoPill
                label="Vs sugerido"
                value={
                  recipeSummary ? formatCurrency(suggestedDelta) : "Sin receta"
                }
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <ClipboardCheck className="h-4 w-4" />
              Guardar producto
            </button>
          </form>
        </Panel>

        <Panel title="Carta operativa" icon={ShoppingCart}>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <InfoPill label="Tiempo promedio" value={`${averagePrepTime} min`} />
            <InfoPill
              label="Categorias"
              value={productCategories.length.toString()}
            />
          </div>
          <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
            {products.map((product) => {
              const category = productCategories.find(
                (item) => item.id === product.categoryId,
              );
              const recipe = product.recipeId
                ? recipes.find((item) => item.id === product.recipeId)
                : undefined;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => loadProduct(product)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    editor.id === product.id
                      ? "border-lime-500 bg-lime-50 dark:bg-lime-950/30"
                      : "border-black/10 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900"
                  }`}
                >
                  <div className="grid gap-3 sm:grid-cols-[72px_1fr_110px]">
                    <span className="relative h-16 w-full overflow-hidden rounded-md">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="72px"
                        className="object-cover"
                      />
                    </span>
                    <span>
                      <span className="block font-semibold">{product.name}</span>
                      <span className="mt-1 block text-sm text-zinc-500">
                        {category?.name ?? "Sin categoria"} ·{" "}
                        {recipe?.name ?? "Sin receta"}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1">
                        {product.modifiers.slice(0, 3).map((modifier) => (
                          <span
                            key={modifier}
                            className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            {modifier}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="text-left sm:text-right">
                      <span className="block font-semibold">
                        {formatCurrency(product.price)}
                      </span>
                      <span
                        className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                          product.available
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {product.available ? "Disponible" : "Pausado"}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="space-y-2">
            <ProductTile
              product={product}
              onAdd={() => onAddProduct(product)}
              expanded
            />
            <button
              type="button"
              onClick={() => loadProduct(product)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900"
            >
              <Calculator className="h-4 w-4" />
              Editar carta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipesModule({
  selectedRecipeId,
  onSelectRecipe,
  onSaveRecipe,
  selectedRecipe,
  recipeSummary,
  recipes,
  rawMaterials,
}: {
  selectedRecipeId: string;
  onSelectRecipe: (recipeId: string) => void;
  onSaveRecipe: (recipe: TechnicalRecipeDraft) => void;
  selectedRecipe: Recipe;
  recipeSummary: ReturnType<typeof calculateRecipeSummary>;
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
}) {
  const [editor, setEditor] = useState<TechnicalRecipeDraft>(() =>
    recipeToTechnicalDraft(selectedRecipe),
  );
  const [allergensInput, setAllergensInput] = useState(() =>
    selectedRecipe.allergens.join(", "),
  );
  const [newIngredientMaterialId, setNewIngredientMaterialId] = useState(
    rawMaterials[0]?.id ?? "",
  );
  const [newIngredientGrossQuantity, setNewIngredientGrossQuantity] =
    useState("100");
  const [newIngredientYieldPercent, setNewIngredientYieldPercent] =
    useState("100");
  const [newIngredientWasteType, setNewIngredientWasteType] =
    useState("Sin merma");
  const editorRecipe = buildRecipeFromTechnicalDraft({
    draft: {
      ...editor,
      allergens: parseListInput(allergensInput),
      ingredients: editor.ingredients,
    },
    rawMaterials,
  });
  const editorSummary = calculateRecipeSummary(editorRecipe, rawMaterials);

  function loadRecipe(recipe: Recipe) {
    onSelectRecipe(recipe.id);
    setEditor(recipeToTechnicalDraft(recipe));
    setAllergensInput(recipe.allergens.join(", "));
  }

  function startNewRecipe() {
    const firstMaterial = rawMaterials[0];

    setEditor({
      name: "Nueva receta tecnica",
      category: "Fondo caliente",
      portions: 4,
      prepTimeMinutes: 20,
      photoUrl:
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
      procedure: "Describir procedimiento tecnico estandarizado.",
      allergens: [],
      observations: "Registrar puntos criticos de preparacion y servicio.",
      targetFoodCostPercent: 30,
      salePrice: 12000,
      ingredients: firstMaterial
        ? [
            {
              rawMaterialId: firstMaterial.id,
              unit: firstMaterial.unit,
              grossQuantity: 100,
              yieldPercent: firstMaterial.averageYield,
              wasteType: "Sin merma",
            },
          ]
        : [],
    });
    setAllergensInput("");
  }

  function updateEditor<K extends keyof TechnicalRecipeDraft>(
    key: K,
    value: TechnicalRecipeDraft[K],
  ) {
    setEditor((current) => ({ ...current, [key]: value }));
  }

  function updateIngredient(
    index: number,
    patch: Partial<TechnicalRecipeDraft["ingredients"][number]>,
  ) {
    setEditor((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }));
  }

  function addIngredient() {
    const material = rawMaterials.find(
      (item) => item.id === newIngredientMaterialId,
    );

    if (!material) {
      return;
    }

    setEditor((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        {
          rawMaterialId: material.id,
          unit: material.unit,
          grossQuantity: parseQuantityInput(newIngredientGrossQuantity),
          yieldPercent: parseQuantityInput(newIngredientYieldPercent) || 100,
          wasteType: newIngredientWasteType || "Sin merma",
        },
      ],
    }));
    setNewIngredientGrossQuantity("100");
    setNewIngredientYieldPercent(formatDecimalInput(material.averageYield));
    setNewIngredientWasteType("Sin merma");
  }

  function removeIngredient(index: number) {
    setEditor((current) => ({
      ...current,
      ingredients: current.ingredients.filter(
        (_ingredient, ingredientIndex) => ingredientIndex !== index,
      ),
    }));
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Costeo profesional"
        title="Recetario tecnico editable"
        description="Crea y ajusta recetas profesionales con ingredientes, rendimiento, merma, procedimiento, alergenos, food cost y precio sugerido."
      />

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Panel title="Recetas" icon={BookOpen}>
          <button
            type="button"
            onClick={startNewRecipe}
            className="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--udla-orange)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--udla-orange-dark)]"
          >
            <PackagePlus className="h-4 w-4" />
            Nueva receta
          </button>
          <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => loadRecipe(recipe)}
                className={`flex min-h-20 w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                  selectedRecipeId === recipe.id
                    ? "border-[var(--udla-orange)] bg-[var(--udla-orange-soft)] dark:bg-[#241a16]"
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

          <Panel title="Editor tecnico de receta" icon={ClipboardCheck}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSaveRecipe({
                  ...editor,
                  allergens: parseListInput(allergensInput),
                });
              }}
              className="space-y-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_190px_160px_160px]">
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Nombre del plato
                  </span>
                  <input
                    value={editor.name}
                    onChange={(event) => updateEditor("name", event.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Categoria
                  </span>
                  <input
                    value={editor.category}
                    onChange={(event) =>
                      updateEditor("category", event.target.value)
                    }
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Porciones
                  </span>
                  <input
                    value={editor.portions}
                    onChange={(event) =>
                      updateEditor("portions", parseQuantityInput(event.target.value))
                    }
                    inputMode="decimal"
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Tiempo min
                  </span>
                  <input
                    value={editor.prepTimeMinutes}
                    onChange={(event) =>
                      updateEditor(
                        "prepTimeMinutes",
                        Math.max(0, Math.round(parseQuantityInput(event.target.value))),
                      )
                    }
                    inputMode="numeric"
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_170px_170px]">
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Foto del plato
                  </span>
                  <input
                    value={editor.photoUrl}
                    onChange={(event) =>
                      updateEditor("photoUrl", event.target.value)
                    }
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Precio venta
                  </span>
                  <input
                    value={editor.salePrice}
                    onChange={(event) =>
                      updateEditor(
                        "salePrice",
                        parseCurrencyInput(event.target.value),
                      )
                    }
                    inputMode="numeric"
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Food cost objetivo
                  </span>
                  <input
                    value={editor.targetFoodCostPercent}
                    onChange={(event) =>
                      updateEditor(
                        "targetFoodCostPercent",
                        parseQuantityInput(event.target.value),
                      )
                    }
                    inputMode="decimal"
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Procedimiento tecnico
                  </span>
                  <textarea
                    value={editor.procedure}
                    onChange={(event) =>
                      updateEditor("procedure", event.target.value)
                    }
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <div className="grid gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase text-zinc-500">
                      Alergenos
                    </span>
                    <input
                      value={allergensInput}
                      onChange={(event) => setAllergensInput(event.target.value)}
                      placeholder="Gluten, lacteos, mariscos"
                      className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase text-zinc-500">
                      Observaciones
                    </span>
                    <textarea
                      value={editor.observations}
                      onChange={(event) =>
                        updateEditor("observations", event.target.value)
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-5">
                <InfoPill
                  label="Costo neto"
                  value={formatCurrency(editorSummary.netCost)}
                />
                <InfoPill
                  label="Costo por porcion"
                  value={formatCurrency(editorSummary.costPerPortion)}
                />
                <InfoPill
                  label="Precio sugerido"
                  value={formatCurrency(editorSummary.suggestedPrice)}
                />
                <InfoPill
                  label="Food cost"
                  value={formatPercent(editorSummary.foodCostPercent)}
                />
                <InfoPill
                  label="Rentabilidad"
                  value={formatPercent(editorSummary.profitability)}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="py-3 font-semibold">Ingrediente</th>
                      <th className="py-3 font-semibold">Bruto</th>
                      <th className="py-3 font-semibold">Rendimiento</th>
                      <th className="py-3 font-semibold">Merma</th>
                      <th className="py-3 font-semibold">Neto</th>
                      <th className="py-3 text-right font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editor.ingredients.map((ingredient, index) => {
                      const material = rawMaterials.find(
                        (item) => item.id === ingredient.rawMaterialId,
                      );
                      const netQuantity =
                        ingredient.grossQuantity * (ingredient.yieldPercent / 100);

                      return (
                        <tr
                          key={`${ingredient.rawMaterialId}-${index}`}
                          className="border-t border-black/10 dark:border-white/10"
                        >
                          <td className="py-2">
                            <select
                              value={ingredient.rawMaterialId}
                              onChange={(event) => {
                                const nextMaterial = rawMaterials.find(
                                  (item) => item.id === event.target.value,
                                );
                                updateIngredient(index, {
                                  rawMaterialId: event.target.value,
                                  unit: nextMaterial?.unit ?? ingredient.unit,
                                  yieldPercent:
                                    nextMaterial?.averageYield ??
                                    ingredient.yieldPercent,
                                });
                              }}
                              className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 outline-none dark:border-white/10 dark:bg-zinc-950"
                            >
                              {rawMaterials.map((materialOption) => (
                                <option
                                  key={materialOption.id}
                                  value={materialOption.id}
                                >
                                  {materialOption.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2">
                            <input
                              value={ingredient.grossQuantity}
                              onChange={(event) =>
                                updateIngredient(index, {
                                  grossQuantity: parseQuantityInput(
                                    event.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              className="h-10 w-28 rounded-lg border border-black/10 bg-white px-3 outline-none dark:border-white/10 dark:bg-zinc-950"
                            />
                            <span className="ml-2 text-zinc-500">
                              {material?.unit ?? ingredient.unit}
                            </span>
                          </td>
                          <td className="py-2">
                            <input
                              value={ingredient.yieldPercent}
                              onChange={(event) =>
                                updateIngredient(index, {
                                  yieldPercent: parseQuantityInput(
                                    event.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              className="h-10 w-24 rounded-lg border border-black/10 bg-white px-3 outline-none dark:border-white/10 dark:bg-zinc-950"
                            />
                            <span className="ml-2 text-zinc-500">%</span>
                          </td>
                          <td className="py-2">
                            <input
                              value={ingredient.wasteType}
                              onChange={(event) =>
                                updateIngredient(index, {
                                  wasteType: event.target.value,
                                })
                              }
                              className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 outline-none dark:border-white/10 dark:bg-zinc-950"
                            />
                          </td>
                          <td className="py-2 font-semibold">
                            {numberFormatter.format(netQuantity)}{" "}
                            {material?.unit ?? ingredient.unit}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 rounded-lg border border-dashed border-black/10 p-3 dark:border-white/10 md:grid-cols-[1fr_130px_130px_1fr_auto]">
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Materia prima
                  </span>
                  <select
                    value={newIngredientMaterialId}
                    onChange={(event) => {
                      const material = rawMaterials.find(
                        (item) => item.id === event.target.value,
                      );
                      setNewIngredientMaterialId(event.target.value);
                      if (material) {
                        setNewIngredientYieldPercent(
                          formatDecimalInput(material.averageYield),
                        );
                      }
                    }}
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  >
                    {rawMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Bruto
                  </span>
                  <input
                    value={newIngredientGrossQuantity}
                    onChange={(event) =>
                      setNewIngredientGrossQuantity(event.target.value)
                    }
                    inputMode="decimal"
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Rendimiento
                  </span>
                  <input
                    value={newIngredientYieldPercent}
                    onChange={(event) =>
                      setNewIngredientYieldPercent(event.target.value)
                    }
                    inputMode="decimal"
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Tipo de merma
                  </span>
                  <input
                    value={newIngredientWasteType}
                    onChange={(event) =>
                      setNewIngredientWasteType(event.target.value)
                    }
                    className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                  />
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-semibold transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-900"
                >
                  <PackagePlus className="h-4 w-4" />
                  Agregar
                </button>
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                <ClipboardCheck className="h-4 w-4" />
                Guardar receta tecnica
              </button>
            </form>
          </Panel>

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

function InventoryModule({
  onRegisterMovement,
}: {
  onRegisterMovement: (movement: InventoryMovementDraft) => void;
}) {
  const { rawMaterials, inventoryMovements } = useRestaurantData();
  const lowStock = rawMaterials.filter((material) => material.stock <= material.minStock);
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    rawMaterials[0]?.id ?? "",
  );
  const [movementType, setMovementType] =
    useState<InventoryMovementDraft["type"]>("waste");
  const [movementQuantity, setMovementQuantity] = useState("250");
  const [movementReason, setMovementReason] = useState("Merma por limpieza");
  const selectedMaterial =
    rawMaterials.find((material) => material.id === selectedMaterialId) ??
    rawMaterials[0];
  const inventoryValue = rawMaterials.reduce(
    (total, material) => total + material.stock * calculateRealNetUnitCost(material),
    0,
  );
  const wasteValue = inventoryMovements
    .filter((movement) => movement.type === "waste")
    .reduce(
      (total, movement) => total + Math.abs(movement.quantity * movement.unitCost),
      0,
    );
  const salesConsumptionValue = inventoryMovements
    .filter((movement) => movement.type === "sale")
    .reduce(
      (total, movement) => total + Math.abs(movement.quantity * movement.unitCost),
      0,
    );

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
        <MetricCard label="Inventario valorizado" value={formatCurrency(inventoryValue)} icon={BadgeDollarSign} tone="bg-emerald-600" />
        <MetricCard label="Mermas registradas" value={formatCurrency(wasteValue)} icon={Activity} tone="bg-[var(--udla-orange)]" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Movimiento de bodega" icon={PackagePlus}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedMaterial) {
                return;
              }

              onRegisterMovement({
                rawMaterialId: selectedMaterial.id,
                type: movementType,
                quantity: parseQuantityInput(movementQuantity),
                reason: movementReason,
              });
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Materia prima
                </span>
                <select
                  value={selectedMaterial?.id ?? ""}
                  onChange={(event) => setSelectedMaterialId(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  {rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Tipo
                </span>
                <select
                  value={movementType}
                  onChange={(event) =>
                    setMovementType(event.target.value as InventoryMovementDraft["type"])
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="waste">Merma</option>
                  <option value="manual_out">Salida manual</option>
                  <option value="adjustment">Ajuste</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Cantidad
                </span>
                <input
                  value={movementQuantity}
                  onChange={(event) => setMovementQuantity(event.target.value)}
                  inputMode="decimal"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Motivo
                </span>
                <input
                  value={movementReason}
                  onChange={(event) => setMovementReason(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            {selectedMaterial ? (
              <div className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-3">
                <InfoPill
                  label="Stock actual"
                  value={`${numberFormatter.format(selectedMaterial.stock)} ${selectedMaterial.unit}`}
                />
                <InfoPill
                  label="Costo real neto"
                  value={formatCurrency(calculateRealNetUnitCost(selectedMaterial))}
                />
                <InfoPill
                  label="Valor movimiento"
                  value={formatCurrency(
                    Math.abs(
                      parseQuantityInput(movementQuantity) *
                        calculateRealNetUnitCost(selectedMaterial),
                    ),
                  )}
                />
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!selectedMaterial}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950"
            >
              <PackagePlus className="h-4 w-4" />
              Registrar movimiento
            </button>
          </form>
        </Panel>

        <Panel title="Trazabilidad de inventario" icon={ReceiptText}>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <InfoPill
              label="Consumo ventas"
              value={formatCurrency(salesConsumptionValue)}
            />
            <InfoPill
              label="Movimientos"
              value={inventoryMovements.length.toString()}
            />
            <InfoPill
              label="FIFO/LIFO"
              value={`${rawMaterials.filter((item) => item.storageMethod === "FIFO").length}/${rawMaterials.length} FIFO`}
            />
          </div>
          <div className="space-y-3">
            {inventoryMovements.slice(0, 8).map((movement) => (
              <div
                key={movement.id}
                className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[80px_1fr_130px]"
              >
                <span className="font-mono text-sm text-zinc-500">
                  {movement.time}
                </span>
                <div>
                  <p className="font-semibold">{movement.materialName}</p>
                  <p className="text-sm text-zinc-500">
                    {inventoryMovementLabels[movement.type]} · {movement.reason}
                  </p>
                </div>
                <p
                  className={`text-left font-semibold md:text-right ${
                    movement.quantity < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {numberFormatter.format(movement.quantity)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
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

function PurchasesModule({
  onReceivePurchase,
}: {
  onReceivePurchase: (purchase: PurchaseReceptionDraft) => void;
}) {
  const { purchases, suppliers, rawMaterials, purchaseItems } = useRestaurantData();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [rawMaterialId, setRawMaterialId] = useState(rawMaterials[0]?.id ?? "");
  const [documentType, setDocumentType] =
    useState<PurchaseReceptionDraft["documentType"]>("invoice");
  const [documentNumber, setDocumentNumber] = useState(
    `F-${new Date().getTime().toString().slice(-5)}`,
  );
  const [quantity, setQuantity] = useState("1000");
  const [unitCost, setUnitCost] = useState(() =>
    formatDecimalInput(getRawMaterialGrossUnitCost(rawMaterials[0])),
  );
  const [yieldPercent, setYieldPercent] = useState(() =>
    formatDecimalInput(rawMaterials[0]?.averageYield ?? 100),
  );
  const [expirationDate, setExpirationDate] = useState("");
  const [lot, setLot] = useState("");
  const selectedMaterial =
    rawMaterials.find((material) => material.id === rawMaterialId) ??
    rawMaterials[0];
  const selectedSupplier =
    suppliers.find((supplier) => supplier.id === supplierId) ?? suppliers[0];
  const parsedQuantity = parseQuantityInput(quantity);
  const parsedUnitCost = parseDecimalCurrencyInput(unitCost);
  const parsedYield = parseQuantityInput(yieldPercent) || 100;
  const totalCost = parsedQuantity * parsedUnitCost;
  const currentGrossUnitCost = getRawMaterialGrossUnitCost(selectedMaterial);
  const priceDeltaPercent = currentGrossUnitCost
    ? ((parsedUnitCost - currentGrossUnitCost) / currentGrossUnitCost) * 100
    : 0;
  const totalPurchases = purchases.reduce(
    (total, purchase) => total + purchase.total,
    0,
  );
  const receivedPurchases = purchases.filter(
    (purchase) => purchase.status === "received" || purchase.status === "priced",
  );
  const materialPurchaseHistory = selectedMaterial
    ? purchaseItems
        .filter((item) => item.rawMaterialId === selectedMaterial.id)
        .slice(0, 5)
    : [];

  function selectRawMaterial(nextRawMaterialId: string) {
    setRawMaterialId(nextRawMaterialId);

    const nextMaterial = rawMaterials.find(
      (material) => material.id === nextRawMaterialId,
    );

    if (!nextMaterial) {
      return;
    }

    setUnitCost(formatDecimalInput(getRawMaterialGrossUnitCost(nextMaterial)));
    setYieldPercent(formatDecimalInput(nextMaterial.averageYield));
    setExpirationDate(nextMaterial.expirationDate);
    setLot(nextMaterial.lot);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Abastecimiento"
        title="Compras, proveedores y precios historicos"
        description="Registra facturas, boletas, recepcion a inventario, comparacion de costos y confiabilidad por proveedor."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Compras registradas"
          value={purchases.length.toString()}
          icon={ShoppingCart}
          tone="bg-[var(--udla-charcoal)]"
        />
        <MetricCard
          label="Recepcionadas"
          value={receivedPurchases.length.toString()}
          icon={ClipboardCheck}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Compra valorizada"
          value={formatCurrency(totalPurchases)}
          icon={BadgeDollarSign}
          tone="bg-orange-600"
        />
        <MetricCard
          label="Proveedores"
          value={suppliers.length.toString()}
          icon={Store}
          tone="bg-zinc-900"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Recepcion de compra" icon={PackagePlus}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedMaterial || !selectedSupplier) {
                return;
              }

              onReceivePurchase({
                supplierId: selectedSupplier.id,
                documentType,
                documentNumber,
                rawMaterialId: selectedMaterial.id,
                description: selectedMaterial.name,
                quantity: parsedQuantity,
                unit: selectedMaterial.unit,
                unitCost: parsedUnitCost,
                yieldPercent: parsedYield,
                expirationDate,
                lot,
              });
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Proveedor
                </span>
                <select
                  value={selectedSupplier?.id ?? ""}
                  onChange={(event) => setSupplierId(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Materia prima
                </span>
                <select
                  value={selectedMaterial?.id ?? ""}
                  onChange={(event) => selectRawMaterial(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  {rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Documento
                </span>
                <select
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(event.target.value as PurchaseReceptionDraft["documentType"])
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="invoice">Factura</option>
                  <option value="receipt">Boleta</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Numero
                </span>
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Cantidad
                </span>
                <input
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  inputMode="decimal"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Costo unitario
                </span>
                <input
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Rendimiento
                </span>
                <input
                  value={yieldPercent}
                  onChange={(event) => setYieldPercent(event.target.value)}
                  inputMode="decimal"
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Vencimiento
                </span>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(event) => setExpirationDate(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-zinc-500">
                  Lote
                </span>
                <input
                  value={lot}
                  onChange={(event) => setLot(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-3">
              <InfoPill
                label="Total compra"
                value={formatCurrency(totalCost)}
              />
              <InfoPill
                label="Costo neto real"
                value={formatCurrency(parsedUnitCost / (parsedYield / 100 || 1))}
              />
              <InfoPill
                label="Variacion precio"
                value={formatPercent(priceDeltaPercent)}
              />
            </div>

            <button
              type="submit"
              disabled={
                !selectedMaterial ||
                !selectedSupplier ||
                parsedQuantity <= 0 ||
                parsedUnitCost <= 0 ||
                parsedYield <= 0 ||
                parsedYield > 100
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950"
            >
              <PackagePlus className="h-4 w-4" />
              Recibir compra
            </button>
          </form>
        </Panel>

        <Panel title="Precios historicos" icon={BarChart3}>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <InfoPill
              label="Insumo"
              value={selectedMaterial?.name ?? "Sin seleccion"}
            />
            <InfoPill
              label="Costo actual"
              value={formatCurrency(currentGrossUnitCost)}
            />
            <InfoPill
              label="Proveedor"
              value={selectedSupplier?.name ?? "Sin proveedor"}
            />
          </div>
          <div className="space-y-3">
            {materialPurchaseHistory.length ? (
              materialPurchaseHistory.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_120px_130px]"
                >
                  <div>
                    <p className="font-semibold">{item.description}</p>
                    <p className="text-sm text-zinc-500">
                      {numberFormatter.format(item.quantity)} {item.unit} ·{" "}
                      rendimiento {formatPercent(item.yieldPercent)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.unitCost)}</p>
                  <p className="text-left font-semibold text-emerald-600 md:text-right">
                    {formatCurrency(item.totalCost)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-black/10 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900">
                Sin historial de compras para este insumo.
              </div>
            )}
          </div>
        </Panel>
      </div>

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
                className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_150px_120px]">
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
                {purchase.items.length ? (
                  <div className="mt-3 space-y-2">
                    {purchase.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-2 rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-950 md:grid-cols-[1fr_110px_120px]"
                      >
                        <span className="font-medium">{item.materialName}</span>
                        <span>
                          {numberFormatter.format(item.quantity)} {item.unit}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(item.unitCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CrmModule({
  tables,
  onSaveCustomer,
  onSaveReservation,
  onRegisterInteraction,
}: {
  tables: RestaurantTable[];
  onSaveCustomer: (customer: CustomerDraft) => string;
  onSaveReservation: (reservation: ReservationDraft) => string;
  onRegisterInteraction: (interaction: CustomerInteractionDraft) => void;
}) {
  const { customers, reservations, customerInteractions, employees } =
    useRestaurantData();
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    () => customers[0]?.id ?? "",
  );
  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ??
    customers[0];
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>(() =>
    customerToDraft(selectedCustomer),
  );
  const [allergiesInput, setAllergiesInput] = useState(
    () => selectedCustomer?.allergies.join(", ") ?? "",
  );
  const [tagsInput, setTagsInput] = useState(
    () => selectedCustomer?.tags.join(", ") ?? "",
  );
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft>(() =>
    createBlankReservationDraft(selectedCustomer?.id, tables, employees),
  );
  const [interactionDraft, setInteractionDraft] =
    useState<CustomerInteractionDraft>(() =>
      createBlankCustomerInteractionDraft(selectedCustomer?.id),
    );
  const activeReservations = reservations.filter((reservation) =>
    ["pending", "confirmed", "seated"].includes(reservation.status),
  );
  const allergyAlerts = customers.filter(
    (customer) => customer.allergies.length > 0,
  );
  const openFollowUps = customerInteractions.filter(
    (interaction) => interaction.dueAt && !interaction.completedAt,
  );
  const expectedGuests = activeReservations.reduce(
    (total, reservation) => total + reservation.partySize,
    0,
  );
  const customerReservations = selectedCustomer
    ? reservations.filter(
        (reservation) => reservation.customerId === selectedCustomer.id,
      )
    : [];
  const customerInteractionRows = selectedCustomer
    ? customerInteractions.filter(
        (interaction) => interaction.customerId === selectedCustomer.id,
      )
    : customerInteractions;
  const crmRows = buildCustomerCrmRows(
    customers,
    reservations,
    customerInteractions,
  );

  function updateCustomerDraft<Key extends keyof CustomerDraft>(
    key: Key,
    value: CustomerDraft[Key],
  ) {
    setCustomerDraft((current) => ({ ...current, [key]: value }));
  }

  function updateReservationDraft<Key extends keyof ReservationDraft>(
    key: Key,
    value: ReservationDraft[Key],
  ) {
    setReservationDraft((current) => ({ ...current, [key]: value }));
  }

  function updateInteractionDraft<Key extends keyof CustomerInteractionDraft>(
    key: Key,
    value: CustomerInteractionDraft[Key],
  ) {
    setInteractionDraft((current) => ({ ...current, [key]: value }));
  }

  function loadCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setCustomerDraft(customerToDraft(customer));
    setAllergiesInput(customer.allergies.join(", "));
    setTagsInput(customer.tags.join(", "));
    setReservationDraft((current) => ({
      ...current,
      customerId: customer.id,
    }));
    setInteractionDraft((current) => ({
      ...current,
      customerId: customer.id,
    }));
  }

  function startNewCustomer() {
    const draft = createBlankCustomerDraft();
    setSelectedCustomerId("");
    setCustomerDraft(draft);
    setAllergiesInput("");
    setTagsInput("Nuevo");
    setReservationDraft(createBlankReservationDraft("", tables, employees));
    setInteractionDraft(createBlankCustomerInteractionDraft(""));
  }

  function submitCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const savedId = onSaveCustomer({
      ...customerDraft,
      allergies: parseListInput(allergiesInput),
      tags: parseListInput(tagsInput),
    });

    if (!savedId) {
      return;
    }

    setSelectedCustomerId(savedId);
    setCustomerDraft((current) => ({ ...current, id: savedId }));
    setReservationDraft((current) => ({ ...current, customerId: savedId }));
    setInteractionDraft((current) => ({ ...current, customerId: savedId }));
  }

  function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const savedId = onSaveReservation(reservationDraft);

    if (savedId) {
      setReservationDraft((current) => ({ ...current, id: savedId }));
    }
  }

  function submitInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRegisterInteraction(interactionDraft);
    setInteractionDraft((current) => ({
      ...current,
      summary: "",
      completed: false,
    }));
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Reservas y fidelizacion"
        title="Clientes y CRM operativo"
        description="Gestiona fichas de clientes, preferencias, alergias, reservas por mesa y seguimientos comerciales del salon."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Clientes"
          value={customers.length.toString()}
          detail="Fichas activas"
        />
        <MetricTile
          label="Reservas activas"
          value={activeReservations.length.toString()}
          detail={`${expectedGuests} comensales esperados`}
        />
        <MetricTile
          label="Alertas alergia"
          value={allergyAlerts.length.toString()}
          detail="Visibles para salon y cocina"
          tone={allergyAlerts.length ? "danger" : "neutral"}
        />
        <MetricTile
          label="Seguimientos"
          value={openFollowUps.length.toString()}
          detail="Pendientes de contacto"
          tone={openFollowUps.length ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Clientes CRM" icon={UserRound}>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <InfoPill
              label="Venta historica"
              value={formatCurrency(
                customers.reduce((total, customer) => total + customer.totalSpent, 0),
              )}
            />
            <InfoPill
              label="Visitas"
              value={customers
                .reduce((total, customer) => total + customer.visitCount, 0)
                .toString()}
            />
            <InfoPill
              label="Ticket cliente"
              value={formatCurrency(
                customers.length
                  ? customers.reduce(
                      (total, customer) => total + customer.totalSpent,
                      0,
                    ) /
                      Math.max(
                        1,
                        customers.reduce(
                          (total, customer) => total + customer.visitCount,
                          0,
                        ),
                      )
                  : 0,
              )}
            />
          </div>
          <div className="max-h-[620px] space-y-3 overflow-auto pr-1">
            {crmRows.map((row) => (
              <button
                key={row.customer.id}
                type="button"
                onClick={() => loadCustomer(row.customer)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selectedCustomer?.id === row.customer.id
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                    : "border-black/10 bg-zinc-50 hover:bg-white dark:border-white/10 dark:bg-zinc-900"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{row.customer.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {row.customer.phone || "Sin telefono"} ·{" "}
                      {row.customer.email || "Sin email"}
                    </p>
                  </div>
                  <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-semibold dark:border-white/10 dark:bg-zinc-800">
                    {row.reservations} reservas
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.customer.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {row.customer.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-900"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={customerDraft.id ? "Ficha de cliente" : "Nuevo cliente"} icon={ClipboardCheck}>
          <form className="space-y-4" onSubmit={submitCustomer}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Cliente seleccionado
                </p>
                <p className="text-xl font-semibold">
                  {customerDraft.name || "Sin nombre"}
                </p>
              </div>
              <button
                type="button"
                onClick={startNewCustomer}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                <UserRound className="h-4 w-4" />
                Nuevo cliente
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Nombre completo
                <input
                  value={customerDraft.name}
                  onChange={(event) =>
                    updateCustomerDraft("name", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                RUT
                <input
                  value={customerDraft.documentId}
                  onChange={(event) =>
                    updateCustomerDraft("documentId", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Telefono
                <input
                  value={customerDraft.phone}
                  onChange={(event) =>
                    updateCustomerDraft("phone", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Email
                <input
                  value={customerDraft.email}
                  onChange={(event) =>
                    updateCustomerDraft("email", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Preferencias
              <textarea
                value={customerDraft.preferences}
                onChange={(event) =>
                  updateCustomerDraft("preferences", event.target.value)
                }
                rows={3}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Alergias
                <input
                  value={allergiesInput}
                  onChange={(event) => setAllergiesInput(event.target.value)}
                  placeholder="Lacteos, Mariscos"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Etiquetas
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="Frecuente, Empresa"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Notas internas
              <textarea
                value={customerDraft.notes}
                onChange={(event) =>
                  updateCustomerDraft("notes", event.target.value)
                }
                rows={2}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <div className="grid gap-2 md:grid-cols-3">
              <InfoPill
                label="Visitas"
                value={(selectedCustomer?.visitCount ?? 0).toString()}
              />
              <InfoPill
                label="Venta total"
                value={formatCurrency(selectedCustomer?.totalSpent ?? 0)}
              />
              <InfoPill
                label="Ultima visita"
                value={
                  selectedCustomer?.lastVisitAt
                    ? formatDateLabel(selectedCustomer.lastVisitAt.slice(0, 10))
                    : "Sin visita"
                }
              />
            </div>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <ClipboardCheck className="h-4 w-4" />
              Guardar cliente
            </button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Agenda de reservas" icon={CalendarCheck}>
          <form className="mb-4 space-y-4" onSubmit={submitReservation}>
            <div className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
              <label className="block text-sm font-semibold">
                Cliente
                <select
                  value={reservationDraft.customerId}
                  onChange={(event) =>
                    updateReservationDraft("customerId", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="">Seleccionar</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Fecha
                <input
                  type="date"
                  value={reservationDraft.date}
                  onChange={(event) =>
                    updateReservationDraft("date", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Hora
                <input
                  type="time"
                  value={reservationDraft.time}
                  onChange={(event) =>
                    updateReservationDraft("time", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <label className="block text-sm font-semibold">
                Mesa
                <select
                  value={reservationDraft.tableId ?? ""}
                  onChange={(event) =>
                    updateReservationDraft("tableId", event.target.value || undefined)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="">Sin mesa</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Mesa {table.number} · {table.zone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Personas
                <input
                  inputMode="numeric"
                  value={reservationDraft.partySize || ""}
                  onChange={(event) =>
                    updateReservationDraft(
                      "partySize",
                      Math.max(1, Math.round(parseQuantityInput(event.target.value))),
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Estado
                <select
                  value={reservationDraft.status}
                  onChange={(event) =>
                    updateReservationDraft(
                      "status",
                      event.target.value as ReservationStatus,
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  {Object.entries(reservationStatusMeta).map(([status, meta]) => (
                    <option key={status} value={status}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Canal
                <select
                  value={reservationDraft.channel}
                  onChange={(event) =>
                    updateReservationDraft(
                      "channel",
                      event.target.value as Reservation["channel"],
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  {Object.entries(reservationChannelLabels).map(([channel, label]) => (
                    <option key={channel} value={channel}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Responsable
                <select
                  value={reservationDraft.assignedTo ?? ""}
                  onChange={(event) =>
                    updateReservationDraft(
                      "assignedTo",
                      event.target.value || undefined,
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="">Sin asignar</option>
                  {employees
                    .filter((employee) =>
                      ["administrator", "supervisor", "waiter", "cashier"].includes(
                        employee.role,
                      ),
                    )
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Ocasion
                <input
                  value={reservationDraft.occasion}
                  onChange={(event) =>
                    updateReservationDraft("occasion", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Notas de reserva
              <textarea
                value={reservationDraft.notes}
                onChange={(event) =>
                  updateReservationDraft("notes", event.target.value)
                }
                rows={2}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <CalendarCheck className="h-4 w-4" />
              Guardar reserva
            </button>
          </form>

          <div className="space-y-3">
            {reservations.map((reservation) => (
              <button
                key={reservation.id}
                type="button"
                onClick={() =>
                  setReservationDraft(
                    reservationToDraft(reservation, customers, tables, employees),
                  )
                }
                className="w-full rounded-lg border border-black/10 bg-zinc-50 p-4 text-left transition hover:bg-white dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{reservation.customerName}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatDateLabel(reservation.date)} · {reservation.time} ·{" "}
                      {reservation.partySize} personas
                    </p>
                  </div>
                  <ReservationStatusBadge status={reservation.status} />
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <InfoPill
                    label="Mesa"
                    value={
                      reservation.tableNumber
                        ? `Mesa ${reservation.tableNumber}`
                        : "Sin mesa"
                    }
                  />
                  <InfoPill
                    label="Canal"
                    value={reservationChannelLabels[reservation.channel]}
                  />
                  <InfoPill
                    label="Responsable"
                    value={reservation.assignedTo ?? "Sin asignar"}
                  />
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Seguimiento CRM" icon={MessageSquare}>
          <form className="mb-4 space-y-4" onSubmit={submitInteraction}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Cliente
                <select
                  value={interactionDraft.customerId}
                  onChange={(event) =>
                    updateInteractionDraft("customerId", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  <option value="">Seleccionar</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Tipo
                <select
                  value={interactionDraft.type}
                  onChange={(event) =>
                    updateInteractionDraft(
                      "type",
                      event.target.value as CustomerInteraction["type"],
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  {Object.entries(customerInteractionLabels).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Resumen
              <textarea
                value={interactionDraft.summary}
                onChange={(event) =>
                  updateInteractionDraft("summary", event.target.value)
                }
                rows={3}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="block text-sm font-semibold">
                Vencimiento
                <input
                  type="datetime-local"
                  value={interactionDraft.dueAt}
                  onChange={(event) =>
                    updateInteractionDraft("dueAt", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="flex items-end gap-3 pb-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={interactionDraft.completed}
                  onChange={(event) =>
                    updateInteractionDraft("completed", event.target.checked)
                  }
                  className="h-5 w-5 rounded border-black/20"
                />
                Completado
              </label>
            </div>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <MessageSquare className="h-4 w-4" />
              Registrar seguimiento
            </button>
          </form>

          <div className="mb-4 grid gap-2 md:grid-cols-2">
            <InfoPill
              label="Reservas cliente"
              value={customerReservations.length.toString()}
            />
            <InfoPill
              label="Interacciones cliente"
              value={customerInteractionRows.length.toString()}
            />
          </div>

          <div className="space-y-3">
            {customerInteractionRows.map((interaction) => (
              <div
                key={interaction.id}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {customerInteractionLabels[interaction.type]} ·{" "}
                      {interaction.customerName}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {interaction.summary}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      interaction.completedAt
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {interaction.completedAt ? "Cerrado" : "Abierto"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <InfoPill label="Responsable" value={interaction.responsible} />
                  <InfoPill
                    label="Creado"
                    value={formatDateLabel(interaction.createdAt.slice(0, 10))}
                  />
                  <InfoPill
                    label="Vence"
                    value={
                      interaction.dueAt
                        ? formatDateLabel(interaction.dueAt.slice(0, 10))
                        : "Sin fecha"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const meta = reservationStatusMeta[status];

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function buildCustomerCrmRows(
  customers: Customer[],
  reservations: Reservation[],
  interactions: CustomerInteraction[],
) {
  return customers
    .map((customer) => ({
      customer,
      reservations: reservations.filter(
        (reservation) => reservation.customerId === customer.id,
      ).length,
      interactions: interactions.filter(
        (interaction) => interaction.customerId === customer.id,
      ).length,
    }))
    .sort((left, right) => {
      const rightActivity = new Date(
        right.customer.lastVisitAt ?? right.customer.createdAt,
      ).getTime();
      const leftActivity = new Date(
        left.customer.lastVisitAt ?? left.customer.createdAt,
      ).getTime();
      return rightActivity - leftActivity;
    });
}

function customerToDraft(customer?: Customer): CustomerDraft {
  if (!customer) {
    return createBlankCustomerDraft();
  }

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    documentId: customer.documentId,
    preferences: customer.preferences,
    allergies: customer.allergies,
    tags: customer.tags,
    notes: customer.notes,
  };
}

function createBlankCustomerDraft(): CustomerDraft {
  return {
    name: "",
    phone: "",
    email: "",
    documentId: "",
    preferences: "",
    allergies: [],
    tags: ["Nuevo"],
    notes: "",
  };
}

function createBlankReservationDraft(
  customerId: string | undefined,
  tables: RestaurantTable[],
  employees: Employee[],
): ReservationDraft {
  const defaultTable = tables.find((table) =>
    ["free", "reserved"].includes(table.status),
  );
  const defaultEmployee = employees.find((employee) => employee.role === "waiter");

  return {
    customerId: customerId ?? "",
    tableId: defaultTable?.id,
    partySize: defaultTable?.seats ?? 2,
    date: new Date().toISOString().slice(0, 10),
    time: "20:00",
    status: "pending",
    channel: "phone",
    occasion: "",
    notes: "",
    assignedTo: defaultEmployee?.id,
  };
}

function reservationToDraft(
  reservation: Reservation,
  customers: Customer[],
  tables: RestaurantTable[],
  employees: Employee[],
): ReservationDraft {
  const customer = customers.find((item) => item.id === reservation.customerId);
  const table = tables.find((item) => item.id === reservation.tableId);
  const employee = employees.find((item) => item.name === reservation.assignedTo);

  return {
    id: reservation.id,
    customerId: customer?.id ?? reservation.customerId,
    tableId: table?.id,
    partySize: reservation.partySize,
    date: reservation.date,
    time: reservation.time,
    status: reservation.status,
    channel: reservation.channel,
    occasion: reservation.occasion,
    notes: reservation.notes,
    assignedTo: employee?.id,
  };
}

function createBlankCustomerInteractionDraft(
  customerId: string | undefined,
): CustomerInteractionDraft {
  return {
    customerId: customerId ?? "",
    type: "follow_up",
    summary: "",
    dueAt: "",
    completed: false,
  };
}

const operationalDocumentTypeOptions: Array<{
  type: OperationalDocumentType;
  label: string;
  icon: LucideIcon;
}> = [
  { type: "table_prebill", label: "Pre-cuenta", icon: ReceiptText },
  { type: "payment_receipt", label: "Comprobante de pago", icon: CreditCard },
  { type: "kitchen_ticket", label: "Comanda cocina", icon: ChefHat },
  { type: "reservation_sheet", label: "Ficha de reserva", icon: CalendarCheck },
  { type: "cash_close", label: "Cierre de caja", icon: Calculator },
];

interface OperationalDocumentPreview {
  title: string;
  subtitle: string;
  meta: Array<{ label: string; value: string }>;
  lines: Array<{ label: string; value: string }>;
  totals: Array<{ label: string; value: string; strong?: boolean }>;
  notes: string[];
  payload: Record<string, unknown>;
}

function DocumentsModule({
  onGenerateDocument,
}: {
  onGenerateDocument: (document: OperationalDocumentDraft) => string;
}) {
  const {
    orders,
    cashRegisters,
    cashMovements,
    reservations,
    customers,
    operationalDocuments,
    settings,
  } = useRestaurantData();
  const [documentType, setDocumentType] =
    useState<OperationalDocumentType>("table_prebill");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [selectedRegisterId, setSelectedRegisterId] = useState(
    cashRegisters[0]?.id ?? "",
  );
  const [selectedReservationId, setSelectedReservationId] = useState(
    reservations[0]?.id ?? "",
  );

  const effectiveOrderId = orders.some((order) => order.id === selectedOrderId)
    ? selectedOrderId
    : orders[0]?.id ?? "";
  const effectiveRegisterId = cashRegisters.some(
    (register) => register.id === selectedRegisterId,
  )
    ? selectedRegisterId
    : cashRegisters[0]?.id ?? "";
  const effectiveReservationId = reservations.some(
    (reservation) => reservation.id === selectedReservationId,
  )
    ? selectedReservationId
    : reservations[0]?.id ?? "";
  const selectedOrder =
    orders.find((order) => order.id === effectiveOrderId) ?? orders[0];
  const selectedRegister =
    cashRegisters.find((register) => register.id === effectiveRegisterId) ??
    cashRegisters[0];
  const selectedReservation =
    reservations.find((reservation) => reservation.id === effectiveReservationId) ??
    reservations[0];
  const selectedCustomer = selectedReservation
    ? customers.find((customer) => customer.id === selectedReservation.customerId)
    : undefined;
  const preview = buildOperationalDocumentPreview({
    type: documentType,
    order: selectedOrder,
    cashRegister: selectedRegister,
    cashMovements,
    reservation: selectedReservation,
    customer: selectedCustomer,
  });
  const documentsToday = operationalDocuments.filter(
    (document) =>
      new Date(document.printedAt).toDateString() === new Date().toDateString(),
  ).length;
  const latestDocument = operationalDocuments[0];

  const handleGenerate = () => {
    const createdId = onGenerateDocument({
      type: documentType,
      title: preview.title,
      orderId: selectedOrder?.id,
      cashRegisterId:
        documentType === "cash_close" ? selectedRegister?.id : undefined,
      reservationId:
        documentType === "reservation_sheet"
          ? selectedReservation?.id
          : undefined,
      payload: preview.payload,
    });

    if (createdId && typeof window !== "undefined") {
      window.setTimeout(() => window.print(), 150);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Documentos"
        title="Impresion operativa y respaldos de turno"
        description="Plantillas persistibles para comandas, pre-cuentas, comprobantes, reservas y cierres con trazabilidad en auditoria."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Documentos"
          value={operationalDocuments.length.toString()}
          icon={Printer}
          tone="bg-zinc-900"
        />
        <MetricCard
          label="Emitidos hoy"
          value={documentsToday.toString()}
          icon={ClipboardCheck}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Plantillas"
          value={operationalDocumentTypeOptions.length.toString()}
          icon={ReceiptText}
          tone="bg-[var(--udla-charcoal)]"
        />
        <MetricCard
          label="Ultima impresion"
          value={latestDocument ? formatTime(latestDocument.printedAt) : "Sin datos"}
          icon={Clock}
          tone="bg-amber-600"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Generador" icon={Printer}>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Tipo de documento
              <select
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value as OperationalDocumentType)
                }
                className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
              >
                {operationalDocumentTypeOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                  Pedido
                <select
                  value={effectiveOrderId}
                  onChange={(event) => setSelectedOrderId(event.target.value)}
                  className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
                >
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.number} · Mesa {order.tableNumber}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                  Caja
                <select
                  value={effectiveRegisterId}
                  onChange={(event) => setSelectedRegisterId(event.target.value)}
                  className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
                >
                  {cashRegisters.map((register) => (
                    <option key={register.id} value={register.id}>
                      {register.status === "open" ? "Abierta" : "Cerrada"} ·{" "}
                      {formatCurrency(register.expectedAmount)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Reserva
              <select
                value={effectiveReservationId}
                onChange={(event) => setSelectedReservationId(event.target.value)}
                className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
              >
                {reservations.map((reservation) => (
                  <option key={reservation.id} value={reservation.id}>
                    {reservation.customerName} · {reservation.date}{" "}
                    {reservation.time}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2">
              {operationalDocumentTypeOptions.map((option) => {
                const Icon = option.icon;
                const active = option.type === documentType;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setDocumentType(option.type)}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-black/10 bg-zinc-50 text-zinc-700 hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </span>
                    <span className="text-xs opacity-70">
                      {getOperationalDocumentScope(option.type)}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <Printer className="h-4 w-4" />
              Registrar e imprimir
            </button>
          </div>
        </Panel>

        <Panel title="Vista imprimible" icon={ReceiptText}>
          <div
            data-print-document="true"
            className="mx-auto w-full max-w-[460px] rounded-lg border border-dashed border-zinc-300 bg-white p-5 font-mono text-zinc-950 shadow-sm"
          >
            <div className="border-b border-zinc-200 pb-4 text-center">
              <div className="mx-auto mb-3 flex w-fit justify-center rounded-lg bg-zinc-950 px-3 py-2">
                <Image
                  src={getSafeLogoUrl(settings.logoUrl)}
                  alt={`Logo ${settings.academyName}`}
                  width={150}
                  height={43}
                  className="h-auto max-h-10 w-auto object-contain"
                />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {settings.restaurantName}
              </p>
              <h3 className="mt-2 text-xl font-bold">{preview.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{preview.subtitle}</p>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {preview.meta.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-right font-semibold">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-y border-zinc-200 py-3">
              {preview.lines.map((line) => (
                <div
                  key={`${line.label}-${line.value}`}
                  className="flex justify-between gap-4 py-1 text-sm"
                >
                  <span>{line.label}</span>
                  <span className="text-right">{line.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              {preview.totals.map((total) => (
                <div
                  key={total.label}
                  className={`flex justify-between gap-4 ${
                    total.strong ? "text-base font-bold" : ""
                  }`}
                >
                  <span>{total.label}</span>
                  <span>{total.value}</span>
                </div>
              ))}
            </div>

            {preview.notes.length > 0 ? (
              <div className="mt-4 rounded-lg bg-zinc-100 p-3 text-xs leading-5">
                {preview.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            ) : null}

            <p className="mt-5 text-center text-xs text-zinc-500">
              {formatDateTimeLabel(new Date().toISOString())}
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Historial de impresion" icon={ClipboardCheck}>
          <div className="space-y-3">
            {operationalDocuments.slice(0, 8).map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-2 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{document.title}</p>
                  <p className="text-sm text-zinc-500">
                    {getOperationalDocumentLabel(document.type)} ·{" "}
                    {document.orderNumber ?? document.reservationId ?? "Turno"} ·{" "}
                    {document.printedBy}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatDateTimeLabel(document.printedAt)}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Cobertura" icon={ListChecks}>
          <div className="space-y-3">
            {operationalDocumentTypeOptions.map((option) => {
              const count = operationalDocuments.filter(
                (document) => document.type === option.type,
              ).length;
              const Icon = option.icon;
              return (
                <div
                  key={option.type}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-sm text-zinc-500">
                        {getOperationalDocumentScope(option.type)}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function buildOperationalDocumentPreview({
  type,
  order,
  cashRegister,
  cashMovements,
  reservation,
  customer,
}: {
  type: OperationalDocumentType;
  order?: Order;
  cashRegister?: CashRegister;
  cashMovements: CashMovement[];
  reservation?: Reservation;
  customer?: Customer;
}): OperationalDocumentPreview {
  const orderSubtotal =
    order?.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    ) ?? 0;
  const orderLines =
    order?.items.map((item) => ({
      label: `${numberFormatter.format(item.quantity)}x ${item.productName}`,
      value: formatCurrency(item.quantity * item.unitPrice),
    })) ?? [];

  if (type === "kitchen_ticket") {
    return {
      title: order ? `Comanda ${order.number}` : "Comanda cocina",
      subtitle: order ? `Mesa ${order.tableNumber}` : "Sin pedido seleccionado",
      meta: [
        { label: "Estado", value: order ? orderStatusMeta[order.status].label : "-" },
        { label: "Mesero", value: order?.waiter ?? "-" },
        { label: "Hora", value: order ? formatTime(order.createdAt) : "-" },
      ],
      lines:
        order?.items.map((item) => ({
          label: `${numberFormatter.format(item.quantity)}x ${item.productName}`,
          value: [item.station, ...item.modifiers].join(" · "),
        })) ?? [],
      totals: [],
      notes:
        order?.items
          .map((item) => item.notes)
          .filter((note): note is string => Boolean(note)) ?? [],
      payload: {
        type,
        orderNumber: order?.number ?? null,
        table: order?.tableNumber ?? null,
        items: order?.items ?? [],
      },
    };
  }

  if (type === "payment_receipt") {
    return {
      title: order ? `Comprobante ${order.number}` : "Comprobante de pago",
      subtitle: order ? `Mesa ${order.tableNumber}` : "Sin pedido seleccionado",
      meta: [
        { label: "Pedido", value: order?.number ?? "-" },
        { label: "Fecha", value: formatDateTimeLabel(new Date().toISOString()) },
        { label: "Cajero", value: "Caja activa" },
      ],
      lines: orderLines,
      totals: [
        { label: "Subtotal", value: formatCurrency(orderSubtotal) },
        { label: "Descuento", value: formatCurrency(order?.discount ?? 0) },
        { label: "Propina", value: formatCurrency(order?.tip ?? 0) },
        { label: "Total pagado", value: formatCurrency(order?.total ?? 0), strong: true },
      ],
      notes: ["Operacion asociada al cierre de caja y auditoria."],
      payload: {
        type,
        orderNumber: order?.number ?? null,
        subtotal: orderSubtotal,
        discount: order?.discount ?? 0,
        tip: order?.tip ?? 0,
        total: order?.total ?? 0,
      },
    };
  }

  if (type === "cash_close") {
    const sales = cashMovements
      .filter((movement) => movement.type === "sale")
      .reduce((total, movement) => total + movement.amount, 0);
    const tips = cashMovements
      .filter((movement) => movement.type === "tip")
      .reduce((total, movement) => total + movement.amount, 0);
    const outflows = cashMovements
      .filter((movement) => ["withdrawal", "advance"].includes(movement.type))
      .reduce((total, movement) => total + movement.amount, 0);

    return {
      title: "Cierre de caja",
      subtitle: cashRegister
        ? `${cashRegister.status === "open" ? "Caja abierta" : "Caja cerrada"}`
        : "Sin caja seleccionada",
      meta: [
        { label: "Apertura", value: cashRegister ? formatTime(cashRegister.openedAt) : "-" },
        { label: "Responsable", value: cashRegister?.openedBy ?? "-" },
        { label: "Estado", value: cashRegister?.status === "closed" ? "Cerrada" : "Abierta" },
      ],
      lines: [
        { label: "Monto apertura", value: formatCurrency(cashRegister?.openingAmount ?? 0) },
        { label: "Ventas", value: formatCurrency(sales) },
        { label: "Propinas", value: formatCurrency(tips) },
        { label: "Retiros y adelantos", value: formatCurrency(outflows) },
      ],
      totals: [
        {
          label: "Esperado",
          value: formatCurrency(cashRegister?.expectedAmount ?? 0),
          strong: true,
        },
        {
          label: "Diferencia",
          value: formatCurrency(cashRegister?.differenceAmount ?? 0),
        },
      ],
      notes: cashRegister?.notes ? [cashRegister.notes] : [],
      payload: {
        type,
        cashRegisterId: cashRegister?.id ?? null,
        openingAmount: cashRegister?.openingAmount ?? 0,
        expectedAmount: cashRegister?.expectedAmount ?? 0,
        sales,
        tips,
        outflows,
      },
    };
  }

  if (type === "reservation_sheet") {
    return {
      title: reservation
        ? `Reserva ${reservation.customerName}`
        : "Ficha de reserva",
      subtitle: reservation
        ? `${reservation.date} ${reservation.time}`
        : "Sin reserva seleccionada",
      meta: [
        { label: "Cliente", value: reservation?.customerName ?? "-" },
        { label: "Telefono", value: reservation?.customerPhone ?? customer?.phone ?? "-" },
        {
          label: "Mesa",
          value: reservation?.tableNumber ? `Mesa ${reservation.tableNumber}` : "-",
        },
      ],
      lines: [
        { label: "Comensales", value: String(reservation?.partySize ?? 0) },
        { label: "Canal", value: reservation?.channel ?? "-" },
        { label: "Ocasion", value: reservation?.occasion || "-" },
        { label: "Alergias", value: customer?.allergies.join(", ") || "-" },
      ],
      totals: [],
      notes: [
        reservation?.notes ?? "",
        customer?.preferences ?? "",
        customer?.notes ?? "",
      ].filter(Boolean),
      payload: {
        type,
        reservationId: reservation?.id ?? null,
        customer: reservation?.customerName ?? null,
        partySize: reservation?.partySize ?? null,
        allergies: customer?.allergies ?? [],
      },
    };
  }

  return {
    title: order ? `Pre-cuenta ${order.number}` : "Pre-cuenta",
    subtitle: order ? `Mesa ${order.tableNumber}` : "Sin pedido seleccionado",
    meta: [
      { label: "Pedido", value: order?.number ?? "-" },
      { label: "Mesero", value: order?.waiter ?? "-" },
      { label: "Estado", value: order ? orderStatusMeta[order.status].label : "-" },
    ],
    lines: orderLines,
    totals: [
      { label: "Subtotal", value: formatCurrency(orderSubtotal) },
      { label: "Descuento", value: formatCurrency(order?.discount ?? 0) },
      { label: "Propina sugerida", value: formatCurrency(order?.tip ?? 0) },
      { label: "Total", value: formatCurrency(order?.total ?? 0), strong: true },
    ],
    notes:
      order?.items
        .map((item) => item.notes)
        .filter((note): note is string => Boolean(note)) ?? [],
    payload: {
      type,
      orderNumber: order?.number ?? null,
      table: order?.tableNumber ?? null,
      subtotal: orderSubtotal,
      discount: order?.discount ?? 0,
      tip: order?.tip ?? 0,
      total: order?.total ?? 0,
      items: order?.items ?? [],
    },
  };
}

function getOperationalDocumentLabel(type: OperationalDocumentType) {
  return (
    operationalDocumentTypeOptions.find((option) => option.type === type)?.label ??
    type
  );
}

function getOperationalDocumentScope(type: OperationalDocumentType) {
  const labels: Record<OperationalDocumentType, string> = {
    kitchen_ticket: "Cocina",
    table_prebill: "Mesa",
    payment_receipt: "Caja",
    cash_close: "Turno",
    reservation_sheet: "Salon",
  };

  return labels[type];
}

function SettingsModule({
  onSaveSettings,
}: {
  onSaveSettings: (settings: RestaurantSettingsDraft) => void;
}) {
  const { settings } = useRestaurantData();
  const [draft, setDraft] = useState<RestaurantSettingsDraft>(settings);
  const activeZones = draft.tableZones.filter((zone) => zone.active);
  const activePrinters = draft.printStations.filter(
    (station) => station.autoPrint,
  );
  const activeSeries = draft.documentSeries.filter((series) => series.enabled);

  const updateField = <K extends keyof RestaurantSettingsDraft>(
    key: K,
    value: RestaurantSettingsDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateSeries = (
    index: number,
    updates: Partial<RestaurantSettingsDraft["documentSeries"][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      documentSeries: current.documentSeries.map((series, currentIndex) =>
        currentIndex === index ? { ...series, ...updates } : series,
      ),
    }));
  };

  const updatePrintStation = (
    index: number,
    updates: Partial<RestaurantSettingsDraft["printStations"][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      printStations: current.printStations.map((station, currentIndex) =>
        currentIndex === index ? { ...station, ...updates } : station,
      ),
    }));
  };

  const updateOperatingHour = (
    index: number,
    updates: Partial<RestaurantSettingsDraft["operatingHours"][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      operatingHours: current.operatingHours.map((hour, currentIndex) =>
        currentIndex === index ? { ...hour, ...updates } : hour,
      ),
    }));
  };

  const updateTableZone = (
    index: number,
    updates: Partial<RestaurantSettingsDraft["tableZones"][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      tableZones: current.tableZones.map((zone, currentIndex) =>
        currentIndex === index ? { ...zone, ...updates } : zone,
      ),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveSettings(draft);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <SectionHeader
        eyebrow="Configuracion"
        title="Identidad institucional y reglas del local"
        description="Parametros persistibles para branding, documentos, estaciones de impresion, horarios y zonas operativas."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Zonas activas"
          value={activeZones.length.toString()}
          icon={Table2}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Capacidad"
          value={activeZones
            .reduce((total, zone) => total + zone.capacity, 0)
            .toString()}
          icon={Users}
          tone="bg-[var(--udla-charcoal)]"
        />
        <MetricCard
          label="Auto impresion"
          value={activePrinters.length.toString()}
          icon={Printer}
          tone="bg-zinc-900"
        />
        <MetricCard
          label="Series activas"
          value={activeSeries.length.toString()}
          icon={ReceiptText}
          tone="bg-amber-600"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Identidad de academia" icon={Store}>
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-950 p-4 ring-1 ring-black/10 dark:ring-white/10">
              <Image
                src={getSafeLogoUrl(draft.logoUrl)}
                alt={`Logo ${draft.academyName}`}
                width={260}
                height={74}
                className="h-auto max-h-20 w-auto object-contain"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Nombre comercial"
                value={draft.restaurantName}
                onChange={(value) => updateField("restaurantName", value)}
              />
              <TextInput
                label="Academia"
                value={draft.academyName}
                onChange={(value) => updateField("academyName", value)}
              />
              <TextInput
                label="Razon social"
                value={draft.legalName}
                onChange={(value) => updateField("legalName", value)}
              />
              <TextInput
                label="RUT"
                value={draft.taxId}
                onChange={(value) => updateField("taxId", value)}
              />
              <TextInput
                label="Telefono"
                value={draft.phone}
                onChange={(value) => updateField("phone", value)}
              />
              <TextInput
                label="Email"
                value={draft.email}
                onChange={(value) => updateField("email", value)}
              />
            </div>

            <TextInput
              label="Direccion"
              value={draft.address}
              onChange={(value) => updateField("address", value)}
            />
            <TextInput
              label="Logo"
              value={draft.logoUrl}
              onChange={(value) => updateField("logoUrl", value)}
            />
          </div>
        </Panel>

        <Panel title="Reglas comerciales" icon={Calculator}>
          <div className="grid gap-4 md:grid-cols-2">
            <NumberInput
              label="Servicio sugerido"
              value={draft.serviceChargePercent}
              suffix="%"
              onChange={(value) => updateField("serviceChargePercent", value)}
            />
            <NumberInput
              label="Impuesto referencial"
              value={draft.taxPercent}
              suffix="%"
              onChange={(value) => updateField("taxPercent", value)}
            />
            <TextInput
              label="Moneda"
              value={draft.currency}
              onChange={(value) => updateField("currency", value)}
            />
            <TextInput
              label="Locale"
              value={draft.locale}
              onChange={(value) => updateField("locale", value)}
            />
          </div>

          <div className="mt-5 grid gap-2">
            {draft.operatingHours.map((hour, index) => (
              <div
                key={hour.day}
                className="grid gap-2 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_110px_110px_90px]"
              >
                <span className="self-center font-semibold">{hour.day}</span>
                <input
                  type="time"
                  value={hour.open}
                  onChange={(event) =>
                    updateOperatingHour(index, { open: event.target.value })
                  }
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
                <input
                  type="time"
                  value={hour.close}
                  onChange={(event) =>
                    updateOperatingHour(index, { close: event.target.value })
                  }
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={hour.enabled}
                    onChange={(event) =>
                      updateOperatingHour(index, { enabled: event.target.checked })
                    }
                  />
                  Activo
                </label>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Series de documentos" icon={ReceiptText}>
          <div className="space-y-3">
            {draft.documentSeries.map((series, index) => (
              <div
                key={series.type}
                className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_90px_120px_90px]"
              >
                <span className="self-center font-semibold">
                  {getOperationalDocumentLabel(series.type)}
                </span>
                <input
                  value={series.prefix}
                  onChange={(event) =>
                    updateSeries(index, { prefix: event.target.value })
                  }
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold uppercase dark:border-white/10 dark:bg-zinc-950"
                />
                <input
                  type="number"
                  min={1}
                  value={series.nextNumber}
                  onChange={(event) =>
                    updateSeries(index, {
                      nextNumber: Number(event.target.value),
                    })
                  }
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={series.enabled}
                    onChange={(event) =>
                      updateSeries(index, { enabled: event.target.checked })
                    }
                  />
                  Activa
                </label>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Estaciones de impresion" icon={Printer}>
          <div className="space-y-3">
            {draft.printStations.map((station, index) => (
              <div
                key={station.id}
                className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_1fr_96px]"
              >
                <div>
                  <p className="font-semibold">{station.name}</p>
                  <p className="text-sm text-zinc-500">{station.area}</p>
                </div>
                <input
                  value={station.printerName}
                  onChange={(event) =>
                    updatePrintStation(index, {
                      printerName: event.target.value,
                    })
                  }
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={station.autoPrint}
                    onChange={(event) =>
                      updatePrintStation(index, {
                        autoPrint: event.target.checked,
                      })
                    }
                  />
                  Auto
                </label>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Zonas de salon" icon={Table2}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {draft.tableZones.map((zone, index) => (
            <div
              key={zone.name}
              className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <span className={`block h-2 rounded-full ${zone.color}`} />
              <TextInput
                label="Zona"
                value={zone.name}
                onChange={(value) => updateTableZone(index, { name: value })}
              />
              <NumberInput
                label="Capacidad"
                value={zone.capacity}
                onChange={(value) => updateTableZone(index, { capacity: value })}
              />
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={zone.active}
                  onChange={(event) =>
                    updateTableZone(index, { active: event.target.checked })
                  }
                />
                Zona activa
              </label>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
        >
          <Settings className="h-4 w-4" />
          Guardar configuracion
        </button>
      </div>
    </form>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-3 grid gap-2 text-sm font-semibold">
      {label}
      <span className="flex h-10 overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        {suffix ? (
          <span className="flex items-center border-l border-black/10 px-3 text-sm text-zinc-500 dark:border-white/10">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ReportsModule() {
  const snapshot = useRestaurantData();
  const reports = buildOperationalReports(snapshot);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analitica"
        title="Reportes reales de operacion y rentabilidad"
        description="Indicadores calculados desde pedidos, caja, inventario, compras, recetas, productos, mermas y desempeno del equipo."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Venta reconocida"
          value={formatCurrency(reports.recognizedSales)}
          icon={BadgeDollarSign}
          tone="bg-emerald-600"
        />
        <MetricCard
          label="Margen estimado"
          value={formatCurrency(reports.grossMargin)}
          icon={BarChart3}
          tone="bg-[var(--udla-charcoal)]"
        />
        <MetricCard
          label="Mermas valorizadas"
          value={formatCurrency(reports.wasteValue)}
          icon={AlertTriangle}
          tone="bg-red-600"
        />
        <MetricCard
          label="Pedidos cancelados"
          value={reports.cancelledOrders.toString()}
          icon={ReceiptText}
          tone="bg-zinc-900"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Inventario valorizado"
          value={formatCurrency(reports.inventoryValue)}
          icon={Boxes}
          tone="bg-orange-600"
        />
        <MetricCard
          label="Compras registradas"
          value={formatCurrency(reports.purchaseTotal)}
          icon={ShoppingCart}
          tone="bg-[var(--udla-charcoal)]"
        />
        <MetricCard
          label="Food cost real"
          value={formatPercent(reports.foodCostPercent)}
          icon={Calculator}
          tone="bg-[var(--udla-orange)]"
        />
        <MetricCard
          label="Ticket promedio"
          value={formatCurrency(reports.averageTicket)}
          icon={CreditCard}
          tone="bg-lime-600"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Ventas y margen" icon={BarChart3}>
          <div className="h-[320px] min-w-0">
            <SalesBarsChart reportPoints={reports.reportPoints} />
          </div>
        </Panel>
        <Panel title="Indicadores criticos" icon={Activity}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Producto mas vendido", reports.topProduct?.name ?? "Sin ventas"],
              ["Producto menos vendido", reports.lowProduct?.name ?? "Sin ventas"],
              ["Mayor merma", reports.topWaste?.name ?? "Sin mermas"],
              ["Tiempo cocina promedio", `${reports.averageKitchenMinutes} min`],
              ["Stock bajo", reports.lowStockCount.toString()],
              ["Diferencia caja", formatCurrency(reports.cashDifference)],
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

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Rentabilidad por producto" icon={Salad}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-3 font-semibold">Producto</th>
                  <th className="py-3 font-semibold">Cantidad</th>
                  <th className="py-3 font-semibold">Venta</th>
                  <th className="py-3 font-semibold">Costo</th>
                  <th className="py-3 font-semibold">Food cost</th>
                  <th className="py-3 text-right font-semibold">Margen</th>
                </tr>
              </thead>
              <tbody>
                {reports.productReports.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="py-3 font-semibold">{product.name}</td>
                    <td className="py-3">
                      {numberFormatter.format(product.quantity)}
                    </td>
                    <td className="py-3">{formatCurrency(product.sales)}</td>
                    <td className="py-3">{formatCurrency(product.cost)}</td>
                    <td className="py-3">
                      {formatPercent(product.foodCostPercent)}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatCurrency(product.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Caja por metodo" icon={CreditCard}>
          <div className="space-y-3">
            {Object.entries(reports.paymentTotals).map(([method, amount]) => (
              <div
                key={method}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
              >
                <span className="font-semibold">
                  {method === "internal"
                    ? "Interno"
                    : paymentLabels[method as PaymentMethod]}
                </span>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <InfoPill
                label="Propinas"
                value={formatCurrency(reports.tipTotal)}
              />
              <InfoPill
                label="Retiros y adelantos"
                value={formatCurrency(reports.cashOutTotal)}
              />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Compras por proveedor" icon={Store}>
          <div className="space-y-3">
            {reports.supplierReports.map((supplier) => (
              <div
                key={supplier.name}
                className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{supplier.name}</p>
                  <p className="font-semibold">{formatCurrency(supplier.total)}</p>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {supplier.count} compras registradas
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Mermas por insumo" icon={AlertTriangle}>
          <div className="space-y-3">
            {reports.wasteReports.map((waste) => (
              <div
                key={waste.name}
                className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{waste.name}</p>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(waste.value)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {numberFormatter.format(waste.quantity)} unidades mermadas
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Desempeno de trabajadores" icon={Users}>
          <div className="space-y-3">
            {reports.employeeReports.map((employee) => (
              <div
                key={employee.name}
                className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{employee.name}</p>
                  <p className="font-semibold">
                    {formatCurrency(employee.sales)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {employee.orders} pedidos atendidos
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FoodSafetyModule({
  onRegisterCheck,
}: {
  onRegisterCheck: (check: FoodSafetyCheckDraft) => void;
}) {
  const { rawMaterials, foodSafetyLogs } = useRestaurantData();
  const [rawMaterialId, setRawMaterialId] = useState(rawMaterials[0]?.id ?? "");
  const [checkType, setCheckType] = useState<string>(foodSafetyCheckTypes[0]);
  const [measuredTemperature, setMeasuredTemperature] = useState("");
  const [result, setResult] = useState<FoodSafetyResult>("ok");
  const [notes, setNotes] = useState("");

  const selectedMaterial =
    rawMaterials.find((material) => material.id === rawMaterialId) ??
    rawMaterials[0];
  const effectiveRawMaterialId = selectedMaterial?.id ?? "";
  const todayLogs = foodSafetyLogs.filter((log) => isSameLocalDay(log.createdAt));
  const materialAlerts = rawMaterials
    .map((material) => ({
      material,
      daysUntilExpiration: getDaysUntilExpiration(material.expirationDate),
      state: getFoodSafetyMaterialState(material),
      lastLog: foodSafetyLogs.find((log) => log.rawMaterialId === material.id),
    }))
    .sort((a, b) => {
      const priority = { critical: 0, warning: 1, ok: 2 };
      return (
        priority[a.state.result] - priority[b.state.result] ||
        a.daysUntilExpiration - b.daysUntilExpiration
      );
    });
  const expiringSoonCount = materialAlerts.filter(
    (alert) => alert.daysUntilExpiration >= 0 && alert.daysUntilExpiration <= 3,
  ).length;
  const expiredCount = materialAlerts.filter(
    (alert) => alert.daysUntilExpiration < 0,
  ).length;
  const highRiskCount = rawMaterials.filter(
    (material) => material.sanitaryRisk === "high",
  ).length;
  const nonConformingCount = foodSafetyLogs.filter(
    (log) => log.result !== "ok",
  ).length;
  const highRiskCheckedToday = rawMaterials.filter(
    (material) =>
      material.sanitaryRisk === "high" &&
      todayLogs.some((log) => log.rawMaterialId === material.id),
  ).length;
  const checklist = [
    {
      label: "Riesgo alto controlado hoy",
      value: `${highRiskCheckedToday}/${Math.max(highRiskCount, 1)}`,
      result:
        highRiskCount === 0 || highRiskCheckedToday >= highRiskCount
          ? "ok"
          : "warning",
    },
    {
      label: "Lotes vencidos",
      value: expiredCount.toString(),
      result: expiredCount > 0 ? "critical" : "ok",
    },
    {
      label: "Vencen en 72 horas",
      value: expiringSoonCount.toString(),
      result: expiringSoonCount > 0 ? "warning" : "ok",
    },
    {
      label: "Observaciones abiertas",
      value: nonConformingCount.toString(),
      result: nonConformingCount > 0 ? "warning" : "ok",
    },
  ] satisfies Array<{
    label: string;
    value: string;
    result: FoodSafetyResult;
  }>;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onRegisterCheck({
      rawMaterialId: effectiveRawMaterialId,
      checkType,
      measuredTemperature: measuredTemperature.trim(),
      result,
      notes: notes.trim(),
    });

    setMeasuredTemperature("");
    setNotes("");
    setResult("ok");
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Higiene y almacenamiento"
        title="Seguridad alimentaria avanzada"
        description="Controla temperatura, vencimientos, alergenos, FIFO/LIFO, observaciones sanitarias y trazabilidad por lote."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Controles hoy"
          value={todayLogs.length.toString()}
          detail="Registros sanitarios"
        />
        <MetricTile
          label="Riesgo alto"
          value={highRiskCount.toString()}
          detail="Materias primas"
        />
        <MetricTile
          label="Vencen pronto"
          value={expiringSoonCount.toString()}
          detail="Proximas 72 horas"
        />
        <MetricTile
          label="Lotes vencidos"
          value={expiredCount.toString()}
          detail="Retiro requerido"
          tone={expiredCount > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Registro sanitario" icon={ClipboardCheck}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold">
              Materia prima
              <select
                value={effectiveRawMaterialId}
                onChange={(event) => setRawMaterialId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              >
                {rawMaterials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} · Lote {material.lot}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Tipo de control
                <select
                  value={checkType}
                  onChange={(event) => setCheckType(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  {foodSafetyCheckTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Medicion
                <input
                  value={measuredTemperature}
                  onChange={(event) => setMeasuredTemperature(event.target.value)}
                  placeholder={selectedMaterial?.storageTemperature ?? "0 a 4 C"}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {(Object.keys(foodSafetyResultMeta) as FoodSafetyResult[]).map(
                (status) => {
                  const meta = foodSafetyResultMeta[status];
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setResult(status)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        result === status
                          ? meta.className
                          : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                },
              )}
            </div>

            <label className="block text-sm font-semibold">
              Observaciones
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Registro de lote, rotulacion, limpieza, separacion o accion correctiva."
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </label>

            {selectedMaterial ? (
              <div className="grid gap-2 md:grid-cols-3">
                <InfoPill
                  label="Temperatura"
                  value={selectedMaterial.storageTemperature}
                />
                <InfoPill
                  label="Rotacion"
                  value={selectedMaterial.storageMethod}
                />
                <InfoPill
                  label="Vence"
                  value={formatDateLabel(selectedMaterial.expirationDate)}
                />
              </div>
            ) : null}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              <ShieldCheck className="h-4 w-4" />
              Registrar control
            </button>
          </form>
        </Panel>

        <Panel title="Alertas por lote" icon={AlertTriangle}>
          <div className="space-y-3">
            {materialAlerts.slice(0, 7).map(({ material, state, lastLog }) => {
              const meta = foodSafetyResultMeta[state.result];
              return (
                <div
                  key={material.id}
                  className={`rounded-lg border p-4 ${meta.className}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{material.name}</p>
                      <p className="mt-1 text-sm opacity-80">
                        Lote {material.lot || "sin lote"} · {state.detail}
                      </p>
                    </div>
                    <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-zinc-900">
                      {state.label}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                    <InfoPill
                      label="Categoria"
                      value={categoryMeta[material.category].label}
                    />
                    <InfoPill
                      label="Stock"
                      value={`${numberFormatter.format(material.stock)} ${material.unit}`}
                    />
                    <InfoPill
                      label="Ultimo control"
                      value={lastLog ? lastLog.time : "Sin registro"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Bitacora sanitaria" icon={ListChecks}>
          <div className="space-y-3">
            {foodSafetyLogs.slice(0, 8).map((log) => {
              const meta = foodSafetyResultMeta[log.result];
              return (
                <div
                  key={log.id}
                  className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{log.materialName}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {log.checkType} · {log.time} · {log.responsible}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold ${meta.className}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {log.measuredTemperature}
                    {log.notes ? ` · ${log.notes}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Checklist bodega" icon={Archive}>
          <div className="space-y-3">
            {checklist.map((item) => {
              const meta = foodSafetyResultMeta[item.result];
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
                    <p className="font-semibold">{item.label}</p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${meta.className}`}
                  >
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(categoryMeta).map(([key, meta]) => (
              <div
                key={key}
                className={`rounded-lg border p-3 ${meta.className}`}
              >
                <span className={`mb-3 block h-2 rounded-full ${meta.bar}`} />
                <p className="font-semibold">{meta.label}</p>
                <p className="mt-1 text-sm opacity-80">
                  {
                    rawMaterials.filter((material) => material.category === key)
                      .length
                  }{" "}
                  insumos
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-950"
          : "border-black/10 bg-white dark:border-white/10 dark:bg-[#18191b]"
      }`}
    >
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm opacity-75">{detail}</p>
    </div>
  );
}

function getFoodSafetyMaterialState(material: RawMaterial): {
  result: FoodSafetyResult;
  label: string;
  detail: string;
} {
  const daysUntilExpiration = getDaysUntilExpiration(material.expirationDate);

  if (daysUntilExpiration < 0) {
    return {
      result: "critical",
      label: "Retirar",
      detail: `Vencido hace ${Math.abs(daysUntilExpiration)} dias`,
    };
  }

  if (material.sanitaryRisk === "high" && daysUntilExpiration <= 1) {
    return {
      result: "critical",
      label: "Riesgo alto",
      detail: `Vence en ${daysUntilExpiration} dias`,
    };
  }

  if (daysUntilExpiration <= 3) {
    return {
      result: "warning",
      label: "Priorizar",
      detail: `Vence en ${daysUntilExpiration} dias`,
    };
  }

  if (material.stock <= material.minStock) {
    return {
      result: "warning",
      label: "Stock bajo",
      detail: "Revisar continuidad de servicio",
    };
  }

  return {
    result: "ok",
    label: "Conforme",
    detail: `${getSanitaryRiskLabel(material.sanitaryRisk)} · ${formatDateLabel(
      material.expirationDate,
    )}`,
  };
}

function getDaysUntilExpiration(expirationDate: string) {
  if (!expirationDate) {
    return Number.POSITIVE_INFINITY;
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const expiration = new Date(`${expirationDate}T00:00:00`).getTime();

  if (!Number.isFinite(expiration)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil((expiration - todayStart) / 86400000);
}

function getSanitaryRiskLabel(risk: RawMaterial["sanitaryRisk"]) {
  if (risk === "high") {
    return "Riesgo alto";
  }

  if (risk === "medium") {
    return "Riesgo medio";
  }

  return "Riesgo bajo";
}

function formatDateLabel(value: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function isSameLocalDay(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function EmployeesModule({
  onSaveEmployee,
}: {
  onSaveEmployee: (employee: EmployeeDraft) => string;
}) {
  const { employees, orders } = useRestaurantData();
  const [draft, setDraft] = useState<EmployeeDraft>(() =>
    employeeToDraft(employees[0]),
  );
  const performanceByName = new Map(
    buildEmployeeReports(orders).map((report) => [report.name, report]),
  );
  const enrichedEmployees = employees.map((employee) => {
    const performance = performanceByName.get(employee.name);

    return {
      ...employee,
      sales: performance?.sales ?? employee.sales,
      orders: performance?.orders ?? employee.orders,
    };
  });
  const activeEmployees = enrichedEmployees.filter(
    (employee) => employee.status === "active",
  );
  const payrollProjection = enrichedEmployees.reduce(
    (total, employee) => total + employee.hourlyCost * 8,
    0,
  );
  const totalSales = enrichedEmployees.reduce(
    (total, employee) => total + employee.sales,
    0,
  );
  const productivityRatio = payrollProjection > 0 ? totalSales / payrollProjection : 0;

  function updateDraft<Key extends keyof EmployeeDraft>(
    key: Key,
    value: EmployeeDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const employeeId = onSaveEmployee(draft);

    if (employeeId) {
      setDraft((current) => ({ ...current, id: employeeId }));
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Equipo y permisos"
        title="Gestion avanzada de trabajadores"
        description="Administra altas, roles, turnos, estados, contacto, costo horario, productividad y permisos por area."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Trabajadores activos"
          value={`${activeEmployees.length}/${employees.length}`}
          detail="Disponibles para turno"
        />
        <MetricTile
          label="Costo turno estimado"
          value={formatCurrency(payrollProjection)}
          detail="Base 8 horas"
        />
        <MetricTile
          label="Ventas por costo laboral"
          value={`${productivityRatio.toFixed(1)}x`}
          detail="Productividad operativa"
        />
        <MetricTile
          label="En pausa/offline"
          value={enrichedEmployees
            .filter((employee) => employee.status !== "active")
            .length.toString()}
          detail="Requiere cobertura"
          tone={
            enrichedEmployees.some((employee) => employee.status === "offline")
              ? "danger"
              : "neutral"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Dotacion por turno" icon={Users}>
          <div className="space-y-3">
            {enrichedEmployees.map((employee) => {
              const role = getRoleProfile(employee.role);
              return (
                <div
                  key={employee.id}
                  className="grid gap-3 rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_140px_130px_110px]"
                >
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-zinc-500">
                      {role.label} · {employee.shift}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {employee.phone || "Sin telefono"} ·{" "}
                      {employee.hiredAt
                        ? `Ingreso ${formatDateLabel(employee.hiredAt)}`
                        : "Sin fecha de ingreso"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-zinc-500">
                      Ventas
                    </p>
                    <p className="font-semibold">{formatCurrency(employee.sales)}</p>
                    <p className="text-xs text-zinc-500">{employee.orders} pedidos</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-zinc-500">
                      Costo hora
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(employee.hourlyCost)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <EmployeeStatusBadge status={employee.status} />
                    <button
                      type="button"
                      onClick={() => setDraft(employeeToDraft(employee))}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={draft.id ? "Editar trabajador" : "Nuevo trabajador"} icon={UserRound}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Nombre completo
                <input
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Rol
                <select
                  value={draft.role}
                  onChange={(event) =>
                    updateDraft("role", event.target.value as RoleId)
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  {roleProfiles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                RUT
                <input
                  value={draft.rut}
                  onChange={(event) => updateDraft("rut", event.target.value)}
                  placeholder="12.345.678-9"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Telefono
                <input
                  value={draft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                  placeholder="+56 9 ..."
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Turno
                <input
                  value={draft.shift}
                  onChange={(event) => updateDraft("shift", event.target.value)}
                  placeholder="Salon PM"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-sm font-semibold">
                Costo horario
                <input
                  inputMode="numeric"
                  value={draft.hourlyCost || ""}
                  onChange={(event) =>
                    updateDraft("hourlyCost", parseCurrencyInput(event.target.value))
                  }
                  placeholder="6500"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Estado
                <select
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft("status", event.target.value as Employee["status"])
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  {Object.entries(employeeStatusMeta).map(([status, meta]) => (
                    <option key={status} value={status}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Fecha de ingreso
                <input
                  type="date"
                  value={draft.hiredAt}
                  onChange={(event) => updateDraft("hiredAt", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <InfoPill
                label="Costo turno"
                value={formatCurrency(draft.hourlyCost * 8)}
              />
              <InfoPill
                label="Permisos"
                value={getRoleProfile(draft.role).permissions.length.toString()}
              />
              <InfoPill
                label="Estado"
                value={employeeStatusMeta[draft.status].label}
              />
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                <Users className="h-4 w-4" />
                Guardar trabajador
              </button>
              <button
                type="button"
                onClick={() => setDraft(createBlankEmployeeDraft())}
                className="rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Nuevo
              </button>
            </div>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
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

        <Panel title="Productividad por rol" icon={BadgeDollarSign}>
          <div className="space-y-3">
            {roleProfiles
              .map((role) => {
                const group = enrichedEmployees.filter(
                  (employee) => employee.role === role.id,
                );
                const sales = group.reduce(
                  (total, employee) => total + employee.sales,
                  0,
                );
                const labor = group.reduce(
                  (total, employee) => total + employee.hourlyCost * 8,
                  0,
                );

                return { role, count: group.length, sales, labor };
              })
              .filter((row) => row.count > 0)
              .map((row) => (
                <div
                  key={row.role.id}
                  className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.role.label}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {row.count} trabajador{row.count === 1 ? "" : "es"}
                      </p>
                    </div>
                    <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-semibold dark:border-white/10 dark:bg-zinc-800">
                      {row.labor > 0 ? `${(row.sales / row.labor).toFixed(1)}x` : "0x"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <InfoPill label="Ventas" value={formatCurrency(row.sales)} />
                    <InfoPill
                      label="Costo turno"
                      value={formatCurrency(row.labor)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EmployeeStatusBadge({ status }: { status: Employee["status"] }) {
  const meta = employeeStatusMeta[status];

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${meta.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function employeeToDraft(employee?: Employee): EmployeeDraft {
  if (!employee) {
    return createBlankEmployeeDraft();
  }

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    rut: employee.rut,
    phone: employee.phone,
    shift: employee.shift,
    hourlyCost: employee.hourlyCost,
    status: employee.status,
    hiredAt: employee.hiredAt ?? "",
  };
}

function createBlankEmployeeDraft(): EmployeeDraft {
  return {
    name: "",
    role: "waiter",
    rut: "",
    phone: "",
    shift: "Salon PM",
    hourlyCost: 0,
    status: "active",
    hiredAt: new Date().toISOString().slice(0, 10),
  };
}

function AuditModule() {
  const { auditLogs } = useRestaurantData();
  const [entityFilter, setEntityFilter] = useState("all");
  const entityTypes = Array.from(
    new Set(auditLogs.map((log) => log.entityType)),
  ).sort();
  const filteredLogs =
    entityFilter === "all"
      ? auditLogs
      : auditLogs.filter((log) => log.entityType === entityFilter);
  const todayLogs = auditLogs.filter((log) => isSameLocalDay(log.createdAt));
  const uniqueActors = new Set(auditLogs.map((log) => log.actor)).size;
  const protectedChanges = auditLogs.filter((log) =>
    [
      "cash_register",
      "raw_material",
      "employee",
      "customer",
      "reservation",
      "recipe",
      "product",
    ].includes(log.entityType),
  ).length;
  const entityReports = buildAuditEntityReports(auditLogs);
  const lastLog = auditLogs[0];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Trazabilidad"
        title="Auditoria operativa transversal"
        description="Revisa acciones criticas de caja, pedidos, inventario, recetas, productos, trabajadores y seguridad alimentaria con actor, rol, entidad y metadata."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Eventos hoy"
          value={todayLogs.length.toString()}
          detail="Acciones auditadas"
        />
        <MetricTile
          label="Actores"
          value={uniqueActors.toString()}
          detail="Responsables distintos"
        />
        <MetricTile
          label="Cambios sensibles"
          value={protectedChanges.toString()}
          detail="Caja, bodega, RRHH y carta"
        />
        <MetricTile
          label="Ultimo evento"
          value={lastLog ? lastLog.time : "--:--"}
          detail={lastLog ? getAuditActionLabel(lastLog.action) : "Sin actividad"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Bitacora reciente" icon={ListChecks}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-zinc-500">
              {filteredLogs.length} eventos visibles
            </p>
            <select
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-zinc-950"
            >
              <option value="all">Todas las entidades</option>
              {entityTypes.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {getAuditEntityLabel(entityType)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredLogs.slice(0, 12).map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </div>
        </Panel>

        <Panel title="Cobertura por entidad" icon={Activity}>
          <div className="space-y-3">
            {entityReports.map((report) => (
              <div
                key={report.entityType}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {getAuditEntityLabel(report.entityType)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Ultima accion {formatDateLabel(report.lastCreatedAt.slice(0, 10))} ·{" "}
                      {formatTime(report.lastCreatedAt)}
                    </p>
                  </div>
                  <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-semibold dark:border-white/10 dark:bg-zinc-800">
                    {report.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const role = log.actorRole ? getRoleProfile(log.actorRole) : undefined;
  const metadata = Object.entries(log.metadata).slice(0, 4);

  return (
    <div className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{getAuditActionLabel(log.action)}</p>
          <p className="mt-1 text-sm text-zinc-500">{log.summary}</p>
        </div>
        <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-semibold dark:border-white/10 dark:bg-zinc-800">
          {getAuditEntityLabel(log.entityType)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <InfoPill label="Actor" value={log.actor} />
        <InfoPill label="Rol" value={role?.label ?? "Sin rol"} />
        <InfoPill
          label="Fecha"
          value={`${formatDateLabel(log.createdAt.slice(0, 10))} ${log.time}`}
        />
      </div>

      {metadata.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {metadata.map(([key, value]) => (
            <span
              key={key}
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {key}: {formatAuditMetadataValue(value)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildAuditEntityReports(auditLogs: AuditLog[]) {
  const reports = new Map<
    string,
    { entityType: string; count: number; lastCreatedAt: string }
  >();

  auditLogs.forEach((log) => {
    const current = reports.get(log.entityType) ?? {
      entityType: log.entityType,
      count: 0,
      lastCreatedAt: log.createdAt,
    };

    current.count += 1;

    if (new Date(log.createdAt) > new Date(current.lastCreatedAt)) {
      current.lastCreatedAt = log.createdAt;
    }

    reports.set(log.entityType, current);
  });

  return [...reports.values()].sort((left, right) => right.count - left.count);
}

function getAuditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "table.status.update": "Cambio de mesa",
    "order.status.update": "Cambio de pedido",
    "order.item.add": "Producto agregado",
    "kitchen.ticket.create": "Comanda enviada",
    "cash.register.open": "Apertura de caja",
    "cash.register.close": "Cierre de caja",
    "cash.movement.create": "Movimiento de caja",
    "cash.payment.settle": "Cobro de cuenta",
    "inventory.movement.create": "Movimiento de inventario",
    "food_safety.check.create": "Control sanitario",
    "employee.upsert": "Trabajador guardado",
    "customer.upsert": "Cliente guardado",
    "reservation.upsert": "Reserva guardada",
    "crm.interaction.create": "Seguimiento CRM",
    "document.print": "Documento impreso",
    "purchase.receive": "Compra recepcionada",
    "recipe.upsert": "Receta guardada",
    "product.upsert": "Producto guardado",
  };

  return labels[action] ?? action;
}

function getAuditEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    table: "Mesa",
    order: "Pedido",
    cash_register: "Caja",
    raw_material: "Materia prima",
    employee: "Trabajador",
    customer: "Cliente",
    reservation: "Reserva",
    operational_document: "Documento",
    purchase: "Compra",
    recipe: "Receta",
    product: "Producto",
  };

  return labels[entityType] ?? entityType;
}

function formatAuditMetadataValue(value: unknown) {
  if (typeof value === "number") {
    return numberFormatter.format(value);
  }

  if (typeof value === "boolean") {
    return value ? "si" : "no";
  }

  if (value === null || value === undefined) {
    return "sin dato";
  }

  if (typeof value === "object") {
    return "detalle";
  }

  return String(value);
}

const EDUCATION_PROGRESS_KEY = "udla-education-proof-progress-v6";
const EDUCATION_LEGACY_PROGRESS_KEYS = [
  "udla-education-proof-progress-v5",
  "udla-education-proof-progress-v4",
  "udla-education-proof-progress-v3",
  "udla-education-proof-progress-v2",
  "udla-education-proof-progress-v1",
];

interface EducationAction {
  id: string;
  moduleId: ModuleId;
  label: string;
  task: string;
  outcome: string;
}

interface EducationPhase {
  id: string;
  title: string;
  scene: string;
  goal: string;
  caseNarrative: string;
  actions: EducationAction[];
}

interface EducationQuestionOption {
  id: string;
  label: string;
}

interface EducationPracticeField {
  id: string;
  label: string;
  type: "text" | "number" | "select";
  correctValue: string;
  placeholder?: string;
  helper?: string;
  options?: Array<{ value: string; label: string }>;
}

interface EducationChallenge {
  question: string;
  options: EducationQuestionOption[];
  correctOptionId: string;
  practiceTitle: string;
  practiceDescription: string;
  fields: EducationPracticeField[];
}

const educationPhases: EducationPhase[] = [
  {
    id: "briefing",
    title: "Briefing de turno",
    scene: "El equipo llega antes del servicio y debe dejar listo el local.",
    goal: "Preparar datos, roles y tablero operativo antes de recibir clientes.",
    caseNarrative:
      "Son las 09:00 y Paula Contreras abre el turno AM con $120.000 de caja inicial. En la revision previa aparece la reserva de Carolina Munoz para las 20:30, con 6 comensales y alergia a lacteos. El equipo del servicio queda organizado con Valentina Reyes como mesero, Felipe Araya en caja y Daniel Vega en bodega. Para no partir sin abastecimiento, se confirma que Carnes Andinas tiene el documento recepcionado y una confiabilidad de 96. La estacion que debe quedar lista para comandas es Cocina caliente, con impresora EPSON-Cocina-01 y autoimpresion activa.",
    actions: [
      {
        id: "briefing-dashboard",
        moduleId: "dashboard",
        label: "Abrir turno operativo",
        task: "Abre el turno AM con caja inicial, responsable y lectura de indicadores.",
        outcome: "Turno abierto: el estudiante inicio operacion con caja y contexto.",
      },
      {
        id: "briefing-reservations",
        moduleId: "crm",
        label: "Revisar reservas",
        task: "Confirma reservas del turno, mesa asignada, hora y restricciones alimentarias.",
        outcome: "Reservas revisadas: salon conoce la llegada critica del servicio.",
      },
      {
        id: "briefing-employees",
        moduleId: "employees",
        label: "Asignar equipo",
        task: "Revisa trabajadores activos, roles, turnos y costo por hora.",
        outcome: "Equipo asignado: cada rol sabe que debe operar.",
      },
      {
        id: "briefing-suppliers",
        moduleId: "purchases",
        label: "Verificar proveedores",
        task: "Confirma proveedor critico, documento recibido y confiabilidad antes del servicio.",
        outcome: "Proveedores verificados: abastecimiento critico queda respaldado.",
      },
      {
        id: "briefing-stations",
        moduleId: "documents",
        label: "Preparar impresiones",
        task: "Revisa estaciones de comanda y comprobantes para que cada area reciba documentos.",
        outcome: "Estaciones listas: cocina, barra y caja pueden emitir respaldos.",
      },
    ],
  },
  {
    id: "arrival",
    title: "Llegada y apertura de mesa",
    scene: "Llega una reserva con alergia declarada y solicita mesa disponible.",
    goal: "Tomar la mesa, asociar cliente y abrir la atencion.",
    caseNarrative:
      "Carolina Munoz llega para su reserva de las 20:30 con 6 comensales, mesa 3 en Salon y alergia declarada a lacteos. La reserva debe pasar de confirmada a sentada, la mesa 3 debe quedar ocupada y asociada al Salon, y el pedido PR-0001 debe abrirse en estado pendiente con Valentina Reyes como mesero. Antes de ingresar productos, cocina caliente debe quedar informada de la alergia. El respaldo de salon corresponde a una ficha de reserva para 6 personas a las 20:30.",
    actions: [
      {
        id: "arrival-crm",
        moduleId: "crm",
        label: "Identificar cliente",
        task: "Busca la ficha del cliente, preferencias, alergias y reserva asociada.",
        outcome: "Cliente identificado: alergias y preferencias quedan visibles para salon.",
      },
      {
        id: "arrival-table",
        moduleId: "tables",
        label: "Tomar mesa",
        task: "Selecciona una mesa libre o reservada y cambia su estado a ocupada.",
        outcome: "Mesa tomada: la sala refleja el estado real de atencion.",
      },
      {
        id: "arrival-order",
        moduleId: "orders",
        label: "Abrir pedido",
        task: "Abre la cuenta de la mesa para iniciar la toma de productos.",
        outcome: "Pedido abierto: la mesa ya puede recibir consumos.",
      },
      {
        id: "arrival-allergy",
        moduleId: "foodSafety",
        label: "Confirmar alergia",
        task: "Notifica alergia declarada al equipo antes de ingresar productos.",
        outcome: "Alergia confirmada: cocina recibe la restriccion antes de producir.",
      },
      {
        id: "arrival-reservation-document",
        moduleId: "documents",
        label: "Respaldar reserva",
        task: "Genera la ficha de reserva con hora, mesa, comensales y alerta alimentaria.",
        outcome: "Reserva respaldada: salon tiene evidencia operativa de la llegada.",
      },
    ],
  },
  {
    id: "order",
    title: "Pedido y comanda",
    scene: "El cliente pide platos con modificadores y una observacion critica.",
    goal: "Construir el pedido completo y emitir respaldo operativo.",
    caseNarrative:
      "La mesa 3 confirma 2 Lomo salteado, 1 Causa camaron palta y 2 Jugo natural. El Lomo salteado esta disponible, se vende a $14.900, tiene 22 minutos de preparacion y cuenta con 7.200 g de stock de lomo. El pedido debe quedar con el modificador Sin cebolla, y luego distribuirse como 2 items para cocina caliente, 1 para cuarto frio y 2 para barra. El respaldo operativo de cocina es una comanda COC-1052 enviada a la estacion hot.",
    actions: [
      {
        id: "order-products",
        moduleId: "products",
        label: "Registrar producto",
        task: "Registra un producto disponible con categoria, precio y tiempo de preparacion.",
        outcome: "Producto registrado: la carta queda disponible para venta.",
      },
      {
        id: "order-modifiers",
        moduleId: "orders",
        label: "Agregar productos",
        task: "Agrega productos, modificadores, observaciones y cantidades a la cuenta.",
        outcome: "Pedido tomado: cocina recibe informacion completa y clara.",
      },
      {
        id: "order-documents",
        moduleId: "documents",
        label: "Emitir comanda",
        task: "Genera una comanda de cocina o respaldo de impresion para el pedido.",
        outcome: "Documento emitido: la operacion queda respaldada.",
      },
      {
        id: "order-availability",
        moduleId: "inventory",
        label: "Validar disponibilidad",
        task: "Comprueba stock, disponibilidad y categoria antes de confirmar el pedido.",
        outcome: "Disponibilidad validada: venta queda alineada con inventario.",
      },
      {
        id: "order-stations",
        moduleId: "kitchen",
        label: "Separar estaciones",
        task: "Distribuye productos por cocina caliente, cuarto frio y barra.",
        outcome: "Estaciones separadas: cada area recibe solo lo que debe producir.",
      },
    ],
  },
  {
    id: "production",
    title: "Produccion en cocina",
    scene: "Cocina recibe comandas por estacion y debe cuidar receta, tiempo y seguridad.",
    goal: "Preparar el pedido usando recetas tecnicas y control sanitario.",
    caseNarrative:
      "Cocina caliente recibe COC-1052. Rodrigo Fuentes toma la comanda en estacion hot y debe dejarla en estado listo. El Lomo salteado de la casa se audita con rendimiento de lomo de 70% y food cost de 31,4%. El control sanitario que respalda el servicio es de alergenos y temperatura, con medicion 1,8 C y resultado conforme. El tiempo objetivo es 22 minutos y el tiempo real aceptado es 18 minutos. Durante la produccion se detecta palta hass con madurez avanzada, por lo que corresponde registrar una merma de -320.",
    actions: [
      {
        id: "production-kitchen",
        moduleId: "kitchen",
        label: "Gestionar comanda",
        task: "Pasa la comanda por pendiente, preparacion y listo segun estacion.",
        outcome: "Comanda gestionada: los tiempos quedan controlados.",
      },
      {
        id: "production-recipes",
        moduleId: "recipes",
        label: "Auditar producto y receta",
        task: "Audita rendimiento, costo real, margen y consistencia de receta tecnica.",
        outcome: "Producto auditado: el estudiante justifica food cost y margen.",
      },
      {
        id: "production-safety",
        moduleId: "foodSafety",
        label: "Registrar control sanitario",
        task: "Registra temperatura, alergeno, vencimiento o resultado de control.",
        outcome: "Control sanitario hecho: el riesgo queda trazado.",
      },
      {
        id: "production-timing",
        moduleId: "kitchen",
        label: "Controlar tiempos",
        task: "Contrasta tiempo objetivo y tiempo real para decidir si la comanda esta lista.",
        outcome: "Tiempo controlado: cocina cumple el objetivo antes del despacho.",
      },
      {
        id: "production-waste",
        moduleId: "inventory",
        label: "Registrar merma",
        task: "Registra una merma por madurez, lote y responsable cuando corresponde.",
        outcome: "Merma registrada: bodega mantiene costo y trazabilidad actualizados.",
      },
    ],
  },
  {
    id: "warehouse",
    title: "Bodega y abastecimiento",
    scene: "El servicio consume insumos y bodega detecta stock bajo o vencimiento cercano.",
    goal: "Mover inventario, registrar mermas y recepcionar compras.",
    caseNarrative:
      "Bodega debe descontar lomo de vacuno por venta mediante una salida manual de -430 bajo metodo FIFO. Para recuperar stock, se recepcionan 12.000 g de Carnes Andinas con documento F-PRUEBA-001 y lote CAR-0508-A. La palta hass vence el 2026-05-11 y debe priorizarse para uso. En proveedores, Costa Azul aparece valorizado con confiabilidad 91. En almacenamiento critico, el salmon fresco debe mantenerse a 0 a 2 C, bajo FIFO y con riesgo sanitario alto.",
    actions: [
      {
        id: "warehouse-inventory",
        moduleId: "inventory",
        label: "Actualizar inventario",
        task: "Revisa stock, costo neto real, lote, FIFO/LIFO y registra una salida o merma.",
        outcome: "Inventario actualizado: stock y costo reflejan la operacion.",
      },
      {
        id: "warehouse-purchases",
        moduleId: "purchases",
        label: "Recepcionar compra",
        task: "Ingresa proveedor, documento, cantidad, costo, rendimiento, lote y vencimiento.",
        outcome: "Compra recepcionada: bodega recupera stock trazable.",
      },
      {
        id: "warehouse-expiry",
        moduleId: "foodSafety",
        label: "Priorizar vencimientos",
        task: "Detecta insumos con vencimiento cercano y define uso prioritario seguro.",
        outcome: "Vencimiento priorizado: cocina usa primero el insumo con mayor urgencia.",
      },
      {
        id: "warehouse-supplier",
        moduleId: "purchases",
        label: "Evaluar proveedor",
        task: "Revisa confiabilidad, estado documental y categoria del proveedor.",
        outcome: "Proveedor evaluado: compras sabe si puede volver a abastecer.",
      },
      {
        id: "warehouse-storage",
        moduleId: "inventory",
        label: "Verificar almacenamiento",
        task: "Comprueba temperatura, metodo y riesgo sanitario del insumo critico.",
        outcome: "Almacenamiento validado: el insumo queda conservado bajo criterio sanitario.",
      },
    ],
  },
  {
    id: "close",
    title: "Pago, cierre y control",
    scene: "La mesa pide la cuenta, caja cobra y administracion revisa el resultado.",
    goal: "Cerrar el ciclo completo con pago, reportes y auditoria.",
    caseNarrative:
      "La mesa paga PR-0001 con debito por $42.600 y propina de $4.260, dejando la caja cerrada. El documento de respaldo es el comprobante de pago REC-872 asociado al pedido PR-0001. Administracion revisa la venta de $42.600, food cost de 31,4% y margen esperado de $10.280. Despues del servicio se registra un mensaje de seguimiento CRM para Carolina Munoz con Valentina Reyes como responsable. La auditoria final exige 30 eventos, evidencia comprobable y turno cerrado.",
    actions: [
      {
        id: "close-cash",
        moduleId: "cash",
        label: "Cobrar y cerrar caja",
        task: "Registra medio de pago, propina, movimientos y cierre del turno de caja.",
        outcome: "Caja cerrada: el turno queda cuadrado con movimientos trazables.",
      },
      {
        id: "close-receipt",
        moduleId: "documents",
        label: "Imprimir respaldo",
        task: "Genera pre-cuenta, comprobante de pago o cierre de caja.",
        outcome: "Respaldo impreso: el cliente y caja tienen comprobante.",
      },
      {
        id: "close-reports",
        moduleId: "reports",
        label: "Analizar reportes",
        task: "Revisa ventas, margen, food cost, compras, mermas y rendimiento del equipo.",
        outcome: "Reportes revisados: el estudiante interpreta el resultado del turno.",
      },
      {
        id: "close-crm",
        moduleId: "crm",
        label: "Registrar seguimiento",
        task: "Deja una interaccion post-servicio con preferencia, canal y responsable.",
        outcome: "Seguimiento registrado: CRM conserva aprendizaje del servicio.",
      },
      {
        id: "close-audit",
        moduleId: "audit",
        label: "Verificar auditoria",
        task: "Confirma que pagos, documentos, reservas, recetas e inventario quedaron trazados.",
        outcome: "Auditoria validada: el ciclo completo queda defendible.",
      },
    ],
  },
];

const educationCoverageModules: ModuleId[] = [
  "dashboard",
  "employees",
  "crm",
  "tables",
  "orders",
  "products",
  "documents",
  "kitchen",
  "recipes",
  "foodSafety",
  "inventory",
  "purchases",
  "cash",
  "reports",
  "audit",
];

const educationChallenges: Record<string, EducationChallenge> = {
  "briefing-dashboard": {
    question:
      "Antes de recibir clientes, que operacion debes ejecutar primero para que el turno sea auditable?",
    correctOptionId: "open-shift",
    options: [
      { id: "open-shift", label: "Abrir turno AM con responsable, hora y caja inicial." },
      { id: "sell-first", label: "Tomar pedidos antes de registrar caja inicial." },
      { id: "skip-cash", label: "Usar la caja del turno anterior sin apertura." },
    ],
    practiceTitle: "Apertura de turno",
    practiceDescription:
      "Registra la apertura virtual del turno. La prueba solo avanza si el turno queda con hora, caja y responsable correctos.",
    fields: [
      {
        id: "turnStart",
        label: "Hora de apertura",
        type: "select",
        correctValue: "09:00",
        options: [
          { value: "08:30", label: "08:30" },
          { value: "09:00", label: "09:00" },
          { value: "11:00", label: "11:00" },
        ],
      },
      {
        id: "openingCash",
        label: "Caja inicial",
        type: "number",
        correctValue: "120000",
        placeholder: "120000",
      },
      {
        id: "responsible",
        label: "Responsable",
        type: "select",
        correctValue: "Paula Contreras",
        options: [
          { value: "Paula Contreras", label: "Paula Contreras" },
          { value: "Valentina Reyes", label: "Valentina Reyes" },
          { value: "Daniel Vega", label: "Daniel Vega" },
        ],
      },
    ],
  },
  "briefing-reservations": {
    question:
      "Que debe revisar salon antes de recibir una reserva con restriccion alimentaria?",
    correctOptionId: "review-reservation",
    options: [
      { id: "review-reservation", label: "Mesa, hora, cantidad de personas y alergia declarada." },
      { id: "only-table", label: "Solo revisar si hay una mesa libre." },
      { id: "wait-arrival", label: "Esperar a que llegue el cliente para recien leer la reserva." },
    ],
    practiceTitle: "Reservas del turno",
    practiceDescription:
      "Confirma la reserva critica que condiciona salon y cocina.",
    fields: [
      {
        id: "customer",
        label: "Cliente",
        type: "select",
        correctValue: "Carolina Munoz",
        options: [
          { value: "Carolina Munoz", label: "Carolina Munoz" },
          { value: "Andres Salinas", label: "Andres Salinas" },
          { value: "Matias Vergara", label: "Matias Vergara" },
        ],
      },
      {
        id: "reservationTime",
        label: "Hora reserva",
        type: "select",
        correctValue: "20:30",
        options: [
          { value: "13:45", label: "13:45" },
          { value: "20:30", label: "20:30" },
          { value: "21:00", label: "21:00" },
        ],
      },
      {
        id: "partySize",
        label: "Comensales",
        type: "number",
        correctValue: "6",
        placeholder: "6",
      },
      {
        id: "allergy",
        label: "Alergia",
        type: "select",
        correctValue: "Lacteos",
        options: [
          { value: "Lacteos", label: "Lacteos" },
          { value: "Mariscos", label: "Mariscos" },
          { value: "Sin alergias", label: "Sin alergias" },
        ],
      },
    ],
  },
  "briefing-employees": {
    question:
      "Como se debe organizar el equipo para que cada accion quede asociada a un rol?",
    correctOptionId: "assign-roles",
    options: [
      { id: "assign-roles", label: "Asignar mesero, cajero y bodega antes del servicio." },
      { id: "all-admin", label: "Dejar que administracion ejecute todos los procesos." },
      { id: "no-roles", label: "Trabajar sin roles para avanzar mas rapido." },
    ],
    practiceTitle: "Asignacion de equipo",
    practiceDescription:
      "Selecciona los responsables correctos del servicio de prueba.",
    fields: [
      {
        id: "waiter",
        label: "Mesero",
        type: "select",
        correctValue: "Valentina Reyes",
        options: [
          { value: "Valentina Reyes", label: "Valentina Reyes" },
          { value: "Felipe Araya", label: "Felipe Araya" },
          { value: "Daniel Vega", label: "Daniel Vega" },
        ],
      },
      {
        id: "cashier",
        label: "Cajero",
        type: "select",
        correctValue: "Felipe Araya",
        options: [
          { value: "Felipe Araya", label: "Felipe Araya" },
          { value: "Rodrigo Fuentes", label: "Rodrigo Fuentes" },
          { value: "Camila Soto", label: "Camila Soto" },
        ],
      },
      {
        id: "warehouse",
        label: "Bodega",
        type: "select",
        correctValue: "Daniel Vega",
        options: [
          { value: "Daniel Vega", label: "Daniel Vega" },
          { value: "Paula Contreras", label: "Paula Contreras" },
          { value: "Valentina Reyes", label: "Valentina Reyes" },
        ],
      },
    ],
  },
  "briefing-suppliers": {
    question:
      "Antes de abrir puertas, que revision evita partir el turno sin abastecimiento critico?",
    correctOptionId: "check-critical-supplier",
    options: [
      { id: "check-critical-supplier", label: "Revisar proveedor critico, documento recibido y confiabilidad." },
      { id: "ignore-supplier", label: "Esperar a que bodega avise durante el servicio." },
      { id: "only-phone", label: "Llamar al proveedor sin registrar estado documental." },
    ],
    practiceTitle: "Chequeo de proveedor",
    practiceDescription:
      "Valida el proveedor principal del caso antes de iniciar la operacion.",
    fields: [
      {
        id: "supplier",
        label: "Proveedor critico",
        type: "select",
        correctValue: "Carnes Andinas",
        options: [
          { value: "Carnes Andinas", label: "Carnes Andinas" },
          { value: "Huerta Local", label: "Huerta Local" },
          { value: "Secos del Sur", label: "Secos del Sur" },
        ],
      },
      {
        id: "documentStatus",
        label: "Estado documento",
        type: "select",
        correctValue: "received",
        options: [
          { value: "pending", label: "Pendiente" },
          { value: "received", label: "Recepcionado" },
          { value: "cancelled", label: "Cancelado" },
        ],
      },
      {
        id: "reliability",
        label: "Confiabilidad",
        type: "number",
        correctValue: "96",
        placeholder: "96",
      },
    ],
  },
  "briefing-stations": {
    question:
      "Que debe quedar listo para que comandas y comprobantes lleguen a cada area?",
    correctOptionId: "prepare-printing",
    options: [
      { id: "prepare-printing", label: "Validar estacion, impresora y autoimpresion de cocina." },
      { id: "single-printer", label: "Usar una sola impresora para todo el restaurante." },
      { id: "manual-notes", label: "Reemplazar comandas por notas manuales sin folio." },
    ],
    practiceTitle: "Estaciones de impresion",
    practiceDescription:
      "Prepara la estacion caliente que recibira la primera comanda.",
    fields: [
      {
        id: "stationName",
        label: "Estacion",
        type: "select",
        correctValue: "Cocina caliente",
        options: [
          { value: "Cocina caliente", label: "Cocina caliente" },
          { value: "Caja", label: "Caja" },
          { value: "Bodega", label: "Bodega" },
        ],
      },
      {
        id: "printerName",
        label: "Impresora",
        type: "select",
        correctValue: "EPSON-Cocina-01",
        options: [
          { value: "EPSON-Cocina-01", label: "EPSON-Cocina-01" },
          { value: "EPSON-Caja-01", label: "EPSON-Caja-01" },
          { value: "Sin impresora", label: "Sin impresora" },
        ],
      },
      {
        id: "autoPrint",
        label: "Autoimpresion",
        type: "select",
        correctValue: "true",
        options: [
          { value: "true", label: "Activa" },
          { value: "false", label: "Inactiva" },
          { value: "manual", label: "Manual sin control" },
        ],
      },
    ],
  },
  "arrival-crm": {
    question:
      "Llega Carolina Munoz con reserva y alergia. Que debe revisar el estudiante antes de sentarla?",
    correctOptionId: "check-allergy",
    options: [
      { id: "check-allergy", label: "Ficha, alergias, preferencias y reserva asociada." },
      { id: "only-name", label: "Solo el nombre de la reserva." },
      { id: "skip-crm", label: "Saltarse CRM porque ya hay una mesa reservada." },
    ],
    practiceTitle: "Revision CRM",
    practiceDescription:
      "Completa la ficha de llegada y cambia la reserva a sentada.",
    fields: [
      {
        id: "customer",
        label: "Cliente",
        type: "select",
        correctValue: "Carolina Munoz",
        options: [
          { value: "Carolina Munoz", label: "Carolina Munoz" },
          { value: "Andres Salinas", label: "Andres Salinas" },
          { value: "Matias Vergara", label: "Matias Vergara" },
        ],
      },
      {
        id: "allergy",
        label: "Alergia declarada",
        type: "select",
        correctValue: "Lacteos",
        options: [
          { value: "Mariscos", label: "Mariscos" },
          { value: "Lacteos", label: "Lacteos" },
          { value: "Sin alergias", label: "Sin alergias" },
        ],
      },
      {
        id: "reservationStatus",
        label: "Estado de reserva",
        type: "select",
        correctValue: "seated",
        options: [
          { value: "confirmed", label: "Confirmada" },
          { value: "seated", label: "Sentada" },
          { value: "cancelled", label: "Cancelada" },
        ],
      },
    ],
  },
  "arrival-table": {
    question: "Que accion abre correctamente la atencion presencial de la mesa?",
    correctOptionId: "open-reserved",
    options: [
      { id: "open-random", label: "Tomar cualquier mesa libre sin revisar reserva." },
      { id: "open-reserved", label: "Tomar la mesa reservada y cambiarla a ocupada." },
      { id: "leave-free", label: "Mantener la mesa libre hasta que llegue cocina." },
    ],
    practiceTitle: "Apertura de mesa",
    practiceDescription:
      "Selecciona la mesa de la reserva y dejala ocupada para abrir cuenta.",
    fields: [
      {
        id: "tableNumber",
        label: "Mesa",
        type: "number",
        correctValue: "3",
        placeholder: "3",
      },
      {
        id: "tableStatus",
        label: "Estado",
        type: "select",
        correctValue: "occupied",
        options: [
          { value: "reserved", label: "Reservada" },
          { value: "occupied", label: "Ocupada" },
          { value: "free", label: "Libre" },
        ],
      },
      {
        id: "zone",
        label: "Zona",
        type: "select",
        correctValue: "Salon",
        options: [
          { value: "Terraza", label: "Terraza" },
          { value: "Salon", label: "Salon" },
          { value: "Barra", label: "Barra" },
        ],
      },
    ],
  },
  "arrival-order": {
    question: "Despues de ocupar la mesa, que se debe crear para tomar consumos?",
    correctOptionId: "create-order",
    options: [
      { id: "create-order", label: "Abrir pedido asociado a mesa y mesero." },
      { id: "wait-payment", label: "Esperar el pago para recien crear pedido." },
      { id: "only-note", label: "Guardar una nota sin cuenta ni mesa." },
    ],
    practiceTitle: "Cuenta de mesa",
    practiceDescription:
      "Crea el pedido virtual asociado a la mesa de prueba.",
    fields: [
      {
        id: "orderNumber",
        label: "Numero de pedido",
        type: "text",
        correctValue: "PR-0001",
        placeholder: "PR-0001",
      },
      {
        id: "waiter",
        label: "Mesero",
        type: "select",
        correctValue: "Valentina Reyes",
        options: [
          { value: "Valentina Reyes", label: "Valentina Reyes" },
          { value: "Felipe Araya", label: "Felipe Araya" },
          { value: "Paula Contreras", label: "Paula Contreras" },
        ],
      },
      {
        id: "orderStatus",
        label: "Estado inicial",
        type: "select",
        correctValue: "pending",
        options: [
          { value: "pending", label: "Pendiente" },
          { value: "paid", label: "Pagado" },
          { value: "cancelled", label: "Cancelado" },
        ],
      },
    ],
  },
  "arrival-allergy": {
    question:
      "La reserva declara alergia a lacteos. Que accion protege al cliente antes de pedir?",
    correctOptionId: "notify-kitchen",
    options: [
      { id: "notify-kitchen", label: "Confirmar alergia y dejar alerta visible para cocina." },
      { id: "ask-later", label: "Preguntar de nuevo solo cuando el plato este listo." },
      { id: "hide-alert", label: "No registrar alergia para no retrasar la mesa." },
    ],
    practiceTitle: "Alerta alimentaria",
    practiceDescription:
      "Registra la alerta que debe ver cocina antes de producir.",
    fields: [
      {
        id: "customer",
        label: "Cliente",
        type: "select",
        correctValue: "Carolina Munoz",
        options: [
          { value: "Carolina Munoz", label: "Carolina Munoz" },
          { value: "Andres Salinas", label: "Andres Salinas" },
          { value: "Isidora Paredes", label: "Isidora Paredes" },
        ],
      },
      {
        id: "allergy",
        label: "Alergia",
        type: "select",
        correctValue: "Lacteos",
        options: [
          { value: "Lacteos", label: "Lacteos" },
          { value: "Mariscos", label: "Mariscos" },
          { value: "Sin alergias", label: "Sin alergias" },
        ],
      },
      {
        id: "destination",
        label: "Area informada",
        type: "select",
        correctValue: "Cocina caliente",
        options: [
          { value: "Cocina caliente", label: "Cocina caliente" },
          { value: "Solo caja", label: "Solo caja" },
          { value: "Sin informar", label: "Sin informar" },
        ],
      },
    ],
  },
  "arrival-reservation-document": {
    question:
      "Que respaldo deja evidencia de la llegada, comensales y restricciones de la reserva?",
    correctOptionId: "reservation-sheet",
    options: [
      { id: "reservation-sheet", label: "Ficha de reserva con mesa, hora, comensales y alergia." },
      { id: "kitchen-ticket", label: "Comanda de cocina antes de elegir platos." },
      { id: "cash-close", label: "Cierre de caja antes de atender la mesa." },
    ],
    practiceTitle: "Ficha de reserva",
    practiceDescription:
      "Genera el respaldo virtual de salon para la reserva de prueba.",
    fields: [
      {
        id: "documentType",
        label: "Tipo documento",
        type: "select",
        correctValue: "reservation_sheet",
        options: [
          { value: "reservation_sheet", label: "Ficha reserva" },
          { value: "kitchen_ticket", label: "Comanda cocina" },
          { value: "payment_receipt", label: "Comprobante pago" },
        ],
      },
      {
        id: "partySize",
        label: "Comensales",
        type: "number",
        correctValue: "6",
        placeholder: "6",
      },
      {
        id: "reservationTime",
        label: "Hora reserva",
        type: "select",
        correctValue: "20:30",
        options: [
          { value: "13:45", label: "13:45" },
          { value: "20:30", label: "20:30" },
          { value: "21:00", label: "21:00" },
        ],
      },
    ],
  },
  "order-products": {
    question: "Que validacion permite vender un producto sin afectar margen ni cocina?",
    correctOptionId: "available-cost",
    options: [
      { id: "only-photo", label: "Que tenga una foto atractiva." },
      { id: "available-cost", label: "Categoria, precio, disponibilidad y tiempo de preparacion." },
      { id: "ignore-price", label: "Registrar producto sin precio y corregirlo al cierre." },
    ],
    practiceTitle: "Registro de producto",
    practiceDescription:
      "Da de alta el producto principal de la prueba con datos comerciales correctos.",
    fields: [
      {
        id: "productName",
        label: "Producto",
        type: "select",
        correctValue: "Lomo salteado",
        options: [
          { value: "Lomo salteado", label: "Lomo salteado" },
          { value: "Jugo natural", label: "Jugo natural" },
          { value: "Tabla caliente", label: "Tabla caliente" },
        ],
      },
      {
        id: "salePrice",
        label: "Precio venta",
        type: "number",
        correctValue: "14900",
        placeholder: "14900",
      },
      {
        id: "prepTime",
        label: "Tiempo de preparacion",
        type: "number",
        correctValue: "22",
        placeholder: "22",
      },
    ],
  },
  "order-modifiers": {
    question: "Como debe registrarse un pedido con modificadores y alergias?",
    correctOptionId: "send-details",
    options: [
      { id: "send-details", label: "Con cantidades, modificadores y observaciones visibles." },
      { id: "single-line", label: "Como una nota libre sin separar productos." },
      { id: "verbal", label: "Solo avisando verbalmente a cocina." },
    ],
    practiceTitle: "Toma de pedido",
    practiceDescription:
      "Construye la cuenta con cantidades y observacion operacional.",
    fields: [
      {
        id: "lomoQty",
        label: "Lomo salteado",
        type: "number",
        correctValue: "2",
        placeholder: "2",
      },
      {
        id: "causaQty",
        label: "Causa camaron palta",
        type: "number",
        correctValue: "1",
        placeholder: "1",
      },
      {
        id: "juiceQty",
        label: "Jugo natural",
        type: "number",
        correctValue: "2",
        placeholder: "2",
      },
      {
        id: "modifier",
        label: "Modificador critico",
        type: "select",
        correctValue: "Sin cebolla",
        options: [
          { value: "Sin cebolla", label: "Sin cebolla" },
          { value: "Extra picante", label: "Extra picante" },
          { value: "Sin registrar", label: "Sin registrar" },
        ],
      },
    ],
  },
  "order-documents": {
    question: "Que respaldo debe salir cuando el pedido ya tiene productos?",
    correctOptionId: "kitchen-ticket",
    options: [
      { id: "kitchen-ticket", label: "Comanda por estacion con notas y cantidades." },
      { id: "final-receipt", label: "Comprobante de pago antes de cocinar." },
      { id: "no-document", label: "Ningun documento hasta cerrar caja." },
    ],
    practiceTitle: "Emision de comanda",
    practiceDescription:
      "Genera la comanda virtual que cocina debe recibir.",
    fields: [
      {
        id: "documentType",
        label: "Tipo documento",
        type: "select",
        correctValue: "kitchen_ticket",
        options: [
          { value: "kitchen_ticket", label: "Comanda cocina" },
          { value: "payment_receipt", label: "Comprobante pago" },
          { value: "cash_close", label: "Cierre caja" },
        ],
      },
      {
        id: "station",
        label: "Estacion",
        type: "select",
        correctValue: "hot",
        options: [
          { value: "hot", label: "Cocina caliente" },
          { value: "cash", label: "Caja" },
          { value: "warehouse", label: "Bodega" },
        ],
      },
      {
        id: "documentNumber",
        label: "Folio",
        type: "text",
        correctValue: "COC-1052",
        placeholder: "COC-1052",
      },
    ],
  },
  "order-availability": {
    question:
      "Antes de confirmar el pedido, que dato evita vender algo sin respaldo de stock?",
    correctOptionId: "check-stock",
    options: [
      { id: "check-stock", label: "Validar producto disponible y stock suficiente del insumo principal." },
      { id: "sell-anyway", label: "Confirmar el pedido y resolver el stock despues." },
      { id: "only-price", label: "Revisar solo el precio de venta." },
    ],
    practiceTitle: "Disponibilidad de carta",
    practiceDescription:
      "Comprueba producto, estado comercial y stock de materia prima.",
    fields: [
      {
        id: "productName",
        label: "Producto",
        type: "select",
        correctValue: "Lomo salteado",
        options: [
          { value: "Lomo salteado", label: "Lomo salteado" },
          { value: "Tabla caliente", label: "Tabla caliente" },
          { value: "Postre del dia", label: "Postre del dia" },
        ],
      },
      {
        id: "available",
        label: "Disponibilidad",
        type: "select",
        correctValue: "true",
        options: [
          { value: "true", label: "Disponible" },
          { value: "false", label: "No disponible" },
          { value: "pending", label: "Sin validar" },
        ],
      },
      {
        id: "stock",
        label: "Stock lomo",
        type: "number",
        correctValue: "7200",
        placeholder: "7200",
      },
    ],
  },
  "order-stations": {
    question:
      "Como se reparte una cuenta con fondos, entrada fria y bebestibles?",
    correctOptionId: "split-stations",
    options: [
      { id: "split-stations", label: "Separar por cocina caliente, cuarto frio y barra." },
      { id: "all-hot", label: "Enviar todo a cocina caliente." },
      { id: "cash-only", label: "Enviar la cuenta completa solo a caja." },
    ],
    practiceTitle: "Derivacion por estacion",
    practiceDescription:
      "Distribuye las lineas del pedido segun area productiva.",
    fields: [
      {
        id: "hotItems",
        label: "Cocina caliente",
        type: "number",
        correctValue: "2",
        placeholder: "2",
      },
      {
        id: "coldItems",
        label: "Cuarto frio",
        type: "number",
        correctValue: "1",
        placeholder: "1",
      },
      {
        id: "barItems",
        label: "Barra",
        type: "number",
        correctValue: "2",
        placeholder: "2",
      },
    ],
  },
  "production-kitchen": {
    question: "Cocina recibe la comanda. Que flujo asegura control de tiempos?",
    correctOptionId: "progress-station",
    options: [
      { id: "progress-station", label: "Mover comanda por estacion hasta estado listo." },
      { id: "mark-paid", label: "Marcar pagado para que desaparezca." },
      { id: "ignore-time", label: "Esperar sin cambiar estado." },
    ],
    practiceTitle: "Gestion de comanda",
    practiceDescription:
      "Completa el paso de cocina y deja la comanda lista.",
    fields: [
      {
        id: "station",
        label: "Estacion",
        type: "select",
        correctValue: "hot",
        options: [
          { value: "hot", label: "Cocina caliente" },
          { value: "bar", label: "Barra" },
          { value: "cash", label: "Caja" },
        ],
      },
      {
        id: "kitchenStatus",
        label: "Estado final",
        type: "select",
        correctValue: "ready",
        options: [
          { value: "pending", label: "Pendiente" },
          { value: "preparing", label: "En preparacion" },
          { value: "ready", label: "Listo" },
        ],
      },
      {
        id: "cook",
        label: "Responsable cocina",
        type: "select",
        correctValue: "Rodrigo Fuentes",
        options: [
          { value: "Rodrigo Fuentes", label: "Rodrigo Fuentes" },
          { value: "Felipe Araya", label: "Felipe Araya" },
          { value: "Daniel Vega", label: "Daniel Vega" },
        ],
      },
      {
        id: "kitchenTime",
        label: "Tiempo real",
        type: "number",
        correctValue: "18",
        placeholder: "18",
      },
    ],
  },
  "production-recipes": {
    question: "Que debe auditarse para saber si un producto es rentable y reproducible?",
    correctOptionId: "audit-cost",
    options: [
      { id: "audit-cost", label: "Rendimiento, food cost, receta y margen." },
      { id: "only-name", label: "Solo que el nombre coincida con la carta." },
      { id: "only-photo", label: "Solo la foto del plato terminado." },
    ],
    practiceTitle: "Auditoria de producto",
    practiceDescription:
      "Audita el producto contra su receta tecnica y costo real.",
    fields: [
      {
        id: "recipe",
        label: "Receta",
        type: "select",
        correctValue: "Lomo salteado de la casa",
        options: [
          { value: "Lomo salteado de la casa", label: "Lomo salteado de la casa" },
          { value: "Salmon grillado con crema citrica", label: "Salmon grillado con crema citrica" },
          { value: "Causa fria de camaron y palta", label: "Causa fria de camaron y palta" },
        ],
      },
      {
        id: "yield",
        label: "Rendimiento lomo",
        type: "number",
        correctValue: "70",
        placeholder: "70",
      },
      {
        id: "foodCost",
        label: "Food cost",
        type: "number",
        correctValue: "31.4",
        placeholder: "31.4",
      },
    ],
  },
  "production-safety": {
    question: "Que control evita errores con alergias y cadena de frio?",
    correctOptionId: "record-check",
    options: [
      { id: "record-check", label: "Registrar temperatura, alergeno y resultado conforme." },
      { id: "only-look", label: "Mirar el producto sin dejar registro." },
      { id: "after-service", label: "Controlar solo al final del servicio." },
    ],
    practiceTitle: "Control sanitario",
    practiceDescription:
      "Registra el control que respalda el servicio seguro.",
    fields: [
      {
        id: "checkType",
        label: "Tipo de control",
        type: "select",
        correctValue: "Alergenos y temperatura",
        options: [
          { value: "Alergenos y temperatura", label: "Alergenos y temperatura" },
          { value: "Decoracion de plato", label: "Decoracion de plato" },
          { value: "Propina sugerida", label: "Propina sugerida" },
        ],
      },
      {
        id: "temperature",
        label: "Temperatura",
        type: "number",
        correctValue: "1.8",
        placeholder: "1.8",
      },
      {
        id: "result",
        label: "Resultado",
        type: "select",
        correctValue: "ok",
        options: [
          { value: "ok", label: "Conforme" },
          { value: "warning", label: "Advertencia" },
          { value: "failed", label: "No conforme" },
        ],
      },
    ],
  },
  "production-timing": {
    question:
      "Si el tiempo real esta dentro del objetivo, que debe hacer cocina con la comanda?",
    correctOptionId: "mark-ready",
    options: [
      { id: "mark-ready", label: "Marcar lista y dejar tiempo real registrado." },
      { id: "keep-pending", label: "Mantener pendiente aunque el plato este terminado." },
      { id: "close-cash", label: "Cerrar caja desde cocina." },
    ],
    practiceTitle: "Control de tiempo",
    practiceDescription:
      "Contrasta tiempo objetivo y tiempo real antes de despachar.",
    fields: [
      {
        id: "targetTime",
        label: "Tiempo objetivo",
        type: "number",
        correctValue: "22",
        placeholder: "22",
      },
      {
        id: "realTime",
        label: "Tiempo real",
        type: "number",
        correctValue: "18",
        placeholder: "18",
      },
      {
        id: "finalStatus",
        label: "Estado final",
        type: "select",
        correctValue: "ready",
        options: [
          { value: "ready", label: "Listo" },
          { value: "pending", label: "Pendiente" },
          { value: "cancelled", label: "Cancelado" },
        ],
      },
    ],
  },
  "production-waste": {
    question:
      "Durante produccion se detecta palta con madurez avanzada. Que registro corresponde?",
    correctOptionId: "record-waste",
    options: [
      { id: "record-waste", label: "Registrar merma con insumo, cantidad, motivo y lote." },
      { id: "discard-silent", label: "Botar el insumo sin anotarlo." },
      { id: "charge-customer", label: "Cobrar la merma al cliente." },
    ],
    practiceTitle: "Merma de produccion",
    practiceDescription:
      "Registra la merma que afecta stock y costo.",
    fields: [
      {
        id: "rawMaterial",
        label: "Insumo",
        type: "select",
        correctValue: "Palta hass",
        options: [
          { value: "Palta hass", label: "Palta hass" },
          { value: "Arroz grano largo", label: "Arroz grano largo" },
          { value: "Harina panadera", label: "Harina panadera" },
        ],
      },
      {
        id: "movementType",
        label: "Tipo movimiento",
        type: "select",
        correctValue: "waste",
        options: [
          { value: "waste", label: "Merma" },
          { value: "purchase", label: "Compra" },
          { value: "initial", label: "Inicial" },
        ],
      },
      {
        id: "quantity",
        label: "Cantidad",
        type: "number",
        correctValue: "-320",
        placeholder: "-320",
      },
      {
        id: "reason",
        label: "Motivo",
        type: "select",
        correctValue: "Madurez avanzada",
        options: [
          { value: "Madurez avanzada", label: "Madurez avanzada" },
          { value: "Venta normal", label: "Venta normal" },
          { value: "Sin motivo", label: "Sin motivo" },
        ],
      },
    ],
  },
  "warehouse-inventory": {
    question: "Al vender productos, que movimiento debe quedar trazado en bodega?",
    correctOptionId: "stock-trace",
    options: [
      { id: "stock-trace", label: "Salida de insumo con lote, cantidad y metodo FIFO." },
      { id: "delete-stock", label: "Borrar stock manualmente sin motivo." },
      { id: "wait-month", label: "Ajustar inventario solo a fin de mes." },
    ],
    practiceTitle: "Movimiento de inventario",
    practiceDescription:
      "Registra la salida virtual asociada a la venta.",
    fields: [
      {
        id: "rawMaterial",
        label: "Insumo",
        type: "select",
        correctValue: "Lomo de vacuno",
        options: [
          { value: "Lomo de vacuno", label: "Lomo de vacuno" },
          { value: "Harina panadera", label: "Harina panadera" },
          { value: "Crema de leche", label: "Crema de leche" },
        ],
      },
      {
        id: "movementType",
        label: "Tipo movimiento",
        type: "select",
        correctValue: "manual_out",
        options: [
          { value: "manual_out", label: "Salida manual" },
          { value: "initial", label: "Inicial" },
          { value: "purchase", label: "Compra" },
        ],
      },
      {
        id: "quantity",
        label: "Cantidad",
        type: "number",
        correctValue: "-430",
        placeholder: "-430",
      },
      {
        id: "method",
        label: "Metodo",
        type: "select",
        correctValue: "FIFO",
        options: [
          { value: "FIFO", label: "FIFO" },
          { value: "LIFO", label: "LIFO" },
          { value: "Sin metodo", label: "Sin metodo" },
        ],
      },
    ],
  },
  "warehouse-purchases": {
    question: "Que datos vuelven trazable una recepcion de compra?",
    correctOptionId: "receive-lot",
    options: [
      { id: "receive-lot", label: "Proveedor, documento, cantidad, lote y vencimiento." },
      { id: "amount-only", label: "Solo el monto total de la factura." },
      { id: "supplier-only", label: "Solo el nombre del proveedor." },
    ],
    practiceTitle: "Recepcion de compra",
    practiceDescription:
      "Recepciona una compra virtual para recuperar stock.",
    fields: [
      {
        id: "supplier",
        label: "Proveedor",
        type: "select",
        correctValue: "Carnes Andinas",
        options: [
          { value: "Carnes Andinas", label: "Carnes Andinas" },
          { value: "Costa Azul", label: "Costa Azul" },
          { value: "Huerta Local", label: "Huerta Local" },
        ],
      },
      {
        id: "document",
        label: "Documento",
        type: "text",
        correctValue: "F-PRUEBA-001",
        placeholder: "F-PRUEBA-001",
      },
      {
        id: "quantity",
        label: "Cantidad recibida",
        type: "number",
        correctValue: "12000",
        placeholder: "12000",
      },
      {
        id: "lot",
        label: "Lote",
        type: "text",
        correctValue: "CAR-0508-A",
        placeholder: "CAR-0508-A",
      },
    ],
  },
  "warehouse-expiry": {
    question:
      "Si un insumo vence hoy, que accion operativa reduce riesgo y merma?",
    correctOptionId: "prioritize-use",
    options: [
      { id: "prioritize-use", label: "Priorizar uso, rotular alerta y comunicar a cocina." },
      { id: "ignore-date", label: "Ignorar vencimiento si aun hay stock." },
      { id: "mix-lots", label: "Mezclar lotes para que no se note la fecha." },
    ],
    practiceTitle: "Control de vencimiento",
    practiceDescription:
      "Identifica el lote que debe usarse primero y la accion correcta.",
    fields: [
      {
        id: "rawMaterial",
        label: "Insumo",
        type: "select",
        correctValue: "Palta hass",
        options: [
          { value: "Palta hass", label: "Palta hass" },
          { value: "Arroz grano largo", label: "Arroz grano largo" },
          { value: "Harina panadera", label: "Harina panadera" },
        ],
      },
      {
        id: "expirationDate",
        label: "Vencimiento",
        type: "select",
        correctValue: "2026-05-11",
        options: [
          { value: "2026-05-11", label: "2026-05-11" },
          { value: "2026-08-20", label: "2026-08-20" },
          { value: "2027-01-20", label: "2027-01-20" },
        ],
      },
      {
        id: "action",
        label: "Accion",
        type: "select",
        correctValue: "Priorizar uso",
        options: [
          { value: "Priorizar uso", label: "Priorizar uso" },
          { value: "Mezclar lotes", label: "Mezclar lotes" },
          { value: "Sin accion", label: "Sin accion" },
        ],
      },
    ],
  },
  "warehouse-supplier": {
    question:
      "Que proveedor requiere revision por documento valorizado y categoria sensible?",
    correctOptionId: "review-seafood",
    options: [
      { id: "review-seafood", label: "Costa Azul por pescados y mariscos con documento valorizado." },
      { id: "review-dry", label: "Secos del Sur por harina seca sin riesgo alto." },
      { id: "review-produce", label: "Huerta Local solo por verduras de bajo riesgo." },
    ],
    practiceTitle: "Evaluacion de proveedor",
    practiceDescription:
      "Revisa confiabilidad y estado documental del proveedor sensible.",
    fields: [
      {
        id: "supplier",
        label: "Proveedor",
        type: "select",
        correctValue: "Costa Azul",
        options: [
          { value: "Costa Azul", label: "Costa Azul" },
          { value: "Secos del Sur", label: "Secos del Sur" },
          { value: "Huerta Local", label: "Huerta Local" },
        ],
      },
      {
        id: "reliability",
        label: "Confiabilidad",
        type: "number",
        correctValue: "91",
        placeholder: "91",
      },
      {
        id: "documentStatus",
        label: "Estado documento",
        type: "select",
        correctValue: "priced",
        options: [
          { value: "priced", label: "Valorizado" },
          { value: "pending", label: "Pendiente" },
          { value: "cancelled", label: "Cancelado" },
        ],
      },
    ],
  },
  "warehouse-storage": {
    question:
      "Que condicion de almacenamiento corresponde para salmon fresco de alto riesgo?",
    correctOptionId: "cold-chain",
    options: [
      { id: "cold-chain", label: "Mantener 0 a 2 C, FIFO y riesgo sanitario alto visible." },
      { id: "ambient", label: "Guardar a temperatura ambiente seca." },
      { id: "freeze-all", label: "Congelar todo sin registrar lote." },
    ],
    practiceTitle: "Almacenamiento critico",
    practiceDescription:
      "Valida condiciones del insumo de mayor riesgo sanitario.",
    fields: [
      {
        id: "rawMaterial",
        label: "Insumo",
        type: "select",
        correctValue: "Salmon fresco",
        options: [
          { value: "Salmon fresco", label: "Salmon fresco" },
          { value: "Arroz grano largo", label: "Arroz grano largo" },
          { value: "Cebolla morada", label: "Cebolla morada" },
        ],
      },
      {
        id: "temperature",
        label: "Temperatura",
        type: "select",
        correctValue: "0 a 2 C",
        options: [
          { value: "0 a 2 C", label: "0 a 2 C" },
          { value: "Ambiente seco", label: "Ambiente seco" },
          { value: "8 a 12 C", label: "8 a 12 C" },
        ],
      },
      {
        id: "method",
        label: "Metodo",
        type: "select",
        correctValue: "FIFO",
        options: [
          { value: "FIFO", label: "FIFO" },
          { value: "LIFO", label: "LIFO" },
          { value: "Sin metodo", label: "Sin metodo" },
        ],
      },
      {
        id: "risk",
        label: "Riesgo sanitario",
        type: "select",
        correctValue: "high",
        options: [
          { value: "high", label: "Alto" },
          { value: "medium", label: "Medio" },
          { value: "low", label: "Bajo" },
        ],
      },
    ],
  },
  "close-cash": {
    question: "Que debe hacer caja cuando la mesa pide pagar?",
    correctOptionId: "settle-close",
    options: [
      { id: "settle-close", label: "Registrar pago, propina y dejar caja cuadrada." },
      { id: "print-only", label: "Solo imprimir pre-cuenta sin movimiento de caja." },
      { id: "cash-only", label: "Aceptar solo efectivo aunque el cliente pague debito." },
    ],
    practiceTitle: "Cobro y cierre de caja",
    practiceDescription:
      "Cobra la cuenta y deja cerrado el movimiento del turno.",
    fields: [
      {
        id: "paymentMethod",
        label: "Medio de pago",
        type: "select",
        correctValue: "debit",
        options: [
          { value: "cash", label: "Efectivo" },
          { value: "debit", label: "Debito" },
          { value: "transfer", label: "Transferencia" },
        ],
      },
      {
        id: "amount",
        label: "Monto cuenta",
        type: "number",
        correctValue: "42600",
        placeholder: "42600",
      },
      {
        id: "tip",
        label: "Propina",
        type: "number",
        correctValue: "4260",
        placeholder: "4260",
      },
      {
        id: "cashStatus",
        label: "Estado caja",
        type: "select",
        correctValue: "closed",
        options: [
          { value: "open", label: "Abierta" },
          { value: "closed", label: "Cerrada" },
          { value: "difference", label: "Con diferencia" },
        ],
      },
    ],
  },
  "close-receipt": {
    question: "Que documento respalda el pago frente al cliente y caja?",
    correctOptionId: "receipt-proof",
    options: [
      { id: "receipt-proof", label: "Comprobante de pago asociado a la cuenta." },
      { id: "kitchen-copy", label: "Una segunda copia de cocina." },
      { id: "reservation-sheet", label: "La ficha de reserva original." },
    ],
    practiceTitle: "Comprobante de pago",
    practiceDescription:
      "Genera el respaldo virtual del pago.",
    fields: [
      {
        id: "documentType",
        label: "Tipo documento",
        type: "select",
        correctValue: "payment_receipt",
        options: [
          { value: "payment_receipt", label: "Comprobante pago" },
          { value: "kitchen_ticket", label: "Comanda cocina" },
          { value: "reservation_sheet", label: "Ficha reserva" },
        ],
      },
      {
        id: "documentNumber",
        label: "Folio",
        type: "text",
        correctValue: "REC-872",
        placeholder: "REC-872",
      },
      {
        id: "orderNumber",
        label: "Pedido",
        type: "text",
        correctValue: "PR-0001",
        placeholder: "PR-0001",
      },
    ],
  },
  "close-reports": {
    question: "Que revisa administracion para saber si el turno fue sano?",
    correctOptionId: "interpret-kpi",
    options: [
      { id: "interpret-kpi", label: "Ventas, food cost, margen, compras y mermas." },
      { id: "only-sales", label: "Solo venta total, sin costos." },
      { id: "only-tips", label: "Solo propinas del turno." },
    ],
    practiceTitle: "Reporte del turno",
    practiceDescription:
      "Completa los indicadores de cierre que el docente puede revisar.",
    fields: [
      {
        id: "sales",
        label: "Venta prueba",
        type: "number",
        correctValue: "42600",
        placeholder: "42600",
      },
      {
        id: "foodCost",
        label: "Food cost",
        type: "number",
        correctValue: "31.4",
        placeholder: "31.4",
      },
      {
        id: "margin",
        label: "Margen esperado",
        type: "number",
        correctValue: "10280",
        placeholder: "10280",
      },
    ],
  },
  "close-crm": {
    question:
      "Despues del pago, que registro ayuda a mejorar la proxima atencion del cliente?",
    correctOptionId: "post-service-note",
    options: [
      { id: "post-service-note", label: "Registrar interaccion post-servicio con preferencia y responsable." },
      { id: "delete-customer", label: "Borrar la ficha para evitar datos acumulados." },
      { id: "only-total", label: "Guardar solo el total pagado." },
    ],
    practiceTitle: "Seguimiento CRM",
    practiceDescription:
      "Deja una evidencia de aprendizaje para futuras reservas.",
    fields: [
      {
        id: "customer",
        label: "Cliente",
        type: "select",
        correctValue: "Carolina Munoz",
        options: [
          { value: "Carolina Munoz", label: "Carolina Munoz" },
          { value: "Matias Vergara", label: "Matias Vergara" },
          { value: "Andres Salinas", label: "Andres Salinas" },
        ],
      },
      {
        id: "interactionType",
        label: "Tipo interaccion",
        type: "select",
        correctValue: "message",
        options: [
          { value: "message", label: "Mensaje" },
          { value: "complaint", label: "Reclamo" },
          { value: "none", label: "Sin registro" },
        ],
      },
      {
        id: "responsible",
        label: "Responsable",
        type: "select",
        correctValue: "Valentina Reyes",
        options: [
          { value: "Valentina Reyes", label: "Valentina Reyes" },
          { value: "Daniel Vega", label: "Daniel Vega" },
          { value: "Rodrigo Fuentes", label: "Rodrigo Fuentes" },
        ],
      },
    ],
  },
  "close-audit": {
    question: "Cuando termina el servicio, que valida que la prueba sea defendible?",
    correctOptionId: "trace-complete",
    options: [
      { id: "trace-complete", label: "Bitacora con acciones, decisiones y evidencias." },
      { id: "memory", label: "La memoria del estudiante sobre lo realizado." },
      { id: "only-total", label: "Solo el total vendido." },
    ],
    practiceTitle: "Auditoria final",
    practiceDescription:
      "Cierra la prueba verificando eventos, estado y turno completo.",
    fields: [
      {
        id: "events",
        label: "Eventos esperados",
        type: "number",
        correctValue: "30",
        placeholder: "30",
      },
      {
        id: "proofStatus",
        label: "Estado evidencia",
        type: "select",
        correctValue: "Comprobable",
        options: [
          { value: "Comprobable", label: "Comprobable" },
          { value: "Sin respaldo", label: "Sin respaldo" },
          { value: "Pendiente", label: "Pendiente" },
        ],
      },
      {
        id: "shiftStatus",
        label: "Turno",
        type: "select",
        correctValue: "closed",
        options: [
          { value: "open", label: "Abierto" },
          { value: "closed", label: "Cerrado" },
          { value: "cancelled", label: "Cancelado" },
        ],
      },
    ],
  },
};

interface EducationProgressState {
  completedActions: string[];
  activePhaseIndex: number;
  lastOutcome: string;
  evidence: EducationEvidence[];
  simulation: EducationSimulationState;
  answers: Record<string, string>;
  practiceValues: Record<string, Record<string, string>>;
  attempts: Record<string, number>;
}

interface EducationEvidence {
  id: string;
  actionId: string;
  title: string;
  entityType: string;
  entityId: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
  createdAt: string;
}

interface EducationSimulationState {
  pruebaId: string;
  shiftStatus: "pendiente" | "abierto" | "cerrado";
  shiftOpenedAt: string;
  tableNumber: number;
  tableStatus: TableStatus;
  customerName: string;
  reservationStatus: ReservationStatus;
  orderNumber: string;
  orderStatus: OrderStatus;
  orderItems: string[];
  kitchenStatus: OrderStatus;
  productRegistered: boolean;
  productAudited: boolean;
  inventoryMovements: number;
  foodSafetyChecks: number;
  purchaseReceived: boolean;
  paymentStatus: "pendiente" | "pagado";
  cashExpected: number;
  documents: string[];
  reportsReviewed: boolean;
  auditEntries: number;
}

function createDefaultEducationSimulation(): EducationSimulationState {
  return {
    pruebaId: "PRUEBA-ACADEMIA-001",
    shiftStatus: "pendiente",
    shiftOpenedAt: "Sin abrir",
    tableNumber: 3,
    tableStatus: "reserved",
    customerName: "Carolina Munoz",
    reservationStatus: "confirmed",
    orderNumber: "PR-0001",
    orderStatus: "pending",
    orderItems: [],
    kitchenStatus: "pending",
    productRegistered: false,
    productAudited: false,
    inventoryMovements: 0,
    foodSafetyChecks: 0,
    purchaseReceived: false,
    paymentStatus: "pendiente",
    cashExpected: 120000,
    documents: [],
    reportsReviewed: false,
    auditEntries: 0,
  };
}

function createDefaultEducationProgress(): EducationProgressState {
  return {
    completedActions: [],
    activePhaseIndex: 0,
    lastOutcome:
      "Inicia el briefing. Cada paso requiere decision correcta y ejecucion practica.",
    evidence: [],
    simulation: createDefaultEducationSimulation(),
    answers: {},
    practiceValues: {},
    attempts: {},
  };
}

function getFirstPendingEducationPhaseIndex(completedActionSet: Set<string>) {
  return educationPhases.findIndex((phase) =>
    phase.actions.some((action) => !completedActionSet.has(action.id)),
  );
}

function readStoredEducationProgress(): EducationProgressState {
  if (typeof window === "undefined") {
    return createDefaultEducationProgress();
  }

  try {
    for (const legacyKey of EDUCATION_LEGACY_PROGRESS_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }

    const storedProgress = window.localStorage.getItem(EDUCATION_PROGRESS_KEY);

    if (!storedProgress) {
      return createDefaultEducationProgress();
    }

    const parsed = JSON.parse(storedProgress) as Partial<EducationProgressState>;
    const defaultProgress = createDefaultEducationProgress();
    const validActionIds = new Set(
      educationPhases.flatMap((phase) => phase.actions.map((action) => action.id)),
    );
    const completedActions = (parsed.completedActions ?? []).filter((actionId) =>
      validActionIds.has(actionId),
    );
    const completedActionSet = new Set(completedActions);
    const firstPendingPhaseIndex = getFirstPendingEducationPhaseIndex(
      completedActionSet,
    );
    const storedPhaseIndex = Math.min(
      Math.max(parsed.activePhaseIndex ?? 0, 0),
      educationPhases.length - 1,
    );
    const activePhaseIndex =
      firstPendingPhaseIndex >= 0 &&
      educationPhases[storedPhaseIndex]?.actions.every((action) =>
        completedActionSet.has(action.id),
      )
        ? firstPendingPhaseIndex
        : storedPhaseIndex;

    return {
      completedActions,
      activePhaseIndex,
      lastOutcome:
        parsed.lastOutcome ??
        "Prueba cargada. Continua desde la fase pendiente.",
      evidence: parsed.evidence ?? defaultProgress.evidence,
      simulation: {
        ...defaultProgress.simulation,
        ...(parsed.simulation ?? {}),
        orderItems:
          parsed.simulation?.orderItems ?? defaultProgress.simulation.orderItems,
        documents:
          parsed.simulation?.documents ?? defaultProgress.simulation.documents,
      },
      answers: parsed.answers ?? defaultProgress.answers,
      practiceValues: parsed.practiceValues ?? defaultProgress.practiceValues,
      attempts: parsed.attempts ?? defaultProgress.attempts,
    };
  } catch {
    window.localStorage.removeItem(EDUCATION_PROGRESS_KEY);
    return createDefaultEducationProgress();
  }
}

function normalizeEducationValue(value: string) {
  return value.trim().replace(",", ".").toLowerCase();
}

function isEducationFieldCorrect(field: EducationPracticeField, value: string) {
  const normalizedValue = normalizeEducationValue(value);
  const normalizedExpected = normalizeEducationValue(field.correctValue);

  if (field.type === "number") {
    return Number(normalizedValue) === Number(normalizedExpected);
  }

  return normalizedValue === normalizedExpected;
}

function formatEducationCaseValue(field: EducationPracticeField) {
  const optionLabel =
    field.options?.find((option) => option.value === field.correctValue)?.label ??
    field.correctValue;

  if (field.type !== "number") {
    return optionLabel;
  }

  const numericValue = Number(normalizeEducationValue(field.correctValue));
  const fieldKey = `${field.id} ${field.label}`.toLowerCase();

  if (!Number.isFinite(numericValue)) {
    return optionLabel;
  }

  if (
    /(cash|amount|price|cost|total|subtotal|tip|monto|caja|precio|valor|venta|sales|margen|margin)/.test(
      fieldKey,
    )
  ) {
    return formatCurrency(numericValue);
  }

  if (/(percent|porcentaje|cargo|impuesto)/.test(fieldKey)) {
    return `${numericValue}%`;
  }

  return optionLabel;
}

function validateEducationAction(
  progress: EducationProgressState,
  action: EducationAction,
) {
  const challenge = educationChallenges[action.id];

  if (!challenge) {
    return null;
  }

  const answer = progress.answers[action.id];

  if (!answer) {
    return "Selecciona una alternativa antes de validar la prueba.";
  }

  if (answer !== challenge.correctOptionId) {
    return "La alternativa elegida no resuelve el escenario. Corrige la decision para avanzar.";
  }

  const values = progress.practiceValues[action.id] ?? {};

  for (const field of challenge.fields) {
    const value = values[field.id] ?? "";

    if (!value.trim()) {
      return `Completa el campo "${field.label}" para ejecutar la prueba.`;
    }

    if (!isEducationFieldCorrect(field, value)) {
      return `Revisa "${field.label}": debe coincidir con el dato del caso (${formatEducationCaseValue(field)}).`;
    }
  }

  return null;
}

function executeEducationAction(
  current: EducationProgressState,
  action: EducationAction,
): EducationProgressState {
  if (current.completedActions.includes(action.id)) {
    return current;
  }

  const createdAt = new Date().toISOString();
  const simulation: EducationSimulationState = {
    ...current.simulation,
    orderItems: [...current.simulation.orderItems],
    documents: [...current.simulation.documents],
    auditEntries: current.simulation.auditEntries + 1,
  };
  let entityType = "prueba";
  let entityId = simulation.pruebaId;
  const details: Array<{ label: string; value: string }> = [
    { label: "Prueba", value: simulation.pruebaId },
    { label: "Paso", value: action.label },
  ];
  const challenge = educationChallenges[action.id];

  if (challenge) {
    const selectedOption = challenge.options.find(
      (option) => option.id === current.answers[action.id],
    );

    if (selectedOption) {
      details.push({ label: "Decision", value: selectedOption.label });
    }

    for (const field of challenge.fields) {
      const value = current.practiceValues[action.id]?.[field.id];

      if (value) {
        const optionLabel =
          field.options?.find((option) => option.value === value)?.label ?? value;
        details.push({ label: field.label, value: optionLabel });
      }
    }
  }

  switch (action.id) {
    case "briefing-dashboard":
      simulation.shiftStatus = "abierto";
      simulation.shiftOpenedAt = "09:00";
      details.push(
        { label: "Ventas iniciales", value: formatCurrency(157400) },
        { label: "Mesas ocupadas", value: "4/12" },
      );
      break;
    case "briefing-reservations":
      entityType = "reserva";
      entityId = "Carolina Munoz 20:30";
      details.push(
        { label: "Cliente", value: "Carolina Munoz" },
        { label: "Comensales", value: "6" },
        { label: "Alergia", value: "Lacteos" },
      );
      break;
    case "briefing-employees":
      details.push(
        { label: "Mesero asignado", value: "Valentina Reyes" },
        { label: "Caja", value: "Felipe Araya" },
      );
      break;
    case "briefing-suppliers":
      entityType = "proveedor";
      entityId = "Carnes Andinas";
      details.push(
        { label: "Documento", value: "Recepcionado" },
        { label: "Confiabilidad", value: "96" },
      );
      break;
    case "briefing-stations":
      entityType = "documento";
      entityId = "Estaciones de impresion";
      simulation.documents = addUniqueEducationValue(
        simulation.documents,
        "EST-IMP · Estaciones listas",
      );
      details.push(
        { label: "Estacion", value: "Cocina caliente" },
        { label: "Impresora", value: "EPSON-Cocina-01" },
      );
      break;
    case "arrival-crm":
      entityType = "cliente";
      entityId = simulation.customerName;
      simulation.reservationStatus = "seated";
      details.push(
        { label: "Cliente", value: simulation.customerName },
        { label: "Alergia", value: "Lacteos" },
      );
      break;
    case "arrival-table":
      entityType = "mesa";
      entityId = `Mesa ${simulation.tableNumber}`;
      simulation.tableStatus = "occupied";
      details.push(
        { label: "Mesa", value: String(simulation.tableNumber) },
        { label: "Estado", value: tableStatusMeta[simulation.tableStatus].label },
      );
      break;
    case "arrival-order":
      entityType = "pedido";
      entityId = simulation.orderNumber;
      simulation.orderStatus = "pending";
      details.push(
        { label: "Pedido", value: simulation.orderNumber },
        { label: "Mesa", value: String(simulation.tableNumber) },
      );
      break;
    case "arrival-allergy":
      entityType = "seguridad alimentaria";
      entityId = simulation.customerName;
      simulation.foodSafetyChecks += 1;
      details.push(
        { label: "Alergia", value: "Lacteos" },
        { label: "Area informada", value: "Cocina caliente" },
      );
      break;
    case "arrival-reservation-document":
      entityType = "documento";
      entityId = "RES-126";
      simulation.documents = addUniqueEducationValue(
        simulation.documents,
        "RES-126 · Ficha de reserva",
      );
      details.push(
        { label: "Comensales", value: "6" },
        { label: "Hora", value: "20:30" },
      );
      break;
    case "order-products":
      entityType = "producto";
      entityId = "Carta prueba";
      simulation.productRegistered = true;
      details.push(
        { label: "Producto disponible", value: "Lomo salteado" },
        { label: "Tiempo", value: "22 min" },
      );
      break;
    case "order-modifiers":
      entityType = "pedido";
      entityId = simulation.orderNumber;
      simulation.orderItems = [
        "2x Lomo salteado · Punto medio · Sin cebolla",
        "1x Causa camaron palta · Sin palta",
        "2x Jugo natural · Sin azucar",
      ];
      details.push(
        { label: "Items", value: String(simulation.orderItems.length) },
        { label: "Total parcial", value: formatCurrency(42600) },
      );
      break;
    case "order-documents":
      entityType = "documento";
      entityId = "COC-1052";
      simulation.documents = addUniqueEducationValue(
        simulation.documents,
        "COC-1052 · Comanda cocina",
      );
      details.push(
        { label: "Documento", value: "COC-1052" },
        { label: "Estacion", value: "Cocina caliente" },
      );
      break;
    case "order-availability":
      entityType = "inventario";
      entityId = "Lomo de vacuno";
      details.push(
        { label: "Producto", value: "Lomo salteado" },
        { label: "Stock", value: "7.200 g" },
      );
      break;
    case "order-stations":
      entityType = "comanda";
      entityId = simulation.orderNumber;
      details.push(
        { label: "Caliente", value: "2 items" },
        { label: "Frio", value: "1 item" },
        { label: "Barra", value: "2 items" },
      );
      break;
    case "production-kitchen":
      entityType = "comanda";
      entityId = "COC-1052";
      simulation.kitchenStatus = "ready";
      simulation.orderStatus = "ready";
      details.push(
        { label: "Comanda", value: "Lista" },
        { label: "Tiempo cocina", value: "18 min" },
      );
      break;
    case "production-recipes":
      entityType = "receta";
      entityId = "Lomo salteado de la casa";
      simulation.productAudited = true;
      details.push(
        { label: "Food cost", value: "31,4%" },
        { label: "Margen", value: formatCurrency(10280) },
      );
      break;
    case "production-safety":
      entityType = "seguridad alimentaria";
      entityId = "Control prueba";
      simulation.foodSafetyChecks += 1;
      details.push(
        { label: "Control", value: "Alergenos y temperatura" },
        { label: "Resultado", value: "Conforme" },
      );
      break;
    case "production-timing":
      entityType = "comanda";
      entityId = "COC-1052";
      simulation.kitchenStatus = "ready";
      details.push(
        { label: "Objetivo", value: "22 min" },
        { label: "Real", value: "18 min" },
      );
      break;
    case "production-waste":
      entityType = "inventario";
      entityId = "Palta hass";
      simulation.inventoryMovements += 1;
      details.push(
        { label: "Merma", value: "-320 g" },
        { label: "Motivo", value: "Madurez avanzada" },
      );
      break;
    case "warehouse-inventory":
      entityType = "inventario";
      entityId = "Lomo de vacuno";
      simulation.inventoryMovements += 1;
      details.push(
        { label: "Movimiento", value: "Salida por venta" },
        { label: "Cantidad", value: "-430 g" },
      );
      break;
    case "warehouse-purchases":
      entityType = "compra";
      entityId = "F-PRUEBA-001";
      simulation.purchaseReceived = true;
      simulation.inventoryMovements += 1;
      details.push(
        { label: "Proveedor", value: "Carnes Andinas" },
        { label: "Recepcion", value: "12.000 g" },
      );
      break;
    case "warehouse-expiry":
      entityType = "seguridad alimentaria";
      entityId = "Palta hass";
      simulation.foodSafetyChecks += 1;
      details.push(
        { label: "Vencimiento", value: "2026-05-11" },
        { label: "Accion", value: "Priorizar uso" },
      );
      break;
    case "warehouse-supplier":
      entityType = "proveedor";
      entityId = "Costa Azul";
      details.push(
        { label: "Confiabilidad", value: "91" },
        { label: "Documento", value: "Valorizado" },
      );
      break;
    case "warehouse-storage":
      entityType = "inventario";
      entityId = "Salmon fresco";
      simulation.foodSafetyChecks += 1;
      details.push(
        { label: "Temperatura", value: "0 a 2 C" },
        { label: "Metodo", value: "FIFO" },
      );
      break;
    case "close-cash":
      entityType = "caja";
      entityId = "Caja AM";
      simulation.paymentStatus = "pagado";
      simulation.orderStatus = "paid";
      simulation.tableStatus = "cleaning";
      simulation.shiftStatus = "cerrado";
      simulation.cashExpected += 42600;
      details.push(
        { label: "Pago", value: "Debito" },
        { label: "Monto", value: formatCurrency(42600) },
      );
      break;
    case "close-receipt":
      entityType = "documento";
      entityId = "REC-872";
      simulation.documents = addUniqueEducationValue(
        simulation.documents,
        "REC-872 · Comprobante de pago",
      );
      details.push(
        { label: "Documento", value: "REC-872" },
        { label: "Cuenta", value: simulation.orderNumber },
      );
      break;
    case "close-reports":
      entityType = "reporte";
      entityId = "Reporte turno prueba";
      simulation.reportsReviewed = true;
      details.push(
        { label: "Venta prueba", value: formatCurrency(42600) },
        { label: "Food cost", value: "31,4%" },
      );
      break;
    case "close-crm":
      entityType = "cliente";
      entityId = simulation.customerName;
      details.push(
        { label: "Interaccion", value: "Mensaje post-servicio" },
        { label: "Responsable", value: "Valentina Reyes" },
      );
      break;
    case "close-audit":
      entityType = "auditoria";
      entityId = "Bitacora prueba";
      details.push(
        { label: "Eventos auditados", value: String(current.evidence.length + 1) },
        { label: "Estado", value: "Comprobable" },
      );
      break;
  }

  const evidenceItem: EducationEvidence = {
    id: `proof-${action.id}-${current.evidence.length + 1}`,
    actionId: action.id,
    title: action.label,
    entityType,
    entityId,
    summary: action.outcome,
    details,
    createdAt,
  };

  return {
    ...current,
    completedActions: [...current.completedActions, action.id],
    lastOutcome: action.outcome,
    evidence: [evidenceItem, ...current.evidence],
    simulation,
  };
}

function addUniqueEducationValue(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function EducationStatusPanel({
  simulation,
  evidenceCount,
}: {
  simulation: EducationSimulationState;
  evidenceCount: number;
}) {
  return (
    <Panel title={`Estado de la prueba ${simulation.pruebaId}`} icon={ClipboardCheck}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoPill
          label="Turno"
          value={`${simulation.shiftStatus} · ${simulation.shiftOpenedAt}`}
        />
        <InfoPill
          label="Mesa"
          value={`Mesa ${simulation.tableNumber} · ${tableStatusMeta[simulation.tableStatus].label}`}
        />
        <InfoPill
          label="Cliente"
          value={`${simulation.customerName} · ${reservationStatusMeta[simulation.reservationStatus].label}`}
        />
        <InfoPill
          label="Pedido"
          value={`${simulation.orderNumber} · ${orderStatusMeta[simulation.orderStatus].label}`}
        />
        <InfoPill
          label="Cocina"
          value={orderStatusMeta[simulation.kitchenStatus].label}
        />
        <InfoPill
          label="Producto"
          value={simulation.productRegistered ? "Registrado" : "Pendiente"}
        />
        <InfoPill
          label="Auditoria producto"
          value={simulation.productAudited ? "Aprobada" : "Pendiente"}
        />
        <InfoPill
          label="Inventario"
          value={`${simulation.inventoryMovements} movimientos`}
        />
        <InfoPill
          label="Seguridad"
          value={`${simulation.foodSafetyChecks} controles`}
        />
        <InfoPill
          label="Caja"
          value={`${simulation.paymentStatus} · ${formatCurrency(simulation.cashExpected)}`}
        />
        <InfoPill
          label="Comprobantes"
          value={`${simulation.documents.length} documentos · ${evidenceCount} evidencias`}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Pedido de prueba
          </p>
          <div className="mt-2 space-y-2 text-sm">
            {simulation.orderItems.length ? (
              simulation.orderItems.map((item) => (
                <p key={item} className="font-medium">
                  {item}
                </p>
              ))
            ) : (
              <p className="text-zinc-500">Aun sin productos registrados.</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Documentos generados
          </p>
          <div className="mt-2 space-y-2 text-sm">
            {simulation.documents.length ? (
              simulation.documents.map((document) => (
                <p key={document} className="font-medium">
                  {document}
                </p>
              ))
            ) : (
              <p className="text-zinc-500">Aun sin documentos.</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Validaciones
          </p>
          <div className="mt-2 space-y-2 text-sm font-medium">
            <p>Compra: {simulation.purchaseReceived ? "Recepcionada" : "Pendiente"}</p>
            <p>Reportes: {simulation.reportsReviewed ? "Revisados" : "Pendientes"}</p>
            <p>Auditoria: {simulation.auditEntries} eventos</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function EducationModule() {
  const [educationProgress, setEducationProgress] = useState(
    readStoredEducationProgress,
  );
  const {
    completedActions,
    activePhaseIndex,
    lastOutcome,
    evidence,
    simulation,
    answers,
    practiceValues,
    attempts,
  } = educationProgress;
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const completedActionSet = useMemo(
    () => new Set(completedActions),
    [completedActions],
  );
  const totalActionCount = educationPhases.reduce(
    (total, phase) => total + phase.actions.length,
    0,
  );
  const completedCount = completedActions.length;
  const progressPercent = Math.round((completedCount / totalActionCount) * 100);
  const safePhaseIndex = Math.min(activePhaseIndex, educationPhases.length - 1);
  const activePhase = educationPhases[safePhaseIndex];
  const phaseCompletedCount = activePhase.actions.filter((action) =>
    completedActionSet.has(action.id),
  ).length;
  const activePhaseComplete = activePhase.actions.every((action) =>
    completedActionSet.has(action.id),
  );
  const tutorialComplete = completedCount === totalActionCount;
  const firstPendingPhaseIndex = useMemo(
    () => getFirstPendingEducationPhaseIndex(completedActionSet),
    [completedActionSet],
  );

  useEffect(() => {
    window.localStorage.setItem(
      EDUCATION_PROGRESS_KEY,
      JSON.stringify(educationProgress),
    );
  }, [educationProgress]);

  const updateAnswer = (actionId: string, optionId: string) => {
    setActionErrors((current) => ({ ...current, [actionId]: "" }));
    setEducationProgress((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [actionId]: optionId,
      },
    }));
  };

  const updatePracticeValue = (
    actionId: string,
    fieldId: string,
    value: string,
  ) => {
    setActionErrors((current) => ({ ...current, [actionId]: "" }));
    setEducationProgress((current) => ({
      ...current,
      practiceValues: {
        ...current.practiceValues,
        [actionId]: {
          ...(current.practiceValues[actionId] ?? {}),
          [fieldId]: value,
        },
      },
    }));
  };

  const completeAction = (action: EducationAction) => {
    const validationError = validateEducationAction(educationProgress, action);

    setEducationProgress((current) =>
      validationError
        ? {
            ...current,
            attempts: {
              ...current.attempts,
              [action.id]: (current.attempts[action.id] ?? 0) + 1,
            },
            lastOutcome: validationError,
          }
        : executeEducationAction(current, action),
    );

    setActionErrors((current) => ({
      ...current,
      [action.id]: validationError ?? "",
    }));
  };

  const advancePhase = () => {
    if (!activePhaseComplete) {
      return;
    }

    setEducationProgress((current) => ({
      ...current,
      activePhaseIndex: Math.min(
        current.activePhaseIndex + 1,
        educationPhases.length - 1,
      ),
      lastOutcome: "Nueva fase desbloqueada. Continua el servicio.",
    }));
  };

  const restartTutorial = () => {
    setEducationProgress({
      ...createDefaultEducationProgress(),
      lastOutcome: "Prueba reiniciada. Comienza desde el briefing de turno.",
    });
    setActionErrors({});
    window.localStorage.removeItem(EDUCATION_PROGRESS_KEY);
  };

  const jumpToPendingPhase = () => {
    if (firstPendingPhaseIndex < 0) {
      return;
    }

    setEducationProgress((current) => ({
      ...current,
      activePhaseIndex: firstPendingPhaseIndex,
      lastOutcome:
        "Fase pendiente cargada. Selecciona una alternativa y ejecuta la prueba.",
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Juego academico"
        title="Simulador evaluativo de atencion completa"
        description="El estudiante debe decidir entre alternativas y ejecutar operaciones virtuales reales: abrir turno, abrir mesa, tomar pedido, registrar producto, cocina, bodega, caja, reportes y auditoria."
      />

      <div className="rounded-lg border border-[var(--udla-orange)]/25 bg-[var(--udla-orange-soft)] p-5 text-[var(--udla-charcoal)] dark:border-[var(--udla-orange)]/40 dark:bg-[#241a16] dark:text-zinc-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase">Mision del estudiante</p>
            <h2 className="mt-1 text-2xl font-semibold">
              Completar la {simulation.pruebaId}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
              Cada fase exige una respuesta correcta y una ejecucion practica.
              Si la decision o los datos son incorrectos, la prueba no avanza y
              el intento queda contado para revision docente.
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-52">
            <div className="rounded-lg bg-white/70 p-4 text-center shadow-sm dark:bg-black/20">
              <p className="text-sm font-semibold uppercase">Progreso</p>
              <p className="mt-1 text-4xl font-semibold">{progressPercent}%</p>
            </div>
            <button
              type="button"
              onClick={restartTutorial}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--udla-orange)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--udla-orange-dark)]"
            >
              <RefreshCw className="h-4 w-4" />
              Nueva prueba
            </button>
            {!tutorialComplete && firstPendingPhaseIndex >= 0 ? (
              <button
                type="button"
                onClick={jumpToPendingPhase}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--udla-orange)]/40 bg-white/80 px-3 text-sm font-semibold text-[var(--udla-charcoal)] transition hover:bg-white hover:text-[var(--udla-orange)] dark:bg-black/20 dark:text-zinc-100"
              >
                <GraduationCap className="h-4 w-4" />
                Ir a fase pendiente
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/80 dark:bg-black/30">
          <div
            className="h-full rounded-full bg-[var(--udla-orange)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 lg:gap-4">
        <EducationMiniMetric
          label="Fase"
          value={`${safePhaseIndex + 1}/${educationPhases.length}`}
          icon={GraduationCap}
          tone="bg-[var(--udla-orange)]"
        />
        <EducationMiniMetric
          label="Aprobadas"
          value={`${completedCount}/${totalActionCount}`}
          icon={ListChecks}
          tone="bg-emerald-600"
        />
        <EducationMiniMetric
          label="Funciones"
          value={`${countCompletedEducationModules(completedActionSet)}/${educationCoverageModules.length}`}
          icon={LayoutDashboard}
          tone="bg-[var(--udla-charcoal)]"
        />
        <EducationMiniMetric
          label="Estado"
          value={tutorialComplete ? "Terminado" : "En curso"}
          icon={Activity}
          tone={tutorialComplete ? "bg-emerald-600" : "bg-amber-600"}
        />
      </div>

      {tutorialComplete ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p className="text-sm font-semibold uppercase">Prueba completada</p>
          <h2 className="mt-1 text-3xl font-semibold">
            Felicitaciones, completaste la prueba de atencion
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            Aprobaste decisiones y ejecuciones practicas sobre turno, mesa,
            pedido, producto, cocina, receta, inventario, compras, seguridad
            alimentaria, caja, documentos, reportes, auditoria, equipo y CRM. La bitacora de evidencias queda disponible en
            esta misma pantalla.
          </p>
          <button
            type="button"
            onClick={restartTutorial}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <RefreshCw className="h-4 w-4" />
            Reiniciar prueba
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        <Panel title="Fases del servicio" icon={GraduationCap}>
          <div className="grid grid-flow-col auto-cols-[minmax(210px,1fr)] gap-3 overflow-x-auto pb-1 xl:grid-flow-row xl:grid-cols-6 xl:overflow-visible">
            {educationPhases.map((phase, index) => {
              const phaseDone = phase.actions.every((action) =>
                completedActionSet.has(action.id),
              );
              const unlocked = index <= safePhaseIndex || tutorialComplete;
              const active = index === safePhaseIndex;

              return (
                <button
                  key={phase.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() =>
                    setEducationProgress((current) => ({
                      ...current,
                      activePhaseIndex: index,
                    }))
                  }
                  className={`h-full min-h-[124px] w-full rounded-lg border p-3 text-left transition ${
                    active
                      ? "border-[var(--udla-orange)] bg-[var(--udla-orange-soft)] text-[var(--udla-charcoal)] dark:border-[var(--udla-orange)] dark:bg-[#241a16] dark:text-zinc-100"
                      : "border-black/10 bg-zinc-50 hover:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-900"
                  } ${!unlocked ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">
                      Fase {index + 1}
                    </span>
                    {phaseDone ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                        Lista
                      </span>
                    ) : unlocked ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        En curso
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600">
                        Bloqueada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold">{phase.title}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {
                      phase.actions.filter((action) =>
                        completedActionSet.has(action.id),
                      ).length
                    }
                    /{phase.actions.length} acciones
                  </p>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={activePhase.title} icon={ClipboardCheck}>
          <div className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-semibold uppercase text-zinc-500">
              Caso completo
            </p>
            <p className="mt-1 font-semibold">{activePhase.scene}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {activePhase.caseNarrative}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Objetivo: {activePhase.goal}
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {activePhase.actions.map((action) => {
              const done = completedActionSet.has(action.id);
              const moduleMeta = modules.find(
                (moduleItem) => moduleItem.id === action.moduleId,
              );
              const challenge = educationChallenges[action.id];
              const selectedAnswer = answers[action.id] ?? "";
              const actionPracticeValues = practiceValues[action.id] ?? {};
              const actionError = actionErrors[action.id];
              const attemptCount = attempts[action.id] ?? 0;

              return (
                <div
                  key={action.id}
                  className={`rounded-lg border p-4 ${
                    done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-100"
                      : "border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-500">
                        {moduleMeta?.label ?? action.moduleId}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">{action.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {action.task}
                      </p>
                      {done ? (
                        <p className="mt-2 text-sm font-semibold">
                          Resultado: {action.outcome}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => completeAction(action)}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                          done
                            ? "cursor-default bg-emerald-600 text-white"
                            : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                        }`}
                      >
                        <ListChecks className="h-4 w-4" />
                        {done ? "Prueba aprobada" : "Validar prueba"}
                      </button>
                    </div>
                  </div>

                  {challenge ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
                        <p className="text-xs font-semibold uppercase text-zinc-500">
                          Decision del estudiante
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {challenge.question}
                        </p>
                        <div className="mt-3 grid gap-2">
                          {challenge.options.map((option) => {
                            const selected = selectedAnswer === option.id;
                            const approved =
                              done && option.id === challenge.correctOptionId;

                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={done}
                                onClick={() => updateAnswer(action.id, option.id)}
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  approved
                                    ? "border-emerald-400 bg-emerald-100 text-emerald-950"
                                    : selected
                                      ? "border-[var(--udla-orange)] bg-[var(--udla-orange-soft)] text-[var(--udla-charcoal)] dark:border-[var(--udla-orange)] dark:bg-[#241a16] dark:text-zinc-100"
                                      : "border-black/10 bg-white hover:border-[var(--udla-orange)] dark:border-white/10 dark:bg-zinc-950"
                                } ${done ? "cursor-default" : ""}`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
                        <p className="text-xs font-semibold uppercase text-zinc-500">
                          {challenge.practiceTitle}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {challenge.practiceDescription}
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {challenge.fields.map((field) => {
                            const value = actionPracticeValues[field.id] ?? "";

                            return (
                              <label
                                key={field.id}
                                className="grid gap-1 text-sm font-semibold"
                              >
                                {field.label}
                                {field.type === "select" ? (
                                  <select
                                    aria-label={field.label}
                                    value={value}
                                    disabled={done}
                                    onChange={(event) =>
                                      updatePracticeValue(
                                        action.id,
                                        field.id,
                                        event.target.value,
                                      )
                                    }
                                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-zinc-950 disabled:cursor-default disabled:opacity-80 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                                  >
                                    <option value="">Seleccionar</option>
                                    {field.options?.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    aria-label={field.label}
                                    type={field.type}
                                    value={value}
                                    disabled={done}
                                    placeholder={field.placeholder}
                                    onChange={(event) =>
                                      updatePracticeValue(
                                        action.id,
                                        field.id,
                                        event.target.value,
                                      )
                                    }
                                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-zinc-950 disabled:cursor-default disabled:opacity-80 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                                  />
                                )}
                                {field.helper ? (
                                  <span className="text-xs font-normal text-zinc-500">
                                    {field.helper}
                                  </span>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {actionError ? (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-100">
                      {actionError}
                    </div>
                  ) : null}

                  {attemptCount ? (
                    <p className="mt-2 text-xs font-semibold uppercase text-zinc-500">
                      Intentos registrados: {attemptCount}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-zinc-500">
                  Avance de fase
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {phaseCompletedCount}/{activePhase.actions.length} acciones
                  aprobadas. Ultimo resultado: {lastOutcome}
                </p>
                {activePhaseComplete && !tutorialComplete ? (
                    <p className="mt-2 text-sm font-semibold text-[var(--udla-orange)] dark:text-orange-300">
                    Esta fase ya esta aprobada. Avanza para responder y ejecutar
                    la siguiente fase pendiente.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!activePhaseComplete || tutorialComplete}
                onClick={advancePhase}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--udla-orange)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--udla-orange-dark)] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
              >
                <GraduationCap className="h-4 w-4" />
                {safePhaseIndex === educationPhases.length - 1
                  ? "Servicio completo"
                  : "Ir a siguiente fase"}
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <EducationStatusPanel
        simulation={simulation}
        evidenceCount={evidence.length}
      />

      <Panel title="Bitacora comprobable de la prueba" icon={ListChecks}>
        <div className="space-y-3">
          {evidence.length ? (
            evidence.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-zinc-500">
                      {item.entityType} · {item.entityId}
                    </p>
                    <h3 className="mt-1 font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {item.summary}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-500">
                    {formatDateTimeLabel(item.createdAt)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {item.details.map((detail, detailIndex) => (
                    <div
                      key={`${item.id}-${detail.label}-${detailIndex}`}
                      className="rounded-md bg-white px-3 py-2 text-sm dark:bg-zinc-950"
                    >
                      <p className="text-xs font-semibold uppercase text-zinc-500">
                        {detail.label}
                      </p>
                      <p className="mt-1 font-semibold">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-white/15 dark:bg-zinc-900">
              Ejecuta el primer paso para generar evidencia comprobable.
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Cobertura de funciones" icon={LayoutDashboard}>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 xl:grid-cols-8">
          {educationCoverageModules.map((moduleId) => {
            const moduleActions = educationPhases.flatMap((phase) =>
              phase.actions.filter((action) => action.moduleId === moduleId),
            );
            const moduleDone = moduleActions.every((action) =>
              completedActionSet.has(action.id),
            );
            const moduleMeta = modules.find((moduleItem) => moduleItem.id === moduleId);

            return (
              <div
                key={moduleId}
                data-education-coverage={moduleId}
                className={`min-w-0 truncate rounded-md border px-2 py-1.5 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                  moduleDone
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-black/10 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {moduleMeta?.shortLabel ?? moduleMeta?.label ?? moduleId}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function countCompletedEducationModules(completedActionSet: Set<string>) {
  return educationCoverageModules.filter((moduleId) => {
    const moduleActions = educationPhases.flatMap((phase) =>
      phase.actions.filter((action) => action.moduleId === moduleId),
    );

    return moduleActions.every((action) => completedActionSet.has(action.id));
  }).length;
}

function VisualOperationsStrip({
  stats,
  tables,
  onModuleSelect,
}: {
  stats: DashboardStats;
  tables: RestaurantTable[];
  onModuleSelect: (moduleId: ModuleId) => void;
}) {
  const panelActions: Record<
    string,
    { moduleId: ModuleId; actionLabel: string; metric: string }
  > = {
    Salon: {
      moduleId: "tables",
      actionLabel: "Abrir mapa",
      metric: `${stats.occupiedTables}/${tables.length} mesas`,
    },
    Cocina: {
      moduleId: "kitchen",
      actionLabel: "Ver comandas",
      metric: `${stats.kitchenAverage} min`,
    },
    Caja: {
      moduleId: "cash",
      actionLabel: "Gestionar pagos",
      metric: formatCurrency(stats.totalSales),
    },
    Bodega: {
      moduleId: "inventory",
      actionLabel: "Revisar stock",
      metric: `${stats.stockAlerts} alertas`,
    },
  };

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
      {visualPanels.map((panel) => {
        const action = panelActions[panel.title] ?? {
          moduleId: "dashboard" as ModuleId,
          actionLabel: "Abrir",
          metric: "Activo",
        };
        const moduleMeta = modules.find((moduleItem) => moduleItem.id === action.moduleId);
        const Icon = moduleMeta?.icon ?? LayoutDashboard;

        return (
          <button
            key={panel.title}
            type="button"
            data-visual-panel={panel.title}
            onClick={() => onModuleSelect(action.moduleId)}
            className="group relative h-24 min-w-0 overflow-hidden rounded-lg bg-zinc-900 text-left text-white shadow-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:ring-[var(--udla-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--udla-orange)] sm:h-32 lg:h-36"
            aria-label={`Abrir ${getModuleLabel(action.moduleId)}`}
          >
            <Image
              src={panel.image}
              alt=""
              fill
              unoptimized
              loading="eager"
              sizes="25vw"
              className="object-cover opacity-55 transition duration-300 group-hover:scale-105 group-hover:opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="relative flex h-full min-w-0 flex-col justify-between p-2 sm:p-3">
              <div className="flex min-w-0 items-start justify-between gap-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm sm:h-8 sm:w-8">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <span className="min-w-0 truncate rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-white/95 sm:px-2 sm:text-[11px]">
                  {action.metric}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight sm:text-xl">
                  {panel.title}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-semibold leading-tight text-white/85 sm:text-xs">
                  {action.actionLabel}
                </p>
                <p className="mt-1 hidden text-xs leading-4 text-white/75 sm:block">
                  {panel.subtitle}
                </p>
              </div>
            </div>
          </button>
        );
      })}
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

function EducationMiniMetric({
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
    <div
      data-education-metric={label}
      className="min-w-0 rounded-lg border border-black/10 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#18191b] sm:p-3"
    >
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase leading-tight text-zinc-500 dark:text-zinc-400 sm:text-xs">
          {label}
        </p>
        <span
          className={`hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-white sm:flex ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1 truncate text-[15px] font-semibold leading-tight text-zinc-950 dark:text-zinc-50 sm:mt-2 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function DashboardMiniMetric({
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
    <div
      data-dashboard-metric={label}
      className="min-w-0 rounded-lg border border-black/10 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#18191b] sm:p-3"
    >
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase leading-tight text-zinc-500 dark:text-zinc-400 sm:text-xs">
          {label}
        </p>
        <span
          className={`hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-white sm:flex ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1 truncate text-[15px] font-semibold leading-tight text-zinc-950 dark:text-zinc-50 sm:mt-2 sm:text-xl">
        {value}
      </p>
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

function SalesTrendChart() {
  const { reportPoints } = useRestaurantData();
  const maxSales = Math.max(1, ...reportPoints.map((point) => point.sales));
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
  const maxSales = Math.max(1, ...reportPoints.map((point) => point.sales));

  return (
    <div className="flex h-full items-end gap-3 rounded-lg border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
      {reportPoints.map((point) => (
        <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2">
          <div className="flex flex-1 items-end gap-1">
            <span
              className="w-1/2 rounded-t-md bg-[var(--udla-charcoal)]"
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

function formatDateTimeLabel(createdAt: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

function getSafeLogoUrl(logoUrl: string) {
  const normalizedLogoUrl = logoUrl.trim();

  if (!normalizedLogoUrl.startsWith("/")) {
    return "/logo-original-udla.png";
  }

  if (normalizedLogoUrl === "/logo.png" || normalizedLogoUrl === "/logo-udla.svg") {
    return "/logo-original-udla.png";
  }

  return normalizedLogoUrl;
}

function buildOperationalReports(snapshot: RestaurantSnapshot) {
  const nonCancelledOrders = snapshot.orders.filter(
    (order) => order.status !== "cancelled",
  );
  const completedOrders = nonCancelledOrders.filter((order) =>
    ["paid", "delivered", "ready"].includes(order.status),
  );
  const recognizedOrders = completedOrders.length
    ? completedOrders
    : nonCancelledOrders;
  const cashSaleMovements = snapshot.cashMovements.filter(
    (movement) => movement.type === "sale",
  );
  const cashSales = cashSaleMovements.reduce(
    (total, movement) => total + Math.max(0, movement.amount),
    0,
  );
  const orderSales = recognizedOrders.reduce(
    (total, order) => total + order.total,
    0,
  );
  const recognizedSales = cashSales || orderSales;
  const productReports = buildProductReports({
    orders: recognizedOrders,
    products: snapshot.products,
    recipes: snapshot.recipes,
    rawMaterials: snapshot.rawMaterials,
  });
  const estimatedFoodCost = productReports.reduce(
    (total, product) => total + product.cost,
    0,
  );
  const grossMargin = Math.max(0, recognizedSales - estimatedFoodCost);
  const foodCostPercent = recognizedSales
    ? (estimatedFoodCost / recognizedSales) * 100
    : 0;
  const averageTicket = recognizedOrders.length
    ? recognizedSales / recognizedOrders.length
    : 0;
  const inventoryValue = snapshot.rawMaterials.reduce(
    (total, material) => total + material.stock * calculateRealNetUnitCost(material),
    0,
  );
  const wasteReports = buildWasteReports(snapshot.inventoryMovements);
  const wasteValue = wasteReports.reduce((total, waste) => total + waste.value, 0);
  const purchaseTotal = snapshot.purchases.reduce(
    (total, purchase) => total + purchase.total,
    0,
  );
  const paymentTotals = buildPaymentTotals(snapshot.cashMovements);
  const tipTotal = snapshot.cashMovements
    .filter((movement) => movement.type === "tip")
    .reduce((total, movement) => total + Math.max(0, movement.amount), 0);
  const cashOutTotal = snapshot.cashMovements
    .filter((movement) => movement.type === "withdrawal" || movement.type === "advance")
    .reduce((total, movement) => total + Math.abs(movement.amount), 0);
  const registerDifference = snapshot.cashRegisters.reduce(
    (total, register) => total + (register.differenceAmount ?? 0),
    0,
  );
  const movementDifference = snapshot.cashMovements
    .filter((movement) => movement.type === "difference")
    .reduce((total, movement) => total + movement.amount, 0);
  const reportPoints = buildRealReportPoints({
    orders: nonCancelledOrders,
    products: snapshot.products,
    recipes: snapshot.recipes,
    rawMaterials: snapshot.rawMaterials,
  });
  const employeeReports = buildEmployeeReports(nonCancelledOrders);

  return {
    recognizedSales,
    grossMargin,
    wasteValue,
    cancelledOrders: snapshot.orders.filter((order) => order.status === "cancelled")
      .length,
    inventoryValue,
    purchaseTotal,
    foodCostPercent,
    averageTicket,
    productReports,
    topProduct: productReports[0],
    lowProduct: [...productReports].reverse().find((product) => product.quantity > 0),
    topWaste: wasteReports[0],
    averageKitchenMinutes: calculateAverageKitchenMinutes({
      orders: nonCancelledOrders,
      products: snapshot.products,
    }),
    lowStockCount: snapshot.rawMaterials.filter(
      (material) => material.stock <= material.minStock,
    ).length,
    cashDifference: registerDifference || movementDifference,
    paymentTotals,
    tipTotal,
    cashOutTotal,
    supplierReports: buildSupplierReports(snapshot.purchases),
    wasteReports,
    employeeReports,
    reportPoints,
  };
}

function buildProductReports({
  orders,
  products,
  recipes,
  rawMaterials,
}: {
  orders: Order[];
  products: Product[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
}) {
  const reports = new Map<
    string,
    {
      id: string;
      name: string;
      quantity: number;
      sales: number;
      cost: number;
      margin: number;
      foodCostPercent: number;
    }
  >();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const productCost = product
        ? calculateProductUnitCost({ product, recipes, rawMaterials })
        : 0;
      const sales = item.quantity * item.unitPrice;
      const cost = item.quantity * productCost;
      const current = reports.get(item.productId) ?? {
        id: item.productId,
        name: product?.name ?? item.productName,
        quantity: 0,
        sales: 0,
        cost: 0,
        margin: 0,
        foodCostPercent: 0,
      };

      current.quantity += item.quantity;
      current.sales += sales;
      current.cost += cost;
      current.margin = current.sales - current.cost;
      current.foodCostPercent = current.sales
        ? (current.cost / current.sales) * 100
        : 0;
      reports.set(item.productId, current);
    });
  });

  return [...reports.values()].sort((left, right) => {
    if (right.quantity !== left.quantity) {
      return right.quantity - left.quantity;
    }

    return right.margin - left.margin;
  });
}

function calculateProductUnitCost({
  product,
  recipes,
  rawMaterials,
}: {
  product: Product;
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
}) {
  const recipe = product.recipeId
    ? recipes.find((candidate) => candidate.id === product.recipeId)
    : undefined;

  if (!recipe) {
    return 0;
  }

  return calculateRecipeSummary(recipe, rawMaterials).costPerPortion;
}

function buildPaymentTotals(cashMovements: CashMovement[]) {
  const totals: Record<PaymentMethod | "internal", number> = {
    cash: 0,
    debit: 0,
    credit: 0,
    transfer: 0,
    internal: 0,
  };

  cashMovements
    .filter((movement) => movement.type === "sale")
    .forEach((movement) => {
      totals[movement.method] += Math.max(0, movement.amount);
    });

  return totals;
}

function buildWasteReports(inventoryMovements: InventoryMovement[]) {
  const reports = new Map<
    string,
    { name: string; quantity: number; value: number }
  >();

  inventoryMovements
    .filter((movement) => movement.type === "waste")
    .forEach((movement) => {
      const current = reports.get(movement.rawMaterialId) ?? {
        name: movement.materialName,
        quantity: 0,
        value: 0,
      };

      current.quantity += Math.abs(movement.quantity);
      current.value += Math.abs(movement.quantity * movement.unitCost);
      reports.set(movement.rawMaterialId, current);
    });

  return [...reports.values()].sort((left, right) => right.value - left.value);
}

function buildSupplierReports(purchases: Purchase[]) {
  const reports = new Map<string, { name: string; total: number; count: number }>();

  purchases.forEach((purchase) => {
    const current = reports.get(purchase.supplierId) ?? {
      name: purchase.supplierName,
      total: 0,
      count: 0,
    };

    current.total += purchase.total;
    current.count += 1;
    reports.set(purchase.supplierId, current);
  });

  return [...reports.values()].sort((left, right) => right.total - left.total);
}

function buildEmployeeReports(orders: Order[]) {
  const reports = new Map<string, { name: string; sales: number; orders: number }>();

  orders.forEach((order) => {
    const current = reports.get(order.waiter) ?? {
      name: order.waiter,
      sales: 0,
      orders: 0,
    };

    current.sales += order.total;
    current.orders += 1;
    reports.set(order.waiter, current);
  });

  return [...reports.values()].sort((left, right) => right.sales - left.sales);
}

function buildRealReportPoints({
  orders,
  products,
  recipes,
  rawMaterials,
}: {
  orders: Order[];
  products: Product[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
}): ReportPoint[] {
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
    const cost = order.items.reduce((total, item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return (
        total +
        item.quantity *
          (product
            ? calculateProductUnitCost({ product, recipes, rawMaterials })
            : 0)
      );
    }, 0);

    points[index].sales += order.total;
    points[index].foodCost += cost;
    points[index].margin += order.total - cost;
    points[index].orders += 1;
  });

  return points;
}

function calculateAverageKitchenMinutes({
  orders,
  products,
}: {
  orders: Order[];
  products: Product[];
}) {
  const items = orders.flatMap((order) => order.items);

  if (!items.length) {
    return 0;
  }

  const totalMinutes = items.reduce((total, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return total + item.quantity * (product?.prepTimeMinutes ?? 0);
  }, 0);
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  return totalQuantity ? Math.round(totalMinutes / totalQuantity) : 0;
}

function recipeToTechnicalDraft(recipe: Recipe): TechnicalRecipeDraft {
  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    portions: recipe.portions,
    prepTimeMinutes: recipe.prepTimeMinutes,
    photoUrl: recipe.image,
    procedure: recipe.procedure,
    allergens: recipe.allergens,
    observations: recipe.observations,
    targetFoodCostPercent: recipe.targetFoodCostPercent,
    salePrice: recipe.salePrice,
    ingredients: recipe.ingredients.map((ingredient) => ({
      rawMaterialId: ingredient.rawMaterialId,
      unit: ingredient.unit,
      grossQuantity: ingredient.grossQuantity,
      yieldPercent: ingredient.yieldPercent,
      wasteType: ingredient.wasteType,
    })),
  };
}

function productToCatalogDraft(
  product: Product | undefined,
  productCategories: ProductCategory[],
  recipes: Recipe[],
): ProductCatalogDraft {
  const fallbackRecipe = recipes[0];

  return {
    id: product?.id,
    name: product?.name ?? "Nuevo producto",
    categoryId: product?.categoryId ?? productCategories[0]?.id ?? "",
    recipeId: product?.recipeId ?? fallbackRecipe?.id,
    description: product?.description ?? "Descripcion comercial del producto.",
    imageUrl:
      product?.image ??
      fallbackRecipe?.image ??
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
    salePrice: product?.price ?? fallbackRecipe?.salePrice ?? 0,
    isAvailable: product?.available ?? true,
    prepTimeMinutes: product?.prepTimeMinutes ?? fallbackRecipe?.prepTimeMinutes ?? 0,
    customizationOptions: product?.modifiers ?? [],
  };
}

function buildProductFromCatalogDraft({
  draft,
  recipes,
}: {
  draft: ProductCatalogDraft & { id: string };
  recipes: Recipe[];
}): Product {
  const recipe = draft.recipeId
    ? recipes.find((item) => item.id === draft.recipeId)
    : undefined;

  return {
    id: draft.id,
    name: draft.name,
    categoryId: draft.categoryId,
    description: draft.description,
    image: draft.imageUrl || recipe?.image || "/globe.svg",
    price: draft.salePrice,
    available: draft.isAvailable,
    prepTimeMinutes: draft.prepTimeMinutes,
    recipeId: draft.recipeId || undefined,
    modifiers: draft.customizationOptions,
  };
}

function buildRecipeFromTechnicalDraft({
  draft,
  rawMaterials,
}: {
  draft: TechnicalRecipeDraft;
  rawMaterials: RawMaterial[];
}): Recipe {
  return {
    id: draft.id ?? "recipe-editor-preview",
    name: draft.name,
    category: draft.category,
    image: draft.photoUrl || "/globe.svg",
    portions: draft.portions || 1,
    prepTimeMinutes: draft.prepTimeMinutes,
    allergens: draft.allergens,
    procedure: draft.procedure,
    observations: draft.observations,
    targetFoodCostPercent: draft.targetFoodCostPercent || 30,
    salePrice: draft.salePrice,
    ingredients: draft.ingredients.map((ingredient, index) => {
      const material = rawMaterials.find(
        (item) => item.id === ingredient.rawMaterialId,
      );

      return {
        id: `${draft.id ?? "draft"}-ingredient-${index}`,
        rawMaterialId: ingredient.rawMaterialId,
        name: material?.name ?? "Ingrediente",
        unit: material?.unit ?? ingredient.unit,
        grossQuantity: ingredient.grossQuantity,
        yieldPercent: ingredient.yieldPercent,
        wasteType: ingredient.wasteType || "Sin merma",
      };
    }),
  };
}

function parseListInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createClientId(prefix: string, source: RestaurantSnapshot["source"]) {
  if (
    source === "supabase" &&
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}`;
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/[^\d-]/g, "");
  return Number(normalized) || 0;
}

function parseDecimalCurrencyInput(value: string) {
  const compact = value.trim().replace(/\s/g, "");
  const normalized =
    compact.includes(",") && compact.includes(".")
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact.replace(",", ".");
  const parsed = Number.parseFloat(normalized.replace(/[^\d.-]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseQuantityInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRawMaterialGrossUnitCost(material?: RawMaterial) {
  if (!material || material.purchaseQuantity <= 0) {
    return 0;
  }

  return material.purchaseCost / material.purchaseQuantity;
}

function formatDecimalInput(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return String(Math.round(value * 100) / 100);
}
