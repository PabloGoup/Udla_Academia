"use client";

import { useEffect, useMemo, useState } from "react";
import { ContactRound, MessageSquare, Phone } from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import { persistCustomerInteraction } from "@/lib/operations";
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
  StatusBadge,
  Textarea,
} from "@/components/ui/academic-ui-kit";
import type { CustomerInteractionDraft } from "@/lib/operations";

export function CrmPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [draft, setDraft] = useState<CustomerInteractionDraft>({
    customerId: "",
    type: "message",
    summary: "",
    dueAt: "",
    completed: false,
  });

  async function reload() {
    setSnapshot(await loadRestaurantSnapshot());
  }

  useEffect(() => {
    void reload();
  }, []);

  const reservationCount = snapshot?.reservations.length ?? 0;
  const interactionCount = snapshot?.customerInteractions.length ?? 0;
  const customers = snapshot?.customers ?? [];
  const recentInteractions = useMemo(
    () => (snapshot?.customerInteractions ?? []).slice(0, 12),
    [snapshot],
  );

  async function handleCreateInteraction() {
    if (!draft.customerId || !draft.summary.trim()) {
      setToast({ message: "Selecciona cliente y resumen.", tone: "error" });
      return;
    }
    setSubmitting(true);
    const result = await persistCustomerInteraction(draft);
    setSubmitting(false);
    setToast({ message: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setDraft({
        customerId: draft.customerId,
        type: "message",
        summary: "",
        dueAt: "",
        completed: false,
      });
      await reload();
    }
  }

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
        Cargando CRM...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Clientes"
          value={String(customers.length)}
          icon={<ContactRound className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Reservas"
          value={String(reservationCount)}
          icon={<Phone className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Interacciones"
          value={String(interactionCount)}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
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
          title="Registrar interacción"
          subtitle="Seguimiento de cliente para el flujo académico-operativo."
        />
        <AcademicCardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Cliente">
              <Select
                value={draft.customerId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, customerId: event.target.value }))
                }
              >
                <option value="">Seleccionar...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tipo">
              <Select
                value={draft.type}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    type: event.target.value as CustomerInteractionDraft["type"],
                  }))
                }
              >
                <option value="message">Mensaje</option>
                <option value="call">Llamada</option>
                <option value="note">Nota</option>
                <option value="preference">Preferencia</option>
                <option value="follow_up">Seguimiento</option>
                <option value="complaint">Reclamo</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Vence (opcional)">
              <Input
                type="datetime-local"
                value={draft.dueAt}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dueAt: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Estado">
              <Select
                value={draft.completed ? "done" : "pending"}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    completed: event.target.value === "done",
                  }))
                }
              >
                <option value="pending">Pendiente</option>
                <option value="done">Completada</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Resumen">
            <Textarea
              value={draft.summary}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, summary: event.target.value }))
              }
              placeholder="Ej: Confirmar alergia y registrar observación en comanda."
            />
          </FormField>
          <div className="flex justify-end">
            <Button
              onClick={() => void handleCreateInteraction()}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Guardando..." : "Guardar interacción"}
            </Button>
          </div>
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard>
        <AcademicCardHeader
          title="Interacciones recientes"
          subtitle="Bitácora de CRM por cliente."
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentInteractions.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sin interacciones registradas.
              </div>
            ) : (
              recentInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {interaction.customerName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {interaction.summary}
                    </p>
                  </div>
                  <StatusBadge label={interaction.type} tone="zinc" />
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
