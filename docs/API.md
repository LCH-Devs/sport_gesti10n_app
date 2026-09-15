# ClubApp API — Endpoints (Fase 1 + 1b)

Base URL: `http://localhost:3001`

Bodies de cada **POST** (campos, validación, ejemplos): [`API_POST.md`](./API_POST.md).

Headers tipicos (rutas autenticadas):

- `Authorization: Bearer <token>`
- `X-Club-Slug: club-prueba` (opcional si el JWT ya trae `club_id`)

El JWT dura **8 horas**. Login y switch devuelven `expires_in` (segundos). En cada request se revalida la membresía/club (o el PlatformAdmin): baja, suspensión o club inactivo → **401**. Ver [`FRONT_SESION.md`](./FRONT_SESION.md).

Body con campos que el DTO no declara → **400**. Login público (`/auth/login` y aliases): **429** si hay demasiados intentos.

## Credenciales seed

- **Plataforma (superadmin):** `platform@clubapp.com` / `platform123` → web `/platform/login`
- Slug club: `club-prueba` → web `/login/club-prueba`
- Admin club: `admin@clubprueba.com` / `admin123`
- Pass maestra (soporte, **solo no-prod**): `clubapp-master-dev` (env `PLATFORM_MASTER_PASSWORD`). En `NODE_ENV=production` no funciona.
- Socios: DNI `30111222|30222333|30333444` / pass `socio123`

## Health / Auth / Clubs

- `GET /health`
- `POST /auth/login` — unificado (comisión / socio / profe). `{ club_slug?, email, password }`  
  Respuesta: `access_token`, **`expires_in`** (28800), `role`, `cuentas`, `must_complete_onboarding`, `must_change_password`, `impersonated_by_platform`, `admin` o `socio`, `club`  
  **401** credenciales inválidas · **429** demasiados intentos
- `POST /auth/admin/login` · `POST /auth/socio/login` — aliases del anterior  
  Acepta la pass del admin **o**, fuera de production, `PLATFORM_MASTER_PASSWORD` (solo staff)
- `POST /auth/switch` — Bearer, `{ membresia_id }` (emite JWT nuevo, otras 8 h). Sin rate limit de login.
- `POST /auth/platform/login` — `{ email, password }` (superadmin ClubApp). También `expires_in` y 429.
- `POST /auth/forgot-password` — `{ email }`. Respuesta genérica siempre; si existe, envía enlace temporal de 60 minutos.
- `POST /auth/reset-password` — `{ token, password }`. Token de un solo uso; contraseña mínima de 8 caracteres.
- Cambiar la contraseña (reset, `PATCH /admins/me`, `PATCH /socio/me` o un admin reseteándole la clave a otro) actualiza `Usuario.password_changed_at`; cualquier JWT con `iat` anterior a esa fecha deja de ser válido (401) aunque no haya expirado — ver `session-viva.ts`.
- `must_change_password` en la respuesta de login aplica también a socio/profe, no solo a staff: un alta de socio sin `password` propia queda con la clave predecible `socio<DNI>` y `must_change_password: true` hasta que cambie la clave.
- `GET /clubs/buscar?q=`
- `GET /clubs/slug/:slug` — branding público para login white-label
- `GET /clubs/me` — Bearer (incluye config + onboarding, `deportes`, `descuento_familiar_pct`)
- `PATCH /clubs/me` — config: cuota (Socio pleno), logo, color, reglas, nombre, `deportes?`, `descuento_familiar_pct?` (0–100). El nombre no puede coincidir con otro club vivo
- `POST /clubs/me/logo` — multipart `file` (JPG/PNG/WEBP/GIF, máx. 2 MB).  
  Con `IMAGEKIT_PRIVATE_KEY` sube a ImageKit (CDN) y guarda esa URL en `logo_url`. Sin ImageKit (dev), guarda en disco `uploads/logos/` y `logo_url` queda `/uploads/logos/...`.
- `PATCH /clubs/me/onboarding` — primer acceso. Body: titular, CUIT/CUIL, branding, `nueva_password` (fuerte), `cuota_monto` (Socio pleno), `categorias?` (tipos extra con monto), y opcional `bloquear_entrada`, `deportes` (`string[]`), `descuento_familiar_pct` (0–100). Los espacios se crean aparte con `POST /espacios`. El % familiar se aplica al **cobrar el mes** si la familia tiene 2+ socios no bonificados.

## Plataforma (superadmin)

JWT con `role: platform` (sin `club_id`).

- `GET /platform/clubs` — listado + counts + `plan`, `plan_hasta`, pendiente
- `GET /platform/resumen` — clubes activos, socios totales, solicitudes, planes sin confirmar
- `GET /platform/plan-tramos` · `PUT /platform/plan-tramos` — tramos SaaS (`nombre`, `desde`, `hasta`, `precio_usd`)
- `GET /platform/plan-tramos/preview?cantidad=` — plan y precio para esa cantidad
- `GET /platform/planes/pendientes` — clubes over-limit que no confirmaron el upgrade
- `POST /platform/clubs/:id/plan/confirmar` — soporte fuerza la confirmación (no cobra)
- `POST /platform/clubs/:id/plan/reenviar-mail`
- `GET /platform/clubs/:id`
- `POST /platform/clubs` — alta `{ nombre, admin_email, admin_nombre?, cantidad_miembros, precio_usd_mes? }`  
  `cantidad_miembros` elige el tramo vigente. `precio_usd_mes` es override opcional.  

  Siempre genera **contraseña temporal nueva** (también si el email ya existía por un club dado de baja).  
  El **nombre** no puede repetirse si hay otro club vivo (activo o suspendido); un club dado de baja sí libera el nombre.  
  `credentials_once`: `{ email, password, login_url }` — `login_url` es `{WEB_APP_URL}/login` (sin slug/subdominio).  
  Mail de bienvenida (SMTP) con las mismas credenciales.
- `PATCH /platform/clubs/:id` — branding, plan, `precio_usd_mes`, `activo`, `nombre` (mismo criterio de unicidad)  
  - `activo: false` (suspender): el mail del admin **sigue ocupado**. Mail de aviso de suspensión.  
  - `activo: true` (rehabilitar): pass temporal **nueva**, `must_change_password` en el admin, onboarding **no** se resetea. Mail de rehabilitación. Respuesta puede incluir `credentials_once`.
- `DELETE /platform/clubs/:id` — baja lógica: `activo=false`, `eliminado=true`, membresías `eliminado=true`. El club queda en DB, no entra, y el mail del admin **se libera**. Mail de aviso de eliminación. Un alta posterior con ese mail es un club **nuevo** (pass nueva + onboarding).
- `POST /platform/clubs/:id/admins` — agregar admin/entrada al club
- `GET /platform/admins` — superusuarios ClubApp
- `POST /platform/admins` — `{ email, nombre, password }` (mín. 8)
- `PATCH /platform/admins/:id` — `{ nombre?, password?, activo? }` (no se puede desactivar el último ni a uno mismo)
- `GET /platform/solicitudes?estado=` — leads de la landing (`pendiente` | `trial` | `aprobada` | `cancelada`). Sin `eliminado`.
- `GET /platform/solicitudes/pendientes/count` — `{ count }` para Salud del Sistema
- `GET /platform/solicitudes/:id`
- `PATCH /platform/solicitudes/:id` — `{ estado }`. `trial` setea `fecha_trial` (prueba 30 días) y resetea `mail_aviso_trial_enviado`. A los 20 días el back manda un mail de “quedan 10 días” (SMTP). `aprobada` / `cancelada` / `borradas` setean su fecha. `borradas` pone `eliminado=true`.

## Solicitudes (landing, público)

- `POST /solicitudes` — sin JWT. Body `{ nombre, apellido, nombre_club, email, telefono, cantidad_miembros }`. Siempre `estado: pendiente` y `fecha_solicitud` (fecha y hora del alta). Respuesta `{ id, estado, fecha_solicitud }`. **429** si hay demasiados envíos (5/min por IP). Ver [`FRONT_SOLICITUDES.md`](./FRONT_SOLICITUDES.md).

## Socios / Admins

- `GET|POST /socios` · `GET|PATCH|DELETE /socios/:id`
- Profesor: `rol=profe`; `es_socio` default `true`. Con `es_socio=false`
  conserva membresía/login pero queda fuera de cuota, familia, reservas y
  límite SaaS.
- `POST /socios` y `POST /familias` aceptan `acepta_upgrade` si el alta cruza el tope del plan. Sin el flag → **409** `PLAN_UPGRADE_REQUIRED` (el socio no se crea).
- Alta de socio/familia (solo personas nuevas): `inscripcion?` + `inscripcion_monto?` + `inscripcion_cuotas?` (1–12) y `bonificar_meses?` (`YYYY-MM[]`). Sin tilde / sin monto = sin deuda de inscripción. Los meses bonificados no generan cuota al cobrar.
- `POST /socios/import-csv` — `{ csv }` o multipart `file` (CSV / Excel `.xlsx` / `.xls`). Si el lote cruza el tope, 409 y no procesa nada. Reenviar con `acepta_upgrade=true`.
- `GET /socios/import-template` — plantilla Excel (solo admin)
- `GET /socios/export-csv` — CSV de todos los socios del club (staff), mismas columnas que la plantilla de import + `estado`; reimportable tal cual
- `GET|PATCH /socio/me` (JWT de socio/profe) — devuelve `{ socio, club, pagos, noticias, actividades }` (objeto anidado, no aplanado); `pagos` son las últimas 12 cuotas propias
- `GET /clubs/me/plan` — uso vs tope + pendiente
- `POST /clubs/me/plan/confirmar` — el admin del club confirma el upgrade (aplica el 1° del mes siguiente)
- `GET /public/plan/confirmar?token=` — mismo efecto, desde el mail (sin JWT)
- `GET|POST /admins` · `PATCH|DELETE /admins/:id` (rol admin)

## Categorías de cuota

- `GET|POST /categorias-cuota` · `PATCH|DELETE /categorias-cuota/:id` — tipos de socio y su monto (Socio pleno es el default; no se borra)

## Pagos

- `GET /pagos/resumen?mes=YYYY-MM` — incluye `tipo` (`cuota` | `inscripcion`), `concepto`, `grupo_familiar`
- `GET /pagos/estado-mes?mes=YYYY-MM` — snapshot de cuota del mes por socio (`pagado` | `pendiente` | `bonificado` | `sin_generar`). En familia, el cobro es el del titular
- `GET /pagos/cuenta?socio_id=` **o** `familia_id=` — historial de la cuenta (cuota familiar + inscripciones propias)
- `POST /pagos/cobrar-mes` · `POST /api/cuotas/generar-links` — un pago de cuota por socio suelto; si hay familia, **un solo cobro al titular** (suma de categorías − `%` familiar). Idempotente por `(socio_id, mes, tipo)`
- `PATCH /pagos/:id/marcar-manual`
- `POST /api/webhook/mp` (público)

## Reportes

- `GET /reportes/hoy` — cobranza %, deudores, reservas hoy, horarios hoy, alertas_fuga_count
- `GET /reportes/alerta-fuga` — deuda ≥ regla_moroso o asistencia &lt; 50%
- `GET /reportes/cumpleanos?mes=`
- `POST /reportes/cumpleanos/generar-noticias` — noticias de cumples de hoy si `cumples_auto`

## Espacios / Reservas

- `GET|POST /espacios` · `PATCH|DELETE /espacios/:id` (staff)
- `GET /espacios/ocupacion?fecha=YYYY-MM-DD` — % día/semana/mes y calor mañana/tarde/noche por espacio (staff). Ventana útil = apertura → cierre − 1 h
- `GET /espacios/:id/disponibilidad?fecha=YYYY-MM-DD` (staff). Slots libres; excluye reservas confirmadas, eventos (con `fin` y canchas) y entrenamientos con `espacio_id`. Incluye inicios de la grilla y el instante en que se libera el espacio (p. ej. entrenamiento hasta 19:30 → turno 19:30–20:30). Último turno termina en cierre − 1 h
- `GET /reservas?desde=&hasta=&espacio_id=` (staff)
- `POST /reservas` — valida que el inicio no esté en el pasado, que inicio/fin estén en el horario útil del espacio (apertura → cierre − 1 h), que la duración sea al menos un turno de `duracion_slot_min` y que el inicio caiga en la grilla **o** en el momento en que se libera el espacio (sin 18:43; sí 19:30–20:30 si un entrenamiento termina 19:30), solape con reserva/evento/horario, moroso, max activas; solape entre reservas también con transacción Serializable + `EXCLUDE` constraint en DB (staff, `socio_id` en el body)
- `PATCH /reservas/:id` — editar espacio, socio, inicio, fin, nota (solo confirmada; mismas reglas de horario y solape, ignora la propia reserva)
- `PATCH /reservas/:id/cancelar` (staff, cualquier socio del club)
- Portal socio (JWT de socio, o profe con `es_socio=true`, sin `socio_id` en el body — siempre es el propio):
  - `GET /socio/espacios` — solo espacios activos
  - `GET /socio/espacios/:id/disponibilidad?fecha=YYYY-MM-DD`
  - `GET /socio/reservas` — solo las propias
  - `POST /socio/reservas` — crea a nombre del socio autenticado
  - `PATCH /socio/reservas/:id/cancelar` — solo si la reserva es propia (404 si no)
- Portal profesor (`role=profe`):
  - `GET /profe/me` — perfil, horarios propios y últimas 12 liquidaciones

## Horarios / Noticias

- `GET|POST /horarios` · `PATCH|DELETE /horarios/:id` — `dias` nombres completos (`Lunes,Miércoles,Viernes`); `espacio_id?` opcional: si hay cancha, el entrenamiento ocupa ese espacio (recurrencia semanal, se chequea ~8 semanas)
- `GET|POST /noticias?es_evento=` · `PATCH|DELETE /noticias/:id`

## Eventos del club

- `GET|POST /eventos` · `GET|PATCH|DELETE /eventos/:id` (staff / mutaciones admin)
- Body extra: `fin?` (ISO), `todos_espacios?`, `espacio_ids?`. Sin canchas el evento no bloquea reservas. Con canchas hace falta `fin` y no puede pisar reserva/evento/entrenamiento
- `GET /eventos-publicos` — feed público cross-tenant (`publicado` + `visibilidad=publico`)

## Social (feed entre clubes)

No es la solapa de eventos del club (`/noticias`). JWT de **cualquier** rol (o plataforma). Ver [`FRONT_SOCIAL.md`](./FRONT_SOCIAL.md).

- `GET /social/posts` — feed (`take`, `skip`, `club_id?`). Solo visibles, club vivo o post ClubApp
- `GET /social/posts/:id`
- `GET /social/mis-publicaciones` — admin: las de su club (incluye ocultas) · platform: todas · socio/entrada: 403
- `POST /social/posts` — solo `admin` o `platform`. Body `{ titulo, cuerpo, imagen_url?, fecha_evento?, lugar?, visible?, club_id? }` (`club_id` solo lo usa platform)
- `PATCH /social/posts/:id` · `DELETE /social/posts/:id` — autor-club admin o platform

## Familias / Actividades

- `GET|POST /familias` · `GET|PATCH|DELETE /familias/:id` — alta: `titular_id` **o** `titular` (datos de socio nuevo); `socio_ids` y/o `socios_nuevos`
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
