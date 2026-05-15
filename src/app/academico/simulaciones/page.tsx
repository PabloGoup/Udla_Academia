"use client";

import { useState } from "react";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { SimulationManager } from "@/components/academic/simulation-wizard";
import { SimulationDetail } from "@/components/academic/simulation-detail";

export default function SimulacionesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AcademicPageShell
      title={selectedId ? "Detalle de simulación" : "Simulaciones"}
      subtitle={
        selectedId
          ? "Gestiona áreas, roles y avanza el estado de la simulación."
          : "Crea y gestiona simulaciones gastronómicas académicas."
      }
    >
      {selectedId ? (
        <SimulationDetail
          id_simulacion={selectedId}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <SimulationManager onNavigateToDetail={setSelectedId} />
      )}
    </AcademicPageShell>
  );
}
