import type {
  ProductoBodega,
  Receta,
  IngredienteReceta,
  MovimientoBodega,
} from "@/lib/academic-types";

/* ───── catálogo de productos en bodega ───── */

export const demoProductosBodega: ProductoBodega[] = [
  {
    id_producto: "prod-1",
    nombre_producto: "Leche entera",
    categoria: "lacteos",
    unidad_medida: "L",
    stock_actual: 20,
    stock_minimo: 5,
    costo_unitario: 1200,
    ubicacion: "refrigerado",
    temperatura: 4,
    estado: "activo",
  },
  {
    id_producto: "prod-2",
    nombre_producto: "Lomo vetado",
    categoria: "carnes",
    unidad_medida: "kg",
    stock_actual: 15,
    stock_minimo: 5,
    costo_unitario: 15000,
    ubicacion: "refrigerado",
    temperatura: 2,
    estado: "activo",
  },
  {
    id_producto: "prod-3",
    nombre_producto: "Cebolla blanca",
    categoria: "verduras",
    unidad_medida: "kg",
    stock_actual: 30,
    stock_minimo: 10,
    costo_unitario: 1500,
    ubicacion: "seco",
    estado: "activo",
  },
  {
    id_producto: "prod-4",
    nombre_producto: "Harina sin polvos",
    categoria: "secos",
    unidad_medida: "kg",
    stock_actual: 50,
    stock_minimo: 15,
    costo_unitario: 1100,
    ubicacion: "seco",
    estado: "activo",
  },
];

/* ───── recetas ───── */

export const demoRecetas: Receta[] = [
  {
    id_receta: "rec-1",
    nombre_receta: "Lomo a lo pobre",
    categoria: "Platos de fondo",
    costo_total: 8500,
    precio_venta: 18500,
    rendimiento: 1,
    porciones: 1,
    margen: 10000,
    procedimiento: "1. Sellar la carne... 2. Freír papas... 3. Montar con huevo frito.",
  },
  {
    id_receta: "rec-2",
    nombre_receta: "Ceviche de reineta",
    categoria: "Entradas",
    costo_total: 4200,
    precio_venta: 12900,
    rendimiento: 1,
    porciones: 1,
    margen: 8700,
    procedimiento: "1. Cortar pescado... 2. Limón y especias... 3. Servir frío.",
  },
];

/* ───── ingredientes por receta ───── */

export const demoIngredientesReceta: IngredienteReceta[] = [
  {
    id_ingrediente: "ing-1",
    id_receta: "rec-1",
    id_producto: "prod-2", // Lomo
    cantidad: 0.25,
    unidad_medida: "kg",
    merma_porcentaje: 5,
    rendimiento_porcentaje: 95,
  },
  {
    id_ingrediente: "ing-2",
    id_receta: "rec-1",
    id_producto: "prod-3", // Cebolla
    cantidad: 0.15,
    unidad_medida: "kg",
    merma_porcentaje: 10,
    rendimiento_porcentaje: 90,
  },
];

/* ───── movimientos de bodega recientes ───── */

export const demoMovimientosBodega: MovimientoBodega[] = [
  {
    id_movimiento: "mov-1",
    id_producto: "prod-2",
    tipo_movimiento: "ingreso",
    cantidad: 10,
    motivo: "Recepción de proveedor",
    usuario_responsable: "Camila Bravo",
    fecha_hora: "2026-05-14T10:00:00Z",
  },
];
