-- Bucket para imagenes de recetas y menu.
-- Ejecutar en SQL Editor de Supabase (mismo proyecto de la app).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'academia-media',
  'academia-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Limpieza de politicas previas (si existen)
drop policy if exists "academia media public read" on storage.objects;
drop policy if exists "academia media auth upload" on storage.objects;
drop policy if exists "academia media auth update" on storage.objects;
drop policy if exists "academia media auth delete" on storage.objects;

-- Lectura publica de imagenes (menu comensal y vistas publicas)
create policy "academia media public read"
on storage.objects
for select
to public
using (bucket_id = 'academia-media');

-- Subida para usuarios autenticados
create policy "academia media auth upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'academia-media');

-- Edicion para usuarios autenticados
create policy "academia media auth update"
on storage.objects
for update
to authenticated
using (bucket_id = 'academia-media')
with check (bucket_id = 'academia-media');

-- Borrado para usuarios autenticados
create policy "academia media auth delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'academia-media');

-- Bucket para fotos de perfil academico.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'perfiles',
  'perfiles',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "perfiles public read" on storage.objects;
drop policy if exists "perfiles auth upload" on storage.objects;
drop policy if exists "perfiles auth update" on storage.objects;
drop policy if exists "perfiles auth delete" on storage.objects;

create policy "perfiles public read"
on storage.objects
for select
to public
using (bucket_id = 'perfiles');

create policy "perfiles auth upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'perfiles');

create policy "perfiles auth update"
on storage.objects
for update
to authenticated
using (bucket_id = 'perfiles')
with check (bucket_id = 'perfiles');

create policy "perfiles auth delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'perfiles');
