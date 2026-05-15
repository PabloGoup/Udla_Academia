import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { InventoryPanel } from "@/components/academic/inventory-panel";

export const metadata: Metadata = {
  title: "Inventario | UDLA Academia",
  description:
    "Stock crítico y movimientos de inventario vinculados a la simulación operativa.",
};

export default function InventarioPage() {
  return (
    <AcademicPageShell
      title="Inventario operativo"
      subtitle="Monitorea stock crítico y movimientos de insumos por servicio."
    >
      <InventoryPanel />
    </AcademicPageShell>
  );
}
