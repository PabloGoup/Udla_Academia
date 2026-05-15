import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { ReportsPanel } from "@/components/academic/reports-panel";

export const metadata: Metadata = {
  title: "Reportes | UDLA Academia",
  description:
    "Indicadores operativos de ventas, inventario y desempeño para simulaciones.",
};

export default function ReportesPage() {
  return (
    <AcademicPageShell
      title="Reportes de simulación"
      subtitle="Consolida ventas, productos, inventario y señales de desempeño del servicio."
    >
      <ReportsPanel />
    </AcademicPageShell>
  );
}
