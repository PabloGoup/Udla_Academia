"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Package,
  MonitorPlay,
  Sparkles,
  UserRound,
  Users,
  BarChart3,
  ClipboardList,
  FileText,
  ShieldCheck,
  Wallet,
  ShoppingCart,
  UserCog,
  Shield,
  Settings,
  ContactRound,
  Sun,
  Moon,
  Menu,
  X,
  LogIn,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";

const navItems = [
  { href: "/academico", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academico/cursos", label: "Cursos", icon: BookOpen },
  { href: "/academico/alumnos", label: "Alumnos", icon: Users },
  { href: "/academico/simulaciones", label: "Simulaciones", icon: Sparkles },
  { href: "/academico/bodega", label: "Bodega", icon: Package },
  { href: "/academico/inventario", label: "Inventario", icon: ClipboardList },
  { href: "/academico/compras", label: "Compras", icon: ShoppingCart },
  { href: "/academico/crm", label: "CRM", icon: ContactRound },
  { href: "/academico/servicio", label: "Servicio", icon: MonitorPlay },
  { href: "/academico/caja", label: "Caja", icon: Wallet },
  { href: "/academico/documentos", label: "Documentos", icon: FileText },
  { href: "/academico/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/academico/inocuidad", label: "Inocuidad", icon: ShieldCheck },
  { href: "/academico/personal", label: "Personal", icon: UserCog },
  { href: "/academico/auditoria", label: "Auditoría", icon: Shield },
  { href: "/academico/configuracion", label: "Configuración", icon: Settings },
  { href: "/academico/alumno", label: "Portal alumno", icon: UserRound },
] as const;

interface AcademicPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

type RoleSimulation = "master" | "administrador" | "docente" | "alumno";

const roleSimulationOptions: Array<{
  id: RoleSimulation;
  label: string;
  description: string;
  defaultRoute: string;
}> = [
  {
    id: "master",
    label: "Maestro",
    description: "Visión total de módulos, permisos y configuración.",
    defaultRoute: "/academico",
  },
  {
    id: "administrador",
    label: "Administrador",
    description: "Control institucional, cursos, perfiles y operación.",
    defaultRoute: "/academico",
  },
  {
    id: "docente",
    label: "Docente",
    description: "Gestión de clases, simulaciones, evaluación y seguimiento.",
    defaultRoute: "/academico",
  },
  {
    id: "alumno",
    label: "Alumno",
    description: "Portal del alumno con rol, tareas y trazabilidad.",
    defaultRoute: "/academico/alumno",
  },
];

const navByRole: Record<RoleSimulation, ReadonlyArray<(typeof navItems)[number]>> = {
  master: navItems,
  administrador: navItems.filter((item) => item.href !== "/academico/alumno"),
  docente: navItems.filter((item) =>
    [
      "/academico",
      "/academico/cursos",
      "/academico/alumnos",
      "/academico/simulaciones",
      "/academico/reportes",
      "/academico/alumno",
    ].includes(item.href),
  ),
  alumno: navItems.filter((item) => item.href === "/academico/alumno"),
};

export function AcademicPageShell({
  title,
  subtitle,
  children,
}: AcademicPageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<RoleSimulation>("master");
  const supabaseReady = isSupabaseConfigured();
  const activeRoleSimulation =
    roleSimulationOptions.find((role) => role.id === simulatedRole) ??
    roleSimulationOptions[0];
  const availableNavItems = navByRole[simulatedRole] ?? navByRole.master;

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("udla-theme");
    if (saved === "dark") setDarkMode(true);

    const savedRole = localStorage.getItem("udla-role-sim") as
      | RoleSimulation
      | null;
    if (
      savedRole &&
      roleSimulationOptions.some((role) => role.id === savedRole)
    ) {
      setSimulatedRole(savedRole);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("udla-theme", nextTheme ? "dark" : "light");
  };

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const switchSimulatedRole = (roleId: RoleSimulation) => {
    setSimulatedRole(roleId);
    localStorage.setItem("udla-role-sim", roleId);
    const role = roleSimulationOptions.find((option) => option.id === roleId);
    if (!role) return;
    if (!pathname.startsWith(role.defaultRoute)) {
      router.push(role.defaultRoute);
    }
  };

  if (!isMounted) return null;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex min-h-screen bg-[var(--udla-soft)] text-slate-900 transition-colors duration-200 dark:bg-[#0b1017] dark:text-slate-100">

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ───── Sidebar ───── */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-200 bg-white p-4 transition-transform duration-300 dark:border-white/10 dark:bg-[#151617] lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          <div className="flex items-center justify-between mb-6 px-2 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">UDLA</span>
            </div>
            <button
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Perfil Activo */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Perfil Activo
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/[0.03]">
              <Image
                src="/logo-original-udla.png"
                alt="UDLA"
                width={220}
                height={64}
                className="h-auto w-full object-contain"
              />
            </div>
            <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              {activeRoleSimulation.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {activeRoleSimulation.description}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {availableNavItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href !== "/academico" && pathname.startsWith(href));

              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${isActive
                    ? "bg-[var(--udla-orange)] text-white shadow-md shadow-orange-500/20"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-white/20" : "bg-orange-50 dark:bg-orange-500/10"
                    }`}>
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-orange-600"}`} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Version/Footer */}
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 px-2 text-[10px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              v2.4.0 Stable Build
            </div>
          </div>
        </aside>

        {/* ───── Main Content Area ───── */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* Header Superior (Premium UDLA) */}
          <header className="sticky top-0 z-30 border-b-4 border-[var(--udla-orange)] bg-white shadow-sm dark:bg-[#0b1017]">
            <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
        
                  <div className="hidden sm:block">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Universidad de Las Américas</p>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none mt-1">
                      UDLA Academia Gastronómica
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badges */}
                  <div className="hidden md:flex items-center gap-2 mr-2">
                    <StatusBadge
                      label={supabaseReady ? "Supabase conectado" : "Modo demo"}
                      tone={supabaseReady ? "emerald" : "rose"}
                    />
                    <StatusBadge label="Realtime sin canal" tone="rose" />
                  </div>

                  <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {darkMode ? "Claro" : "Oscuro"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {roleSimulationOptions.map((roleOption) => {
                  const active = roleOption.id === simulatedRole;
                  return (
                    <button
                      key={roleOption.id}
                      type="button"
                      onClick={() => switchSimulatedRole(roleOption.id)}
                      className={`col-span-2 rounded-lg border px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition sm:col-span-1 ${
                        active
                          ? "border-[var(--udla-orange)] bg-[var(--udla-orange)] text-white shadow-md shadow-orange-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-orange-500/50"
                      }`}
                    >
                      {roleOption.label}
                    </button>
                  );
                })}
              </div>

            </div>
          </header>

          {/* Page Content */}
          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-8">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">
                ACADEMIA · {title.toUpperCase()}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "emerald" | "rose" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    rose: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  };
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold ${styles[tone]}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-rose-500"}`} />
      {label}
    </div>
  );
}
