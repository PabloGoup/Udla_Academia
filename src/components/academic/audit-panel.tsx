"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ShieldCheck, UserRoundSearch } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import { listarTrazabilidad } from "@/lib/trazabilidad-mutations";
import type { Trazabilidad } from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  MetricCard,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

export function AuditPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [academicTrace, setAcademicTrace] = useState<Trazabilidad[]>([]);

  useEffect(() => {
    let ignore = false;
    void Promise.all([loadRestaurantSnapshot(), listarTrazabilidad()])
      .then(([data, trace]) => {
        if (ignore) return;
        setSnapshot(data);
        setAcademicTrace(trace);
      })
      .catch(() => {
        if (!ignore) setAcademicTrace([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const latestAudit = useMemo(() => snapshot?.auditLogs.slice(0, 12) ?? [], [snapshot]);
  const latestTrace = useMemo(() => academicTrace.slice(0, 12), [academicTrace]);

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando auditoría...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Audit logs"
          value={String(snapshot.auditLogs.length)}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Trazabilidad académica"
          value={String(academicTrace.length)}
          icon={<Activity className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Actores únicos"
          value={String(new Set(snapshot.auditLogs.map((item) => item.actor)).size)}
          icon={<UserRoundSearch className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Fuente"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AcademicCard>
          <AcademicCardHeader
            title="Auditoría operativa"
            subtitle="Eventos provenientes del motor de restaurante."
          />
          <AcademicCardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {latestAudit.length === 0 ? (
                <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Sin eventos.
                </div>
              ) : (
                latestAudit.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.summary}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.actor} · {item.action}
                      </p>
                    </div>
                    <StatusBadge label={item.entityType} tone="zinc" />
                  </div>
                ))
              )}
            </div>
          </AcademicCardBody>
        </AcademicCard>

        <AcademicCard>
          <AcademicCardHeader
            title="Trazabilidad académica"
            subtitle="Eventos del flujo de clase/simulación."
          />
          <AcademicCardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {latestTrace.length === 0 ? (
                <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Sin trazas.
                </div>
              ) : (
                latestTrace.map((item) => (
                  <div
                    key={item.id_trazabilidad}
                    className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.accion}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.modulo} · {item.observacion || "Sin observación"}
                      </p>
                    </div>
                    <StatusBadge label={item.modulo} tone="zinc" />
                  </div>
                ))
              )}
            </div>
          </AcademicCardBody>
        </AcademicCard>
      </div>
    </div>
  );
}
