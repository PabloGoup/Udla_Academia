"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  BookCopy,
  LayoutDashboard,
  Package,
  MonitorPlay,
  UtensilsCrossed,
  Sparkles,
  UserRound,
  Users,
  BarChart3,
  ClipboardList,
  FileText,
  ShieldCheck,
  Wallet,
  ShoppingCart,
  QrCode,
  UserCog,
  Shield,
  Settings,
  ContactRound,
  Sun,
  Moon,
  Menu,
  LogIn,
  Building2,
  Globe2,
  PanelLeftClose,
} from "lucide-react";
import { type ReactNode, useEffect, useState, type FormEvent } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getCurrentAuthProfile,
  signInOperator,
  signOutOperator,
  type AuthProfile,
} from "@/lib/operations";
import {
  obtenerPerfilAcademicoSesion,
  resolverRolNavegacion,
} from "@/lib/academic-auth";
import { puede } from "@/lib/academic-permissions";
import type { PerfilAcademico } from "@/lib/academic-types";
import {
  getRoleSimulation,
  isRoleSimulation,
  ROLE_SIMULATION_OPTIONS,
  type RoleSimulation,
} from "@/lib/role-simulation";

const navItems = [
  { href: "/academico", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academico/cursos", label: "Cursos", icon: BookOpen },
  { href: "/academico/usuarios", label: "Usuarios", icon: UserCog },
  { href: "/academico/alumnos", label: "Alumnos", icon: Users },
  { href: "/academico/simulaciones", label: "Simulaciones", icon: Sparkles },
  { href: "/academico/recetas", label: "Recetas", icon: BookOpen },
  { href: "/academico/sub-recetas", label: "Sub-recetas", icon: BookCopy },
  { href: "/academico/menu", label: "Menú", icon: UtensilsCrossed },
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
  { href: "/academico/qr", label: "QR Comensal", icon: QrCode },
  { href: "/academico/configuracion", label: "Configuración", icon: Settings },
  { href: "/academico/alumno", label: "Portal alumno", icon: UserRound },
] as const;

interface AcademicPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

function getInitials(name?: string | null) {
  const cleanName = name?.trim();
  if (!cleanName) return "UA";

  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function filterNavForAcademicRole(
  items: ReadonlyArray<(typeof navItems)[number]>,
  rol?: import("@/lib/academic-types").RolUsuario | null,
) {
  return items.filter((item) => {
    if (item.href === "/academico/usuarios") {
      return puede(rol ?? null, "usuarios.gestionar");
    }
    return true;
  });
}

const navByRole: Record<RoleSimulation, ReadonlyArray<(typeof navItems)[number]>> = {
  master: navItems,
  administrador: navItems.filter((item) => item.href !== "/academico/alumno"),
  docente: navItems.filter((item) =>
    [
      "/academico",
      "/academico/cursos",
      "/academico/alumnos",
      "/academico/simulaciones",
      "/academico/recetas",
      "/academico/sub-recetas",
      "/academico/menu",
      "/academico/qr",
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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [desktopSidebarHovered, setDesktopSidebarHovered] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<RoleSimulation>("docente");
  const [academicProfile, setAcademicProfile] = useState<PerfilAcademico | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authState, setAuthState] = useState<"anonymous" | "checking" | "authenticated">("anonymous");
  const [roleResolved, setRoleResolved] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  const supabaseReady = isSupabaseConfigured();
  const activeRoleSimulation =
    getRoleSimulation(simulatedRole) ?? ROLE_SIMULATION_OPTIONS[0];
  const baseNavItems = navByRole[simulatedRole] ?? navByRole.docente;
  const availableNavItems =
    supabaseReady && !roleResolved
      ? []
      : filterNavForAcademicRole(baseNavItems, academicProfile?.rol_academico ?? null);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("udla-theme");
    if (saved === "dark") setDarkMode(true);

    const savedRole = localStorage.getItem("udla-role-sim");
    if (isRoleSimulation(savedRole)) {
      setSimulatedRole(savedRole);
    }

    async function bootstrapSession() {
      if (!supabaseReady) {
        setRoleResolved(true);
        return;
      }
      const profile = await getCurrentAuthProfile();
      const perfil = await obtenerPerfilAcademicoSesion();
      setAuthProfile(profile);
      setAcademicProfile(perfil);
      setAuthState(profile ? "authenticated" : "anonymous");
      if (profile || perfil) {
        setSimulatedRole(resolverRolNavegacion(perfil, profile));
      } else if (isRoleSimulation(savedRole)) {
        setSimulatedRole(savedRole);
      }
      setRoleResolved(true);
    }

    void bootstrapSession();
  }, [supabaseReady]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState("checking");
    const { result, profile } = await signInOperator(authEmail, authPassword);

    setOperationNotice({
      tone: result.ok ? "success" : "warning",
      message: result.message,
    });

    const perfil = await obtenerPerfilAcademicoSesion();
    setAuthProfile(profile);
    setAcademicProfile(perfil);
    setAuthState(profile ? "authenticated" : "anonymous");
    if (profile || perfil) {
      setSimulatedRole(resolverRolNavegacion(perfil, profile));
    }

    if (profile) {
      setAuthOpen(false);
      setAuthPassword("");
    }
  }

  async function handleSignOut() {
    const result = await signOutOperator();
    setOperationNotice({
      tone: result.ok ? "success" : "warning",
      message: result.message,
    });
    setAuthProfile(null);
    setAcademicProfile(null);
    setAuthState("anonymous");
    document.cookie = "udla-demo=; path=/; max-age=0; SameSite=Lax";
    const savedRole = localStorage.getItem("udla-role-sim");
    if (isRoleSimulation(savedRole)) {
      setSimulatedRole(savedRole);
    }
    router.replace("/");
  }

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("udla-theme", nextTheme ? "dark" : "light");
  };

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopSidebarOpen) return;
    if (desktopSidebarHovered) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const closeTimer = window.setTimeout(() => {
      setDesktopSidebarOpen(false);
    }, 5000);

    return () => window.clearTimeout(closeTimer);
  }, [desktopSidebarHovered, desktopSidebarOpen, pathname]);

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setSidebarOpen(true);
  };

  const switchSimulatedRole = (roleId: RoleSimulation) => {
    setSimulatedRole(roleId);
    localStorage.setItem("udla-role-sim", roleId);
    const role = getRoleSimulation(roleId);
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
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {desktopSidebarOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-y-0 left-72 right-0 z-20 hidden cursor-default bg-transparent lg:block"
            onClick={() => setDesktopSidebarOpen(false)}
          />
        )}

        {/* ───── Sidebar ───── */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[360px] transform flex-col overflow-hidden border-r border-black/20 bg-[#252525] dark:bg-[#0b1017] text-white transition-all duration-300 dark:border-orange-800 lg:sticky lg:top-0 lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 ${
          desktopSidebarOpen ? "lg:w-72" : "lg:w-0 lg:border-r-0 lg:pointer-events-none"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          onMouseEnter={() => setDesktopSidebarHovered(true)}
          onMouseLeave={() => setDesktopSidebarHovered(false)}
        >

          <div className="relative flex h-[76px] shrink-0 items-center justify-start bg-[var(--udla-orange)]  px-10">
            <Image
              src="/logo-original-udla.png"
              alt="UDLA"
              width={180}
              height={52}
              className="h-[54px] w-auto max-w-[210px] object-contain brightness-0 invert"
              priority
            />
            <button
              className="absolute right-5 flex h-10 w-10 items-center justify-center text-black lg:hidden"
              onClick={() => setSidebarOpen(false)}
              type="button"
              aria-label="Cerrar menú"
            >
              <PanelLeftClose className="h-6 w-6" />
            </button>
          </div>

          <Link
            href="/academico/perfil"
            className="flex shrink-0 items-center gap-4 border-b border-black/30 px-5 py-4 transition hover:bg-white/5"
          >
            {authProfile?.avatarUrl ? (
              <div
                className="h-11 w-11 shrink-0 rounded-full border border-white/15 bg-cover bg-center shadow-inner"
                style={{ backgroundImage: `url("${authProfile.avatarUrl}")` }}
                aria-label={`Foto de perfil de ${authProfile.name}`}
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-black text-white/75">
                {getInitials(authProfile?.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold uppercase tracking-wide text-white/90">
                {authProfile?.name ?? "Usuario académico"}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                {activeRoleSimulation.label}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-1 flex-col gap-0 overflow-y-auto py-3">
            {availableNavItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href !== "/academico" && pathname.startsWith(href));

              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex h-14 items-center gap-5 border-l-[5px] px-5 text-[17px] font-medium transition-all lg:h-12 lg:text-[15px] ${isActive
                    ? "border-black bg-[var(--udla-orange)] text-black"
                    : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center transition-colors ${isActive ? "text-black" : "text-white/85"
                    }`}>
                    <Icon className="h-6 w-6 lg:h-5 lg:w-5" />
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-black/30 px-5 py-4">
            <div className="flex items-center gap-2 text-[10px] font-medium text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              GoUp Soluciones IT $ RPA v.07
            </div>
          </div>
        </aside>

        {/* ───── Main Content Area ───── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">

          {/* Header Superior (Premium UDLA) */}
          <header className="sticky top-0 z-30 border-b-4 border-[var(--udla-orange)] bg-white shadow-sm dark:bg-[#0b1017]">
            {operationNotice && (
              <div className={`flex items-center justify-between px-4 py-2 text-xs font-bold ${operationNotice.tone === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                <span>{operationNotice.message}</span>
                <button onClick={() => setOperationNotice(null)} className="opacity-70 hover:opacity-100">Cerrar</button>
              </div>
            )}
            <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSidebar}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--udla-orange)] text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
                    type="button"
                    aria-label="Alternar menú"
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
                  <div className="relative">
                    {authProfile ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href="/academico/perfil"
                          className="flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                        >
                          <UserRound className="h-4 w-4" />
                          {authProfile.name}
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                          title="Cerrar sesión"
                        >
                          <LogIn className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setAuthOpen(!authOpen)}
                          className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        >
                          {authState === "checking" ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                          ) : (
                            <LogIn className="h-4 w-4" />
                          )}
                          Iniciar sesión
                        </button>

                        {authOpen && (
                          <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#151617]">
                            <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Acceso Académico</h3>
                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400">Email</label>
                                <input
                                  type="email"
                                  value={authEmail}
                                  onChange={(e) => setAuthEmail(e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-white/5"
                                  placeholder="usuario@pudahuel.udla.cl"
                                  required
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400">Contraseña</label>
                                <input
                                  type="password"
                                  value={authPassword}
                                  onChange={(e) => setAuthPassword(e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-white/5"
                                  placeholder="••••••••"
                                  required
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={authState === "checking"}
                                className="mt-2 flex h-10 items-center justify-center rounded-lg bg-[var(--udla-orange)] text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                              >
                                {authState === "checking" ? "Verificando..." : "Entrar"}
                              </button>
                            </form>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {darkMode ? "Claro" : "Oscuro"}
                  </button>
                </div>
              </div>

              {authState === "authenticated" && academicProfile ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  Sesión: {academicProfile.nombre_completo} · Rol{" "}
                  {academicProfile.rol_academico} · Vista {activeRoleSimulation.label}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 ">
                  {ROLE_SIMULATION_OPTIONS.map((roleOption) => {
                    const active = roleOption.id === simulatedRole;
                    return (
                      <button
                        key={roleOption.id}
                        type="button"
                        onClick={() => switchSimulatedRole(roleOption.id)}
                        className={`col-span-2 rounded-lg border px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition sm:col-span-1 ${active
                          ? "border-[var(--udla-orange)] bg-[var(--udla-orange)] text-white shadow-md shadow-orange-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-orange-500/50"
                          }`}
                      >
                        {roleOption.label}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          </header>

          {/* Page Content */}
          <main className="academic-mobile-safe mx-auto w-full max-w-[1600px] flex-1 overflow-x-hidden px-2 py-3 sm:p-8">
            <div className="mb-4 sm:mb-8">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:mb-2 sm:text-[10px] sm:tracking-[0.2em] dark:text-slate-500">
                ACADEMIA · {title.toUpperCase()}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 line-clamp-2 max-w-3xl text-xs font-medium leading-snug text-slate-500 sm:mt-3 sm:text-sm sm:leading-relaxed dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
            {children}
          </main>

          <footer className=" bg-[#202020] text-white shadow-[0_-18px_45px_rgba(15,23,42,0.12)] dark:bg-[#070b11]">
            <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-8 sm:py-6 lg:py-7">
              <div className="grid gap-3 sm:gap-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:items-start">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--udla-orange)] text-white shadow-lg shadow-orange-950/20 sm:h-11 sm:w-11 sm:rounded-2xl">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-orange-300 sm:text-[10px] sm:tracking-[0.22em]">
                        UDLA Academia Gastronómica
                      </p>
                      <h2 className="text-sm font-black leading-tight tracking-tight text-white sm:text-lg">
                        Plataforma académica operacional
                      </h2>
                    </div>
                  </div>
                  <p className="max-w-xl text-[11px] font-medium leading-snug text-white/55 sm:text-sm sm:leading-relaxed">
                    Simulación, trazabilidad y control académico integrados en un solo entorno.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[8px] font-black uppercase tracking-[0.16em] text-white/35 sm:mb-3 sm:text-[10px] sm:tracking-[0.22em]">
                    Accesos rápidos
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold rounded-xl sm:rounded-xl text-white/70 sm:grid-cols-2 sm:gap-2 sm:text-sm lg:grid-cols-1">
                    <Link
                      href="/academico"
                      className="inline-flex min-w-0 items-center justify-center gap-1   rounded-xl sm:rounded-xl px-2 py-1.5 text-center leading-tight transition hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-white sm:justify-start sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-orange-300 sm:h-4 sm:w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/academico/perfil"
                      className="inline-flex min-w-0 items-center justify-center gap-1 px-2 py-1.5  rounded-xl sm:rounded-xl text-center leading-tight transition hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-white sm:justify-start sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2"
                    >
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-orange-300 sm:h-4 sm:w-4" />
                      Mi perfil
                    </Link>
                    <Link
                      href="https://www.udla.cl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center justify-center gap-1  px-2 py-1.5  rounded-xl sm:rounded-xl text-center leading-tight transition hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-white sm:justify-start sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2"
                    >
                      <Globe2 className="h-3.5 w-3.5 shrink-0 text-orange-300 sm:h-4 sm:w-4" />
                      Sitio UDLA
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[8px] font-black uppercase tracking-[0.16em] text-white/35 sm:mb-3 sm:text-[10px] sm:tracking-[0.22em]">
                    Estado del sistema
                  </p>
                  <div className=" p-2.5 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black text-white sm:text-sm">GoUp Soluciones IT & RPA</p>
                        <p className="mt-0.5 text-[9px] font-semibold text-white/45 sm:mt-1 sm:text-xs">v.07 · entorno académico</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/20 sm:gap-2 sm:px-3 sm:text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Activo
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold text-white/40 sm:mt-4 sm:text-[11px]">
                      <span>Privacidad</span>
                      <span className="text-white/20">•</span>
                      <span>Condiciones</span>
                      <span className="text-white/20">•</span>
                      <span>Accesibilidad</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-1 justify-center  border-t border-white/10 pt-2.5 text-[9px] font-semibold  text-white/35 sm:mt-6  sm:justify-center sm:pt-4 sm:text-xs">
                <span className=" justify-center">© 2026 UDLA Academia Gastronómica.</span>
               
              </div>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}
