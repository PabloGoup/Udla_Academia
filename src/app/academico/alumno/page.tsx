import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { StudentAcademicDashboard } from "@/components/academic/student-dashboard";

export const metadata: Metadata = {
  title: "Panel alumno | UDLA Academia",
  description:
    "Portal del alumno para ingresar a simulaciones gastronomicas academicas.",
};

export default function AcademicStudentPage() {
  return (
    <AcademicPageShell
      title="Portal alumno"
      subtitle="Vista conectada de rol, área, tareas, evaluaciones e historial de participación."
    >
      <StudentAcademicDashboard />
    </AcademicPageShell>
  );
}
