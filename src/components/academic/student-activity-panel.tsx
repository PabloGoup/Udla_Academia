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
      <article className="rounded-lg border border-white/10 bg-[#101722] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <ClipboardCheck className="h-4 w-4 text-emerald-300" />
          Evaluaciones
        </div>
        <div className="mt-3 space-y-3">
          {panel.evaluaciones.length > 0 ? (
            panel.evaluaciones.map((evaluation) => (
              <div
                key={evaluation.id_evaluacion}
                className="rounded-md border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="text-sm font-semibold text-white">
                  {evaluation.titulo}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {evaluation.puntaje_maximo} pts · {evaluation.estado}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              No hay evaluaciones publicadas para tu rol.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-lg border border-white/10 bg-[#101722] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          Imprevistos del area
        </div>
        <div className="mt-3 space-y-3">
          {panel.imprevistos.length > 0 ? (
            panel.imprevistos.map((incident) => (
              <div
                key={incident.id_imprevisto}
                className="rounded-md border border-amber-400/20 bg-amber-400/10 p-3"
              >
                <div className="text-sm font-semibold text-amber-100">
                  {imprevistoLabels[incident.tipo_imprevisto]}
                </div>
                <p className="mt-1 text-sm leading-6 text-amber-50/80">
                  {incident.descripcion}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              No hay imprevistos asociados a tu area.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-lg border border-white/10 bg-[#101722] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-sky-300" />
          Historial reciente
        </div>
        <div className="mt-3 space-y-3">
          {panel.trazabilidad.length > 0 ? (
            panel.trazabilidad.slice(0, 5).map((trace) => (
              <div
                key={trace.id_trazabilidad}
                className="rounded-md border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="text-xs text-slate-500">
                  {dateTimeFormatter.format(new Date(trace.fecha_hora))}
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {trace.modulo} · {trace.accion}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {trace.observacion || "Accion registrada."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              Aun no hay acciones registradas para tu participacion.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
