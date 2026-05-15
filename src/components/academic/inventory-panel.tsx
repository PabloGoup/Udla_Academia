"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, PackageX, ShieldAlert } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  MetricCard,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

export function InventoryPanel() {
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

  const lowStock = useMemo(
    () => (snapshot?.rawMaterials ?? []).filter((material) => material.stock <= material.minStock),
    [snapshot],
  );
  const recentMovements = useMemo(
    () => snapshot?.inventoryMovements.slice(0, 12) ?? [],
    [snapshot],
  );

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando inventario...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Materias primas"
          value={String(snapshot.rawMaterials.length)}
          icon={<Boxes className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Stock crítico"
          value={String(lowStock.length)}
          icon={<PackageX className="h-3.5 w-3.5" />}
          tone={lowStock.length ? "red" : "zinc"}
        />
        <MetricCard
          label="Movimientos"
          value={String(snapshot.inventoryMovements.length)}
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
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
          title="Stock crítico"
          subtitle="Productos con necesidad de reposición o ajuste."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {lowStock.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin alertas de stock crítico.
              </div>
            ) : (
              lowStock.map((material) => (
                <div
                  key={material.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {material.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {material.stock} {material.unit} / mín {material.minStock}
                    </span>
                    <StatusBadge label="Crítico" tone="red" />
                  </div>
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard>
        <AcademicCardHeader
          title="Movimientos recientes"
          subtitle="Trazas de inventario asociadas a servicio."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentMovements.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin movimientos recientes.
              </div>
            ) : (
              recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {movement.materialName}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {movement.type} · {movement.quantity} · {movement.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>
    </div>
  );
}
