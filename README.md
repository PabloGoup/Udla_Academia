# UDLA Academia Gastronomica

Web app profesional para administrar y simular la operacion completa de un restaurante presencial: salon, mesas, pedidos, cocina, caja, inventario, compras, proveedores, recetas tecnicas, costeo real, reportes, trabajadores y seguridad alimentaria.

## Estado actual

Esta etapa entrega una base funcional en modo demo local y preparada para Supabase:

- UI responsive para desktop, tablet y movil.
- Navegacion por roles: administrador, supervisor, cajero, mesero, cocinero, jefe de cocina y bodega.
- Modulos operativos navegables con datos demo.
- Calculo de rendimiento, cantidad neta, costo real neto, costo por porcion, food cost y rentabilidad.
- Esquema SQL inicial en `supabase/schema.sql`.
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
3. Copiar `.env.example` a `.env.local`.
4. Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Sin esas variables la app funciona en modo demo local.

## Validacion

```bash
npm run lint
npm run build
```

## Documentacion

La arquitectura y las etapas recomendadas estan en `docs/architecture.md`.

# Udla_Academia
