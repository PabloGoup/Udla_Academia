"use client";

import { Loader2, Play, StepForward } from "lucide-react";
import { useMemo, useState } from "react";
import { estadoLabels } from "@/lib/academic-labels";
import { avanzarEstadoSimulacion } from "@/lib/simulation-mutations";
import type { EstadoSimulacion } from "@/lib/academic-types";
import { Button, OperationToast } from "@/components/ui/academic-ui-kit";

const stateFlow: EstadoSimulacion[] = [
  "creada",
  "configurada",
  "alumnos_asignados",
  "productos_cargados",
  "pre_servicio",
  "servicio_activo",
  "servicio_cerrado",
  "reporte_generado",
  "evaluacion_finalizada",
  "archivada",
];

export function SimulationStateActions({
  idSimulacion,
  estado,
  onStateChanged,
}: {
  idSimulacion: string;
  estado: EstadoSimulacion;
  onStateChanged: () => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const nextState = useMemo(() => {
    const currentIndex = stateFlow.indexOf(estado);
    if (currentIndex >= 0 && currentIndex < stateFlow.length - 1) {
      return stateFlow[currentIndex + 1];
    }
    return null;
  }, [estado]);

  async function handleAdvanceState() {
    if (!nextState || isSaving) return;

    setIsSaving(true);
    try {
      const result = await avanzarEstadoSimulacion(idSimulacion, nextState);
      if (result.ok) {
        setToast({ message: `Simulación avanzada a ${estadoLabels[nextState] || nextState}`, tone: "success" });
        await onStateChanged();
      } else {
        setToast({ message: result.mensaje, tone: "error" });
      }
    } catch {
      setToast({ message: "Error al actualizar el estado", tone: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  if (!nextState) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => void handleAdvanceState()}
        disabled={isSaving}
        className="w-full"
        icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <StepForward className="h-4 w-4" />}
      >
        {isSaving ? "Actualizando..." : `Avanzar a ${estadoLabels[nextState] || nextState}`}
      </Button>
      
      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
