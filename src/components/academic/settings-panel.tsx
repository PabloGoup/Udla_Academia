"use client";

import { useEffect, useState } from "react";
import { Settings2, Store } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import { persistRestaurantSettings, type RestaurantSettingsDraft } from "@/lib/operations";
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

export function SettingsPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [draft, setDraft] = useState<RestaurantSettingsDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  async function reload() {
    const data = await loadRestaurantSnapshot();
    setSnapshot(data);
    setDraft(data.settings);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const result = await persistRestaurantSettings(draft);
    setSaving(false);
    setToast({ message: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) await reload();
  }

  if (!snapshot || !draft) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Restaurante"
          value={draft.restaurantName}
          icon={<Store className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Moneda"
          value={draft.currency}
          icon={<Settings2 className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="IVA"
          value={`${draft.taxPercent}%`}
          tone="emerald"
        />
        <MetricCard
          label="Fuente"
          value={snapshot.source === "supabase" ? "Supabase" : "Demo"}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Perfil restaurante"
          subtitle="Configuración base para documentos y operación."
        />
        <AcademicCardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Nombre restaurante">
              <Input
                value={draft.restaurantName}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, restaurantName: event.target.value } : prev,
                  )
                }
              />
            </FormField>
            <FormField label="Academia">
              <Input
                value={draft.academyName}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, academyName: event.target.value } : prev,
                  )
                }
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Teléfono">
              <Input
                value={draft.phone}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
                }
              />
            </FormField>
            <FormField label="Email">
              <Input
                value={draft.email}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                }
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Tax ID">
              <Input
                value={draft.taxId}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, taxId: event.target.value } : prev))
                }
              />
            </FormField>
            <FormField label="Cargo servicio %">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={String(draft.serviceChargePercent)}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? { ...prev, serviceChargePercent: Number(event.target.value) }
                      : prev,
                  )
                }
              />
            </FormField>
            <FormField label="IVA %">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={String(draft.taxPercent)}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, taxPercent: Number(event.target.value) } : prev,
                  )
                }
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? "Guardando..." : "Guardar configuración"}
            </Button>
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
