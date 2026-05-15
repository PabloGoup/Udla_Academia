import type { Metadata } from "next";
import { StudentManager } from "@/components/academic/student-manager";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";

export const metadata: Metadata = {
  title: "Alumnos | UDLA Academia",
  description:
    "Gestión de alumnos: creación, importación, exportación y asignación a secciones.",
};

export default function AlumnosPage() {
  return (
    <AcademicPageShell
      title="Gestión de alumnos"
      subtitle="Crea, importa y exporta alumnos. Asocia alumnos a secciones y cursos."
    >
      <StudentManager />
    </AcademicPageShell>
  );
}
