# ClubApp API — Endpoints (Fase 1 + 1b)

Base URL: `http://localhost:3001`

Headers tipicos (rutas autenticadas):

- `Authorization: Bearer <token>`
- `X-Club-Slug: club-prueba` (opcional si el JWT ya trae `club_id`)

## Credenciales seed

- **Plataforma (superadmin):** `platform@clubapp.com` / `platform123` → web `/platform/login`
- Slug club: `club-prueba` → web `/login/club-prueba`
- Admin club: `admin@clubprueba.com` / `admin123`
- Pass maestra (soporte): `clubapp-master-dev` (env `PLATFORM_MASTER_PASSWORD`)
- Socios: DNI `30111222|30222333|30333444` / pass `socio123`

## Health / Auth / Clubs

- `GET /health`
- `POST /auth/admin/login` — `{ club_slug, email, password }`  
  Respuesta extra: `must_complete_onboarding`, `must_change_password`, `impersonated_by_platform`  
  Acepta la pass del admin **o** `PLATFORM_MASTER_PASSWORD`
- `POST /auth/platform/login` — `{ email, password }` (superadmin ClubApp)
- `GET /clubs/buscar?q=`
- `GET /clubs/slug/:slug` — branding público para login white-label
- `GET /clubs/me` — Bearer (incluye config + onboarding)
- `PATCH /clubs/me` — config: cuota, logo, color, reglas
- `POST /clubs/me/logo` — multipart `file` (JPG/PNG/WEBP/GIF, máx. 2 MB).  
  Con `IMAGEKIT_PRIVATE_KEY` sube a ImageKit (CDN) y guarda esa URL en `logo_url`. Sin ImageKit (dev), guarda en disco `uploads/logos/` y `logo_url` queda `/uploads/logos/...`.
- `PATCH /clubs/me/onboarding` — primer acceso (titular, CUIT/CUIL, branding, nueva pass)

## Plataforma (superadmin)

JWT con `role: platform` (sin `club_id`).

- `GET /platform/clubs` — listado + counts
- `GET /platform/clubs/:id`
- `POST /platform/clubs` — alta `{ nombre, admin_email, admin_nombre?, precio_usd_mes }`  
  Genera slug + password aleatoria. Respuesta incluye `credentials_once` (email, password, login_url) **solo en el create** y `mail.sent` (true si SMTP está configurado).
- `PATCH /platform/clubs/:id` — branding, plan, `precio_usd_mes`, `activo` (suspender: el mail del admin **sigue ocupado**)
- `DELETE /platform/clubs/:id` — baja lógica: `activo=false`, `eliminado=true`, membresías `eliminado=true`. El club queda en DB, no entra, y el mail del admin **se libera**. No borra filas.
- `POST /platform/clubs/:id/admins` — agregar admin/entrada al club
- `GET /platform/admins` — superusuarios ClubApp
- `POST /platform/admins` — `{ email, nombre, password }` (mín. 8)
- `PATCH /platform/admins/:id` — `{ nombre?, password?, activo? }` (no se puede desactivar el último ni a uno mismo)

## Socios / Admins

- `GET|POST /socios` · `PATCH|DELETE /socios/:id`
- `POST /socios/import-csv` — `{ csv }` o multipart
- `GET|POST /admins` · `PATCH|DELETE /admins/:id` (rol admin)

## Pagos

- `GET /pagos/resumen?mes=YYYY-MM`
- `POST /pagos/cobrar-mes` · `POST /api/cuotas/generar-links`
- `PATCH /pagos/:id/marcar-manual`
- `POST /api/webhook/mp` (público)

## Reportes

- `GET /reportes/hoy` — cobranza %, deudores, reservas hoy, horarios hoy, alertas_fuga_count
- `GET /reportes/alerta-fuga` — deuda ≥ regla_moroso o asistencia &lt; 50%
- `GET /reportes/cumpleanos?mes=`
- `POST /reportes/cumpleanos/generar-noticias` — noticias de cumples de hoy si `cumples_auto`

## Espacios / Reservas

- `GET|POST /espacios` · `PATCH|DELETE /espacios/:id`
- `GET /espacios/:id/disponibilidad?fecha=YYYY-MM-DD`
- `GET /reservas?desde=&hasta=&espacio_id=`
- `POST /reservas` — valida solape, moroso, max activas
- `PATCH /reservas/:id/cancelar`

## Horarios / Noticias

- `GET|POST /horarios` · `PATCH|DELETE /horarios/:id`
- `GET|POST /noticias?es_evento=` · `PATCH|DELETE /noticias/:id`

## Familias / Actividades

- `GET|POST /familias` · `PATCH|DELETE /familias/:id`
- `GET|POST /actividades` · `PATCH|DELETE /actividades/:id`
- `GET|POST /actividades/:id/socios` — `{ socio_ids }`

## Cobros profe / Liquidaciones

- `POST /cobros-profe` · `GET /cobros-profe?mes=`
- `POST /liquidaciones-profe/cerrar-mes` — `{ mes, profe_id }`
- `GET /liquidaciones-profe?mes=`
- `PATCH /liquidaciones-profe/:id/marcar-pagada`

## Torneos

- `GET|POST /torneos` · `PATCH|DELETE /torneos/:id`
- `POST|GET /torneos/:id/partidos`
- `GET /torneos/:id/tabla`
- `PATCH /partidos/:id/resultado` — `{ goles_a, goles_b, jugado? }`

## Notas

- Sin `MP_ACCESS_TOKEN` los links de cobro son **mock**.
- Push FCM: aún stub (`push_enviados: 0`).
- ClubApp no custodia fondos.
- Mail de alta: configurar `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` en `apps/api/.env`. Sin eso, `mail.sent=false` y se puede copiar el texto.
- Logos: `IMAGEKIT_PRIVATE_KEY` en `apps/api/.env` (dashboard ImageKit → Developer options). Sin eso, disco local.
