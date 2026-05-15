import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { CashOperationsPanel } from "@/components/academic/cash-operations-panel";

export const metadata: Metadata = {
  title: "Caja | UDLA Academia",
  description:
    "Apertura, cierre y control operativo de caja para simulaciones gastronómicas.",
};

export default function CajaPage() {
  return (
    <AcademicPageShell
      title="Caja y cierre operativo"
      subtitle="Controla apertura/cierre de caja y movimientos asociados al flujo de servicio."
    >
      <CashOperationsPanel />
    </AcademicPageShell>
  );
}
