"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, PackagePlus, Receipt } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import { persistPurchaseReception, type PurchaseReceptionDraft } from "@/lib/operations";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  Button,
  FormField,
  Input,
  MetricCard,
  OperationToast,
  Select,
} from "@/components/ui/academic-ui-kit";

export function PurchasesPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [draft, setDraft] = useState<PurchaseReceptionDraft>({
    supplierId: "",
    documentType: "invoice",
    documentNumber: "",
    rawMaterialId: "",
    description: "",
    quantity: 0,
    unit: "g",
    unitCost: 0,
    yieldPercent: 100,
    expirationDate: "",
    lot: "",
  });

  async function reload() {
    setSnapshot(await loadRestaurantSnapshot());
  }

  useEffect(() => {
    void reload();
  }, []);

  const suppliers = snapshot?.suppliers ?? [];
  const materials = snapshot?.rawMaterials ?? [];
  const purchases = useMemo(() => snapshot?.purchases ?? [], [snapshot]);
  const recentPurchases = useMemo(() => purchases.slice(0, 10), [purchases]);

  async function handleRegisterReception() {
    if (!draft.supplierId || !draft.rawMaterialId || !draft.documentNumber.trim()) {
      setToast({ message: "Completa proveedor, materia prima y documento.", tone: "error" });
      return;
    }
    setSubmitting(true);
    const result = await persistPurchaseReception(draft);
    setSubmitting(false);
    setToast({ message: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setDraft((prev) => ({
        ...prev,
        documentNumber: "",
        description: "",
        quantity: 0,
        unitCost: 0,
        lot: "",
      }));
      await reload();
    }
  }

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando compras...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Compras"
          value={String(purchases.length)}
          icon={<Receipt className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Recibidas"
          value={String(purchases.filter((purchase) => purchase.status === "received").length)}
          icon={<ClipboardCheck className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Proveedores"
          value={String(suppliers.length)}
          icon={<PackagePlus className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Fuente"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Recepción de compra"
          subtitle="Registra ingreso y actualiza inventario en una sola operación."
        />
        <AcademicCardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Proveedor">
              <Select
                value={draft.supplierId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, supplierId: event.target.value }))
                }
              >
                <option value="">Seleccionar...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Materia prima">
              <Select
                value={draft.rawMaterialId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, rawMaterialId: event.target.value }))
                }
              >
                <option value="">Seleccionar...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FormField label="Documento">
              <Input
                value={draft.documentNumber}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, documentNumber: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Tipo">
              <Select
                value={draft.documentType}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    documentType: event.target.value as PurchaseReceptionDraft["documentType"],
                  }))
                }
              >
                <option value="invoice">Factura</option>
                <option value="receipt">Boleta</option>
              </Select>
            </FormField>
            <FormField label="Cantidad">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={String(draft.quantity)}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, quantity: Number(event.target.value) }))
                }
              />
            </FormField>
            <FormField label="Costo unitario">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={String(draft.unitCost)}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, unitCost: Number(event.target.value) }))
                }
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Unidad">
              <Select
                value={draft.unit}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, unit: event.target.value }))
                }
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="unit">unit</option>
              </Select>
            </FormField>
            <FormField label="Rendimiento %">
              <Input
                type="number"
                min="1"
                max="100"
                step="0.1"
                value={String(draft.yieldPercent)}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, yieldPercent: Number(event.target.value) }))
                }
              />
            </FormField>
            <FormField label="Lote">
              <Input
                value={draft.lot}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, lot: event.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Descripción">
            <Input
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end">
            <Button
              onClick={() => void handleRegisterReception()}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Registrando..." : "Registrar recepción"}
            </Button>
          </div>
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard>
        <AcademicCardHeader
          title="Compras recientes"
          subtitle="Últimos documentos recepcionados."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentPurchases.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin compras registradas.
              </div>
            ) : (
              recentPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {purchase.documentNumber} · {purchase.supplierName}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {purchase.status} · ${Math.round(purchase.total).toLocaleString("es-CL")}
                  </p>
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
