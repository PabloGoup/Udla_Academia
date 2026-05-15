"use client";

import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { WarehouseManager } from "@/components/academic/warehouse-manager";

export default function BodegaPage() {
  return (
    <AcademicPageShell
      title="Bodega e Insumos"
      subtitle="Gestiona el catálogo maestro de ingredientes y materias primas disponibles para las simulaciones."
    >
      <WarehouseManager />
    </AcademicPageShell>
  );
}
