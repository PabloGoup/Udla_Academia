import type { Metadata } from "next";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { PurchasesPanel } from "@/components/academic/purchases-panel";

export const metadata: Metadata = {
  title: "Compras | UDLA Academia",
  description:
    "Recepción y trazabilidad de compras de insumos para simulaciones gastronómicas.",
};

export default function ComprasPage() {
  return (
    <AcademicPageShell
      title="Compras y recepción"
      subtitle="Registra compras, recepciona insumos y actualiza inventario de simulación."
    >
      <PurchasesPanel />
    </AcademicPageShell>
  );
}
