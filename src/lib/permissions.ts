import type { ModuleId, Permission, RoleId, RoleProfile } from "@/lib/types";

export const roleProfiles: RoleProfile[] = [
  {
    id: "administrator",
    label: "Administrador",
    description: "Control total de configuracion, reportes, costos y usuarios.",
    permissions: [
      "dashboard:read",
      "tables:manage",
      "orders:manage",
      "kitchen:manage",
      "cash:manage",
      "products:manage",
      "recipes:manage",
      "inventory:manage",
      "purchases:manage",
      "reports:read",
      "food-safety:manage",
      "employees:manage",
      "education:read",
      "architecture:read",
    ],
  },
  {
    id: "supervisor",
    label: "Supervisor",
    description: "Supervisa salon, caja, cocina, reportes operativos y turnos.",
    permissions: [
      "dashboard:read",
      "tables:manage",
      "orders:manage",
      "kitchen:manage",
      "cash:manage",
      "inventory:manage",
      "reports:read",
      "food-safety:manage",
      "employees:manage",
      "education:read",
    ],
  },
  {
    id: "cashier",
    label: "Cajero",
    description: "Administra apertura, pagos, retiros, propinas y cierre.",
    permissions: [
      "dashboard:read",
      "orders:manage",
      "cash:manage",
      "reports:read",
      "education:read",
    ],
  },
  {
    id: "waiter",
    label: "Mesero",
    description: "Gestiona mesas, pedidos, observaciones y entrega en salon.",
    permissions: [
      "dashboard:read",
      "tables:manage",
      "orders:manage",
      "education:read",
    ],
  },
  {
    id: "cook",
    label: "Cocinero",
    description: "Opera comandas, preparacion, tiempos y estaciones.",
    permissions: ["dashboard:read", "kitchen:manage", "education:read"],
  },
  {
    id: "chef",
    label: "Jefe de cocina",
    description: "Controla cocina, recetas tecnicas, mermas y seguridad.",
    permissions: [
      "dashboard:read",
      "kitchen:manage",
      "products:manage",
      "recipes:manage",
      "inventory:manage",
      "food-safety:manage",
      "reports:read",
      "education:read",
    ],
  },
  {
    id: "warehouse",
    label: "Encargado de bodega",
    description: "Administra inventario, compras, proveedores, lotes y FIFO.",
    permissions: [
      "dashboard:read",
      "inventory:manage",
      "purchases:manage",
      "food-safety:manage",
      "reports:read",
      "education:read",
    ],
  },
];

export const modulePermissionMap: Record<ModuleId, Permission> = {
  dashboard: "dashboard:read",
  tables: "tables:manage",
  orders: "orders:manage",
  kitchen: "kitchen:manage",
  cash: "cash:manage",
  products: "products:manage",
  recipes: "recipes:manage",
  inventory: "inventory:manage",
  purchases: "purchases:manage",
  reports: "reports:read",
  foodSafety: "food-safety:manage",
  employees: "employees:manage",
  education: "education:read",
  architecture: "architecture:read",
};

export function getRoleProfile(roleId: RoleId) {
  return roleProfiles.find((role) => role.id === roleId) ?? roleProfiles[0];
}

export function canAccessModule(roleId: RoleId, moduleId: ModuleId) {
  const role = getRoleProfile(roleId);
  return role.permissions.includes(modulePermissionMap[moduleId]);
}

