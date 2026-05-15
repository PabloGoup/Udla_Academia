import type { RolUsuario } from "@/lib/academic-types";

export type AccionPermiso =
  | "usuarios.gestionar"
  | "usuarios.crear_docente"
  | "usuarios.crear_alumno"
  | "asignaturas.gestionar"
  | "secciones.gestionar"
  | "simulaciones.gestionar"
  | "evaluaciones.gestionar"
  | "reportes.globales"
  | "configuracion.global"
  | "perfil.propio";

const permisosPorRol: Record<RolUsuario, AccionPermiso[]> = {
  administrador: [
    "usuarios.gestionar",
    "usuarios.crear_docente",
    "usuarios.crear_alumno",
    "asignaturas.gestionar",
    "secciones.gestionar",
    "simulaciones.gestionar",
    "evaluaciones.gestionar",
    "reportes.globales",
    "configuracion.global",
    "perfil.propio",
  ],
  profesor: [
    "usuarios.crear_alumno",
    "secciones.gestionar",
    "simulaciones.gestionar",
    "evaluaciones.gestionar",
    "perfil.propio",
  ],
  alumno: ["perfil.propio"],
  comensal: [],
};

export function puede(rol: RolUsuario | null | undefined, accion: AccionPermiso): boolean {
  if (!rol) return false;
  return permisosPorRol[rol]?.includes(accion) ?? false;
}

export function esAdministrador(rol: RolUsuario | null | undefined): boolean {
  return rol === "administrador";
}

export function esDocente(rol: RolUsuario | null | undefined): boolean {
  return rol === "profesor" || rol === "administrador";
}
