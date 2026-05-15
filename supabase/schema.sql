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
  create type public.table_status as enum ('free', 'occupied', 'reserved', 'cleaning');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum (
    'pending',
    'preparing',
    'ready',
    'delivered',
    'cancelled',
    'paid'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_method as enum ('cash', 'debit', 'credit', 'transfer');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.reservation_status as enum (
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'no_show'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.inventory_category as enum (
    'meats',
    'seafood',
    'produce',
    'dairy',
    'dry',
    'frozen',
    'ready',
    'allergens'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.storage_method as enum ('FIFO', 'LIFO');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.roles (
  id public.app_role primary key,
  name text not null,
  description text not null default '',
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role_id public.app_role not null references public.roles(id),
  full_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'user_role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    (select role_id::text from public.users where id = auth.uid()),
    'anonymous'
  );
$$;

create or replace function public.role_from_auth_metadata(raw_role text)
returns public.app_role
language sql
immutable
as $$
  select case
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
    else 'waiter'::public.app_role
  end;
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
    public.role_from_auth_metadata(new.raw_app_meta_data ->> 'role'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Operador'),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role_id = case
        when new.raw_app_meta_data ? 'role' then excluded.role_id
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
  jwt_email text;
  jwt_name text;
begin
  if auth.uid() is null then
    raise exception 'No authenticated user';
  end if;

  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';
  jwt_email := coalesce(auth.jwt() ->> 'email', '');
  jwt_name := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    split_part(jwt_email, '@', 1),
    'Operador'
  );

  insert into public.users (id, role_id, full_name, email)
  values (
    auth.uid(),
    public.role_from_auth_metadata(jwt_role),
    jwt_name,
    jwt_email
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now()
  returning * into profile;

  return profile;
end;
$$;

grant execute on function public.ensure_current_user_profile() to authenticated;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  role_id public.app_role not null references public.roles(id),
  full_name text not null,
  rut text,
  phone text,
  shift text not null default 'Sin turno',
  hourly_cost numeric(12,2) not null default 0,
  status text not null default 'active',
  hired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check
  check (status in ('active', 'break', 'offline'));

alter table public.employees
  drop constraint if exists employees_hourly_cost_check;

alter table public.employees
  add constraint employees_hourly_cost_check
  check (hourly_cost >= 0);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  contact_name text,
  phone text,
  email text,
  tax_id text,
  reliability_score numeric(5,2) not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.inventory_category not null,
  unit text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  purchase_quantity numeric(14,3) not null check (purchase_quantity > 0),
  purchase_cost numeric(14,2) not null check (purchase_cost >= 0),
  stock_quantity numeric(14,3) not null default 0,
  min_stock_quantity numeric(14,3) not null default 0,
  average_yield_percent numeric(5,2) not null default 100 check (average_yield_percent > 0 and average_yield_percent <= 100),
  storage_temperature text not null,
  storage_method public.storage_method not null default 'FIFO',
  expiration_date date,
  lot text,
  sanitary_risk text not null default 'low',
  storage_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#27272a',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  portions numeric(10,2) not null default 1 check (portions > 0),
  prep_time_minutes integer not null default 0,
  photo_url text,
  procedure text not null default '',
  allergens text[] not null default '{}',
  observations text not null default '',
  target_food_cost_percent numeric(5,2) not null default 30 check (target_food_cost_percent > 0),
  reference_sale_price numeric(14,2) not null default 0 check (reference_sale_price >= 0),
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes
  add column if not exists reference_sale_price numeric(14,2) not null default 0;

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  raw_material_id uuid not null references public.raw_materials(id) on delete restrict,
  unit text not null,
  gross_quantity numeric(14,3) not null check (gross_quantity >= 0),
  yield_percent numeric(5,2) not null default 100 check (yield_percent > 0 and yield_percent <= 100),
  net_quantity numeric(14,3) generated always as (gross_quantity * yield_percent / 100) stored,
  waste_quantity numeric(14,3) generated always as (gross_quantity - (gross_quantity * yield_percent / 100)) stored,
  waste_type text not null default 'Sin merma',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  name text not null,
  description text not null default '',
  image_url text,
  sale_price numeric(14,2) not null default 0,
  is_available boolean not null default true,
  prep_time_minutes integer not null default 0,
  customization_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  seats integer not null default 2 check (seats > 0),
  zone text not null default 'Salon',
  status public.table_status not null default 'free',
  current_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  table_id uuid references public.tables(id) on delete set null,
  waiter_id uuid references public.employees(id) on delete set null,
  cashier_id uuid references public.employees(id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  tip_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  payment_method public.payment_method,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.tables
  drop constraint if exists tables_current_order_id_fkey;

alter table public.tables
  add constraint tables_current_order_id_fkey
  foreign key (current_order_id) references public.orders(id) on delete set null;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  document_id text,
  preferences text not null default '',
  allergies text[] not null default '{}',
  tags text[] not null default '{}',
  visit_count integer not null default 0 check (visit_count >= 0),
  total_spent numeric(14,2) not null default 0 check (total_spent >= 0),
  last_visit_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  drop constraint if exists customers_full_name_not_blank;

alter table public.customers
  add constraint customers_full_name_not_blank
  check (length(trim(full_name)) > 0);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  table_id uuid references public.tables(id) on delete set null,
  assigned_to uuid references public.employees(id) on delete set null,
  created_by uuid references public.employees(id) on delete set null,
  reservation_date date not null,
  reservation_time time not null,
  party_size integer not null default 2 check (party_size > 0),
  status public.reservation_status not null default 'pending',
  channel text not null default 'phone'
    check (channel in ('phone', 'whatsapp', 'web', 'walk_in')),
  occasion text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  interaction_type text not null
    check (interaction_type in ('note', 'call', 'message', 'complaint', 'preference', 'follow_up')),
  summary text not null,
  due_at timestamptz,
  completed_at timestamptz,
  responsible_id uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.customer_interactions
  drop constraint if exists customer_interactions_summary_not_blank;

alter table public.customer_interactions
  add constraint customer_interactions_summary_not_blank
  check (length(trim(summary)) > 0);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  modifiers jsonb not null default '[]'::jsonb,
  observations text not null default '',
  station text not null default 'hot',
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_number text not null unique,
  printed_at timestamptz,
  sent_at timestamptz not null default now(),
  responsible_id uuid references public.employees(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  raw_material_id uuid not null references public.raw_materials(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  purchase_id uuid,
  movement_type text not null check (movement_type in ('initial', 'purchase', 'sale', 'manual_out', 'adjustment', 'waste')),
  quantity numeric(14,3) not null,
  unit_cost numeric(14,4) not null default 0,
  reason text not null default '',
  responsible_id uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  document_type text not null check (document_type in ('invoice', 'receipt')),
  document_number text not null,
  purchase_date date not null default current_date,
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'draft',
  received_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_movements
  drop constraint if exists inventory_movements_purchase_id_fkey;

alter table public.inventory_movements
  add constraint inventory_movements_purchase_id_fkey
  foreign key (purchase_id) references public.purchases(id) on delete set null;

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  raw_material_id uuid references public.raw_materials(id) on delete set null,
  description text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  unit_cost numeric(14,4) not null default 0,
  yield_percent numeric(5,2) not null default 100,
  expiration_date date,
  lot text,
  total_cost numeric(14,2) generated always as (quantity * unit_cost) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid references public.employees(id) on delete set null,
  closed_by uuid references public.employees(id) on delete set null,
  opening_amount numeric(14,2) not null default 0,
  expected_amount numeric(14,2) not null default 0,
  counted_amount numeric(14,2),
  difference_amount numeric(14,2),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cash_registers
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null check (movement_type in ('opening', 'sale', 'withdrawal', 'advance', 'tip', 'difference')),
  payment_method public.payment_method,
  amount numeric(14,2) not null,
  description text not null default '',
  responsible_id uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.operational_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('kitchen_ticket', 'table_prebill', 'payment_receipt', 'cash_close', 'reservation_sheet')),
  title text not null default '',
  order_id uuid references public.orders(id) on delete set null,
  cash_register_id uuid references public.cash_registers(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  printed_by uuid references public.employees(id) on delete set null,
  printed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.operational_documents
  drop constraint if exists operational_documents_title_not_blank;

alter table public.operational_documents
  add constraint operational_documents_title_not_blank
  check (length(trim(title)) > 0);

create table if not exists public.food_safety_logs (
  id uuid primary key default gen_random_uuid(),
  raw_material_id uuid references public.raw_materials(id) on delete set null,
  check_type text not null,
  measured_temperature text,
  result text not null default 'ok',
  notes text not null default '',
  responsible_id uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.food_safety_logs
  drop constraint if exists food_safety_logs_result_check;

alter table public.food_safety_logs
  add constraint food_safety_logs_result_check
  check (result in ('ok', 'warning', 'critical'));

alter table public.food_safety_logs
  drop constraint if exists food_safety_logs_check_type_not_blank;

alter table public.food_safety_logs
  add constraint food_safety_logs_check_type_not_blank
  check (length(trim(check_type)) > 0);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.employees(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role public.app_role,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
  drop constraint if exists audit_logs_action_not_blank;

alter table public.audit_logs
  add constraint audit_logs_action_not_blank
  check (length(trim(action)) > 0);

alter table public.audit_logs
  drop constraint if exists audit_logs_entity_type_not_blank;

alter table public.audit_logs
  add constraint audit_logs_entity_type_not_blank
  check (length(trim(entity_type)) > 0);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  period_start date not null,
  period_end date not null,
  payload jsonb not null,
  generated_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.employees(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_table_id on public.orders(table_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_inventory_movements_raw_material_id on public.inventory_movements(raw_material_id);
create unique index if not exists idx_inventory_movements_order_sale_once
  on public.inventory_movements(order_id, raw_material_id, movement_type)
  where order_id is not null and movement_type = 'sale';
create index if not exists idx_raw_materials_category on public.raw_materials(category);
create index if not exists idx_purchase_items_raw_material_id on public.purchase_items(raw_material_id);
create index if not exists idx_cash_movements_register_id on public.cash_movements(cash_register_id);
create index if not exists idx_food_safety_logs_raw_material_id on public.food_safety_logs(raw_material_id);
create index if not exists idx_food_safety_logs_created_at on public.food_safety_logs(created_at desc);
create index if not exists idx_employees_role_status on public.employees(role_id, status);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_reservations_date_status on public.reservations(reservation_date, status);
create index if not exists idx_reservations_customer_id on public.reservations(customer_id);
create index if not exists idx_customer_interactions_customer_id on public.customer_interactions(customer_id);
create index if not exists idx_operational_documents_printed_at on public.operational_documents(printed_at desc);
create index if not exists idx_operational_documents_order_id on public.operational_documents(order_id);
create index if not exists idx_operational_documents_type on public.operational_documents(document_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);

create or replace view public.recipe_costs as
select
  r.id as recipe_id,
  r.name as recipe_name,
  r.portions,
  r.target_food_cost_percent,
  coalesce(sum(
    ri.net_quantity *
    (rm.purchase_cost / nullif(rm.purchase_quantity * (rm.average_yield_percent / 100), 0))
  ), 0) as net_recipe_cost,
  coalesce(sum(
    ri.net_quantity *
    (rm.purchase_cost / nullif(rm.purchase_quantity * (rm.average_yield_percent / 100), 0))
  ), 0) / nullif(r.portions, 0) as cost_per_portion,
  (
    coalesce(sum(
      ri.net_quantity *
      (rm.purchase_cost / nullif(rm.purchase_quantity * (rm.average_yield_percent / 100), 0))
    ), 0) / nullif(r.portions, 0)
  ) / nullif(r.target_food_cost_percent / 100, 0) as suggested_sale_price
from public.recipes r
left join public.recipe_ingredients ri on ri.recipe_id = r.id
left join public.raw_materials rm on rm.id = ri.raw_material_id
group by r.id;

create or replace view public.product_profitability as
select
  p.id as product_id,
  p.name as product_name,
  p.sale_price,
  rc.cost_per_portion,
  case
    when p.sale_price > 0 then (rc.cost_per_portion / p.sale_price) * 100
    else 0
  end as food_cost_percent,
  p.sale_price - rc.cost_per_portion as gross_margin,
  case
    when p.sale_price > 0 then ((p.sale_price - rc.cost_per_portion) / p.sale_price) * 100
    else 0
  end as profitability_percent
from public.products p
left join public.recipe_costs rc on rc.recipe_id = p.recipe_id;

create or replace view public.daily_sales_report as
select
  date(o.created_at) as sales_date,
  count(*) filter (where o.status <> 'cancelled') as orders_count,
  count(*) filter (where o.status = 'cancelled') as cancelled_count,
  coalesce(sum(o.total_amount) filter (where o.status <> 'cancelled'), 0) as gross_sales,
  coalesce(sum(o.discount_amount) filter (where o.status <> 'cancelled'), 0) as discounts,
  coalesce(sum(o.tip_amount) filter (where o.status <> 'cancelled'), 0) as tips,
  case
    when count(*) filter (where o.status <> 'cancelled') > 0
      then coalesce(sum(o.total_amount) filter (where o.status <> 'cancelled'), 0)
        / count(*) filter (where o.status <> 'cancelled')
    else 0
  end as average_ticket
from public.orders o
group by date(o.created_at);

create or replace view public.product_sales_report as
select
  coalesce(p.id, oi.product_id) as product_id,
  oi.product_name,
  coalesce(sum(oi.quantity), 0) as quantity_sold,
  coalesce(sum(oi.quantity * oi.unit_price), 0) as gross_sales,
  coalesce(sum(oi.quantity * coalesce(rc.cost_per_portion, 0)), 0) as estimated_food_cost,
  coalesce(sum(oi.quantity * oi.unit_price), 0)
    - coalesce(sum(oi.quantity * coalesce(rc.cost_per_portion, 0)), 0) as gross_margin,
  case
    when coalesce(sum(oi.quantity * oi.unit_price), 0) > 0
      then (
        coalesce(sum(oi.quantity * coalesce(rc.cost_per_portion, 0)), 0)
        / coalesce(sum(oi.quantity * oi.unit_price), 0)
      ) * 100
    else 0
  end as food_cost_percent
from public.order_items oi
join public.orders o on o.id = oi.order_id
left join public.products p on p.id = oi.product_id
left join public.recipe_costs rc on rc.recipe_id = p.recipe_id
where o.status <> 'cancelled'
group by coalesce(p.id, oi.product_id), oi.product_name;

create or replace view public.inventory_valuation_report as
select
  rm.id as raw_material_id,
  rm.name,
  rm.category,
  rm.stock_quantity,
  rm.min_stock_quantity,
  rm.average_yield_percent,
  rm.purchase_cost / nullif(rm.purchase_quantity * (rm.average_yield_percent / 100), 0) as real_net_unit_cost,
  rm.stock_quantity *
    coalesce(
      rm.purchase_cost / nullif(rm.purchase_quantity * (rm.average_yield_percent / 100), 0),
      0
    ) as stock_value,
  rm.stock_quantity <= rm.min_stock_quantity as is_low_stock,
  rm.expiration_date,
  rm.lot
from public.raw_materials rm;

create or replace view public.cash_summary_report as
select
  date(cm.created_at) as movement_date,
  cm.movement_type,
  coalesce(cm.payment_method::text, 'internal') as payment_method,
  count(*) as movement_count,
  coalesce(sum(cm.amount), 0) as total_amount
from public.cash_movements cm
group by date(cm.created_at), cm.movement_type, coalesce(cm.payment_method::text, 'internal');

create or replace view public.purchase_supplier_report as
select
  s.id as supplier_id,
  coalesce(s.name, 'Sin proveedor') as supplier_name,
  count(p.id) as purchase_count,
  coalesce(sum(p.total_amount), 0) as total_purchased,
  max(p.purchase_date) as last_purchase_date
from public.purchases p
left join public.suppliers s on s.id = p.supplier_id
group by s.id, coalesce(s.name, 'Sin proveedor');

create or replace view public.food_safety_alerts as
select
  rm.id as raw_material_id,
  rm.name,
  rm.category,
  rm.lot,
  rm.stock_quantity,
  rm.min_stock_quantity,
  rm.storage_temperature,
  rm.storage_method,
  rm.expiration_date,
  rm.sanitary_risk,
  latest.check_type as last_check_type,
  latest.result as last_result,
  latest.created_at as last_checked_at,
  case
    when rm.expiration_date is not null and rm.expiration_date < current_date
      then 'critical'
    when rm.sanitary_risk = 'high'
      and rm.expiration_date is not null
      and rm.expiration_date <= current_date + interval '1 day'
      then 'critical'
    when rm.expiration_date is not null and rm.expiration_date <= current_date + interval '3 days'
      then 'warning'
    when rm.stock_quantity <= rm.min_stock_quantity
      then 'warning'
    when latest.result in ('warning', 'critical')
      then latest.result
    else 'ok'
  end as alert_status
from public.raw_materials rm
left join lateral (
  select fsl.check_type, fsl.result, fsl.created_at
  from public.food_safety_logs fsl
  where fsl.raw_material_id = rm.id
  order by fsl.created_at desc
  limit 1
) latest on true;

create or replace view public.food_safety_log_summary as
select
  date(created_at) as check_date,
  check_type,
  result,
  count(*) as checks_count
from public.food_safety_logs
group by date(created_at), check_type, result;

create or replace view public.employee_shift_report as
with waiter_orders as (
  select
    waiter_id as employee_id,
    count(*) as served_orders,
    coalesce(sum(total_amount), 0) as waiter_sales,
    max(created_at) as last_order_at
  from public.orders
  where waiter_id is not null
    and status <> 'cancelled'
  group by waiter_id
),
cashier_orders as (
  select
    cashier_id as employee_id,
    count(*) as cashier_orders,
    coalesce(sum(total_amount), 0) as cashier_sales,
    max(paid_at) as last_cashier_at
  from public.orders
  where cashier_id is not null
    and status = 'paid'
  group by cashier_id
),
inventory_actions as (
  select
    responsible_id as employee_id,
    count(*) as inventory_actions,
    max(created_at) as last_inventory_at
  from public.inventory_movements
  where responsible_id is not null
  group by responsible_id
),
safety_actions as (
  select
    responsible_id as employee_id,
    count(*) as safety_checks,
    max(created_at) as last_safety_at
  from public.food_safety_logs
  where responsible_id is not null
  group by responsible_id
)
select
  e.id as employee_id,
  e.full_name,
  e.role_id,
  e.shift,
  e.status,
  e.hourly_cost,
  e.hired_at,
  coalesce(wo.served_orders, 0) as served_orders,
  coalesce(wo.waiter_sales, 0) as waiter_sales,
  coalesce(co.cashier_orders, 0) as cashier_orders,
  coalesce(co.cashier_sales, 0) as cashier_sales,
  coalesce(ia.inventory_actions, 0) as inventory_actions,
  coalesce(sa.safety_checks, 0) as safety_checks,
  e.hourly_cost * 8 as estimated_shift_cost,
  greatest(
    coalesce(wo.last_order_at, '-infinity'::timestamptz),
    coalesce(co.last_cashier_at, '-infinity'::timestamptz),
    coalesce(ia.last_inventory_at, '-infinity'::timestamptz),
    coalesce(sa.last_safety_at, '-infinity'::timestamptz),
    e.updated_at
  ) as last_activity_at
from public.employees e
left join waiter_orders wo on wo.employee_id = e.id
left join cashier_orders co on co.employee_id = e.id
left join inventory_actions ia on ia.employee_id = e.id
left join safety_actions sa on sa.employee_id = e.id;

create or replace view public.customer_crm_report as
select
  c.id as customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.tags,
  c.allergies,
  c.visit_count,
  c.total_spent,
  c.last_visit_at,
  count(r.id) as reservation_count,
  count(r.id) filter (where r.status = 'no_show') as no_show_count,
  count(ci.id) as interaction_count,
  max(greatest(
    coalesce(r.created_at, '-infinity'::timestamptz),
    coalesce(ci.created_at, '-infinity'::timestamptz),
    c.updated_at
  )) as last_crm_activity_at
from public.customers c
left join public.reservations r on r.customer_id = c.id
left join public.customer_interactions ci on ci.customer_id = c.id
group by c.id;

create or replace view public.reservation_daily_report as
select
  reservation_date,
  status,
  channel,
  count(*) as reservation_count,
  coalesce(sum(party_size), 0) as expected_guests,
  min(reservation_time) as first_reservation_time,
  max(reservation_time) as last_reservation_time
from public.reservations
group by reservation_date, status, channel;

create or replace view public.operational_document_report as
select
  date(printed_at) as print_date,
  document_type,
  count(*) as document_count,
  max(printed_at) as last_printed_at
from public.operational_documents
group by date(printed_at), document_type;

create or replace view public.audit_activity_report as
select
  date(al.created_at) as activity_date,
  al.entity_type,
  al.action,
  coalesce(al.actor_role::text, 'sin_rol') as actor_role,
  count(*) as activity_count,
  max(al.created_at) as last_activity_at
from public.audit_logs al
group by date(al.created_at), al.entity_type, al.action, coalesce(al.actor_role::text, 'sin_rol');

create or replace function public.record_audit_log(
  action_input text,
  entity_type_input text,
  entity_id_input text default null,
  summary_input text default '',
  metadata_input jsonb default '{}'::jsonb,
  responsible_employee_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_audit_id uuid;
  actor_employee_id uuid;
  actor_role_value public.app_role;
  current_role_text text;
begin
  if nullif(trim(action_input), '') is null then
    raise exception 'La accion de auditoria es obligatoria';
  end if;

  if nullif(trim(entity_type_input), '') is null then
    raise exception 'La entidad auditada es obligatoria';
  end if;

  actor_employee_id := responsible_employee_id;

  if actor_employee_id is null and auth.uid() is not null then
    select id into actor_employee_id
    from public.employees
    where user_id = auth.uid()
    limit 1;
  end if;

  current_role_text := public.current_app_role();

  if current_role_text in (
    'master',
    'administrator',
    'supervisor',
    'cashier',
    'waiter',
    'cook',
    'chef',
    'warehouse'
  ) then
    actor_role_value := current_role_text::public.app_role;
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    actor_employee_id,
    auth.uid(),
    actor_role_value,
    trim(action_input),
    trim(entity_type_input),
    nullif(trim(coalesce(entity_id_input, '')), ''),
    coalesce(summary_input, ''),
    coalesce(metadata_input, '{}'::jsonb)
  )
  returning id into created_audit_id;

  return created_audit_id;
end;
$$;

grant execute on function public.record_audit_log(
  text,
  text,
  text,
  text,
  jsonb,
  uuid
) to authenticated;

create or replace function public.upsert_technical_recipe(
  recipe_id_input uuid,
  name_input text,
  category_input text,
  portions_input numeric,
  prep_time_minutes_input integer,
  photo_url_input text,
  procedure_input text,
  allergens_input text[],
  observations_input text,
  target_food_cost_percent_input numeric,
  reference_sale_price_input numeric,
  ingredients_input jsonb,
  responsible_employee_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_recipe_id uuid;
begin
  if public.current_app_role() not in ('master', 'administrator', 'chef') then
    raise exception 'No autorizado para guardar recetas tecnicas';
  end if;

  if nullif(trim(name_input), '') is null then
    raise exception 'El nombre de la receta es obligatorio';
  end if;

  if portions_input <= 0 then
    raise exception 'Las porciones deben ser mayores a cero';
  end if;

  if target_food_cost_percent_input <= 0 then
    raise exception 'El food cost objetivo debe ser mayor a cero';
  end if;

  if reference_sale_price_input < 0 then
    raise exception 'El precio de referencia no puede ser negativo';
  end if;

  if jsonb_typeof(coalesce(ingredients_input, '[]'::jsonb)) <> 'array' then
    raise exception 'Los ingredientes deben enviarse como arreglo JSON';
  end if;

  if recipe_id_input is null then
    insert into public.recipes (
      name,
      category,
      portions,
      prep_time_minutes,
      photo_url,
      procedure,
      allergens,
      observations,
      target_food_cost_percent,
      reference_sale_price,
      created_by
    )
    values (
      trim(name_input),
      trim(category_input),
      portions_input,
      greatest(0, coalesce(prep_time_minutes_input, 0)),
      nullif(trim(coalesce(photo_url_input, '')), ''),
      coalesce(procedure_input, ''),
      coalesce(allergens_input, '{}'),
      coalesce(observations_input, ''),
      target_food_cost_percent_input,
      reference_sale_price_input,
      responsible_employee_id
    )
    returning id into target_recipe_id;
  else
    target_recipe_id := recipe_id_input;

    update public.recipes
    set name = trim(name_input),
        category = trim(category_input),
        portions = portions_input,
        prep_time_minutes = greatest(0, coalesce(prep_time_minutes_input, 0)),
        photo_url = nullif(trim(coalesce(photo_url_input, '')), ''),
        procedure = coalesce(procedure_input, ''),
        allergens = coalesce(allergens_input, '{}'),
        observations = coalesce(observations_input, ''),
        target_food_cost_percent = target_food_cost_percent_input,
        reference_sale_price = reference_sale_price_input,
        updated_at = now()
    where id = target_recipe_id;

    if not found then
      raise exception 'No se encontro la receta tecnica';
    end if;
  end if;

  delete from public.recipe_ingredients
  where recipe_id = target_recipe_id;

  insert into public.recipe_ingredients (
    recipe_id,
    raw_material_id,
    unit,
    gross_quantity,
    yield_percent,
    waste_type
  )
  select
    target_recipe_id,
    (ingredient ->> 'rawMaterialId')::uuid,
    coalesce(nullif(ingredient ->> 'unit', ''), rm.unit),
    coalesce(nullif(ingredient ->> 'grossQuantity', '')::numeric, 0),
    coalesce(nullif(ingredient ->> 'yieldPercent', '')::numeric, 100),
    coalesce(nullif(ingredient ->> 'wasteType', ''), 'Sin merma')
  from jsonb_array_elements(coalesce(ingredients_input, '[]'::jsonb)) ingredient
  join public.raw_materials rm on rm.id = (ingredient ->> 'rawMaterialId')::uuid
  where coalesce(nullif(ingredient ->> 'grossQuantity', '')::numeric, 0) > 0
    and coalesce(nullif(ingredient ->> 'yieldPercent', '')::numeric, 100) > 0
    and coalesce(nullif(ingredient ->> 'yieldPercent', '')::numeric, 100) <= 100;

  return target_recipe_id;
end;
$$;

grant execute on function public.upsert_technical_recipe(
  uuid,
  text,
  text,
  numeric,
  integer,
  text,
  text,
  text[],
  text,
  numeric,
  numeric,
  jsonb,
  uuid
) to authenticated;

create or replace function public.consume_order_inventory(
  target_order_id uuid,
  responsible_employee_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  movement_count integer := 0;
  updated_count integer := 0;
begin
  if exists (
    select 1
    from public.inventory_movements
    where order_id = target_order_id
      and movement_type = 'sale'
  ) then
    return jsonb_build_object(
      'ok', true,
      'message', 'Inventario ya descontado para esta orden',
      'movements', 0,
      'materials', 0
    );
  end if;

  with consumption as (
    select
      ri.raw_material_id,
      sum(oi.quantity * (ri.gross_quantity / nullif(r.portions, 0))) as used_quantity,
      max(o.order_number) as order_number,
      max(o.id_simulacion) as id_simulacion,
      max(
        rm.purchase_cost /
        nullif(rm.purchase_quantity * (rm.average_yield_percent / 100), 0)
      ) as unit_cost
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    join public.recipes r on r.id = p.recipe_id
    join public.recipe_ingredients ri on ri.recipe_id = r.id
    join public.raw_materials rm on rm.id = ri.raw_material_id
    join public.orders o on o.id = oi.order_id
    where oi.order_id = target_order_id
      and p.recipe_id is not null
    group by ri.raw_material_id
  ),
  inserted as (
    insert into public.inventory_movements (
      raw_material_id,
      id_simulacion,
      order_id,
      movement_type,
      quantity,
      unit_cost,
      reason,
      responsible_id
    )
    select
      raw_material_id,
      id_simulacion,
      target_order_id,
      'sale',
      -used_quantity,
      coalesce(unit_cost, 0),
      'Consumo por venta ' || order_number,
      responsible_employee_id
    from consumption
    where used_quantity > 0
    returning 1
  )
  select count(*) into movement_count
  from inserted;

  with consumption as (
    select
      ri.raw_material_id,
      sum(oi.quantity * (ri.gross_quantity / nullif(r.portions, 0))) as used_quantity
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    join public.recipes r on r.id = p.recipe_id
    join public.recipe_ingredients ri on ri.recipe_id = r.id
    where oi.order_id = target_order_id
      and p.recipe_id is not null
    group by ri.raw_material_id
  )
  update public.raw_materials rm
  set stock_quantity = greatest(0, rm.stock_quantity - consumption.used_quantity),
      updated_at = now()
  from consumption
  where rm.id = consumption.raw_material_id
    and consumption.used_quantity > 0;

  get diagnostics updated_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'message', 'Inventario descontado por venta',
    'movements', movement_count,
    'materials', updated_count
  );
end;
$$;

grant execute on function public.consume_order_inventory(uuid, uuid) to authenticated;

create or replace function public.receive_purchase_inventory(
  supplier_id_input uuid,
  document_type_input text,
  document_number_input text,
  raw_material_id_input uuid,
  description_input text,
  quantity_input numeric,
  unit_input text,
  unit_cost_input numeric,
  yield_percent_input numeric,
  expiration_date_input date default null,
  lot_input text default null,
  responsible_employee_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_purchase_id uuid;
  total_cost numeric(14,2);
  real_net_unit_cost numeric(14,4);
begin
  if public.current_app_role() not in (
    'master',
    'administrator',
    'supervisor',
    'chef',
    'warehouse'
  ) then
    raise exception 'No autorizado para recepcionar compras';
  end if;

  if quantity_input <= 0 then
    raise exception 'La cantidad de compra debe ser mayor a cero';
  end if;

  if unit_cost_input < 0 then
    raise exception 'El costo unitario no puede ser negativo';
  end if;

  if yield_percent_input <= 0 or yield_percent_input > 100 then
    raise exception 'El rendimiento debe estar entre 0 y 100';
  end if;

  total_cost := quantity_input * unit_cost_input;
  real_net_unit_cost := total_cost / nullif(quantity_input * (yield_percent_input / 100), 0);

  insert into public.purchases (
    supplier_id,
    document_type,
    document_number,
    purchase_date,
    subtotal,
    tax_amount,
    total_amount,
    status,
    received_by
  )
  values (
    supplier_id_input,
    case when document_type_input = 'receipt' then 'receipt' else 'invoice' end,
    document_number_input,
    current_date,
    total_cost,
    0,
    total_cost,
    'received',
    responsible_employee_id
  )
  returning id into created_purchase_id;

  insert into public.purchase_items (
    purchase_id,
    raw_material_id,
    description,
    quantity,
    unit,
    unit_cost,
    yield_percent,
    expiration_date,
    lot
  )
  values (
    created_purchase_id,
    raw_material_id_input,
    description_input,
    quantity_input,
    unit_input,
    unit_cost_input,
    yield_percent_input,
    expiration_date_input,
    lot_input
  );

  insert into public.inventory_movements (
    raw_material_id,
    purchase_id,
    movement_type,
    quantity,
    unit_cost,
    reason,
    responsible_id
  )
  values (
    raw_material_id_input,
    created_purchase_id,
    'purchase',
    quantity_input,
    coalesce(real_net_unit_cost, 0),
    'Recepcion compra ' || document_number_input,
    responsible_employee_id
  );

  update public.raw_materials
  set supplier_id = supplier_id_input,
      purchase_quantity = quantity_input,
      purchase_cost = total_cost,
      stock_quantity = stock_quantity + quantity_input,
      average_yield_percent = yield_percent_input,
      expiration_date = coalesce(expiration_date_input, expiration_date),
      lot = coalesce(lot_input, lot),
      updated_at = now()
  where id = raw_material_id_input;

  return created_purchase_id;
end;
$$;

grant execute on function public.receive_purchase_inventory(
  uuid,
  text,
  text,
  uuid,
  text,
  numeric,
  text,
  numeric,
  numeric,
  date,
  text,
  uuid
) to authenticated;

insert into public.roles (id, name, description, permissions)
values
  ('master', 'Maestro', 'Creador de la app con control total y gestion de perfiles', '["*"]'),
  ('administrator', 'Administrador', 'Control total del sistema', '["*"]'),
  ('supervisor', 'Supervisor', 'Supervision operativa', '["dashboard:read","tables:manage","orders:manage","kitchen:manage","cash:manage","crm:manage","documents:manage","inventory:manage","reports:read","food-safety:manage","employees:manage","audit:read","settings:manage","education:read"]'),
  ('cashier', 'Cajero', 'Caja y pagos', '["dashboard:read","orders:manage","cash:manage","crm:manage","documents:manage","reports:read","education:read"]'),
  ('waiter', 'Mesero', 'Salon y pedidos', '["dashboard:read","tables:manage","orders:manage","crm:manage","documents:manage","education:read"]'),
  ('cook', 'Cocinero', 'Comandas de cocina', '["dashboard:read","kitchen:manage","documents:manage","education:read"]'),
  ('chef', 'Jefe de cocina', 'Recetas, cocina e inventario', '["dashboard:read","kitchen:manage","products:manage","recipes:manage","documents:manage","inventory:manage","food-safety:manage","reports:read","education:read"]'),
  ('warehouse', 'Encargado de bodega', 'Inventario, compras y seguridad', '["dashboard:read","inventory:manage","purchases:manage","food-safety:manage","reports:read","education:read"]')
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    permissions = excluded.permissions;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'roles',
    'users',
    'employees',
    'tables',
    'orders',
    'order_items',
    'products',
    'product_categories',
    'recipes',
    'recipe_ingredients',
    'raw_materials',
    'inventory_movements',
    'suppliers',
    'purchases',
    'purchase_items',
    'cash_registers',
    'cash_movements',
    'operational_documents',
    'food_safety_logs',
    'customers',
    'reservations',
    'customer_interactions',
    'audit_logs',
    'reports',
    'settings',
    'kitchen_tickets'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
  end loop;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'roles',
    'users',
    'employees',
    'tables',
    'orders',
    'order_items',
    'products',
    'product_categories',
    'recipes',
    'recipe_ingredients',
    'raw_materials',
    'inventory_movements',
    'suppliers',
    'purchases',
    'purchase_items',
    'cash_registers',
    'cash_movements',
    'operational_documents',
    'food_safety_logs',
    'customers',
    'reservations',
    'customer_interactions',
    'audit_logs',
    'reports',
    'settings',
    'kitchen_tickets'
  ]
  loop
    execute format('drop policy if exists "authenticated read" on public.%I', target_table);
    execute format(
      'create policy "authenticated read" on public.%I for select to authenticated using (true)',
      target_table
    );

    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format(
      'create policy "manager write" on public.%I for all to authenticated using (public.current_app_role() in (''master'', ''administrator'', ''supervisor'', ''chef'', ''warehouse'', ''cashier'', ''waiter'', ''cook'')) with check (public.current_app_role() in (''master'', ''administrator'', ''supervisor'', ''chef'', ''warehouse'', ''cashier'', ''waiter'', ''cook''))',
      target_table
    );
  end loop;
end $$;

-- Capa academica Plan 2: dominio persistente en espanol.
-- Esta capa convive con el motor operativo existente y permite asociar
-- cursos, clases, simulaciones, alumnos, roles, evaluaciones y trazabilidad.

create or replace function public.set_fecha_actualizacion()
returns trigger
language plpgsql
as $$
begin
  new.fecha_actualizacion = now();
  return new;
end;
$$;

do $$
begin
  create type public.estado_simulacion as enum (
    'creada',
    'configurada',
    'alumnos_asignados',
    'productos_cargados',
    'pre_servicio',
    'servicio_activo',
    'servicio_cerrado',
    'reporte_generado',
    'evaluacion_finalizada',
    'archivada'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.estado_pedido_academico as enum (
    'pedido_recibido',
    'en_preparacion',
    'listo',
    'entregado',
    'observado',
    'cancelado'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.area_trabajo_academica as enum (
    'bodega',
    'cocina',
    'bar',
    'garzon',
    'caja',
    'pasteleria',
    'supervision'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.tipo_evaluacion_academica as enum (
    'prueba',
    'guia',
    'caso_practico',
    'rubrica',
    'evaluacion_rol',
    'evaluacion_grupal',
    'evaluacion_individual'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.tipo_imprevisto_simulacion as enum (
    'falta_producto',
    'producto_vencido',
    'error_comanda',
    'cliente_insatisfecho',
    'demora_cocina',
    'falla_stock',
    'cambio_receta',
    'problema_higiene',
    'reclamo_cliente'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.instituciones (
  id_institucion uuid primary key default gen_random_uuid(),
  nombre_institucion text not null,
  rut_institucion text,
  sede text,
  direccion text,
  estado text not null default 'activa'
    check (estado in ('activa', 'inactiva')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.perfiles_academicos (
  id_perfil uuid primary key default gen_random_uuid(),
  id_usuario uuid references public.users(id) on delete cascade,
  id_institucion uuid references public.instituciones(id_institucion) on delete set null,
  nombre_completo text not null,
  correo text not null,
  rol_academico text not null
    check (rol_academico in ('administrador', 'profesor', 'alumno', 'comensal')),
  identificador_institucional text,
  seccion text,
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo', 'suspendido')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  unique (id_usuario),
  unique (id_institucion, correo)
);

create table if not exists public.cursos (
  id_curso uuid primary key default gen_random_uuid(),
  id_institucion uuid references public.instituciones(id_institucion) on delete cascade,
  id_profesor uuid references public.perfiles_academicos(id_perfil) on delete set null,
  nombre_curso text not null,
  asignatura text not null,
  codigo_curso text,
  periodo text,
  estado text not null default 'activo'
    check (estado in ('borrador', 'activo', 'cerrado', 'archivado')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.secciones (
  id_seccion uuid primary key default gen_random_uuid(),
  id_curso uuid not null references public.cursos(id_curso) on delete cascade,
  nombre_seccion text not null,
  jornada text,
  cupo integer not null default 0 check (cupo >= 0),
  estado text not null default 'activa'
    check (estado in ('activa', 'cerrada', 'archivada')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  unique (id_curso, nombre_seccion)
);

create table if not exists public.matriculas (
  id_matricula uuid primary key default gen_random_uuid(),
  id_seccion uuid not null references public.secciones(id_seccion) on delete cascade,
  id_alumno uuid not null references public.perfiles_academicos(id_perfil) on delete cascade,
  estado text not null default 'activa'
    check (estado in ('activa', 'retirada', 'aprobada', 'reprobada')),
  fecha_creacion timestamptz not null default now(),
  unique (id_seccion, id_alumno)
);

create table if not exists public.clases (
  id_clase uuid primary key default gen_random_uuid(),
  id_curso uuid not null references public.cursos(id_curso) on delete cascade,
  id_seccion uuid references public.secciones(id_seccion) on delete set null,
  id_profesor uuid references public.perfiles_academicos(id_perfil) on delete set null,
  nombre_clase text not null,
  fecha date not null,
  objetivo text not null default '',
  tipo_servicio text not null default '',
  estado text not null default 'planificada'
    check (estado in ('planificada', 'activa', 'cerrada', 'archivada')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.simulaciones (
  id_simulacion uuid primary key default gen_random_uuid(),
  id_clase uuid not null references public.clases(id_clase) on delete cascade,
  nombre_simulacion text not null,
  tipo_servicio text not null,
  objetivo text not null default '',
  estado public.estado_simulacion not null default 'creada',
  duracion_estimada_minutos integer not null default 0 check (duracion_estimada_minutos >= 0),
  fecha_inicio timestamptz,
  fecha_cierre timestamptz,
  configuracion jsonb not null default '{}'::jsonb,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.areas_simulacion (
  id_area_simulacion uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  area_trabajo public.area_trabajo_academica not null,
  responsable uuid references public.perfiles_academicos(id_perfil) on delete set null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'lista', 'observada', 'cerrada')),
  observacion text not null default '',
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  unique (id_simulacion, area_trabajo)
);

create table if not exists public.grupos_trabajo (
  id_grupo uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  nombre_grupo text not null,
  observacion text not null default '',
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  unique (id_simulacion, nombre_grupo)
);

create table if not exists public.integrantes_grupo (
  id_integrante uuid primary key default gen_random_uuid(),
  id_grupo uuid not null references public.grupos_trabajo(id_grupo) on delete cascade,
  id_alumno uuid not null references public.perfiles_academicos(id_perfil) on delete cascade,
  fecha_creacion timestamptz not null default now(),
  unique (id_grupo, id_alumno)
);

create table if not exists public.roles_simulacion (
  id_rol_simulacion uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  id_alumno uuid not null references public.perfiles_academicos(id_perfil) on delete cascade,
  id_grupo uuid references public.grupos_trabajo(id_grupo) on delete set null,
  rol_asignado text not null,
  area_trabajo public.area_trabajo_academica not null,
  permisos jsonb not null default '[]'::jsonb,
  estado text not null default 'asignado'
    check (estado in ('asignado', 'activo', 'cerrado')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  unique (id_simulacion, id_alumno)
);

create table if not exists public.simulacion_recetas (
  id_simulacion_receta uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  id_receta uuid not null references public.recipes(id) on delete restrict,
  porciones_planificadas numeric(10,2) not null default 0 check (porciones_planificadas >= 0),
  fecha_creacion timestamptz not null default now(),
  unique (id_simulacion, id_receta)
);

create table if not exists public.simulacion_productos (
  id_simulacion_producto uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  id_producto uuid not null references public.products(id) on delete restrict,
  cantidad_planificada numeric(14,3) not null default 0 check (cantidad_planificada >= 0),
  cantidad_recibida numeric(14,3) not null default 0 check (cantidad_recibida >= 0),
  observacion text not null default '',
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  unique (id_simulacion, id_producto)
);

create table if not exists public.evaluaciones (
  id_evaluacion uuid primary key default gen_random_uuid(),
  id_simulacion uuid references public.simulaciones(id_simulacion) on delete cascade,
  id_clase uuid references public.clases(id_clase) on delete cascade,
  id_profesor uuid references public.perfiles_academicos(id_perfil) on delete set null,
  tipo_evaluacion public.tipo_evaluacion_academica not null,
  titulo text not null,
  descripcion text not null default '',
  rol_objetivo text,
  puntaje_maximo numeric(10,2) not null default 100 check (puntaje_maximo >= 0),
  intentos_permitidos integer not null default 1 check (intentos_permitidos > 0),
  tiempo_limite_minutos integer check (tiempo_limite_minutos is null or tiempo_limite_minutos > 0),
  nota_automatica boolean not null default false,
  correccion_manual boolean not null default true,
  pauta jsonb not null default '{}'::jsonb,
  estado text not null default 'borrador'
    check (estado in ('borrador', 'publicada', 'cerrada', 'archivada')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  check (id_simulacion is not null or id_clase is not null)
);

create table if not exists public.respuestas_evaluacion (
  id_respuesta uuid primary key default gen_random_uuid(),
  id_evaluacion uuid not null references public.evaluaciones(id_evaluacion) on delete cascade,
  id_alumno uuid not null references public.perfiles_academicos(id_perfil) on delete cascade,
  id_simulacion uuid references public.simulaciones(id_simulacion) on delete cascade,
  intento integer not null default 1 check (intento > 0),
  respuestas jsonb not null default '{}'::jsonb,
  puntaje numeric(10,2),
  nota numeric(4,2),
  retroalimentacion text not null default '',
  corregida_por uuid references public.perfiles_academicos(id_perfil) on delete set null,
  fecha_envio timestamptz not null default now(),
  fecha_correccion timestamptz,
  unique (id_evaluacion, id_alumno, intento)
);

create table if not exists public.imprevistos_simulacion (
  id_imprevisto uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  id_profesor uuid references public.perfiles_academicos(id_perfil) on delete set null,
  tipo_imprevisto public.tipo_imprevisto_simulacion not null,
  descripcion text not null,
  area_afectada public.area_trabajo_academica,
  estado text not null default 'activo'
    check (estado in ('activo', 'resuelto', 'cancelado')),
  impacto jsonb not null default '{}'::jsonb,
  fecha_activacion timestamptz not null default now(),
  fecha_cierre timestamptz
);

create table if not exists public.feedback_comensal (
  id_feedback uuid primary key default gen_random_uuid(),
  id_simulacion uuid not null references public.simulaciones(id_simulacion) on delete cascade,
  id_venta uuid references public.orders(id) on delete set null,
  mesa text,
  nombre_comensal text,
  puntuacion_atencion integer not null check (puntuacion_atencion between 1 and 5),
  puntuacion_sabor integer not null check (puntuacion_sabor between 1 and 5),
  puntuacion_presentacion integer not null check (puntuacion_presentacion between 1 and 5),
  puntuacion_tiempo integer not null check (puntuacion_tiempo between 1 and 5),
  puntuacion_limpieza integer not null check (puntuacion_limpieza between 1 and 5),
  puntuacion_experiencia integer not null check (puntuacion_experiencia between 1 and 5),
  comentario text not null default '',
  fecha_creacion timestamptz not null default now()
);

create table if not exists public.trazabilidad_academica (
  id_trazabilidad uuid primary key default gen_random_uuid(),
  id_usuario uuid references public.users(id) on delete set null,
  id_perfil uuid references public.perfiles_academicos(id_perfil) on delete set null,
  id_simulacion uuid references public.simulaciones(id_simulacion) on delete cascade,
  id_clase uuid references public.clases(id_clase) on delete set null,
  rol text,
  modulo text not null,
  accion text not null,
  entidad text,
  id_entidad text,
  valor_anterior jsonb,
  valor_nuevo jsonb,
  observacion text not null default '',
  fecha_hora timestamptz not null default now()
);

create index if not exists idx_perfiles_academicos_rol on public.perfiles_academicos(rol_academico);
create index if not exists idx_cursos_profesor on public.cursos(id_profesor);
create index if not exists idx_secciones_curso on public.secciones(id_curso);
create index if not exists idx_matriculas_alumno on public.matriculas(id_alumno);
create index if not exists idx_clases_curso_fecha on public.clases(id_curso, fecha);
create index if not exists idx_simulaciones_clase_estado on public.simulaciones(id_clase, estado);
create index if not exists idx_roles_simulacion_alumno on public.roles_simulacion(id_alumno);
create index if not exists idx_evaluaciones_simulacion on public.evaluaciones(id_simulacion);
create index if not exists idx_respuestas_evaluacion_alumno on public.respuestas_evaluacion(id_alumno);
create index if not exists idx_imprevistos_simulacion_estado on public.imprevistos_simulacion(id_simulacion, estado);
create index if not exists idx_feedback_comensal_simulacion on public.feedback_comensal(id_simulacion);
create index if not exists idx_trazabilidad_academica_simulacion on public.trazabilidad_academica(id_simulacion, fecha_hora desc);
create index if not exists idx_trazabilidad_academica_perfil on public.trazabilidad_academica(id_perfil, fecha_hora desc);

create or replace function public.current_academic_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'academic_role',
    auth.jwt() -> 'app_metadata' ->> 'academic_role',
    (
      select rol_academico
      from public.perfiles_academicos
      where id_usuario = auth.uid()
        and estado = 'activo'
      limit 1
    ),
    auth.jwt() ->> 'user_role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    public.current_app_role(),
    'anonymous'
  );
$$;

grant execute on function public.current_academic_role() to anon, authenticated;

-- Vinculos entre el motor operativo y la simulacion academica.
alter table public.orders
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.order_items
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.kitchen_tickets
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.inventory_movements
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.cash_registers
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.cash_movements
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.purchases
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.purchase_items
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.food_safety_logs
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.operational_documents
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.reports
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

alter table public.audit_logs
  add column if not exists id_simulacion uuid references public.simulaciones(id_simulacion) on delete set null;

create index if not exists idx_orders_id_simulacion on public.orders(id_simulacion);
create index if not exists idx_order_items_id_simulacion on public.order_items(id_simulacion);
create index if not exists idx_kitchen_tickets_id_simulacion on public.kitchen_tickets(id_simulacion);
create index if not exists idx_inventory_movements_id_simulacion on public.inventory_movements(id_simulacion);
create index if not exists idx_cash_registers_id_simulacion on public.cash_registers(id_simulacion);
create index if not exists idx_cash_movements_id_simulacion on public.cash_movements(id_simulacion);
create index if not exists idx_purchases_id_simulacion on public.purchases(id_simulacion);
create index if not exists idx_food_safety_logs_id_simulacion on public.food_safety_logs(id_simulacion);
create index if not exists idx_operational_documents_id_simulacion on public.operational_documents(id_simulacion);
create index if not exists idx_reports_id_simulacion on public.reports(id_simulacion);
create index if not exists idx_audit_logs_id_simulacion on public.audit_logs(id_simulacion);

create or replace function public.heredar_simulacion_desde_pedido()
returns trigger
language plpgsql
as $$
begin
  if new.id_simulacion is null and new.order_id is not null then
    select id_simulacion into new.id_simulacion
    from public.orders
    where id = new.order_id;
  end if;

  return new;
end;
$$;

create or replace function public.heredar_simulacion_desde_compra()
returns trigger
language plpgsql
as $$
begin
  if new.id_simulacion is null and new.purchase_id is not null then
    select id_simulacion into new.id_simulacion
    from public.purchases
    where id = new.purchase_id;
  end if;

  return new;
end;
$$;

create or replace function public.heredar_simulacion_movimiento_bodega()
returns trigger
language plpgsql
as $$
begin
  if new.id_simulacion is null and new.order_id is not null then
    select id_simulacion into new.id_simulacion
    from public.orders
    where id = new.order_id;
  end if;

  if new.id_simulacion is null and new.purchase_id is not null then
    select id_simulacion into new.id_simulacion
    from public.purchases
    where id = new.purchase_id;
  end if;

  return new;
end;
$$;

create or replace function public.heredar_simulacion_documento()
returns trigger
language plpgsql
as $$
begin
  if new.id_simulacion is null and new.order_id is not null then
    select id_simulacion into new.id_simulacion
    from public.orders
    where id = new.order_id;
  end if;

  if new.id_simulacion is null and new.cash_register_id is not null then
    select id_simulacion into new.id_simulacion
    from public.cash_registers
    where id = new.cash_register_id;
  end if;

  return new;
end;
$$;

drop trigger if exists set_order_items_id_simulacion on public.order_items;
create trigger set_order_items_id_simulacion
before insert or update on public.order_items
for each row execute function public.heredar_simulacion_desde_pedido();

drop trigger if exists set_kitchen_tickets_id_simulacion on public.kitchen_tickets;
create trigger set_kitchen_tickets_id_simulacion
before insert or update on public.kitchen_tickets
for each row execute function public.heredar_simulacion_desde_pedido();

drop trigger if exists set_cash_movements_id_simulacion on public.cash_movements;
create trigger set_cash_movements_id_simulacion
before insert or update on public.cash_movements
for each row execute function public.heredar_simulacion_desde_pedido();

drop trigger if exists set_inventory_movements_id_simulacion on public.inventory_movements;
create trigger set_inventory_movements_id_simulacion
before insert or update on public.inventory_movements
for each row execute function public.heredar_simulacion_movimiento_bodega();

drop trigger if exists set_purchase_items_id_simulacion on public.purchase_items;
create trigger set_purchase_items_id_simulacion
before insert or update on public.purchase_items
for each row execute function public.heredar_simulacion_desde_compra();

drop trigger if exists set_operational_documents_id_simulacion on public.operational_documents;
create trigger set_operational_documents_id_simulacion
before insert or update on public.operational_documents
for each row execute function public.heredar_simulacion_documento();

create or replace function public.registrar_trazabilidad_academica(
  id_simulacion_input uuid,
  modulo_input text,
  accion_input text,
  entidad_input text default null,
  id_entidad_input text default null,
  valor_anterior_input jsonb default null,
  valor_nuevo_input jsonb default null,
  observacion_input text default '',
  id_perfil_input uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  id_trazabilidad_creada uuid;
  id_clase_actual uuid;
  id_perfil_actual uuid;
  rol_actual text;
begin
  if nullif(trim(modulo_input), '') is null then
    raise exception 'El modulo es obligatorio';
  end if;

  if nullif(trim(accion_input), '') is null then
    raise exception 'La accion es obligatoria';
  end if;

  select id_clase into id_clase_actual
  from public.simulaciones
  where id_simulacion = id_simulacion_input;

  id_perfil_actual := id_perfil_input;

  if id_perfil_actual is null and auth.uid() is not null then
    select id_perfil, rol_academico
    into id_perfil_actual, rol_actual
    from public.perfiles_academicos
    where id_usuario = auth.uid()
    limit 1;
  end if;

  if rol_actual is null and id_perfil_actual is not null then
    select rol_academico into rol_actual
    from public.perfiles_academicos
    where id_perfil = id_perfil_actual;
  end if;

  insert into public.trazabilidad_academica (
    id_usuario,
    id_perfil,
    id_simulacion,
    id_clase,
    rol,
    modulo,
    accion,
    entidad,
    id_entidad,
    valor_anterior,
    valor_nuevo,
    observacion
  )
  values (
    auth.uid(),
    id_perfil_actual,
    id_simulacion_input,
    id_clase_actual,
    rol_actual,
    trim(modulo_input),
    trim(accion_input),
    nullif(trim(coalesce(entidad_input, '')), ''),
    nullif(trim(coalesce(id_entidad_input, '')), ''),
    valor_anterior_input,
    valor_nuevo_input,
    coalesce(observacion_input, '')
  )
  returning id_trazabilidad into id_trazabilidad_creada;

  return id_trazabilidad_creada;
end;
$$;

grant execute on function public.registrar_trazabilidad_academica(
  uuid,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  text,
  uuid
) to authenticated;

create or replace function public.actualizar_estado_simulacion(
  id_simulacion_input uuid,
  estado_input public.estado_simulacion,
  observacion_input text default ''
)
returns public.simulaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  simulacion_anterior public.simulaciones%rowtype;
  simulacion_actualizada public.simulaciones%rowtype;
begin
  if public.current_academic_role() not in (
    'master',
    'maestro',
    'administrator',
    'administrador',
    'supervisor',
    'profesor'
  ) then
    raise exception 'No autorizado para cambiar el estado de la simulacion';
  end if;

  select * into simulacion_anterior
  from public.simulaciones
  where id_simulacion = id_simulacion_input
  for update;

  if not found then
    raise exception 'No se encontro la simulacion academica';
  end if;

  update public.simulaciones
  set estado = estado_input,
      fecha_inicio = case
        when estado_input = 'servicio_activo' and fecha_inicio is null then now()
        else fecha_inicio
      end,
      fecha_cierre = case
        when estado_input in (
          'servicio_cerrado',
          'reporte_generado',
          'evaluacion_finalizada',
          'archivada'
        ) and fecha_cierre is null then now()
        else fecha_cierre
      end,
      fecha_actualizacion = now()
  where id_simulacion = id_simulacion_input
  returning * into simulacion_actualizada;

  perform public.registrar_trazabilidad_academica(
    id_simulacion_input,
    'simulacion',
    'cambiar_estado',
    'simulaciones',
    id_simulacion_input::text,
    jsonb_build_object('estado', simulacion_anterior.estado),
    jsonb_build_object('estado', simulacion_actualizada.estado),
    coalesce(
      nullif(trim(observacion_input), ''),
      'Cambio de estado de simulacion academica'
    ),
    null
  );

  return simulacion_actualizada;
end;
$$;

grant execute on function public.actualizar_estado_simulacion(
  uuid,
  public.estado_simulacion,
  text
) to authenticated;

create or replace function public.vincular_pedido_a_simulacion(
  id_pedido_input uuid,
  id_simulacion_input uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set id_simulacion = id_simulacion_input,
      updated_at = now()
  where id = id_pedido_input;

  update public.order_items
  set id_simulacion = id_simulacion_input,
      updated_at = now()
  where order_id = id_pedido_input;

  update public.kitchen_tickets
  set id_simulacion = id_simulacion_input
  where order_id = id_pedido_input;

  update public.cash_movements
  set id_simulacion = id_simulacion_input
  where order_id = id_pedido_input;

  update public.inventory_movements
  set id_simulacion = id_simulacion_input
  where order_id = id_pedido_input;

  update public.operational_documents
  set id_simulacion = id_simulacion_input
  where order_id = id_pedido_input;

  update public.audit_logs
  set id_simulacion = id_simulacion_input
  where entity_id = id_pedido_input::text
    or metadata ->> 'orderId' = id_pedido_input::text;

  perform public.registrar_trazabilidad_academica(
    id_simulacion_input,
    'operacion',
    'vincular_pedido',
    'orders',
    id_pedido_input::text,
    null,
    jsonb_build_object('id_simulacion', id_simulacion_input),
    'Pedido operativo vinculado a simulacion academica',
    null
  );
end;
$$;

grant execute on function public.vincular_pedido_a_simulacion(uuid, uuid) to authenticated;

drop view if exists public.reporte_academico_simulacion;

create or replace view public.reporte_academico_simulacion as
with resumen_roles as (
  select id_simulacion, count(distinct id_alumno) as alumnos_asignados
  from public.roles_simulacion
  group by id_simulacion
),
resumen_trazabilidad as (
  select id_simulacion, count(*) as acciones_registradas
  from public.trazabilidad_academica
  group by id_simulacion
),
resumen_operacion as (
  select
    id_simulacion,
    count(*) filter (where status <> 'cancelled') as pedidos_operativos,
    coalesce(sum(total_amount) filter (where status <> 'cancelled'), 0) as venta_operativa_total
  from public.orders
  where id_simulacion is not null
  group by id_simulacion
),
resumen_bodega as (
  select id_simulacion, count(*) as movimientos_bodega
  from public.inventory_movements
  where id_simulacion is not null
  group by id_simulacion
),
resumen_imprevistos as (
  select
    id_simulacion,
    count(*) filter (where estado = 'activo') as imprevistos_activos,
    count(*) as imprevistos_totales
  from public.imprevistos_simulacion
  group by id_simulacion
),
resumen_feedback as (
  select
    id_simulacion,
    count(*) as feedbacks_comensal,
    avg((
      puntuacion_atencion +
      puntuacion_sabor +
      puntuacion_presentacion +
      puntuacion_tiempo +
      puntuacion_limpieza +
      puntuacion_experiencia
    ) / 6.0) as satisfaccion_promedio
  from public.feedback_comensal
  group by id_simulacion
),
resumen_evaluaciones as (
  select id_simulacion, count(*) as respuestas_evaluacion
  from public.respuestas_evaluacion
  where id_simulacion is not null
  group by id_simulacion
)
select
  s.id_simulacion,
  s.nombre_simulacion,
  s.estado,
  c.nombre_clase,
  cu.nombre_curso,
  coalesce(rr.alumnos_asignados, 0) as alumnos_asignados,
  coalesce(rt.acciones_registradas, 0) as acciones_registradas,
  coalesce(ro.pedidos_operativos, 0) as pedidos_operativos,
  coalesce(ro.venta_operativa_total, 0) as venta_operativa_total,
  coalesce(rb.movimientos_bodega, 0) as movimientos_bodega,
  coalesce(ri.imprevistos_activos, 0) as imprevistos_activos,
  coalesce(ri.imprevistos_totales, 0) as imprevistos_totales,
  coalesce(rf.feedbacks_comensal, 0) as feedbacks_comensal,
  rf.satisfaccion_promedio,
  coalesce(re.respuestas_evaluacion, 0) as respuestas_evaluacion
from public.simulaciones s
join public.clases c on c.id_clase = s.id_clase
join public.cursos cu on cu.id_curso = c.id_curso
left join resumen_roles rr on rr.id_simulacion = s.id_simulacion
left join resumen_trazabilidad rt on rt.id_simulacion = s.id_simulacion
left join resumen_operacion ro on ro.id_simulacion = s.id_simulacion
left join resumen_bodega rb on rb.id_simulacion = s.id_simulacion
left join resumen_imprevistos ri on ri.id_simulacion = s.id_simulacion
left join resumen_feedback rf on rf.id_simulacion = s.id_simulacion
left join resumen_evaluaciones re on re.id_simulacion = s.id_simulacion;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'instituciones',
    'perfiles_academicos',
    'cursos',
    'secciones',
    'matriculas',
    'clases',
    'simulaciones',
    'areas_simulacion',
    'grupos_trabajo',
    'integrantes_grupo',
    'roles_simulacion',
    'simulacion_recetas',
    'simulacion_productos',
    'evaluaciones',
    'respuestas_evaluacion',
    'imprevistos_simulacion',
    'feedback_comensal',
    'trazabilidad_academica'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);

    execute format('drop policy if exists "lectura autenticada" on public.%I', target_table);
    execute format(
      'create policy "lectura autenticada" on public.%I for select to authenticated using (true)',
      target_table
    );

    execute format('drop policy if exists "escritura academica" on public.%I', target_table);
    execute format(
      'create policy "escritura academica" on public.%I for all to authenticated using (public.current_academic_role() in (''master'', ''maestro'', ''administrator'', ''administrador'', ''supervisor'', ''profesor'')) with check (public.current_academic_role() in (''master'', ''maestro'', ''administrator'', ''administrador'', ''supervisor'', ''profesor''))',
      target_table
    );
  end loop;
end $$;

drop policy if exists "alumno registra respuesta" on public.respuestas_evaluacion;
create policy "alumno registra respuesta"
on public.respuestas_evaluacion
for insert
to authenticated
with check (
  public.current_academic_role() in ('alumno', 'profesor', 'master', 'maestro', 'administrator', 'administrador', 'supervisor')
);

drop policy if exists "alumno registra trazabilidad" on public.trazabilidad_academica;
create policy "alumno registra trazabilidad"
on public.trazabilidad_academica
for insert
to authenticated
with check (
  public.current_academic_role() in ('alumno', 'profesor', 'master', 'maestro', 'administrator', 'administrador', 'supervisor')
);

drop policy if exists "feedback publico comensal" on public.feedback_comensal;
create policy "feedback publico comensal"
on public.feedback_comensal
for insert
to anon
with check (true);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'instituciones',
    'perfiles_academicos',
    'cursos',
    'secciones',
    'matriculas',
    'clases',
    'simulaciones',
    'areas_simulacion',
    'grupos_trabajo',
    'integrantes_grupo',
    'roles_simulacion',
    'simulacion_recetas',
    'simulacion_productos',
    'evaluaciones',
    'respuestas_evaluacion',
    'imprevistos_simulacion',
    'feedback_comensal',
    'trazabilidad_academica'
  ]
  loop
    execute format('drop policy if exists "lectura anon demo" on public.%I', target_table);
    execute format(
      'create policy "lectura anon demo" on public.%I for select to anon using (true)',
      target_table
    );
  end loop;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'instituciones',
    'perfiles_academicos',
    'cursos',
    'secciones',
    'clases',
    'simulaciones',
    'areas_simulacion',
    'grupos_trabajo',
    'roles_simulacion',
    'evaluaciones',
    'imprevistos_simulacion',
    'simulacion_productos'
  ]
  loop
    execute format('drop trigger if exists set_%I_fecha_actualizacion on public.%I', target_table, target_table);
    execute format(
      'create trigger set_%I_fecha_actualizacion before update on public.%I for each row execute function public.set_fecha_actualizacion()',
      target_table,
      target_table
    );
  end loop;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'instituciones',
    'perfiles_academicos',
    'cursos',
    'secciones',
    'matriculas',
    'clases',
    'simulaciones',
    'areas_simulacion',
    'grupos_trabajo',
    'integrantes_grupo',
    'roles_simulacion',
    'simulacion_recetas',
    'simulacion_productos',
    'evaluaciones',
    'respuestas_evaluacion',
    'imprevistos_simulacion',
    'feedback_comensal',
    'trazabilidad_academica'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    exception when duplicate_object or undefined_object then null;
    end;
  end loop;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'roles',
    'employees',
    'tables',
    'orders',
    'order_items',
    'products',
    'product_categories',
    'recipes',
    'recipe_ingredients',
    'raw_materials',
    'inventory_movements',
    'suppliers',
    'purchases',
    'purchase_items',
    'cash_registers',
    'cash_movements',
    'food_safety_logs',
    'reports',
    'settings',
    'kitchen_tickets'
  ]
  loop
    execute format('drop policy if exists "anon demo read" on public.%I', target_table);
    execute format(
      'create policy "anon demo read" on public.%I for select to anon using (true)',
      target_table
    );
  end loop;
end $$;

do $$
declare
  target_table text;
  roles_clause text;
begin
  roles_clause := '''master'', ''administrator'', ''supervisor''';
  foreach target_table in array array['roles', 'users', 'employees', 'settings']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''supervisor'', ''waiter''';
  foreach target_table in array array['tables']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''supervisor'', ''waiter'', ''cashier'', ''cook'', ''chef''';
  foreach target_table in array array['orders', 'order_items', 'kitchen_tickets', 'operational_documents']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''chef''';
  foreach target_table in array array['products', 'product_categories', 'recipes', 'recipe_ingredients']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''supervisor'', ''chef'', ''warehouse''';
  foreach target_table in array array[
    'raw_materials',
    'inventory_movements',
    'suppliers',
    'purchases',
    'purchase_items',
    'food_safety_logs'
  ]
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''supervisor'', ''cashier''';
  foreach target_table in array array['cash_registers', 'cash_movements']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''supervisor'', ''waiter'', ''cashier''';
  foreach target_table in array array['customers', 'reservations', 'customer_interactions']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  roles_clause := '''master'', ''administrator'', ''supervisor'', ''chef'', ''warehouse'', ''cashier''';
  foreach target_table in array array['reports']
  loop
    execute format('drop policy if exists "manager write" on public.%I', target_table);
    execute format('drop policy if exists "role write" on public.%I', target_table);
    execute format(
      'create policy "role write" on public.%I for all to authenticated using (public.current_app_role() in (%s)) with check (public.current_app_role() in (%s))',
      target_table,
      roles_clause,
      roles_clause
    );
  end loop;

  execute 'drop policy if exists "manager write" on public.audit_logs';
  execute 'drop policy if exists "role write" on public.audit_logs';
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'tables',
    'orders',
    'order_items',
    'kitchen_tickets',
    'products',
    'product_categories',
    'recipes',
    'recipe_ingredients',
    'raw_materials',
    'inventory_movements',
    'food_safety_logs',
    'audit_logs',
    'operational_documents',
    'customers',
    'reservations',
    'customer_interactions',
    'settings',
    'cash_registers',
    'cash_movements',
    'purchases',
    'purchase_items'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    exception when duplicate_object or undefined_object then null;
    end;
  end loop;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'users',
    'employees',
    'suppliers',
    'raw_materials',
    'recipes',
    'products',
    'tables',
    'orders',
    'order_items',
    'customers',
    'reservations',
    'purchases',
    'cash_registers',
    'settings'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', target_table, target_table);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      target_table,
      target_table
    );
  end loop;
end $$;
