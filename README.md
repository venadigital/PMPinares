# Pinares Project Control

Aplicacion web privada para controlar el proyecto de consultoria Pinares: dashboard, usuarios, permisos, documentos, cronograma, comunicacion, inventario tecnologico, procesos, hallazgos, riesgos, decisiones y entregables.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth, PostgreSQL, Storage y RLS
- Tailwind CSS v4 con lenguaje visual Apple/glass basado en `Recursos/sistema-diseno-vena-digital.html`
- Resend para notificaciones por correo
- ExcelJS para exportacion de inventario

## Inicio local

```bash
npm install
cp .env.example .env.local
npm run dev
```

La app abre en `http://localhost:3000`.

## Produccion

El proyecto esta preparado para correr como aplicacion Node.js con Next.js standalone.

```bash
npm ci
npm run build
npm run start:hostinger
```

Para Hostinger, revisa la guia completa en `HOSTINGER_DEPLOY.md`.

## Supabase local

```bash
supabase start
supabase db reset
```

Las migraciones viven en `supabase/migrations` y los seeds en `supabase/seed`.

Variables requeridas:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=Administrador Vena Digital
```

## Crear primer Administrador Vena Digital

Despues de aplicar migraciones y seeds de Supabase, crea el primer admin:

```bash
npm run bootstrap:admin
```

Ese usuario puede ingresar por `/login` y crear usuarios de Pinares desde `/stakeholders`, asignando rol, contrasena temporal y permisos por modulo.

## Rutas principales

- `/login`
- `/dashboard`
- `/stakeholders`
- `/cuenta`
- `/documentos`
- `/cronograma`
- `/comunicacion`
- `/inventario`
- `/procesos`
- `/hallazgos`
- `/riesgos`
- `/decisiones`
- `/entregables`

## Estado actual

Este corte implementa la fundacion completa del MVP con UI navegable, datos seed, schema Supabase, storage, politicas RLS iniciales, login real, logout, creacion de usuarios, permisos por modulo, cambio opcional de contrasena, endpoints de notificacion y exportacion Excel.

Si Supabase no esta configurado, la app entra en modo demo y muestra datos de ejemplo desde `lib/data.ts`.
