import { MapPin } from "lucide-react";
import { areaLabels } from "@/lib/academic-labels";
import type { PanelAlumnoAcademico } from "@/lib/academic-types";
import type { StudentDashboardMetrics } from "@/lib/student-academic-dashboard";
import {
  AreaStatusBadge,
  CompactStat,
  StatusBadge,
} from "@/components/academic/academic-ui";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function StudentOverview({
  panel,
  metrics,
}: {
  panel: PanelAlumnoAcademico;
  metrics: StudentDashboardMetrics;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-600">
              Clase cargada
            </div>
            <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {panel.simulacion.nombre_simulacion ?? panel.simulacion.id_simulacion}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {panel.simulacion.tipo_servicio}
            </p>
          </div>
          <StatusBadge estado={panel.simulacion.estado} />
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-start gap-3">
            {panel.perfil.foto_perfil_url ? (
              <div
                className="h-12 w-12 shrink-0 rounded-full border border-slate-200 bg-cover bg-center shadow-sm dark:border-white/10"
                style={{ backgroundImage: `url("${panel.perfil.foto_perfil_url}")` }}
                aria-label={`Foto de ${panel.perfil.nombre_completo}`}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-sm font-black text-[var(--udla-orange)] dark:border-orange-500/20 dark:bg-orange-500/10">
                {getInitials(panel.perfil.nombre_completo)}
              </div>
            )}
            <span className="hidden rounded-lg border border-sky-200 bg-sky-50 p-2 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200 sm:inline-flex">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-black uppercase tracking-wide text-slate-950 dark:text-white">
                {panel.rol.rol_asignado}
              </div>
              <p className="mt-1 break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
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
