"use client";

import {
  Activity,
  AlertTriangle,
  ListChecks,
  ShieldCheck,
  Users,
  Timer,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { areaLabels, imprevistoLabels } from "@/lib/academic-labels";
import type {
  DetalleSimulacionAcademica,
  ReporteAcademicoSimulacion,
  TrazabilidadAcademica,
} from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  StatusBadge,
  MetricCard,
} from "@/components/ui/academic-ui-kit";
import { SimulationStateActions } from "@/components/academic/simulation-state-actions";
import { SimulationStageRail } from "@/components/academic/simulation-stage-rail";

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ActiveSimulationPanel({
  report,
  detail,
  onStateChanged,
}: {
  report: ReporteAcademicoSimulacion;
  detail: DetalleSimulacionAcademica;
  onStateChanged: () => Promise<void>;
}) {
  const activeIncidents = detail.imprevistos.filter(
    (incident) => incident.estado === "activo",
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Resumen de Métricas */}
      <div className="grid grid-cols-4 gap-4 md:grid-cols-4">
        <MetricCard 
          label="Alumnos" 
          value={report.alumnos_asignados} 
          icon={<Users className="h-4 w-4" />} 
          tone="sky"
        />
        <MetricCard 
          label="Venta Operativa" 
          value={`$${report.venta_operativa_total.toLocaleString("es-CL")}`} 
          icon={<Zap className="h-4 w-4" />} 
          tone="emerald"
        />
        <MetricCard 
          label="Imprevistos" 
          value={activeIncidents.length} 
          icon={<AlertTriangle className="h-4 w-4" />} 
          tone="amber"
        />
        <MetricCard 
          label="Acciones" 
          value={report.acciones_registradas} 
          icon={<Activity className="h-4 w-4" />} 
          tone="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Columna Principal: Estado y Roles */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AcademicCard className="border-t-4 border-t-emerald-500">
            <AcademicCardHeader 
              title="Centro de Control de Simulación" 
              subtitle={`${report.nombre_curso} · ${report.nombre_clase}`}
              action={<StatusBadge label={report.estado.toUpperCase()} tone="emerald" />}
            />
            <AcademicCardBody className="flex flex-col gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <LayoutDashboard className="h-3 w-3" /> Progreso de la Etapa
                </div>
                <SimulationStageRail estado={report.estado} />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Zap className="h-3 w-3 text-orange-500" /> Acciones de Estado
                  </div>
                  <SimulationStateActions
                    idSimulacion={report.id_simulacion}
                    estado={report.estado}
                    onStateChanged={onStateChanged}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Timer className="h-3 w-3 text-sky-500" /> Monitoreo de Áreas
                  </div>
                  <div className="grid gap-2">
                    {detail.areas.map((area) => (
                      <div
                        key={area.id_area_simulacion}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-white/5 dark:bg-white/[0.02]"
                      >
                        <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                          {areaLabels[area.area_trabajo] || area.area_trabajo}
                        </span>
                        <div className={`h-2 w-2 rounded-full ${area.estado === "lista" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AcademicCardBody>
          </AcademicCard>

          <AcademicCard>
            <AcademicCardHeader 
              title="Equipo de Trabajo" 
              subtitle={`${detail.roles.length} alumnos en sus puestos operativos`}
            />
            <AcademicCardBody className="p-0">
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/5">
                {detail.roles.map((role) => (
                  <div
                    key={role.id_rol_simulacion}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                      {role.nombre_alumno.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {role.nombre_alumno}
                      </div>
                      <div className="text-[10px] font-bold text-orange-600 uppercase">
                        {role.rol_asignado} · {areaLabels[role.area_trabajo] || role.area_trabajo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AcademicCardBody>
          </AcademicCard>
        </div>

        {/* Columna Lateral: Imprevistos y Evaluaciones */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AcademicCard className="border-l-4 border-l-amber-500">
            <AcademicCardHeader 
              title="Imprevistos Activos" 
              action={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            />
            <AcademicCardBody className="space-y-4">
              {activeIncidents.length > 0 ? (
                activeIncidents.map((incident) => (
                  <div
                    key={incident.id_imprevisto}
                    className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5 animate-pulse"
                  >
                    <div className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">
                      {imprevistoLabels[incident.tipo_imprevisto] || incident.tipo_imprevisto}
                    </div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700 dark:text-amber-50/70">
                      {incident.descripcion}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center flex flex-col items-center gap-2 grayscale opacity-40">
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sin incidencias</span>
                </div>
              )}
            </AcademicCardBody>
          </AcademicCard>

          <AcademicCard>
            <AcademicCardHeader 
              title="Evaluaciones" 
              action={<ListChecks className="h-5 w-5 text-sky-500" />}
            />
            <AcademicCardBody className="space-y-3">
              {detail.evaluaciones.length > 0 ? (
                detail.evaluaciones.map((evaluation) => (
                  <div
                    key={evaluation.id_evaluacion}
                    className="flex flex-col gap-1 p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-white/5 dark:bg-white/[0.02]"
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {evaluation.titulo}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {evaluation.puntaje_maximo} PTS MAX
                      </span>
                      <StatusBadge label={evaluation.estado} tone="sky" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sin evaluaciones
                </p>
              )}
            </AcademicCardBody>
          </AcademicCard>
        </div>

        {/* Trazabilidad: Ancho completo al final */}
        <div className="lg:col-span-12">
          <AcademicCard>
            <AcademicCardHeader 
              title="Trazabilidad Académica" 
              subtitle="Registro histórico de acciones durante la simulación"
              action={<Activity className="h-5 w-5 text-purple-500" />}
            />
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {detail.trazabilidad.length > 0 ? (
                detail.trazabilidad.slice(0, 8).map((trace) => (
                  <TraceRow key={trace.id_trazabilidad} trace={trace} />
                ))
              ) : (
                <div className="p-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40">
                  Esperando acciones de los alumnos...
                </div>
              )}
            </div>
          </AcademicCard>
        </div>
      </div>
    </div>
  );
}

function TraceRow({ trace }: { trace: TrazabilidadAcademica }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {trace.modulo} · {trace.accion}
          </div>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {trace.observacion || "Acción registrada en el simulador."}
          </p>
          <div className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter sm:hidden">
            {dateTimeFormatter.format(new Date(trace.fecha_hora))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {dateTimeFormatter.format(new Date(trace.fecha_hora))}
          </div>
          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">
            {trace.rol ?? "Administración"}
          </div>
        </div>
        <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-sm">
           {/* Placeholder para avatar de alumno */}
        </div>
      </div>
    </div>
  );
}
