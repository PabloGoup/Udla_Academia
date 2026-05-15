import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { EmployeesPanel } from "@/components/academic/employees-panel";

export const metadata: Metadata = {
  title: "Personal | UDLA Academia",
  description:
    "Vista de dotación, roles y estado operativo del personal de la simulación.",
};

export default function PersonalPage() {
  return (
    <AcademicPageShell
      title="Personal operativo"
      subtitle="Monitorea roles, estado y costo/hora del equipo en servicio."
    >
      <EmployeesPanel />
    </AcademicPageShell>
  );
}
