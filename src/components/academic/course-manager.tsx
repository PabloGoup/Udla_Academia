"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BookOpen, Plus, Users, GraduationCap, Calendar, ChevronRight, LayoutGrid } from "lucide-react";
import type { Curso, Seccion, Clase } from "@/lib/academic-types";
import {
  listarCursos,
  listarSecciones,
  listarClases,
  crearCurso,
  crearSeccion,
  crearClase,
  type CursoDraft,
  type SeccionDraft,
  type ClaseDraft,
} from "@/lib/academic-mutations";
import { obtenerIdProfesorSesion } from "@/lib/academic-auth";
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

  StatusBadge,

} from "@/components/ui/academic-ui-kit";

/* ───── estado badge tono ───── */

function cursoTone(estado: Curso["estado"]) {
  const map = { borrador: "zinc", activo: "emerald", cerrado: "amber", archivado: "zinc" } as const;
  return map[estado] ?? "zinc";
}

function seccionTone(estado: Seccion["estado"]) {
  const map = { activa: "emerald", cerrada: "amber", archivada: "zinc" } as const;
  return map[estado as keyof typeof map] ?? "zinc";
}

function claseTone(estado: Clase["estado"]) {
  const map = { planificada: "sky", activa: "emerald", cerrada: "amber", archivada: "zinc" } as const;
  return map[estado as keyof typeof map] ?? "zinc";
}

export function CourseManager() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const [showNewCurso, setShowNewCurso] = useState(false);
  const [showNewSeccion, setShowNewSeccion] = useState(false);
  const [showNewClase, setShowNewClase] = useState(false);
  const [idProfesor, setIdProfesor] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, cl] = await Promise.all([listarCursos(), listarSecciones(), listarClases()]);
      setCursos(c);
      setSecciones(s);
      setClases(cl);
      if (!selectedCursoId && c.length > 0) setSelectedCursoId(c[0].id_curso);
    } catch {
      setToast({ message: "Error cargando datos académicos.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [selectedCursoId]);

  useEffect(() => {
    void loadData();
    void obtenerIdProfesorSesion().then(setIdProfesor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCurso = cursos.find((c) => c.id_curso === selectedCursoId);
  const filteredSecciones = secciones.filter((s) => s.id_curso === selectedCursoId);
  const filteredClases = clases.filter((c) => c.id_curso === selectedCursoId);

  async function handleCreateCurso(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const draft: CursoDraft = {
      nombre_curso: form.get("nombre") as string,
      asignatura: form.get("asignatura") as string,
      seccion: form.get("seccion_base") as string,
      id_profesor: idProfesor || (await obtenerIdProfesorSesion()),
      codigo_curso: (form.get("codigo") as string) || undefined,
      periodo: (form.get("periodo") as string) || undefined,
    };

    const result = await crearCurso(draft);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowNewCurso(false);
      if (result.id) setSelectedCursoId(result.id);
      void loadData();
    }
  }

  async function handleCreateSeccion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCursoId) return;
    const form = new FormData(event.currentTarget);
    const draft: SeccionDraft = {
      id_curso: selectedCursoId,
      nombre_seccion: form.get("nombre_seccion") as string,
      jornada: (form.get("jornada") as string) || undefined,
      cupo: Number(form.get("cupo") || "0"),
    };
    const result = await crearSeccion(draft);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowNewSeccion(false);
      void loadData();
    }
  }

  async function handleCreateClase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCursoId) return;
    const form = new FormData(event.currentTarget);
    const draft: ClaseDraft = {
      id_curso: selectedCursoId,
      id_seccion: (form.get("id_seccion") as string) || undefined,
      nombre_clase: form.get("nombre_clase") as string,
      fecha: form.get("fecha") as string,
      objetivo: (form.get("objetivo") as string) || undefined,
      tipo_servicio: (form.get("tipo_servicio") as string) || undefined,
    };
    const result = await crearClase(draft);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowNewClase(false);
      void loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 text-sm font-black uppercase tracking-widest animate-pulse">
        Sincronizando Gestión Académica…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* ───── Lista de cursos ───── */}
      <AcademicCard className="overflow-hidden">
        <AcademicCardHeader
          title="Mis Cursos"
          subtitle={`${cursos.length} curso(s) en tu portafolio académico`}
          action={
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowNewCurso(true)}
              className="shadow-orange-500/20"
            >
              Nuevo curso
            </Button>
          }
        />
        <AcademicCardBody className="p-0">
          {cursos.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<GraduationCap className="h-10 w-10 text-orange-500/50" />}
                title="Aún no tienes cursos"
                message="Crea tu primer curso para comenzar a planificar simulaciones y gestionar secciones."
                action={
                  <Button
                    variant="secondary"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setShowNewCurso(true)}
                  >
                    Empezar ahora
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
              {cursos.map((curso) => {
                const isSelected = selectedCursoId === curso.id_curso;
                return (
                  <button
                    key={curso.id_curso}
                    type="button"
                    onClick={() => setSelectedCursoId(curso.id_curso)}
                    className={`relative flex flex-col p-6 text-left transition-all hover:bg-white dark:hover:bg-white/5 ${
                      isSelected ? "bg-white dark:bg-white/[0.05] ring-1 ring-orange-500/20 shadow-soft" : ""
                    }`}
                  >
                    {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-orange-600 animate-in slide-in-from-top-full duration-300" />}
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black text-xs">
                        {curso.codigo_curso || "C"}
                      </div>
                      <StatusBadge label={curso.estado} tone={cursoTone(curso.estado)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{curso.nombre_curso}</h4>
                      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{curso.asignatura}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{curso.periodo || "Sin periodo"}</span>
                      <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${isSelected ? "translate-x-1 text-orange-600" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      {/* ───── Detalle del curso seleccionado ───── */}
      {selectedCurso ? (
        <div className="grid gap-8 lg:grid-cols-2 animate-in slide-in-from-bottom-4 duration-500">
          {/* Secciones */}
          <AcademicCard className="border-t-4 border-t-sky-500">
            <AcademicCardHeader
              title="Secciones y Cohortes"
              subtitle={`Gestión de grupos para ${selectedCurso.nombre_curso}`}
              action={
                <Button
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" />}
                  className="h-9 px-3 text-[10px] uppercase font-black"
                  onClick={() => setShowNewSeccion(true)}
                >
                  Añadir Sección
                </Button>
              }
            />
            <AcademicCardBody className="p-0">
              {filteredSecciones.length === 0 ? (
                <div className="p-12">
                  <EmptyState icon={<Users className="h-8 w-8" />} title="Sin secciones" message="Crea una sección para asignar alumnos." />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredSecciones.map((sec) => (
                    <div key={sec.id_seccion} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                          <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{sec.nombre_seccion}</div>
                          <div className="mt-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {sec.jornada || "Jornada no definida"} · {sec.cupo} Cupos
                          </div>
                        </div>
                      </div>
                      <StatusBadge label={sec.estado} tone={seccionTone(sec.estado)} />
                    </div>
                  ))}
                </div>
              )}
            </AcademicCardBody>
          </AcademicCard>

          {/* Clases */}
          <AcademicCard className="border-t-4 border-t-purple-500">
            <AcademicCardHeader
              title="Planificación de Clases"
              subtitle={`Agenda de sesiones de simulación`}
              action={
                <Button
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" />}
                  className="h-9 px-3 text-[10px] uppercase font-black"
                  onClick={() => setShowNewClase(true)}
                >
                  Planificar Clase
                </Button>
              }
            />
            <AcademicCardBody className="p-0">
              {filteredClases.length === 0 ? (
                <div className="p-12">
                  <EmptyState icon={<Calendar className="h-8 w-8" />} title="Sin clases planificadas" message="Agenda una clase para iniciar simulaciones." />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredClases.map((clase) => (
                    <div key={clase.id_clase} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{clase.nombre_clase}</div>
                          <div className="mt-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {clase.fecha}
                          </div>
                        </div>
                      </div>
                      <StatusBadge label={clase.estado} tone={claseTone(clase.estado)} />
                    </div>
                  ))}
                </div>
              )}
            </AcademicCardBody>
          </AcademicCard>
        </div>
      ) : null}

      <Modal open={showNewSeccion} onClose={() => setShowNewSeccion(false)} title="Nueva sección">
        <form onSubmit={(e) => void handleCreateSeccion(e)} className="flex flex-col gap-4">
          <FormField label="Nombre de sección" htmlFor="sec-nombre">
            <Input id="sec-nombre" name="nombre_seccion" placeholder="Ej: RC24-A" required />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Jornada" htmlFor="sec-jornada">
              <Input id="sec-jornada" name="jornada" placeholder="Diurna" />
            </FormField>
            <FormField label="Cupo" htmlFor="sec-cupo">
              <Input id="sec-cupo" name="cupo" type="number" min={0} defaultValue={28} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
            <Button variant="secondary" type="button" onClick={() => setShowNewSeccion(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear sección</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showNewClase} onClose={() => setShowNewClase(false)} title="Nueva clase">
        <form onSubmit={(e) => void handleCreateClase(e)} className="flex flex-col gap-4">
          <FormField label="Nombre de clase" htmlFor="clase-nombre">
            <Input id="clase-nombre" name="nombre_clase" placeholder="Ej: Servicio Cocina Internacional" required />
          </FormField>
          <FormField label="Fecha" htmlFor="clase-fecha">
            <Input id="clase-fecha" name="fecha" type="date" required />
          </FormField>
          <FormField label="Tipo de servicio" htmlFor="clase-servicio">
            <Input id="clase-servicio" name="tipo_servicio" placeholder="Entrada + Fondo + Postre" />
          </FormField>
          {filteredSecciones.length > 0 ? (
            <FormField label="Sección (opcional)" htmlFor="clase-seccion">
              <select
                id="clase-seccion"
                name="id_seccion"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/5"
                defaultValue=""
              >
                <option value="">Sin sección</option>
                {filteredSecciones.map((sec) => (
                  <option key={sec.id_seccion} value={sec.id_seccion}>
                    {sec.nombre_seccion}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}
          <FormField label="Objetivo" htmlFor="clase-objetivo">
            <Input id="clase-objetivo" name="objetivo" placeholder="Objetivo de la sesión" />
          </FormField>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
            <Button variant="secondary" type="button" onClick={() => setShowNewClase(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear clase</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showNewCurso} onClose={() => setShowNewCurso(false)} title="Nuevo curso académico">
        <form onSubmit={(e) => void handleCreateCurso(e)} className="flex flex-col gap-6">
          <FormField label="Nombre del curso" htmlFor="curso-nombre"><Input id="curso-nombre" name="nombre" placeholder="Ej: Gastronomía Internacional I" required /></FormField>
          <FormField label="Asignatura operativa" htmlFor="curso-asignatura"><Input id="curso-asignatura" name="asignatura" placeholder="Ej: Técnicas de Cocina" required /></FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Sección inicial" htmlFor="curso-sec"><Input id="curso-sec" name="seccion_base" placeholder="Ej: RC24-A" required /></FormField>
            <FormField label="Código curso" htmlFor="curso-codigo"><Input id="curso-codigo" name="codigo" placeholder="Ej: GAST101" /></FormField>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-6">
            <Button variant="secondary" type="button" onClick={() => setShowNewCurso(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" className="w-full sm:w-auto shadow-orange-500/20">Registrar Curso</Button>
          </div>
        </form>
      </Modal>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
