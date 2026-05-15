"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Clock, Layers, Play, Square, Target } from "lucide-react";
import type { Simulacion, AreaSimulacion, EstadoSimulacion } from "@/lib/academic-types";
import {
  obtenerSimulacion,
  listarAreasSimulacion,
  avanzarEstadoSimulacion,
} from "@/lib/simulation-mutations";
import { RoleAssignment } from "@/components/academic/role-assignment";
import { StockLoader } from "@/components/academic/stock-loader";
import { MiseEnPlaceChecklist } from "@/components/academic/mise-en-place-checklist";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  Button,
  OperationToast,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

const ESTADO_ORDER: EstadoSimulacion[] = [
  "creada",
  "configurada",
  "alumnos_asignados",
  "productos_cargados",
  "pre_servicio",
  "servicio_activo",
  "servicio_cerrado",
  "reporte_generado",
  "evaluacion_finalizada",
  "archivada",
];

function nextEstado(current: EstadoSimulacion): EstadoSimulacion | null {
  const idx = ESTADO_ORDER.indexOf(current);
  return idx >= 0 && idx < ESTADO_ORDER.length - 1 ? ESTADO_ORDER[idx + 1] : null;
}

type EstadoTone = "emerald" | "amber" | "sky" | "orange" | "red" | "zinc" | "purple";
function estadoTone(estado: EstadoSimulacion): EstadoTone {
  const map: Record<string, EstadoTone> = {
    creada: "zinc", configurada: "sky", alumnos_asignados: "sky", productos_cargados: "sky",
    pre_servicio: "amber", servicio_activo: "emerald", servicio_cerrado: "orange",
    reporte_generado: "purple", evaluacion_finalizada: "purple", archivada: "zinc",
  };
  return map[estado] ?? "zinc";
}

interface SimulationDetailProps {
  id_simulacion: string;
  onBack: () => void;
}

export function SimulationDetail({ id_simulacion, onBack }: SimulationDetailProps) {
  const [sim, setSim] = useState<Simulacion | null>(null);
  const [areas, setAreas] = useState<AreaSimulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        obtenerSimulacion(id_simulacion),
        listarAreasSimulacion(id_simulacion),
      ]);
      setSim(s);
      setAreas(a);
    } catch {
      setToast({ message: "Error cargando simulación.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [id_simulacion]);

  useEffect(() => { void load(); }, [load]);

  async function handleAdvance() {
    if (!sim) return;
    const next = nextEstado(sim.estado);
    if (!next) return;

    const result = await avanzarEstadoSimulacion(sim.id_simulacion, next);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) void load();
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-slate-400">Cargando detalle…</div>;
  if (!sim) return <div className="py-20 text-center"><Button variant="secondary" onClick={onBack}>Volver</Button></div>;

  const next = nextEstado(sim.estado);
  const isActive = sim.estado === "servicio_activo";
  const currentIdx = ESTADO_ORDER.indexOf(sim.estado);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack} className="px-2" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Panel de Simulación</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span>{sim.tipo_servicio}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.duracion_estimada} min</span>
            </div>
          </div>
        </div>
        <StatusBadge label={sim.estado} tone={estadoTone(sim.estado)} />
      </div>

      <AcademicCard>
        <AcademicCardBody>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-1 min-w-max">
              {ESTADO_ORDER.map((estado, i) => {
                const isCompleted = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={estado} className="flex items-center gap-1">
                    {i > 0 && <div className={`h-0.5 w-4 sm:w-8 ${isCompleted ? "bg-orange-500" : "bg-slate-200 dark:bg-white/10"}`} />}
                    <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase transition ${
                      isCurrent ? "bg-orange-600 text-white shadow-lg" : isCompleted ? "bg-orange-500/20 text-orange-600" : "bg-slate-100 text-slate-500 dark:bg-white/5"
                    }`}>
                      {estado}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {next && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => void handleAdvance()} icon={isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />} variant={isActive ? "danger" : "primary"}>
                {isActive ? "Cerrar servicio" : `Avanzar a: ${next}`}
              </Button>
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <AcademicCard key={area.id_area_simulacion}>
            <AcademicCardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{area.area_trabajo}</span>
                </div>
                <StatusBadge label={area.estado} tone={area.estado === "lista" ? "emerald" : "zinc"} />
              </div>
            </AcademicCardBody>
          </AcademicCard>
        ))}
      </div>

      <RoleAssignment id_simulacion={id_simulacion} onRolesChanged={load} />
      <StockLoader id_simulacion={id_simulacion} />
      <MiseEnPlaceChecklist id_simulacion={id_simulacion} />

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
