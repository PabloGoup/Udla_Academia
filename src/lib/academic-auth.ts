import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { AuthProfile } from "@/lib/operations";
import type { PerfilAcademico, RolUsuario } from "@/lib/academic-types";
import type { RoleSimulation } from "@/lib/role-simulation";
import { demoUsuarios } from "@/lib/demo-data-academic";

const DEMO_PROFESOR_ID = "prof-1";

export function mapRolAcademicoANavegacion(
  rol: RolUsuario | string | null | undefined,
): RoleSimulation {
  switch (rol) {
    case "administrador":
      return "administrador";
    case "profesor":
      return "docente";
    case "alumno":
      return "alumno";
    default:
      return "docente";
  }
}

export function resolverRolNavegacion(
  perfil: PerfilAcademico | null,
  authProfile: AuthProfile | null,
): RoleSimulation {
  if (perfil?.rol_academico) {
    return mapRolAcademicoANavegacion(perfil.rol_academico);
  }

  if (authProfile?.role === "administrator" || authProfile?.role === "master") {
    return "administrador";
  }

  return "docente";
}

export async function obtenerPerfilAcademicoSesion(): Promise<PerfilAcademico | null> {
  if (!isSupabaseConfigured()) {
    return {
      id_perfil: DEMO_PROFESOR_ID,
      id_institucion: "demo-udla",
      nombre_completo: demoUsuarios.find((u) => u.rol === "profesor")?.nombre ?? "Profesor demo",
      correo: demoUsuarios.find((u) => u.rol === "profesor")?.correo ?? "profesor@udla.demo",
      rol_academico: "profesor",
      seccion: "RC24",
      estado: "activo",
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const userId = authData.user.id;
  const email = authData.user.email ?? "";

  const { data, error } = await supabase
    .from("perfiles_academicos")
    .select(
      "id_perfil,id_institucion,id_usuario,nombre_completo,correo,rut,identificador_institucional,rol_academico,seccion,telefono,correo_secundario,direccion,fecha_nacimiento,observaciones,foto_perfil_url,estado,fecha_creacion,fecha_actualizacion",
    )
    .or(`id_usuario.eq.${userId},correo.eq.${email}`)
    .eq("estado", "activo")
    .maybeSingle();

  if (error || !data) return null;

  return data as PerfilAcademico;
}

export async function obtenerIdProfesorSesion(): Promise<string> {
  const perfil = await obtenerPerfilAcademicoSesion();
  if (perfil?.id_perfil) return perfil.id_perfil;
  return DEMO_PROFESOR_ID;
}
