"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus, Search, Tag, Thermometer, Box } from "lucide-react";
import { listarProductosBodega, crearProductoBodega } from "@/lib/warehouse-mutations";
import type { ProductoBodega, CategoriaBodega } from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  Button,
  EmptyState,
  FormField,
  Input,
  Modal,
  OperationToast,
  Select,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

const CATEGORIAS: { value: CategoriaBodega; label: string }[] = [
  { value: "carnes", label: "Carnes" },
  { value: "pescados_mariscos", label: "Pescados y Mariscos" },
  { value: "lacteos", label: "Lácteos" },
  { value: "verduras", label: "Verduras" },
  { value: "frutas", label: "Frutas" },
  { value: "secos", label: "Secos" },
  { value: "congelados", label: "Congelados" },
  { value: "bebidas", label: "Bebidas" },
  { value: "insumos_bar", label: "Insumos de Bar" },
  { value: "aseo_higiene", label: "Aseo e Higiene" },
];

export function WarehouseManager() {
  const [productos, setProductos] = useState<ProductoBodega[]>([]);
  const [filtered, setFiltered] = useState<ProductoBodega[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarProductosBodega();
      setProductos(data);
      setFiltered(data);
    } catch {
      setToast({ message: "Error cargando inventario.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(productos);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      productos.filter(
        (p) =>
          p.nombre_producto.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      ),
    );
  }, [searchQuery, productos]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await crearProductoBodega({
      nombre_producto: form.get("nombre") as string,
      categoria: form.get("categoria") as CategoriaBodega,
      unidad_medida: form.get("unidad") as string,
      stock_actual: Number(form.get("stock")),
      stock_minimo: Number(form.get("min")),
      costo_unitario: Number(form.get("costo")),
      ubicacion: form.get("ubicacion") as "seco" | "refrigerado" | "congelado",
      temperatura: form.get("temp") ? Number(form.get("temp")) : undefined,
    });

    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowNew(false);
      void load();
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Cargando bodega académica…</div>;

  return (
    <div className="flex flex-col gap-6">
      <AcademicCard>
        <AcademicCardHeader
          title="Bodega e Inventario"
          subtitle={`${productos.length} producto(s) en catálogo`}
          action={
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowNew(true)}>
              Nuevo producto
            </Button>
          }
        />
        <AcademicCardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Buscar por nombre o categoría (ej: carnes, lacteos)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </AcademicCardBody>
        <AcademicCardBody className="p-0 border-t border-slate-200 dark:border-white/5">
          {filtered.length === 0 ? (
            <div className="px-5 py-10">
              <EmptyState icon={<Package className="h-8 w-8" />} title="Sin resultados" message="No hay productos que coincidan con la búsqueda." />
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/5">
              {filtered.map((prod) => {
                const isLow = prod.stock_actual <= prod.stock_minimo;
                return (
                  <div key={prod.id_producto} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{prod.nombre_producto}</span>
                        <StatusBadge label={prod.categoria.replace("_", " ")} tone="sky" />
                        {isLow && <StatusBadge label="Stock Crítico" tone="red" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Box className="h-3 w-3" /> {prod.ubicacion ?? "Sin ubicación"}</span>
                        {prod.temperatura !== undefined && (
                          <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {prod.temperatura}°C</span>
                        )}
                        <span>Stock: {prod.stock_actual} {prod.unidad_medida}</span>
                        <span>Costo: ${prod.costo_unitario.toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Registrar ingreso a bodega">
        <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-4">
          <FormField label="Nombre del producto" htmlFor="prod-name"><Input id="prod-name" name="nombre" required /></FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Categoría" htmlFor="prod-cat">
              <Select id="prod-cat" name="categoria" required>
                <option value="">Seleccionar…</option>
                {CATEGORIAS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </Select>
            </FormField>
            <FormField label="Unidad de medida" htmlFor="prod-unit">
              <Select id="prod-unit" name="unidad" required>
                <option value="kg">Kilogramos (kg)</option>
                <option value="L">Litros (L)</option>
                <option value="un">Unidades (un)</option>
                <option value="g">Gramos (g)</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Almacenamiento" htmlFor="prod-ub">
              <Select id="prod-ub" name="ubicacion" required>
                <option value="seco">Seco (Abarrotes)</option>
                <option value="refrigerado">Refrigerado (0°C a 5°C)</option>
                <option value="congelado">Congelado (-18°C)</option>
              </Select>
            </FormField>
            <FormField label="Temperatura (°C)" htmlFor="prod-temp"><Input id="prod-temp" name="temp" type="number" step="0.1" /></FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Stock inicial" htmlFor="prod-stock"><Input id="prod-stock" name="stock" type="number" step="0.1" required /></FormField>
            <FormField label="Stock mínimo" htmlFor="prod-min"><Input id="prod-min" name="min" type="number" step="0.1" required /></FormField>
            <FormField label="Costo unitario ($)" htmlFor="prod-costo"><Input id="prod-costo" name="costo" type="number" required /></FormField>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button type="submit">Registrar Producto</Button>
          </div>
        </form>
      </Modal>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
