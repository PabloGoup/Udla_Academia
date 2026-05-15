import {
  listarReportesAcademicosSimulacion,
  obtenerDetalleSimulacionAcademica,
} from "@/lib/academic-operations";
import type {
  DetalleSimulacionAcademica,
  ReporteAcademicoSimulacion,
} from "@/lib/academic-types";

export type AcademicDashboardState = "loading" | "ready" | "error";

export interface AcademicDashboardTotals {
  simulaciones: number;
  alumnos: number;
  acciones: number;
  pedidos: number;
  ventas: number;
  movimientos: number;
  imprevistos: number;
  feedbacks: number;
  respuestas: number;
  satisfaccionPromedio: number;
  satisfaccionConteo: number;
}

export interface AcademicDashboardData {
  reports: ReporteAcademicoSimulacion[];
  detail: DetalleSimulacionAcademica | null;
}

export async function loadAcademicDashboardData(): Promise<AcademicDashboardData> {
  const reports = await listarReportesAcademicosSimulacion();
  const activeReport = selectActiveAcademicReport(reports);
  const detail = activeReport
    ? await obtenerDetalleSimulacionAcademica(activeReport.id_simulacion)
    : null;

  return { reports, detail };
}

export function selectActiveAcademicReport(
  reports: ReporteAcademicoSimulacion[],
): ReporteAcademicoSimulacion | undefined {
  return reports.find((report) => report.estado === "servicio_activo") ?? reports[0];
}

export function calculateAcademicDashboardTotals(
  reports: ReporteAcademicoSimulacion[],
): AcademicDashboardTotals {
  const summary = reports.reduce(
    (totals, report) => {
      totals.simulaciones += 1;
      totals.alumnos += report.alumnos_asignados;
      totals.acciones += report.acciones_registradas;
      totals.pedidos += report.pedidos_operativos;
      totals.ventas += report.venta_operativa_total;
      totals.movimientos += report.movimientos_bodega;
      totals.imprevistos += report.imprevistos_activos;
      totals.feedbacks += report.feedbacks_comensal;
      totals.respuestas += report.respuestas_evaluacion;

      if (typeof report.satisfaccion_promedio === "number") {
        totals.satisfaccionAcumulada += report.satisfaccion_promedio;
        totals.satisfaccionConteo += 1;
      }

      return totals;
    },
    {
      simulaciones: 0,
      alumnos: 0,
      acciones: 0,
      pedidos: 0,
      ventas: 0,
      movimientos: 0,
      imprevistos: 0,
      feedbacks: 0,
      respuestas: 0,
      satisfaccionAcumulada: 0,
      satisfaccionConteo: 0,
    },
  );

  return {
    simulaciones: summary.simulaciones,
    alumnos: summary.alumnos,
    acciones: summary.acciones,
    pedidos: summary.pedidos,
    ventas: summary.ventas,
    movimientos: summary.movimientos,
    imprevistos: summary.imprevistos,
    feedbacks: summary.feedbacks,
    respuestas: summary.respuestas,
    satisfaccionConteo: summary.satisfaccionConteo,
    satisfaccionPromedio:
      summary.satisfaccionConteo > 0
        ? summary.satisfaccionAcumulada / summary.satisfaccionConteo
        : 0,
  };
}
