"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, UserCog, Users } from "lucide-react";
import {
  guardarPerfilInstitucional,
  listarPerfilesInstitucionales,
  type PerfilAcademicoDraft,
  type PerfilAcademicoListItem,
  type EstadoPerfilAcademico,
} from "@/lib/user-admin-mutations";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  Button,
  FormField,
  Input,
  Modal,
  OperationToast,
  Select,
  StatusBadge,
} from "@/components/ui/academic-ui-kit";

const estadoTone: Record<EstadoPerfilAcademico, "emerald" | "amber" | "red" | "zinc"> = {
  activo: "emerald",
  pendiente_activacion: "amber",
  suspendido: "red",
  inactivo: "zinc",
};

function blankDraft(): PerfilAcademicoDraft {
  return {
    nombre_completo: "",
    rut: "",
    correo: "",
    rol_academico: "alumno",
    estado: "pendiente_activacion",
    telefono: "",
    correo_secundario: "",
    direccion: "",
    observaciones: "",
    password_inicial: "",
  };
}

export function UsersAdminPanel() {
  const [rows, setRows] = useState<PerfilAcademicoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PerfilAcademicoDraft>(blankDraft());
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listarPerfilesInstitucionales());
    } catch {
      setToast({ message: "No se pudo cargar la lista de usuarios.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await guardarPerfilInstitucional(draft);
    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setOpen(false);
      setDraft(blankDraft());
      void load();
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.02]">
        Cargando usuarios institucionales…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        <AcademicCard className="p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
          <div className="text-2xl font-black">{rows.length}</div>
        </AcademicCard>
        <AcademicCard className="p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docentes</div>
          <div className="text-2xl font-black">
            {rows.filter((r) => r.rol_academico === "profesor").length}
          </div>
        </AcademicCard>
        <AcademicCard className="p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alumnos</div>
          <div className="text-2xl font-black">
            {rows.filter((r) => r.rol_academico === "alumno").length}
          </div>
        </AcademicCard>
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Usuarios institucionales"
          subtitle="Solo el administrador crea credenciales y perfiles del sistema."
          action={
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Nuevo usuario
            </Button>
          }
        />
        <AcademicCardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.length === 0 ? (
              <div className="p-8 text-sm font-semibold text-slate-500">Sin usuarios registrados.</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id_perfil}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                      {row.rol_academico === "alumno" ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        <UserCog className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">
                        {row.nombre_completo}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-slate-500">
                        {row.correo} · RUT {row.rut ?? row.identificador_institucional ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={row.rol_academico} tone="sky" />
                    <StatusBadge
                      label={row.estado.replaceAll("_", " ")}
                      tone={estadoTone[row.estado as EstadoPerfilAcademico] ?? "zinc"}
                    />
                    <Button
                      variant="secondary"
                      className="h-8 px-3 text-[10px]"
                      onClick={() => {
                        setDraft({
                          id_perfil: row.id_perfil,
                          nombre_completo: row.nombre_completo,
                          rut: row.rut ?? row.identificador_institucional ?? "",
                          correo: row.correo,
                          rol_academico:
                            row.rol_academico === "comensal" ? "alumno" : row.rol_academico,
                          estado: row.estado as EstadoPerfilAcademico,
                          telefono: row.telefono,
                          correo_secundario: row.correo_secundario,
                          direccion: row.direccion,
                          fecha_nacimiento: row.fecha_nacimiento,
                          observaciones: row.observaciones,
                        });
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </AcademicCardBody>
      </AcademicCard>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setDraft(blankDraft());
        }}
        title={draft.id_perfil ? "Editar usuario" : "Nuevo usuario institucional"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre completo" htmlFor="u-nombre">
              <Input
                id="u-nombre"
                required
                value={draft.nombre_completo}
                onChange={(e) => setDraft((p) => ({ ...p, nombre_completo: e.target.value }))}
              />
            </FormField>
            <FormField label="RUT" htmlFor="u-rut">
              <Input
                id="u-rut"
                required
                value={draft.rut}
                onChange={(e) => setDraft((p) => ({ ...p, rut: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Correo institucional" htmlFor="u-correo">
              <Input
                id="u-correo"
                type="email"
                required
                value={draft.correo}
                onChange={(e) => setDraft((p) => ({ ...p, correo: e.target.value }))}
              />
            </FormField>
            <FormField label="Correo secundario" htmlFor="u-correo-sec">
              <Input
                id="u-correo-sec"
                type="email"
                value={draft.correo_secundario ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, correo_secundario: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Rol" htmlFor="u-rol">
              <Select
                id="u-rol"
                value={draft.rol_academico}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    rol_academico: e.target.value as PerfilAcademicoDraft["rol_academico"],
                  }))
                }
              >
                <option value="administrador">Administrador</option>
                <option value="profesor">Docente</option>
                <option value="alumno">Alumno</option>
              </Select>
            </FormField>
            <FormField label="Estado" htmlFor="u-estado">
              <Select
                id="u-estado"
                value={draft.estado}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    estado: e.target.value as EstadoPerfilAcademico,
                  }))
                }
              >
                <option value="pendiente_activacion">Pendiente activación</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </Select>
            </FormField>
            <FormField label="Teléfono" htmlFor="u-tel">
              <Input
                id="u-tel"
                value={draft.telefono ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value }))}
              />
            </FormField>
          </div>
          {!draft.id_perfil ? (
            <FormField label="Contraseña inicial (solo al activar)" htmlFor="u-pass">
              <Input
                id="u-pass"
                type="password"
                value={draft.password_inicial ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, password_inicial: e.target.value }))}
                placeholder="Requerida si el estado es Activo"
              />
            </FormField>
          ) : null}
          <FormField label="Observaciones" htmlFor="u-obs">
            <Input
              id="u-obs"
              value={draft.observaciones ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, observaciones: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar usuario</Button>
          </div>
        </form>
      </Modal>

      {toast ? (
        <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}
