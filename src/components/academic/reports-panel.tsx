"use client";

import { useMemo } from "react";
import { ChartColumn, CircleDollarSign, PackageSearch, ShoppingBag } from "lucide-react";
import { useRestaurantSnapshot } from "@/lib/hooks/use-restaurant-snapshot";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  MetricCard,
} from "@/components/ui/academic-ui-kit";

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

export function ReportsPanel() {
  const { snapshot, loading } = useRestaurantSnapshot();

  const metrics = useMemo(() => {
    if (!snapshot) {
      return {
        sales: 0,
        orders: 0,
        lowStock: 0,
        topProducts: [] as Array<{ name: string; qty: number }>,
      };
    }

    const sales = snapshot.orders
      .filter((order) => order.status !== "cancelled")
      .reduce((acc, order) => acc + order.total, 0);
    const orders = snapshot.orders.filter((order) => order.status !== "cancelled").length;
    const lowStock = snapshot.rawMaterials.filter((material) => material.stock <= material.minStock).length;

    const byProduct = new Map<string, { name: string; qty: number }>();
    snapshot.orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = byProduct.get(item.productId) ?? { name: item.productName, qty: 0 };
        current.qty += item.quantity;
        byProduct.set(item.productId, current);
      });
    });

    const topProducts = [...byProduct.values()]
      .sort((left, right) => right.qty - left.qty)
      .slice(0, 5);

    return { sales, orders, lowStock, topProducts };
  }, [snapshot]);

  if (loading || !snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando reportes...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Ventas reconocidas"
          value={formatCurrency(metrics.sales)}
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Pedidos"
          value={String(metrics.orders)}
          icon={<ShoppingBag className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Stock crítico"
          value={String(metrics.lowStock)}
          icon={<PackageSearch className="h-3.5 w-3.5" />}
          tone={metrics.lowStock > 0 ? "red" : "zinc"}
        />
        <MetricCard
          label="Fuente"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          icon={<ChartColumn className="h-3.5 w-3.5" />}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Productos más vendidos"
          subtitle="Resumen operativo para cierre de simulación."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {metrics.topProducts.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin ventas registradas.
              </div>
            ) : (
              metrics.topProducts.map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {product.name}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {product.qty} unidades
                  </p>
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>
    </div>
  );
}
