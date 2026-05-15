"use client";

import type {
  AcademicDashboardState,
} from "@/lib/academic-dashboard";
import type { ReporteAcademicoSimulacion } from "@/lib/academic-types";
import {
  CompactStat,
  PanelMessage,
  StatusBadge,
} from "@/components/academic/academic-ui";

export function SimulationList({
  state,
  reports,
  errorMessage,
}: {
  state: AcademicDashboardState;
  reports: ReporteAcademicoSimulacion[];
  errorMessage: string;
}) {
  return (
    <section className="overflow-hidden mt-2 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-[#101722] dark:shadow-2xl dark:shadow-black/20">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Simulaciones Académicas UDLA
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
            Control integrado de pedagogía y operación real.
          </p>
        </div>
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-700 uppercase">
          ERP Académico Full
        </span>
      </div>

      {state === "loading" && <PanelMessage title="Cargando Monitor" message="Cruzando datos de bodega, ventas y alumnos…" />}
      {state === "error" && <PanelMessage title="Error de Sincronización" message={errorMessage} tone="error" />}
      {state === "ready" && reports.length === 0 && <PanelMessage title="Sin simulaciones activas" message="Inicia una clase para comenzar el monitoreo en tiempo real." />}

      {state === "ready" && reports.length > 0 && (
        <>
          <DesktopSimulationTable reports={reports} />
          <MobileSimulationCards reports={reports} />
        </>
      )}
    </section>
  );
}

function DesktopSimulationTable({ reports }: { reports: ReporteAcademicoSimulacion[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[980px] border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
          <tr>
            <th className="px-6 py-4">Simulación / Clase</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Alumnos</th>
            <th className="px-6 py-4 text-right">Venta Bruta</th>
            <th className="px-6 py-4 text-right">Bodega</th>
            <th className="px-6 py-4 text-right">Satisfacción</th>
            <th className="px-6 py-4 text-right">Logs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {reports.map((r) => (
            <tr key={r.id_simulacion} className="text-slate-700 hover:bg-slate-50 transition dark:text-slate-200 dark:hover:bg-white/[0.02]">
              <td className="px-6 py-5">
                <div className="font-bold text-slate-900 dark:text-white uppercase">{r.nombre_simulacion}</div>
                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase">{r.nombre_curso} · {r.nombre_clase}</div>
              </td>
              <td className="px-6 py-5"><StatusBadge estado={r.estado} /></td>
              <td className="px-6 py-5 text-right font-bold">{r.alumnos_asignados}</td>
              <td className="px-6 py-5 text-right font-bold text-emerald-600">${r.venta_operativa_total.toLocaleString("es-CL")}</td>
              <td className="px-6 py-5 text-right font-bold">{r.movimientos_bodega} mov.</td>
              <td className="px-6 py-5 text-right font-bold">{(r.satisfaccion_promedio ?? 0).toFixed(1)} / 5</td>
              <td className="px-6 py-5 text-right font-bold text-orange-600">{r.acciones_registradas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileSimulationCards({ reports }: { reports: ReporteAcademicoSimulacion[] }) {
  return (
    <div className="grid gap-3 p-3 lg:hidden">
      {reports.map((r) => (
        <article key={r.id_simulacion} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">{r.nombre_simulacion}</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase">{r.nombre_curso} · {r.nombre_clase}</p>
            </div>
            <StatusBadge estado={r.estado} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <CompactStat label="Venta" value={`$${r.venta_operativa_total.toLocaleString("es-CL")}`} />
            <CompactStat label="Alumnos" value={r.alumnos_asignados.toString()} />
            <CompactStat label="Satisfacción" value={`${(r.satisfaccion_promedio ?? 0).toFixed(1)} / 5`} />
            <CompactStat label="Registros" value={r.acciones_registradas.toString()} />
          </div>
        </article>
      ))}
    </div>
  );
}
