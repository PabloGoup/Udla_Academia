import { Activity, AlertTriangle, ClipboardCheck } from "lucide-react";
import { imprevistoLabels } from "@/lib/academic-labels";
import type { PanelAlumnoAcademico } from "@/lib/academic-types";

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});

export function StudentActivityPanel({
  panel,
}: {
  panel: PanelAlumnoAcademico;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
          <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          Evaluaciones
        </div>
        <div className="mt-3 space-y-3">
          {panel.evaluaciones.length > 0 ? (
            panel.evaluaciones.map((evaluation) => (
              <div
                key={evaluation.id_evaluacion}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="text-sm font-bold text-slate-950 dark:text-white">
                  {evaluation.titulo}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {evaluation.puntaje_maximo} pts · {evaluation.estado}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              No hay evaluaciones publicadas para tu rol.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Imprevistos del área
        </div>
        <div className="mt-3 space-y-3">
          {panel.imprevistos.length > 0 ? (
            panel.imprevistos.map((incident) => (
              <div
                key={incident.id_imprevisto}
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
              >
                <div className="text-sm font-bold">
                  {imprevistoLabels[incident.tipo_imprevisto]}
                </div>
                <p className="mt-1 text-sm leading-6 opacity-80">
                  {incident.descripcion}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              No hay imprevistos asociados a tu área.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
          <Activity className="h-4 w-4 text-sky-600" />
          Historial reciente
        </div>
        <div className="mt-3 space-y-3">
          {panel.trazabilidad.length > 0 ? (
            panel.trazabilidad.slice(0, 5).map((trace) => (
              <div
                key={trace.id_trazabilidad}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="text-xs font-semibold text-slate-500">
                  {dateTimeFormatter.format(new Date(trace.fecha_hora))}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
                  {trace.modulo} · {trace.accion}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {trace.observacion || "Acción registrada."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Aún no hay acciones registradas para tu participación.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
