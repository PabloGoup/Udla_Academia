import type { RolUsuario } from "@/lib/academic-types";
import type { RoleSimulation } from "@/lib/role-simulation";

export function rutaPorRolAcademico(rol: RolUsuario | string | null | undefined): string {
  switch (rol) {
    case "administrador":
      return "/academico";
    case "profesor":
      return "/academico";
    case "alumno":
      return "/academico/alumno";
    case "comensal":
      return "/comensal/menu";
    default:
      return "/academico";
  }
}

export function rutaPorRolSimulacion(rol: RoleSimulation): string {
  if (rol === "alumno") return "/academico/alumno";
  return "/academico";
}
