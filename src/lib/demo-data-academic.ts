import type {
  Usuario,
  Curso,
  Seccion,
  Clase,
  Simulacion,
  RolSimulacion,
  AreaSimulacion,
  Trazabilidad,
} from "@/lib/academic-types";

/* ───── perfiles / usuarios ───── */

export const demoUsuarios: Usuario[] = [
  {
    id_usuario: "prof-1",
    nombre: "Carlos Méndez Ríos",
    correo: "cmendez@udla.cl",
    rol: "profesor",
    seccion: "RC24",
    estado: "activo",
    fecha_creacion: "2026-01-01T10:00:00Z",
  },
  {
    id_usuario: "alum-1",
    nombre: "Valentina Torres Soto",
    correo: "vtorres@udla.cl",
    rol: "alumno",
    seccion: "RC24",
    identificador_institucional: "ALU-001",
    estado: "activo",
    fecha_creacion: "2026-03-01T09:00:00Z",
  },
  {
    id_usuario: "alum-2",
    nombre: "Sebastián Muñoz Herrera",
    correo: "smunoz@udla.cl",
    rol: "alumno",
    seccion: "RC24",
    identificador_institucional: "ALU-002",
    estado: "activo",
    fecha_creacion: "2026-03-01T09:05:00Z",
  },
  {
    id_usuario: "alum-3",
    nombre: "Camila Bravo Fuentes",
    correo: "cbravo@udla.cl",
    rol: "alumno",
    seccion: "RC24",
    identificador_institucional: "ALU-003",
    estado: "activo",
    fecha_creacion: "2026-03-01T09:10:00Z",
  },
];

/* ───── cursos ───── */

export const demoCursos: Curso[] = [
  {
    id_curso: "curso-1",
    id_profesor: "prof-1",
    nombre_curso: "Cocina Internacional",
    asignatura: "Técnicas de Cocina Internacional",
    seccion: "RC24",
    codigo_curso: "GAC-301",
    periodo: "2026-1",
    estado: "activo",
  },
];

/* ───── secciones ───── */

export const demoSecciones: Seccion[] = [
  {
    id_seccion: "sec-1",
    id_curso: "curso-1",
    nombre_seccion: "RC24",
    jornada: "Diurna",
    cupo: 28,
    estado: "activa",
  },
];

/* ───── clases ───── */

export const demoClases: Clase[] = [
  {
    id_clase: "clase-1",
    id_curso: "curso-1",
    nombre_clase: "Servicio Cocina Internacional",
    fecha: "2026-05-15",
    objetivo: "Ejecutar un servicio completo de entrada, plato de fondo y postre con técnicas internacionales.",
    estado: "activa",
  },
];

/* ───── simulaciones ───── */

export const demoSimulaciones: Simulacion[] = [
  {
    id_simulacion: "sim-1",
    id_clase: "clase-1",
    tipo_servicio: "Entrada + Plato de fondo + Postre",
    estado: "pre_servicio",
    fecha_inicio: "2026-05-15T09:00:00Z",
    duracion_estimada: 120,
  },
];

/* ───── áreas de simulación ───── */

export const demoAreasSimulacion: AreaSimulacion[] = [
  { id_area_simulacion: "area-1", id_simulacion: "sim-1", area_trabajo: "bodega", estado: "lista", observacion: "" },
  { id_area_simulacion: "area-2", id_simulacion: "sim-1", area_trabajo: "cocina", estado: "lista", observacion: "" },
  { id_area_simulacion: "area-3", id_simulacion: "sim-1", area_trabajo: "bar", estado: "pendiente", observacion: "Falta verificar stock de licores" },
];

/* ───── roles de simulación ───── */

export const demoRolesSimulacion: RolSimulacion[] = [
  { 
    id_rol_simulacion: "rol-1", 
    id_simulacion: "sim-1", 
    id_alumno: "alum-1", 
    rol_asignado: "jefe de cocina", 
    area_trabajo: "cocina", 
    permisos: [],
    estado: "asignado",
    nombre_alumno: "Valentina Torres Soto"
  },
  { 
    id_rol_simulacion: "rol-2", 
    id_simulacion: "sim-1", 
    id_alumno: "alum-2", 
    rol_asignado: "cocinero", 
    area_trabajo: "cocina", 
    permisos: [],
    estado: "asignado",
    nombre_alumno: "Sebastián Muñoz Herrera"
  },
  { 
    id_rol_simulacion: "rol-3", 
    id_simulacion: "sim-1", 
    id_alumno: "alum-3", 
    rol_asignado: "encargado de bodega", 
    area_trabajo: "bodega", 
    permisos: [],
    estado: "asignado",
    nombre_alumno: "Camila Bravo Fuentes"
  },
];

/* ───── trazabilidad ───── */

export const demoTrazabilidad: Trazabilidad[] = [
  {
    id_trazabilidad: "traz-1",
    id_usuario: "prof-1",
    id_simulacion: "sim-1",
    modulo: "simulacion",
    accion: "cambiar_estado",
    valor_anterior: "configurada",
    valor_nuevo: "pre_servicio",
    observacion: "Apertura de fase pre-servicio",
    fecha_hora: "2026-05-15T09:00:00Z",
  },
];
