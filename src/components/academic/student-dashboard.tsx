"use client";

import { RefreshCw, UserRound, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  obtenerDetalleSimulacionAcademica,
  obtenerPanelAlumnoAcademico,
} from "@/lib/academic-operations";
import { listarAlumnos } from "@/lib/academic-mutations";
import { listarRolesLocales } from "@/lib/simulation-mutations";
import type { PanelAlumnoAcademico, Usuario } from "@/lib/academic-types";
import {
  buildStudentTasks,
  calculateStudentDashboardMetrics,
} from "@/lib/student-academic-dashboard";
import { PanelMessage } from "@/components/academic/academic-ui";
import { StudentActivityPanel } from "@/components/academic/student-activity-panel";
import { StudentOverview } from "@/components/academic/student-overview";
import { StudentWorkflowPanel } from "@/components/academic/student-workflow-panel";

type StudentDashboardState = "loading" | "ready" | "empty" | "error";
type StudentRoleOption = {
  idPerfil: string;
  nombreAlumno: string;
  rolAsignado: string;
  correo?: string;
  identificador?: string;
  fotoPerfilUrl?: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StudentAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <div
        className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-cover bg-center shadow-sm dark:border-white/10"
        style={{ backgroundImage: `url("${imageUrl}")` }}
        aria-label={`Foto de ${name}`}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-xs font-black text-[var(--udla-orange)] dark:border-orange-500/20 dark:bg-orange-500/10">
      {getInitials(name)}
    </div>
  );
}

export function StudentAcademicDashboard() {
  const [state, setState] = useState<StudentDashboardState>("loading");
  const [panel, setPanel] = useState<PanelAlumnoAcademico | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [roleOptions, setRoleOptions] = useState<StudentRoleOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const loadPanel = useCallback(async (targetProfileId?: string) => {
    setState("loading");
    setErrorMessage("");

    try {
      const nextPanel = await obtenerPanelAlumnoAcademico(targetProfileId);
      setPanel(nextPanel);
      if (!nextPanel) {
        setRoleOptions([]);
        setSelectedProfileId(null);
        setState("empty");
        return;
      }

      const simulationId = nextPanel.simulacion.id_simulacion;
      const localRoles = listarRolesLocales().filter(
        (role) => role.id_simulacion === simulationId,
      );

      const detail = isUuid(simulationId)
        ? await obtenerDetalleSimulacionAcademica(simulationId)
        : null;
      const alumnos = await listarAlumnos();
      const alumnosById = new Map<string, Usuario>(
        alumnos.map((alumno) => [alumno.id_usuario, alumno]),
      );

      const nextOptions =
        (detail?.roles.length ? detail.roles : localRoles).map((role) => {
          const alumno = alumnosById.get(role.id_alumno);
          return {
            idPerfil: role.id_alumno,
            nombreAlumno: role.nombre_alumno ?? alumno?.nombre ?? "Alumno",
            rolAsignado: role.rol_asignado,
            correo: role.correo_alumno ?? alumno?.correo,
            identificador: alumno?.identificador_institucional,
            fotoPerfilUrl: role.foto_perfil_url ?? alumno?.foto_perfil_url ?? null,
          };
        }) ?? [];

      setRoleOptions(nextOptions);
      setSelectedProfileId(nextPanel.perfil.id_perfil);
      setState("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el panel del alumno.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadPanel()
      .then(() => undefined)
      .catch(() => undefined);
  }, [loadPanel]);

  useEffect(() => {
    if (!selectedProfileId || state !== "ready" || !panel) return;
    if (selectedProfileId === panel.perfil.id_perfil) return;

    let ignore = false;
    obtenerPanelAlumnoAcademico(selectedProfileId)
      .then((nextPanel) => {
        if (ignore || !nextPanel) return;
        setPanel(nextPanel);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [selectedProfileId, state, panel]);

  const metrics = useMemo(
    () => (panel ? calculateStudentDashboardMetrics(panel) : null),
    [panel],
  );
  const tasks = useMemo(() => (panel ? buildStudentTasks(panel) : []), [panel]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--udla-orange)]">
              <UserRound className="h-4 w-4" />
              Panel operativo del alumno
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Simulación activa y participación por rol
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              El alumno ve su puesto asignado, tareas del turno, imprevistos,
              evaluaciones e historial conectado al servicio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadPanel()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      {state === "ready" && roleOptions.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--udla-orange)]">
            <UsersRound className="h-4 w-4" />
            Vista por alumno / rol
          </div>
          <div className="grid grid-cols-4 gap-2">
            {roleOptions.map((option) => {
              const active = selectedProfileId === option.idPerfil;
              return (
                <button
                  key={option.idPerfil}
                  type="button"
                  onClick={() => setSelectedProfileId(option.idPerfil)}
                  className={`col-span-4 flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition sm:col-span-2 xl:col-span-1 ${
                    active
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md shadow-orange-600/10 dark:bg-orange-500/10"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-orange-200 hover:bg-orange-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                  }`}
                >
                  <StudentAvatar name={option.nombreAlumno} imageUrl={option.fotoPerfilUrl} />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black uppercase tracking-wide">
                      {option.rolAsignado}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-bold">
                      {option.nombreAlumno}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold opacity-70">
                      {option.identificador ?? option.correo ?? "Sin identificador"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {state === "loading" ? (
        <PanelMessage
          title="Cargando simulación"
          message="Buscando la clase activa, el rol asignado y las tareas del alumno."
        />
      ) : null}

      {state === "error" ? (
        <PanelMessage
          title="No se pudo cargar el panel"
          message={errorMessage}
          tone="error"
        />
      ) : null}

      {state === "empty" ? (
        <PanelMessage
          title="Sin simulación activa"
          message="No hay un alumno con rol asignado a una simulación académica disponible."
        />
      ) : null}

      {state === "ready" && panel && metrics ? (
        <>
          <StudentOverview panel={panel} metrics={metrics} />
          <StudentWorkflowPanel tasks={tasks} />
          <StudentActivityPanel panel={panel} />
        </>
      ) : null}
    </div>
  );
}
