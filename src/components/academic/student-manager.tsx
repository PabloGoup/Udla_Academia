"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Plus, Search, Upload, UserPlus, Users } from "lucide-react";
import type { Usuario } from "@/lib/academic-types";
import {
  listarAlumnos,
  crearAlumno,
  importarAlumnosCSV,
  type AlumnoDraft,
} from "@/lib/academic-mutations";
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

export function StudentManager() {
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  /* modals */
  const [showNewAlumno, setShowNewAlumno] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<{
    importados: number;
    errores: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarAlumnos();
      setAlumnos(data);
      setFilteredAlumnos(data);
    } catch {
      setToast({ message: "Error cargando alumnos.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlumnos();
  }, [loadAlumnos]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAlumnos(alumnos);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredAlumnos(
      alumnos.filter(
        (a) =>
          a.nombre.toLowerCase().includes(q) ||
          a.correo.toLowerCase().includes(q) ||
          (a.seccion ?? "").toLowerCase().includes(q) ||
          (a.identificador_institucional ?? "").toLowerCase().includes(q),
      ),
    );
  }, [searchQuery, alumnos]);

  async function handleCreateAlumno(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const draft: AlumnoDraft = {
      nombre: form.get("nombre") as string,
      correo: form.get("correo") as string,
      seccion: (form.get("seccion") as string) || undefined,
      identificador_institucional: (form.get("identificador") as string) || undefined,
    };

    const result = await crearAlumno(draft);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowNewAlumno(false);
      void loadAlumnos();
    }
  }

  async function handleImportCSV() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setToast({ message: "Selecciona un archivo CSV.", tone: "error" });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const result = await importarAlumnosCSV(text);
      setImportResult({ importados: result.importados, errores: result.errores });
      setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
      if (result.importados > 0) void loadAlumnos();
    } catch {
      setToast({ message: "Error procesando el archivo.", tone: "error" });
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Cargando alumnos…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <AcademicCard>
        <AcademicCardHeader
          title="Alumnos"
          subtitle={`${alumnos.length} alumno(s) registrado(s)`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => setShowImport(true)} className="text-xs">Importar</Button>
              <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowNewAlumno(true)}>Nuevo alumno</Button>
            </div>
          }
        />
        <AcademicCardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Buscar por nombre, correo, sección o identificador…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard>
        <AcademicCardBody className="p-0">
          {filteredAlumnos.length === 0 ? (
            <div className="px-5 py-10">
              <EmptyState icon={<Users className="h-8 w-8" />} title={searchQuery ? "Sin resultados" : "Sin alumnos"} message="Agrega alumnos manualmente o importa desde un archivo CSV." />
            </div>
          ) : (
            <>
              <div className="hidden items-center gap-4 border-b border-slate-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 md:grid md:grid-cols-[1fr_1fr_100px_100px_80px] dark:border-white/10 dark:text-slate-400">
                <span>Nombre</span><span>Correo</span><span>Sección</span><span>ID</span><span>Estado</span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredAlumnos.map((alumno) => (
                  <div key={alumno.id_usuario} className="grid items-center gap-2 px-5 py-3 md:grid-cols-[1fr_1fr_100px_100px_80px] md:gap-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{alumno.nombre}</div>
                    <div className="text-sm font-medium text-slate-600 truncate dark:text-slate-400">{alumno.correo}</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{alumno.seccion ?? "—"}</div>
                    <div className="text-xs font-medium text-slate-600 truncate dark:text-slate-400">{alumno.identificador_institucional ?? "—"}</div>
                    <div><StatusBadge label={alumno.estado} tone={alumno.estado === "activo" ? "emerald" : "zinc"} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <Modal open={showNewAlumno} onClose={() => setShowNewAlumno(false)} title="Nuevo alumno">
        <form onSubmit={(e) => void handleCreateAlumno(e)} className="flex flex-col gap-4">
          <FormField label="Nombre completo" htmlFor="alumno-nombre"><Input id="alumno-nombre" name="nombre" required /></FormField>
          <FormField label="Correo electrónico" htmlFor="alumno-correo"><Input id="alumno-correo" name="correo" type="email" required /></FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Sección" htmlFor="alumno-seccion"><Input id="alumno-seccion" name="seccion" /></FormField>
            <FormField label="Identificador" htmlFor="alumno-id"><Input id="alumno-id" name="identificador" /></FormField>
          </div>
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowNewAlumno(false)}>Cancelar</Button>
            <Button type="submit" icon={<Plus className="h-4 w-4" />}>Crear alumno</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importar desde CSV">
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.02]">
            <p className="font-medium text-slate-900 dark:text-slate-300">Formato: nombre,correo,identificador</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" className="text-sm" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowImport(false)}>Cerrar</Button>
            <Button onClick={() => void handleImportCSV()} disabled={importing}>{importing ? "Importando…" : "Importar"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
