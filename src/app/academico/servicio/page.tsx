"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Coffee, UtensilsCrossed, LayoutGrid, Wallet, FileText, BarChart3 } from "lucide-react";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { SalonMap } from "@/components/academic/salon-map";
import { KitchenDisplay } from "@/components/academic/kitchen-display";
import { listarSimulaciones } from "@/lib/simulation-mutations";
import { Button, Select, StatusBadge } from "@/components/ui/academic-ui-kit";
import type { Simulacion } from "@/lib/academic-types";
import { SimulationStageRail } from "@/components/academic/simulation-stage-rail";


type ViewMode = "salon" | "kds-cocina" | "kds-bar";

export default function ServicioPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("salon");
  const [simulaciones, setSimulaciones] = useState<Simulacion[]>([]);
  const [selectedSimId, setSelectedSimId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await listarSimulaciones();
        if (cancelled) return;
        setSimulaciones(data);
        const preferred =
          data.find((sim) => sim.estado === "servicio_activo")?.id_simulacion ??
          data[0]?.id_simulacion ??
          "";
        setSelectedSimId(preferred);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSimulation = useMemo(
    () =>
      simulaciones.find((sim) => sim.id_simulacion === selectedSimId) ?? null,
    [simulaciones, selectedSimId],
  );
  const canOperateService = selectedSimulation?.estado === "servicio_activo";

  return (
    <AcademicPageShell
      title="Operación de Servicio"
      subtitle="Entorno de simulación operativa: toma de pedidos, gestión de mesas y visualización de comandas (KDS)."
    >
      <div className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Simulación activa
          </span>
          <Select
            value={selectedSimId}
            onChange={(event) => setSelectedSimId(event.target.value)}
            disabled={loading || simulaciones.length === 0}
          >
            {simulaciones.length === 0 ? (
              <option value="">Sin simulaciones disponibles</option>
            ) : null}
            {simulaciones.map((simulacion) => (
              <option
                key={simulacion.id_simulacion}
                value={simulacion.id_simulacion}
              >
                {simulacion.nombre_simulacion ?? simulacion.tipo_servicio} ·{" "}
                {simulacion.estado}
              </option>
            ))}
          </Select>
        </div>
        {selectedSimulation ? (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Estado:
            </span>
            <StatusBadge label={selectedSimulation.estado} tone="sky" />
          </div>
        ) : null}
      </div>

      {selectedSimulation ? (
        <div className="mb-6">
          <SimulationStageRail estado={selectedSimulation.estado} />
        </div>
      ) : null}

      {selectedSimulation && !canOperateService ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          La simulación está en <strong>{selectedSimulation.estado}</strong>. Para operar POS/KDS debe estar en{" "}
          <strong>servicio_activo</strong>.
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-4 gap-3 sm:grid-cols-4">
        <Link
          href="/academico/caja"
          className="col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:col-span-1"
        >
          <span className="inline-flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Caja
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Ir</span>
        </Link>
        <Link
          href="/academico/documentos"
          className="col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:col-span-1"
        >
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Ir</span>
        </Link>
        <Link
          href="/academico/reportes"
          className="col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:col-span-1"
        >
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Ir</span>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
        <Button
          variant={viewMode === "salon" ? "primary" : "ghost"}
          icon={<LayoutGrid className="h-4 w-4" />}
          onClick={() => setViewMode("salon")}
        >
          Salón y Mesas (POS)
        </Button>
        <Button
          variant={viewMode === "kds-cocina" ? "primary" : "ghost"}
          icon={<UtensilsCrossed className="h-4 w-4" />}
          onClick={() => setViewMode("kds-cocina")}
        >
          KDS Cocina
        </Button>
        <Button
          variant={viewMode === "kds-bar" ? "primary" : "ghost"}
          icon={<Coffee className="h-4 w-4" />}
          onClick={() => setViewMode("kds-bar")}
        >
          KDS Barra
        </Button>
      </div>

      {!selectedSimId ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
          No hay simulaciones disponibles para operar servicio.
        </div>
      ) : null}

      {selectedSimId && viewMode === "salon" ? (
        <SalonMap id_simulacion={selectedSimId} />
      ) : null}
      {selectedSimId && viewMode === "kds-cocina" ? (
        <KitchenDisplay id_simulacion={selectedSimId} area="cocina" />
      ) : null}
      {selectedSimId && viewMode === "kds-bar" ? (
        <KitchenDisplay id_simulacion={selectedSimId} area="bar" />
      ) : null}
    </AcademicPageShell>
  );
}
