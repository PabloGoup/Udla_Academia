insert into public.suppliers (
  id, name, category, contact_name, phone, reliability_score
) values
  ('00000000-0000-4000-8000-000000000001', 'Carnes Andinas', 'Carnes', 'Marcela Rivas', '+56 9 4422 7811', 96),
  ('00000000-0000-4000-8000-000000000002', 'Costa Azul', 'Pescados y mariscos', 'Ruben Soto', '+56 9 5520 1140', 91),
  ('00000000-0000-4000-8000-000000000003', 'Huerta Local', 'Verduras y frutas', 'Daniela Mena', '+56 9 6711 9300', 94),
  ('00000000-0000-4000-8000-000000000004', 'Secos del Sur', 'Abarrotes', 'Ignacio Palma', '+56 9 3188 2018', 89)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  contact_name = excluded.contact_name,
  phone = excluded.phone,
  reliability_score = excluded.reliability_score;

insert into public.employees (
  id, role_id, full_name, rut, phone, shift, hourly_cost, status, hired_at
) values
  ('00000000-0000-4100-8000-000000000001', 'administrator', 'Paula Contreras', '12.345.678-5', '+56 9 7000 1101', 'Administracion', 11500, 'active', '2024-03-01'),
  ('00000000-0000-4100-8000-000000000002', 'chef', 'Rodrigo Fuentes', '13.222.111-9', '+56 9 7000 1102', 'Cocina AM', 9800, 'active', '2024-04-15'),
  ('00000000-0000-4100-8000-000000000003', 'waiter', 'Valentina Reyes', '18.445.120-2', '+56 9 7000 1103', 'Salon AM', 5200, 'active', '2025-01-10'),
  ('00000000-0000-4100-8000-000000000004', 'waiter', 'Camila Soto', '19.002.441-7', '+56 9 7000 1104', 'Salon AM', 5200, 'break', '2025-02-03'),
  ('00000000-0000-4100-8000-000000000005', 'cashier', 'Felipe Araya', '16.778.901-3', '+56 9 7000 1105', 'Caja AM', 6100, 'active', '2024-11-20'),
  ('00000000-0000-4100-8000-000000000006', 'warehouse', 'Daniel Vega', '15.994.200-8', '+56 9 7000 1106', 'Bodega', 6400, 'active', '2024-08-05')
on conflict (id) do update set
  role_id = excluded.role_id,
  full_name = excluded.full_name,
  rut = excluded.rut,
  phone = excluded.phone,
  shift = excluded.shift,
  hourly_cost = excluded.hourly_cost,
  status = excluded.status,
  hired_at = excluded.hired_at;

insert into public.product_categories (
  id, name, color, sort_order
) values
  ('00000000-0000-4200-8000-000000000001', 'Fondos', 'bg-red-500', 10),
  ('00000000-0000-4200-8000-000000000002', 'Entradas', 'bg-emerald-500', 20),
  ('00000000-0000-4200-8000-000000000003', 'Postres', 'bg-fuchsia-500', 30),
  ('00000000-0000-4200-8000-000000000004', 'Barra', 'bg-cyan-500', 40)
on conflict (id) do update set
  name = excluded.name,
  color = excluded.color,
  sort_order = excluded.sort_order;

insert into public.raw_materials (
  id, name, category, unit, supplier_id, purchase_quantity, purchase_cost,
  stock_quantity, min_stock_quantity, average_yield_percent,
  storage_temperature, storage_method, expiration_date, lot, sanitary_risk,
  storage_notes
) values
  (
    '00000000-0000-4300-8000-000000000001', 'Lomo de vacuno', 'meats', 'g',
    '00000000-0000-4000-8000-000000000001', 1000, 10000, 7200, 3000, 70,
    '0 a 4 C', 'FIFO', '2026-05-12', 'CAR-0508-A', 'high',
    'Mantener en bandeja cubierta, separado de listos para consumo.'
  ),
  (
    '00000000-0000-4300-8000-000000000002', 'Salmon fresco', 'seafood', 'g',
    '00000000-0000-4000-8000-000000000002', 1000, 12800, 3600, 2500, 78,
    '0 a 2 C', 'FIFO', '2026-05-10', 'PES-0508-S', 'high',
    'Usar antes de 48 horas, bandeja con drenaje.'
  ),
  (
    '00000000-0000-4300-8000-000000000003', 'Camaron 36/40', 'frozen', 'g',
    '00000000-0000-4000-8000-000000000002', 1000, 9400, 5000, 1800, 82,
    '-18 C', 'FIFO', '2026-08-20', 'CON-0428-C', 'medium',
    'Descongelar en refrigeracion, nunca a temperatura ambiente.'
  ),
  (
    '00000000-0000-4300-8000-000000000004', 'Cebolla morada', 'produce', 'g',
    '00000000-0000-4000-8000-000000000003', 1000, 1450, 9200, 2500, 88,
    '8 a 12 C', 'FIFO', '2026-05-18', 'VER-0508-C', 'low',
    'Seco, ventilado, sin contacto con humedad.'
  ),
  (
    '00000000-0000-4300-8000-000000000005', 'Palta hass', 'produce', 'g',
    '00000000-0000-4000-8000-000000000003', 1000, 4200, 2600, 2000, 64,
    '6 a 8 C', 'FIFO', '2026-05-11', 'VER-0508-P', 'medium',
    'Controlar madurez diariamente.'
  ),
  (
    '00000000-0000-4300-8000-000000000006', 'Queso mantecoso', 'dairy', 'g',
    '00000000-0000-4000-8000-000000000004', 1000, 6200, 4200, 1800, 96,
    '0 a 4 C', 'FIFO', '2026-05-22', 'LAC-0504-Q', 'medium',
    'Conservar cerrado y rotulado despues de abrir.'
  ),
  (
    '00000000-0000-4300-8000-000000000007', 'Arroz grano largo', 'dry', 'g',
    '00000000-0000-4000-8000-000000000004', 1000, 1320, 18000, 5000, 100,
    'Ambiente seco', 'FIFO', '2027-01-20', 'SEC-0420-A', 'low',
    'Mantener en contenedor hermetico rotulado.'
  ),
  (
    '00000000-0000-4300-8000-000000000008', 'Crema de leche', 'dairy', 'ml',
    '00000000-0000-4000-8000-000000000004', 1000, 3100, 3500, 1500, 98,
    '0 a 4 C', 'FIFO', '2026-05-14', 'LAC-0507-C', 'medium',
    'Cerrar inmediatamente despues de uso.'
  ),
  (
    '00000000-0000-4300-8000-000000000009', 'Harina panadera', 'allergens', 'g',
    '00000000-0000-4000-8000-000000000004', 1000, 980, 15000, 4000, 99,
    'Ambiente seco', 'FIFO', '2026-10-01', 'ALG-0411-H', 'low',
    'Almacenar separado y rotulado como gluten.'
  )
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  supplier_id = excluded.supplier_id,
  purchase_quantity = excluded.purchase_quantity,
  purchase_cost = excluded.purchase_cost,
  stock_quantity = excluded.stock_quantity,
  min_stock_quantity = excluded.min_stock_quantity,
  average_yield_percent = excluded.average_yield_percent,
  storage_temperature = excluded.storage_temperature,
  storage_method = excluded.storage_method,
  expiration_date = excluded.expiration_date,
  lot = excluded.lot,
  sanitary_risk = excluded.sanitary_risk,
  storage_notes = excluded.storage_notes;

insert into public.inventory_movements (
  id, raw_material_id, movement_type, quantity, unit_cost, reason, responsible_id, created_at
) values
  (
    '00000000-0000-4d00-8000-000000000001',
    '00000000-0000-4300-8000-000000000001',
    'initial',
    7200,
    14.2857,
    'Stock inicial academico',
    '00000000-0000-4100-8000-000000000006',
    now() - interval '5 hours'
  ),
  (
    '00000000-0000-4d00-8000-000000000002',
    '00000000-0000-4300-8000-000000000005',
    'waste',
    -320,
    6.5625,
    'Madurez avanzada',
    '00000000-0000-4100-8000-000000000006',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-4d00-8000-000000000003',
    '00000000-0000-4300-8000-000000000002',
    'manual_out',
    -420,
    16.4103,
    'Mise en place cocina fria',
    '00000000-0000-4100-8000-000000000002',
    now() - interval '105 minutes'
  )
on conflict (id) do update set
  raw_material_id = excluded.raw_material_id,
  movement_type = excluded.movement_type,
  quantity = excluded.quantity,
  unit_cost = excluded.unit_cost,
  reason = excluded.reason,
  responsible_id = excluded.responsible_id,
  created_at = excluded.created_at;

insert into public.food_safety_logs (
  id, raw_material_id, check_type, measured_temperature, result, notes, responsible_id, created_at
) values
  (
    '00000000-0000-4f00-8000-000000000001',
    '00000000-0000-4300-8000-000000000002',
    'Temperatura de recepcion',
    '1.8 C',
    'ok',
    'Producto recibido frio, bandeja con drenaje y rotulo vigente.',
    '00000000-0000-4100-8000-000000000006',
    now() - interval '90 minutes'
  ),
  (
    '00000000-0000-4f00-8000-000000000002',
    '00000000-0000-4300-8000-000000000005',
    'Control de vencimiento',
    '7 C',
    'warning',
    'Madurez avanzada. Priorizar uso en mise en place de hoy.',
    '00000000-0000-4100-8000-000000000002',
    now() - interval '55 minutes'
  ),
  (
    '00000000-0000-4f00-8000-000000000003',
    '00000000-0000-4300-8000-000000000009',
    'Alergenos y separacion',
    'Ambiente seco',
    'ok',
    'Contenedor cerrado, separado y rotulado como gluten.',
    '00000000-0000-4100-8000-000000000006',
    now() - interval '30 minutes'
  )
on conflict (id) do update set
  raw_material_id = excluded.raw_material_id,
  check_type = excluded.check_type,
  measured_temperature = excluded.measured_temperature,
  result = excluded.result,
  notes = excluded.notes,
  responsible_id = excluded.responsible_id,
  created_at = excluded.created_at;

insert into public.recipes (
  id, name, category, portions, prep_time_minutes, photo_url,
  procedure, allergens, observations, target_food_cost_percent,
  created_by
) values
  (
    '00000000-0000-4400-8000-000000000001',
    'Lomo salteado de la casa',
    'Fondo caliente',
    4,
    22,
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
    'Limpiar lomo, cortar en bastones, sellar a alta temperatura, saltear vegetales y montar con arroz.',
    array['Soya', 'Gluten'],
    'Controlar punto de coccion y no sobrecargar el sarten.',
    30,
    '00000000-0000-4100-8000-000000000002'
  ),
  (
    '00000000-0000-4400-8000-000000000002',
    'Salmon grillado con crema citrica',
    'Fondo pescado',
    3,
    18,
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
    'Porcionar salmon, grillar por piel, reducir crema citrica y servir con vegetales.',
    array['Pescado', 'Lacteos'],
    'Mantener cadena de frio y controlar coccion.',
    32,
    '00000000-0000-4100-8000-000000000002'
  ),
  (
    '00000000-0000-4400-8000-000000000003',
    'Causa fria de camaron y palta',
    'Entrada fria',
    6,
    16,
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
    'Cocer base, prensar, montar con camaron descongelado en frio y palta laminada.',
    array['Mariscos'],
    'Mantener en frio hasta servicio y registrar lote.',
    28,
    '00000000-0000-4100-8000-000000000002'
  )
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  portions = excluded.portions,
  prep_time_minutes = excluded.prep_time_minutes,
  photo_url = excluded.photo_url,
  procedure = excluded.procedure,
  allergens = excluded.allergens,
  observations = excluded.observations,
  target_food_cost_percent = excluded.target_food_cost_percent,
  created_by = excluded.created_by;

insert into public.recipe_ingredients (
  id, recipe_id, raw_material_id, unit, gross_quantity, yield_percent, waste_type
) values
  ('00000000-0000-4500-8000-000000000001', '00000000-0000-4400-8000-000000000001', '00000000-0000-4300-8000-000000000001', 'g', 860, 70, 'Limpieza y despunte'),
  ('00000000-0000-4500-8000-000000000002', '00000000-0000-4400-8000-000000000001', '00000000-0000-4300-8000-000000000004', 'g', 240, 88, 'Piel y raiz'),
  ('00000000-0000-4500-8000-000000000003', '00000000-0000-4400-8000-000000000001', '00000000-0000-4300-8000-000000000007', 'g', 420, 100, 'Sin merma'),
  ('00000000-0000-4500-8000-000000000004', '00000000-0000-4400-8000-000000000002', '00000000-0000-4300-8000-000000000002', 'g', 640, 78, 'Piel, espinas y recorte'),
  ('00000000-0000-4500-8000-000000000005', '00000000-0000-4400-8000-000000000002', '00000000-0000-4300-8000-000000000008', 'ml', 280, 92, 'Reduccion por evaporacion'),
  ('00000000-0000-4500-8000-000000000006', '00000000-0000-4400-8000-000000000003', '00000000-0000-4300-8000-000000000003', 'g', 520, 82, 'Glaseo y descongelado'),
  ('00000000-0000-4500-8000-000000000007', '00000000-0000-4400-8000-000000000003', '00000000-0000-4300-8000-000000000005', 'g', 460, 64, 'Carozo y cascara')
on conflict (id) do update set
  recipe_id = excluded.recipe_id,
  raw_material_id = excluded.raw_material_id,
  unit = excluded.unit,
  gross_quantity = excluded.gross_quantity,
  yield_percent = excluded.yield_percent,
  waste_type = excluded.waste_type;

insert into public.products (
  id, category_id, recipe_id, name, description, image_url,
  sale_price, is_available, prep_time_minutes, customization_options
) values
  (
    '00000000-0000-4600-8000-000000000001',
    '00000000-0000-4200-8000-000000000001',
    '00000000-0000-4400-8000-000000000001',
    'Lomo salteado',
    'Lomo, arroz, cebolla morada, salsa de la casa.',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
    14900,
    true,
    22,
    '["Sin cebolla", "Punto medio", "Bien cocido", "Extra queso"]'
  ),
  (
    '00000000-0000-4600-8000-000000000002',
    '00000000-0000-4200-8000-000000000001',
    '00000000-0000-4400-8000-000000000002',
    'Salmon grillado',
    'Salmon fresco, crema citrica y vegetales.',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
    16900,
    true,
    18,
    '["Sin lacteos", "Punto jugoso", "Punto cocido"]'
  ),
  (
    '00000000-0000-4600-8000-000000000003',
    '00000000-0000-4200-8000-000000000002',
    '00000000-0000-4400-8000-000000000003',
    'Causa camaron palta',
    'Entrada fria con camaron, palta y base especiada.',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
    8900,
    true,
    16,
    '["Sin palta", "Extra camaron", "Sin picante"]'
  ),
  (
    '00000000-0000-4600-8000-000000000004',
    '00000000-0000-4200-8000-000000000002',
    null,
    'Tabla caliente',
    'Porciones para compartir, salsas y panes.',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    18900,
    false,
    25,
    '["Sin gluten", "Extra salsa", "Sin queso"]'
  ),
  (
    '00000000-0000-4600-8000-000000000005',
    '00000000-0000-4200-8000-000000000004',
    null,
    'Jugo natural',
    'Fruta fresca de temporada.',
    'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80',
    3900,
    true,
    5,
    '["Sin azucar", "Con hielo", "Sin hielo"]'
  )
on conflict (id) do update set
  category_id = excluded.category_id,
  recipe_id = excluded.recipe_id,
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sale_price = excluded.sale_price,
  is_available = excluded.is_available,
  prep_time_minutes = excluded.prep_time_minutes,
  customization_options = excluded.customization_options;

insert into public.tables (
  id, number, seats, zone, status
) values
  ('00000000-0000-4700-8000-000000000001', 1, 2, 'Terraza', 'free'),
  ('00000000-0000-4700-8000-000000000002', 2, 4, 'Terraza', 'occupied'),
  ('00000000-0000-4700-8000-000000000003', 3, 6, 'Salon', 'reserved'),
  ('00000000-0000-4700-8000-000000000004', 4, 4, 'Salon', 'occupied'),
  ('00000000-0000-4700-8000-000000000005', 5, 2, 'Salon', 'cleaning'),
  ('00000000-0000-4700-8000-000000000006', 6, 8, 'Comedor', 'free'),
  ('00000000-0000-4700-8000-000000000007', 7, 4, 'Comedor', 'occupied'),
  ('00000000-0000-4700-8000-000000000008', 8, 4, 'Comedor', 'free'),
  ('00000000-0000-4700-8000-000000000009', 9, 2, 'Barra', 'reserved'),
  ('00000000-0000-4700-8000-000000000010', 10, 4, 'Barra', 'free'),
  ('00000000-0000-4700-8000-000000000011', 11, 6, 'Salon', 'free'),
  ('00000000-0000-4700-8000-000000000012', 12, 2, 'Salon', 'occupied')
on conflict (id) do update set
  number = excluded.number,
  seats = excluded.seats,
  zone = excluded.zone,
  status = excluded.status;

insert into public.customers (
  id, full_name, phone, email, document_id, preferences, allergies, tags,
  visit_count, total_spent, last_visit_at, notes
) values
  (
    '00000000-0000-5100-8000-000000000001',
    'Carolina Munoz',
    '+56 9 8111 2001',
    'carolina.munoz@example.com',
    '17.440.221-5',
    'Prefiere terraza, vinos blancos y platos sin lacteos.',
    array['Lacteos'],
    array['Frecuente', 'Cumpleanos'],
    8,
    426800,
    now() - interval '7 days',
    'Solicitar confirmacion por WhatsApp el mismo dia.'
  ),
  (
    '00000000-0000-5100-8000-000000000002',
    'Andres Salinas',
    '+56 9 8222 2002',
    'andres.salinas@example.com',
    '14.202.118-0',
    'Mesa tranquila, sin picante, agua sin gas.',
    array['Mariscos'],
    array['Alergia declarada', 'Empresa'],
    4,
    281500,
    now() - interval '11 days',
    'Registrar alerta de alergia en comandas.'
  ),
  (
    '00000000-0000-5100-8000-000000000003',
    'Isidora Paredes',
    '+56 9 8333 2003',
    'isidora.paredes@example.com',
    '20.341.908-6',
    'Celebraciones pequenas, postres para compartir.',
    array[]::text[],
    array['Reserva web', 'Familia'],
    2,
    137900,
    now() - interval '28 days',
    'Prefiere confirmacion por email.'
  ),
  (
    '00000000-0000-5100-8000-000000000004',
    'Matias Vergara',
    '+56 9 8444 2004',
    'matias.vergara@example.com',
    '16.902.118-4',
    'Barra, jugos naturales, opciones vegetarianas.',
    array[]::text[],
    array['Nuevo', 'Barra'],
    1,
    38900,
    now() - interval '1 day',
    'Invitar a programa de fidelizacion.'
  )
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  document_id = excluded.document_id,
  preferences = excluded.preferences,
  allergies = excluded.allergies,
  tags = excluded.tags,
  visit_count = excluded.visit_count,
  total_spent = excluded.total_spent,
  last_visit_at = excluded.last_visit_at,
  notes = excluded.notes;

insert into public.reservations (
  id, customer_id, table_id, assigned_to, created_by, reservation_date,
  reservation_time, party_size, status, channel, occasion, notes, created_at
) values
  (
    '00000000-0000-5200-8000-000000000001',
    '00000000-0000-5100-8000-000000000001',
    '00000000-0000-4700-8000-000000000003',
    '00000000-0000-4100-8000-000000000003',
    '00000000-0000-4100-8000-000000000003',
    '2026-05-10',
    '20:30',
    6,
    'confirmed',
    'whatsapp',
    'Cumpleanos',
    'Preparar mesa con espacio para torta. Sin lacteos.',
    now() - interval '3 hours'
  ),
  (
    '00000000-0000-5200-8000-000000000002',
    '00000000-0000-5100-8000-000000000002',
    '00000000-0000-4700-8000-000000000009',
    '00000000-0000-4100-8000-000000000004',
    '00000000-0000-4100-8000-000000000004',
    '2026-05-10',
    '13:45',
    2,
    'seated',
    'phone',
    'Almuerzo empresa',
    'Alergia a mariscos. Confirmar con cocina antes de enviar.',
    now() - interval '4 hours'
  ),
  (
    '00000000-0000-5200-8000-000000000003',
    '00000000-0000-5100-8000-000000000003',
    '00000000-0000-4700-8000-000000000011',
    '00000000-0000-4100-8000-000000000003',
    '00000000-0000-4100-8000-000000000003',
    '2026-05-11',
    '21:00',
    5,
    'pending',
    'web',
    'Cena familiar',
    'Pendiente confirmar asistencia antes de las 17:00.',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-5200-8000-000000000004',
    '00000000-0000-5100-8000-000000000004',
    '00000000-0000-4700-8000-000000000010',
    '00000000-0000-4100-8000-000000000005',
    '00000000-0000-4100-8000-000000000005',
    '2026-05-10',
    '19:00',
    2,
    'cancelled',
    'walk_in',
    'Sin ocasion',
    'Cancelada por cambio de horario.',
    now() - interval '1 hour'
  )
on conflict (id) do update set
  customer_id = excluded.customer_id,
  table_id = excluded.table_id,
  assigned_to = excluded.assigned_to,
  created_by = excluded.created_by,
  reservation_date = excluded.reservation_date,
  reservation_time = excluded.reservation_time,
  party_size = excluded.party_size,
  status = excluded.status,
  channel = excluded.channel,
  occasion = excluded.occasion,
  notes = excluded.notes,
  created_at = excluded.created_at;

insert into public.customer_interactions (
  id, customer_id, interaction_type, summary, due_at, completed_at, responsible_id, created_at
) values
  (
    '00000000-0000-5300-8000-000000000001',
    '00000000-0000-5100-8000-000000000001',
    'message',
    'Confirmacion enviada por WhatsApp para reserva de cumpleanos.',
    null,
    now() - interval '90 minutes',
    '00000000-0000-4100-8000-000000000003',
    now() - interval '90 minutes'
  ),
  (
    '00000000-0000-5300-8000-000000000002',
    '00000000-0000-5100-8000-000000000002',
    'preference',
    'Se reforzo alerta de alergia a mariscos en ficha y reserva.',
    null,
    now() - interval '4 hours',
    '00000000-0000-4100-8000-000000000004',
    now() - interval '4 hours'
  ),
  (
    '00000000-0000-5300-8000-000000000003',
    '00000000-0000-5100-8000-000000000003',
    'follow_up',
    'Confirmar asistencia y cantidad final de comensales.',
    '2026-05-11 17:00:00-04',
    null,
    '00000000-0000-4100-8000-000000000003',
    now() - interval '2 hours'
  )
on conflict (id) do update set
  customer_id = excluded.customer_id,
  interaction_type = excluded.interaction_type,
  summary = excluded.summary,
  due_at = excluded.due_at,
  completed_at = excluded.completed_at,
  responsible_id = excluded.responsible_id,
  created_at = excluded.created_at;

insert into public.orders (
  id, order_number, table_id, waiter_id, status,
  subtotal, discount_amount, tip_amount, total_amount, created_at
) values
  ('00000000-0000-4800-8000-000000000001', 'A-1048', '00000000-0000-4700-8000-000000000002', '00000000-0000-4100-8000-000000000003', 'preparing', 42600, 0, 4260, 42600, now() - interval '26 minutes'),
  ('00000000-0000-4800-8000-000000000002', 'A-1049', '00000000-0000-4700-8000-000000000004', '00000000-0000-4100-8000-000000000004', 'pending', 35300, 1500, 3380, 33800, now() - interval '14 minutes'),
  ('00000000-0000-4800-8000-000000000003', 'A-1050', '00000000-0000-4700-8000-000000000007', '00000000-0000-4100-8000-000000000003', 'ready', 57200, 0, 5720, 57200, now() - interval '38 minutes'),
  ('00000000-0000-4800-8000-000000000004', 'A-1051', '00000000-0000-4700-8000-000000000012', '00000000-0000-4100-8000-000000000004', 'pending', 23800, 0, 2380, 23800, now() - interval '8 minutes')
on conflict (id) do update set
  order_number = excluded.order_number,
  table_id = excluded.table_id,
  waiter_id = excluded.waiter_id,
  status = excluded.status,
  subtotal = excluded.subtotal,
  discount_amount = excluded.discount_amount,
  tip_amount = excluded.tip_amount,
  total_amount = excluded.total_amount,
  created_at = excluded.created_at;

insert into public.order_items (
  id, order_id, product_id, product_name, quantity, unit_price,
  modifiers, observations, station, status
) values
  ('00000000-0000-4900-8000-000000000001', '00000000-0000-4800-8000-000000000001', '00000000-0000-4600-8000-000000000001', 'Lomo salteado', 2, 14900, '["Punto medio", "Sin cebolla"]', 'Mesa apurada, enviar fondos juntos.', 'hot', 'preparing'),
  ('00000000-0000-4900-8000-000000000002', '00000000-0000-4800-8000-000000000001', '00000000-0000-4600-8000-000000000005', 'Jugo natural', 2, 3900, '["Sin azucar"]', '', 'bar', 'preparing'),
  ('00000000-0000-4900-8000-000000000003', '00000000-0000-4800-8000-000000000002', '00000000-0000-4600-8000-000000000002', 'Salmon grillado', 2, 16900, '["Punto jugoso"]', 'Uno sin salsa sobre el plato.', 'hot', 'pending'),
  ('00000000-0000-4900-8000-000000000004', '00000000-0000-4800-8000-000000000003', '00000000-0000-4600-8000-000000000003', 'Causa camaron palta', 4, 8900, '["Extra camaron"]', '', 'cold', 'ready'),
  ('00000000-0000-4900-8000-000000000005', '00000000-0000-4800-8000-000000000003', '00000000-0000-4600-8000-000000000005', 'Jugo natural', 4, 3900, '["Con hielo"]', '', 'bar', 'ready'),
  ('00000000-0000-4900-8000-000000000006', '00000000-0000-4800-8000-000000000004', '00000000-0000-4600-8000-000000000001', 'Lomo salteado', 1, 14900, '["Bien cocido", "Extra queso"]', 'Alergia declarada a mariscos.', 'hot', 'pending'),
  ('00000000-0000-4900-8000-000000000007', '00000000-0000-4800-8000-000000000004', '00000000-0000-4600-8000-000000000003', 'Causa camaron palta', 1, 8900, '["Sin palta"]', '', 'cold', 'pending')
on conflict (id) do update set
  order_id = excluded.order_id,
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  modifiers = excluded.modifiers,
  observations = excluded.observations,
  station = excluded.station,
  status = excluded.status;

update public.tables
set current_order_id = case number
  when 2 then '00000000-0000-4800-8000-000000000001'::uuid
  when 4 then '00000000-0000-4800-8000-000000000002'::uuid
  when 7 then '00000000-0000-4800-8000-000000000003'::uuid
  when 12 then '00000000-0000-4800-8000-000000000004'::uuid
  else null
end
where id between '00000000-0000-4700-8000-000000000001'::uuid
  and '00000000-0000-4700-8000-000000000012'::uuid;

insert into public.purchases (
  id, supplier_id, document_type, document_number, purchase_date,
  subtotal, tax_amount, total_amount, status, received_by
) values
  ('00000000-0000-4a00-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'invoice', 'F-88219', '2026-05-07', 154622, 29378, 184000, 'received', '00000000-0000-4100-8000-000000000006'),
  ('00000000-0000-4a00-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'invoice', 'F-22018', '2026-05-08', 120672, 22928, 143600, 'priced', '00000000-0000-4100-8000-000000000006'),
  ('00000000-0000-4a00-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'receipt', 'B-5518', '2026-05-08', 48600, 0, 48600, 'received', '00000000-0000-4100-8000-000000000006')
on conflict (id) do update set
  supplier_id = excluded.supplier_id,
  document_type = excluded.document_type,
  document_number = excluded.document_number,
  purchase_date = excluded.purchase_date,
  subtotal = excluded.subtotal,
  tax_amount = excluded.tax_amount,
  total_amount = excluded.total_amount,
  status = excluded.status,
  received_by = excluded.received_by;

insert into public.purchase_items (
  id, purchase_id, raw_material_id, description, quantity, unit, unit_cost,
  yield_percent, expiration_date, lot
) values
  (
    '00000000-0000-4e00-8000-000000000001',
    '00000000-0000-4a00-8000-000000000001',
    '00000000-0000-4300-8000-000000000001',
    'Lomo de vacuno caja AM',
    12000,
    'g',
    15.3333,
    70,
    '2026-05-12',
    'CAR-0508-A'
  ),
  (
    '00000000-0000-4e00-8000-000000000002',
    '00000000-0000-4a00-8000-000000000002',
    '00000000-0000-4300-8000-000000000002',
    'Salmon fresco filete',
    9000,
    'g',
    15.9556,
    78,
    '2026-05-10',
    'PES-0508-S'
  ),
  (
    '00000000-0000-4e00-8000-000000000003',
    '00000000-0000-4a00-8000-000000000003',
    '00000000-0000-4300-8000-000000000005',
    'Palta hass malla',
    11571,
    'g',
    4.2002,
    64,
    '2026-05-11',
    'VER-0508-P'
  )
on conflict (id) do update set
  purchase_id = excluded.purchase_id,
  raw_material_id = excluded.raw_material_id,
  description = excluded.description,
  quantity = excluded.quantity,
  unit = excluded.unit,
  unit_cost = excluded.unit_cost,
  yield_percent = excluded.yield_percent,
  expiration_date = excluded.expiration_date,
  lot = excluded.lot;

insert into public.cash_registers (
  id, opened_by, opening_amount, expected_amount, status
) values
  ('00000000-0000-4b00-8000-000000000001', '00000000-0000-4100-8000-000000000005', 120000, 277200, 'open')
on conflict (id) do update set
  opened_by = excluded.opened_by,
  opening_amount = excluded.opening_amount,
  expected_amount = excluded.expected_amount,
  status = excluded.status;

insert into public.cash_movements (
  id, cash_register_id, order_id, movement_type, payment_method,
  amount, description, responsible_id, created_at
) values
  ('00000000-0000-4c00-8000-000000000001', '00000000-0000-4b00-8000-000000000001', null, 'opening', null, 120000, 'Apertura turno AM', '00000000-0000-4100-8000-000000000005', now() - interval '5 hours'),
  ('00000000-0000-4c00-8000-000000000002', '00000000-0000-4b00-8000-000000000001', '00000000-0000-4800-8000-000000000003', 'sale', 'debit', 57200, 'Pago mesa 7', '00000000-0000-4100-8000-000000000005', now() - interval '25 minutes'),
  ('00000000-0000-4c00-8000-000000000003', '00000000-0000-4b00-8000-000000000001', '00000000-0000-4800-8000-000000000003', 'tip', 'debit', 5720, 'Propina mesa 7', '00000000-0000-4100-8000-000000000005', now() - interval '25 minutes'),
  ('00000000-0000-4c00-8000-000000000004', '00000000-0000-4b00-8000-000000000001', null, 'withdrawal', 'cash', -20000, 'Retiro caja chica', '00000000-0000-4100-8000-000000000001', now() - interval '12 minutes'),
  ('00000000-0000-4c00-8000-000000000005', '00000000-0000-4b00-8000-000000000001', null, 'advance', 'cash', -15000, 'Adelanto autorizado', '00000000-0000-4100-8000-000000000001', now() - interval '7 minutes')
on conflict (id) do update set
  cash_register_id = excluded.cash_register_id,
  order_id = excluded.order_id,
  movement_type = excluded.movement_type,
  payment_method = excluded.payment_method,
  amount = excluded.amount,
  description = excluded.description,
  responsible_id = excluded.responsible_id,
  created_at = excluded.created_at;

insert into public.operational_documents (
  id, document_type, title, order_id, cash_register_id, reservation_id,
  payload, printed_by, printed_at, created_at
) values
  (
    '00000000-0000-5400-8000-000000000001',
    'kitchen_ticket',
    'Comanda cocina A-1048',
    '00000000-0000-4800-8000-000000000001',
    null,
    null,
    '{"station":"hot","table":2,"items":["2x Lomo salteado","2x Jugo natural"],"notes":"Mesa apurada, enviar fondos juntos."}'::jsonb,
    '00000000-0000-4100-8000-000000000003',
    now() - interval '31 minutes',
    now() - interval '31 minutes'
  ),
  (
    '00000000-0000-5400-8000-000000000002',
    'table_prebill',
    'Pre-cuenta mesa 7',
    '00000000-0000-4800-8000-000000000003',
    null,
    null,
    '{"table":7,"subtotal":57200,"tip":5720,"total":57200,"items":["4x Causa camaron palta","4x Jugo natural"]}'::jsonb,
    '00000000-0000-4100-8000-000000000005',
    now() - interval '29 minutes',
    now() - interval '29 minutes'
  ),
  (
    '00000000-0000-5400-8000-000000000003',
    'payment_receipt',
    'Comprobante pago A-1050',
    '00000000-0000-4800-8000-000000000003',
    '00000000-0000-4b00-8000-000000000001',
    null,
    '{"paymentMethod":"debit","amount":57200,"tip":5720,"cashier":"Felipe Araya"}'::jsonb,
    '00000000-0000-4100-8000-000000000005',
    now() - interval '25 minutes',
    now() - interval '25 minutes'
  ),
  (
    '00000000-0000-5400-8000-000000000004',
    'reservation_sheet',
    'Ficha reserva Carolina Munoz',
    null,
    null,
    '00000000-0000-5200-8000-000000000001',
    '{"customer":"Carolina Munoz","table":3,"time":"20:30","partySize":6,"allergies":["Lacteos"]}'::jsonb,
    '00000000-0000-4100-8000-000000000003',
    now() - interval '20 minutes',
    now() - interval '20 minutes'
  )
on conflict (id) do update set
  document_type = excluded.document_type,
  title = excluded.title,
  order_id = excluded.order_id,
  cash_register_id = excluded.cash_register_id,
  reservation_id = excluded.reservation_id,
  payload = excluded.payload,
  printed_by = excluded.printed_by,
  printed_at = excluded.printed_at,
  created_at = excluded.created_at;

insert into public.instituciones (
  id_institucion, nombre_institucion, rut_institucion, sede, direccion, estado
) values (
  '00000000-0000-6100-8000-000000000001',
  'Universidad de Las Americas',
  '71.540.800-7',
  'Campus Santiago Centro',
  'Laboratorio gastronomico UDLA',
  'activa'
)
on conflict (id_institucion) do update set
  nombre_institucion = excluded.nombre_institucion,
  rut_institucion = excluded.rut_institucion,
  sede = excluded.sede,
  direccion = excluded.direccion,
  estado = excluded.estado;

insert into public.perfiles_academicos (
  id_perfil, id_institucion, nombre_completo, correo, rol_academico,
  identificador_institucional, seccion, estado
) values
  (
    '00000000-0000-6200-8000-000000000001',
    '00000000-0000-6100-8000-000000000001',
    'Rodrigo Fuentes',
    'rodrigo.fuentes@udla.cl',
    'profesor',
    'DOC-001',
    null,
    'activo'
  ),
  (
    '00000000-0000-6200-8000-000000000002',
    '00000000-0000-6100-8000-000000000001',
    'Valentina Reyes',
    'valentina.reyes@alumnos.udla.cl',
    'alumno',
    'ALU-24001',
    'RC24',
    'activo'
  ),
  (
    '00000000-0000-6200-8000-000000000003',
    '00000000-0000-6100-8000-000000000001',
    'Camila Soto',
    'camila.soto@alumnos.udla.cl',
    'alumno',
    'ALU-24002',
    'RC24',
    'activo'
  ),
  (
    '00000000-0000-6200-8000-000000000004',
    '00000000-0000-6100-8000-000000000001',
    'Felipe Araya',
    'felipe.araya@alumnos.udla.cl',
    'alumno',
    'ALU-24003',
    'RC24',
    'activo'
  ),
  (
    '00000000-0000-6200-8000-000000000005',
    '00000000-0000-6100-8000-000000000001',
    'Daniel Vega',
    'daniel.vega@alumnos.udla.cl',
    'alumno',
    'ALU-24004',
    'RC24',
    'activo'
  )
on conflict (id_perfil) do update set
  id_institucion = excluded.id_institucion,
  nombre_completo = excluded.nombre_completo,
  correo = excluded.correo,
  rol_academico = excluded.rol_academico,
  identificador_institucional = excluded.identificador_institucional,
  seccion = excluded.seccion,
  estado = excluded.estado;

insert into public.cursos (
  id_curso, id_institucion, id_profesor, nombre_curso, asignatura,
  codigo_curso, periodo, estado
) values (
  '00000000-0000-6300-8000-000000000001',
  '00000000-0000-6100-8000-000000000001',
  '00000000-0000-6200-8000-000000000001',
  'Gestion operativa de restaurante',
  'Taller de simulacion gastronomica',
  'GAS-402',
  '2026-1',
  'activo'
)
on conflict (id_curso) do update set
  id_institucion = excluded.id_institucion,
  id_profesor = excluded.id_profesor,
  nombre_curso = excluded.nombre_curso,
  asignatura = excluded.asignatura,
  codigo_curso = excluded.codigo_curso,
  periodo = excluded.periodo,
  estado = excluded.estado;

insert into public.secciones (
  id_seccion, id_curso, nombre_seccion, jornada, cupo, estado
) values (
  '00000000-0000-6400-8000-000000000001',
  '00000000-0000-6300-8000-000000000001',
  'RC24',
  'Diurna',
  24,
  'activa'
)
on conflict (id_seccion) do update set
  id_curso = excluded.id_curso,
  nombre_seccion = excluded.nombre_seccion,
  jornada = excluded.jornada,
  cupo = excluded.cupo,
  estado = excluded.estado;

insert into public.matriculas (
  id_matricula, id_seccion, id_alumno, estado
) values
  ('00000000-0000-6500-8000-000000000001', '00000000-0000-6400-8000-000000000001', '00000000-0000-6200-8000-000000000002', 'activa'),
  ('00000000-0000-6500-8000-000000000002', '00000000-0000-6400-8000-000000000001', '00000000-0000-6200-8000-000000000003', 'activa'),
  ('00000000-0000-6500-8000-000000000003', '00000000-0000-6400-8000-000000000001', '00000000-0000-6200-8000-000000000004', 'activa'),
  ('00000000-0000-6500-8000-000000000004', '00000000-0000-6400-8000-000000000001', '00000000-0000-6200-8000-000000000005', 'activa')
on conflict (id_matricula) do update set
  id_seccion = excluded.id_seccion,
  id_alumno = excluded.id_alumno,
  estado = excluded.estado;

insert into public.clases (
  id_clase, id_curso, id_seccion, id_profesor, nombre_clase, fecha,
  objetivo, tipo_servicio, estado
) values (
  '00000000-0000-6600-8000-000000000001',
  '00000000-0000-6300-8000-000000000001',
  '00000000-0000-6400-8000-000000000001',
  '00000000-0000-6200-8000-000000000001',
  'Servicio integrado entrada, fondo y barra',
  '2026-05-14',
  'Ejecutar un servicio presencial completo con control de bodega, cocina, caja, feedback y trazabilidad.',
  'Entrada + plato de fondo + bebidas',
  'activa'
)
on conflict (id_clase) do update set
  id_curso = excluded.id_curso,
  id_seccion = excluded.id_seccion,
  id_profesor = excluded.id_profesor,
  nombre_clase = excluded.nombre_clase,
  fecha = excluded.fecha,
  objetivo = excluded.objetivo,
  tipo_servicio = excluded.tipo_servicio,
  estado = excluded.estado;

insert into public.simulaciones (
  id_simulacion, id_clase, nombre_simulacion, tipo_servicio, objetivo,
  estado, duracion_estimada_minutos, fecha_inicio, configuracion
) values (
  '00000000-0000-6700-8000-000000000001',
  '00000000-0000-6600-8000-000000000001',
  'Servicio RC24 restaurante escuela',
  'Restaurante presencial con QR comensal',
  'Medir desempeno operativo y academico por rol durante servicio real simulado.',
  'servicio_activo',
  150,
  now() - interval '45 minutes',
  '{"areas":["bodega","cocina","bar","garzon","caja"],"modo":"piloto_plan_2","feedback_obligatorio":true}'::jsonb
)
on conflict (id_simulacion) do update set
  id_clase = excluded.id_clase,
  nombre_simulacion = excluded.nombre_simulacion,
  tipo_servicio = excluded.tipo_servicio,
  objetivo = excluded.objetivo,
  estado = excluded.estado,
  duracion_estimada_minutos = excluded.duracion_estimada_minutos,
  fecha_inicio = excluded.fecha_inicio,
  configuracion = excluded.configuracion;

insert into public.areas_simulacion (
  id_area_simulacion, id_simulacion, area_trabajo, responsable, estado, observacion
) values
  ('00000000-0000-6800-8000-000000000001', '00000000-0000-6700-8000-000000000001', 'bodega', '00000000-0000-6200-8000-000000000005', 'lista', 'Stock inicial y vencimientos revisados.'),
  ('00000000-0000-6800-8000-000000000002', '00000000-0000-6700-8000-000000000001', 'cocina', '00000000-0000-6200-8000-000000000002', 'lista', 'Mise en place principal validada.'),
  ('00000000-0000-6800-8000-000000000003', '00000000-0000-6700-8000-000000000001', 'garzon', '00000000-0000-6200-8000-000000000003', 'lista', 'Carta y disponibilidad informadas.'),
  ('00000000-0000-6800-8000-000000000004', '00000000-0000-6700-8000-000000000001', 'caja', '00000000-0000-6200-8000-000000000004', 'observada', 'Pendiente cierre de feedback de una mesa.')
on conflict (id_area_simulacion) do update set
  id_simulacion = excluded.id_simulacion,
  area_trabajo = excluded.area_trabajo,
  responsable = excluded.responsable,
  estado = excluded.estado,
  observacion = excluded.observacion;

insert into public.grupos_trabajo (
  id_grupo, id_simulacion, nombre_grupo, observacion
) values (
  '00000000-0000-6900-8000-000000000001',
  '00000000-0000-6700-8000-000000000001',
  'Brigada A',
  'Grupo responsable del primer servicio integrado.'
)
on conflict (id_grupo) do update set
  id_simulacion = excluded.id_simulacion,
  nombre_grupo = excluded.nombre_grupo,
  observacion = excluded.observacion;

insert into public.integrantes_grupo (
  id_integrante, id_grupo, id_alumno
) values
  ('00000000-0000-6a00-8000-000000000001', '00000000-0000-6900-8000-000000000001', '00000000-0000-6200-8000-000000000002'),
  ('00000000-0000-6a00-8000-000000000002', '00000000-0000-6900-8000-000000000001', '00000000-0000-6200-8000-000000000003'),
  ('00000000-0000-6a00-8000-000000000003', '00000000-0000-6900-8000-000000000001', '00000000-0000-6200-8000-000000000004'),
  ('00000000-0000-6a00-8000-000000000004', '00000000-0000-6900-8000-000000000001', '00000000-0000-6200-8000-000000000005')
on conflict (id_integrante) do update set
  id_grupo = excluded.id_grupo,
  id_alumno = excluded.id_alumno;

insert into public.roles_simulacion (
  id_rol_simulacion, id_simulacion, id_alumno, id_grupo,
  rol_asignado, area_trabajo, permisos, estado
) values
  ('00000000-0000-6b00-8000-000000000001', '00000000-0000-6700-8000-000000000001', '00000000-0000-6200-8000-000000000002', '00000000-0000-6900-8000-000000000001', 'Jefe de cocina', 'cocina', '["comandas:leer","recetas:leer","mise_en_place:confirmar"]'::jsonb, 'activo'),
  ('00000000-0000-6b00-8000-000000000002', '00000000-0000-6700-8000-000000000001', '00000000-0000-6200-8000-000000000003', '00000000-0000-6900-8000-000000000001', 'Garzon lider', 'garzon', '["pedidos:crear","mesas:actualizar","feedback:solicitar"]'::jsonb, 'activo'),
  ('00000000-0000-6b00-8000-000000000003', '00000000-0000-6700-8000-000000000001', '00000000-0000-6200-8000-000000000004', '00000000-0000-6900-8000-000000000001', 'Caja', 'caja', '["ventas:cerrar","feedback:validar","documentos:imprimir"]'::jsonb, 'activo'),
  ('00000000-0000-6b00-8000-000000000004', '00000000-0000-6700-8000-000000000001', '00000000-0000-6200-8000-000000000005', '00000000-0000-6900-8000-000000000001', 'Bodega', 'bodega', '["stock:actualizar","mermas:registrar","fifo:validar"]'::jsonb, 'activo')
on conflict (id_rol_simulacion) do update set
  id_simulacion = excluded.id_simulacion,
  id_alumno = excluded.id_alumno,
  id_grupo = excluded.id_grupo,
  rol_asignado = excluded.rol_asignado,
  area_trabajo = excluded.area_trabajo,
  permisos = excluded.permisos,
  estado = excluded.estado;

insert into public.simulacion_recetas (
  id_simulacion_receta, id_simulacion, id_receta, porciones_planificadas
) values
  ('00000000-0000-6c00-8000-000000000001', '00000000-0000-6700-8000-000000000001', '00000000-0000-4400-8000-000000000001', 12),
  ('00000000-0000-6c00-8000-000000000002', '00000000-0000-6700-8000-000000000001', '00000000-0000-4400-8000-000000000002', 9),
  ('00000000-0000-6c00-8000-000000000003', '00000000-0000-6700-8000-000000000001', '00000000-0000-4400-8000-000000000003', 18)
on conflict (id_simulacion_receta) do update set
  id_simulacion = excluded.id_simulacion,
  id_receta = excluded.id_receta,
  porciones_planificadas = excluded.porciones_planificadas;

insert into public.simulacion_productos (
  id_simulacion_producto, id_simulacion, id_producto,
  cantidad_planificada, cantidad_recibida, observacion
) values
  ('00000000-0000-6d00-8000-000000000001', '00000000-0000-6700-8000-000000000001', '00000000-0000-4600-8000-000000000001', 12, 10, 'Ajuste por stock disponible de lomo.'),
  ('00000000-0000-6d00-8000-000000000002', '00000000-0000-6700-8000-000000000001', '00000000-0000-4600-8000-000000000002', 9, 9, 'Produccion completa autorizada.'),
  ('00000000-0000-6d00-8000-000000000003', '00000000-0000-6700-8000-000000000001', '00000000-0000-4600-8000-000000000003', 18, 16, 'Dos porciones retenidas por control de frio.'),
  ('00000000-0000-6d00-8000-000000000004', '00000000-0000-6700-8000-000000000001', '00000000-0000-4600-8000-000000000005', 20, 20, 'Barra operativa.')
on conflict (id_simulacion_producto) do update set
  id_simulacion = excluded.id_simulacion,
  id_producto = excluded.id_producto,
  cantidad_planificada = excluded.cantidad_planificada,
  cantidad_recibida = excluded.cantidad_recibida,
  observacion = excluded.observacion;

insert into public.evaluaciones (
  id_evaluacion, id_simulacion, id_clase, id_profesor, tipo_evaluacion,
  titulo, descripcion, rol_objetivo, puntaje_maximo, intentos_permitidos,
  tiempo_limite_minutos, nota_automatica, correccion_manual, pauta, estado
) values (
  '00000000-0000-6e00-8000-000000000001',
  '00000000-0000-6700-8000-000000000001',
  '00000000-0000-6600-8000-000000000001',
  '00000000-0000-6200-8000-000000000001',
  'rubrica',
  'Rubrica servicio integrado RC24',
  'Evalua coordinacion por rol, trazabilidad, inocuidad, tiempos y respuesta ante imprevistos.',
  null,
  100,
  1,
  45,
  false,
  true,
  '{"criterios":["Trazabilidad","Mise en place","Comandas","Stock","Feedback"],"escala":"1 a 5"}'::jsonb,
  'publicada'
)
on conflict (id_evaluacion) do update set
  id_simulacion = excluded.id_simulacion,
  id_clase = excluded.id_clase,
  id_profesor = excluded.id_profesor,
  tipo_evaluacion = excluded.tipo_evaluacion,
  titulo = excluded.titulo,
  descripcion = excluded.descripcion,
  rol_objetivo = excluded.rol_objetivo,
  puntaje_maximo = excluded.puntaje_maximo,
  intentos_permitidos = excluded.intentos_permitidos,
  tiempo_limite_minutos = excluded.tiempo_limite_minutos,
  nota_automatica = excluded.nota_automatica,
  correccion_manual = excluded.correccion_manual,
  pauta = excluded.pauta,
  estado = excluded.estado;

insert into public.respuestas_evaluacion (
  id_respuesta, id_evaluacion, id_alumno, id_simulacion, intento,
  respuestas, puntaje, nota, retroalimentacion, corregida_por, fecha_correccion
) values
  (
    '00000000-0000-6f00-8000-000000000001',
    '00000000-0000-6e00-8000-000000000001',
    '00000000-0000-6200-8000-000000000002',
    '00000000-0000-6700-8000-000000000001',
    1,
    '{"auto_evaluacion":"Coordine salida de fondos y revise tiempos de cocina.","evidencia":"Comandas A-1048 y A-1049"}'::jsonb,
    86,
    6.1,
    'Buen control de comandas. Mejorar registro de observaciones de temperatura.',
    '00000000-0000-6200-8000-000000000001',
    now() - interval '10 minutes'
  ),
  (
    '00000000-0000-6f00-8000-000000000002',
    '00000000-0000-6e00-8000-000000000001',
    '00000000-0000-6200-8000-000000000005',
    '00000000-0000-6700-8000-000000000001',
    1,
    '{"auto_evaluacion":"Registre merma de palta y avise faltante de salmon.","evidencia":"Movimiento de bodega y alerta de stock"}'::jsonb,
    91,
    6.4,
    'Muy buen registro de bodega y trazabilidad FIFO.',
    '00000000-0000-6200-8000-000000000001',
    now() - interval '8 minutes'
  )
on conflict (id_respuesta) do update set
  id_evaluacion = excluded.id_evaluacion,
  id_alumno = excluded.id_alumno,
  id_simulacion = excluded.id_simulacion,
  intento = excluded.intento,
  respuestas = excluded.respuestas,
  puntaje = excluded.puntaje,
  nota = excluded.nota,
  retroalimentacion = excluded.retroalimentacion,
  corregida_por = excluded.corregida_por,
  fecha_correccion = excluded.fecha_correccion;

insert into public.imprevistos_simulacion (
  id_imprevisto, id_simulacion, id_profesor, tipo_imprevisto,
  descripcion, area_afectada, estado, impacto, fecha_activacion
) values (
  '00000000-0000-7000-8000-000000000001',
  '00000000-0000-6700-8000-000000000001',
  '00000000-0000-6200-8000-000000000001',
  'falla_stock',
  'Bodega informa menor disponibilidad de lomo para el ultimo bloque de servicio.',
  'bodega',
  'activo',
  '{"stock_requerido":"12 porciones","stock_disponible":"10 porciones","decision_esperada":"ajustar carta y avisar salon"}'::jsonb,
  now() - interval '18 minutes'
)
on conflict (id_imprevisto) do update set
  id_simulacion = excluded.id_simulacion,
  id_profesor = excluded.id_profesor,
  tipo_imprevisto = excluded.tipo_imprevisto,
  descripcion = excluded.descripcion,
  area_afectada = excluded.area_afectada,
  estado = excluded.estado,
  impacto = excluded.impacto,
  fecha_activacion = excluded.fecha_activacion;

insert into public.feedback_comensal (
  id_feedback, id_simulacion, id_venta, mesa, nombre_comensal,
  puntuacion_atencion, puntuacion_sabor, puntuacion_presentacion,
  puntuacion_tiempo, puntuacion_limpieza, puntuacion_experiencia, comentario
) values
  ('00000000-0000-7100-8000-000000000001', '00000000-0000-6700-8000-000000000001', '00000000-0000-4800-8000-000000000001', '2', 'Comensal mesa 2', 5, 4, 4, 4, 5, 4, 'Buena atencion, plato principal llego con espera razonable.'),
  ('00000000-0000-7100-8000-000000000002', '00000000-0000-6700-8000-000000000001', '00000000-0000-4800-8000-000000000003', '7', 'Comensal mesa 7', 4, 5, 5, 5, 5, 5, 'Servicio fluido y buena presentacion de entrada fria.')
on conflict (id_feedback) do update set
  id_simulacion = excluded.id_simulacion,
  id_venta = excluded.id_venta,
  mesa = excluded.mesa,
  nombre_comensal = excluded.nombre_comensal,
  puntuacion_atencion = excluded.puntuacion_atencion,
  puntuacion_sabor = excluded.puntuacion_sabor,
  puntuacion_presentacion = excluded.puntuacion_presentacion,
  puntuacion_tiempo = excluded.puntuacion_tiempo,
  puntuacion_limpieza = excluded.puntuacion_limpieza,
  puntuacion_experiencia = excluded.puntuacion_experiencia,
  comentario = excluded.comentario;

insert into public.trazabilidad_academica (
  id_trazabilidad, id_perfil, id_simulacion, id_clase, rol,
  modulo, accion, entidad, id_entidad, valor_anterior, valor_nuevo,
  observacion, fecha_hora
) values
  (
    '00000000-0000-7200-8000-000000000001',
    '00000000-0000-6200-8000-000000000005',
    '00000000-0000-6700-8000-000000000001',
    '00000000-0000-6600-8000-000000000001',
    'alumno',
    'bodega',
    'registrar_merma',
    'raw_materials',
    '00000000-0000-4300-8000-000000000005',
    '{"stock":"2920 g"}'::jsonb,
    '{"stock":"2600 g","merma":"320 g"}'::jsonb,
    'Merma de palta por madurez avanzada.',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-7200-8000-000000000002',
    '00000000-0000-6200-8000-000000000003',
    '00000000-0000-6700-8000-000000000001',
    '00000000-0000-6600-8000-000000000001',
    'alumno',
    'salon',
    'crear_pedido',
    'orders',
    '00000000-0000-4800-8000-000000000001',
    null,
    '{"mesa":2,"total":42600}'::jsonb,
    'Pedido creado desde flujo de salon.',
    now() - interval '26 minutes'
  ),
  (
    '00000000-0000-7200-8000-000000000003',
    '00000000-0000-6200-8000-000000000001',
    '00000000-0000-6700-8000-000000000001',
    '00000000-0000-6600-8000-000000000001',
    'profesor',
    'simulacion',
    'activar_imprevisto',
    'imprevistos_simulacion',
    '00000000-0000-7000-8000-000000000001',
    null,
    '{"tipo":"falla_stock","area":"bodega"}'::jsonb,
    'Profesor activa imprevisto de stock para medir respuesta del equipo.',
    now() - interval '18 minutes'
  )
on conflict (id_trazabilidad) do update set
  id_perfil = excluded.id_perfil,
  id_simulacion = excluded.id_simulacion,
  id_clase = excluded.id_clase,
  rol = excluded.rol,
  modulo = excluded.modulo,
  accion = excluded.accion,
  entidad = excluded.entidad,
  id_entidad = excluded.id_entidad,
  valor_anterior = excluded.valor_anterior,
  valor_nuevo = excluded.valor_nuevo,
  observacion = excluded.observacion,
  fecha_hora = excluded.fecha_hora;

update public.orders
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where id in (
  '00000000-0000-4800-8000-000000000001',
  '00000000-0000-4800-8000-000000000002',
  '00000000-0000-4800-8000-000000000003'
);

update public.order_items
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where order_id in (
  '00000000-0000-4800-8000-000000000001',
  '00000000-0000-4800-8000-000000000002',
  '00000000-0000-4800-8000-000000000003'
);

update public.inventory_movements
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where id in (
  '00000000-0000-4d00-8000-000000000001',
  '00000000-0000-4d00-8000-000000000002',
  '00000000-0000-4d00-8000-000000000003'
);

update public.cash_registers
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where id = '00000000-0000-4b00-8000-000000000001';

update public.cash_movements
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where cash_register_id = '00000000-0000-4b00-8000-000000000001';

update public.operational_documents
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where order_id in (
  '00000000-0000-4800-8000-000000000001',
  '00000000-0000-4800-8000-000000000003'
);

insert into public.settings (
  key, value, updated_by, updated_at
) values (
  'restaurant_profile',
  '{
    "restaurantName": "UDLA Academia Gastronomica",
    "academyName": "Universidad de Las Americas",
    "legalName": "Academia Gastronomica UDLA",
    "taxId": "76.000.000-0",
    "address": "Campus Gastronomico UDLA, Santiago",
    "phone": "+56 2 2440 0000",
    "email": "academia.gastronomica@udla.cl",
    "currency": "CLP",
    "locale": "es-CL",
    "logoUrl": "/logo-original-udla.png",
    "serviceChargePercent": 10,
    "taxPercent": 19,
    "operatingHours": [
      {"day":"Lunes","open":"09:00","close":"18:00","enabled":true},
      {"day":"Martes","open":"09:00","close":"18:00","enabled":true},
      {"day":"Miercoles","open":"09:00","close":"18:00","enabled":true},
      {"day":"Jueves","open":"09:00","close":"18:00","enabled":true},
      {"day":"Viernes","open":"09:00","close":"20:00","enabled":true},
      {"day":"Sabado","open":"10:00","close":"16:00","enabled":true},
      {"day":"Domingo","open":"10:00","close":"16:00","enabled":false}
    ],
    "documentSeries": [
      {"type":"kitchen_ticket","prefix":"COC","nextNumber":1052,"enabled":true},
      {"type":"table_prebill","prefix":"PRE","nextNumber":318,"enabled":true},
      {"type":"payment_receipt","prefix":"REC","nextNumber":872,"enabled":true},
      {"type":"cash_close","prefix":"CJA","nextNumber":44,"enabled":true},
      {"type":"reservation_sheet","prefix":"RES","nextNumber":126,"enabled":true}
    ],
    "printStations": [
      {"id":"ps-hot","name":"Cocina caliente","area":"hot","printerName":"EPSON-Cocina-01","autoPrint":true},
      {"id":"ps-cold","name":"Cuarto frio","area":"cold","printerName":"EPSON-Frio-01","autoPrint":true},
      {"id":"ps-bar","name":"Barra","area":"bar","printerName":"EPSON-Barra-01","autoPrint":true},
      {"id":"ps-cash","name":"Caja","area":"cash","printerName":"EPSON-Caja-01","autoPrint":false}
    ],
    "tableZones": [
      {"name":"Terraza","capacity":12,"color":"bg-emerald-500","active":true},
      {"name":"Salon","capacity":24,"color":"bg-amber-500","active":true},
      {"name":"Comedor","capacity":20,"color":"bg-cyan-500","active":true},
      {"name":"Barra","capacity":8,"color":"bg-fuchsia-500","active":true}
    ]
  }'::jsonb,
  '00000000-0000-4100-8000-000000000001',
  now() - interval '15 minutes'
)
on conflict (key) do update set
  value = excluded.value,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

insert into public.audit_logs (
  id, actor_id, actor_role, action, entity_type, entity_id, summary, metadata, created_at
) values
  (
    '00000000-0000-5000-8000-000000000009',
    '00000000-0000-4100-8000-000000000001',
    'administrator',
    'settings.upsert',
    'settings',
    'restaurant_profile',
    'Configuracion institucional y logo de academia actualizados.',
    '{"logoUrl":"/logo-original-udla.png","serviceChargePercent":10,"taxPercent":19}'::jsonb,
    now() - interval '15 minutes'
  ),
  (
    '00000000-0000-5000-8000-000000000007',
    '00000000-0000-4100-8000-000000000005',
    'cashier',
    'document.print',
    'operational_document',
    '00000000-0000-5400-8000-000000000002',
    'Pre-cuenta de mesa 7 registrada para impresion.',
    '{"type":"table_prebill","orderNumber":"A-1050"}'::jsonb,
    now() - interval '29 minutes'
  ),
  (
    '00000000-0000-5000-8000-000000000008',
    '00000000-0000-4100-8000-000000000003',
    'waiter',
    'document.print',
    'operational_document',
    '00000000-0000-5400-8000-000000000004',
    'Ficha de reserva de Carolina Munoz preparada para salon.',
    '{"type":"reservation_sheet","reservationId":"00000000-0000-5200-8000-000000000001"}'::jsonb,
    now() - interval '20 minutes'
  ),
  (
    '00000000-0000-5000-8000-000000000005',
    '00000000-0000-4100-8000-000000000003',
    'waiter',
    'reservation.upsert',
    'reservation',
    '00000000-0000-5200-8000-000000000001',
    'Reserva confirmada para Carolina Munoz.',
    '{"date":"2026-05-10","time":"20:30","partySize":6}'::jsonb,
    now() - interval '3 hours'
  ),
  (
    '00000000-0000-5000-8000-000000000006',
    '00000000-0000-4100-8000-000000000004',
    'waiter',
    'crm.interaction.create',
    'customer',
    '00000000-0000-5100-8000-000000000002',
    'Alerta de alergia reforzada en ficha de cliente.',
    '{"type":"preference","allergy":"Mariscos"}'::jsonb,
    now() - interval '4 hours'
  ),
  (
    '00000000-0000-5000-8000-000000000001',
    '00000000-0000-4100-8000-000000000005',
    'cashier',
    'cash.payment.settle',
    'order',
    '00000000-0000-4800-8000-000000000003',
    'Cuenta A-1050 cobrada con debito y descuento de inventario.',
    '{"paymentMethod":"debit","amount":57200,"table":7}'::jsonb,
    now() - interval '25 minutes'
  ),
  (
    '00000000-0000-5000-8000-000000000002',
    '00000000-0000-4100-8000-000000000006',
    'warehouse',
    'inventory.movement.create',
    'raw_material',
    '00000000-0000-4300-8000-000000000005',
    'Merma registrada por madurez avanzada.',
    '{"movementType":"waste","quantity":-320}'::jsonb,
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-5000-8000-000000000003',
    '00000000-0000-4100-8000-000000000006',
    'warehouse',
    'food_safety.check.create',
    'raw_material',
    '00000000-0000-4300-8000-000000000002',
    'Control sanitario conforme para Salmon fresco.',
    '{"result":"ok","temperature":"1.8 C"}'::jsonb,
    now() - interval '90 minutes'
  ),
  (
    '00000000-0000-5000-8000-000000000004',
    '00000000-0000-4100-8000-000000000002',
    'chef',
    'recipe.upsert',
    'recipe',
    '00000000-0000-4400-8000-000000000001',
    'Receta tecnica actualizada con rendimiento y food cost objetivo.',
    '{"targetFoodCostPercent":30,"portions":4}'::jsonb,
    now() - interval '3 hours'
  )
on conflict (id) do update set
  actor_id = excluded.actor_id,
  actor_role = excluded.actor_role,
  action = excluded.action,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  summary = excluded.summary,
  metadata = excluded.metadata,
  created_at = excluded.created_at;

update public.audit_logs
set id_simulacion = '00000000-0000-6700-8000-000000000001'
where entity_id in (
  '00000000-0000-4800-8000-000000000001',
  '00000000-0000-4800-8000-000000000003',
  '00000000-0000-4300-8000-000000000005',
  '00000000-0000-4300-8000-000000000002'
);
