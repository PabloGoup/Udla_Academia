"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { GraduationCap, Lock, LogIn, ShieldCheck } from "lucide-react";
import { signInOperator } from "@/lib/operations";
import { obtenerPerfilAcademicoSesion } from "@/lib/academic-auth";
import { rutaPorRolAcademico } from "@/lib/academic-routes";
import { isDemoAccessEnabled, isSupabaseConfigured } from "@/lib/supabase";

export function LandingLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  const supabaseReady = isSupabaseConfigured();
  const demoEnabled = isDemoAccessEnabled();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!supabaseReady) {
      setMessage({
        tone: "error",
        text: "Supabase no está configurado. Usa el modo demostración si está habilitado.",
      });
      setLoading(false);
      return;
    }

    const { result } = await signInOperator(email, password);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message });
      setLoading(false);
      return;
    }

    const perfil = await obtenerPerfilAcademicoSesion();
    if (perfil?.estado === "suspendido" || perfil?.estado === "inactivo") {
      setMessage({
        tone: "error",
        text: "Tu cuenta está inactiva o suspendida. Contacta al administrador.",
      });
      setLoading(false);
      return;
    }

    if (perfil?.estado === "pendiente_activacion") {
      setMessage({
        tone: "error",
        text: "Tu cuenta está pendiente de activación por un administrador.",
      });
      setLoading(false);
      return;
    }

    const nextPath = searchParams.get("next");
    const destino =
      nextPath && nextPath.startsWith("/academico")
        ? nextPath
        : rutaPorRolAcademico(perfil?.rol_academico);

    router.replace(destino);
    router.refresh();
    setLoading(false);
  }

  function enterDemoMode() {
    document.cookie = "udla-demo=1; path=/; max-age=86400; SameSite=Lax";
    router.replace("/academico");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--udla-soft)] text-slate-900 dark:bg-[#0b1017] dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:px-10">
        <section className="flex flex-col gap-6">
          <Image
            src="/logo-original-udla.png"
            alt="UDLA"
            width={220}
            height={64}
            className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
            priority
          />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--udla-orange)]">
              Academia Gastronómica
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Simulación real de restaurante para formación profesional
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              Plataforma integrada para docentes y alumnos: cursos, simulaciones,
              operación de servicio, bodega, evaluaciones y trazabilidad académica.
            </p>
          </div>
          <ul className="grid gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--udla-orange)]" />
              Acceso institucional controlado (sin registro público)
            </li>
            <li className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[var(--udla-orange)]" />
              Roles: administrador, docente y alumno
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--udla-orange)]" />
              Trazabilidad de acciones y auditoría académica
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
          <h2 className="text-xl font-black uppercase tracking-tight">Iniciar sesión</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Usa el correo institucional asignado por el administrador.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              Correo
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@pudahuel.udla.cl"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--udla-orange)] focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-white/5"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              Contraseña
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--udla-orange)] focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-white/5"
              />
            </label>

            {message ? (
              <p
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  message.tone === "error"
                    ? "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200"
                    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                }`}
              >
                {message.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !supabaseReady}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--udla-orange)] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-orange-500/25 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Ingresando…" : "Entrar a la plataforma"}
            </button>
          </form>

          {demoEnabled ? (
            <button
              type="button"
              onClick={enterDemoMode}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-slate-300"
            >
              Entrar en modo demostración
            </button>
          ) : null}

          <p className="mt-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            ¿Eres comensal en una simulación?{" "}
            <Link href="/comensal/menu" className="font-bold text-[var(--udla-orange)] hover:underline">
              Menú QR
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
