"use client";

import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { RecipesModule } from "@/components/academic/recipes-module";

export default function RecetasPage() {
  return (
    <AcademicPageShell
      title="Recetas técnicas"
      subtitle="Costeo por receta, rendimiento por ingrediente, merma y margen objetivo."
    >
      <RecipesModule mode="recetas" />
    </AcademicPageShell>
  );
}
