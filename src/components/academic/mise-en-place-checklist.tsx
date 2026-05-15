"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, AlertCircle, Clock, Zap, Sparkles } from "lucide-react";
import { listarAreasSimulacion, actualizarEstadoArea } from "@/lib/simulation-mutations";
import type { AreaSimulacion } from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  OperationToast,
} from "@/components/ui/academic-ui-kit";

interface MiseEnPlaceChecklistProps {
  id_simulacion: string;
}

export function MiseEnPlaceChecklist({ id_simulacion }: MiseEnPlaceChecklistProps) {
  const [areas, setAreas] = useState<AreaSimulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarAreasSimulacion(id_simulacion);
      setAreas(data);
    } catch {
      setToast({ message: "Error cargando áreas.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [id_simulacion]);

  useEffect(() => { void load(); }, [load]);

  async function handleToggle(area: AreaSimulacion) {
    const nuevoEstado = area.estado === "lista" ? "pendiente" : "lista";
    
    // Optimistic update
    setAreas((prev) =>
      prev.map((a) =>
        a.id_area_simulacion === area.id_area_simulacion ? { ...a, estado: nuevoEstado } : a,
      ),
    );

    const result = await actualizarEstadoArea(area.id_area_simulacion, nuevoEstado);
    if (!result.ok) {
      setToast({ message: result.mensaje, tone: "error" });
      void load(); // Rollback
    }
  }

  if (loading && areas.length === 0) return <div className="py-20 text-center text-sm font-black uppercase tracking-widest text-slate-400 animate-pulse">Iniciando Mise-en-place…</div>;

  const areasListas = areas.filter((a) => a.estado === "lista").length;
  const progress = areas.length === 0 ? 0 : Math.round((areasListas / areas.length) * 100);
  const isComplete = progress === 100;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AcademicCard className={`border-t-4 transition-all duration-500 ${isComplete ? "border-t-emerald-500 shadow-lg shadow-emerald-500/10" : "border-t-orange-500"}`}>
        <AcademicCardHeader
          title="Puesta a Punto Académica"
          subtitle={`${areasListas} de ${areas.length} áreas validadas para el inicio del servicio`}
          action={isComplete ? <Sparkles className="h-5 w-5 text-emerald-500 animate-bounce" /> : <Clock className="h-5 w-5 text-orange-500" />}
        />
        <AcademicCardBody className="flex flex-col gap-8">
          {/* Barra de Progreso Premium */}
          <div className="relative pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progreso Operativo</span>
              <span className={`text-sm font-black ${isComplete ? "text-emerald-500" : "text-orange-600"}`}>{progress}%</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-1">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isComplete 
                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                    : "bg-gradient-to-r from-orange-600 to-orange-400"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {isComplete && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center animate-in zoom-in-95">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-tight">¡Todo listo para el despacho!</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {areas.map((area) => {
              const isReady = area.estado === "lista";
              return (
                <button
                  key={area.id_area_simulacion}
                  onClick={() => void handleToggle(area)}
                  className={`group relative flex items-center justify-between gap-4 rounded-2xl border-2 p-5 text-left transition-all active:scale-95 shadow-sm ${
                    isReady 
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-emerald-500/5" 
                      : "border-slate-100 bg-white dark:border-white/5 dark:bg-white/5 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${isReady ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>
                      {isReady ? <CheckCircle2 className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className={`text-sm font-black uppercase tracking-tight ${isReady ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>
                        {area.area_trabajo}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {isReady ? "Validado" : "Pendiente de revisión"}
                      </div>
                    </div>
                  </div>
                  {!isReady && (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-white/10 group-hover:border-orange-500 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </AcademicCardBody>
      </AcademicCard>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
