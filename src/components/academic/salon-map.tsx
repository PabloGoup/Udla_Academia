"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Users, UtensilsCrossed, ChevronLeft, CreditCard, Sparkles, LogOut, ReceiptText } from "lucide-react";
import {
  listarMesas,
  actualizarEstadoMesa,
  obtenerPedidoActivoMesa,
  listarDetallePedido,
  cerrarPedidoConFeedback,
} from "@/lib/pos-mutations";
import type {
  DetallePedido,
  FeedbackCierreServicio,
  Mesa,
  Pedido,
} from "@/lib/academic-types";
import { PosTerminal } from "./pos-terminal";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  Button,
  FormField,
  Input,
  Modal,
  OperationToast,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/academic-ui-kit";

const ESTADOS_MESA: Record<string, { tone: "emerald" | "orange" | "red" | "zinc"; label: string; icon: LucideIcon }> = {
  libre: { tone: "emerald", label: "Libre", icon: Sparkles },
  ocupada: { tone: "orange", label: "En Servicio", icon: UtensilsCrossed },
  sucia: { tone: "red", label: "Limpieza", icon: LogOut },
};

interface SalonMapProps {
  id_simulacion: string;
}

export function SalonMap({ id_simulacion }: SalonMapProps) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [activeOrder, setActiveOrder] = useState<Pedido | null>(null);
  const [orderItems, setOrderItems] = useState<DetallePedido[]>([]);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackCierreServicio>({
    nombre_comensal: "",
    puntuacion_atencion: 5,
    puntuacion_sabor: 5,
    puntuacion_presentacion: 5,
    puntuacion_tiempo: 5,
    puntuacion_limpieza: 5,
    puntuacion_experiencia: 5,
    comentario: "",
  });

  const loadMesas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarMesas();
      setMesas(data);
    } catch {
      setToast({ message: "Error cargando salón.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTableDetails = useCallback(async (id_mesa: string) => {
    try {
      const pedido = await obtenerPedidoActivoMesa(id_mesa, id_simulacion);
      setActiveOrder(pedido);
      if (pedido) {
        const items = await listarDetallePedido(pedido.id_pedido);
        setOrderItems(items);
      } else {
        setOrderItems([]);
      }
    } catch { /* ignore */ }
  }, [id_simulacion]);

  useEffect(() => { void loadMesas(); }, [loadMesas]);

  useEffect(() => {
    if (!selectedMesa) return;
    const interval = setInterval(() => { void loadTableDetails(selectedMesa.id_mesa); }, 5000);
    return () => clearInterval(interval);
  }, [selectedMesa, loadTableDetails]);

  async function handleSelectMesa(mesa: Mesa) {
    setSelectedMesa(mesa);
    setIsAddingItems(false);
    await loadTableDetails(mesa.id_mesa);
  }

  async function handleChangeState(nuevoEstado: Mesa["estado"]) {
    if (!selectedMesa) return;
    const result = await actualizarEstadoMesa(selectedMesa.id_mesa, nuevoEstado);
    if (result.ok) {
      setSelectedMesa({ ...selectedMesa, estado: nuevoEstado });
      void loadMesas();
    }
  }

  async function handlePay() {
    if (!activeOrder) return;
    const result = await cerrarPedidoConFeedback({
      id_pedido: activeOrder.id_pedido,
      id_simulacion,
      feedback: feedbackDraft,
      payment_method: "debit",
    });
    if (result.ok) {
      setToast({ message: "Comanda pagada. Mesa en espera de limpieza.", tone: "success" });
      setShowFeedbackModal(false);
      setFeedbackDraft({
        nombre_comensal: "",
        puntuacion_atencion: 5,
        puntuacion_sabor: 5,
        puntuacion_presentacion: 5,
        puntuacion_tiempo: 5,
        puntuacion_limpieza: 5,
        puntuacion_experiencia: 5,
        comentario: "",
      });
      setSelectedMesa(null);
      void loadMesas();
    } else {
      setToast({ message: result.mensaje, tone: "error" });
    }
  }

  if (loading && mesas.length === 0) return <div className="py-20 text-center text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Abriendo Salón…</div>;

  if (selectedMesa) {
    const configMesa = ESTADOS_MESA[selectedMesa.estado] || { tone: "zinc", label: selectedMesa.estado, icon: Users };

    if (isAddingItems) {
      return (
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            icon={<ChevronLeft className="h-4 w-4"/>} 
            onClick={() => setIsAddingItems(false)} 
            className="self-start uppercase font-black text-[10px]"
          >
            Atrás: Mesa {selectedMesa.numero_mesa}
          </Button>
          <PosTerminal 
            id_simulacion={id_simulacion} 
            preselected_id_mesa={selectedMesa.id_mesa} 
            onOrderSent={() => { 
              setIsAddingItems(false); 
              void loadTableDetails(selectedMesa.id_mesa); 
              void loadMesas(); 
            }} 
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        <AcademicCard className="border-b-4 border-b-orange-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="secondary" 
                icon={<ChevronLeft className="h-4 w-4"/>} 
                onClick={() => setSelectedMesa(null)} 
                className="font-black text-[10px] uppercase"
              >
                Salón
              </Button>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Mesa {selectedMesa.numero_mesa}</h2>
                <div className="mt-1 text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tight">
                  <Users className="h-3 w-3" /> Máx: {selectedMesa.capacidad} comensales
                </div>
              </div>
            </div>
            <StatusBadge label={configMesa.label} tone={configMesa.tone} />
          </div>
          
          <AcademicCardBody className="bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5">
            <div className="flex flex-wrap gap-3">
              {selectedMesa.estado === "libre" && (
                <Button onClick={() => void handleChangeState("ocupada")} icon={<Users className="h-4 w-4" />}>
                  Abrir Mesa / Ocupar
                </Button>
              )}
              {selectedMesa.estado === "sucia" && (
                <Button variant="secondary" icon={<Sparkles className="h-4 w-4"/>} onClick={() => void handleChangeState("libre")}>
                  Validar Limpieza
                </Button>
              )}
              {selectedMesa.estado === "ocupada" && (
                <Button onClick={() => setIsAddingItems(true)} icon={<UtensilsCrossed className="h-4 w-4"/>}>
                  Nueva Comanda
                </Button>
              )}
              {activeOrder && (
                <Button 
                  onClick={() => setShowFeedbackModal(true)} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20" 
                  icon={<CreditCard className="h-4 w-4"/>}
                >
                  Cerrar y Pagar Cuenta
                </Button>
              )}
            </div>
          </AcademicCardBody>
        </AcademicCard>

        {activeOrder && (
          <AcademicCard className="overflow-hidden">
            <AcademicCardHeader 
              title="Resumen de Consumo" 
              subtitle={`Mesa ${selectedMesa.numero_mesa} · Comanda ${activeOrder.id_pedido.split("-").pop()}`}
              action={<div className="text-xl font-black text-orange-600 tracking-tighter">${activeOrder.total_neto.toLocaleString("es-CL")}</div>}
            />
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {orderItems.length === 0 ? (
                <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin platos registrados</div>
              ) : (
                orderItems.map(item => (
                  <div key={item.id_detalle} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black text-sm">
                        {item.cantidad}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.nombre_producto}</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${item.estado === "entregado" ? "bg-emerald-500" : "bg-orange-500 animate-pulse"}`} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.estado}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      ${(item.precio_unitario * item.cantidad).toLocaleString("es-CL")}
                    </div>
                  </div>
                ))
              )}
            </div>
            {orderItems.length > 0 && (
              <div className="bg-slate-50 dark:bg-white/[0.02] p-4 flex justify-end">
                <div className="flex items-center gap-2 text-slate-400">
                  <ReceiptText className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Documento Académico</span>
                </div>
              </div>
            )}
          </AcademicCard>
        )}

        <Modal
          open={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          title={`Feedback obligatorio · Mesa ${selectedMesa.numero_mesa}`}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col gap-4">
            <FormField label="Nombre comensal" htmlFor="fd-nombre">
              <Input
                id="fd-nombre"
                value={feedbackDraft.nombre_comensal}
                onChange={(event) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    nombre_comensal: event.target.value,
                  }))
                }
                placeholder="Ej: Comensal mesa 4"
              />
            </FormField>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-3">
              <ScoreField
                label="Atención"
                value={feedbackDraft.puntuacion_atencion}
                onChange={(value) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    puntuacion_atencion: value,
                  }))
                }
              />
              <ScoreField
                label="Sabor"
                value={feedbackDraft.puntuacion_sabor}
                onChange={(value) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    puntuacion_sabor: value,
                  }))
                }
              />
              <ScoreField
                label="Presentación"
                value={feedbackDraft.puntuacion_presentacion}
                onChange={(value) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    puntuacion_presentacion: value,
                  }))
                }
              />
              <ScoreField
                label="Tiempo"
                value={feedbackDraft.puntuacion_tiempo}
                onChange={(value) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    puntuacion_tiempo: value,
                  }))
                }
              />
              <ScoreField
                label="Limpieza"
                value={feedbackDraft.puntuacion_limpieza}
                onChange={(value) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    puntuacion_limpieza: value,
                  }))
                }
              />
              <ScoreField
                label="Experiencia"
                value={feedbackDraft.puntuacion_experiencia}
                onChange={(value) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    puntuacion_experiencia: value,
                  }))
                }
              />
            </div>

            <FormField label="Comentario" htmlFor="fd-comentario">
              <Textarea
                id="fd-comentario"
                value={feedbackDraft.comentario ?? ""}
                onChange={(event) =>
                  setFeedbackDraft((prev) => ({
                    ...prev,
                    comentario: event.target.value,
                  }))
                }
                placeholder="Comentarios del comensal sobre el servicio."
              />
            </FormField>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFeedbackModal(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handlePay()}
                className="w-full sm:w-auto bg-emerald-600"
              >
                Confirmar cierre con feedback
              </Button>
            </div>
          </div>
        </Modal>

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

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-200">Libres</div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-100">
            {mesas.filter((mesa) => mesa.estado === "libre").length}
          </div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center dark:border-orange-500/30 dark:bg-orange-500/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-700 dark:text-orange-200">En servicio</div>
          <div className="text-lg font-black text-orange-700 dark:text-orange-100">
            {mesas.filter((mesa) => mesa.estado === "ocupada").length}
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-200">Limpieza</div>
          <div className="text-lg font-black text-red-700 dark:text-red-100">
            {mesas.filter((mesa) => mesa.estado === "sucia").length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {mesas.map((mesa) => {
          const config = ESTADOS_MESA[mesa.estado] || { tone: "zinc", label: mesa.estado, icon: Users };
          const Icon = config.icon;

          return (
            <button
              key={mesa.id_mesa}
              onClick={() => void handleSelectMesa(mesa)}
              className={`group relative flex h-32 flex-col items-center justify-center rounded-2xl border-2 shadow-soft transition-all hover:scale-[1.03] hover:shadow-premium active:scale-95 sm:h-40 ${isReadyStyle(mesa.estado)}`}
            >
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-5xl font-black tracking-tighter">{mesa.numero_mesa}</span>
              <span className="mt-3 text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">
                {config.label}
              </span>
              <div className="mt-2 flex items-center gap-1 text-[8px] font-black opacity-50 uppercase">
                <Users className="h-2 w-2" /> {mesa.capacidad} Pax
              </div>
            </button>
          );
        })}
      </div>
      {toast ? (
        <OperationToast
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <FormField label={label}>
      <Select
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="5">5</option>
        <option value="4">4</option>
        <option value="3">3</option>
        <option value="2">2</option>
        <option value="1">1</option>
      </Select>
    </FormField>
  );
}

function isReadyStyle(estado: string) {
  if (estado === "libre") return "border-emerald-100 bg-white text-emerald-600 dark:bg-emerald-500/5 dark:border-emerald-500/20";
  if (estado === "ocupada") return "border-orange-100 bg-white text-orange-600 dark:bg-orange-500/5 dark:border-orange-500/20 ring-4 ring-orange-500/10";
  return "border-red-100 bg-white text-red-600 dark:bg-red-500/5 dark:border-red-500/20";
}
