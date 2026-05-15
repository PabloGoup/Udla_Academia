"use client";

import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { MenuProductsPanel } from "@/components/academic/menu-products-panel";

export default function MenuAcademicoPage() {
  return (
    <AcademicPageShell
      title="Menú comercial"
      subtitle="Productos de carta con fotografía, disponibilidad y asignación por simulación."
    >
      <MenuProductsPanel />
    </AcademicPageShell>
  );
}
