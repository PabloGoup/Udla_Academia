"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Clock3, ScanLine, ShoppingBag } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import { listarProductosSimulacion } from "@/lib/warehouse-mutations";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

function ComensalMenuScreen() {
  const params = useSearchParams();
  const simulationId = params.get("sim") ?? "";
  const mesa = params.get("mesa");
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [allowedProducts, setAllowedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ignore = false;
    void loadRestaurantSnapshot().then((data) => {
      if (!ignore) setSnapshot(data);
    });

    if (!simulationId) return () => undefined;
    void listarProductosSimulacion(simulationId).then((rows) => {
      if (!ignore) {
        setAllowedProducts(new Set(rows.map((row) => row.id_producto)));
      }
    });
    return () => {
      ignore = true;
    };
  }, [simulationId]);

  const visibleProducts = useMemo(() => {
    const products = snapshot?.products ?? [];
    if (!products.length) return [];
    const available = products.filter((item) => item.available);
    if (!allowedProducts.size) return available;
    return available.filter((item) => allowedProducts.has(item.id));
  }, [allowedProducts, snapshot]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
            <ScanLine className="h-4 w-4" />
            Menú Comensal QR
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Carta activa del servicio
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {mesa ? `Mesa ${mesa} · ` : ""}Simulación{" "}
            {simulationId ? simulationId.slice(0, 8) : "sin identificar"}.
          </p>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            Flujo asistido: este QR muestra la carta. El pedido debe ser tomado por el garzón y registrado en POS.
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 grid grid-cols-4 gap-3">
            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Productos</p>
              <p className="mt-1 text-xl font-extrabold">{visibleProducts.length}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Formato</p>
              <p className="mt-1 text-xl font-extrabold">QR</p>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado</p>
              <p className="mt-1 text-xl font-extrabold">Activo</p>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Atención</p>
              <p className="mt-1 text-xl font-extrabold">Salón</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {visibleProducts.map((product) => (
              <article
                key={product.id}
                className="col-span-4 overflow-hidden rounded-xl border border-slate-200 bg-white sm:col-span-2 lg:col-span-1"
              >
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-36 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-slate-100 text-slate-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <h2 className="line-clamp-2 text-sm font-extrabold uppercase tracking-tight">
                    {product.name}
                  </h2>
                  <p className="line-clamp-2 text-xs text-slate-600">{product.description}</p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {formatCurrency(product.price)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {product.prepTimeMinutes} min
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!visibleProducts.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
              No hay productos disponibles para esta simulación.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function ComensalMenuPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
            Cargando menú comensal...
          </div>
        </main>
      }
    >
      <ComensalMenuScreen />
    </Suspense>
  );
}
