import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AreaSimulacion,
  DetalleSimulacionAcademica,
  EvaluacionAcademica,
  ImprevistoSimulacion,
  PanelAlumnoAcademico,
  PerfilAcademico,
  ReporteAcademicoSimulacion,
  RolSimulacionDetalle,
  Simulacion,
  TrazabilidadAcademica,
} from "@/lib/academic-types";
import { obtenerPedidosLocales } from "./pos-mutations";
import { listarSimulacionesLocales, listarAreasLocales, listarRolesLocales } from "./simulation-mutations";
import { listarTrazabilidadLocal } from "./trazabilidad-mutations";
import { demoUsuarios } from "./demo-data-academic";

function construirPanelAlumnoDemo(idPerfil?: string): PanelAlumnoAcademico | null {
  const simulacion = listarSimulacionesLocales()[0];
  if (!simulacion) return null;

  const roles = listarRolesLocales().filter(
    (role) => role.id_simulacion === simulacion.id_simulacion,
  );
  if (!roles.length) return null;

  const rol =
    (idPerfil
      ? roles.find((candidate) => candidate.id_alumno === idPerfil)
      : null) ?? roles[0];

  const areas = listarAreasLocales().filter(
    (area) => area.id_simulacion === simulacion.id_simulacion,
  );
  const trazabilidad = listarTrazabilidadLocal().filter(
    (trace) => trace.id_simulacion === simulacion.id_simulacion,
  );
  const usuarioDemo = demoUsuarios.find((user) => user.id_usuario === rol.id_alumno);

  const perfil: PerfilAcademico = {
    id_perfil: rol.id_alumno,
    id_institucion: "demo-udla",
    nombre_completo: usuarioDemo?.nombre ?? rol.nombre_alumno ?? "Alumno demo",
    correo: usuarioDemo?.correo ?? `${rol.id_alumno}@udla.demo`,
    rol_academico: "alumno",
    identificador_institucional: usuarioDemo?.identificador_institucional,
    seccion: usuarioDemo?.seccion ?? "RC24",
    estado: "activo",
  };

  return {
    perfil,
    simulacion,
    rol: rol as RolSimulacionDetalle,
    area: areas.find((area) => area.area_trabajo === rol.area_trabajo),
    evaluaciones: [],
    imprevistos: [],
    trazabilidad: trazabilidad as TrazabilidadAcademica[],
  };
}

/* ───── Operaciones de Dashboard ───── */

export async function listarSimulacionesAcademicas(): Promise<Simulacion[]> {
  if (!isSupabaseConfigured()) return listarSimulacionesLocales();

  const { data, error } = await getSupabaseBrowserClient()
    .from("simulaciones")
    .select("*")
    .order("id_simulacion", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Simulacion[];
}

export async function listarReportesAcademicosSimulacion(): Promise<ReporteAcademicoSimulacion[]> {
  if (!isSupabaseConfigured()) {
    const sims = listarSimulacionesLocales();
    const pedidos = await obtenerPedidosLocales();
    
    return sims.map((s) => {
      const pedidosSim = pedidos.filter((p) => p.id_simulacion === s.id_simulacion);
      const ventaTotal = pedidosSim.reduce((sum, p) => sum + p.total_neto, 0);
      
      return {
        id_simulacion: s.id_simulacion,
        nombre_simulacion: s.nombre_simulacion ?? s.id_simulacion,
        nombre_curso: "Gastronomía Internacional I",
        nombre_clase: "Servicio de Almuerzo",
        estado: s.estado,
        alumnos_asignados: 5,
        pedidos_operativos: pedidosSim.length,
        venta_operativa_total: ventaTotal,
        movimientos_bodega: 0,
        imprevistos_activos: 0,
        imprevistos_totales: 0,
        feedbacks_comensal: 0,
        respuestas_evaluacion: 0,
        acciones_registradas: 10,
        satisfaccion_promedio: 0,
      };
    });
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("reporte_academico_simulacion")
    .select("*")
    .order("nombre_simulacion", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ReporteAcademicoSimulacion[];
}

export async function obtenerDetalleSimulacionAcademica(
  id_simulacion: string,
): Promise<DetalleSimulacionAcademica | null> {
  if (!id_simulacion) return null;

  if (!isSupabaseConfigured()) {
    const areas = listarAreasLocales().filter(a => a.id_simulacion === id_simulacion);
    const roles = listarRolesLocales().filter(r => r.id_simulacion === id_simulacion);
    const trazabilidad = listarTrazabilidadLocal().filter(t => t.id_simulacion === id_simulacion);

    return {
      id_simulacion,
      areas: areas as AreaSimulacion[],
      roles: roles as RolSimulacionDetalle[],
      evaluaciones: [],
      imprevistos: [],
      trazabilidad: trazabilidad as TrazabilidadAcademica[],
    };
  }

  const supabase = getSupabaseBrowserClient();

  const [areasRes, rolesRes, evaluRes, impreRes, trazaRes] = await Promise.all([
    supabase.from("areas_simulacion").select("*").eq("id_simulacion", id_simulacion),
    supabase.from("roles_simulacion").select("*").eq("id_simulacion", id_simulacion),
    supabase.from("evaluaciones").select("*").eq("id_simulacion", id_simulacion),
    supabase.from("imprevistos_simulacion").select("*").eq("id_simulacion", id_simulacion),
    supabase.from("trazabilidad_academica").select("*").eq("id_simulacion", id_simulacion).limit(10),
  ]);

  if (areasRes.error) throw new Error(areasRes.error.message);

  return {
    id_simulacion,
    areas: (areasRes.data ?? []) as AreaSimulacion[],
    roles: (rolesRes.data ?? []) as RolSimulacionDetalle[],
    evaluaciones: (evaluRes.data ?? []) as EvaluacionAcademica[],
    imprevistos: (impreRes.data ?? []) as ImprevistoSimulacion[],
    trazabilidad: (trazaRes.data ?? []) as TrazabilidadAcademica[],
  };
}

export async function obtenerPanelAlumnoAcademico(
  id_perfil?: string,
): Promise<PanelAlumnoAcademico | null> {
  if (!isSupabaseConfigured()) return construirPanelAlumnoDemo(id_perfil);

  const supabase = getSupabaseBrowserClient();
  
  // Si no hay id_perfil, buscamos el activo (demo logic)
  let perfilQuery = supabase.from("perfiles_academicos").select("*").eq("estado", "activo");
  if (id_perfil) perfilQuery = perfilQuery.eq("id_perfil", id_perfil);
  
  const { data: perfilData } = await perfilQuery.maybeSingle();
  if (!perfilData) return construirPanelAlumnoDemo(id_perfil);

  const perfil = perfilData as PerfilAcademico;

  // Buscar su rol activo
  const { data: rolData } = await supabase
    .from("roles_simulacion")
    .select("*")
    .eq("id_alumno", perfil.id_perfil)
    .order("id_rol_simulacion", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rolData) return construirPanelAlumnoDemo(id_perfil);
  const rol = rolData as RolSimulacionDetalle;

  // Obtener simulacion y detalles
  const sim = await supabase.from("simulaciones").select("*").eq("id_simulacion", rol.id_simulacion).single();
  if (sim.error) return construirPanelAlumnoDemo(id_perfil);

  const detalle = await obtenerDetalleSimulacionAcademica(rol.id_simulacion);

  return {
    perfil,
    simulacion: sim.data as Simulacion,
    rol,
    area: detalle?.areas.find(a => a.area_trabajo === rol.area_trabajo),
    evaluaciones: detalle?.evaluaciones || [],
    imprevistos: detalle?.imprevistos || [],
    trazabilidad: detalle?.trazabilidad || [],
  };
}
