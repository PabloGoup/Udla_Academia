# UDLA Academia Gastronomica

Web app profesional para administrar y simular la operacion completa de un restaurante presencial: salon, mesas, pedidos, cocina, caja, inventario, compras, proveedores, recetas tecnicas, costeo real, reportes, trabajadores y seguridad alimentaria.

## Estado actual

Esta etapa entrega una base funcional en modo demo local y preparada para Supabase:

- UI responsive para desktop, tablet y movil.
- Navegacion por roles: administrador, supervisor, cajero, mesero, cocinero, jefe de cocina y bodega.
- Modulos operativos navegables con datos demo.
- Lectura real desde Supabase con fallback automatico al demo si hay error.
- Inicio de sesion con Supabase Auth desde la interfaz.
- Mutaciones reales para cambiar mesas, actualizar pedidos, agregar productos y registrar comandas.
- Suscripciones Supabase Realtime para salon, pedidos, cocina, caja e inventario.
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
3. Ejecutar `supabase/seed.sql` para cargar datos iniciales de salon, cocina, caja, inventario y recetas.
4. Copiar `.env.example` a `.env.local` o usar `.env`.
5. Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Sin esas variables la app funciona en modo demo local.

Tambien se admite `NEXT_PUBLIC_SUPABASE_ANON_KEY` para proyectos que aun usan ese nombre.

Con variables configuradas, la app intenta leer Supabase. Si faltan tablas, permisos o datos criticos, muestra fallback demo para no bloquear el modulo educativo.

El SQL tambien agrega tablas operativas a `supabase_realtime` para que cambios en mesas, pedidos, comandas, caja, compras e inventario refresquen la interfaz automaticamente.

## Autenticacion y roles

La cabecera incluye acceso con email y password de Supabase Auth. Al iniciar sesion, el sistema sincroniza el perfil en `public.users` mediante `ensure_current_user_profile()`.

Para asignar roles comerciales, define `app_metadata.role` en el usuario de Supabase Auth con uno de estos valores:

```txt
administrator, supervisor, cashier, waiter, cook, chef, warehouse
```

Si no hay rol configurado, el perfil se crea como `waiter`. Las politicas RLS del prototipo permiten escritura por grupos funcionales: salon, pedidos, cocina, caja, inventario, recetas y administracion.

## Validacion

```bash
npm run lint
npm run build
```

## Documentacion

La arquitectura y las etapas recomendadas estan en `docs/architecture.md`.

# Udla_Academia
