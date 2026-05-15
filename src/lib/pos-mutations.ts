import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  DetallePedido,
  EstadoSimulacion,
  EstadoComanda,
  EstadoMesa,
  FeedbackCierreServicio,
  Mesa,
  Pedido,
} from "./academic-types";
import type { ResultadoMutacion } from "./academic-mutations";
import { registrarTrazabilidad } from "./trazabilidad-mutations";
import { descontarStockPorReceta } from "./warehouse-mutations";
import { obtenerSimulacion } from "./simulation-mutations";
import {
  loadRestaurantSnapshot,
  type RestaurantSnapshot,
} from "./data-source";
import {
  persistCashPayment,
  persistCashRegisterOpen,
  persistOperationalDocument,
} from "./operations";
import type { PaymentMethod } from "./types";

/* ───── Estado local demo ───── */

const localMesas: Mesa[] = [
  { id_mesa: "m1", numero_mesa: 1, capacidad: 4, estado: "libre" },
  { id_mesa: "m2", numero_mesa: 2, capacidad: 2, estado: "libre" },
  { id_mesa: "m3", numero_mesa: 3, capacidad: 6, estado: "libre" },
  { id_mesa: "m4", numero_mesa: 4, capacidad: 4, estado: "libre" },
];

const localPedidos: Pedido[] = [];
const localDetalles: DetallePedido[] = [];
let localIdCounter = 1000;

function nextId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${localIdCounter}`;
}

function toAcademicTableStatus(status: string): EstadoMesa {
  if (status === "occupied" || status === "reserved") return "ocupada";
  if (status === "cleaning") return "sucia";
  return "libre";
}

function toDbTableStatus(status: EstadoMesa): "free" | "occupied" | "cleaning" {
  if (status === "ocupada") return "occupied";
  if (status === "sucia") return "cleaning";
  return "free";
}

function toAcademicItemStatus(status: string): EstadoComanda {
  if (status === "preparing") return "preparando";
  if (status === "ready") return "listo";
  if (status === "delivered" || status === "paid") return "entregado";
  return "pendiente";
}

function toDbItemStatus(status: EstadoComanda): "pending" | "preparing" | "ready" | "delivered" {
  if (status === "preparando") return "preparing";
  if (status === "listo") return "ready";
  if (status === "entregado") return "delivered";
  return "pending";
}

function buildOrderStatusFromItems(statuses: string[]): "pending" | "preparing" | "ready" | "delivered" {
  if (statuses.length > 0 && statuses.every((status) => status === "delivered")) {
    return "delivered";
  }
  if (statuses.some((status) => status === "preparing")) return "preparing";
  if (statuses.some((status) => status === "ready")) return "ready";
  return "pending";
}

function tieneComandasSinEntregar(
  statuses: Array<string | EstadoComanda>,
): boolean {
  return statuses.some((status) =>
    status === "pending" ||
    status === "preparing" ||
    status === "ready" ||
    status === "pendiente" ||
    status === "preparando" ||
    status === "listo",
  );
}

function safeSimulationId(id_simulacion: string): string | null {
  const trimmed = id_simulacion.trim();
  return trimmed.length ? trimmed : null;
}

function isValidFeedback(feedback: FeedbackCierreServicio): boolean {
  const scores = [
    feedback.puntuacion_atencion,
    feedback.puntuacion_sabor,
    feedback.puntuacion_presentacion,
    feedback.puntuacion_tiempo,
    feedback.puntuacion_limpieza,
    feedback.puntuacion_experiencia,
  ];
  return scores.every((score) => Number.isFinite(score) && score >= 1 && score <= 5);
}

async function validarSimulacionOperativa(
  idSimulacion: string,
  permitidos: EstadoSimulacion[] = ["servicio_activo"],
): Promise<string | null> {
  const sim = await obtenerSimulacion(idSimulacion);
  if (!sim) return "Simulación no encontrada.";
  if (!permitidos.includes(sim.estado)) {
    return `La simulación está en ${sim.estado}. Debe estar en ${permitidos.join(" o ")} para esta acción.`;
  }
  return null;
}

/* ───── Mesas ───── */

export async function listarMesas(): Promise<Mesa[]> {
  if (!isSupabaseConfigured()) {
    return [...localMesas];
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("tables")
    .select("id,number,seats,status")
    .order("number");

  if (error || !data) {
    return [...localMesas];
  }

  return data.map((mesa) => ({
    id_mesa: mesa.id,
    numero_mesa: mesa.number,
    capacidad: mesa.seats ?? 2,
    estado: toAcademicTableStatus(mesa.status),
  }));
}

export async function actualizarEstadoMesa(
  id_mesa: string,
  estado: EstadoMesa,
): Promise<ResultadoMutacion> {
  if (!isSupabaseConfigured()) {
    const mesa = localMesas.find((m) => m.id_mesa === id_mesa);
    if (!mesa) return { ok: false, mensaje: "Mesa no encontrada" };

    const estadoAnterior = mesa.estado;
    mesa.estado = estado;

    await registrarTrazabilidad({
      id_usuario: "garzon-1",
      modulo: "salon",
      accion: "cambio_estado_mesa",
      valor_anterior: estadoAnterior,
      valor_nuevo: estado,
      observacion: `Mesa ${mesa.numero_mesa}`,
    });

    return { ok: true, mensaje: "Mesa actualizada" };
  }

  const { error } = await getSupabaseBrowserClient()
    .from("tables")
    .update({ status: toDbTableStatus(estado) })
    .eq("id", id_mesa);

  if (error) return { ok: false, mensaje: error.message };

  await registrarTrazabilidad({
    id_usuario: "garzon-supabase",
    modulo: "salon",
    accion: "cambio_estado_mesa",
    valor_nuevo: estado,
    observacion: `Mesa ${id_mesa}`,
  });

  return { ok: true, mensaje: "Mesa actualizada" };
}

/* ───── Pedidos (Ventas) ───── */

export interface NuevoPedidoDraft {
  id_simulacion: string;
  id_mesa: string;
  items: Array<{
    id_producto: string;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    area_destino: "cocina" | "bar";
    notas?: string;
  }>;
}

export async function crearPedido(draft: NuevoPedidoDraft): Promise<ResultadoMutacion> {
  if (!draft.id_mesa) return { ok: false, mensaje: "Mesa no seleccionada" };
  if (!draft.items.length) return { ok: false, mensaje: "El pedido no tiene productos." };

  const simulationId = safeSimulationId(draft.id_simulacion);
  if (!simulationId) return { ok: false, mensaje: "Simulación inválida." };
  const validacionFlujo = await validarSimulacionOperativa(simulationId, ["servicio_activo"]);
  if (validacionFlujo) return { ok: false, mensaje: validacionFlujo };

  if (!isSupabaseConfigured()) {
    const pedidoActivoMesa = localPedidos.find(
      (pedido) =>
        pedido.id_mesa === draft.id_mesa &&
        pedido.id_simulacion === simulationId &&
        pedido.estado === "abierto",
    );
    if (pedidoActivoMesa) {
      return {
        ok: false,
        mensaje: "La mesa ya tiene un pedido activo en esta simulación.",
      };
    }

    const id_pedido = nextId("ped");
    const total = draft.items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);

    const nuevoPedido: Pedido = {
      id_pedido,
      id_simulacion: simulationId,
      id_mesa: draft.id_mesa,
      estado: "abierto",
      total_neto: total,
      total_iva: total * 0.19,
      total_final: total * 1.19,
      fecha_creacion: new Date().toISOString(),
    };

    localPedidos.push(nuevoPedido);

    draft.items.forEach((item, idx) => {
      localDetalles.push({
        id_detalle: `${id_pedido}-d-${idx}`,
        id_pedido,
        id_producto: item.id_producto,
        nombre_producto: item.nombre_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        estado: "pendiente",
        area_destino: item.area_destino,
        notas: item.notas,
      });
    });

    const mesa = localMesas.find((m) => m.id_mesa === draft.id_mesa);
    if (mesa) mesa.estado = "ocupada";

    await registrarTrazabilidad({
      id_usuario: "garzon-1",
      id_simulacion: simulationId,
      modulo: "pos",
      accion: "crear_pedido",
      valor_nuevo: id_pedido,
      observacion: `Mesa ${mesa?.numero_mesa || "?"}`,
    });

    return { ok: true, mensaje: "Pedido creado correctamente", id: id_pedido };
  }

  const supabase = getSupabaseBrowserClient();
  const subtotal = draft.items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0,
  );
  const orderNumber = `S-${Date.now().toString().slice(-6)}`;

  const { data: productRows } = await supabase
    .from("products")
    .select("id,recipe_id");

  const mappedProductIds = new Map<string, string>();
  (productRows ?? []).forEach((row) => {
    if (row.id) mappedProductIds.set(row.id, row.id);
    if (row.recipe_id) mappedProductIds.set(row.recipe_id, row.id);
  });

  const { data: orderInsert, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      table_id: draft.id_mesa,
      status: "pending",
      subtotal,
      discount_amount: 0,
      tip_amount: 0,
      total_amount: subtotal,
      id_simulacion: simulationId,
    })
    .select("id")
    .single();

  if (orderError || !orderInsert?.id) {
    return { ok: false, mensaje: orderError?.message ?? "No se pudo crear el pedido." };
  }

  const { count: activeCount, error: activeOrderError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("table_id", draft.id_mesa)
    .eq("id_simulacion", simulationId)
    .neq("id", orderInsert.id)
    .in("status", ["pending", "preparing", "ready", "delivered"]);

  if (!activeOrderError && (activeCount ?? 0) > 0) {
    await supabase.from("orders").delete().eq("id", orderInsert.id);
    return {
      ok: false,
      mensaje: "La mesa ya tiene un pedido activo en esta simulación.",
    };
  }

  const orderId = orderInsert.id;
  const detailRows = draft.items.map((item) => ({
    order_id: orderId,
    product_id: mappedProductIds.get(item.id_producto) ?? null,
    product_name: item.nombre_producto,
    quantity: item.cantidad,
    unit_price: item.precio_unitario,
    modifiers: "[]",
    observations: item.notas ?? "",
    station: item.area_destino === "bar" ? "bar" : "hot",
    status: "pending",
    id_simulacion: simulationId,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(detailRows);
  if (itemsError) return { ok: false, mensaje: itemsError.message };

  await supabase
    .from("tables")
    .update({ status: "occupied", current_order_id: orderId })
    .eq("id", draft.id_mesa);

  await registrarTrazabilidad({
    id_usuario: "garzon-supabase",
    id_simulacion: simulationId,
    modulo: "pos",
    accion: "crear_pedido",
    valor_nuevo: orderId,
    observacion: `Pedido ${orderNumber}`,
  });

  return { ok: true, mensaje: "Pedido creado correctamente", id: orderId };
}

export async function obtenerPedidoActivoMesa(
  id_mesa: string,
  id_simulacion: string,
): Promise<Pedido | null> {
  const simulationId = safeSimulationId(id_simulacion);
  if (!simulationId) return null;

  if (!isSupabaseConfigured()) {
    return (
      localPedidos.find(
        (p) =>
          p.id_mesa === id_mesa &&
          p.id_simulacion === simulationId &&
          p.estado === "abierto",
      ) || null
    );
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("orders")
    .select("id,id_simulacion,table_id,status,subtotal,total_amount,created_at")
    .eq("table_id", id_mesa)
    .eq("id_simulacion", simulationId)
    .in("status", ["pending", "preparing", "ready", "delivered"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const totalNeto = Number(data.total_amount ?? data.subtotal ?? 0);
  return {
    id_pedido: data.id,
    id_simulacion: data.id_simulacion ?? simulationId,
    id_mesa: data.table_id ?? id_mesa,
    estado: data.status === "cancelled" ? "cancelado" : "abierto",
    total_neto: totalNeto,
    total_iva: totalNeto * 0.19,
    total_final: totalNeto * 1.19,
    fecha_creacion: data.created_at ?? new Date().toISOString(),
  };
}

export async function listarDetallePedido(id_pedido: string): Promise<DetallePedido[]> {
  if (!isSupabaseConfigured()) {
    return localDetalles.filter((d) => d.id_pedido === id_pedido);
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("order_items")
    .select("id,order_id,product_id,product_name,quantity,unit_price,status,station,observations")
    .eq("order_id", id_pedido)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((item) => ({
    id_detalle: item.id,
    id_pedido: item.order_id,
    id_producto: item.product_id ?? "sin-producto",
    nombre_producto: item.product_name,
    cantidad: Number(item.quantity ?? 1),
    precio_unitario: Number(item.unit_price ?? 0),
    estado: toAcademicItemStatus(item.status),
    area_destino: item.station === "bar" ? "bar" : "cocina",
    notas: item.observations ?? "",
  }));
}

export async function pagarPedido(id_pedido: string): Promise<ResultadoMutacion> {
  return cerrarPedidoConFeedback({
    id_pedido,
    id_simulacion: "",
    feedback: null,
    payment_method: "debit",
  });
}

/* ───── Cierre de servicio con feedback obligatorio ───── */

export async function cerrarPedidoConFeedback(params: {
  id_pedido: string;
  id_simulacion: string;
  feedback: FeedbackCierreServicio | null;
  payment_method?: PaymentMethod;
  tip_amount?: number;
  discount_amount?: number;
}): Promise<ResultadoMutacion> {
  const { id_pedido, feedback } = params;

  if (!feedback) {
    return { ok: false, mensaje: "Debes registrar feedback del comensal para cerrar la cuenta." };
  }

  if (!isValidFeedback(feedback)) {
    return { ok: false, mensaje: "El feedback debe contener puntuaciones entre 1 y 5." };
  }

  if (!isSupabaseConfigured()) {
    const pedido = localPedidos.find((p) => p.id_pedido === id_pedido);
    if (!pedido) return { ok: false, mensaje: "Pedido no encontrado" };
    const bloqueoFlujo = await validarSimulacionOperativa(pedido.id_simulacion, [
      "servicio_activo",
      "servicio_cerrado",
    ]);
    if (bloqueoFlujo) return { ok: false, mensaje: bloqueoFlujo };

    const itemsPedido = localDetalles.filter((item) => item.id_pedido === id_pedido);
    if (tieneComandasSinEntregar(itemsPedido.map((item) => item.estado))) {
      return {
        ok: false,
        mensaje: "No puedes cerrar la cuenta: aún hay comandas sin entregar.",
      };
    }

    pedido.estado = "pagado";

    const mesa = localMesas.find((m) => m.id_mesa === pedido.id_mesa);
    if (mesa) mesa.estado = "sucia";

    await registrarTrazabilidad({
      id_usuario: "cajero-1",
      id_simulacion: pedido.id_simulacion,
      modulo: "caja",
      accion: "pagar_pedido",
      valor_nuevo: pedido.total_final,
      observacion: `Feedback ${feedback.puntuacion_experiencia}/5`,
    });

    return { ok: true, mensaje: "Pedido pagado con feedback registrado." };
  }

  const simulationId = safeSimulationId(params.id_simulacion);
  const supabase = getSupabaseBrowserClient();
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id,id_simulacion,order_number,table_id,total_amount,subtotal,status")
    .eq("id", id_pedido)
    .maybeSingle();

  if (orderError || !orderRow) {
    return { ok: false, mensaje: orderError?.message ?? "Pedido no encontrado." };
  }

  const appliedSimulationId = orderRow.id_simulacion ?? simulationId;
  if (!appliedSimulationId) {
    return { ok: false, mensaje: "El pedido no tiene simulación asociada." };
  }
  const bloqueoFlujo = await validarSimulacionOperativa(appliedSimulationId, [
    "servicio_activo",
    "servicio_cerrado",
  ]);
  if (bloqueoFlujo) return { ok: false, mensaje: bloqueoFlujo };

  if (orderRow.status === "paid") {
    return { ok: false, mensaje: "La cuenta ya está cerrada para este pedido." };
  }

  if (orderRow.status === "cancelled") {
    return { ok: false, mensaje: "No puedes cobrar un pedido cancelado." };
  }

  const { data: itemsEstado, error: itemsEstadoError } = await supabase
    .from("order_items")
    .select("status")
    .eq("order_id", id_pedido);
  if (itemsEstadoError) return { ok: false, mensaje: itemsEstadoError.message };

  if (tieneComandasSinEntregar((itemsEstado ?? []).map((item) => item.status))) {
    return {
      ok: false,
      mensaje: "No puedes cerrar la cuenta: aún hay comandas sin entregar.",
    };
  }

  const snapshot: RestaurantSnapshot = await loadRestaurantSnapshot();
  const snapshotOrder = snapshot.orders.find((order) => order.id === id_pedido);
  if (!snapshotOrder) {
    return { ok: false, mensaje: "No se pudo preparar el cierre de caja para el pedido." };
  }

  let paymentResult = await persistCashPayment({
    order: snapshotOrder,
    method: params.payment_method ?? "debit",
    tipAmount: params.tip_amount ?? 0,
    discountAmount: params.discount_amount ?? 0,
  });

  if (!paymentResult.ok && paymentResult.message.includes("No hay caja abierta")) {
    const openResult = await persistCashRegisterOpen(0);
    if (!openResult.ok) {
      return { ok: false, mensaje: openResult.message };
    }
    paymentResult = await persistCashPayment({
      order: snapshotOrder,
      method: params.payment_method ?? "debit",
      tipAmount: params.tip_amount ?? 0,
      discountAmount: params.discount_amount ?? 0,
    });
  }

  if (!paymentResult.ok) {
    return { ok: false, mensaje: paymentResult.message };
  }

  const { data: mesaData } = await supabase
    .from("tables")
    .select("number")
    .eq("id", orderRow.table_id)
    .maybeSingle();

  const mesaLabel = mesaData?.number ? String(mesaData.number) : "";
  const feedbackInsert = await supabase.from("feedback_comensal").insert({
    id_simulacion: appliedSimulationId,
    id_venta: id_pedido,
    mesa: mesaLabel,
    nombre_comensal: feedback.nombre_comensal.trim() || "Comensal",
    puntuacion_atencion: feedback.puntuacion_atencion,
    puntuacion_sabor: feedback.puntuacion_sabor,
    puntuacion_presentacion: feedback.puntuacion_presentacion,
    puntuacion_tiempo: feedback.puntuacion_tiempo,
    puntuacion_limpieza: feedback.puntuacion_limpieza,
    puntuacion_experiencia: feedback.puntuacion_experiencia,
    comentario: feedback.comentario ?? "",
  });

  if (feedbackInsert.error) {
    return { ok: false, mensaje: feedbackInsert.error.message };
  }

  const refreshedSnapshot = await loadRestaurantSnapshot();
  const openRegister = refreshedSnapshot.cashRegisters.find(
    (register) => register.status === "open",
  );

  await persistOperationalDocument({
    type: "payment_receipt",
    title: `Comprobante pago ${orderRow.order_number ?? id_pedido}`,
    orderId: id_pedido,
    cashRegisterId: openRegister?.id,
    payload: {
      orderId: id_pedido,
      orderNumber: orderRow.order_number,
      paymentMethod: params.payment_method ?? "debit",
      total: Number(orderRow.total_amount ?? orderRow.subtotal ?? 0),
      feedback: {
        atencion: feedback.puntuacion_atencion,
        sabor: feedback.puntuacion_sabor,
        presentacion: feedback.puntuacion_presentacion,
        tiempo: feedback.puntuacion_tiempo,
        limpieza: feedback.puntuacion_limpieza,
        experiencia: feedback.puntuacion_experiencia,
      },
    },
  });

  await registrarTrazabilidad({
    id_usuario: "cajero-supabase",
    id_simulacion: appliedSimulationId,
    modulo: "servicio_360",
    accion: "cerrar_pedido_con_feedback",
    valor_nuevo: { id_pedido, payment_method: params.payment_method ?? "debit" },
    observacion: `Feedback registrado para ${orderRow.order_number ?? id_pedido}.`,
  });

  return { ok: true, mensaje: "Cuenta cerrada con feedback, documento y trazabilidad." };
}

/* ───── KDS (Pantalla de Cocina) ───── */

export async function listarComandasActivas(
  id_simulacion: string,
  area: "cocina" | "bar",
): Promise<(DetallePedido & { numero_mesa: number })[]> {
  const simulationId = safeSimulationId(id_simulacion);
  if (!simulationId) return [];

  if (!isSupabaseConfigured()) {
    const activas: (DetallePedido & { numero_mesa: number })[] = [];

    for (const det of localDetalles) {
      if (det.area_destino !== area || det.estado === "entregado") continue;

      const ped = localPedidos.find(
        (p) => p.id_pedido === det.id_pedido && p.id_simulacion === simulationId,
      );
      if (!ped) continue;

      const mesa = localMesas.find((m) => m.id_mesa === ped.id_mesa);
      activas.push({ ...det, numero_mesa: mesa?.numero_mesa || 0 });
    }

    return activas;
  }

  const supabase = getSupabaseBrowserClient();
  const { data: rows, error } = await supabase
    .from("order_items")
    .select("id,order_id,product_id,product_name,quantity,unit_price,status,station,observations")
    .eq("id_simulacion", simulationId)
    .in("status", ["pending", "preparing", "ready"]);

  if (error || !rows?.length) return [];

  const filteredRows = rows.filter((row) =>
    area === "bar" ? row.station === "bar" : row.station !== "bar",
  );
  if (!filteredRows.length) return [];

  const orderIds = [...new Set(filteredRows.map((row) => row.order_id))];
  const { data: orders } = await supabase
    .from("orders")
    .select("id,table_id")
    .in("id", orderIds)
    .eq("id_simulacion", simulationId);

  const tableIds = [...new Set((orders ?? []).map((order) => order.table_id).filter(Boolean))];
  const { data: tables } = tableIds.length
    ? await supabase.from("tables").select("id,number").in("id", tableIds)
    : { data: [] as Array<{ id: string; number: number }> };

  const tableById = new Map((tables ?? []).map((table) => [table.id, table.number]));
  const orderById = new Map((orders ?? []).map((order) => [order.id, order.table_id]));

  return filteredRows.map((item) => ({
    id_detalle: item.id,
    id_pedido: item.order_id,
    id_producto: item.product_id ?? "sin-producto",
    nombre_producto: item.product_name,
    cantidad: Number(item.quantity ?? 1),
    precio_unitario: Number(item.unit_price ?? 0),
    estado: toAcademicItemStatus(item.status),
    area_destino: item.station === "bar" ? "bar" : "cocina",
    notas: item.observations ?? "",
    numero_mesa: Number(tableById.get(orderById.get(item.order_id) ?? "") ?? 0),
  }));
}

export async function actualizarEstadoComanda(
  id_detalle: string,
  nuevoEstado: EstadoComanda,
): Promise<ResultadoMutacion> {
  if (!isSupabaseConfigured()) {
    const det = localDetalles.find((d) => d.id_detalle === id_detalle);
    if (!det) return { ok: false, mensaje: "Item no encontrado" };
    const pedido = localPedidos.find((p) => p.id_pedido === det.id_pedido);
    if (!pedido) return { ok: false, mensaje: "Pedido asociado no encontrado." };

    const bloqueoFlujo = await validarSimulacionOperativa(pedido.id_simulacion, [
      "servicio_activo",
    ]);
    if (bloqueoFlujo) return { ok: false, mensaje: bloqueoFlujo };

    const anterior = det.estado;
    det.estado = nuevoEstado;

    if (nuevoEstado === "preparando" && anterior === "pendiente") {
      await descontarStockPorReceta(
        pedido.id_simulacion,
        det.id_producto,
        det.cantidad,
      );
    }

    await registrarTrazabilidad({
      id_usuario: "cocina-1",
      modulo: "kds",
      accion: "cambio_estado_plato",
      valor_anterior: anterior,
      valor_nuevo: nuevoEstado,
      observacion: `${det.nombre_producto} (ID: ${det.id_producto})`,
    });

    return { ok: true, mensaje: "Estado actualizado y stock procesado" };
  }

  const supabase = getSupabaseBrowserClient();
  const dbStatus = toDbItemStatus(nuevoEstado);
  const { data: row, error: rowError } = await supabase
    .from("order_items")
    .select("id,order_id,status,id_simulacion")
    .eq("id", id_detalle)
    .maybeSingle();

  if (rowError || !row) return { ok: false, mensaje: rowError?.message ?? "Item no encontrado." };

  let simulationId = row.id_simulacion ?? null;
  if (!simulationId) {
    const { data: orderSim } = await supabase
      .from("orders")
      .select("id_simulacion")
      .eq("id", row.order_id)
      .maybeSingle();
    simulationId = orderSim?.id_simulacion ?? null;
  }
  if (!simulationId) {
    return { ok: false, mensaje: "El pedido no está asociado a una simulación." };
  }

  const bloqueoFlujo = await validarSimulacionOperativa(simulationId, ["servicio_activo"]);
  if (bloqueoFlujo) return { ok: false, mensaje: bloqueoFlujo };

  const { error: updateError } = await supabase
    .from("order_items")
    .update({ status: dbStatus })
    .eq("id", id_detalle);

  if (updateError) return { ok: false, mensaje: updateError.message };

  const { data: itemRows } = await supabase
    .from("order_items")
    .select("status")
    .eq("order_id", row.order_id);
  const orderStatus = buildOrderStatusFromItems(
    (itemRows ?? []).map((item) => item.status),
  );
  await supabase
    .from("orders")
    .update({ status: orderStatus })
    .eq("id", row.order_id);

  await registrarTrazabilidad({
    id_usuario: "kds-supabase",
    id_simulacion: simulationId,
    modulo: "kds",
    accion: "cambio_estado_plato",
    valor_anterior: row.status,
    valor_nuevo: dbStatus,
    observacion: `Item ${id_detalle} actualizado`,
  });

  return { ok: true, mensaje: "Estado de comanda actualizado." };
}

export async function obtenerPedidosLocales(): Promise<Pedido[]> {
  return [...localPedidos];
}

export async function obtenerDetallesLocales(): Promise<DetallePedido[]> {
  return [...localDetalles];
}
