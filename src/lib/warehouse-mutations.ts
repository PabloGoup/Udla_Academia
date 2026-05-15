import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  demoProductosBodega,
  demoRecetas,
  demoIngredientesReceta,
} from "./demo-data-warehouse";
import type { 
  ProductoBodega, 
  Receta, 
  MovimientoBodega,
  IngredienteReceta,
} from "./academic-types";
import type { ResultadoMutacion } from "./academic-mutations";
import { registrarTrazabilidad } from "./trazabilidad-mutations";

/* ───── Estado local demo ───── */

const localProductosBodega = [...demoProductosBodega];
const localRecetas = [...demoRecetas];
const localIngredientes = [...demoIngredientesReceta];
let localIdCounter = 400;

function nextId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${localIdCounter}`;
}

/* ───────────────── Gestión de Bodega ───────────────── */

export async function listarProductosBodega(): Promise<ProductoBodega[]> {
  if (!isSupabaseConfigured()) {
    return [...localProductosBodega];
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("raw_materials")
    .select("id,name,category,unit,stock_quantity,min_stock_quantity,purchase_cost,purchase_quantity,storage_temperature")
    .order("name");

  if (error || !data) return [...localProductosBodega];

  return data.map((row) => {
    const purchaseQty = Number(row.purchase_quantity ?? 1);
    const purchaseCost = Number(row.purchase_cost ?? 0);
    return {
      id_producto: row.id,
      nombre_producto: row.name,
      categoria: row.category,
      unidad_medida: row.unit,
      stock_actual: Number(row.stock_quantity ?? 0),
      stock_minimo: Number(row.min_stock_quantity ?? 0),
      costo_unitario: purchaseQty > 0 ? purchaseCost / purchaseQty : purchaseCost,
      ubicacion:
        row.storage_temperature?.includes("-18")
          ? "congelado"
          : row.storage_temperature?.includes("0 a 4") || row.storage_temperature?.includes("0 a 2")
            ? "refrigerado"
            : "seco",
      estado: "activo",
    } as ProductoBodega;
  });
}

export async function crearProductoBodega(draft: Partial<ProductoBodega>): Promise<ResultadoMutacion> {
  if (!draft.nombre_producto?.trim()) return { ok: false, mensaje: "Nombre obligatorio" };
  if (!draft.categoria) return { ok: false, mensaje: "Categoría obligatoria" };

  if (!isSupabaseConfigured()) {
    const id = nextId("prod");
    localProductosBodega.push({
      id_producto: id,
      nombre_producto: draft.nombre_producto.trim(),
      categoria: draft.categoria,
      unidad_medida: draft.unidad_medida ?? "un",
      stock_actual: draft.stock_actual ?? 0,
      stock_minimo: draft.stock_minimo ?? 0,
      costo_unitario: draft.costo_unitario ?? 0,
      ubicacion: draft.ubicacion ?? "seco",
      temperatura: draft.temperatura,
      estado: "activo",
    });
    return { ok: true, mensaje: "Producto creado en bodega (demo).", id };
  }

  const stock = Number(draft.stock_actual ?? 0);
  const unitCost = Number(draft.costo_unitario ?? 0);
  const quantity = Math.max(1, stock || 1);
  const totalCost = quantity * Math.max(0, unitCost);

  const { error } = await getSupabaseBrowserClient().from("raw_materials").insert({
    name: draft.nombre_producto.trim(),
    category: draft.categoria,
    unit: draft.unidad_medida ?? "g",
    purchase_quantity: quantity,
    purchase_cost: totalCost,
    stock_quantity: stock,
    min_stock_quantity: Number(draft.stock_minimo ?? 0),
    average_yield_percent: 100,
    storage_temperature:
      draft.ubicacion === "congelado"
        ? "-18 C"
        : draft.ubicacion === "refrigerado"
          ? "0 a 4 C"
          : "Ambiente seco",
    storage_method: "FIFO",
    sanitary_risk: "low",
    storage_notes: "Alta desde módulo académico de bodega",
  });

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true, mensaje: "Producto creado." };
}

/* ───────────────── Gestión de Recetas ───────────────── */

export async function listarRecetas(): Promise<Receta[]> {
  if (!isSupabaseConfigured()) {
    return [...localRecetas];
  }
  return [...localRecetas];
}

export async function obtenerIngredientesReceta(id_receta: string): Promise<IngredienteReceta[]> {
  if (!isSupabaseConfigured()) {
    return localIngredientes.filter(i => i.id_receta === id_receta);
  }
  return [];
}

/* ───────────────── Movimientos de Bodega ───────────────── */

export async function registrarMovimientoBodega(mov: Partial<MovimientoBodega>): Promise<ResultadoMutacion> {
  if (!mov.id_producto || !mov.cantidad || !mov.tipo_movimiento) {
    return { ok: false, mensaje: "Datos de movimiento incompletos" };
  }

  if (!isSupabaseConfigured()) {
    const prod = localProductosBodega.find(p => p.id_producto === mov.id_producto);
    if (!prod) return { ok: false, mensaje: "Producto no encontrado" };

    if (mov.tipo_movimiento === "ingreso") {
      prod.stock_actual += mov.cantidad;
    } else {
      prod.stock_actual -= mov.cantidad;
    }

    await registrarTrazabilidad({
      id_usuario: mov.usuario_responsable || "sistema",
      modulo: "bodega",
      accion: `movimiento_${mov.tipo_movimiento}`,
      valor_anterior: prod.stock_actual + (mov.tipo_movimiento === "ingreso" ? -mov.cantidad : mov.cantidad),
      valor_nuevo: prod.stock_actual,
      observacion: mov.motivo,
    });

    return { ok: true, mensaje: "Movimiento registrado (demo)" };
  }

  const qty = Number(mov.cantidad ?? 0);
  const typeMap: Record<string, "manual_out" | "adjustment" | "waste"> = {
    ingreso: "adjustment",
    egreso: "manual_out",
    merma: "waste",
    ajuste: "adjustment",
  };
  const movementType = typeMap[mov.tipo_movimiento ?? "ajuste"] ?? "adjustment";
  const signedQty = movementType === "manual_out" || movementType === "waste" ? -Math.abs(qty) : Math.abs(qty);

  const { error: insertError } = await getSupabaseBrowserClient().from("inventory_movements").insert({
    raw_material_id: mov.id_producto,
    movement_type: movementType,
    quantity: signedQty,
    unit_cost: 0,
    reason: mov.motivo ?? "Movimiento académico",
  });
  if (insertError) return { ok: false, mensaje: insertError.message };

  const { data: current, error: currentError } = await getSupabaseBrowserClient()
    .from("raw_materials")
    .select("stock_quantity")
    .eq("id", mov.id_producto)
    .maybeSingle();
  if (!currentError && current) {
    const nextStock = Math.max(0, Number(current.stock_quantity ?? 0) + signedQty);
    await getSupabaseBrowserClient()
      .from("raw_materials")
      .update({ stock_quantity: nextStock })
      .eq("id", mov.id_producto);
  }

  return { ok: true, mensaje: "Movimiento registrado" };
}

/* ───── Bodega de Simulación (Carga de stock / Menú) ───── */

export interface ProductoSimulacion {
  id_simulacion_producto: string;
  id_simulacion: string;
  id_producto: string;
  cantidad_asignada: number;
  cantidad_utilizada: number;
}

const localProductosSimulacion: ProductoSimulacion[] = [];

export async function listarProductosSimulacion(id_simulacion: string): Promise<ProductoSimulacion[]> {
  if (!isSupabaseConfigured()) {
    return localProductosSimulacion.filter((p) => p.id_simulacion === id_simulacion);
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("simulacion_productos")
    .select("id_simulacion_producto,id_simulacion,id_producto,cantidad_planificada,cantidad_recibida")
    .eq("id_simulacion", id_simulacion);
  if (error || !data) return [];

  return data.map((row) => ({
    id_simulacion_producto: row.id_simulacion_producto,
    id_simulacion: row.id_simulacion,
    id_producto: row.id_producto,
    cantidad_asignada: Number(row.cantidad_planificada ?? 0),
    cantidad_utilizada: Number(row.cantidad_recibida ?? 0),
  }));
}

export async function cargarProductoSimulacion(
  id_simulacion: string,
  id_producto: string,
  cantidad: number,
): Promise<ResultadoMutacion> {
  if (cantidad <= 0) return { ok: false, mensaje: "Cantidad debe ser mayor a 0" };

  if (!isSupabaseConfigured()) {
    const existing = localProductosSimulacion.find(
      (p) => p.id_simulacion === id_simulacion && p.id_producto === id_producto,
    );

    if (existing) {
      existing.cantidad_asignada += cantidad;
    } else {
      localProductosSimulacion.push({
        id_simulacion_producto: nextId("psim"),
        id_simulacion,
        id_producto,
        cantidad_asignada: cantidad,
        cantidad_utilizada: 0,
      });
    }

    await registrarTrazabilidad({
      id_usuario: "prof-1",
      id_simulacion,
      modulo: "simulacion_bodega",
      accion: "cargar_stock",
      valor_nuevo: cantidad,
    });

    return { ok: true, mensaje: "Stock cargado a simulación (demo)" };
  }

  const { data: existing } = await getSupabaseBrowserClient()
    .from("simulacion_productos")
    .select("id_simulacion_producto,cantidad_planificada")
    .eq("id_simulacion", id_simulacion)
    .eq("id_producto", id_producto)
    .maybeSingle();

  if (existing?.id_simulacion_producto) {
    const next = Number(existing.cantidad_planificada ?? 0) + cantidad;
    const { error } = await getSupabaseBrowserClient()
      .from("simulacion_productos")
      .update({ cantidad_planificada: next })
      .eq("id_simulacion_producto", existing.id_simulacion_producto);
    if (error) return { ok: false, mensaje: error.message };
  } else {
    const { error } = await getSupabaseBrowserClient().from("simulacion_productos").insert({
      id_simulacion,
      id_producto,
      cantidad_planificada: cantidad,
      cantidad_recibida: 0,
      observacion: "Carga desde módulo académico",
    });
    if (error) return { ok: false, mensaje: error.message };
  }
  return { ok: true, mensaje: "Stock cargado" };
}

export async function descontarStockPorReceta(
  id_simulacion: string,
  id_receta: string,
  cantidad_pedida: number
): Promise<ResultadoMutacion> {
  if (!isSupabaseConfigured()) {
    const ingredientes = localIngredientes.filter(i => i.id_receta === id_receta);
    
    for (const ing of ingredientes) {
      const stockSim = localProductosSimulacion.find(
        ps => ps.id_simulacion === id_simulacion && ps.id_producto === ing.id_producto
      );

      if (stockSim) {
        stockSim.cantidad_utilizada += (ing.cantidad * cantidad_pedida);
      }
      
      // También descontar de la bodega general en modo demo para realismo
      const prodGral = localProductosBodega.find(p => p.id_producto === ing.id_producto);
      if (prodGral) {
        prodGral.stock_actual -= (ing.cantidad * cantidad_pedida);
      }
    }

    await registrarTrazabilidad({
      id_usuario: "prof-1",
      id_simulacion,
      modulo: "bodega",
      accion: "descuento_por_receta",
      observacion: `Consumo por receta ${id_receta} x ${cantidad_pedida}`,
    });

    return { ok: true, mensaje: "Stock descontado exitosamente" };
  }

  // En Supabase el descuento de stock se consolida al cierre de pago
  // vía RPC consume_order_inventory para evitar dobles descuentos.
  await registrarTrazabilidad({
    id_usuario: "sistema",
    id_simulacion,
    modulo: "bodega",
    accion: "consumo_reservado_por_receta",
    valor_nuevo: { id_receta, cantidad_pedida },
    observacion: "Consumo operativo pendiente de consolidación al cierre de pago.",
  });

  return { ok: true, mensaje: "Consumo reservado para cierre de pago." };
}
