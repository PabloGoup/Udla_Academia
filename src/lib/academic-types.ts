/* ───────────────────── TIPOS BASE Y ENUMS ───────────────────── */

export type RolUsuario = "administrador" | "profesor" | "alumno" | "comensal";

export type EstadoSimulacion =
  | "creada"
  | "configurada"
  | "alumnos_asignados"
  | "productos_cargados"
  | "pre_servicio"
  | "servicio_activo"
  | "servicio_cerrado"
  | "reporte_generado"
  | "evaluacion_finalizada"
  | "archivada";

export type AreaTrabajo =
  | "bodega"
  | "cocina"
  | "bar"
  | "garzon"
  | "caja"
  | "pasteleria"
  | "supervision";

export type EstadoMesa = "libre" | "ocupada" | "sucia";
export type EstadoComanda = "pendiente" | "preparando" | "listo" | "entregado";

/* ───────────────────── PERFILES Y USUARIOS ───────────────────── */

export interface PerfilAcademico {
  id_perfil: string;
  id_usuario?: string;
  id_institucion?: string;
  nombre_completo: string;
  correo: string;
  rol_academico: RolUsuario;
  identificador_institucional?: string;
  seccion?: string;
  foto_perfil_url?: string | null;
  estado: "activo" | "inactivo" | "suspendido" | "pendiente_activacion";
  rut?: string;
  telefono?: string;
  correo_secundario?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  observaciones?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Usuario {
  id_usuario: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  seccion?: string;
  identificador_institucional?: string;
  foto_perfil_url?: string | null;
  estado: "activo" | "inactivo" | "suspendido";
  fecha_creacion: string;
}

/* ───────────────────── GESTIÓN ACADÉMICA ───────────────────── */

export interface Curso {
  id_curso: string;
  nombre_curso: string;
  asignatura: string;
  seccion: string;
  id_profesor: string;
  codigo_curso?: string;
  periodo?: string;
  estado: "borrador" | "activo" | "cerrado" | "archivado";
}

export interface Seccion {
  id_seccion: string;
  id_curso: string;
  nombre_seccion: string;
  jornada?: string;
  cupo: number;
  estado: string;
}

export interface Clase {
  id_clase: string;
  id_curso: string;
  nombre_clase: string;
  fecha: string;
  objetivo: string;
  estado: string;
}

export interface Simulacion {
  id_simulacion: string;
  id_clase: string;
  nombre_simulacion?: string;
  tipo_servicio: string;
  estado: EstadoSimulacion;
  fecha_inicio?: string;
  fecha_cierre?: string;
  duracion_estimada: number;
  fecha_creacion?: string;
}

export interface AreaSimulacion {
  id_area_simulacion: string;
  id_simulacion: string;
  area_trabajo: AreaTrabajo;
  responsable?: string;
  estado: "pendiente" | "lista" | "observada" | "cerrada";
  observacion: string;
}

export interface RolSimulacionDetalle {
  id_rol_simulacion: string;
  id_simulacion: string;
  id_alumno: string;
  id_grupo?: string;
  rol_asignado: string;
  area_trabajo: AreaTrabajo;
  permisos: string[];
  estado: "asignado" | "activo" | "finalizado";
  nombre_alumno: string;
  correo_alumno?: string;
  foto_perfil_url?: string | null;
}

// Alias para compatibilidad
export type RolSimulacion = RolSimulacionDetalle;

/* ───────────────────── EVALUACIONES E IMPREVISTOS ───────────────────── */

export interface EvaluacionAcademica {
  id_evaluacion: string;
  id_simulacion?: string;
  id_clase?: string;
  id_profesor?: string;
  tipo_evaluacion: string;
  titulo: string;
  descripcion: string;
  rol_objetivo?: string;
  puntaje_maximo: number;
  intentos_permitidos: number;
  tiempo_limite_minutos?: number;
  nota_automatica: boolean;
  correccion_manual: boolean;
  pauta: Record<string, unknown>;
  estado: "borrador" | "publicada" | "cerrada";
}

export interface ImprevistoSimulacion {
  id_imprevisto: string;
  id_simulacion: string;
  id_profesor?: string;
  tipo_imprevisto: string;
  descripcion: string;
  area_afectada?: AreaTrabajo;
  estado: "activo" | "resuelto" | "mitigado";
  impacto: Record<string, unknown>;
  fecha_activacion: string;
  fecha_cierre?: string;
}

/* ───────────────────── REPORTES Y DASHBOARD ───────────────────── */

export interface ReporteAcademicoSimulacion {
  id_simulacion: string;
  nombre_simulacion: string;
  estado: EstadoSimulacion;
  nombre_clase: string;
  nombre_curso: string;
  alumnos_asignados: number;
  acciones_registradas: number;
  pedidos_operativos: number;
  venta_operativa_total: number;
  movimientos_bodega: number;
  imprevistos_activos: number;
  imprevistos_totales: number;
  feedbacks_comensal: number;
  satisfaccion_promedio?: number;
  respuestas_evaluacion: number;
}

export interface DetalleSimulacionAcademica {
  id_simulacion: string;
  areas: AreaSimulacion[];
  roles: RolSimulacionDetalle[];
  evaluaciones: EvaluacionAcademica[];
  imprevistos: ImprevistoSimulacion[];
  trazabilidad: TrazabilidadAcademica[];
}

export interface TrazabilidadAcademica {
  id_trazabilidad: string;
  id_usuario?: string;
  id_perfil?: string;
  id_simulacion?: string;
  id_clase?: string;
  rol?: string;
  modulo: string;
  accion: string;
  entidad?: string;
  id_entidad?: string;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  observacion: string;
  fecha_hora: string;
}

// Alias para compatibilidad
export type Trazabilidad = TrazabilidadAcademica;

export interface PanelAlumnoAcademico {
  perfil: PerfilAcademico;
  simulacion: Simulacion;
  rol: RolSimulacionDetalle;
  area?: AreaSimulacion;
  evaluaciones: EvaluacionAcademica[];
  imprevistos: ImprevistoSimulacion[];
  trazabilidad: TrazabilidadAcademica[];
}

/* ───────────────────── BODEGA E INVENTARIO ───────────────────── */

export interface ProductoBodega {
  id_producto: string;
  nombre_producto: string;
  categoria: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  temperatura?: number;
  ubicacion?: string;
  estado: string;
}

export type CategoriaBodega =
  | "carnes"
  | "pescados_mariscos"
  | "lacteos"
  | "verduras"
  | "frutas"
  | "secos"
  | "congelados"
  | "bebidas"
  | "insumos_bar"
  | "aseo_higiene";

export interface MovimientoBodega {
  id_movimiento: string;
  id_producto: string;
  tipo_movimiento: "ingreso" | "egreso" | "merma" | "ajuste";
  cantidad: number;
  motivo: string;
  usuario_responsable: string;
  fecha_hora: string;
}

/* ───────────────────── RECETAS TÉCNICAS ───────────────────── */

export interface Receta {
  id_receta: string;
  nombre_receta: string;
  categoria: string;
  costo_total: number;
  precio_venta: number;
  rendimiento: number;
  porciones: number;
  margen: number;
  procedimiento: string;
}

export interface IngredienteReceta {
  id_ingrediente: string;
  id_receta: string;
  id_producto: string;
  cantidad: number;
  unidad_medida: string;
  merma_porcentaje: number;
  rendimiento_porcentaje: number;
}

/* ───────────────────── POS Y SALÓN ───────────────────── */

export interface Mesa {
  id_mesa: string;
  numero_mesa: number;
  capacidad: number;
  estado: EstadoMesa;
  id_simulacion?: string;
}

export interface Pedido {
  id_pedido: string;
  id_simulacion: string;
  id_mesa: string;
  estado: "abierto" | "pagado" | "cancelado";
  total_neto: number;
  total_iva: number;
  total_final: number;
  fecha_creacion: string;
}

export interface DetallePedido {
  id_detalle: string;
  id_pedido: string;
  id_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  estado: EstadoComanda;
  area_destino: "cocina" | "bar";
  notas?: string;
}

export interface FeedbackCierreServicio {
  nombre_comensal: string;
  puntuacion_atencion: number;
  puntuacion_sabor: number;
  puntuacion_presentacion: number;
  puntuacion_tiempo: number;
  puntuacion_limpieza: number;
  puntuacion_experiencia: number;
  comentario?: string;
}
