import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { PerfilAcademico, RolUsuario } from "@/lib/academic-types";
import type { ResultadoMutacion } from "@/lib/academic-mutations";
import { demoUsuarios } from "@/lib/demo-data-academic";

export type EstadoPerfilAcademico =
  | "activo"
  | "inactivo"
  | "suspendido"
  | "pendiente_activacion";

export interface PerfilAcademicoDraft {
  id_perfil?: string;
  nombre_completo: string;
  rut: string;
  correo: string;
  rol_academico: Exclude<RolUsuario, "comensal">;
  estado: EstadoPerfilAcademico;
  telefono?: string;
  correo_secundario?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  observaciones?: string;
  password_inicial?: string;
  enviar_credenciales?: boolean;
}

export interface PerfilAcademicoListItem extends PerfilAcademico {
  rut?: string;
  telefono?: string;
  correo_secundario?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  observaciones?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

function mapPerfilRow(row: Record<string, unknown>): PerfilAcademicoListItem {
  return {
    id_perfil: String(row.id_perfil),
    id_usuario: row.id_usuario ? String(row.id_usuario) : undefined,
    id_institucion: row.id_institucion ? String(row.id_institucion) : undefined,
    nombre_completo: String(row.nombre_completo),
    correo: String(row.correo),
    rol_academico: row.rol_academico as PerfilAcademicoListItem["rol_academico"],
    rut: row.rut ? String(row.rut) : row.identificador_institucional ? String(row.identificador_institucional) : undefined,
    identificador_institucional: row.identificador_institucional
      ? String(row.identificador_institucional)
      : row.rut
        ? String(row.rut)
        : undefined,
    telefono: row.telefono ? String(row.telefono) : undefined,
    correo_secundario: row.correo_secundario ? String(row.correo_secundario) : undefined,
    direccion: row.direccion ? String(row.direccion) : undefined,
    fecha_nacimiento: row.fecha_nacimiento ? String(row.fecha_nacimiento) : undefined,
    observaciones: row.observaciones ? String(row.observaciones) : undefined,
    foto_perfil_url: row.foto_perfil_url ? String(row.foto_perfil_url) : null,
    estado: row.estado as PerfilAcademicoListItem["estado"],
    fecha_creacion: row.fecha_creacion ? String(row.fecha_creacion) : undefined,
    fecha_actualizacion: row.fecha_actualizacion ? String(row.fecha_actualizacion) : undefined,
  };
}

export async function listarPerfilesInstitucionales(): Promise<PerfilAcademicoListItem[]> {
  if (!isSupabaseConfigured()) {
    return demoUsuarios.map((user) => ({
      id_perfil: user.id_usuario,
      nombre_completo: user.nombre,
      correo: user.correo,
      rol_academico: user.rol === "profesor" ? "profesor" : user.rol,
      rut: user.identificador_institucional,
      identificador_institucional: user.identificador_institucional,
      estado: user.estado,
      fecha_creacion: user.fecha_creacion,
    }));
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("perfiles_academicos")
    .select(
      "id_perfil,id_usuario,id_institucion,nombre_completo,correo,rut,identificador_institucional,rol_academico,telefono,correo_secundario,direccion,fecha_nacimiento,observaciones,foto_perfil_url,estado,fecha_creacion,fecha_actualizacion",
    )
    .neq("rol_academico", "comensal")
    .order("nombre_completo");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPerfilRow(row as Record<string, unknown>));
}

export async function guardarPerfilInstitucional(
  draft: PerfilAcademicoDraft,
): Promise<ResultadoMutacion> {
  if (!draft.nombre_completo.trim()) {
    return { ok: false, mensaje: "El nombre completo es obligatorio." };
  }
  if (!draft.rut.trim()) {
    return { ok: false, mensaje: "El RUT es obligatorio." };
  }
  if (!draft.correo.trim()) {
    return { ok: false, mensaje: "El correo es obligatorio." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      mensaje: "Perfil guardado en modo demo (sin Supabase).",
      id: draft.id_perfil ?? `demo-${Date.now()}`,
    };
  }

  const needsAuthAccount =
    Boolean(draft.password_inicial?.trim()) &&
    draft.estado === "activo" &&
    !draft.id_perfil;

  if (needsAuthAccount) {
    const response = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = (await response.json()) as ResultadoMutacion & { id?: string };
    return {
      ok: payload.ok,
      mensaje: payload.mensaje,
      id: payload.id,
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("admin_upsert_perfil_academico", {
    payload: {
      id_perfil: draft.id_perfil ?? null,
      nombre_completo: draft.nombre_completo.trim(),
      rut: draft.rut.trim(),
      correo: draft.correo.trim().toLowerCase(),
      rol_academico: draft.rol_academico,
      telefono: draft.telefono?.trim() ?? null,
      correo_secundario: draft.correo_secundario?.trim().toLowerCase() ?? null,
      direccion: draft.direccion?.trim() ?? null,
      fecha_nacimiento: draft.fecha_nacimiento ?? null,
      observaciones: draft.observaciones?.trim() ?? null,
      estado: draft.estado,
    },
  });

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true, mensaje: "Perfil guardado correctamente.", id: String(data) };
}
