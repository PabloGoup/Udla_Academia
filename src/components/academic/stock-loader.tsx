"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus, Save } from "lucide-react";
import {
  listarProductosBodega,
  listarProductosSimulacion,
  cargarProductoSimulacion,
  type ProductoSimulacion,
} from "@/lib/warehouse-mutations";
import type { ProductoBodega } from "@/lib/academic-types";
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
} from "@/components/ui/academic-ui-kit";

interface StockLoaderProps {
  id_simulacion: string;
}

export function StockLoader({ id_simulacion }: StockLoaderProps) {
  const [catalogo, setCatalogo] = useState<ProductoBodega[]>([]);
  const [stockSimulacion, setStockSimulacion] = useState<ProductoSimulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, sim] = await Promise.all([
        listarProductosBodega(),
        listarProductosSimulacion(id_simulacion),
      ]);
      setCatalogo(cat);
      setStockSimulacion(sim);
    } catch {
      setToast({ message: "Error cargando stock de simulación.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [id_simulacion]);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const idProd = form.get("producto") as string;
    const qty = Number(form.get("qty"));

    const result = await cargarProductoSimulacion(id_simulacion, idProd, qty);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowAdd(false);
      void load();
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-slate-400">Cargando stock de clase…</div>;
  }

  const loadedIds = new Set(stockSimulacion.map((s) => s.id_producto));
  const availableCatalog = catalogo.filter((c) => !loadedIds.has(c.id_producto));

  return (
    <div className="flex flex-col gap-4">
      <AcademicCard>
        <AcademicCardHeader
          title="Stock Inicial de Simulación"
          subtitle={`${stockSimulacion.length} insumos cargados para el servicio`}
          action={
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAdd(true)}
              disabled={availableCatalog.length === 0}
            >
              Cargar insumo
            </Button>
          }
        />
        <AcademicCardBody className="p-0">
          {stockSimulacion.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="Sin stock cargado"
                message="Asigna los ingredientes necesarios para que los alumnos puedan solicitarlos."
                action={
                  <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
                    Cargar primer insumo
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/5">
              {stockSimulacion.map((item) => {
                const mat = catalogo.find((c) => c.id_producto === item.id_producto);
                if (!mat) return null;
                return (
                  <div key={item.id_simulacion_producto} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{mat.nombre_producto}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {item.cantidad_utilizada} usados / {item.cantidad_asignada} {mat.unidad_medida} asignados
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {item.cantidad_asignada - item.cantidad_utilizada} {mat.unidad_medida}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Disponibles</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Cargar insumo a simulación">
        <form onSubmit={(e) => void handleAdd(e)} className="flex flex-col gap-4">
          <FormField label="Producto de Bodega" htmlFor="stock-prod">
            <Select id="stock-prod" name="producto" required>
              <option value="">Seleccionar del catálogo…</option>
              {availableCatalog.map((c) => (
                <option key={c.id_producto} value={c.id_producto}>
                  {c.nombre_producto} (Disponible: {c.stock_actual} {c.unidad_medida})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Cantidad a asignar" htmlFor="stock-qty">
            <Input id="stock-qty" name="qty" type="number" step="0.1" min="0.1" required />
          </FormField>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button type="submit" icon={<Save className="h-4 w-4" />}>Asignar stock</Button>
          </div>
        </form>
      </Modal>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
