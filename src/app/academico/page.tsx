import type { Metadata } from "next";
import { TeacherAcademicDashboard } from "@/components/academic/teacher-dashboard";

export const metadata: Metadata = {
  title: "Dashboard academico | UDLA Academia",
  description:
    "Panel docente para monitorear simulaciones gastronomicas academicas.",
};

export default function AcademicPage() {
  return <TeacherAcademicDashboard />;
}
