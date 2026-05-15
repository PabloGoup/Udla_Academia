"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GraduationCap, RefreshCw, Utensils, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  obtenerDetalleSimulacionAcademica,
  obtenerPanelAlumnoAcademico,
} from "@/lib/academic-operations";
import { listarRolesLocales } from "@/lib/simulation-mutations";
import type { PanelAlumnoAcademico } from "@/lib/academic-types";
import {
  buildStudentTasks,
  calculateStudentDashboardMetrics,
} from "@/lib/student-academic-dashboard";
import { PanelMessage } from "@/components/academic/academic-ui";
import { StudentActivityPanel } from "@/components/academic/student-activity-panel";
import { StudentOverview } from "@/components/academic/student-overview";
import { StudentWorkflowPanel } from "@/components/academic/student-workflow-panel";
import {
  getRoleSimulation,
  isRoleSimulation,
  ROLE_SIMULATION_OPTIONS,
  type RoleSimulation,
} from "@/lib/role-simulation";

type StudentDashboardState = "loading" | "ready" | "empty" | "error";
type StudentRoleOption = {
  idPerfil: string;
  nombreAlumno: string;
  rolAsignado: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function StudentAcademicDashboard() {
  const router = useRouter();
  const [state, setState] = useState<StudentDashboardState>("loading");
  const [panel, setPanel] = useState<PanelAlumnoAcademico | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [roleOptions, setRoleOptions] = useState<StudentRoleOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<RoleSimulation>("alumno");

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

      const nextOptions =
        (detail?.roles.length ? detail.roles : localRoles).map((role) => ({
          idPerfil: role.id_alumno,
          nombreAlumno: role.nombre_alumno,
          rolAsignado: role.rol_asignado,
        })) ?? [];

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
    const savedRole = localStorage.getItem("udla-role-sim");
    if (isRoleSimulation(savedRole)) {
      setSimulatedRole(savedRole);
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

  const switchSimulatedRole = (roleId: RoleSimulation) => {
    setSimulatedRole(roleId);
    localStorage.setItem("udla-role-sim", roleId);
    const role = getRoleSimulation(roleId);
    if (!role) return;
    router.push(role.defaultRoute);
  };

  return (
    <main className="min-h-screen bg-white text-slate-100">
      <div className="mx-auto flex w-full max-w-full flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col max-w-full gap-4 bg-orange-50 border-b border-black/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
         
          <div className="space-y-2 py-2 px-2">
          <div className="mt-3 rounded-lg  p-2 dark:border-white/10 dark:bg-white">
                          <Image
                            src="/logo-original-udla.png"
                            alt="UDLA"
                            width={220}
                            height={64}
                            className="object-contain"
                          />
                        </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-orange-600">
              
              <GraduationCap className="h-4 w-4" />
              Portal alumno
            </div>
               
            <div>
              <h1 className="text-2xl font-semibold text-black sm:text-3xl">
                Simulacion activa
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Vista de rol, area, tareas, evaluaciones e historial conectado
                al servicio academico.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center px-4 gap-2">
            
            <button
              type="button"
              onClick={() => void loadPanel()}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-black/15 bg-black/5 px-3 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/10"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-black/15 bg-black/5 px-3 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/10"
            >
              <Utensils className="h-4 w-4" />
              Operacion
            </Link>
          </div>
    
        </header>

        <section className="rounded-xl border border-black/10 bg-black/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
            <GraduationCap className="h-4 w-4" />
            Simulacion de rol (maestro)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ROLE_SIMULATION_OPTIONS.map((roleOption) => {
              const active = roleOption.id === simulatedRole;
              return (
                <button
                  key={roleOption.id}
                  type="button"
                  onClick={() => switchSimulatedRole(roleOption.id)}
                  className={`col-span-2 rounded-lg border px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition sm:col-span-1 ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-600/20"
                      : "border-black/10 bg-black/[0.02] text-black hover:border-orange-600/40 hover:bg-black/[0.06]"
                  }`}
                >
                  {roleOption.label}
                </button>
              );
            })}
          </div>
        </section>

        {state === "ready" && roleOptions.length > 0 ? (
          <section className="rounded-xl border border-black/10 bg-black/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
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
                    className={`col-span-2 rounded-lg border px-3 py-2 text-left transition sm:col-span-1 ${
                      active
                        ? "border-orange-500 bg-orange-500/20 text-orange-600 shadow-md shadow-orange-600/20"
                        : "border-black/10 bg-black/[0.02] text-black hover:border-orange-600/40 hover:bg-black/[0.06]"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wide">
                      {option.rolAsignado}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      {option.nombreAlumno}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {state === "loading" ? (
          <PanelMessage
            title="Cargando simulacion"
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
            title="Sin simulacion activa"
            message="No hay un alumno con rol asignado a una simulacion academica disponible."
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
    </main>
  );
}
