import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { IngredienteReceta, ProductoBodega, Receta } from "@/lib/academic-types";
import { demoIngredientesReceta, demoRecetas } from "./demo-data-warehouse";
import { listarProductosBodega } from "./warehouse-mutations";
import { registrarTrazabilidad } from "./trazabilidad-mutations";
import { loadRestaurantSnapshot } from "./data-source";

const localRecetas = [...demoRecetas];
const localIngredientes = [...demoIngredientesReceta];
let recetaIdCounter = 600;

export async function calcularCostoReceta(
  id_receta: string,
): Promise<{ costo_total: number; margen: number }> {
  const ingredientes = localIngredientes.filter((i) => i.id_receta === id_receta);
  const productos = await listarProductosBodega();

  let costoAcumulado = 0;
  for (const ing of ingredientes) {
    const prod = productos.find((p) => p.id_producto === ing.id_producto);
    if (!prod) continue;
    const factorRendimiento = (ing.rendimiento_porcentaje || 100) / 100;
    const pesoBruto = ing.cantidad / factorRendimiento;
    costoAcumulado += pesoBruto * prod.costo_unitario;
  }

  const receta = localRecetas.find((r) => r.id_receta === id_receta);
  const margen = receta ? receta.precio_venta - costoAcumulado : 0;
  return { costo_total: costoAcumulado, margen };
}

function toAcademicRecetaFromSnapshot(snapshot: Awaited<ReturnType<typeof loadRestaurantSnapshot>>): Receta[] {
  return snapshot.recipes.map((receta) => {
    const costoTotal = receta.ingredients.reduce((acc, ingredient) => {
      const raw = snapshot.rawMaterials.find((item) => item.id === ingredient.rawMaterialId);
      if (!raw) return acc;
      const factorYield = (raw.averageYield || 100) / 100;
      const unitCost = raw.purchaseCost / Math.max(1, raw.purchaseQuantity * factorYield);
      const netQty = ingredient.grossQuantity * ((ingredient.yieldPercent || 100) / 100);
      return acc + netQty * unitCost;
    }, 0);
    const margen = (receta.salePrice || 0) - costoTotal;

    return {
      id_receta: receta.id,
      nombre_receta: receta.name,
      categoria: receta.category,
      costo_total: Number(costoTotal.toFixed(2)),
      precio_venta: receta.salePrice || 0,
      rendimiento: receta.portions || 1,
      porciones: receta.portions || 1,
      margen: Number(margen.toFixed(2)),
      procedimiento: receta.procedure || "",
    };
  });
}

export async function listarRecetasConCosteo(): Promise<Receta[]> {
  if (!isSupabaseConfigured()) {
    return Promise.all(
      localRecetas.map(async (receta) => {
        const { costo_total, margen } = await calcularCostoReceta(receta.id_receta);
        return { ...receta, costo_total, margen };
      }),
    );
  }

  const snapshot = await loadRestaurantSnapshot();
  if (snapshot.source === "supabase") {
    return toAcademicRecetaFromSnapshot(snapshot);
  }

  // fallback defensivo
  return Promise.all(
    localRecetas.map(async (receta) => {
      const { costo_total, margen } = await calcularCostoReceta(receta.id_receta);
      return { ...receta, costo_total, margen };
    }),
  );
}

export async function crearReceta(
  draft: Partial<Receta>,
  ingredientes: Partial<IngredienteReceta>[],
): Promise<string> {
  if (!isSupabaseConfigured()) {
    const id_receta = `rec-${recetaIdCounter++}`;
    const nuevaReceta: Receta = {
      id_receta,
      nombre_receta: draft.nombre_receta || "Nueva Receta",
      categoria: draft.categoria || "General",
      costo_total: 0,
      precio_venta: draft.precio_venta || 0,
      rendimiento: draft.rendimiento || 1,
      porciones: draft.porciones || 1,
      margen: 0,
      procedimiento: draft.procedimiento || "",
    };

    localRecetas.push(nuevaReceta);
    ingredientes.forEach((ing, index) => {
      localIngredientes.push({
        id_ingrediente: `${id_receta}-ing-${index}`,
        id_receta,
        id_producto: ing.id_producto || "",
        cantidad: ing.cantidad || 0,
        unidad_medida: ing.unidad_medida || "g",
        merma_porcentaje: ing.merma_porcentaje || 0,
        rendimiento_porcentaje: ing.rendimiento_porcentaje || 100,
      });
    });

    await registrarTrazabilidad({
      id_usuario: "prof-1",
      modulo: "recetas",
      accion: "crear_receta",
      valor_nuevo: nuevaReceta.nombre_receta,
    });

    return id_receta;
  }

  // En esta etapa el alta formal se mantiene en el módulo técnico de operaciones SQL.
  // Guardamos trazabilidad mínima para no romper flujos académicos.
  await registrarTrazabilidad({
    id_usuario: "prof-supabase",
    modulo: "recetas",
    accion: "crear_receta",
    valor_nuevo: draft.nombre_receta || "Nueva receta",
    observacion: "Alta académica delegada a módulo técnico de recetas.",
  });

  // retorna id pseudo para mantener compatibilidad del flujo UI actual
  return `rec-sup-${Date.now()}`;
}

export async function obtenerIngredientesReceta(id_receta: string): Promise<IngredienteReceta[]> {
  if (!isSupabaseConfigured()) {
    return localIngredientes.filter((item) => item.id_receta === id_receta);
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("recipe_ingredients")
    .select("id,recipe_id,raw_material_id,gross_quantity,unit,yield_percent")
    .eq("recipe_id", id_receta);

  if (error || !data) return [];

  return data.map((item) => ({
    id_ingrediente: item.id,
    id_receta: item.recipe_id,
    id_producto: item.raw_material_id,
    cantidad: Number(item.gross_quantity ?? 0),
    unidad_medida: item.unit ?? "g",
    merma_porcentaje: Math.max(0, 100 - Number(item.yield_percent ?? 100)),
    rendimiento_porcentaje: Number(item.yield_percent ?? 100),
  }));
}

export async function listarRecetas(): Promise<Receta[]> {
  return listarRecetasConCosteo();
}

export async function listarProductosParaCosteo(): Promise<ProductoBodega[]> {
  return listarProductosBodega();
}
