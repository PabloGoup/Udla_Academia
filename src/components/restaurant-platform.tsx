"use client";

import Link from "next/link";

/**
 * Monolito operativo legado (retirado).
 * La operación vive en rutas modulares bajo /academico.
 */
export function RestaurantPlatform() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        El panel operativo unificado fue reemplazado por módulos académicos
        integrados.
      </p>
      <Link
        href="/academico"
        className="rounded-xl bg-[var(--udla-orange)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20"
      >
        Ir al dashboard académico
      </Link>
    </div>
  );
}
