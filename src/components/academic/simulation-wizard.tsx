"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Layers,
  LayoutGrid,
  Plus,
  Sparkles,
  Timer,
  Utensils,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Users,
} from "lucide-react";
import type { Clase, Curso, Simulacion } from "@/lib/academic-types";
import { listarCursos, listarClases } from "@/lib/academic-mutations";
import {
  crearSimulacion,
  listarSimulaciones,
} from "@/lib/simulation-mutations";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  Button,
  EmptyState,
  FormField,
  Input,
  Modal,
  OperationToast,
  Select,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

const AREAS_WIZARD = [
  { value: "bodega", label: "Bodega", icon: Layers },
  { value: "cocina", label: "Cocina", icon: Utensils },
  { value: "bar", label: "Bar", icon: Sparkles },
  { value: "garzon", label: "Salón", icon: Users },
  { value: "caja", label: "Caja", icon: Timer },
];

const WIZARD_STEPS = [
  { label: "Clase", icon: BookOpen },
  { label: "Datos", icon: Layers },
  { label: "Áreas", icon: LayoutGrid },
  { label: "Confirmar", icon: Check },
] as const;

interface SimulationManagerProps {
  onNavigateToDetail?: (id: string) => void;
}

export function SimulationManager({ onNavigateToDetail }: SimulationManagerProps) {
  const [simulaciones, setSimulaciones] = useState<Simulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSimulaciones(await listarSimulaciones());
    } catch {
      setToast({ message: "Error cargando simulaciones.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-32 text-center text-sm font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando Simulador…</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AcademicCard>
        <AcademicCardHeader
          title="Simulaciones en Curso"
          subtitle={`${simulaciones.length} sesión(es) académica(s) activa(s)`}
          action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowWizard(true)} className="shadow-orange-500/20">Nueva simulación</Button>}
        />
        <AcademicCardBody className="p-0">
          {simulaciones.length === 0 ? (
            <div className="p-16">
              <EmptyState
                icon={<Sparkles className="h-10 w-10 text-orange-500/50" />}
                title="Sin simulaciones activas"
                message="Lanza una nueva simulación práctica para comenzar el entrenamiento con tus alumnos."
                action={<Button onClick={() => setShowWizard(true)}>Empezar Asistente</Button>}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5">
              {simulaciones.map((sim) => (
                <button
                  key={sim.id_simulacion}
                  onClick={() => onNavigateToDetail?.(sim.id_simulacion)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                      <Utensils className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{sim.tipo_servicio}</div>
                      <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{sim.duracion_estimada} min</span>
                        <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> ID: {sim.id_simulacion.split("-").pop()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge label={sim.estado} tone="sky" />
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <SimulationWizardModal
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={(id) => {
          setShowWizard(false);
          void load();
          onNavigateToDetail?.(id);
        }}
      />
      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

function SimulationWizardModal({ open, onClose, onCreated }: WizardProps) {
  const [step, setStep] = useState(0);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCursoId, setSelectedCursoId] = useState("");
  const [selectedClaseId, setSelectedClaseId] = useState("");
  const [tipoServicio, setTipoServicio] = useState("Menú Degustación");
  const [duracion, setDuracion] = useState(120);
  const [areasActivas, setAreasActivas] = useState<string[]>(["cocina", "garzon", "caja", "bodega"]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    listarCursos().then(setCursos).catch(() => { });
    listarClases().then(setClases).catch(() => { });
  }, [open]);

  const filteredClases = clases.filter(c => !selectedCursoId || c.id_curso === selectedCursoId);
  const selectedClase = clases.find(c => c.id_clase === selectedClaseId);

  async function handleSubmit() {
    if (!selectedClaseId) return;
    setSubmitting(true);
    const result = await crearSimulacion({
      id_clase: selectedClaseId,
      nombre_simulacion: `Servicio - ${tipoServicio}`,
      tipo_servicio: tipoServicio,
      objetivo: "Simulación práctica de servicio gastronómico",
      duracion_estimada: duracion,
      areas_activas: areasActivas,
    });
    setSubmitting(false);
    if (result.ok && result.id) onCreated(result.id);
  }

  return (
    <Modal open={open} onClose={onClose} title="Lanzador de Simulación" maxWidth="max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-1 sm:gap-2 px-2">
        {WIZARD_STEPS.map(({ label, icon: Icon }, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-2">
            <div className={`relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-2xl transition-all duration-300 ${i === step ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-110" : i < step ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400"
              }`}>
              <Icon className="h-5 w-5" />
              {i < step && <div className="absolute -top-1 -right-1 h-5 w-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-2 border-emerald-500"><Check className="h-3 w-3 text-emerald-500" /></div>}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${i <= step ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[300px]">
        {step === 0 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField label="1. Filtrar por curso académico">
              <Select value={selectedCursoId} onChange={(e) => setSelectedCursoId(e.target.value)}>
                <option value="">Todos los cursos disponibles</option>
                {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>)}
              </Select>
            </FormField>
            <FormField label="2. Seleccionar clase práctica">
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                {filteredClases.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl italic">Sin clases registradas</div>
                ) : (
                  filteredClases.map(c => (
                    <button
                      key={c.id_clase}
                      onClick={() => setSelectedClaseId(c.id_clase)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${selectedClaseId === c.id_clase
                          ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/20"
                          : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-200"
                        }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedClaseId === c.id_clase ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase tracking-tight leading-tight">{c.nombre_clase}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-tighter mt-0.5 ${selectedClaseId === c.id_clase ? "text-orange-100" : "text-slate-400"}`}>{c.fecha}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField label="Tipo de servicio gastronómico">
              <Input value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} placeholder="Ej: Menú de Gala 3 Tiempos" className="text-lg font-bold" />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Duración estimada (MIN)">
                <div className="relative">
                  <Input type="number" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className="pl-10" />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </FormField>
              <div className="flex flex-col justify-end pb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aprox: {Math.floor(duracion / 60)}h {duracion % 60}m</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Selecciona las áreas operativas activas para esta sesión</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AREAS_WIZARD.map(a => {
                const Icon = a.icon;
                const active = areasActivas.includes(a.value);
                return (
                  <button
                    key={a.value}
                    onClick={() => setAreasActivas(prev => prev.includes(a.value) ? prev.filter(x => x !== a.value) : [...prev, a.value])}
                    className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${active
                        ? "border-orange-500 bg-orange-600 text-white shadow-premium scale-105"
                        : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-400 opacity-60"
                      }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            <div className="rounded-[2rem] border-2 border-orange-500/30 bg-orange-500/5 p-8 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/30">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Todo listo para comenzar</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Revisa la configuración académica</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Clase</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate block">{selectedClase?.nombre_clase}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Servicio</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase block">{tipoServicio}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Duración</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase block">{duracion} Minutos</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Áreas Activas</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase block">{areasActivas.length} Módulos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row justify-between gap-4 border-t border-slate-100 dark:border-white/5 pt-8">
        <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep(s => s - 1))} className="order-2 sm:order-1 font-black uppercase text-[10px] tracking-widest">
          {step === 0 ? "Cancelar" : "Volver atrás"}
        </Button>
        <div className="flex gap-3 order-1 sm:order-2">
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !selectedClaseId}
              className="w-full sm:w-auto px-10 shadow-orange-500/20"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Continuar
            </Button>
          ) : (
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="w-full sm:w-auto px-10 bg-emerald-600 shadow-emerald-500/20"
              icon={<Sparkles className="h-4 w-4" />}
            >
              {submitting ? "Iniciando…" : "Lanzar Simulación en Vivo"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
