import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Curso,
  Clase,
  Usuario,
  Seccion,
} from "@/lib/academic-types";
import {
  demoCursos,
  demoSecciones,
  demoClases,
  demoUsuarios,
} from "@/lib/demo-data-academic";

/* ───────────────────── Resultado genérico ───────────────────── */

export interface ResultadoMutacion {
  ok: boolean;
  mensaje: string;
  id?: string;
}

/* ─────────────────── Estado local demo ─────────────────── */

const localCursos = [...demoCursos];
const localSecciones = [...demoSecciones];
const localClases = [...demoClases];
const localUsuarios = [...demoUsuarios];
let localIdCounter = 100;

function nextId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${localIdCounter}`;
}

/* ───────────────── Cursos ───────────────── */

export async function listarCursos(): Promise<Curso[]> {
  if (!isSupabaseConfigured()) return [...localCursos];

  const { data, error } = await getSupabaseBrowserClient()
    .from("cursos")
    .select("id_curso,id_profesor,nombre_curso,asignatura,seccion,codigo_curso,periodo,estado")
    .order("nombre_curso");

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id_curso: r.id_curso,
    id_profesor: r.id_profesor,
    nombre_curso: r.nombre_curso,
    asignatura: r.asignatura,
    seccion: r.seccion,
    codigo_curso: r.codigo_curso ?? undefined,
    periodo: r.periodo ?? undefined,
    estado: r.estado as Curso["estado"],
  }));
}

export interface CursoDraft {
  nombre_curso: string;
  asignatura: string;
  seccion: string;
  id_profesor: string;
  codigo_curso?: string;
  periodo?: string;
}

export async function crearCurso(draft: CursoDraft): Promise<ResultadoMutacion> {
  if (!draft.nombre_curso.trim()) return { ok: false, mensaje: "El nombre del curso es obligatorio." };
  if (!draft.asignatura.trim()) return { ok: false, mensaje: "La asignatura es obligatoria." };

  if (!isSupabaseConfigured()) {
    const id = nextId("curso");
    localCursos.push({
      id_curso: id,
      id_profesor: draft.id_profesor,
      nombre_curso: draft.nombre_curso.trim(),
      asignatura: draft.asignatura.trim(),
      seccion: draft.seccion,
      codigo_curso: draft.codigo_curso,
      periodo: draft.periodo,
      estado: "activo",
    });
    return { ok: true, mensaje: "Curso creado (demo).", id };
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("cursos")
    .insert({
      nombre_curso: draft.nombre_curso.trim(),
      asignatura: draft.asignatura.trim(),
      seccion: draft.seccion,
      codigo_curso: draft.codigo_curso ?? null,
      periodo: draft.periodo ?? null,
      id_profesor: draft.id_profesor,
    })
    .select("id_curso")
    .single();

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true, mensaje: "Curso creado.", id: data.id_curso };
}

/* ───────────────── Secciones ───────────────── */

export async function listarSecciones(id_curso?: string): Promise<Seccion[]> {
  if (!isSupabaseConfigured()) {
    return id_curso
      ? localSecciones.filter((s) => s.id_curso === id_curso)
      : [...localSecciones];
  }

  let query = getSupabaseBrowserClient()
    .from("secciones")
    .select("id_seccion,id_curso,nombre_seccion,jornada,cupo,estado")
    .order("nombre_seccion");

  if (id_curso) query = query.eq("id_curso", id_curso);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id_seccion: r.id_seccion,
    id_curso: r.id_curso,
    nombre_seccion: r.nombre_seccion,
    jornada: r.jornada ?? undefined,
    cupo: Number(r.cupo ?? 0),
    estado: r.estado as string,
  }));
}

/* ───────────────── Clases ───────────────── */

export async function listarClases(id_curso?: string): Promise<Clase[]> {
  if (!isSupabaseConfigured()) {
    return id_curso
      ? localClases.filter((c) => c.id_curso === id_curso)
      : [...localClases];
  }

  let query = getSupabaseBrowserClient()
    .from("clases")
    .select("id_clase,id_curso,nombre_clase,fecha,objetivo,estado")
    .order("fecha", { ascending: false });

  if (id_curso) query = query.eq("id_curso", id_curso);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id_clase: r.id_clase,
    id_curso: r.id_curso,
    nombre_clase: r.nombre_clase,
    fecha: r.fecha,
    objetivo: r.objetivo ?? "",
    estado: r.estado as string,
  }));
}

/* ───────────────── Usuarios (Alumnos) ───────────────── */

export async function listarAlumnos(seccion?: string): Promise<Usuario[]> {
  if (!isSupabaseConfigured()) {
    const alumnos = localUsuarios.filter((u) => u.rol === "alumno");
    return seccion ? alumnos.filter((a) => a.seccion === seccion) : alumnos;
  }

  let query = getSupabaseBrowserClient()
    .from("usuarios")
    .select("id_usuario,nombre,correo,rol,seccion,identificador_institucional,estado,fecha_creacion")
    .eq("rol", "alumno")
    .order("nombre");

  if (seccion) query = query.eq("seccion", seccion);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id_usuario: r.id_usuario,
    nombre: r.nombre,
    correo: r.correo,
    rol: r.rol,
    seccion: r.seccion ?? undefined,
    identificador_institucional: r.identificador_institucional ?? undefined,
    estado: r.estado as "activo" | "inactivo" | "suspendido",
    fecha_creacion: r.fecha_creacion,
  }));
}

export interface AlumnoDraft {
  nombre: string;
  correo: string;
  seccion?: string;
  identificador_institucional?: string;
}

export async function crearAlumno(draft: AlumnoDraft): Promise<ResultadoMutacion> {
  if (!draft.nombre.trim()) return { ok: false, mensaje: "El nombre es obligatorio." };
  if (!draft.correo.trim()) return { ok: false, mensaje: "El correo es obligatorio." };

  if (!isSupabaseConfigured()) {
    const id = nextId("alum");
    localUsuarios.push({
      id_usuario: id,
      nombre: draft.nombre.trim(),
      correo: draft.correo.trim(),
      rol: "alumno",
      seccion: draft.seccion,
      identificador_institucional: draft.identificador_institucional,
      estado: "activo",
      fecha_creacion: new Date().toISOString(),
    });
    return { ok: true, mensaje: "Alumno creado (demo).", id };
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("usuarios")
    .insert({
      nombre: draft.nombre.trim(),
      correo: draft.correo.trim(),
      rol: "alumno",
      seccion: draft.seccion ?? null,
      identificador_institucional: draft.identificador_institucional ?? null,
    })
    .select("id_usuario")
    .single();

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true, mensaje: "Alumno creado.", id: data.id_usuario };
}

export async function importarAlumnosCSV(
  csvText: string,
  seccion?: string
): Promise<ResultadoMutacion & { importados: number; errores: string[] }> {
  const lines = csvText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2)
    return { ok: false, mensaje: "El archivo debe tener encabezado y al menos un alumno.", importados: 0, errores: [] };

  const cols = lines[0].split(/[,;\t]/).map((c) => c.trim().toLowerCase());
  const nameIdx = cols.findIndex((c) => c.includes("nombre"));
  const emailIdx = cols.findIndex((c) => c.includes("correo") || c.includes("email"));
  const idIdx = cols.findIndex((c) => c.includes("identificador") || c.includes("rut") || c.includes("id"));

  let importados = 0;
  const errores: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
    const nombre = parts[nameIdx] ?? "";
    const correo = parts[emailIdx] ?? "";
    const identificador = idIdx >= 0 ? parts[idIdx] : undefined;

    if (!nombre || !correo) {
      errores.push(`Línea ${i + 1}: nombre o correo vacío.`);
      continue;
    }

    const result = await crearAlumno({
      nombre,
      correo,
      seccion,
      identificador_institucional: identificador,
    });

    if (result.ok) {
      importados++;
    } else {
      errores.push(`Línea ${i + 1} (${nombre}): ${result.mensaje}`);
    }
  }

  return {
    ok: errores.length === 0,
    mensaje: `${importados} alumno(s) importado(s).${errores.length > 0 ? ` ${errores.length} error(es).` : ""}`,
    importados,
    errores,
  };
}
