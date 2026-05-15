"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, CheckCircle2, Flame, Utensils, Timer, Send } from "lucide-react";
import { listarComandasActivas, actualizarEstadoComanda } from "@/lib/pos-mutations";
import type { DetallePedido, EstadoComanda } from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardBody,
  Button,
  OperationToast,
} from "@/components/ui/academic-ui-kit";

interface KitchenDisplayProps {
  id_simulacion: string;
  area: "cocina" | "bar";
}

export function KitchenDisplay({ id_simulacion, area }: KitchenDisplayProps) {
  const [tickets, setTickets] = useState<(DetallePedido & { numero_mesa: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listarComandasActivas(id_simulacion, area);
      setTickets(data);
    } catch {
      setToast({ message: "Error cargando comandas.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [id_simulacion, area]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleUpdate(idDetalle: string, nextStatus: EstadoComanda) {
    const result = await actualizarEstadoComanda(idDetalle, nextStatus);
    if (result.ok) {
      void load();
    } else {
      setToast({ message: result.mensaje, tone: "error" });
    }
  }

  if (loading && tickets.length === 0) return <div className="py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Monitor KDS {area.toUpperCase()}…</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-4 shadow-premium sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
            {area === "cocina" ? <Flame className="h-6 w-6" /> : <Utensils className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
              Monitor de Producción: {area}
            </h2>
            <div className="mt-1 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              Live Academic System
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendientes</span>
            <span className="text-2xl font-black text-white leading-none">{tickets.length}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-tighter">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            En línea
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
        {tickets.map(t => {
          const isPendiente = t.estado === "pendiente";
          const isPrep = t.estado === "preparando";
          const isListo = t.estado === "listo";

          return (
            <AcademicCard 
              key={t.id_detalle} 
              className={`overflow-hidden border-2 transition-all duration-300 ${
                isListo 
                  ? "border-emerald-500/50 bg-emerald-500/[0.02]" 
                  : isPrep 
                    ? "border-orange-500 shadow-lg shadow-orange-500/10" 
                    : "border-slate-200 dark:border-white/10"
              }`}
            >
              <div className={`p-4 flex justify-between items-center ${
                isPrep ? "bg-orange-600 text-white" : "bg-slate-100 dark:bg-white/[0.05]"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-tighter">Mesa {t.numero_mesa}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isPrep ? "text-white" : "text-slate-500"}`}>
                  <Timer className="h-3 w-3" /> {isPrep ? "En fuego" : "En espera"}
                </div>
              </div>
              
              <AcademicCardBody className="flex flex-col gap-6 p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-black text-2xl shadow-sm ${
                    isPrep ? "bg-orange-600 text-white" : "bg-slate-900 text-white"
                  }`}>
                    {t.cantidad}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="font-black text-slate-900 dark:text-white text-base uppercase leading-tight tracking-tight">
                      {t.nombre_producto}
                    </div>
                    {t.notas && (
                      <div className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg uppercase tracking-tight">
                        <CheckCircle2 className="h-3 w-3" /> {t.notas}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto">
                  {isPendiente && (
                    <Button 
                      className="w-full h-14 text-xs font-black uppercase tracking-widest" 
                      variant="secondary" 
                      onClick={() => void handleUpdate(t.id_detalle, "preparando")}
                    >
                      <Play className="h-4 w-4 mr-2" /> Comenzar Preparación
                    </Button>
                  )}
                  {isPrep && (
                    <Button 
                      className="w-full h-14 text-xs font-black uppercase tracking-widest bg-orange-600 shadow-orange-500/40" 
                      onClick={() => void handleUpdate(t.id_detalle, "listo")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Terminado
                    </Button>
                  )}
                  {isListo && (
                    <Button
                      className="h-14 w-full bg-emerald-600 text-xs font-black uppercase tracking-widest shadow-emerald-500/40"
                      onClick={() => void handleUpdate(t.id_detalle, "entregado")}
                    >
                      <Send className="mr-2 h-4 w-4" /> Despachar Comanda
                    </Button>
                  )}
                </div>
              </AcademicCardBody>
            </AcademicCard>
          );
        })}
        
        {tickets.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center gap-4 opacity-20 grayscale grayscale-100">
            <Utensils className="h-16 w-16" />
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-widest">Cocina Limpia</h3>
              <p className="text-xs font-bold uppercase">Sin comandas en espera</p>
            </div>
          </div>
        )}
      </div>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
