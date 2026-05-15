"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, CircleDollarSign, Receipt } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import {
  persistCashRegisterClose,
  persistCashRegisterOpen,
} from "@/lib/operations";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  Button,
  FormField,
  Input,
  MetricCard,
  OperationToast,
} from "@/components/ui/academic-ui-kit";

export function CashOperationsPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [countedAmount, setCountedAmount] = useState("");
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await loadRestaurantSnapshot());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openRegister = useMemo(
    () => snapshot?.cashRegisters.find((register) => register.status === "open"),
    [snapshot],
  );

  const todayMovements = useMemo(
    () => (snapshot?.cashMovements ?? []).slice(0, 12),
    [snapshot],
  );

  async function handleOpen() {
    const result = await persistCashRegisterOpen(Number(openingAmount || "0"));
    setToast({ message: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) await refresh();
  }

  async function handleClose() {
    if (!openRegister) return;
    setClosing(true);
    const result = await persistCashRegisterClose({
      registerId: openRegister.id,
      expectedAmount: openRegister.expectedAmount,
      countedAmount: Number(countedAmount || openRegister.expectedAmount),
    });
    setClosing(false);
    setToast({ message: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setCountedAmount("");
      await refresh();
    }
  }

  if (loading || !snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando caja...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Estado caja"
          value={openRegister ? "Abierta" : "Cerrada"}
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          tone={openRegister ? "emerald" : "zinc"}
        />
        <MetricCard
          label="Esperado"
          value={`$${Math.round(openRegister?.expectedAmount ?? 0).toLocaleString("es-CL")}`}
          icon={<Calculator className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Movimientos"
          value={String(snapshot.cashMovements.length)}
          icon={<Receipt className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Origen datos"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Control de caja"
          subtitle="Apertura/cierre operativo para flujo Servicio 360."
        />
        <AcademicCardBody className="flex flex-col gap-4">
          {!openRegister ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <FormField label="Monto apertura">
                <Input
                  type="number"
                  min="0"
                  value={openingAmount}
                  onChange={(event) => setOpeningAmount(event.target.value)}
                />
              </FormField>
              <div className="flex items-end">
                <Button className="w-full sm:w-auto" onClick={() => void handleOpen()}>
                  Abrir caja
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Monto contado al cierre">
                <Input
                  type="number"
                  min="0"
                  value={countedAmount}
                  onChange={(event) => setCountedAmount(event.target.value)}
                  placeholder={String(Math.round(openRegister.expectedAmount))}
                />
              </FormField>
              <div className="flex items-end">
                <Button
                  className="w-full sm:w-auto bg-emerald-600"
                  onClick={() => void handleClose()}
                  disabled={closing}
                >
                  {closing ? "Cerrando..." : "Cerrar caja"}
                </Button>
              </div>
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard>
        <AcademicCardHeader
          title="Últimos movimientos"
          subtitle="Detalle rápido de caja para seguimiento docente."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {todayMovements.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin movimientos registrados.
              </div>
            ) : (
              todayMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {movement.description}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {movement.type} · {movement.method} · ${Math.round(movement.amount).toLocaleString("es-CL")}
                  </div>
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>

      {toast ? (
        <OperationToast
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
