# UDLA Academia Gastronomica

Web app profesional para administrar y simular la operacion completa de un restaurante presencial: salon, mesas, pedidos, cocina, caja, inventario, compras, proveedores, recetas tecnicas, costeo real, reportes, trabajadores, seguridad alimentaria, auditoria operativa, clientes y reservas.

## Estado actual

Esta etapa entrega una base funcional en modo demo local y preparada para Supabase:

- UI responsive para desktop, tablet y movil.
- Navegacion por roles: administrador, supervisor, cajero, mesero, cocinero, jefe de cocina y bodega.
- Modulos operativos navegables con datos demo.
- Lectura real desde Supabase con fallback automatico al demo si hay error.
- Inicio de sesion con Supabase Auth desde la interfaz.
- Mutaciones reales para cambiar mesas, actualizar pedidos, agregar productos y registrar comandas.
- Suscripciones Supabase Realtime para salon, pedidos, cocina, caja e inventario.
- Caja operativa con apertura, cobro de cuentas, propinas, retiros, adelantos, diferencias y cierre.
- Inventario operativo con movimientos de bodega, mermas, ajustes y descuento automatico por venta.
- Compras y proveedores con recepcion a inventario, actualizacion de costos y precios historicos por insumo.
- Recetario tecnico editable con ingredientes, rendimiento, merma, procedimiento, alergenos, food cost, precio sugerido y persistencia en Supabase.
- Productos/carta editable con precio, disponibilidad, receta vinculada, tiempos de preparacion y personalizaciones persistentes.
- Reportes reales de ventas, margen, food cost, caja, inventario valorizado, compras, mermas, productos y trabajadores.
- Seguridad alimentaria avanzada con bitacora sanitaria, alertas por lote/vencimiento, control de temperaturas, checklist FIFO/LIFO y trazabilidad por materia prima.
- Gestion avanzada de trabajadores con alta/edicion, roles, contacto, turnos, estado operativo, costo horario, productividad y costo laboral proyectado.
- Auditoria transversal de acciones criticas con actor, rol, entidad, metadata, vista historica y persistencia en `audit_logs`.
- Clientes, reservas y CRM operativo con fichas, preferencias, alergias, tags, agenda por mesa, no-shows y seguimientos.
- Calculo de rendimiento, cantidad neta, costo real neto, costo por porcion, food cost y rentabilidad.
- Esquema SQL inicial en `supabase/schema.sql`.
- Datos semilla academicos en `supabase/seed.sql`.
- Modo educativo desacoplado de la base de datos.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL editor.
3. Ejecutar `supabase/seed.sql` para cargar datos iniciales de salon, cocina, caja, inventario, recetas, seguridad alimentaria, auditoria, clientes y reservas.
4. Copiar `.env.example` a `.env.local` o usar `.env`.
5. Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Sin esas variables la app funciona en modo demo local.

Tambien se admite `NEXT_PUBLIC_SUPABASE_ANON_KEY` para proyectos que aun usan ese nombre.

Con variables configuradas, la app intenta leer Supabase. Si faltan tablas, permisos o datos criticos, muestra fallback demo para no bloquear el modulo educativo.

El SQL tambien agrega tablas operativas a `supabase_realtime` para que cambios en mesas, trabajadores, pedidos, comandas, caja, compras, inventario, productos, recetario, seguridad alimentaria, auditoria, clientes y reservas refresquen la interfaz automaticamente.

## Autenticacion y roles

La cabecera incluye acceso con email y password de Supabase Auth. Al iniciar sesion, el sistema sincroniza el perfil en `public.users` mediante `ensure_current_user_profile()`.

Para asignar roles comerciales, define `app_metadata.role` en el usuario de Supabase Auth con uno de estos valores:

```txt
administrator, supervisor, cashier, waiter, cook, chef, warehouse
```

Si no hay rol configurado, el perfil se crea como `waiter`. Las politicas RLS del prototipo permiten escritura por grupos funcionales: salon, pedidos, cocina, caja, inventario, recetas, clientes, reservas y administracion.

## Validacion

```bash
npm run lint
npm run build
```

## Documentacion

La arquitectura y las etapas recomendadas estan en `docs/architecture.md`.

# Udla_Academia
