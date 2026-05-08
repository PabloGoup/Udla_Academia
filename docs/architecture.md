# Arquitectura general

Esta primera etapa deja una base profesional para una plataforma gastronomica presencial con dos modos de trabajo:

- **Modo comercial:** preparado para conectar con Supabase usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
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
- `supabase/schema.sql`: modelo relacional base para produccion.

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

## Formula de costo real

El sistema calcula sobre materia prima aprovechable:

```txt
cantidad_neta = cantidad_bruta * rendimiento
costo_real_neto = costo_compra / cantidad_neta_aprovechable
costo_ingrediente_receta = cantidad_utilizada * costo_real_neto
```

Ejemplo: si 1 kg de lomo cuesta $10.000 y rinde 70%, el costo real neto es $10.000 / 700 g = $14,29 por gramo aprovechable.

## Siguiente etapa recomendada

Conectar autenticacion y lectura real de Supabase, manteniendo el demo educativo como fallback. Luego separar cada modulo en rutas dedicadas y convertir las acciones de la UI en Server Actions o RPC de Supabase segun corresponda.
