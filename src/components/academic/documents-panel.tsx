"use client";

import { useMemo } from "react";
import { FileBadge2, Printer, ReceiptText } from "lucide-react";
import { useRestaurantSnapshot } from "@/lib/hooks/use-restaurant-snapshot";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  MetricCard,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

export function DocumentsPanel() {
  const { snapshot, loading } = useRestaurantSnapshot();

  const docs = useMemo(
    () => snapshot?.operationalDocuments.slice(0, 16) ?? [],
    [snapshot],
  );

  if (loading || !snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando documentos...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Documentos"
          value={String(snapshot.operationalDocuments.length)}
          icon={<FileBadge2 className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Comandas"
          value={String(snapshot.operationalDocuments.filter((doc) => doc.type === "kitchen_ticket").length)}
          icon={<Printer className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Comprobantes"
          value={String(snapshot.operationalDocuments.filter((doc) => doc.type === "payment_receipt").length)}
          icon={<ReceiptText className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Fuente"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Documentos operativos"
          subtitle="Impresiones y respaldos asociados al servicio."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {docs.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                No hay documentos registrados.
              </div>
            ) : (
              docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                      {doc.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {doc.createdAt}
                    </p>
                  </div>
                  <StatusBadge label={doc.type} tone="zinc" />
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>
    </div>
  );
}
