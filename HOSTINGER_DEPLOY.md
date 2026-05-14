# Despliegue En Hostinger Node.js

Esta app puede publicarse en Hostinger usando **App web Node.js**. La arquitectura actual es compatible porque Next.js corre como servidor Node y Supabase/Resend viven como servicios externos.

## Requisitos

- Node.js `20.11` o superior.
- Supabase Cloud configurado con migraciones aplicadas.
- Dominio final definido para `NEXT_PUBLIC_APP_URL`.
- Resend con dominio verificado.

## Variables De Entorno En Hostinger

Configura estas variables en el panel de la App Node.js:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://laqmfcgmhnnbubkwtoux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=notificaciones@venadigital.com.co
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=venadigital
```

Notas:

- `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY` nunca deben estar en frontend ni en variables `NEXT_PUBLIC_*`.
- En producción cambia `NEXT_PUBLIC_APP_URL` por el dominio real con `https`.
- Rota las claves si fueron compartidas fuera del panel seguro de Hostinger/Supabase.

## Comandos De Build Y Arranque

En Hostinger configura:

```bash
npm ci
npm run build
npm start
```

El arranque se hace desde `server.js`, un servidor Node compatible con Hostinger que usa el puerto `PORT` asignado por la plataforma.

Si el panel pide un **startup file**, usa:

```bash
server.js
```

Si el panel pide un **start command**, usa:

```bash
npm start
```

## Archivos Que Deben Subirse

Sube el proyecto completo excepto:

- `.env.local`
- `.next`
- `node_modules`
- `.DS_Store`
- `coverage`

Hostinger debe instalar dependencias y generar `.next` durante el build.

## Checklist Antes De Publicar

Ejecuta localmente:

```bash
npm run check:prod
```

Verifica en Supabase:

- No hay issues críticos de RLS en Advisor.
- Storage bucket `project-files` existe.
- El usuario administrador existe.
- Las URLs del proyecto usan el dominio de producción.

## Primer Acceso

Si necesitas crear o reparar el administrador inicial:

```bash
npm run bootstrap:admin
```

Ejecuta ese comando solo con variables de producción correctas.
