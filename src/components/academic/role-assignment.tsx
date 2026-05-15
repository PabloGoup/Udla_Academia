"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, UserCog, Users } from "lucide-react";
import type { AreaTrabajo, Usuario, AreaSimulacion, RolSimulacionDetalle } from "@/lib/academic-types";
import { listarAlumnos } from "@/lib/academic-mutations";
import {
  listarRolesSimulacion,
  listarAreasSimulacion,
  asignarRolSimulacion,
} from "@/lib/simulation-mutations";
import {
  AcademicCard,
  AcademicCardHeader,
  AcademicCardBody,
  Button,
  EmptyState,
  FormField,
  Modal,
  OperationToast,
  Select,
} from "@/components/ui/academic-ui-kit";

const ROLES_PREDEFINIDOS = [
  "jefe de cocina",
  "cocinero",
  "encargado de bodega",
  "garzón",
  "bartender",
  "cajero",
  "pastelero",
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StudentAvatar({ alumno, name }: { alumno?: Usuario; name: string }) {
  if (alumno?.foto_perfil_url) {
    return (
      <div
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-cover bg-center shadow-sm dark:border-white/10"
        style={{ backgroundImage: `url("${alumno.foto_perfil_url}")` }}
        aria-label={`Foto de ${name}`}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-[11px] font-black text-[var(--udla-orange)] dark:border-orange-500/20 dark:bg-orange-500/10">
      {getInitials(name)}
    </div>
  );
}

interface RoleAssignmentProps {
  id_simulacion: string;
  onRolesChanged?: () => void;
}

export function RoleAssignment({ id_simulacion, onRolesChanged }: RoleAssignmentProps) {
  const [roles, setRoles] = useState<RolSimulacionDetalle[]>([]);
  const [areas, setAreas] = useState<AreaSimulacion[]>([]);
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [selectedRol, setSelectedRol] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, ar, al] = await Promise.all([
        listarRolesSimulacion(id_simulacion),
        listarAreasSimulacion(id_simulacion),
        listarAlumnos(),
      ]);
      setRoles(r as RolSimulacionDetalle[]);
      setAreas(ar);
      setAlumnos(al);
    } catch {
      setToast({ message: "Error cargando roles.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [id_simulacion]);

  useEffect(() => { void load(); }, [load]);

  const assignedIds = new Set(roles.map((r) => r.id_alumno));
  const availableAlumnos = alumnos.filter((a) => !assignedIds.has(a.id_usuario));
  const selectedAlumnoData = alumnos.find((alumno) => alumno.id_usuario === selectedAlumno);

  const rolesByArea = new Map<string, RolSimulacionDetalle[]>();
  for (const r of roles) {
    const list = rolesByArea.get(r.area_trabajo) ?? [];
    list.push(r);
    rolesByArea.set(r.area_trabajo, list);
  }

  async function handleAssign() {
    if (!selectedAlumno || !selectedRol || !selectedArea) return;
    const result = await asignarRolSimulacion({
      id_simulacion,
      id_alumno: selectedAlumno,
      rol_asignado: selectedRol,
      area_trabajo: selectedArea as AreaTrabajo,
    });

    setToast({ message: result.mensaje, tone: result.ok ? "success" : "error" });
    if (result.ok) {
      setShowAssign(false);
      void load();
      onRolesChanged?.();
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-400">Cargando roles…</div>;

  return (
    <div className="flex flex-col gap-6">
      <AcademicCard>
        <AcademicCardHeader
          title="Asignación de Roles"
          subtitle={`${roles.length} alumno(s) asignado(s) · ${availableAlumnos.length} sin asignar`}
          action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAssign(true)} disabled={availableAlumnos.length === 0}>Asignar rol</Button>}
        />
      </AcademicCard>

      {roles.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Sin roles asignados" message="Comienza asignando alumnos a sus puestos de trabajo." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => {
            const areaRoles = rolesByArea.get(area.area_trabajo) ?? [];
            return (
              <AcademicCard key={area.id_area_simulacion}>
                <AcademicCardHeader title={area.area_trabajo.toUpperCase()} subtitle={`${areaRoles.length} asignado(s)`} />
                <AcademicCardBody className="p-0">
                  {areaRoles.length === 0 ? (
                    <div className="p-4 text-center text-[10px] uppercase font-bold text-slate-400">Sin personal</div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-white/5">
                      {areaRoles.map((rol) => (
                        <div key={rol.id_rol_simulacion} className="flex items-center justify-between p-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <StudentAvatar
                              alumno={alumnos.find((alumno) => alumno.id_usuario === rol.id_alumno)}
                              name={rol.nombre_alumno}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{rol.nombre_alumno}</div>
                              <div className="text-xs font-bold text-slate-500 uppercase">{rol.rol_asignado}</div>
                            </div>
                          </div>
                          <button className="text-slate-400 hover:text-red-500 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </AcademicCardBody>
              </AcademicCard>
            );
          })}
        </div>
      )}

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Asignar Alumno a Puesto">
        <div className="flex flex-col gap-4">
          <FormField label="Alumno"><Select value={selectedAlumno} onChange={(e) => setSelectedAlumno(e.target.value)}>
            <option value="">Seleccionar alumno…</option>
            {availableAlumnos.map(a => (
              <option key={a.id_usuario} value={a.id_usuario}>
                {a.nombre} · {a.identificador_institucional ?? a.correo}
              </option>
            ))}
          </Select></FormField>
          {selectedAlumnoData && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <StudentAvatar alumno={selectedAlumnoData} name={selectedAlumnoData.nombre} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{selectedAlumnoData.nombre}</p>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {selectedAlumnoData.identificador_institucional ?? "Sin ID"} · {selectedAlumnoData.correo}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Área de trabajo"><Select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
              <option value="">Seleccionar área…</option>
              {areas.map(a => <option key={a.area_trabajo} value={a.area_trabajo}>{a.area_trabajo.toUpperCase()}</option>)}
            </Select></FormField>
            <FormField label="Rol operativo"><Select value={selectedRol} onChange={(e) => setSelectedRol(e.target.value)}>
              <option value="">Seleccionar rol…</option>
              {ROLES_PREDEFINIDOS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </Select></FormField>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancelar</Button>
            <Button icon={<UserCog className="h-4 w-4" />} onClick={() => void handleAssign()}>Asignar</Button>
          </div>
        </div>
      </Modal>

      {toast && <OperationToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
