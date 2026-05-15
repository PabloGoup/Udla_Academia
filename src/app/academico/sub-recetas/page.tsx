"use client";

import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { RecipesModule } from "@/components/academic/recipes-module";

export default function SubRecetasPage() {
  return (
    <AcademicPageShell
      title="Sub-recetas y Mise en Place"
      subtitle="Bases de producción (salsas, prep y sub-recetas) conectadas al servicio."
    >
      <RecipesModule mode="sub-recetas" />
    </AcademicPageShell>
  );
}
