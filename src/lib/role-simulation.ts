export type RoleSimulation = "master" | "administrador" | "docente" | "alumno";

export type RoleSimulationOption = {
  id: RoleSimulation;
  label: string;
  description: string;
  defaultRoute: string;
};

export const ROLE_SIMULATION_OPTIONS: RoleSimulationOption[] = [
  {
    id: "master",
    label: "Maestro",
    description: "Vision total de modulos, permisos y configuracion.",
    defaultRoute: "/academico",
  },
  {
    id: "administrador",
    label: "Administrador",
    description: "Control institucional, cursos, perfiles y operacion.",
    defaultRoute: "/academico",
  },
  {
    id: "docente",
    label: "Docente",
    description: "Gestion de clases, simulaciones, evaluacion y seguimiento.",
    defaultRoute: "/academico",
  },
  {
    id: "alumno",
    label: "Alumno",
    description: "Portal del alumno con rol, tareas y trazabilidad.",
    defaultRoute: "/academico/alumno",
  },
];

export function isRoleSimulation(value: string | null): value is RoleSimulation {
  if (!value) return false;
  return ROLE_SIMULATION_OPTIONS.some((role) => role.id === value);
}

export function getRoleSimulation(
  roleId: RoleSimulation,
): RoleSimulationOption | undefined {
  return ROLE_SIMULATION_OPTIONS.find((role) => role.id === roleId);
}
