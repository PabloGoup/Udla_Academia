"use client";

import { useEffect, useState } from "react";
import {
  Activity,

  ClipboardCheck,
  MessageSquare,
  Users,
  BadgeDollarSign,
  Table2,
  Receipt,
  HeartPulse,
  GraduationCap,

} from "lucide-react";
import { numberFormatter } from "@/lib/costing";
import type { AcademicDashboardTotals } from "@/lib/academic-dashboard";
import { demoPedidos, demoMesas } from "@/lib/demo-data-pos";

export function DashboardMetrics({
  totals,
}: {
  totals: AcademicDashboardTotals;
}) {
  const [opStats, setOpStats] = useState({ ventas: 0, mesasOcupadas: 0, ticketsActivos: 0 });

  useEffect(() => {
    // Simulated fetch of operational live stats from our demo POS
    const ventas = demoPedidos.filter(p => p.estado === "pagado").reduce((acc, p) => acc + p.total, 0);
    const mesasOcupadas = demoMesas.filter(m => m.estado === "ocupada").length;
    const ticketsActivos = demoPedidos.filter(p => p.estado === "abierto").length;
    
    setOpStats({ ventas, mesasOcupadas, ticketsActivos });
    
    // Auto-refresh stats every 5 seconds for realism
    const interval = setInterval(() => {
      setOpStats({
        ventas: demoPedidos.filter(p => p.estado === "pagado").reduce((acc, p) => acc + p.total, 0),
        mesasOcupadas: demoMesas.filter(m => m.estado === "ocupada").length,
        ticketsActivos: demoPedidos.filter(p => p.estado === "abierto").length,
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* ───── PANEL OPERATIVO EN VIVO ───── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" /> En vivo (Operacional del Restaurante)
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <MetricCard
            label="Ventas en Tiempo Real"
            value={`$${opStats.ventas.toLocaleString("es-CL")}`}
            detail={`${opStats.ticketsActivos} cuentas abiertas actualmente`}
            icon={BadgeDollarSign}
            colorClass="border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
            textClass="text-emerald-700 dark:text-emerald-400"
          />
          <MetricCard
            label="Mesas Ocupadas"
            value={String(opStats.mesasOcupadas)}
            detail={`de ${demoMesas.length} mesas totales disponibles`}
            icon={Table2}
            colorClass="border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10"
            textClass="text-orange-700 dark:text-orange-400"
          />
          <MetricCard
            label="Comandas Pendientes"
            value={String(opStats.ticketsActivos)}
            detail="esperando preparación en cocina/barra"
            icon={Receipt}
            colorClass="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
            textClass="text-amber-700 dark:text-amber-400"
          />
          <MetricCard
            label="Estado del Servicio"
            value="Saludable"
            detail="conexión estable con áreas de producción"
            icon={HeartPulse}
            colorClass="border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10"
            textClass="text-sky-700 dark:text-sky-400"
          />
        </div>
      </div>

      {/* ───── PANEL ACADÉMICO ───── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Métricas del Curso (Evaluación Académica)
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <MetricCard
            label="Simulaciones"
            value={numberFormatter.format(totals.simulaciones)}
            detail="sesiones con motor académico"
            icon={ClipboardCheck}
            colorClass="border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
            textClass="text-slate-900 dark:text-white"
          />
          <MetricCard
            label="Alumnos Activos"
            value={numberFormatter.format(totals.alumnos)}
            detail="estudiantes con rol en la simulación"
            icon={Users}
            colorClass="border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
            textClass="text-slate-900 dark:text-white"
          />
          <MetricCard
            label="Métricas Trazadas"
            value={numberFormatter.format(totals.acciones)}
            detail="acciones audítadas por el profesor"
            icon={Activity}
            colorClass="border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
            textClass="text-slate-900 dark:text-white"
          />
          <MetricCard
            label="Satisfacción Comensal"
            value={
              totals.satisfaccionConteo > 0
                ? `${numberFormatter.format(totals.satisfaccionPromedio)} / 5`
                : "Sin datos"
            }
            detail={`${numberFormatter.format(totals.feedbacks)} feedbacks recopilados`}
            icon={MessageSquare}
            colorClass="border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
            textClass="text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  colorClass = "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5",
  textClass = "text-slate-900 dark:text-white"
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  colorClass?: string;
  textClass?: string;
}) {
  return (
    <div className={`col-span-1 min-w-0 overflow-hidden flex flex-col gap-2 rounded-xl border p-2 shadow-sm ring-1 ring-black/[0.02] transition-all hover:shadow-md sm:gap-3 sm:p-5 dark:ring-white/[0.02] ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold uppercase leading-tight tracking-[0.08em] opacity-60 sm:text-[10px]">
          {label}
        </span>
        <div className={`p-2 rounded-lg bg-white shadow-sm ring-1 ring-black/5 dark:bg-black/20 ${textClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className={`text-sm font-extrabold leading-none tracking-tight sm:text-3xl ${textClass}`}>
        {value}
      </div>
      <div className="hidden text-[9px] font-bold uppercase leading-tight tracking-wide opacity-50 sm:block sm:text-[10px]">
        {detail}
      </div>
    </div>
  );
}
