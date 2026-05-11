# Arquitectura general

Esta primera etapa deja una base profesional para una plataforma gastronomica presencial con dos modos de trabajo:

- **Modo comercial:** preparado para conectar con Supabase usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Modo educativo:** funciona con datos demo locales para que docentes y alumnos puedan simular todos los modulos sin escribir en la base real.

## Stack

- Next.js 16 con App Router.
- React 19.
- Tailwind CSS v4.
- Supabase para base de datos, autenticacion, RLS y realtime.
- Graficos SVG/CSS propios para reportes sin dependencias pesadas.
- Lucide React para iconografia.

## Estructura

- `src/app/page.tsx`: entrada principal de la web app.
- `src/components/restaurant-platform.tsx`: interfaz POS modular y simulador operativo.
- `src/lib/types.ts`: contratos de dominio.
- `src/lib/demo-data.ts`: dataset educativo desacoplado de Supabase.
- `src/lib/permissions.ts`: roles y permisos por modulo.
- `src/lib/costing.ts`: formulas de rendimiento, merma y costeo real.
- `src/lib/supabase.ts`: cliente Supabase con inicializacion diferida.
- `src/lib/data-source.ts`: lectura Supabase con fallback al dataset educativo.
- `src/lib/realtime.ts`: suscripciones Supabase Realtime para mesas, trabajadores, pedidos, cocina, caja, compras, inventario, productos, recetario, seguridad alimentaria, auditoria, clientes, reservas, documentos operativos y configuracion.
- `supabase/schema.sql`: modelo relacional base para produccion.
- `supabase/seed.sql`: datos iniciales para pruebas academicas y comerciales.

## Etapas de desarrollo

1. Arquitectura general.
2. Modelo de base de datos.
3. Estructura del proyecto.
4. Diseno UI/UX.
5. Sistema de roles.
6. Flujo de pedidos.
7. Cocina en tiempo real.
8. Caja.
9. Inventario.
10. Recetario tecnico.
11. Costeo real.
12. Reportes y dashboards.
13. Seguridad alimentaria y bodega avanzada.
14. Gestion avanzada de trabajadores.
15. Auditoria transversal de acciones criticas.
16. Clientes, reservas y CRM operativo.
17. Impresion y documentos operativos.
18. Configuracion institucional y parametros del local.

## Formula de costo real

El sistema calcula sobre materia prima aprovechable:

```txt
cantidad_neta = cantidad_bruta * rendimiento
costo_real_neto = costo_compra / cantidad_neta_aprovechable
costo_ingrediente_receta = cantidad_utilizada * costo_real_neto
```

Ejemplo: si 1 kg de lomo cuesta $10.000 y rinde 70%, el costo real neto es $10.000 / 700 g = $14,29 por gramo aprovechable.

## Siguiente etapa recomendada

La lectura real de Supabase ya esta integrada con fallback educativo. Supabase Auth tambien esta disponible en la cabecera, las acciones principales de salon, cocina y pedidos ya intentan persistir cambios reales cuando existe una sesion con permisos, y Supabase Realtime refresca automaticamente los modulos operativos publicados.

La caja ya permite apertura, cobro de cuentas presenciales, registro de propinas, retiros, adelantos, diferencias y cierre con persistencia en Supabase cuando existe sesion autorizada. Al cobrar una venta, la plataforma llama a `consume_order_inventory()` para descontar automaticamente las materias primas vinculadas por producto, receta e ingrediente.

Inventario ya permite registrar mermas, salidas manuales y ajustes, y conserva trazabilidad en `inventory_movements`.

Compras ya permite recepcionar facturas o boletas, insertar `purchase_items`, generar movimientos de inventario tipo `purchase`, actualizar stock, proveedor, rendimiento, lote, vencimiento y costo vigente de la materia prima mediante `receive_purchase_inventory()`. La interfaz muestra comparacion contra costo actual e historial de precios por insumo.

Recetario tecnico ya permite crear y editar recetas desde la interfaz, agregar/quitar ingredientes, registrar rendimiento y merma, calcular costo neto, costo por porcion, food cost, margen, rentabilidad y precio sugerido antes de guardar. En Supabase se persiste de forma transaccional con `upsert_technical_recipe()`, reemplazando los ingredientes de la receta y manteniendo una columna `reference_sale_price` para costeo cuando no existe un producto vinculado.

Productos/carta ya permite crear y editar productos desde la UI, asignar categoria, vincular receta tecnica, definir imagen, precio de venta, disponibilidad, tiempo de preparacion y opciones de personalizacion. La persistencia usa `upsert` sobre `products` y se apoya en las politicas RLS existentes para `administrator` y `chef`.

Reportes y dashboards ya calculan indicadores desde datos operativos reales cargados en el snapshot: venta reconocida, margen estimado, food cost, ticket promedio, inventario valorizado, compras, caja por metodo, propinas, retiros/adelantos, diferencias de caja, productos mas/menos vendidos, rentabilidad por producto, mermas por insumo, compras por proveedor y desempeno de trabajadores. El SQL tambien expone vistas para analisis directo: `daily_sales_report`, `product_sales_report`, `inventory_valuation_report`, `cash_summary_report` y `purchase_supplier_report`.

Seguridad alimentaria ya cuenta con bitacora editable de controles sanitarios (`food_safety_logs`), alertas por lote/vencimiento, control de temperaturas, checklist FIFO/LIFO, trazabilidad por materia prima y suscripcion realtime. El SQL expone `food_safety_alerts` y `food_safety_log_summary` para auditoria sanitaria y tableros externos.

Gestion de trabajadores ya permite alta y edicion desde la interfaz, con rol, RUT, telefono, turno, estado operativo, fecha de ingreso, costo horario, productividad por rol y costo laboral proyectado por turno. La persistencia usa `upsert` sobre `employees`, el canal realtime escucha cambios de trabajadores y el SQL expone `employee_shift_report` para analizar ventas, caja, acciones de inventario, controles sanitarios y costo estimado.

Auditoria transversal ya registra acciones criticas en `audit_logs` mediante `record_audit_log()`, enlazando actor, rol, usuario autenticado cuando existe, entidad afectada, resumen y metadata estructurada. Las operaciones principales de mesas, pedidos, comandas, caja, inventario, compras, recetas, productos, trabajadores y seguridad alimentaria intentan dejar bitacora sin bloquear la transaccion operativa si la auditoria falla. La UI incorpora un modulo de auditoria con filtros por entidad, metricas de cobertura y lectura realtime. El SQL tambien expone `audit_activity_report` para tableros externos.

Clientes y reservas ya cuenta con fichas persistibles (`customers`), agenda por mesa y turno (`reservations`) y seguimientos CRM (`customer_interactions`). El modulo permite registrar preferencias, alergias, tags, historial de visitas, venta acumulada, no-shows, origen de reserva, responsable y contactos pendientes. Las reservas confirmadas pueden marcar mesas como reservadas, el canal realtime escucha cambios de CRM, y el SQL expone `customer_crm_report` y `reservation_daily_report` para tableros externos.

Impresion y documentos operativos ya cuenta con `operational_documents`, plantillas de comanda, pre-cuenta, comprobante de pago, cierre de caja y ficha de reserva. La UI genera una vista imprimible, registra historial, persiste metadata estructurada, deja auditoria `document.print` y escucha cambios realtime. El SQL expone `operational_document_report` para tableros externos.

Configuracion institucional ya usa `settings` con la clave `restaurant_profile` para nombre comercial, razon social, RUT, contacto, moneda, locale, logo institucional (`/logo.png`), cargo de servicio, impuesto referencial, horarios, series de documentos, estaciones de impresion y zonas de salon. El modulo de configuracion permite editar estos valores, la cabecera y documentos imprimibles usan el logo de la academia, y cada guardado deja auditoria `settings.upsert`.

La siguiente etapa recomendada es agregar multi-sucursal: sedes, bodegas por local, cajas por sede, usuarios asignados a sede y reportes comparativos entre locales.

## Politicas RLS del prototipo

El esquema incluye lectura anonima para que la publishable key pueda alimentar el demo academico sin login. Las escrituras quedan restringidas a usuarios autenticados con rol y se agrupan por area funcional. En una instalacion comercial, la lectura anonima debe reemplazarse por politicas basadas en Supabase Auth y `app_metadata.role`.

La funcion `ensure_current_user_profile()` sincroniza `auth.users` con `public.users` para que RLS pueda resolver el rol desde `app_metadata.role` o desde la tabla publica.
