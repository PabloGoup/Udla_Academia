-- Corrige la equivalencia entre roles academicos en espanol y app_role operativo.
-- perfiles_academicos.rol_academico usa: administrador, profesor, alumno.
-- users.role_id usa public.app_role: master, administrator, supervisor, etc.

create or replace function public.app_role_from_auth_metadata(
  raw_role text,
  raw_academic_role text default null
)
returns public.app_role
language sql
immutable
as $$
  select case
    when raw_role in ('master', 'maestro', 'root', 'superadmin') then 'master'::public.app_role
    when raw_academic_role = 'administrador' then 'administrator'::public.app_role
    when raw_academic_role = 'profesor' then 'supervisor'::public.app_role
    when raw_academic_role in ('alumno', 'comensal') then 'waiter'::public.app_role
    when raw_role in (
      'master',
      'administrator',
      'supervisor',
      'cashier',
      'waiter',
      'cook',
      'chef',
      'warehouse'
    ) then raw_role::public.app_role
    when raw_role = 'administrador' then 'administrator'::public.app_role
    when raw_role in ('profesor', 'docente', 'teacher') then 'supervisor'::public.app_role
    when raw_role in ('alumno', 'student', 'comensal') then 'waiter'::public.app_role
    else 'waiter'::public.app_role
  end;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    case
      when auth.jwt() ? 'user_role'
        or auth.jwt() ? 'academic_role'
        then public.app_role_from_auth_metadata(
          auth.jwt() ->> 'user_role',
          auth.jwt() ->> 'academic_role'
        )::text
    end,
    case
      when auth.jwt() -> 'app_metadata' ? 'role'
        or auth.jwt() -> 'app_metadata' ? 'academic_role'
        then public.app_role_from_auth_metadata(
          auth.jwt() -> 'app_metadata' ->> 'role',
          auth.jwt() -> 'app_metadata' ->> 'academic_role'
        )::text
    end,
    (select role_id::text from public.users where id = auth.uid()),
    'anonymous'
  );
$$;

create or replace function public.role_from_auth_metadata(raw_role text)
returns public.app_role
language sql
immutable
as $$
  select public.app_role_from_auth_metadata(raw_role, null);
$$;

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role_id, full_name, email)
  values (
    new.id,
    public.app_role_from_auth_metadata(
      new.raw_app_meta_data ->> 'role',
      new.raw_app_meta_data ->> 'academic_role'
    ),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Operador'),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role_id = case
        when new.raw_app_meta_data ? 'role'
          or new.raw_app_meta_data ? 'academic_role'
          then excluded.role_id
        else public.users.role_id
      end,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_created on auth.users;

create trigger on_auth_user_profile_created
after insert or update on auth.users
for each row execute function public.handle_auth_user_profile();

create or replace function public.ensure_current_user_profile()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.users%rowtype;
  jwt_role text;
  jwt_academic_role text;
  jwt_email text;
  jwt_name text;
begin
  if auth.uid() is null then
    raise exception 'No authenticated user';
  end if;

  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';
  jwt_academic_role := auth.jwt() -> 'app_metadata' ->> 'academic_role';
  jwt_email := coalesce(auth.jwt() ->> 'email', '');
  jwt_name := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    split_part(jwt_email, '@', 1),
    'Operador'
  );

  insert into public.users (id, role_id, full_name, email)
  values (
    auth.uid(),
    public.app_role_from_auth_metadata(jwt_role, jwt_academic_role),
    jwt_name,
    jwt_email
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role_id = case
        when jwt_role is not null or jwt_academic_role is not null then excluded.role_id
        else public.users.role_id
      end,
      updated_at = now()
  returning * into profile;

  return profile;
end;
$$;

grant execute on function public.ensure_current_user_profile() to authenticated;

update public.perfiles_academicos pa
set id_usuario = au.id,
    fecha_actualizacion = now()
from auth.users au
where pa.id_usuario is null
  and lower(pa.correo) = lower(au.email);

update auth.users au
set raw_app_meta_data =
    coalesce(au.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'role',
      public.app_role_from_auth_metadata(null, pa.rol_academico)::text,
      'academic_role',
      pa.rol_academico
    ),
    raw_user_meta_data =
      coalesce(au.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('full_name', pa.nombre_completo),
    updated_at = now()
from public.perfiles_academicos pa
where (pa.id_usuario = au.id or lower(pa.correo) = lower(au.email))
  and pa.rol_academico in ('administrador', 'profesor', 'alumno', 'comensal');

update public.users u
set role_id = case pa.rol_academico
    when 'administrador' then 'administrator'::public.app_role
    when 'profesor' then 'supervisor'::public.app_role
    when 'alumno' then 'waiter'::public.app_role
    when 'comensal' then 'waiter'::public.app_role
    else u.role_id
  end,
  full_name = pa.nombre_completo,
  email = pa.correo,
  is_active = pa.estado = 'activo',
  updated_at = now()
from public.perfiles_academicos pa
where (pa.id_usuario = u.id or lower(pa.correo) = lower(u.email))
  and pa.rol_academico in ('administrador', 'profesor', 'alumno', 'comensal');

create or replace function public.admin_upsert_perfil_academico(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil_id uuid;
  v_rol text;
  v_current_role text;
begin
  v_current_role := public.current_academic_role();

  if v_current_role not in (
    'master',
    'maestro',
    'administrator',
    'administrador'
  ) then
    raise exception 'Solo administradores pueden gestionar usuarios institucionales.';
  end if;

  v_rol := coalesce(payload ->> 'rol_academico', 'alumno');
  if v_rol not in ('administrador', 'profesor', 'alumno') then
    raise exception 'Rol academico invalido.';
  end if;

  insert into public.perfiles_academicos (
    id_perfil,
    id_institucion,
    nombre_completo,
    correo,
    rut,
    identificador_institucional,
    rol_academico,
    telefono,
    correo_secundario,
    direccion,
    fecha_nacimiento,
    observaciones,
    estado,
    foto_perfil_url
  )
  values (
    coalesce(nullif(payload ->> 'id_perfil', '')::uuid, gen_random_uuid()),
    nullif(payload ->> 'id_institucion', '')::uuid,
    trim(payload ->> 'nombre_completo'),
    lower(trim(payload ->> 'correo')),
    nullif(trim(payload ->> 'rut'), ''),
    nullif(trim(payload ->> 'rut'), ''),
    v_rol,
    nullif(trim(payload ->> 'telefono'), ''),
    nullif(lower(trim(payload ->> 'correo_secundario')), ''),
    nullif(trim(payload ->> 'direccion'), ''),
    nullif(payload ->> 'fecha_nacimiento', '')::date,
    nullif(trim(payload ->> 'observaciones'), ''),
    coalesce(nullif(payload ->> 'estado', ''), 'pendiente_activacion'),
    nullif(trim(payload ->> 'foto_perfil_url'), '')
  )
  on conflict (id_perfil) do update
  set
    nombre_completo = excluded.nombre_completo,
    correo = excluded.correo,
    rut = excluded.rut,
    identificador_institucional = excluded.identificador_institucional,
    rol_academico = excluded.rol_academico,
    telefono = excluded.telefono,
    correo_secundario = excluded.correo_secundario,
    direccion = excluded.direccion,
    fecha_nacimiento = excluded.fecha_nacimiento,
    observaciones = excluded.observaciones,
    estado = excluded.estado,
    foto_perfil_url = coalesce(excluded.foto_perfil_url, perfiles_academicos.foto_perfil_url),
    fecha_actualizacion = now()
  returning id_perfil into perfil_id;

  return perfil_id;
end;
$$;

grant execute on function public.admin_upsert_perfil_academico(jsonb) to authenticated;
