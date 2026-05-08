import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Order, OrderStatus, Product, RoleId, TableStatus } from "@/lib/types";

export interface OperationResult {
  ok: boolean;
  message: string;
}

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: RoleId;
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

  return error
    ? writeError(error.message)
    : { ok: true, message: "Estado de mesa guardado en Supabase." };
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
      status: status === "delivered" ? "delivered" : status,
      paid_at: status === "delivered" ? new Date().toISOString() : null,
    })
    .eq("id", orderId);

  if (orderError) {
    return writeError(orderError.message);
  }

  await supabase.from("order_items").update({ status }).eq("order_id", orderId);

  if (status === "delivered" && tableId) {
    const { error: tableError } = await supabase
      .from("tables")
      .update({ status: "cleaning", current_order_id: null })
      .eq("id", tableId);

    if (tableError) {
      return writeError(tableError.message);
    }
  }

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
      status: order.status === "delivered" ? "pending" : order.status,
    })
    .eq("id", order.id);

  return orderError
    ? writeError(orderError.message)
    : { ok: true, message: "Producto agregado y guardado en Supabase." };
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

  return error
    ? writeError(error.message)
    : { ok: true, message: "Comanda enviada y registrada en Supabase." };
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
  return value === "supervisor" ||
    value === "cashier" ||
    value === "waiter" ||
    value === "cook" ||
    value === "chef" ||
    value === "warehouse"
    ? value
    : "administrator";
}
