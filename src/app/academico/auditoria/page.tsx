import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { AuditPanel } from "@/components/academic/audit-panel";

export const metadata: Metadata = {
  title: "Auditoría | UDLA Academia",
  description:
    "Consolidado de auditoría operativa y trazabilidad académica de simulaciones.",
};

export default function AuditoriaPage() {
  return (
    <AcademicPageShell
      title="Auditoría y trazabilidad"
      subtitle="Revisa eventos operativos y acciones académicas registradas."
    >
      <AuditPanel />
    </AcademicPageShell>
  );
}
