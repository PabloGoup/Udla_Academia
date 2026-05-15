import type {
  AreaSimulacion,
  EstadoSimulacion,
} from "@/lib/academic-types";

export const estadoLabels: Record<EstadoSimulacion, string> = {
  creada: "Creada",
  configurada: "Configurada",
  alumnos_asignados: "Alumnos Asignados",
  productos_cargados: "Bodega Cargada",
  pre_servicio: "Mise-en-place",
  servicio_activo: "SERVICIO ACTIVO",
  servicio_cerrado: "Servicio Finalizado",
  reporte_generado: "Reporte de Cierre",
  evaluacion_finalizada: "Evaluación Completa",
  archivada: "Archivada",
};

export const areaLabels: Record<string, string> = {
  bodega: "Bodega e Inventario",
  cocina: "Cocina Principal",
  bar: "Bar y Bebidas",
  garzon: "Salón y Servicio",
  caja: "Caja y Finanzas",
  pasteleria: "Pastelería",
  supervision: "Supervisión",
};

export const areaStatusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  lista: "Lista para Servicio",
  observada: "Con Observaciones",
  cerrada: "Cerrada",
};

export const imprevistoLabels: Record<string, string> = {
  corte_luz: "Corte de Suministro Eléctrico",
  falta_insumo: "Quiebre de Stock Crítico",
  accidente: "Accidente Laboral",
  retraso_proveedor: "Retraso de Proveedor",
  queja_cliente: "Queja de Comensal",
  error_comanda: "Error en Comanda",
  equipo_defectuoso: "Falla de Maquinaria",
};
