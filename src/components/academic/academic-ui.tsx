import type { LucideIcon } from "lucide-react";
import { areaStatusLabels, estadoLabels } from "@/lib/academic-labels";
import type {
  AreaSimulacion,
  ReporteAcademicoSimulacion,
} from "@/lib/academic-types";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "green" | "amber" | "blue";
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: MetricCardProps) {
  const toneClass = {
    neutral: "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300",
    green: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
    amber: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
    blue: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200",
  }[tone];

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-black/[0.03] sm:rounded-xl sm:p-4 dark:border-white/10 dark:bg-white/[0.02] dark:ring-white/[0.02]">
      <div className="flex min-w-0 items-start justify-between gap-1 sm:gap-3">
        <span className="min-w-0 truncate text-[7px] font-bold uppercase leading-tight tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-[0.16em] dark:text-slate-500">
          {label}
        </span>
        <span className={`shrink-0 rounded-md border p-1 shadow-sm sm:rounded-lg sm:p-2 ${toneClass}`}>
          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        </span>
      </div>
      <div className="mt-2 truncate text-sm font-extrabold tracking-tight text-slate-900 sm:mt-4 sm:text-3xl dark:text-white">
        {value}
      </div>
      <p className="mt-1 hidden text-xs font-medium leading-tight text-slate-500 sm:block dark:text-slate-400">
        {detail}
      </p>
    </article>
  );
}

export function StatusBadge({
  estado,
}: {
  estado: ReporteAcademicoSimulacion["estado"];
}) {
  const isLive = estado === "servicio_activo";
  const isClosed =
    estado === "servicio_cerrado" ||
    estado === "reporte_generado" ||
    estado === "evaluacion_finalizada" ||
    estado === "archivada";

  const className = isLive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
    : isClosed
      ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200"
      : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {estadoLabels[estado]}
    </span>
  );
}

export function AreaStatusBadge({
  estado,
}: {
  estado: AreaSimulacion["estado"];
}) {
  const className =
    estado === "lista"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
      : estado === "observada"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        : estado === "cerrada"
          ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {areaStatusLabels[estado]}
    </span>
  );
}

export function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50 p-2 sm:p-3 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="truncate text-[8px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px] dark:text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base dark:text-white">{value}</div>
    </div>
  );
}

export function PanelMessage({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message: string;
  tone?: "neutral" | "error";
}) {
  const className =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
      : "border-slate-100 bg-slate-50 text-slate-700 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-300";

  return (
    <div className="p-6">
      <div className={`rounded-xl border p-6 shadow-sm ring-1 ring-black/[0.02] ${className}`}>
        <div className="font-bold text-slate-900 dark:text-white tracking-tight">{title}</div>
        <p className="mt-2 text-sm font-medium leading-relaxed opacity-80">{message}</p>
      </div>
    </div>
  );
}
