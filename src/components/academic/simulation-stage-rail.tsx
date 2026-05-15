import { CheckCircle2, Circle, Radio } from "lucide-react";
import { estadoLabels } from "@/lib/academic-labels";
import type { EstadoSimulacion } from "@/lib/academic-types";

const simulationStages: EstadoSimulacion[] = [
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

export function SimulationStageRail({ estado }: { estado: EstadoSimulacion }) {
  const currentIndex = simulationStages.indexOf(estado);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-100/50 p-3 dark:border-white/10 dark:bg-black/10">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Flujo de simulacion
      </div>
      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {simulationStages.map((stage, index) => {
            const isCurrent = index === currentIndex;
            const isDone = currentIndex > -1 && index < currentIndex;
            const Icon = isCurrent ? Radio : isDone ? CheckCircle2 : Circle;
            const className = isCurrent
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"
              : isDone
                ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100"
                : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400";

            return (
              <div
                key={stage}
                className={`flex min-h-11 w-28 shrink-0 items-center gap-2 rounded-md border px-2 py-2 text-[10px] font-semibold leading-tight sm:w-auto sm:text-xs ${className}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2 break-words">
                  {estadoLabels[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
