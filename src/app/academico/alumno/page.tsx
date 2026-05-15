import type { Metadata } from "next";
import { StudentAcademicDashboard } from "@/components/academic/student-dashboard";

export const metadata: Metadata = {
  title: "Panel alumno | UDLA Academia",
  description:
    "Portal del alumno para ingresar a simulaciones gastronomicas academicas.",
};

export default function AcademicStudentPage() {
  return <StudentAcademicDashboard />;
}
