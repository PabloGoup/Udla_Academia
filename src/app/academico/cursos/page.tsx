import type { Metadata } from "next";
import { CourseManager } from "@/components/academic/course-manager";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";

export const metadata: Metadata = {
  title: "Cursos y secciones | UDLA Academia",
  description:
    "Gestión de cursos, secciones y clases para simulaciones gastronómicas académicas.",
};

export default function CursosPage() {
  return (
    <AcademicPageShell
      title="Cursos, secciones y clases"
      subtitle="Gestiona la estructura académica: cursos, secciones, clases y su asociación con profesores y simulaciones."
    >
      <CourseManager />
    </AcademicPageShell>
  );
}
