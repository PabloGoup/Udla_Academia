import { areaLabels, estadoLabels } from "@/lib/academic-labels";
import type { PanelAlumnoAcademico } from "@/lib/academic-types";

export type StudentTaskTone = "ready" | "attention" | "pending";

export interface StudentTask {
  title: string;
  detail: string;
  tone: StudentTaskTone;
}

export interface StudentDashboardMetrics {
  activeIncidents: number;
  evaluations: number;
  traces: number;
  areaLabel: string;
}

export function calculateStudentDashboardMetrics(
  panel: PanelAlumnoAcademico,
): StudentDashboardMetrics {
  return {
    activeIncidents: panel.imprevistos.filter(
      (incident) => incident.estado === "activo",
    ).length,
    evaluations: panel.evaluaciones.length,
    traces: panel.trazabilidad.length,
    areaLabel: areaLabels[panel.rol.area_trabajo],
  };
}

export function buildStudentTasks(panel: PanelAlumnoAcademico): StudentTask[] {
  const areaLabel = areaLabels[panel.rol.area_trabajo];
  const tasks: StudentTask[] = [
    {
      title: `Operar area ${areaLabel}`,
      detail: `Rol asignado: ${panel.rol.rol_asignado}. Estado de simulacion: ${
        estadoLabels[panel.simulacion.estado]
      }.`,
      tone: panel.simulacion.estado === "servicio_activo" ? "ready" : "pending",
    },
  ];

  if (panel.simulacion.estado === "pre_servicio") {
    tasks.push({
      title: "Confirmar condiciones de pre servicio",
      detail:
        panel.area?.observacion ||
        "Revisar insumos, carta, mise en place y faltantes del area.",
      tone: panel.area?.estado === "lista" ? "ready" : "attention",
    });
  }

  if (panel.simulacion.estado === "servicio_activo") {
    tasks.push({
      title: "Registrar acciones operativas",
      detail:
        "Cada entrega, ajuste, merma o respuesta relevante debe quedar trazada.",
      tone: panel.trazabilidad.length > 0 ? "ready" : "attention",
    });
  }

  if (panel.imprevistos.some((incident) => incident.estado === "activo")) {
    tasks.push({
      title: "Responder imprevisto activo",
      detail:
        "Revisar el panel del profesor y documentar la accion tomada por el area.",
      tone: "attention",
    });
  }

  if (panel.evaluaciones.length > 0) {
    tasks.push({
      title: "Revisar evaluacion publicada",
      detail: `${panel.evaluaciones.length} instrumento(s) asociado(s) a esta simulacion.`,
      tone: "pending",
    });
  }

  return tasks;
}
