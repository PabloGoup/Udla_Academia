import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { SettingsPanel } from "@/components/academic/settings-panel";

export const metadata: Metadata = {
  title: "Configuración | UDLA Academia",
  description:
    "Parámetros institucionales y operativos del restaurante académico.",
};

export default function ConfiguracionPage() {
  return (
    <AcademicPageShell
      title="Configuración institucional"
      subtitle="Administra el perfil del restaurante, impuestos y datos de operación."
    >
      <SettingsPanel />
    </AcademicPageShell>
  );
}
