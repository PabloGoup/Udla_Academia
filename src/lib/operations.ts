import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CashMovement,
  CustomerInteraction,
  Employee,
  FoodSafetyLog,
  InventoryMovement,
  Order,
  OrderStatus,
  OperationalDocument,
  PaymentMethod,
  Product,
  Purchase,
  RecipeIngredient,
  Reservation,
  RestaurantSettings,
  RoleId,
  TableStatus,
} from "@/lib/types";

export interface OperationResult {
  ok: boolean;
  message: string;
}

interface AuditLogDraft {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: RoleId;
}

export interface CashMovementDraft {
  type: Extract<CashMovement["type"], "withdrawal" | "advance" | "difference">;
  method: PaymentMethod | "internal";
  amount: number;
  description: string;
}

export interface InventoryMovementDraft {
  rawMaterialId: string;
  type: Extract<InventoryMovement["type"], "manual_out" | "adjustment" | "waste">;
  quantity: number;
  reason: string;
}

export interface FoodSafetyCheckDraft {
  rawMaterialId: string;
  checkType: string;
  measuredTemperature: string;
  result: FoodSafetyLog["result"];
  notes: string;
}

export interface EmployeeDraft {
  id?: string;
  name: string;
  role: RoleId;
  rut: string;
  phone: string;
  shift: string;
  hourlyCost: number;
  status: Employee["status"];
  hiredAt: string;
}

export interface CustomerDraft {
  id?: string;
  name: string;
  phone: string;
  email: string;
  documentId: string;
  preferences: string;
  allergies: string[];
  tags: string[];
  notes: string;
}

export interface ReservationDraft {
  id?: string;
  customerId: string;
  tableId?: string;
  partySize: number;
  date: string;
  time: string;
  status: Reservation["status"];
  channel: Reservation["channel"];
  occasion: string;
  notes: string;
  assignedTo?: string;
}

export interface CustomerInteractionDraft {
  customerId: string;
  type: CustomerInteraction["type"];
  summary: string;
  dueAt: string;
  completed: boolean;
}

export interface OperationalDocumentDraft {
  type: OperationalDocument["type"];
  title: string;
  orderId?: string;
  cashRegisterId?: string;
  reservationId?: string;
  payload: Record<string, unknown>;
}

export type RestaurantSettingsDraft = RestaurantSettings;

export interface PurchaseReceptionDraft {
  supplierId: string;
  documentType: Purchase["documentType"];
  documentNumber: string;
  rawMaterialId: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  yieldPercent: number;
  expirationDate: string;
  lot: string;
}

export interface TechnicalRecipeDraft {
  id?: string;
  name: string;
  category: string;
  portions: number;
  prepTimeMinutes: number;
  photoUrl: string;
  procedure: string;
  allergens: string[];
  observations: string;
  targetFoodCostPercent: number;
  salePrice: number;
  ingredients: Array<
    Pick<
      RecipeIngredient,
      "rawMaterialId" | "unit" | "grossQuantity" | "yieldPercent" | "wasteType"
    >
  >;
}

export interface ProductCatalogDraft {
  id?: string;
  name: string;
  categoryId: string;
  recipeId?: string;
  description: string;
  imageUrl: string;
  salePrice: number;
  isAvailable: boolean;
  prepTimeMinutes: number;
  customizationOptions: string[];
}

type DbUserProfile = {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
};

export async function getCurrentAuthProfile(): Promise<AuthProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  await supabase.rpc("ensure_current_user_profile");

  const { data } = await supabase
    .from("users")
    .select("id,email,full_name,role_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  const profile = data as DbUserProfile | null;
  const metadataRole =
    typeof authData.user.app_metadata?.role === "string"
      ? authData.user.app_metadata.role
      : undefined;

  return {
    id: authData.user.id,
    email: authData.user.email ?? profile?.email ?? "",
    name:
      profile?.full_name ??
      (typeof authData.user.user_metadata?.full_name === "string"
        ? authData.user.user_metadata.full_name
        : authData.user.email?.split("@")[0]) ??
      "Operador",
    role: toRoleId(profile?.role_id ?? metadataRole),
  };
}

export async function signInOperator(
  email: string,
  password: string,
): Promise<{ result: OperationResult; profile: AuthProfile | null }> {
  if (!isSupabaseConfigured()) {
    return {
      result: {
        ok: false,
        message: "Supabase no esta configurado para iniciar sesion.",
      },
      profile: null,
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      result: { ok: false, message: error.message },
      profile: null,
    };
  }

  return {
    result: { ok: true, message: "Sesion iniciada correctamente." },
    profile: await getCurrentAuthProfile(),
  };
}

export async function signOutOperator(): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, message: "Modo demo sin sesion activa." };
  }

  const { error } = await getSupabaseBrowserClient().auth.signOut();

  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: "Sesion cerrada." };
}

export async function persistTableStatus(
  tableId: string,
  status: TableStatus,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const { error } = await getSupabaseBrowserClient()
    .from("tables")
    .update({ status })
    .eq("id", tableId);

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog({
    action: "table.status.update",
    entityType: "table",
    entityId: tableId,
    summary: `Mesa actualizada a ${status}.`,
    metadata: { status },
  });

  return { ok: true, message: "Estado de mesa guardado en Supabase." };
}

export async function persistOrderStatus(
  orderId: string,
  status: OrderStatus,
  tableId?: string,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const supabase = getSupabaseBrowserClient();
  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", orderId);

  if (orderError) {
    return writeError(orderError.message);
  }

  await supabase.from("order_items").update({ status }).eq("order_id", orderId);

  if (status === "paid" && tableId) {
    const { error: tableError } = await supabase
      .from("tables")
      .update({ status: "cleaning", current_order_id: null })
      .eq("id", tableId);

    if (tableError) {
      return writeError(tableError.message);
    }
  }

  await recordAuditLog({
    action: "order.status.update",
    entityType: "order",
    entityId: orderId,
    summary: `Pedido actualizado a ${status}.`,
    metadata: { status, tableId: tableId ?? null },
  });

  return { ok: true, message: "Estado de pedido guardado en Supabase." };
}

export async function persistOrderItem(
  order: Order,
  product: Product,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const supabase = getSupabaseBrowserClient();
  const newTotal = order.total + product.price;
  const modifiers = product.modifiers.slice(0, 1);
  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    product_name: product.name,
    quantity: 1,
    unit_price: product.price,
    modifiers,
    observations: "Agregado desde POS",
    station: product.categoryId === "cat-bar" ? "bar" : "hot",
    status: "pending",
  });

  if (itemError) {
    return writeError(itemError.message);
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      subtotal: newTotal,
      total_amount: newTotal,
      status:
        order.status === "delivered" || order.status === "paid"
          ? "pending"
          : order.status,
    })
    .eq("id", order.id);

  if (orderError) {
    return writeError(orderError.message);
  }

  await recordAuditLog({
    action: "order.item.add",
    entityType: "order",
    entityId: order.id,
    summary: `${product.name} agregado al pedido ${order.number}.`,
    metadata: { productId: product.id, price: product.price },
  });

  return { ok: true, message: "Producto agregado y guardado en Supabase." };
}

export async function persistKitchenTicket(order: Order): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const ticketNumber = `K-${order.number}-${Date.now().toString().slice(-5)}`;
  const { error } = await getSupabaseBrowserClient().from("kitchen_tickets").insert({
    order_id: order.id,
    ticket_number: ticketNumber,
    payload: {
      orderNumber: order.number,
      tableNumber: order.tableNumber,
      waiter: order.waiter,
      items: order.items,
      sentAt: new Date().toISOString(),
    },
  });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog({
    action: "kitchen.ticket.create",
    entityType: "order",
    entityId: order.id,
    summary: `Comanda ${ticketNumber} enviada para ${order.number}.`,
    metadata: { ticketNumber, items: order.items.length },
  });

  return { ok: true, message: "Comanda enviada y registrada en Supabase." };
}

export async function persistCashRegisterOpen(
  openingAmount: number,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const supabase = getSupabaseBrowserClient();
  const openRegister = await getOpenCashRegister();

  if (openRegister) {
    return {
      ok: false,
      message: "Ya existe una caja abierta en Supabase.",
    };
  }

  const responsibleId = await getCurrentEmployeeId();
  const { data, error } = await supabase
    .from("cash_registers")
    .insert({
      opened_by: responsibleId,
      opening_amount: openingAmount,
      expected_amount: openingAmount,
      status: "open",
      notes: "Apertura desde POS",
    })
    .select("id")
    .single();

  if (error) {
    return writeError(error.message);
  }

  const { error: movementError } = await supabase.from("cash_movements").insert({
    cash_register_id: data.id,
    movement_type: "opening",
    payment_method: null,
    amount: openingAmount,
    description: "Apertura de caja",
    responsible_id: responsibleId,
  });

  if (movementError) {
    return writeError(movementError.message);
  }

  await recordAuditLog(
    {
      action: "cash.register.open",
      entityType: "cash_register",
      entityId: data.id,
      summary: `Caja abierta con ${openingAmount}.`,
      metadata: { openingAmount },
    },
    responsibleId,
  );

  return { ok: true, message: "Caja abierta y registrada en Supabase." };
}

export async function persistCashMovement(
  movement: CashMovementDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const openRegister = await getOpenCashRegister();

  if (!openRegister) {
    return {
      ok: false,
      message: "No hay caja abierta para registrar el movimiento.",
    };
  }

  const supabase = getSupabaseBrowserClient();
  const signedAmount = normalizeCashMovementAmount(movement.type, movement.amount);
  const responsibleId = await getCurrentEmployeeId();
  const { error } = await supabase.from("cash_movements").insert({
    cash_register_id: openRegister.id,
    movement_type: movement.type,
    payment_method: movement.method === "internal" ? null : movement.method,
    amount: signedAmount,
    description: movement.description,
    responsible_id: responsibleId,
  });

  if (error) {
    return writeError(error.message);
  }

  await updateCashRegisterExpected(openRegister.id, signedAmount);

  await recordAuditLog(
    {
      action: "cash.movement.create",
      entityType: "cash_register",
      entityId: openRegister.id,
      summary: `${movement.type} registrado en caja.`,
      metadata: {
        type: movement.type,
        method: movement.method,
        amount: signedAmount,
        description: movement.description,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Movimiento de caja registrado en Supabase." };
}

export async function persistCashPayment({
  order,
  method,
  tipAmount,
  discountAmount,
}: {
  order: Order;
  method: PaymentMethod;
  tipAmount: number;
  discountAmount: number;
}): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const openRegister = await getOpenCashRegister();

  if (!openRegister) {
    return {
      ok: false,
      message: "No hay caja abierta para cobrar la cuenta.",
    };
  }

  const supabase = getSupabaseBrowserClient();
  const responsibleId = await getCurrentEmployeeId();
  const paidAt = new Date().toISOString();
  const saleAmount = Math.max(0, order.total - discountAmount);
  const { data: orderRow } = await supabase
    .from("orders")
    .select("table_id")
    .eq("id", order.id)
    .maybeSingle();

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_method: method,
      discount_amount: discountAmount,
      tip_amount: tipAmount,
      total_amount: saleAmount,
      cashier_id: responsibleId,
      paid_at: paidAt,
    })
    .eq("id", order.id);

  if (orderError) {
    return writeError(orderError.message);
  }

  const movements = [
    {
      cash_register_id: openRegister.id,
      order_id: order.id,
      movement_type: "sale",
      payment_method: method,
      amount: saleAmount,
      description: `Pago ${order.number}`,
      responsible_id: responsibleId,
    },
  ];

  if (tipAmount > 0) {
    movements.push({
      cash_register_id: openRegister.id,
      order_id: order.id,
      movement_type: "tip",
      payment_method: method,
      amount: tipAmount,
      description: `Propina ${order.number}`,
      responsible_id: responsibleId,
    });
  }

  const { error: movementError } = await supabase
    .from("cash_movements")
    .insert(movements);

  if (movementError) {
    return writeError(movementError.message);
  }

  await updateCashRegisterExpected(openRegister.id, saleAmount + tipAmount);

  const { error: inventoryError } = await supabase.rpc("consume_order_inventory", {
    target_order_id: order.id,
    responsible_employee_id: responsibleId,
  });

  if (
    orderRow &&
    typeof orderRow === "object" &&
    "table_id" in orderRow &&
    orderRow.table_id
  ) {
    await supabase
      .from("tables")
      .update({ status: "cleaning", current_order_id: null })
      .eq("id", orderRow.table_id);
  }

  if (inventoryError) {
    return {
      ok: false,
      message: `Cuenta cobrada, pero no se pudo descontar inventario: ${inventoryError.message}`,
    };
  }

  await recordAuditLog(
    {
      action: "cash.payment.settle",
      entityType: "order",
      entityId: order.id,
      summary: `Cuenta ${order.number} cobrada con ${method}.`,
      metadata: {
        method,
        saleAmount,
        tipAmount,
        discountAmount,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Cuenta cobrada y caja actualizada en Supabase." };
}

export async function persistInventoryMovement(
  movement: InventoryMovementDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const supabase = getSupabaseBrowserClient();
  const responsibleId = await getCurrentEmployeeId();
  const { data: material, error: materialError } = await supabase
    .from("raw_materials")
    .select("stock_quantity,purchase_quantity,purchase_cost,average_yield_percent")
    .eq("id", movement.rawMaterialId)
    .maybeSingle();

  if (materialError) {
    return writeError(materialError.message);
  }

  if (!material) {
    return {
      ok: false,
      message: "No se encontro la materia prima en Supabase.",
    };
  }

  const signedQuantity = normalizeInventoryMovementQuantity(
    movement.type,
    movement.quantity,
  );
  const unitCost = calculateInventoryUnitCost(material);
  const { error: insertError } = await supabase.from("inventory_movements").insert({
    raw_material_id: movement.rawMaterialId,
    movement_type: movement.type,
    quantity: signedQuantity,
    unit_cost: unitCost,
    reason: movement.reason,
    responsible_id: responsibleId,
  });

  if (insertError) {
    return writeError(insertError.message);
  }

  const currentStock = Number(material.stock_quantity ?? 0);
  const { error: updateError } = await supabase
    .from("raw_materials")
    .update({
      stock_quantity: Math.max(0, currentStock + signedQuantity),
    })
    .eq("id", movement.rawMaterialId);

  if (updateError) {
    return writeError(updateError.message);
  }

  await recordAuditLog(
    {
      action: "inventory.movement.create",
      entityType: "raw_material",
      entityId: movement.rawMaterialId,
      summary: `${movement.type} registrado en inventario.`,
      metadata: {
        type: movement.type,
        quantity: signedQuantity,
        reason: movement.reason,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Movimiento de inventario registrado en Supabase." };
}

export async function persistFoodSafetyCheck(
  check: FoodSafetyCheckDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const { error } = await getSupabaseBrowserClient()
    .from("food_safety_logs")
    .insert({
      raw_material_id: check.rawMaterialId,
      check_type: check.checkType,
      measured_temperature: check.measuredTemperature || null,
      result: check.result,
      notes: check.notes,
      responsible_id: responsibleId,
    });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "food_safety.check.create",
      entityType: "raw_material",
      entityId: check.rawMaterialId,
      summary: `${check.checkType} registrado con resultado ${check.result}.`,
      metadata: {
        result: check.result,
        measuredTemperature: check.measuredTemperature || null,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Control sanitario registrado en Supabase." };
}

export async function persistEmployeeProfile(
  employee: EmployeeDraft & { id: string },
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const { error } = await getSupabaseBrowserClient().from("employees").upsert({
    id: employee.id,
    role_id: employee.role,
    full_name: employee.name,
    rut: employee.rut || null,
    phone: employee.phone || null,
    shift: employee.shift || "Sin turno",
    hourly_cost: employee.hourlyCost,
    status: employee.status,
    hired_at: employee.hiredAt || null,
  });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog({
    action: "employee.upsert",
    entityType: "employee",
    entityId: employee.id,
    summary: `Trabajador ${employee.name} guardado.`,
    metadata: {
      role: employee.role,
      shift: employee.shift,
      status: employee.status,
      hourlyCost: employee.hourlyCost,
    },
  });

  return { ok: true, message: "Trabajador guardado en Supabase." };
}

export async function persistCustomerProfile(
  customer: CustomerDraft & { id: string },
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const { error } = await getSupabaseBrowserClient().from("customers").upsert({
    id: customer.id,
    full_name: customer.name,
    phone: customer.phone || null,
    email: customer.email || null,
    document_id: customer.documentId || null,
    preferences: customer.preferences,
    allergies: customer.allergies,
    tags: customer.tags,
    notes: customer.notes,
  });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "customer.upsert",
      entityType: "customer",
      entityId: customer.id,
      summary: `Ficha de cliente ${customer.name} guardada.`,
      metadata: {
        phone: customer.phone || null,
        tags: customer.tags,
        allergies: customer.allergies,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Cliente guardado en Supabase." };
}

export async function persistReservation(
  reservation: ReservationDraft & { id: string },
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const supabase = getSupabaseBrowserClient();
  const responsibleId = await getCurrentEmployeeId();
  const { error } = await supabase.from("reservations").upsert({
    id: reservation.id,
    customer_id: reservation.customerId || null,
    table_id: reservation.tableId || null,
    party_size: reservation.partySize,
    reservation_date: reservation.date,
    reservation_time: reservation.time,
    status: reservation.status,
    channel: reservation.channel,
    occasion: reservation.occasion,
    notes: reservation.notes,
    assigned_to: reservation.assignedTo || responsibleId,
    created_by: responsibleId,
  });

  if (error) {
    return writeError(error.message);
  }

  if (
    reservation.tableId &&
    ["pending", "confirmed"].includes(reservation.status)
  ) {
    await supabase
      .from("tables")
      .update({ status: "reserved" })
      .eq("id", reservation.tableId);
  }

  await recordAuditLog(
    {
      action: "reservation.upsert",
      entityType: "reservation",
      entityId: reservation.id,
      summary: `Reserva ${reservation.date} ${reservation.time} guardada.`,
      metadata: {
        customerId: reservation.customerId,
        tableId: reservation.tableId ?? null,
        partySize: reservation.partySize,
        status: reservation.status,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Reserva guardada en Supabase." };
}

export async function persistCustomerInteraction(
  interaction: CustomerInteractionDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const completedAt = interaction.completed ? new Date().toISOString() : null;
  const { error } = await getSupabaseBrowserClient()
    .from("customer_interactions")
    .insert({
      customer_id: interaction.customerId,
      interaction_type: interaction.type,
      summary: interaction.summary,
      due_at: interaction.dueAt || null,
      completed_at: completedAt,
      responsible_id: responsibleId,
    });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "crm.interaction.create",
      entityType: "customer",
      entityId: interaction.customerId,
      summary: `Interaccion CRM registrada: ${interaction.type}.`,
      metadata: {
        type: interaction.type,
        dueAt: interaction.dueAt || null,
        completed: interaction.completed,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Interaccion CRM registrada en Supabase." };
}

export async function persistOperationalDocument(
  document: OperationalDocumentDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const { data, error } = await getSupabaseBrowserClient()
    .from("operational_documents")
    .insert({
      document_type: document.type,
      title: document.title.trim() || "Documento operativo",
      order_id: document.orderId ?? null,
      cash_register_id: document.cashRegisterId ?? null,
      reservation_id: document.reservationId ?? null,
      payload: document.payload,
      printed_by: responsibleId,
    })
    .select("id")
    .single();

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "document.print",
      entityType: "operational_document",
      entityId: typeof data?.id === "string" ? data.id : undefined,
      summary: `Documento ${document.title} registrado para impresion.`,
      metadata: {
        type: document.type,
        orderId: document.orderId ?? null,
        cashRegisterId: document.cashRegisterId ?? null,
        reservationId: document.reservationId ?? null,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Documento operativo registrado en Supabase." };
}

export async function persistRestaurantSettings(
  settings: RestaurantSettingsDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const { error } = await getSupabaseBrowserClient().from("settings").upsert({
    key: "restaurant_profile",
    value: settings,
    updated_by: responsibleId,
  });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "settings.upsert",
      entityType: "settings",
      entityId: "restaurant_profile",
      summary: `Configuracion de ${settings.restaurantName} actualizada.`,
      metadata: {
        logoUrl: settings.logoUrl,
        serviceChargePercent: settings.serviceChargePercent,
        taxPercent: settings.taxPercent,
        printStations: settings.printStations.length,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Configuracion guardada en Supabase." };
}

export async function persistPurchaseReception(
  purchase: PurchaseReceptionDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const { data: purchaseId, error } = await getSupabaseBrowserClient().rpc(
    "receive_purchase_inventory",
    {
      supplier_id_input: purchase.supplierId,
      document_type_input: purchase.documentType,
      document_number_input: purchase.documentNumber,
      raw_material_id_input: purchase.rawMaterialId,
      description_input: purchase.description,
      quantity_input: purchase.quantity,
      unit_input: purchase.unit,
      unit_cost_input: purchase.unitCost,
      yield_percent_input: purchase.yieldPercent,
      expiration_date_input: purchase.expirationDate || null,
      lot_input: purchase.lot || null,
      responsible_employee_id: responsibleId,
    },
  );

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "purchase.receive",
      entityType: "purchase",
      entityId: typeof purchaseId === "string" ? purchaseId : undefined,
      summary: `Compra ${purchase.documentNumber} recepcionada.`,
      metadata: {
        supplierId: purchase.supplierId,
        rawMaterialId: purchase.rawMaterialId,
        quantity: purchase.quantity,
        unitCost: purchase.unitCost,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Compra recibida e inventario actualizado." };
}

export async function persistTechnicalRecipe(
  recipe: TechnicalRecipeDraft,
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const responsibleId = await getCurrentEmployeeId();
  const { data: recipeId, error } = await getSupabaseBrowserClient().rpc(
    "upsert_technical_recipe",
    {
      recipe_id_input: recipe.id ?? null,
      name_input: recipe.name,
      category_input: recipe.category,
      portions_input: recipe.portions,
      prep_time_minutes_input: recipe.prepTimeMinutes,
      photo_url_input: recipe.photoUrl || null,
      procedure_input: recipe.procedure,
      allergens_input: recipe.allergens,
      observations_input: recipe.observations,
      target_food_cost_percent_input: recipe.targetFoodCostPercent,
      reference_sale_price_input: recipe.salePrice,
      ingredients_input: recipe.ingredients,
      responsible_employee_id: responsibleId,
    },
  );

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog(
    {
      action: "recipe.upsert",
      entityType: "recipe",
      entityId: typeof recipeId === "string" ? recipeId : recipe.id,
      summary: `Receta tecnica ${recipe.name} guardada.`,
      metadata: {
        portions: recipe.portions,
        ingredients: recipe.ingredients.length,
        targetFoodCostPercent: recipe.targetFoodCostPercent,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Receta tecnica guardada en Supabase." };
}

export async function persistProductCatalogItem(
  product: ProductCatalogDraft & { id: string },
): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const { error } = await getSupabaseBrowserClient().from("products").upsert({
    id: product.id,
    category_id: product.categoryId || null,
    recipe_id: product.recipeId || null,
    name: product.name,
    description: product.description,
    image_url: product.imageUrl || null,
    sale_price: product.salePrice,
    is_available: product.isAvailable,
    prep_time_minutes: product.prepTimeMinutes,
    customization_options: product.customizationOptions,
  });

  if (error) {
    return writeError(error.message);
  }

  await recordAuditLog({
    action: "product.upsert",
    entityType: "product",
    entityId: product.id,
    summary: `Producto ${product.name} guardado en carta.`,
    metadata: {
      categoryId: product.categoryId,
      recipeId: product.recipeId ?? null,
      salePrice: product.salePrice,
      isAvailable: product.isAvailable,
    },
  });

  return { ok: true, message: "Producto de carta guardado en Supabase." };
}

export async function persistCashRegisterClose({
  registerId,
  expectedAmount,
  countedAmount,
}: {
  registerId: string;
  expectedAmount: number;
  countedAmount: number;
}): Promise<OperationResult> {
  if (!isSupabaseConfigured()) {
    return demoOnlyResult();
  }

  const supabase = getSupabaseBrowserClient();
  const responsibleId = await getCurrentEmployeeId();
  const differenceAmount = countedAmount - expectedAmount;
  const { error } = await supabase
    .from("cash_registers")
    .update({
      closed_by: responsibleId,
      counted_amount: countedAmount,
      difference_amount: differenceAmount,
      closed_at: new Date().toISOString(),
      status: "closed",
    })
    .eq("id", registerId);

  if (error) {
    return writeError(error.message);
  }

  if (differenceAmount !== 0) {
    await supabase.from("cash_movements").insert({
      cash_register_id: registerId,
      movement_type: "difference",
      payment_method: null,
      amount: differenceAmount,
      description: "Diferencia al cierre",
      responsible_id: responsibleId,
    });
  }

  await recordAuditLog(
    {
      action: "cash.register.close",
      entityType: "cash_register",
      entityId: registerId,
      summary: `Caja cerrada con diferencia ${differenceAmount}.`,
      metadata: {
        expectedAmount,
        countedAmount,
        differenceAmount,
      },
    },
    responsibleId,
  );

  return { ok: true, message: "Caja cerrada y diferencia registrada." };
}

async function getCurrentEmployeeId(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  return data?.id ?? null;
}

async function getOpenCashRegister(): Promise<{
  id: string;
  expected_amount: number | string | null;
} | null> {
  const { data } = await getSupabaseBrowserClient()
    .from("cash_registers")
    .select("id,expected_amount")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function updateCashRegisterExpected(
  registerId: string,
  deltaAmount: number,
) {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("cash_registers")
    .select("expected_amount")
    .eq("id", registerId)
    .maybeSingle();

  const current = Number(data?.expected_amount ?? 0);
  await supabase
    .from("cash_registers")
    .update({ expected_amount: current + deltaAmount })
    .eq("id", registerId);
}

async function recordAuditLog(
  entry: AuditLogDraft,
  responsibleEmployeeId?: string | null,
) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await getSupabaseBrowserClient().rpc("record_audit_log", {
      action_input: entry.action,
      entity_type_input: entry.entityType,
      entity_id_input: entry.entityId ?? null,
      summary_input: entry.summary,
      metadata_input: entry.metadata ?? {},
      responsible_employee_id: responsibleEmployeeId ?? null,
    });
  } catch {
    // Audit logging must not block the operational transaction result.
  }
}

function normalizeCashMovementAmount(
  type: CashMovementDraft["type"],
  amount: number,
) {
  if (type === "withdrawal" || type === "advance") {
    return -Math.abs(amount);
  }

  return amount;
}

function normalizeInventoryMovementQuantity(
  type: InventoryMovementDraft["type"],
  quantity: number,
) {
  if (type === "manual_out" || type === "waste") {
    return -Math.abs(quantity);
  }

  return quantity;
}

function calculateInventoryUnitCost(material: {
  purchase_quantity: number | string | null;
  purchase_cost: number | string | null;
  average_yield_percent: number | string | null;
}) {
  const purchaseQuantity = Number(material.purchase_quantity ?? 0);
  const purchaseCost = Number(material.purchase_cost ?? 0);
  const averageYieldPercent = Number(material.average_yield_percent ?? 100);
  const usableQuantity = purchaseQuantity * (averageYieldPercent / 100);

  if (!Number.isFinite(usableQuantity) || usableQuantity <= 0) {
    return 0;
  }

  return purchaseCost / usableQuantity;
}

function demoOnlyResult(): OperationResult {
  return {
    ok: true,
    message: "Accion aplicada en demo local.",
  };
}

function writeError(message: string): OperationResult {
  return {
    ok: false,
    message: `No se pudo guardar en Supabase: ${message}`,
  };
}

function toRoleId(value?: string): RoleId {
  return value === "master" ||
    value === "supervisor" ||
    value === "cashier" ||
    value === "waiter" ||
    value === "cook" ||
    value === "chef" ||
    value === "warehouse"
    ? value
    : "administrator";
}
