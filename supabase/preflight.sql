-- Ejecutar este archivo solo, en un Run separado, antes de supabase/schema.sql.
--
-- PostgreSQL no permite usar un nuevo valor de enum en la misma transaccion
-- donde fue agregado. Si la base ya existia sin el rol "master", este paso
-- confirma el enum antes de que schema.sql inserte el rol en public.roles.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum (
    'master',
    'administrator',
    'supervisor',
    'cashier',
    'waiter',
    'cook',
    'chef',
    'warehouse'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  alter type public.app_role add value if not exists 'master' before 'administrator';
exception when duplicate_object then null;
end $$;

alter table if exists public.perfiles_academicos
  add column if not exists foto_perfil_url text;
