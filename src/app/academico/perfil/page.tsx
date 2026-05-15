

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  BookOpen,
  BriefcaseBusiness,
  Camera,
  GraduationCap,
  Home,
  IdCard,
  LayoutGrid,
  Lock,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

type PerfilAlumno = {
  id?: string;
  rut?: string | null;
  nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  nombre_completo?: string | null;
  email_institucional?: string | null;
  email_personal?: string | null;
  telefono?: string | null;
  otro_telefono?: string | null;
  carrera?: string | null;
  facultad?: string | null;
  sede?: string | null;
  campus?: string | null;
  rol?: string | null;
  foto_perfil_url?: string | null;
  ultima_conexion?: string | null;
};

const DEMO_PERFIL: PerfilAlumno = {
  rut: "17.377.587-3",
  nombre_completo: "PABLO IGNACIO TOLEDO SALINAS",
  email_institucional: "PABLO.TOLEDO.SALINAS@EDU.UDLA.CL",
  email_personal: "PTOLEDOS@LIVE.COM",
  telefono: "951320548",
  otro_telefono: "",
  carrera: "GASTRONOMÍA Y NEGOCIOS GASTRONÓMICOS MENCIÓN COCINAS ANDINAS",
  facultad: "Fac. de Ingeniería y Negocios",
  sede: "PROVIDENCIA",
  campus: "PROVIDENCIA",
  rol: "Alumno",
  foto_perfil_url: null,
  ultima_conexion: "12/05/2026 22:05:52",
};

function formatNombre(perfil: PerfilAlumno) {
  if (perfil.nombre_completo) return perfil.nombre_completo;
  return [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

export default function PerfilAcademicoPage() {
  const [perfil, setPerfil] = useState<PerfilAlumno>(DEMO_PERFIL);
  const [telefono, setTelefono] = useState(DEMO_PERFIL.telefono ?? "");
  const [otroTelefono, setOtroTelefono] = useState(DEMO_PERFIL.otro_telefono ?? "");
  const [emailPersonal, setEmailPersonal] = useState(DEMO_PERFIL.email_personal ?? "");
  const [fotoPreview, setFotoPreview] = useState<string | null>(DEMO_PERFIL.foto_perfil_url ?? null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = isSupabaseConfigured() ? getSupabaseBrowserClient() : null;

  useEffect(() => {
    let mounted = true;

    async function cargarPerfil() {
      setLoading(true);

      if (!supabase) {
        if (mounted) {
          setPerfil(DEMO_PERFIL);
          setLoading(false);
          setMessage("Supabase no está configurado. Mostrando perfil demo.");
        }
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const emailInstitucional = (user.email || "").trim().toLowerCase();
      const metadata = user.user_metadata || {};

      const { data, error: perfilError } = await supabase
        .from("perfiles_academicos")
        .select("*")
        .or(`id_usuario.eq.${user.id},correo.eq.${emailInstitucional}`)
        .maybeSingle();

      if (perfilError) {
        console.error("Error cargando perfil académico:", perfilError);
      }

      const perfilCargado: PerfilAlumno = data
        ? {
            ...DEMO_PERFIL,
            id: data.id_perfil,
            rut: data.identificador_institucional ?? DEMO_PERFIL.rut,
            nombre_completo: data.nombre_completo ?? DEMO_PERFIL.nombre_completo,
            email_institucional: data.correo ?? user.email,
            email_personal: metadata.email_personal ?? DEMO_PERFIL.email_personal,
            telefono: metadata.telefono ?? DEMO_PERFIL.telefono,
            otro_telefono: metadata.otro_telefono ?? DEMO_PERFIL.otro_telefono,
            carrera: metadata.carrera ?? DEMO_PERFIL.carrera,
            facultad: metadata.facultad ?? DEMO_PERFIL.facultad,
            sede: metadata.sede ?? DEMO_PERFIL.sede,
            campus: metadata.campus ?? DEMO_PERFIL.campus,
            rol: data.rol_academico ?? DEMO_PERFIL.rol,
            foto_perfil_url: data.foto_perfil_url ?? metadata.foto_perfil_url ?? DEMO_PERFIL.foto_perfil_url,
            ultima_conexion: metadata.ultima_conexion ?? DEMO_PERFIL.ultima_conexion,
          }
        : {
            ...DEMO_PERFIL,
            email_institucional: user.email ?? DEMO_PERFIL.email_institucional,
            email_personal: metadata.email_personal ?? DEMO_PERFIL.email_personal,
            telefono: metadata.telefono ?? DEMO_PERFIL.telefono,
            otro_telefono: metadata.otro_telefono ?? DEMO_PERFIL.otro_telefono,
            foto_perfil_url: metadata.foto_perfil_url ?? DEMO_PERFIL.foto_perfil_url,
          };

      if (!mounted) return;
      setPerfil(perfilCargado);
      setTelefono(perfilCargado.telefono ?? "");
      setOtroTelefono(perfilCargado.otro_telefono ?? "");
      setEmailPersonal(perfilCargado.email_personal ?? "");
      setFotoPreview(perfilCargado.foto_perfil_url ?? null);
      setLoading(false);
    }

    cargarPerfil();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const nombreCompleto = formatNombre(perfil);
  const sedeCampus = perfil.campus || perfil.sede || "No informado";

  function onFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function guardarCambios() {
    setMessage(null);

    if (password && password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password && password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    if (!supabase) {
      setMessage("Supabase no está configurado. No se pueden guardar cambios.");
      return;
    }

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setSaving(false);
      setMessage("Debes iniciar sesión para guardar cambios.");
      return;
    }

    let fotoUrl = perfil.foto_perfil_url ?? null;

    if (fotoFile) {
      const extension = fotoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/perfil-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("perfiles")
        .upload(path, fotoFile, {
          upsert: true,
          contentType: fotoFile.type || "image/jpeg",
          cacheControl: "31536000",
        });

      if (uploadError) {
        console.error("Error al subir foto de perfil:", uploadError);
        setSaving(false);
        setMessage(`No se pudo subir la foto de perfil: ${uploadError.message}`);
        return;
      }

      const { data: publicUrl } = supabase.storage.from("perfiles").getPublicUrl(path);
      fotoUrl = publicUrl.publicUrl;
    }

    const metadataPayload = {
      telefono,
      otro_telefono: otroTelefono,
      email_personal: emailPersonal,
      foto_perfil_url: fotoUrl,
    };

    const { error } = await supabase.auth.updateUser({
      data: metadataPayload,
    });

    if (error) {
      console.error("Error guardando metadata del perfil:", error);
      setSaving(false);
      setMessage(`No se pudieron guardar los datos del perfil: ${error.message}`);
      return;
    }

    const emailInstitucional = (user.email || "").trim().toLowerCase();
    const { error: profileError } = await supabase
      .from("perfiles_academicos")
      .update({
        foto_perfil_url: fotoUrl,
        fecha_actualizacion: new Date().toISOString(),
      })
      .or(`id_usuario.eq.${user.id},correo.eq.${emailInstitucional}`);

    if (profileError) {
      if (profileError.message.includes("foto_perfil_url")) {
        setPerfil((prev) => ({ ...prev, ...metadataPayload }));
        setPassword("");
        setConfirmPassword("");
        setSaving(false);
        setMessage("Perfil actualizado. Ejecuta la migración de foto_perfil_url para sincronizar la imagen con los listados académicos.");
        return;
      }

      console.error("Error guardando foto en perfil académico:", profileError);
      setSaving(false);
      setMessage(`La foto se subió, pero no se pudo sincronizar con el perfil académico: ${profileError.message}`);
      return;
    }

    if (password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        setSaving(false);
        setMessage("Los datos se guardaron, pero no se pudo cambiar la contraseña.");
        return;
      }
    }

    setPerfil((prev) => ({ ...prev, ...metadataPayload }));
    setPassword("");
    setConfirmPassword("");
    setSaving(false);
    setMessage("Perfil actualizado correctamente.");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-orange-100 bg-white text-slate-950 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-4">
          <Link

                href="/academico"
                aria-label="Volver al inicio académico"
                title="Volver al inicio"
                className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ea5b0c] text-white shadow-md shadow-orange-900/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#cf4f08] hover:shadow-lg active:scale-95 sm:h-12 sm:w-12">
                <GraduationCap
                size={28}
                className="transition duration-200 group-hover:-rotate-6 group-hover:scale-110"/>
                </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ea5b0c] sm:text-xs sm:tracking-[0.25em]">
                Universidad de Las Américas
              </p>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">Mi Perfil</h1>
            </div>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#ea5b0c] transition hover:bg-orange-100 lg:hidden"
            href="/academico"
          >
            <Home size={18} />

          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-700 lg:flex">
            <Link className="flex flex-col items-center gap-1 hover:text-[#ea5b0c]" href="/academico">
              <Home className="text-[#ea5b0c]" />
              Inicio
            </Link>
            <Link className="flex flex-col items-center gap-1 hover:text-[#ea5b0c]" href="/academico/cursos">
              <BookOpen className="text-[#ea5b0c]" />
              Mis Cursos
            </Link>
            <Link className="flex flex-col items-center gap-1 hover:text-[#ea5b0c]" href="/academico/servicios">
              <LayoutGrid className="text-[#ea5b0c]" />
              Servicios
            </Link>
            <Link className="flex flex-col items-center gap-1 hover:text-[#ea5b0c]" href="/academico/historico">
              <BriefcaseBusiness className="text-[#ea5b0c]" />
              Información Histórica
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 border-b-2 border-[#ea5b0c] pb-3">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ea5b0c]">Área académica</p>
          <h2 className="mt-1 text-3xl font-black uppercase text-black">Mi Perfil</h2>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-[#ea5b0c]/25 bg-orange-50 px-4 py-3 text-sm font-semibold text-[#b94700]">
            {message}
          </div>
        )}

        <section className="grid gap-8 rounded-2xl bg-white p-7 text-slate-950 shadow-xl ring-1 ring-orange-100 lg:grid-cols-[190px_1fr]">
          <div>
            <label className="group relative flex h-44 w-44 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-[#ea5b0c] bg-slate-100">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <UserRound size={110} className="text-slate-300" />
              )}
              <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-sm font-bold text-white group-hover:flex">
                <Camera className="mr-2" size={18} /> Cambiar foto
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={onFotoChange} />
            </label>
            <p className="mt-3 text-xs font-medium text-slate-500">El alumno solo puede cambiar su foto de perfil.</p>
          </div>

          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase leading-tight text-slate-950">{loading ? "Cargando..." : nombreCompleto}</h3>
                <p className="text-2xl font-black text-[#ea5b0c]">{perfil.rut || "RUT no informado"}</p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase text-[#ea5b0c]">
                  <IdCard size={14} /> {perfil.rol || "Alumno"}
                </p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-bold uppercase text-slate-950">Última conexión</p>
                <p>{perfil.ultima_conexion || "No registrada"}</p>
              </div>
            </div>

            <div className="grid gap-6 py-8 md:grid-cols-2">
              <InfoItem label="Carrera" value={perfil.carrera || "No informada"} />
              <InfoItem label="Sede/Campus" value={sedeCampus} />
              <InfoItem label="Facultad" value={perfil.facultad || "No informada"} />
              <InfoItem label="Correo institucional" value={perfil.email_institucional || "No informado"} />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-7 text-slate-950 shadow-xl ring-1 ring-orange-100">
          <div className="mb-6 border-b-2 border-[#ea5b0c] pb-2">
            <h3 className="text-xl font-black">Datos de contacto</h3>
            <p className="text-sm text-slate-500">
              El RUT, usuario y correo institucional son datos académicos bloqueados. Solo puedes modificar teléfono, correo personal, foto y contraseña.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Teléfono de contacto principal" icon={<Phone size={18} />}>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#ea5b0c] focus:ring-4 focus:ring-orange-100"
                placeholder="Ej: 951320548"
              />
            </Field>

            <Field label="Otro teléfono de contacto" icon={<Phone size={18} />}>
              <input
                value={otroTelefono}
                onChange={(e) => setOtroTelefono(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#ea5b0c] focus:ring-4 focus:ring-orange-100"
                placeholder="Opcional"
              />
            </Field>

            <Field label="Correo personal" icon={<Mail size={18} />}>
              <input
                value={emailPersonal}
                onChange={(e) => setEmailPersonal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold uppercase text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#ea5b0c] focus:ring-4 focus:ring-orange-100"
                placeholder="correo@personal.cl"
              />
            </Field>

            <Field label="Correo institucional bloqueado" icon={<Lock size={18} />}>
              <input
                value={perfil.email_institucional || ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-bold uppercase text-slate-600"
              />
            </Field>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-7 text-slate-950 shadow-xl ring-1 ring-orange-100">
          <div className="mb-6 border-b-2 border-[#ea5b0c] pb-2">
            <h3 className="text-xl font-black">Cambiar contraseña</h3>
            <p className="text-sm text-slate-500">Deja estos campos vacíos si no deseas cambiarla.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nueva contraseña" icon={<Lock size={18} />}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#ea5b0c] focus:ring-4 focus:ring-orange-100"
                placeholder="Mínimo 6 caracteres"
              />
            </Field>

            <Field label="Confirmar contraseña" icon={<Lock size={18} />}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#ea5b0c] focus:ring-4 focus:ring-orange-100"
                placeholder="Repite la contraseña"
              />
            </Field>
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={guardarCambios}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ea5b0c] px-8 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#cf4f08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-sm text-slate-700">{label}</p>
      <p className="font-black uppercase leading-snug text-slate-950">{value}</p>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        <span className="text-[#ea5b0c]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
