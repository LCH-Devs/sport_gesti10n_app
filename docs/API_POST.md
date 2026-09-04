v# Bodies de POST — qué debe mandar el front

Base URL: `http://localhost:3001`

Fuente: DTOs en `apps/api/src/**/dto`. Cualquier campo extra → **400** (`forbidNonWhitelisted`).

## Reglas comunes

- `Content-Type: application/json` salvo donde se indica multipart.
- **Nunca** mandar `club_id` en el body de rutas de club. El tenant sale del JWT.
- IDs de persona (`socio_id`, `titular_id`, `profe_id`, `membresia_id`) son **`membresia.id`**, no `usuario.id`.
- Auth de club: `Authorization: Bearer <token>` y opcional `X-Club-Slug` (tiene que coincidir con el JWT).
- Campos extra o tipos mal → 400. El pipe transforma strings numéricos a number cuando el DTO usa `@Type(() => Number)`.

### Formatos

| Tipo | Regla |
|------|--------|
| email | email válido, máx. 254 |
| nombre de persona | 2–80, solo letras y espacios (incluye tildes y ñ) |
| password fuerte (altas) | mín. 8, mayúscula, minúscula, número y especial `! @ # $ % & * _ - + =`, máx. 72 |
| password de login | mín. 4, máx. 72 (no exige complejidad) |
| DNI | 7 u 8 dígitos |
| teléfono (solicitudes) | 8–20 chars: dígitos, espacios, `+`, `-`, `()` |
| mes | `YYYY-MM` |
| hora | `HH:mm` (00:00–23:59) |
| fecha ISO | `IsDateString` (ej. `2026-09-04` o `2026-09-04T18:00:00.000Z`) |

**Roles**

- Comisión (staff): JWT `admin` o `entrada`. Mutaciones marcadas “solo admin” = `AdminRoleGuard`.
- Plataforma: JWT `role: platform`.
- Público: sin Bearer.

---

## Auth (público salvo switch)

### `POST /auth/login`

También: `POST /auth/admin/login` y `POST /auth/socio/login` (mismo body).

```json
{
  "club_slug": "club-prueba",
  "email": "admin@clubprueba.com",
  "password": "admin123"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `email` | sí | |
| `password` | sí | mín. 4 |
| `club_slug` | no | máx. 60. Si hay varias membresías, ayuda a elegir club |

---

### `POST /auth/platform/login`

Público. Superadmin ClubApp.

```json
{
  "email": "platform@clubapp.com",
  "password": "platform123"
}
```

| Campo | Req |
|-------|-----|
| `email` | sí |
| `password` | sí (mín. 4) |

---

### `POST /auth/switch`

JWT de club (cualquier rol de membresía).

```json
{
  "membresia_id": 12
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `membresia_id` | sí | integer, `membresia.id` de ese usuario |

---

## Landing (público)

### `POST /solicitudes`

Sin JWT. Throttle 5/min por IP. El back fija `estado: pendiente`.

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "nombre_club": "Club Barrio Norte",
  "email": "ana@mail.com",
  "telefono": "11 5555-1234",
  "cantidad_miembros": 80
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `nombre` | sí | nombre de persona |
| `apellido` | sí | nombre de persona |
| `nombre_club` | sí | 2–120 |
| `email` | sí | |
| `telefono` | sí | ver formato teléfono |
| `cantidad_miembros` | sí | integer 0–99999 |
| `cantidad_socios` | no | **no usar en landing**; si viene, 0–99999 |

No mandar `estado`, `fecha_solicitud` ni `club_id`.

---

## Plataforma (JWT `platform`)

### `POST /platform/clubs`

```json
{
  "nombre": "Club Ejemplo",
  "admin_email": "admin@ejemplo.com",
  "admin_nombre": "Juan Pérez",
  "precio_usd_mes": 49
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `nombre` | sí | 2–120 |
| `admin_email` | sí | |
| `precio_usd_mes` | sí | number ≥ 0 |
| `admin_nombre` | no | nombre de persona |

El back genera la password temporal. No mandar `password` ni `slug`.

---

### `POST /platform/clubs/:id/admins`

`:id` = club. Body:

```json
{
  "email": "entrada@ejemplo.com",
  "nombre": "María López",
  "password": "Entrada1!",
  "rol": "entrada"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `email` | sí | |
| `nombre` | sí | nombre de persona |
| `password` | sí | password fuerte |
| `rol` | no | `admin` \| `entrada` (default en servicio: admin) |

---

### `POST /platform/admins`

Alta de superadmin ClubApp (no es usuario de club).

```json
{
  "email": "otro@clubapp.com",
  "nombre": "Sofía Ruiz",
  "password": "Platform1!"
}
```

| Campo | Req |
|-------|-----|
| `email` | sí |
| `nombre` | sí |
| `password` | sí (fuerte) |

---

## Club — comisión

Salvo que se indique otra cosa: JWT staff. **POST de alta: solo `admin`.**

### `POST /clubs/me/logo`

Multipart, no JSON.

- Campo archivo: **`file`**
- Tipos: JPG / PNG / WEBP / GIF
- Máx. 2 MB

---

### `PATCH /clubs/me/onboarding`

Solo admin. Primer acceso (si `onboarding_completo` ya es true → 400).

```json
{
  "titular_nombre": "Juan",
  "titular_apellido": "Pérez",
  "cuit_cuil": "20123456789",
  "direccion": "Av. Siempre Viva 123",
  "provincia": "Buenos Aires",
  "ciudad": "La Plata",
  "ubicacion_json": { "provincia": { "id": "06", "nombre": "Buenos Aires" } },
  "telefono_club": "2215551234",
  "logo_url": "https://cdn.ejemplo.com/logo.png",
  "color_primario": "#2563eb",
  "color_secundario": "#0f172a",
  "color_terciario": "#f59e0b",
  "cuota_monto": 5000,
  "nueva_password": "ClubApp1!",
  "bloquear_entrada": false,
  "deportes": ["padel", "futbol"],
  "descuento_familiar_pct": 10
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `titular_nombre` | sí | nombre de persona |
| `titular_apellido` | sí | nombre de persona |
| `cuit_cuil` | sí | 11 dígitos |
| `nueva_password` | sí | password fuerte |
| `direccion` | no | máx. 200 |
| `provincia` | no | máx. 80 |
| `ciudad` | no | máx. 80 |
| `ubicacion_json` | no | objeto |
| `telefono_club` | no | máx. 30 |
| `logo_url` | no | máx. 500 |
| `color_primario` | no | `#RRGGBB` |
| `color_secundario` | no | `#RRGGBB` o `null` |
| `color_terciario` | no | `#RRGGBB` o `null` |
| `cuota_monto` | no | number ≥ 0 |
| `bloquear_entrada` | no | boolean |
| `deportes` | no | `string[]` (máx. 30 ítems, 60 chars c/u). No crea espacios |
| `descuento_familiar_pct` | no | 0–100. Se guarda; **no** se aplica aún en cobros |

No mandar `passwordConfirm` ni `club_id`. Los espacios del step de deportes van a `POST /espacios`.

`GET /clubs/me` y `PATCH /clubs/me` también aceptan/devuelven `deportes` y `descuento_familiar_pct`.

---

### `POST /socios`

```json
{
  "dni": "30111222",
  "nombre": "Carlos",
  "apellido": "Gómez",
  "email": "carlos@mail.com",
  "telefono": "1155550000",
  "password": "Socio123!",
  "rol": "socio",
  "fecha_nacimiento": "1990-05-12"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `dni` | sí | 7–8 dígitos, único **por club** |
| `nombre` | sí | |
| `apellido` | sí | |
| `email` | sí | único global en `Usuario`; si existe, se vincula membresía |
| `telefono` | no | máx. 30 (string libre, no el regex de solicitudes) |
| `password` | no | si falta o vacío → default **`socio123`**. Si viene, password fuerte |
| `rol` | no | `socio` \| `profe` (default `socio`) |
| `fecha_nacimiento` | no | ISO date |

También: **`GET /socios/:id`** (staff). Id = membresía. 404 si no es de este club.

---

### `POST /socios/import-csv`

Solo admin. Una de dos formas:

**JSON**

```json
{
  "csv": "dni,nombre,apellido,email,telefono\n30111222,Carlos,Gomez,carlos@mail.com,1155550000"
}
```

**Multipart:** campo archivo `file` (texto CSV UTF-8) **o** campo `csv` en el body.

Cabecera requerida: `dni,nombre,apellido,email` y opcional `telefono`.

---

### `POST /admins`

Solo admin.

```json
{
  "email": "otroadmin@club.com",
  "nombre": "Lucía Díaz",
  "password": "Admin123!",
  "rol": "admin"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `email` | sí | |
| `nombre` | sí | |
| `password` | sí | fuerte |
| `rol` | no | `admin` \| `entrada` |

---

### `POST /pagos/cobrar-mes`

Alias: `POST /api/cuotas/generar-links`. Solo admin. Body opcional (se puede `{}`).

```json
{
  "mes": "2026-09",
  "monto": 15000
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `mes` | no | `YYYY-MM`; si falta, el back usa el mes actual |
| `monto` | no | number ≥ 1; si falta, usa la cuota del club |

---

### `POST /reportes/cumpleanos/generar-noticias`

Solo admin. **Sin body** (`{}` o vacío).

---

### `POST /espacios`

Solo admin.

```json
{
  "nombre": "Cancha 1",
  "tipo": "padel",
  "descripcion": "Techada",
  "duracion_slot_min": 60,
  "precio_opcional": 8000,
  "hora_apertura": "08:00",
  "hora_cierre": "23:00"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `nombre` | sí | máx. 120 |
| `tipo` | sí | `padel` \| `futbol` \| `basquet` \| `tenis` \| `quincho` \| `salon` \| `cancha` \| `otro` |
| `descripcion` | no | máx. 500 |
| `duracion_slot_min` | no | number ≥ 15; default DB **60** |
| `precio_opcional` | no | number ≥ 0 |
| `hora_apertura` | no | `HH:mm`; default DB **08:00** |
| `hora_cierre` | no | `HH:mm`; default DB **23:00** |

---

### `POST /reservas`

Solo admin.

```json
{
  "espacio_id": 1,
  "socio_id": 42,
  "inicio": "2026-09-04T18:00:00.000Z",
  "fin": "2026-09-04T19:00:00.000Z",
  "nota": "Cumple del pibe"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `espacio_id` | sí | integer |
| `socio_id` | sí | integer, membresía socio/profe |
| `inicio` | sí | ISO datetime |
| `fin` | sí | ISO datetime |
| `nota` | no | máx. 300 |

El back valida solape, moroso y tope de reservas activas.

---

### `POST /horarios`

Solo admin.

```json
{
  "titulo": "Fútbol infantiles",
  "dias": "Lun y Mié",
  "hora_inicio": "18:00",
  "hora_fin": "19:30",
  "profe_id": 55,
  "activo": true
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `titulo` | sí | máx. 120 |
| `dias` | sí | máx. 80, texto libre |
| `hora_inicio` | sí | `HH:mm` |
| `hora_fin` | sí | `HH:mm` |
| `profe_id` | no | membresía rol `profe` |
| `activo` | no | default `true` |

---

### `POST /noticias`

Solo admin.

```json
{
  "titulo": "Asamblea",
  "cuerpo": "El sábado a las 18.",
  "imagen_url": "https://cdn.ejemplo.com/foto.jpg",
  "es_evento": true,
  "fecha": "2026-09-10",
  "published": true
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `titulo` | sí | máx. 200 |
| `cuerpo` | sí | máx. 10000 |
| `imagen_url` | no | máx. 500 |
| `es_evento` | no | default `false` |
| `fecha` | no | ISO; si falta, now |
| `published` | no | default `true` |

---

### `POST /familias`

Solo admin.

```json
{
  "nombre": "Familia Gómez",
  "titular_id": 42,
  "socio_ids": [42, 43, 44]
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `nombre` | sí | máx. 80 |
| `titular_id` | sí | membresía |
| `socio_ids` | no | array de integers únicos |

---

### `POST /actividades`

Solo admin.

```json
{
  "nombre": "Natación",
  "modo_cobro": "club",
  "monto_adicional": 2000,
  "profe_id": 55,
  "comision_tipo": "porcentaje",
  "comision_valor": 20,
  "activo": true
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `nombre` | sí | máx. 120 |
| `modo_cobro` | sí | `club` \| `profe` |
| `monto_adicional` | no | ≥ 0; default **0** |
| `profe_id` | no | membresía profe |
| `comision_tipo` | no | `porcentaje` \| `fijo` |
| `comision_valor` | no | ≥ 0 |
| `activo` | no | default `true` |

---

### `POST /actividades/:id/socios`

Solo admin. Reemplaza el set de socios de esa actividad.

```json
{
  "socio_ids": [42, 43, 44]
}
```

| Campo | Req |
|-------|-----|
| `socio_ids` | sí (array de integers únicos; puede ser `[]`) |

---

### `POST /cobros-profe`

Solo admin.

```json
{
  "actividad_id": 3,
  "socio_id": 42,
  "mes": "2026-09",
  "monto_alumno": 12000,
  "medio": "efectivo",
  "nota": "Pagó en sede"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `actividad_id` | sí | |
| `socio_id` | sí | membresía |
| `mes` | sí | `YYYY-MM` |
| `monto_alumno` | sí | number ≥ 0 |
| `medio` | no | máx. 40 |
| `nota` | no | máx. 300 |

---

### `POST /liquidaciones-profe/cerrar-mes`

Solo admin.

```json
{
  "mes": "2026-09",
  "profe_id": 55
}
```

| Campo | Req |
|-------|-----|
| `mes` | sí (`YYYY-MM`) |
| `profe_id` | sí (membresía profe) |

---

### `POST /torneos`

Solo admin.

```json
{
  "nombre": "Apertura 2026",
  "deporte": "fútbol",
  "estado": "activo"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `nombre` | sí | máx. 120 |
| `deporte` | sí | máx. 60 |
| `estado` | no | `activo` \| `cerrado` \| `finalizado` (default DB `activo`) |

---

### `POST /torneos/:id/partidos`

Solo admin. `:id` = torneo.

```json
{
  "rival_a": "Equipo A",
  "rival_b": "Equipo B",
  "fecha": "2026-09-20T15:00:00.000Z"
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `rival_a` | sí | máx. 80 |
| `rival_b` | sí | máx. 80 |
| `fecha` | no | ISO datetime |

---

## Social (JWT cualquier rol para leer; POST solo admin de club o platform)

### `POST /social/posts`

```json
{
  "titulo": "Torneo interclub",
  "cuerpo": "Inscripciones abiertas.",
  "imagen_url": "https://cdn.ejemplo.com/flyer.jpg",
  "fecha_evento": "2026-10-01",
  "lugar": "Sede central",
  "visible": true,
  "club_id": 1
}
```

| Campo | Req | Notas |
|-------|-----|--------|
| `titulo` | sí | máx. 200 |
| `cuerpo` | sí | máx. 10000 |
| `imagen_url` | no | máx. 500 |
| `fecha_evento` | no | ISO date |
| `lugar` | no | máx. 200 |
| `visible` | no | boolean |
| `club_id` | no | **solo platform**. El admin del club lo ignora; no lo mandes desde el panel del club |

---

## No lo manda el front

### `POST /api/webhook/mp`

Público. Lo llama MercadoPago, no el panel.

Forma esperada (simplificada):

```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": { "id": "1234567890" }
}
```

Si no hay `data.id`, el back responde `{ ok: true, skipped: true }`.

---

## Resumen rápido (mínimo por endpoint)

| POST | Body mínimo |
|------|-------------|
| `/auth/login` | `{ email, password }` |
| `/auth/admin/login` | igual |
| `/auth/socio/login` | igual |
| `/auth/platform/login` | `{ email, password }` |
| `/auth/switch` | `{ membresia_id }` |
| `/solicitudes` | `{ nombre, apellido, nombre_club, email, telefono, cantidad_miembros }` |
| `/platform/clubs` | `{ nombre, admin_email, precio_usd_mes }` |
| `/platform/clubs/:id/admins` | `{ email, nombre, password }` |
| `/platform/admins` | `{ email, nombre, password }` |
| `/clubs/me/logo` | multipart `file` |
| `/clubs/me/onboarding` (PATCH) | `{ titular_nombre, titular_apellido, cuit_cuil, nueva_password }` |
| `/socios` | `{ dni, nombre, apellido, email }` |
| `/socios/import-csv` | `{ csv }` o multipart `file` |
| `/admins` | `{ email, nombre, password }` |
| `/pagos/cobrar-mes` | `{}` |
| `/api/cuotas/generar-links` | `{}` |
| `/reportes/cumpleanos/generar-noticias` | (vacío) |
| `/espacios` | `{ nombre, tipo }` |
| `/reservas` | `{ espacio_id, socio_id, inicio, fin }` |
| `/horarios` | `{ titulo, dias, hora_inicio, hora_fin }` |
| `/noticias` | `{ titulo, cuerpo }` |
| `/familias` | `{ nombre, titular_id }` |
| `/actividades` | `{ nombre, modo_cobro }` |
| `/actividades/:id/socios` | `{ socio_ids }` |
| `/cobros-profe` | `{ actividad_id, socio_id, mes, monto_alumno }` |
| `/liquidaciones-profe/cerrar-mes` | `{ mes, profe_id }` |
| `/torneos` | `{ nombre, deporte }` |
| `/torneos/:id/partidos` | `{ rival_a, rival_b }` |
| `/social/posts` | `{ titulo, cuerpo }` |

Listado/detalle de respuestas: [`API.md`](./API.md).
