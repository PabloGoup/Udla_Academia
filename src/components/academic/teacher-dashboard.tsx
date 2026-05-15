"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateAcademicDashboardTotals,
  loadAcademicDashboardData,
  selectActiveAcademicReport,
  type AcademicDashboardState,
} from "@/lib/academic-dashboard";
import type {
  DetalleSimulacionAcademica,
  ReporteAcademicoSimulacion,
} from "@/lib/academic-types";
import { ActiveSimulationPanel } from "@/components/academic/active-simulation-panel";
import { DashboardMetrics } from "@/components/academic/dashboard-metrics";
import { SimulationList } from "@/components/academic/simulation-list";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { VisualPanelsCarousel } from "@/components/academic/visual-panels-carousel";

export function TeacherAcademicDashboard() {
  const [state, setState] = useState<AcademicDashboardState>("loading");
  const [reports, setReports] = useState<ReporteAcademicoSimulacion[]>([]);
  const [detail, setDetail] = useState<DetalleSimulacionAcademica | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const applyDashboardData = useCallback(
    (nextDashboard: {
      reports: ReporteAcademicoSimulacion[];
      detail: DetalleSimulacionAcademica | null;
    }) => {
      setReports(nextDashboard.reports);
      setDetail(nextDashboard.detail);
      setState("ready");
    },
    [],
  );

  const loadReports = useCallback(async () => {
    setState("loading");
    setErrorMessage("");

    try {
      applyDashboardData(await loadAcademicDashboardData());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el panel académico.",
      );
      setState("error");
    }
  }, [applyDashboardData]);

  useEffect(() => {
    let ignore = false;

    loadAcademicDashboardData()
      .then((nextDashboard) => {
        if (!ignore) {
          applyDashboardData(nextDashboard);
        }
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el panel académico.",
        );
        setState("error");
      });

    return () => {
      ignore = true;
    };
  }, [applyDashboardData]);

  const totals = useMemo(
    () => calculateAcademicDashboardTotals(reports),
    [reports],
  );
  const activeReport = selectActiveAcademicReport(reports);

  return (
    <AcademicPageShell
      title="Dashboard docente de simulaciones"
      subtitle="Monitoreo integrado de clases, alumnos, pedidos, bodega, feedback, imprevistos y evaluaciones desde la capa académica."
    >
      {/* Refresh button */}
      <div className="flex justify-end -mt-2">
        <button
          type="button"
          onClick={() => void loadReports()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      <div className="mt-3">
        <VisualPanelsCarousel />
      </div>

      <DashboardMetrics totals={totals} />

      {state === "ready" && activeReport && detail ? (
        <ActiveSimulationPanel
          report={activeReport}
          detail={detail}
          onStateChanged={loadReports}
        />
      ) : null}

      <SimulationList
        state={state}
        reports={reports}
        errorMessage={errorMessage}
      />
    </AcademicPageShell>
  );
}
