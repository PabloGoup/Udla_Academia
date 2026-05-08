create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum (
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

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'user_role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    'anonymous'
  );
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
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);

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
create index if not exists idx_raw_materials_category on public.raw_materials(category);
create index if not exists idx_purchase_items_raw_material_id on public.purchase_items(raw_material_id);
create index if not exists idx_cash_movements_register_id on public.cash_movements(cash_register_id);

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

insert into public.roles (id, name, description, permissions)
values
  ('administrator', 'Administrador', 'Control total del sistema', '["*"]'),
  ('supervisor', 'Supervisor', 'Supervision operativa', '["dashboard:read","tables:manage","orders:manage","kitchen:manage","cash:manage","inventory:manage","reports:read","food-safety:manage","employees:manage","education:read"]'),
  ('cashier', 'Cajero', 'Caja y pagos', '["dashboard:read","orders:manage","cash:manage","reports:read","education:read"]'),
  ('waiter', 'Mesero', 'Salon y pedidos', '["dashboard:read","tables:manage","orders:manage","education:read"]'),
  ('cook', 'Cocinero', 'Comandas de cocina', '["dashboard:read","kitchen:manage","education:read"]'),
  ('chef', 'Jefe de cocina', 'Recetas, cocina e inventario', '["dashboard:read","kitchen:manage","products:manage","recipes:manage","inventory:manage","food-safety:manage","reports:read","education:read"]'),
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
    'food_safety_logs',
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
    'food_safety_logs',
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
      'create policy "manager write" on public.%I for all to authenticated using (public.current_app_role() in (''administrator'', ''supervisor'', ''chef'', ''warehouse'', ''cashier'', ''waiter'', ''cook'')) with check (public.current_app_role() in (''administrator'', ''supervisor'', ''chef'', ''warehouse'', ''cashier'', ''waiter'', ''cook''))',
      target_table
    );
  end loop;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.tables';
exception when duplicate_object or undefined_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.orders';
exception when duplicate_object or undefined_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.order_items';
exception when duplicate_object or undefined_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.kitchen_tickets';
exception when duplicate_object or undefined_object then null;
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

