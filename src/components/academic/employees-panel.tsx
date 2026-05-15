"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, UserCog, Users } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  MetricCard,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

export function EmployeesPanel() {
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

  const employees = useMemo(() => snapshot?.employees ?? [], [snapshot]);
  const activeCount = useMemo(
    () => employees.filter((employee) => employee.status === "active").length,
    [employees],
  );
  const totalHourly = useMemo(
    () => employees.reduce((acc, employee) => acc + employee.hourlyCost, 0),
    [employees],
  );

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando personal...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Colaboradores"
          value={String(employees.length)}
          icon={<Users className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Activos"
          value={String(activeCount)}
          icon={<UserCog className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Costo/hora total"
          value={`$${Math.round(totalHourly).toLocaleString("es-CL")}`}
          icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
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
          title="Dotación operativa"
          subtitle="Distribución de roles y estado actual."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {employee.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {employee.role} · {employee.shift}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    ${Math.round(employee.hourlyCost).toLocaleString("es-CL")}/h
                  </span>
                  <StatusBadge
                    label={employee.status}
                    tone={
                      employee.status === "active"
                        ? "emerald"
                        : employee.status === "break"
                          ? "amber"
                          : "zinc"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </AcademicCardBody>
      </AcademicCard>
    </div>
  );
}
