import { isSupabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase";
import type { Trazabilidad } from "@/lib/academic-types";
import { demoTrazabilidad } from "@/lib/demo-data-academic";

const localTrazabilidad = [...demoTrazabilidad];
let trazIdCounter = 500;

/**
 * Registra una acción en el log de trazabilidad del sistema.
 * Requerido por el PRD para auditoría de alumnos y profesores.
 */
export async function registrarTrazabilidad(params: {
  id_usuario: string;
  id_simulacion?: string;
  modulo: string;
  accion: string;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  observacion?: string;
}): Promise<void> {
  const registro: Trazabilidad = {
    id_trazabilidad: `traz-${trazIdCounter++}`,
    id_usuario: params.id_usuario,
    id_simulacion: params.id_simulacion,
    modulo: params.modulo,
    accion: params.accion,
    valor_anterior: params.valor_anterior ? JSON.stringify(params.valor_anterior) : undefined,
    valor_nuevo: params.valor_nuevo ? JSON.stringify(params.valor_nuevo) : undefined,
    observacion: params.observacion ?? "",
    fecha_hora: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    localTrazabilidad.unshift(registro);
    console.log(" [TRAZABILIDAD] ", registro);
    return;
  }

  const { error } = await getSupabaseBrowserClient()
    .from("trazabilidad_academica")
    .insert({
      id_usuario: registro.id_usuario,
      id_simulacion: registro.id_simulacion,
      modulo: registro.modulo,
      accion: registro.accion,
      valor_anterior: registro.valor_anterior,
      valor_nuevo: registro.valor_nuevo,
      fecha_hora: registro.fecha_hora
    });

  if (error) console.error("Error registrando trazabilidad:", error.message);
}

/**
 * Lista los registros de trazabilidad (opcionalmente filtrados por simulación o usuario).
 */
export async function listarTrazabilidad(filtros?: {
  id_simulacion?: string;
  id_usuario?: string;
}): Promise<Trazabilidad[]> {
  if (!isSupabaseConfigured()) {
    let result = [...localTrazabilidad];
    if (filtros?.id_simulacion) result = result.filter(t => t.id_simulacion === filtros.id_simulacion);
    if (filtros?.id_usuario) result = result.filter(t => t.id_usuario === filtros.id_usuario);
    return result;
  }

  let query = getSupabaseBrowserClient()
    .from("trazabilidad_academica")
    .select("*")
    .order("fecha_hora", { ascending: false });

  if (filtros?.id_simulacion) query = query.eq("id_simulacion", filtros.id_simulacion);
  if (filtros?.id_usuario) query = query.eq("id_usuario", filtros.id_usuario);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export function listarTrazabilidadLocal() { return [...localTrazabilidad]; }
