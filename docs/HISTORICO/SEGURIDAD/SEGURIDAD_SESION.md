# Seguridad de sesión — pass maestra y JWT post-baja

Resumen de lo implementado (sep 2026).

## Problemas

1. **Clave maestra `clubapp-master-dev`** (`PLATFORM_MASTER_PASSWORD`) permitía entrar con el email de cualquier admin/entrada de un club vivo, sin la contraseña real. Estaba en `.env.example` y se usaba en local.
2. **El JWT seguía válido después de una baja.** La baja es soft delete (`Membresia.eliminado = true`, club `activo=false` / `eliminado=true`). `JwtStrategy` solo leía el payload firmado: no consultaba la DB. Quien tenía el token en `localStorage` seguía autenticado hasta el `exp`. El TTL en código era **30 días** (los docs decían 8 h).

## Qué se hizo

### 1. Pass maestra solo fuera de production

- Helper `apps/api/src/auth/master-password.ts`.
- `matchesMasterPassword` exige env ≥ 8 caracteres **y** `NODE_ENV !== production`.
- En producción el env se ignora: hay que entrar con la pass real (bcrypt).
- Sigue valiendo solo para **staff** (`admin` / `entrada`). Socio/profe no. Plataforma tampoco.
- El JWT de soporte sigue marcando `impersonated_by_platform` y el warning en logs.
- `.env.example` aclara que es solo local/dev.

### 2. Cada request revalida la sesión contra la DB

- `apps/api/src/auth/session-viva.ts` + `JwtStrategy.validate` (async).
- Token de club: la membresía tiene que existir, no estar `eliminado`, no estar `suspendido`, y el club `activo` y no dado de baja. El `club_id` del JWT tiene que coincidir.
- Si el rol cambió en DB, el request usa el rol actual (no el del token viejo).
- Token de plataforma: `PlatformAdmin.activo = true`.
- Si no cumple → **401** `Sesión inválida`. El front ya limpia sesión ante 401 (`FRONT_SESION.md`).

No hay denylist de tokens: con la consulta por `membresia.id` / `platformAdmin.id` alcanza. No se tocó el webhook de MP (sigue público).

### 3. TTL del JWT = 8 horas

- `JWT_EXPIRES_IN = '8h'` y `expires_in = 28800` (antes 30 días).
- Alineado con `AGENTS.md`, `docs/API.md` y `docs/FRONT_SESION.md`.

## Archivos

| Área | Archivos |
|------|----------|
| Lógica | `auth/session-viva.ts`, `auth/jwt.strategy.ts`, `auth/master-password.ts`, `auth/auth.service.ts`, `auth/auth-security.ts` |
| Tests | `session-viva.spec.ts`, `master-password.spec.ts`, `auth.service.spec.ts`, `tenant-isolation.spec.ts` |
| Docs | este archivo, `API.md`, `FRONT_SESION.md`, `AGENTS.md`, `.env.example` |

## Cómo probar

**Pass maestra (local):** login de comisión con `admin@clubprueba.com` / `clubapp-master-dev` → entra y `impersonated_by_platform: true`. Socio con la misma clave → no.

**Pass maestra (prod):** con `NODE_ENV=production` esa clave no abre nada.

**Token post-baja:** entrar como admin, copiar el Bearer, dar de baja esa membresía (o suspender el club), repetir un `GET` autenticado con el mismo token → **401**. Antes devolvía 200.

**TTL:** el login devuelve `expires_in: 28800`.
