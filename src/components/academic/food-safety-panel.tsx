"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldX, Thermometer } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  MetricCard,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

export function FoodSafetyPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);

  useEffect(() => {
    let ignore = false;
    void loadRestaurantSnapshot().then((data) => {
      if (!ignore) setSnapshot(data);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const logs = useMemo(() => snapshot?.foodSafetyLogs ?? [], [snapshot]);
  const warnings = useMemo(
    () => logs.filter((log) => log.result === "warning" || log.result === "critical"),
    [logs],
  );

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando inocuidad...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Controles"
          value={String(logs.length)}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Alertas"
          value={String(warnings.length)}
          icon={<ShieldX className="h-3.5 w-3.5" />}
          tone={warnings.length ? "red" : "zinc"}
        />
        <MetricCard
          label="Riesgo alto"
          value={String(snapshot.rawMaterials.filter((item) => item.sanitaryRisk === "high").length)}
          icon={<Thermometer className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Fuente"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Bitácora sanitaria reciente"
          subtitle="Controles de recepción, temperatura y segregación de alérgenos."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {logs.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin controles registrados.
              </div>
            ) : (
              logs.slice(0, 12).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {log.materialName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {log.checkType} · {log.measuredTemperature}
                    </p>
                  </div>
                  <StatusBadge
                    label={log.result}
                    tone={
                      log.result === "critical"
                        ? "red"
                        : log.result === "warning"
                          ? "amber"
                          : "emerald"
                    }
                  />
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>
    </div>
  );
}
