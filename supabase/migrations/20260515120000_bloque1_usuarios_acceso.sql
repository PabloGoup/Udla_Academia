-- Bloque 1: perfiles institucionales, unicidad RUT/correo, estados y RLS por rol

alter table public.perfiles_academicos
  add column if not exists rut text,
  add column if not exists telefono text,
  add column if not exists correo_secundario text,
  add column if not exists direccion text,
  add column if not exists fecha_nacimiento date,
  add column if not exists observaciones text;

update public.perfiles_academicos
set rut = identificador_institucional
where rut is null
  and identificador_institucional is not null
  and trim(identificador_institucional) <> '';

alter table public.perfiles_academicos
  drop constraint if exists perfiles_academicos_estado_check;

alter table public.perfiles_academicos
  add constraint perfiles_academicos_estado_check
  check (estado in ('activo', 'inactivo', 'suspendido', 'pendiente_activacion'));

create unique index if not exists idx_perfiles_academicos_rut_unique
  on public.perfiles_academicos (lower(trim(rut)))
  where rut is not null and trim(rut) <> '';

alter table public.perfiles_academicos
  drop constraint if exists perfiles_academicos_id_institucion_correo_key;

create unique index if not exists idx_perfiles_academicos_correo_unique
  on public.perfiles_academicos (lower(trim(correo)));

create or replace function public.es_rol_academico(roles text[])
returns boolean
language sql
stable
as $$
  select public.current_academic_role() = any (roles);
$$;

drop policy if exists "escritura academica" on public.perfiles_academicos;

drop policy if exists "lectura perfiles academicos" on public.perfiles_academicos;
create policy "lectura perfiles academicos"
on public.perfiles_academicos
for select
to authenticated
using (
  public.es_rol_academico(array['administrador', 'profesor'])
  or id_usuario = auth.uid()
  or lower(correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "admin gestiona perfiles" on public.perfiles_academicos;
create policy "admin gestiona perfiles"
on public.perfiles_academicos
for all
to authenticated
using (public.es_rol_academico(array['administrador']))
with check (public.es_rol_academico(array['administrador']));

drop policy if exists "docente crea alumnos" on public.perfiles_academicos;
create policy "docente crea alumnos"
on public.perfiles_academicos
for insert
to authenticated
with check (
  public.es_rol_academico(array['profesor'])
  and rol_academico = 'alumno'
  and estado in ('activo', 'pendiente_activacion')
);

drop policy if exists "docente actualiza alumnos" on public.perfiles_academicos;
create policy "docente actualiza alumnos"
on public.perfiles_academicos
for update
to authenticated
using (
  public.es_rol_academico(array['profesor'])
  and rol_academico = 'alumno'
)
with check (
  public.es_rol_academico(array['profesor'])
  and rol_academico = 'alumno'
);

drop policy if exists "usuario actualiza perfil propio" on public.perfiles_academicos;
create policy "usuario actualiza perfil propio"
on public.perfiles_academicos
for update
to authenticated
using (
  id_usuario = auth.uid()
  or lower(correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  id_usuario = auth.uid()
  or lower(correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create or replace function public.admin_upsert_perfil_academico(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil_id uuid;
  v_rol text;
begin
  if public.current_academic_role() not in (
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
    foto_perfil_url = excluded.foto_perfil_url,
    fecha_actualizacion = now()
  returning id_perfil into perfil_id;

  return perfil_id;
end;
$$;

grant execute on function public.admin_upsert_perfil_academico(jsonb) to authenticated;
