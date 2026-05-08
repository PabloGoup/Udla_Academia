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
  id, role_id, full_name, shift, status
) values
  ('00000000-0000-4100-8000-000000000001', 'administrator', 'Paula Contreras', 'Administracion', 'active'),
  ('00000000-0000-4100-8000-000000000002', 'chef', 'Rodrigo Fuentes', 'Cocina AM', 'active'),
  ('00000000-0000-4100-8000-000000000003', 'waiter', 'Valentina Reyes', 'Salon AM', 'active'),
  ('00000000-0000-4100-8000-000000000004', 'waiter', 'Camila Soto', 'Salon AM', 'break'),
  ('00000000-0000-4100-8000-000000000005', 'cashier', 'Felipe Araya', 'Caja AM', 'active'),
  ('00000000-0000-4100-8000-000000000006', 'warehouse', 'Daniel Vega', 'Bodega', 'active')
on conflict (id) do update set
  role_id = excluded.role_id,
  full_name = excluded.full_name,
  shift = excluded.shift,
  status = excluded.status;

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
