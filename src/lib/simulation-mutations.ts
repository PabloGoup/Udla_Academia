import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Simulacion,
  AreaSimulacion,
  AreaTrabajo,
  RolSimulacion,
  EstadoSimulacion,
} from "@/lib/academic-types";
import {
  demoSimulaciones,
  demoAreasSimulacion,
  demoRolesSimulacion,
  demoUsuarios,
} from "@/lib/demo-data-academic";
import type { ResultadoMutacion } from "@/lib/academic-mutations";
import { registrarTrazabilidad } from "./trazabilidad-mutations";

/* ─────────── Estado local demo ─────────── */

const localSimulaciones = [...demoSimulaciones];
const localAreas = [...demoAreasSimulacion];
const localRoles = [...demoRolesSimulacion];
let simIdCounter = 200;
const simulationStateFlow: EstadoSimulacion[] = [
  "creada",
  "configurada",
  "alumnos_asignados",
  "productos_cargados",
  "pre_servicio",
  "servicio_activo",
  "servicio_cerrado",
  "reporte_generado",
  "evaluacion_finalizada",
  "archivada",
];

function nextId(prefix: string): string {
  simIdCounter += 1;
  return `${prefix}-${simIdCounter}`;
}

function esTransicionValida(
  actual: EstadoSimulacion,
  siguiente: EstadoSimulacion,
): boolean {
  const iActual = simulationStateFlow.indexOf(actual);
  const iSiguiente = simulationStateFlow.indexOf(siguiente);
  return iActual >= 0 && iSiguiente === iActual + 1;
}

async function validarReglasTransicionDemo(
  id_simulacion: string,
  nuevoEstado: EstadoSimulacion,
): Promise<string | null> {
  const areas = localAreas.filter((area) => area.id_simulacion === id_simulacion);
  const roles = localRoles.filter((rol) => rol.id_simulacion === id_simulacion);

  if (nuevoEstado === "configurada" && areas.length === 0) {
    return "Debes definir áreas de trabajo antes de configurar la simulación.";
  }

  if (nuevoEstado === "alumnos_asignados" && roles.length === 0) {
    return "Debes asignar al menos un rol de alumno antes de continuar.";
  }

  if (nuevoEstado === "productos_cargados") {
    const { listarProductosSimulacion } = await import("./warehouse-mutations");
    const productos = await listarProductosSimulacion(id_simulacion);
    if (productos.length === 0) {
      return "Debes cargar productos/stock de simulación antes de continuar.";
    }
  }

  if (nuevoEstado === "servicio_activo") {
    if (areas.length === 0) {
      return "No hay áreas configuradas para iniciar servicio.";
    }
    const areasNoListas = areas.filter((area) => area.estado !== "lista");
    if (areasNoListas.length > 0) {
      return "Todas las áreas deben estar en estado lista antes de iniciar servicio.";
    }
  }

  if (nuevoEstado === "servicio_cerrado") {
    const { obtenerPedidosLocales } = await import("./pos-mutations");
    const pedidosActivos = (await obtenerPedidosLocales()).filter(
      (pedido) =>
        pedido.id_simulacion === id_simulacion &&
        pedido.estado !== "pagado" &&
        pedido.estado !== "cancelado",
    );
    if (pedidosActivos.length > 0) {
      return "No puedes cerrar servicio con pedidos abiertos o en preparación.";
    }
  }

  return null;
}

async function validarReglasTransicionSupabase(
  id_simulacion: string,
  nuevoEstado: EstadoSimulacion,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();

  if (nuevoEstado === "configurada") {
    const { count } = await supabase
      .from("areas_simulacion")
      .select("id_area_simulacion", { count: "exact", head: true })
      .eq("id_simulacion", id_simulacion);
    if (!count) return "Debes definir áreas de trabajo antes de configurar la simulación.";
  }

  if (nuevoEstado === "alumnos_asignados") {
    const { count } = await supabase
      .from("roles_simulacion")
      .select("id_rol_simulacion", { count: "exact", head: true })
      .eq("id_simulacion", id_simulacion);
    if (!count) return "Debes asignar al menos un rol de alumno antes de continuar.";
  }

  if (nuevoEstado === "productos_cargados") {
    const [productosRes, recetasRes] = await Promise.all([
      supabase
        .from("simulacion_productos")
        .select("id_simulacion_producto", { count: "exact", head: true })
        .eq("id_simulacion", id_simulacion),
      supabase
        .from("simulacion_recetas")
        .select("id_simulacion_receta", { count: "exact", head: true })
        .eq("id_simulacion", id_simulacion),
    ]);
    const total = (productosRes.count ?? 0) + (recetasRes.count ?? 0);
    if (total === 0) {
      return "Debes cargar recetas o productos de simulación antes de continuar.";
    }
  }

  if (nuevoEstado === "servicio_activo") {
    const { data: areas, error } = await supabase
      .from("areas_simulacion")
      .select("estado")
      .eq("id_simulacion", id_simulacion);
    if (error) return error.message;
    if (!areas?.length) return "No hay áreas configuradas para iniciar servicio.";
    const faltantes = areas.filter((area) => area.estado !== "lista");
    if (faltantes.length > 0) {
      return "Todas las áreas deben estar en estado lista antes de iniciar servicio.";
    }
  }

  if (nuevoEstado === "servicio_cerrado") {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("id_simulacion", id_simulacion)
      .in("status", ["pending", "preparing", "ready", "delivered"]);
    if (error) return error.message;
    if ((count ?? 0) > 0) {
      return "No puedes cerrar servicio con pedidos abiertos o sin cierre de caja.";
    }
  }

  if (nuevoEstado === "evaluacion_finalizada") {
    const [evaluacionesRes, respuestasRes] = await Promise.all([
      supabase
        .from("evaluaciones")
        .select("id_evaluacion", { count: "exact", head: true })
        .eq("id_simulacion", id_simulacion),
      supabase
        .from("respuestas_evaluacion")
        .select("id_respuesta", { count: "exact", head: true })
        .eq("id_simulacion", id_simulacion),
    ]);
    if ((evaluacionesRes.count ?? 0) > 0 && (respuestasRes.count ?? 0) === 0) {
      return "Debes registrar respuestas de evaluación antes de finalizar.";
    }
  }

  return null;
}

/* ─────────── Listar simulaciones ─────────── */

export async function listarSimulaciones(id_clase?: string): Promise<Simulacion[]> {
  if (!isSupabaseConfigured()) {
    return id_clase
      ? localSimulaciones.filter((s) => s.id_clase === id_clase)
      : [...localSimulaciones];
  }

  let query = getSupabaseBrowserClient()
    .from("simulaciones")
    .select("id_simulacion,id_clase,nombre_simulacion,tipo_servicio,estado,fecha_inicio,fecha_cierre,duracion_estimada_minutos")
    .order("id_simulacion", { ascending: false });

  if (id_clase) query = query.eq("id_clase", id_clase);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id_simulacion: r.id_simulacion,
    id_clase: r.id_clase,
    tipo_servicio: r.tipo_servicio,
    estado: r.estado as EstadoSimulacion,
    fecha_inicio: r.fecha_inicio ?? undefined,
    fecha_cierre: r.fecha_cierre ?? undefined,
    duracion_estimada: r.duracion_estimada_minutos,
  }));
}

export async function obtenerSimulacion(id: string): Promise<Simulacion | null> {
  if (!isSupabaseConfigured()) {
    return localSimulaciones.find((s) => s.id_simulacion === id) ?? null;
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("simulaciones")
    .select("*")
    .eq("id_simulacion", id)
    .single();

  if (error || !data) return null;

  return {
    id_simulacion: data.id_simulacion,
    id_clase: data.id_clase,
    tipo_servicio: data.tipo_servicio,
    estado: data.estado as EstadoSimulacion,
    fecha_inicio: data.fecha_inicio ?? undefined,
    fecha_cierre: data.fecha_cierre ?? undefined,
    duracion_estimada: data.duracion_estimada_minutos,
  };
}

/* ─────────── Áreas de simulación ─────────── */

export async function listarAreasSimulacion(id_simulacion: string): Promise<AreaSimulacion[]> {
  if (!isSupabaseConfigured()) {
    return localAreas.filter((a) => a.id_simulacion === id_simulacion);
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("areas_simulacion")
    .select("*")
    .eq("id_simulacion", id_simulacion);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function actualizarEstadoArea(id_area: string, estado: "pendiente" | "lista" | "observada" | "cerrada"): Promise<ResultadoMutacion> {
  if (!isSupabaseConfigured()) {
    const area = localAreas.find(a => a.id_area_simulacion === id_area);
    if (area) area.estado = estado;
    return { ok: true, mensaje: "Estado de área actualizado (demo)" };
  }

  const { error } = await getSupabaseBrowserClient()
    .from("areas_simulacion")
    .update({ estado })
    .eq("id_area_simulacion", id_area);

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true, mensaje: "Simulación actualizada" };
}

export function listarSimulacionesLocales() { return [...localSimulaciones]; }
export function listarAreasLocales() { return [...localAreas]; }
export function listarRolesLocales() { return [...localRoles]; }

/* ─────────── Roles de simulación ─────────── */

export interface RolDetalle extends RolSimulacion {
  nombre_alumno: string;
}

export async function listarRolesSimulacion(id_simulacion: string): Promise<RolDetalle[]> {
  if (!isSupabaseConfigured()) {
    const roles = localRoles.filter((r) => r.id_simulacion === id_simulacion);
    return roles.map(r => ({
      ...r,
      nombre_alumno: demoUsuarios.find(u => u.id_usuario === r.id_alumno)?.nombre || "Alumno"
    }));
  }
  return [];
}

export async function asignarRolSimulacion(draft: Partial<RolSimulacion>): Promise<ResultadoMutacion> {
  if (!draft.id_alumno || !draft.rol_asignado || !draft.area_trabajo) {
    return { ok: false, mensaje: "Faltan datos de asignación" };
  }

  if (!isSupabaseConfigured()) {
    const id = nextId("rol");
    localRoles.push({
      id_rol_simulacion: id,
      id_simulacion: draft.id_simulacion!,
      id_alumno: draft.id_alumno!,
      rol_asignado: draft.rol_asignado!,
      area_trabajo: draft.area_trabajo!,
      permisos: [],
      estado: "asignado",
      nombre_alumno: demoUsuarios.find(u => u.id_usuario === draft.id_alumno)?.nombre || "Alumno"
    });

    await registrarTrazabilidad({
      id_usuario: "prof-1",
      id_simulacion: draft.id_simulacion,
      modulo: "simulacion_roles",
      accion: "asignar_rol",
      valor_nuevo: `${draft.rol_asignado} -> ${draft.id_alumno}`,
    });

    return { ok: true, mensaje: "Rol asignado (demo).", id };
  }
  return { ok: true, mensaje: "Rol asignado." };
}

/* ─────────── Crear simulación ─────────── */

export interface SimulationDraft {
  id_clase: string;
  nombre_simulacion: string;
  tipo_servicio: string;
  objetivo: string;
  duracion_estimada: number;
  areas_activas: string[];
}

export async function crearSimulacion(draft: SimulationDraft): Promise<ResultadoMutacion> {
  if (!draft.id_clase || !draft.tipo_servicio) {
    return { ok: false, mensaje: "Faltan datos obligatorios para la simulación." };
  }

  if (!isSupabaseConfigured()) {
    const id = nextId("sim");
    const nuevaSim: Simulacion = {
      id_simulacion: id,
      id_clase: draft.id_clase,
      tipo_servicio: draft.tipo_servicio,
      estado: "creada",
      duracion_estimada: draft.duracion_estimada,
    };

    localSimulaciones.push(nuevaSim);

    // Crear áreas iniciales en modo demo
    draft.areas_activas.forEach(area => {
      localAreas.push({
        id_area_simulacion: nextId("area"),
        id_simulacion: id,
        area_trabajo: area as AreaTrabajo,
        estado: "pendiente",
        observacion: "",
      });
    });

    await registrarTrazabilidad({
      id_usuario: "prof-1",
      id_simulacion: id,
      modulo: "simulacion",
      accion: "crear_simulacion",
      valor_nuevo: draft.nombre_simulacion,
    });

    return { ok: true, mensaje: "Simulación creada (demo).", id };
  }

  // Lógica Supabase: Insertar simulación y luego áreas
  const { data, error } = await getSupabaseBrowserClient()
    .from("simulaciones")
    .insert({
      id_clase: draft.id_clase,
      nombre_simulacion: draft.nombre_simulacion,
      tipo_servicio: draft.tipo_servicio,
      objetivo: draft.objetivo,
      estado: "creada",
      duracion_estimada_minutos: draft.duracion_estimada,
    })
    .select("id_simulacion")
    .single();

  if (error) return { ok: false, mensaje: error.message };

  const id_simulacion = data.id_simulacion;

  if (draft.areas_activas.length > 0) {
    const batchAreas = draft.areas_activas.map(area => ({
      id_simulacion,
      area_trabajo: area,
      estado: "pendiente"
    }));
    await getSupabaseBrowserClient().from("areas_simulacion").insert(batchAreas);
  }

  return { ok: true, mensaje: "Simulación creada.", id: id_simulacion };
}

/* ─────────── Avanzar estado ─────────── */

export async function avanzarEstadoSimulacion(
  id_simulacion: string,
  nuevoEstado: EstadoSimulacion,
): Promise<ResultadoMutacion> {
  const actual = await obtenerSimulacion(id_simulacion);
  if (!actual) return { ok: false, mensaje: "Simulación no encontrada" };

  if (!esTransicionValida(actual.estado, nuevoEstado)) {
    return {
      ok: false,
      mensaje: `Transición no permitida: ${actual.estado} -> ${nuevoEstado}.`,
    };
  }

  if (!isSupabaseConfigured()) {
    const sim = localSimulaciones.find(s => s.id_simulacion === id_simulacion);
    if (!sim) return { ok: false, mensaje: "Simulación no encontrada" };

    const bloqueo = await validarReglasTransicionDemo(id_simulacion, nuevoEstado);
    if (bloqueo) return { ok: false, mensaje: bloqueo };

    const estadoAnterior = sim.estado;
    sim.estado = nuevoEstado;

    if (nuevoEstado === "servicio_activo") sim.fecha_inicio = new Date().toISOString();
    if (nuevoEstado === "servicio_cerrado") sim.fecha_cierre = new Date().toISOString();

    await registrarTrazabilidad({
      id_usuario: "prof-1",
      id_simulacion,
      modulo: "simulacion",
      accion: "cambiar_estado",
      valor_anterior: estadoAnterior,
      valor_nuevo: nuevoEstado,
    });

    return { ok: true, mensaje: `Estado actualizado a ${nuevoEstado} (demo).` };
  }

  const bloqueo = await validarReglasTransicionSupabase(id_simulacion, nuevoEstado);
  if (bloqueo) return { ok: false, mensaje: bloqueo };

  const payload: Record<string, unknown> = { estado: nuevoEstado };
  if (nuevoEstado === "servicio_activo") payload.fecha_inicio = new Date().toISOString();
  if (nuevoEstado === "servicio_cerrado") payload.fecha_cierre = new Date().toISOString();

  const { error } = await getSupabaseBrowserClient()
    .from("simulaciones")
    .update(payload)
    .eq("id_simulacion", id_simulacion);
  if (error) return { ok: false, mensaje: error.message };

  await registrarTrazabilidad({
    id_usuario: "profesor-supabase",
    id_simulacion,
    modulo: "simulacion",
    accion: "cambiar_estado",
    valor_anterior: actual.estado,
    valor_nuevo: nuevoEstado,
    observacion: "Cambio de estado validado por flujo académico-operativo.",
  });

  return { ok: true, mensaje: `Estado actualizado a ${nuevoEstado}.` };
}
