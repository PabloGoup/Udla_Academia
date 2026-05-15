import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { CrmPanel } from "@/components/academic/crm-panel";

export const metadata: Metadata = {
  title: "CRM | UDLA Academia",
  description:
    "Seguimiento de clientes, reservas e interacciones vinculadas al servicio académico.",
};

export default function CrmPage() {
  return (
    <AcademicPageShell
      title="CRM y seguimiento"
      subtitle="Gestiona clientes, reservas e interacciones operativas para la simulación."
    >
      <CrmPanel />
    </AcademicPageShell>
  );
}
