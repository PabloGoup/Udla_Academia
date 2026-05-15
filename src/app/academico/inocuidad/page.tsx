import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { FoodSafetyPanel } from "@/components/academic/food-safety-panel";

export const metadata: Metadata = {
  title: "Inocuidad | UDLA Academia",
  description:
    "Seguimiento de controles de inocuidad y seguridad alimentaria del servicio.",
};

export default function InocuidadPage() {
  return (
    <AcademicPageShell
      title="Inocuidad y seguridad"
      subtitle="Visualiza controles sanitarios, alertas y riesgos de materias primas."
    >
      <FoodSafetyPanel />
    </AcademicPageShell>
  );
}
