"use client";

import { useCallback, useEffect, useState } from "react";
import { UtensilsCrossed, Trash2, CheckCircle2, ShoppingBag, Plus } from "lucide-react";
import { listarMesas, crearPedido } from "@/lib/pos-mutations";
import { listarRecetasConCosteo } from "@/lib/recetas-mutations";
import type { Mesa, Receta } from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  Button,
  OperationToast,
  Select,
} from "@/components/ui/academic-ui-kit";

interface PosTerminalProps {
  id_simulacion: string;
  preselected_id_mesa?: string;
  onOrderSent?: () => void;
}

interface PosCartItem {
  id_producto: string;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  area_destino: "cocina" | "bar";
  notas?: string;
}

export function PosTerminal({ id_simulacion, preselected_id_mesa, onOrderSent }: PosTerminalProps) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [menu, setMenu] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const [selectedMesa, setSelectedMesa] = useState(preselected_id_mesa || "");
  const [items, setItems] = useState<PosCartItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        listarMesas(),
        listarRecetasConCosteo(),
      ]);
      setMesas(m);
      setMenu(r);
    } catch {
      setToast({ message: "Error cargando terminal.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function addItem(receta: Receta) {
    setItems(prev => {
      const exist = prev.find(i => i.id_producto === receta.id_receta);
      if (exist) {
        return prev.map(i => i.id_producto === receta.id_receta ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, {
        id_producto: receta.id_receta,
        nombre_producto: receta.nombre_receta,
        precio_unitario: receta.precio_venta,
        cantidad: 1,
        area_destino: receta.categoria === "bebidas" ? "bar" : "cocina",
        notas: "",
      }];
    });
  }

  async function handleSend() {
    if (!selectedMesa || items.length === 0) return;
    
    const result = await crearPedido({
      id_simulacion,
      id_mesa: selectedMesa,
      items,
    });

    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setItems([]);
      onOrderSent?.();
    }
  }

  const total = items.reduce((sum, i) => sum + (i.precio_unitario * i.cantidad), 0);

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Terminal POS…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      <div className="lg:col-span-8 flex flex-col gap-4 order-2 lg:order-1">
        <AcademicCard>
          <AcademicCardHeader 
            title="Carta de Servicio" 
            subtitle="Toca los platos para añadirlos a la comanda" 
            action={<div className="flex items-center gap-2 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-tighter">UDLA Gastronomía</div>}
          />
          <AcademicCardBody>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-4">
              {menu.map(r => (
                <button
                  key={r.id_receta}
                  onClick={() => addItem(r)}
                  className="group relative flex flex-col items-start justify-between rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-4 text-left transition-all hover:border-orange-500 hover:shadow-soft active:scale-95"
                >
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-orange-500/0 flex items-center justify-center text-white transition-all group-hover:bg-orange-500">
                      <Plus className="h-4 w-4" />
                    </div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase line-clamp-2 pr-6 leading-tight">{r.nombre_receta}</span>
                  <div className="mt-4 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{r.categoria}</span>
                    <span className="text-sm font-black text-orange-600">
                      ${r.precio_venta.toLocaleString("es-CL")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </AcademicCardBody>
        </AcademicCard>
      </div>

      <div className="lg:col-span-4 order-1 lg:order-2">
        <AcademicCard className="lg:sticky lg:top-6 border-orange-200/50 dark:border-orange-500/20 bg-orange-50/10 dark:bg-orange-500/[0.02]">
          <AcademicCardHeader 
            title="Comanda Actual" 
            action={<ShoppingBag className="h-5 w-5 text-orange-600" />}
          />
          <AcademicCardBody className="flex flex-col gap-4">
            <Select 
              value={selectedMesa} 
              onChange={e => setSelectedMesa(e.target.value)} 
              disabled={!!preselected_id_mesa}
              className="font-bold uppercase tracking-tight"
            >
              <option value="">Seleccionar mesa…</option>
              {mesas.map(m => (
                <option key={m.id_mesa} value={m.id_mesa} disabled={m.estado === "ocupada" && m.id_mesa !== preselected_id_mesa}>
                  Mesa {m.numero_mesa} {m.estado === "ocupada" ? "(En servicio)" : "(Disponible)"}
                </option>
              ))}
            </Select>

            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.id_producto} className="group rounded-2xl bg-white dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-soft">
                  <div className="flex justify-between font-black text-xs uppercase tracking-tight">
                    <span className="text-slate-900 dark:text-white line-clamp-1 flex-1">{item.nombre_producto}</span>
                    <span className="text-orange-600 ml-2">${(item.precio_unitario * item.cantidad).toLocaleString("es-CL")}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/10 rounded-xl px-3 py-1.5 border border-slate-200/50 dark:border-white/10">
                      <button onClick={() => setItems(prev => prev.map(i => i.id_producto === item.id_producto ? { ...i, cantidad: Math.max(1, i.cantidad - 1) } : i))} className="font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">-</button>
                      <span className="text-xs font-black min-w-[20px] text-center">{item.cantidad}</span>
                      <button onClick={() => setItems(prev => prev.map(i => i.id_producto === item.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i))} className="font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">+</button>
                    </div>
                    <button onClick={() => setItems(prev => prev.filter(i => i.id_producto !== item.id_producto))} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-12 flex flex-col items-center gap-2 opacity-30 grayscale">
                  <UtensilsCrossed className="h-8 w-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Esperando pedido</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-5 border-t-2 border-dashed border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a pagar</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">${total.toLocaleString("es-CL")}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md uppercase">IVA Incluido</div>
              </div>
              <Button 
                className="w-full h-14 text-base shadow-orange-500/20" 
                icon={<CheckCircle2 className="h-6 w-6" />} 
                disabled={items.length === 0 || !selectedMesa} 
                onClick={() => void handleSend()}
              >
                Enviar a Cocina
              </Button>
            </div>
          </AcademicCardBody>
        </AcademicCard>
      </div>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
