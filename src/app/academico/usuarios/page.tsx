"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { UsersAdminPanel } from "@/components/academic/users-admin-panel";
import { obtenerPerfilAcademicoSesion } from "@/lib/academic-auth";
import { esAdministrador } from "@/lib/academic-permissions";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

const USER_ADMIN_ROLES = new Set([
  "administrador",
  "administrator",
  "admin",
  "master",
  "root",
  "superadmin",
  "maestro",
]);

function puedeAdministrarUsuarios(rol?: string | null) {
  const normalizedRole = (rol ?? "").trim().toLowerCase();
  return esAdministrador(rol as Parameters<typeof esAdministrador>[0]) || USER_ADMIN_ROLES.has(normalizedRole);
}

async function obtenerRolDesdeUsers() {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[USUARIOS] Error obteniendo usuario autenticado:", authError);
    return null;
  }

  const authUserId = authData.user?.id;

  if (!authUserId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("role_id")
    .eq("id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("[USUARIOS] Error buscando role_id en users:", error);
    return null;
  }

  return data?.role_id?.toString() ?? null;
}

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const perfil = await obtenerPerfilAcademicoSesion();
      console.log("[USUARIOS] Perfil académico:", perfil);

      let rolDetectado = (perfil?.rol_academico ?? "").toString().trim().toLowerCase();

      if (!rolDetectado) {
        const roleId = await obtenerRolDesdeUsers();
        rolDetectado = (roleId ?? "").toString().trim().toLowerCase();
        console.log("[USUARIOS] role_id desde users:", rolDetectado);
      }

      console.log("[USUARIOS] Rol detectado:", rolDetectado);

      const accesoPermitido = puedeAdministrarUsuarios(rolDetectado);

      console.log("[USUARIOS] Acceso permitido:", accesoPermitido);

      if (!accesoPermitido) {
        router.replace("/academico");
        setAllowed(false);
        return;
      }

      setAllowed(true);
    })();
  }, [router]);

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">
        Verificando permisos…
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <AcademicPageShell
      title="Usuarios institucionales"
      subtitle="Alta, edición y estados de acceso. Administradores y rol maestro."
    >
      <UsersAdminPanel />
    </AcademicPageShell>
  );
}
