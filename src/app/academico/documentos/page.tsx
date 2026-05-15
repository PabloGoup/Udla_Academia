import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { DocumentsPanel } from "@/components/academic/documents-panel";

export const metadata: Metadata = {
  title: "Documentos | UDLA Academia",
  description:
    "Comandas, comprobantes y respaldos operativos de la simulación académica.",
};

export default function DocumentosPage() {
  return (
    <AcademicPageShell
      title="Documentos operativos"
      subtitle="Revisa comandas, pre-cuentas y comprobantes generados durante el servicio."
    >
      <DocumentsPanel />
    </AcademicPageShell>
  );
}
