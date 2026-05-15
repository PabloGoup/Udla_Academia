import { MapPin } from "lucide-react";
import { areaLabels } from "@/lib/academic-labels";
import type { PanelAlumnoAcademico } from "@/lib/academic-types";
import type { StudentDashboardMetrics } from "@/lib/student-academic-dashboard";
import {
  AreaStatusBadge,
  CompactStat,
  StatusBadge,
} from "@/components/academic/academic-ui";

export function StudentOverview({
  panel,
  metrics,
}: {
  panel: PanelAlumnoAcademico;
  metrics: StudentDashboardMetrics;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-lg border border-white/10 bg-[#101722] p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-emerald-300">
              Clase cargada
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {panel.simulacion.id_simulacion}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {panel.simulacion.tipo_servicio}
            </p>
          </div>
          <StatusBadge estado={panel.simulacion.estado} />
        </div>

        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start gap-3">
            <span className="rounded-md border border-sky-400/20 bg-sky-400/10 p-2 text-sky-200">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">
                {panel.rol.rol_asignado}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {panel.perfil.nombre_completo} ·{" "}
                {areaLabels[panel.rol.area_trabajo]}
              </p>
              {panel.area ? (
                <div className="mt-3">
                  <AreaStatusBadge estado={panel.area.estado} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
        <CompactStat label="Area" value={metrics.areaLabel} />
        <CompactStat
          label="Evaluaciones"
          value={String(metrics.evaluations)}
        />
        <CompactStat
          label="Imprevistos activos"
          value={String(metrics.activeIncidents)}
        />
        <CompactStat label="Acciones registradas" value={String(metrics.traces)} />
      </div>
    </section>
  );
}
