import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import type { PerfilAcademicoDraft } from "@/lib/user-admin-mutations";

type AppRole =
  | "master"
  | "administrator"
  | "supervisor"
  | "cashier"
  | "waiter"
  | "cook"
  | "chef"
  | "warehouse";

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

const SUPER_ADMIN_ROLES = new Set([
  "master",
  "maestro",
  "root",
  "superadmin",
  "administrador",
  "administrator",
]);

function canManageUsers(role?: string | null, estado?: string | null) {
  return estado === "activo" && SUPER_ADMIN_ROLES.has((role ?? "").toLowerCase());
}

function getAppRole(academicRole: string): AppRole {
  const normalizedRole = academicRole.toLowerCase();

  if (["master", "maestro", "root", "superadmin"].includes(normalizedRole)) {
    return "master";
  }

  if (normalizedRole === "administrador") {
    return "administrator";
  }

  if (normalizedRole === "profesor" || normalizedRole === "docente") {
    return "supervisor";
  }

  if (normalizedRole === "alumno") {
    return "waiter";
  }

  return "waiter";
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, mensaje: "Supabase no configurado." },
      { status: 400 },
    );
  }

  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para crear credenciales. Guarda el perfil como pendiente de activación o configura la clave.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as PerfilAcademicoDraft;
  const supabaseSession = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, mensaje: "Sesión no válida." }, { status: 401 });
  }

  const { data: actorProfile } = await supabaseSession
    .from("perfiles_academicos")
    .select("rol_academico,estado")
    .or(`id_usuario.eq.${user.id},correo.eq.${user.email ?? ""}`)
    .maybeSingle();

  let actorRole = actorProfile?.rol_academico ?? null;
  let actorState = actorProfile?.estado ?? null;

  if (!canManageUsers(actorRole, actorState)) {
    const { data: actorUser } = await supabaseSession
      .from("users")
      .select("role_id,is_active")
      .eq("id", user.id)
      .maybeSingle();

    actorRole = actorUser?.role_id?.toString() ?? null;
    actorState = actorUser?.is_active === false ? "inactivo" : "activo";
  }

  if (!canManageUsers(actorRole, actorState)) {
    return NextResponse.json(
      { ok: false, mensaje: "Solo un administrador, master o root activo puede crear usuarios." },
      { status: 403 },
    );
  }

  if (!body.password_inicial?.trim()) {
    return NextResponse.json(
      { ok: false, mensaje: "Define una contraseña inicial para activar la cuenta." },
      { status: 400 },
    );
  }

  const adminClient = createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: body.correo.trim().toLowerCase(),
    password: body.password_inicial,
    email_confirm: true,
    user_metadata: {
      full_name: body.nombre_completo.trim(),
      academic_role: body.rol_academico,
    },
    app_metadata: {
      role: getAppRole(body.rol_academico),
      academic_role: body.rol_academico,
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { ok: false, mensaje: authError?.message ?? "No se pudo crear la cuenta Auth." },
      { status: 400 },
    );
  }

  const { data: perfilId, error: profileError } = await supabaseSession.rpc(
    "admin_upsert_perfil_academico",
    {
      payload: {
        id_perfil: body.id_perfil ?? null,
        nombre_completo: body.nombre_completo.trim(),
        rut: body.rut.trim(),
        correo: body.correo.trim().toLowerCase(),
        rol_academico: body.rol_academico,
        telefono: body.telefono?.trim() ?? null,
        correo_secundario: body.correo_secundario?.trim().toLowerCase() ?? null,
        direccion: body.direccion?.trim() ?? null,
        fecha_nacimiento: body.fecha_nacimiento ?? null,
        observaciones: body.observaciones?.trim() ?? null,
        estado: body.estado,
      },
    },
  );

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ ok: false, mensaje: profileError.message }, { status: 400 });
  }

  const { error: profileLinkError } = await adminClient
    .from("perfiles_academicos")
    .update({ id_usuario: authUser.user.id })
    .eq("id_perfil", perfilId);

  if (profileLinkError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ ok: false, mensaje: profileLinkError.message }, { status: 400 });
  }

  const appRole = getAppRole(body.rol_academico);
  const { error: userProfileError } = await adminClient.from("users").upsert({
    id: authUser.user.id,
    role_id: appRole,
    full_name: body.nombre_completo.trim(),
    email: body.correo.trim().toLowerCase(),
    is_active: body.estado === "activo",
  });

  if (userProfileError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ ok: false, mensaje: userProfileError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    mensaje: "Usuario institucional creado con acceso activo.",
    id: perfilId,
  });
}
