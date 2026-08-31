# AGENTS.md

Instrucciones para cualquier agente (Cursor, Claude Code, etc.) que trabaje en este repo.

Leer este archivo **antes** de tocar código. No improvisar arquitectura, modelos ni contratos.

Fuente de producto y detalle: `TECNICO_EQUIPO.md`, `PLAN.md`, `docs/API.md`, `docs/FRONT.md`.
Si este archivo y un doc viejo se contradicen, **gana el código actual** (`apps/api/prisma/schema.prisma` + servicios). Varios docs aún hablan de `Admin`/`Socio` como tablas: eso ya no existe.

---

## 1. Qué es este producto

SaaS **multi-tenant** para clubes de barrio (Argentina): 1 codebase → N clubes.

Canales:

| Canal | Quién | App |
|-------|--------|-----|
| Web comisión | admin / entrada | `apps/web` (canónico). `apps/web-v2` es el mismo panel con rutas renombradas |
| Web socio | socio / profe | rutas `/socio` (web) o `/miembro` (web-v2) |
| Superadmin plataforma | ClubApp | `/dashboard` (web) o `/panel` (web-v2) |
| Mobile Expo | socio / profe / entrada | `apps/mobile` — **fuera de este milestone** |

Propuesta: cobro + reservas + comunicación, sin custodiar plata. MercadoPago es del club, no nuestro.

---

## 2. Stack y carpetas

- Monorepo **pnpm** workspaces. Node 20+.
- API: NestJS + Prisma + PostgreSQL → `apps/api` (puerto **3001**)
- Web: Next.js 14 App Router + Tailwind → `apps/web` (puerto **3000**)
- DB local: `docker compose up db -d` luego `pnpm db:sync`
- API: `pnpm api:dev` · Web: `pnpm web:dev` · Web-v2: `pnpm web-v2:dev`

No editar `apps/api` para maquetar pantallas. Si falta un campo o endpoint, cambiar API **y** contrato en `docs/API.md` juntos.

Mobile no entra salvo que el usuario lo pida explícito.

---

## 3. Identidad (regla dura — no volver atrás)

Tablas viejas `Admin` y `Socio` **no existen**. El modelo actual:

- `Usuario` — identidad de login (email único global, password, datos personales)
- `Membresia` — vínculo usuario ↔ club. Ahí viven `rol`, `estado`, `eliminado`, `must_change_password`
- `PlatformAdmin` — superadmin ClubApp. **No** es un `Usuario`. JWT `role: platform`, **sin** `club_id`

Un usuario puede tener varias membresías (varios clubes / roles). Unique: `(usuario_id, club_id)`.

Roles de membresía: `admin` | `entrada` | `socio` | `profe`.

- Staff (comisión): `admin`, `entrada` — helpers `isStaffRole` / `STAFF_ROLES`
- Miembros: `socio`, `profe` — `isMemberRole` / `MEMBER_ROLES`

**IDs en la API de negocio son `membresia.id`, no `usuario.id`.**  
`flattenPerson` / `flattenAdmin` exponen `id: membresia.id` y aplanan el `usuario`. El front consume esa forma plana (`email`, `nombre`, `dni` en el mismo objeto). No devolver el grafo Prisma crudo.

JWT de club (TTL **8 h**; login/switch devuelven `expires_in` en segundos):

```
{ sub: membresia.id, user_id, role, club_id, club_slug, impersonated_by_platform? }
```

JWT de plataforma: `{ sub: platformAdmin.id, role: 'platform' }` (mismo TTL).

Auth unificado: `POST /auth/login` (aliases `/auth/admin/login` y `/auth/socio/login`). Cambio de club: `POST /auth/switch` con `membresia_id`.

Helpers: `apps/api/src/common/club-users.ts` (`NOT_DELETED`, `flattenPerson`, `personInclude`). Reusarlos. No reimplementar.

Bajas: **soft delete** `eliminado: true` en `Membresia` (y entidades de negocio que ya lo usan). Baja de **club** (plataforma): `Club.eliminado=true` + `activo=false` + membresías de ese club `eliminado=true`. No borrar filas. El mail del admin se libera; **suspender** (`activo=false`) no libera el mail. No borrar filas de usuario si puede tener otra membresía.

DNI único **por club**, no global. Email único en `Usuario`. Si el email ya existe, se **vincula** una membresía nueva (o se restaura una `eliminado`); no se duplica el usuario.

---

## 4. Multi-tenant (reglas duras)

1. Toda tabla de negocio tiene `club_id`. Queries **siempre** filtradas por el `club_id` del JWT.
2. El JWT es la fuente de verdad del tenant. Ni `X-Club-Slug` ni Origin pueden cambiar de club.
3. En controladores de club: `@UseClubAuth(...)` (= `JwtAuthGuard` + `TenantGuard` + guard extra) y `@ClubId()` — nunca leer `club_id` del body/query/header.
4. `TenantMiddleware` solo resuelve slug para rutas públicas / branding. En rutas autenticadas, `TenantGuard` pisa `req.clubId` con el JWT.
5. Si hay header `X-Club-Slug` o Origin de otro club → `403`. Hay tests en `tenant.guard.spec.ts` y `tenant-isolation.spec.ts`: no romperlos.
6. Plataforma (`role: platform`) **no** usa endpoints de club. Club **no** usa `/platform/*`.
7. Nunca listados ni updates cross-tenant. Al tocar un recurso por `:id`, el `where` incluye `club_id`.
8. Config (moroso, reservas, cuota, branding) vive en `Club`. Cero reglas globales hardcodeadas salvo defaults al crear el club.

Índices nuevos: compuestos con `club_id`. Plan básico: tope ~100 socios activos al crear (ya validado en `SociosService`).

---

## 5. Backend (`apps/api`)

### Módulos

Un dominio = una carpeta: `controller` + `service` + `dto` + `module`. Registrar en `app.module.ts`.

Patrón de un controller de club:

```ts
@Controller('recurso')
@UseClubAuth(ClubStaffGuard) // listados: admin + entrada
export class RecursoController {
  @Get()
  list(@ClubId() clubId: number) { ... }

  @Post()
  @UseGuards(AdminRoleGuard) // mutaciones: solo admin
  create(@ClubId() clubId: number, @Body() dto: CreateDto) { ... }
}
```

Guards (ya existen, no inventar otros):

| Guard | Quién |
|-------|--------|
| `UseClubAuth()` | JWT + tenant |
| `ClubStaffGuard` | admin + entrada |
| `AdminRoleGuard` | solo admin |
| `SocioRoleGuard` | socio + profe |
| `PlatformRoleGuard` | superadmin, con `JwtAuthGuard` (sin TenantGuard) |

Portal socio: `socios/socio-portal.controller.ts` con `UseClubAuth(SocioRoleGuard)`.

### DTOs y validación

- `class-validator` en DTOs. `ValidationPipe` global: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- No aceptar campos de más. No confiar en el client para `club_id` ni `rol` privilegiado.
- Errores de negocio: `BadRequestException` / `NotFoundException` / `ForbiddenException` / `UnauthorizedException`. Mensajes en español, genéricos en login (“Club o credenciales inválidas”).

### Prisma

- Schema en `apps/api/prisma/schema.prisma`. Cambios de tablas: `pnpm db:sync` (local). No borrar migrations a mano.
- No usar `prisma.admin` / `prisma.socio`. Es `usuario` + `membresia`.
- Transacciones al crear usuario+membresía juntos.
- Passwords: bcrypt cost 10. Default socio seed: `socio123` solo al crear si no mandan password.

### Auth / seguridad

- No loguear tokens MP ni JWT.
- Webhook MP (`POST /api/webhook/mp`) es **público**, sin JWT. Responder 200. Idempotente: si el pago ya está `pagado`, no-op.
- Pass maestra (`PLATFORM_MASTER_PASSWORD`): solo staff, marca `impersonated_by_platform`. No usarla como atajo de producto.
- Uploads: validar mime/size. Logos vía endpoint existente (ImageKit o `uploads/`).

### Pagos (no negociable)

- ClubApp **no cobra ni custodia** fondos. Preferences con el token MP **del club**.
- Prod: sin fallback a `MP_ACCESS_TOKEN` de plataforma. Ese env es solo sandbox/demo.
- Unique `(socio_id, mes)` — `socio_id` es la membresía. Cobrar mes es idempotente.
- Siempre existe marcar pagado manual. Push FCM no debe romper el request de negocio.
- No agregar WhatsApp/SMS pagos como canal de cuotas.

### Tests

Hay specs de aislamiento de tenant, guards y socios. Si tocás auth, tenant o `club_id`, actualizá o agregá tests en el mismo estilo (`supertest` + JWT firmado). No dejes un agujero cross-tenant “para después”.

---

## 6. Frontend

### Cuál app tocar

- `apps/web` es el panel canónico (rutas `/admin`, `/login`, `/socio`, `/dashboard`, `/entrar`).
- `apps/web-v2` es el **mismo producto** con paths distintos (`/gestion`, `/acceso`, `/miembro`, `/panel`, `/ingreso`). No mezclar prefixes entre las dos apps.
- Si el cambio es de comportamiento/API, aplicarlo en **las dos** si el archivo equivalente existe. Si es solo visual de una, no arrastrar la otra sin pedir.

### Cómo hablar con la API

- Solo vía `apiFetch` / `apiUpload` en `src/lib/api.ts`. Ellos mandan `Authorization` y `X-Club-Slug`.
- No armar `fetch` sueltos ni hardcodear `localhost:3001` fuera de `API_URL`.
- Sesiones en `localStorage`: `clubapp_session`, `clubapp_platform_session`, `clubapp_socio_session`. Reusar `getSession` / `saveSession` / `clearSession` (y equivalentes platform/socio).
- Tipos de sesión ya están en `api.ts` (`ClubSession`, `LoginResult`, `CuentaOption`, …). Extender ahí, no duplicar.

### Tenant en el browser

- Middleware: `src/middleware.ts` → `runTenantMiddleware` en `src/lib/tenant-routing.ts`.
- Subdominio (`slug.localhost`) vs apex. No reimplementar parseo de host: usar `tenant-host.ts`.
- White-label: `applyClubTheme` setea `--club-primary/secondary/tertiary`. Usar esas CSS variables, no colores fijos del club.

### UI

- Reusar `src/components/common` (`Button`, `Card`, `Badge`, `DataTable`, `Header`, `Sidebar`, `Navbar`).
- Listados: `DataTable`. No armar tablas ad-hoc.
- Layouts de panel (`admin/layout.tsx` / `gestion/layout.tsx`) ya hacen gate de sesión, onboarding y theme. No duplicar ese gate en cada page.
- KISS. Evitar `any`. Preferir `'use client'` en pages de panel (el patrón actual es client components + `apiFetch`).
- Textos de producto en español. i18n existe (`LanguageContext` / `useTranslation`): usarlo si la pantalla ya está cableada; no traducir todo el admin de un saque.

### Contratos

El back aplana personas. El front espera `socio.id` = membresía, no usuario. Al cambiar un DTO, actualizar `docs/API.md` y los tipos en `api.ts` / pages que lo consumen.

---

## 7. Alcance — no salirse del carril

**Este milestone:** API + panel web. Fase 1 / 1b.

No implementar salvo pedido explícito:

- App móvil, Modo Entrada QR, carnet offline, FCM real (hoy stub)
- OAuth MP por club (prod)
- Cantina / consumo
- Billing SaaS self-serve, Kubernetes, S3/R2 (uploads local está bien)
- Roles granulares de comisión (tesorero vs presidente)
- Nuevos módulos de dominio “por las dudas”

Si un doc (`PLAN.md`, `TECNICO_EQUIPO.md`) describe Fase 2+, es roadmap, no trabajo actual.

---

## 8. Cómo trabajar

1. Investigar el módulo/pantalla existente **antes** de crear archivos nuevos.
2. Reutilizar guards, `flattenPerson`, `apiFetch`, componentes common.
3. PRs chicos. Branches: `feat/api-…`, `feat/web-…`.
4. No commitear `.env`, secrets, ni `MP_ACCESS_TOKEN`.
5. No inventar tablas Prisma si alcanza con `Usuario`/`Membresia`/`Club`.
6. No romper aislamiento de tenant para “simplificar”.
7. Cambio de contrato API = back + `docs/API.md` + front en el mismo trabajo.
8. Verificar UI en el browser (flujo real, no solo screenshot) cuando toques web.

Seed local: plataforma `platform@clubapp.com` / `platform123`. Club `club-prueba`, admin `admin@clubprueba.com` / `admin123`. Socios pass `socio123`.
