export interface MesaDemo {
  idMesa: string;
  numero: number;
  capacidad: number;
  estado: "libre" | "ocupada" | "sucia";
}

export const demoMesas: MesaDemo[] = [
  { idMesa: "m-1", numero: 1, capacidad: 4, estado: "libre" },
  { idMesa: "m-2", numero: 2, capacidad: 2, estado: "libre" },
  { idMesa: "m-3", numero: 3, capacidad: 6, estado: "libre" },
  { idMesa: "m-4", numero: 4, capacidad: 4, estado: "libre" },
  { idMesa: "m-5", numero: 5, capacidad: 2, estado: "libre" },
  { idMesa: "m-6", numero: 6, capacidad: 8, estado: "libre" },
];

export interface PedidoDemo {
  idPedido: string;
  idSimulacion: string;
  idMesa: string;
  estado: "abierto" | "pagado" | "anulado";
  fecha: string;
  total: number;
}

export interface DetallePedidoDemo {
  idDetalle: string;
  idPedido: string;
  idReceta: string;
  nombreReceta: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  estadoComanda: "pendiente" | "preparando" | "listo" | "entregado";
  areaDestino: "cocina" | "bar";
  notas: string;
}

export const demoPedidos: PedidoDemo[] = [];
export const demoDetallesPedido: DetallePedidoDemo[] = [];
