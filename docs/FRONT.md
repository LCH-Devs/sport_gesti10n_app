# Guía para Front (Next.js) — ClubApp Arg

Documento para que el front pueda **levantar el entorno solo**, entender **qué hay implementado** y ubicarse en el monorepo (`apps/api` + `apps/web`).

Referencia de endpoints: [`docs/API.md`](./API.md)  
**Manual de uso / QA:** [`docs/MANUAL_USUARIO.md`](./MANUAL_USUARIO.md)

---

## Mapa del monorepo

```
mi_club_online/
├── docker-compose.yml      # Postgres local (servicio db)
├── .env.example            # plantilla de env
├── docs/
│   ├── API.md              # contratos HTTP (source of truth)
│   └── FRONT.md            # este archivo
├── apps/
│   ├── api/                # BACK — NestJS + Prisma (puerto 3001)
│   └── web/                # FRONT — Next.js 14 (puerto 3000)
└── PLAN.md / CARACTERISTICAS.md  # producto
```

| Quién | Carpeta | Qué hace |
|--------|---------|----------|
| Back | `apps/api` | Endpoints, DB, reglas de negocio, MercadoPago |
| Front | `apps/web` | Panel admin (UI), consume la API por HTTP |
| Tester / QA | `docs/API.md` | Probar rutas |

**No edites `apps/api` para maquetar pantallas.** Si falta un campo o endpoint, pedilo al back o abrí PR chico en API.

---

## Qué tenemos hoy (inventario)

Estado actual del milestone **Fase 1 + 1b (web comisión)**. La app móvil Expo **aún no** entra.

### Producto / negocio cubierto

| Área | Estado | Notas |
|------|--------|--------|
| Multi-tenant por club | Listo | JWT `club_id` + header `X-Club-Slug` |
| Superadmin plataforma | Listo | `/platform` — alta de clubes + admin inicial |
| Login admin (comisión / entrada) | Listo | Seed: `admin@clubprueba.com` |
| Branding + config del club | Listo | Cuota, color, logo, reglas moroso/reservas |
| Socios CRUD + import CSV | Listo | También `fecha_nacimiento` |
| Usuarios admin (`admin` / `entrada`) | Listo | |
| Cobros del mes + links MP | Listo | Mock si no hay `MP_ACCESS_TOKEN` |
| Marcar pagado manual | Listo | |
| Webhook MP | Listo (back) | El front no lo llama |
| Dashboard “Hoy en el club” | Listo | `%` cobranza, deudores, reservas, horarios |
| Alerta de Fuga | Listo | Deuda + baja asistencia; link WhatsApp |
| Espacios (canchas/quinchos) | Listo | + disponibilidad por fecha |
| Reservas admin | Listo | Solape, moroso, máx. activas |
| Horarios de actividades | Listo | |
| Noticias / eventos | Listo | |
| Grupos familiares | Listo | |
| Actividades modo club / profe | Listo | Inscripción de socios |
| Cobros profe + liquidaciones | Listo | Cerrar mes / marcar pagada |
| Cumpleaños | Listo | Listado + generar noticias |
| Torneos / partidos / tabla | Listo | |
| Push FCM real | Pendiente | Stub (`push_enviados: 0`) |
| OAuth MP por club | Pendiente | Fase prod |
| Auth socio + app móvil | Pendiente | Fase 2 |
| Modo Entrada QR / carnet | Pendiente | Fase 2 |

### Datos seed (después de migrate + seed)

- **Plataforma:** `platform@clubapp.com` / `platform123` → `/platform/login`
- Club: slug `club-prueba`, color azul, cuota $5000
- Admin: `admin@clubprueba.com` / `admin123` → `/login/club-prueba`
- Socios: Juan, Ana, Luis (profe) — pass `socio123`
- Familia Pérez (Juan titular + Ana)
- Actividades: Fútbol (modo club), Natación (modo profe)
- Espacios: Pádel 1, Quincho grande + 1 reserva demo
- Horario: Fútbol infantil
- Noticia de bienvenida
- Torneo Copa Verano + partidos
- Ana con 2 cuotas pendientes → aparece en **Alerta de Fuga**

---

## Dónde está cada cosa en `apps/api`

La API es **NestJS**. Cada carpeta bajo `src/` es un módulo de dominio (controller + service + dto).

```
apps/api/
├── prisma/
│   ├── schema.prisma          # modelos / tablas
│   ├── seed.ts                # datos demo
│   └── migrations/            # SQL versionado (NO borrar)
│       ├── 20260814132810_init/
│       └── 20260814140733_fase1_alta/
├── src/
│   ├── main.ts                # bootstrap, CORS, puerto 3001
│   ├── app.module.ts          # registra todos los módulos
│   ├── health.controller.ts   # GET /health
│   ├── prisma/                # PrismaService (DB)
│   ├── common/
│   │   ├── tenant.middleware.ts   # resuelve club por X-Club-Slug
│   │   ├── club-id.decorator.ts   # @ClubId()
│   │   └── admin-role.guard.ts    # solo rol admin (no entrada)
│   ├── auth/                  # POST /auth/admin/login, /auth/platform/login
│   ├── platform/              # Superadmin: ABM clubes + admin inicial
│   ├── clubs/                 # buscar, me, PATCH config
│   ├── socios/                # CRUD + import CSV
│   ├── admins/                # CRUD usuarios del club
│   ├── pagos/                 # cobros mes, resumen, webhook MP
│   ├── reportes/              # hoy, alerta-fuga, cumpleaños
│   ├── espacios/              # ABM + disponibilidad
│   ├── reservas/              # listar / crear / cancelar
│   ├── horarios/
│   ├── noticias/
│   ├── familias/
│   ├── actividades/
│   ├── liquidaciones/         # cobros-profe + liquidaciones-profe
│   └── torneos/               # torneos, partidos, tabla
├── .env                       # local (NO commitear) — copiar de .env.example
└── package.json               # start:dev, prisma:migrate, prisma:seed
```

### Módulo → rutas (orientación rápida)

| Carpeta | Prefijo / rutas principales |
|---------|-------------------------------|
| `auth/` | `POST /auth/admin/login`, `POST /auth/platform/login` |
| `platform/` | `GET\|POST /platform/clubs`, `PATCH /platform/clubs/:id`, admins |
| `clubs/` | `GET /clubs/buscar`, `GET /clubs/slug/:slug`, `GET\|PATCH /clubs/me` |
| `socios/` | `GET\|POST /socios`, `POST /socios/import-csv`, `PATCH\|DELETE /socios/:id` |
| `admins/` | `GET\|POST /admins`, `PATCH\|DELETE /admins/:id` |
| `pagos/` | `GET /pagos/resumen`, `POST /pagos/cobrar-mes`, `PATCH /pagos/:id/marcar-manual`, `POST /api/webhook/mp` |
| `reportes/` | `GET /reportes/hoy`, `GET /reportes/alerta-fuga`, cumpleaños |
| `espacios/` | CRUD `/espacios`, `GET /espacios/:id/disponibilidad` |
| `reservas/` | `GET\|POST /reservas`, `PATCH /reservas/:id/cancelar` |
| `horarios/` | CRUD `/horarios` |
| `noticias/` | CRUD `/noticias` |
| `familias/` | CRUD `/familias` |
| `actividades/` | CRUD + `/actividades/:id/socios` |
| `liquidaciones/` | `/cobros-profe`, `/liquidaciones-profe/...` |
| `torneos/` | `/torneos`, `/torneos/:id/partidos`, `/torneos/:id/tabla`, `/partidos/:id/resultado` |

Detalle de bodies y auth: [`API.md`](./API.md).

### Tablas Prisma (schema)

`Club`, `PlatformAdmin`, `Usuario`, `Membresia`, `Pago`, `GrupoFamiliar`, `Actividad`, `SocioActividad`, `CobroProfe`, `LiquidacionProfe`, `Espacio`, `Reserva`, `Horario`, `Noticia`, `Asistencia`, `Torneo`, `Partido`.

Se crean/actualizan con `pnpm db:sync` (Docker solo levanta Postgres vacío).

---

## Dónde está cada cosa en `apps/web`

Next.js **App Router**. Casi todo el panel es client component (`'use client'`) porque habla con la API desde el browser.

```
apps/web/
├── src/
│   ├── lib/
│   │   └── api.ts              # apiFetch, session localStorage, tipos ClubSession
│   └── app/
│       ├── layout.tsx          # layout root + fonts
│       ├── globals.css         # Tailwind / tokens
│       ├── page.tsx            # home pública (redirige / login)
│       ├── login/
│       │   └── page.tsx        # login admin del club
│       ├── platform/
│       │   ├── layout.tsx      # guard sesión plataforma
│       │   ├── login/page.tsx  # login superadmin
│       │   └── page.tsx        # ABM clubes + admin inicial
│       └── admin/
│           ├── layout.tsx      # nav, sesión, --club-primary, logout
│           ├── page.tsx        # Hoy en el club
│           ├── socios/page.tsx
│           ├── cobros/page.tsx
│           ├── usuarios/page.tsx
│           ├── config/page.tsx
│           ├── espacios/page.tsx
│           ├── reservas/page.tsx
│           ├── horarios/page.tsx
│           ├── noticias/page.tsx
│           ├── fuga/page.tsx
│           ├── familias/page.tsx
│           ├── actividades/page.tsx
│           ├── torneos/page.tsx
│           └── liquidaciones/page.tsx
├── .env.local                  # NEXT_PUBLIC_API_URL (crear local)
├── tailwind.config.ts
└── package.json                # npm run dev
```

### Ruta UI → archivo → API que usa

| URL en el browser | Archivo | Endpoints típicos |
|-------------------|---------|-------------------|
| `/login` | `app/login/page.tsx` | slug → `/login/{slug}` |
| `/login/{slug}` | `app/login/[slug]/page.tsx` | `POST /auth/admin/login` + branding |
| `/platform/login` | `app/platform/login/page.tsx` | `POST /auth/platform/login` |
| `/platform` | `app/platform/page.tsx` | `/platform/clubs` |
| `/platform/usuarios` | `app/platform/usuarios/page.tsx` | `/platform/admins` |
| `/admin` | `app/admin/page.tsx` | `GET /reportes/hoy` |
| `/admin/socios` | `admin/socios/page.tsx` | `/socios`, `/socios/import-csv` |
| `/admin/cobros` | `admin/cobros/page.tsx` | `/pagos/resumen`, `/pagos/cobrar-mes`, marcar-manual |
| `/admin/usuarios` | `admin/usuarios/page.tsx` | `/admins` |
| `/admin/config` | `admin/config/page.tsx` | `GET\|PATCH /clubs/me` |
| `/admin/espacios` | `admin/espacios/page.tsx` | `/espacios` |
| `/admin/reservas` | `admin/reservas/page.tsx` | `/reservas`, `/espacios`, `/socios` |
| `/admin/horarios` | `admin/horarios/page.tsx` | `/horarios` |
| `/admin/noticias` | `admin/noticias/page.tsx` | `/noticias` |
| `/admin/fuga` | `admin/fuga/page.tsx` | `/reportes/alerta-fuga` |
| `/admin/familias` | `admin/familias/page.tsx` | `/familias`, `/socios` |
| `/admin/actividades` | `admin/actividades/page.tsx` | `/actividades` |
| `/admin/torneos` | `admin/torneos/page.tsx` | `/torneos`, partidos, tabla |
| `/admin/liquidaciones` | `admin/liquidaciones/page.tsx` | `/liquidaciones-profe`, cerrar-mes |

### Archivos clave para el front

| Archivo | Para qué tocarlo |
|---------|------------------|
| `src/lib/api.ts` | Cliente HTTP + sesión. **Empezá acá** si cambiás auth/headers |
| `src/app/admin/layout.tsx` | Nav, branding, guard de sesión |
| `src/app/login/page.tsx` | Entrada a clubes (slug). El panel interno está en `/platform/login` |
| `src/app/admin/*/page.tsx` | Cada pantalla (UX, formularios, tablas) |
| `src/app/globals.css` | Estilos globales |

Las pantallas actuales son **base funcional** (listar + crear). El trabajo de front es pulir UX/diseño/validaciones **sin romper el contrato** de `API.md`.

---

## TL;DR — ¿Cómo corro la base?

**Cada uno levanta Postgres en su PC con Docker.**  
No hay un contenedor compartido en la nube ni “acceso al Docker de Leandro”. El `docker compose` del repo crea **tu** Postgres local.

```bash
# Desde la raíz del repo
docker compose up db -d
```

Eso es suficiente. API y Web se corren con Node en local (no hace falta el profile `full`).

| Servicio | Cómo | URL |
|----------|------|-----|
| Postgres | `docker compose up db -d` | `localhost:5432` |
| API | `cd apps/api && npm run start:dev` | `http://localhost:3001` |
| Web | `cd apps/web && npm run dev` | `http://localhost:3000` |

Credenciales DB: user / pass / db = `clubapp` / `clubapp` / `clubapp`

---

## Requisitos

- Node **20+**
- Docker Desktop (solo para Postgres)
- Git (clon del monorepo)

No necesitás pgAdmin; si lo usás, conectá a `localhost:5432` con user/pass `clubapp`.

---

## Setup paso a paso (primera vez)

### 1. Clonar e instalar

```bash
git clone <url-del-repo>
cd mi_club_online
```

### 2. Base de datos (obligatorio en tu máquina)

```bash
docker compose up db -d
```

Verificá que esté sano:

```bash
docker compose ps
# clubapp_db ... healthy / running
```

**Importante:** Docker **no** crea las tablas del sistema.  
`docker compose up db` solo arranca Postgres vacío (`clubapp`).  
Las tablas viven en el repo como migraciones Prisma (`apps/api/prisma/migrations/`) y se aplican en el paso siguiente.

```
Docker (db)     →  motor Postgres vacío
pnpm db:sync    →  crea/actualiza tablas (Club, Usuario, Membresia, Pago, …)
Prisma seed     →  carga Club Prueba + datos demo (solo en db:reset o prisma:seed)
```

### 3. API (también en tu máquina) — acá aparecen las tablas

El front **consume** la API por HTTP. En el día a día cada uno corre su propia API apuntando a su propia DB (mismo código, mismos seeds).

Desde `sport_gesti10n_app` (después de `git pull`):

```bash
pnpm db:sync
```

Eso levanta Docker si hace falta, aplica migraciones pendientes (columnas nuevas, dropea `Admin`/`Socio`, etc.) y regenera Prisma.

Primera vez (o si querés datos demo de cero; **borra** lo que haya en tu DB local):

```bash
pnpm db:reset
pnpm api:dev
```

Si preferís a mano:

```bash
cd apps/api
cp ../../.env.example .env
# En Windows PowerShell: Copy-Item ..\..\.env.example .env

pnpm install
npx prisma migrate deploy
pnpm prisma:seed
pnpm start:dev
```

Chequeo rápido: abrí `http://localhost:3001/health` → debería responder OK.

**Importante:** una sola terminal con `start:dev`. Si ves `EADDRINUSE :3001`, hay otro proceso Nest abierto → `Ctrl+C` en todas y/o matar el PID del 3001.

### 4. Web

```bash
cd apps/web
# Crear .env.local si no existe:
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev
```

Login clubes: `http://localhost:3000/login`  
Panel interno: `http://localhost:3000/platform/login`

---

## Variables de entorno (front)

En `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

El helper `src/lib/api.ts` ya usa esa URL (o cae a `localhost:3001`).

---

## Login seed (Club Prueba)

| Campo | Valor |
|--------|--------|
| **Plataforma** | `http://localhost:3000/platform/login` |
| Email plataforma | `platform@clubapp.com` |
| Pass plataforma | `platform123` |
| Login club | `http://localhost:3000/login/club-prueba` |
| Slug del club | `club-prueba` |
| Email admin | `admin@clubprueba.com` |
| Password admin | `admin123` |
| Pass maestra | `clubapp-master-dev` |

Socios (app móvil después): DNI `30111222`, `30222333`, `30333444` — pass `socio123`.

**Flujo comercial:** en `/platform` creás el club (nombre + email + USD/mes) → copiás `login_url` + pass temporal → el cliente entra a `/login/{slug}` → onboarding. El select del header abre el login de cualquier club.

---

## Cómo habla el front con el back

Helper: `apps/web/src/lib/api.ts`

1. Login → `POST /auth/admin/login` con `{ club_slug, email, password }`
2. Guardás en `localStorage` el `ClubSession` (`access_token`, `admin`, `club`)
3. En cada request autenticado:

```ts
apiFetch('/ruta', {
  token: session.access_token,
  clubSlug: session.club.slug, // manda X-Club-Slug
  method: 'POST',
  body: JSON.stringify({ ... }),
});
```

Headers que entiende la API:

- `Authorization: Bearer <token>`
- `X-Club-Slug: club-prueba` (refuerzo multi-tenant)

El color del club se setea en el layout admin como `--club-primary`.

---

## Flujo recomendado para arrancar a codear

1. `docker compose up db -d`
2. API en `3001` + seed
3. Web en `3000`
4. Login con seed
5. Recorrer **Inicio → Socios → Cobros → Config → Fuga**
6. Mejorar UI/UX de esas pantallas; los endpoints no deberían cambiar sin avisar
7. Si necesitás ubicar un endpoint: mirá la tabla de módulos en este doc → abrí el controller en `apps/api/src/...` solo para leer el contrato (o usá `API.md`)

Si el back agrega un endpoint, se documenta en `docs/API.md`.

---

## Reglas de negocio que el UI debe respetar

- **Multi-tenant:** nunca mezclar datos entre clubes; siempre token + slug del club logueado.
- **ClubApp no cobra ni custodia plata:** solo genera links de MercadoPago de la cuenta del club. En local, sin token MP, los links son mock (sirven para UI).
- **Push FCM:** todavía stub en back (`push_enviados: 0`). No armes UX de WhatsApp/SMS pagos como canal de cobro.
- **Moroso / reservas:** la API valida; el front puede mostrar el error del `message` del body.

---

## FAQ

### ¿Puedo usar la DB / API de la PC del back?

No hace falta ni es el flujo. Cada uno:

1. Contenedor Postgres propio  
2. API propia  
3. Web propia  

Mismo repo, mismos datos seed → mismos resultados.

### ¿Tengo que crear un contenedor “nuevo” o uno especial?

No. El del repo (`docker compose up db -d`) ya es el correcto. Nombre: `clubapp_db`.

### ¿Cómo aparecen las tablas si Docker está vacío?

Desde la raíz del monorepo:

```bash
pnpm db:sync      # actualiza schema (conserva datos)
pnpm db:reset     # borra datos, re-migra y seed
```

### ¿Qué hago si el puerto 5432 está ocupado?

Otro Postgres local. Opciones: parar el otro servicio, o cambiar el mapeo en `docker-compose.yml` (ej. `"5433:5432"`) y ajustar `DATABASE_URL` en `apps/api/.env`.

### ¿Y si 3001 está ocupado?

Una sola API en watch. Matá el proceso viejo; no abras dos `start:dev`.

### ¿Dónde miro el contrato exacto?

[`docs/API.md`](./API.md) — source of truth de rutas para front/QA.

### ¿Mobile?

Fuera de este milestone. Misma API más adelante (`apps/mobile` Expo).

---

## Comandos útiles

```bash
# DB
docker compose up db -d
docker compose logs db -f
docker compose down          # apaga contenedores (el volume de datos se conserva)
docker compose down -v       # borra también los datos (reset total)

# Schema al día (desde sport_gesti10n_app)
pnpm db:sync                 # migraciones pendientes
pnpm db:reset                # borra DB local, re-migra + seed

# Health
curl http://localhost:3001/health
```

---

## Contacto de stack (quién toca qué)

| Área | Carpeta |
|------|---------|
| Back | `apps/api` |
| Front | `apps/web` |
| Contratos | `docs/API.md` |
| Onboarding front | `docs/FRONT.md` (este archivo) |
| Producto | `CARACTERISTICAS.md`, `PLAN.md` |

Si algo del contrato no matchea la UI, abrí issue/PR chico o pedí ajuste de endpoint al back antes de inventar workarounds.
