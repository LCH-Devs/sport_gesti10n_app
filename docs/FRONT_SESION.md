# Sesión JWT — qué tiene que mirar el front

Cambio de contrato (API). El token **sigue en `localStorage`** y se manda igual (`Authorization: Bearer`). No hay cookie `httpOnly` todavía.

Referencia de endpoints: [`API.md`](./API.md).

---

## 1. El JWT ahora dura **8 horas** (antes 7 días)

Aplica a comisión, socio/profe, plataforma y a `POST /auth/switch` (el switch emite un token **nuevo** con otras 8 h).

El login (y el switch) incluyen un campo extra:

```json
{
  "access_token": "…",
  "expires_in": 28800
}
```

`expires_in` está en **segundos** (8 × 60 × 60). La fuente de verdad sigue siendo el claim `exp` del JWT.

### Qué tiene que hacer el panel

Hoy, si el token vence, `apiFetch` recibe **401** y el usuario ve errores raros hasta que recarga / sale.

Hay que cubrir esto (en las tres sesiones: `clubapp_session`, `clubapp_socio_session`, `clubapp_platform_session`):

1. Si un request autenticado responde **401**, limpiar sesión y mandar al login de ese canal (gestión / miembro / panel).
2. Opcional: guardar `expires_in` o `Date.now() + expires_in * 1000` al hacer login y, al volver a la pestaña, si ya venció, ir a login **sin** pegarle a la API.
3. No hace falta refresh token: no existe. El usuario vuelve a entrar.

Seeds (`admin123` / `socio123` / `platform123`) no cambian. Solo se acorta la vida del token.

El handoff entre `localhost` y `club-prueba.localhost` (hash en `/sesion`) sigue igual: el payload que copiás sigue siendo el JSON de sesión.

---

## 2. Login: 429 si hay demasiados intentos

Rutas públicas:

- `POST /auth/login`
- `POST /auth/admin/login`
- `POST /auth/socio/login`
- `POST /auth/platform/login`

`POST /auth/switch` **no** entra (ya pide JWT).

Límites:

| Qué | Tope |
|-----|------|
| Por IP | 10 requests / minuto |
| Por email | 5 fallos → bloqueo 15 minutos |

Respuesta:

```json
{ "statusCode": 429, "message": "Demasiados intentos, esperá unos minutos" }
```

El 401 de credenciales inválidas **no cambia**. En el form de login: si `status === 429`, mostrar ese mensaje; si 401, el de siempre.

En local, si alguien prueba mal la pass 5 veces con el mismo mail, espera 15 min o reinicia la API (el contador vive en memoria del proceso).

---

## 3. Campos de más en el body → 400

`ValidationPipe` ahora tiene `forbidNonWhitelisted: true`.

Si un `POST`/`PATCH` manda propiedades que el DTO no declara (`id`, `club_id`, `estado` en un alta, etc.), la API responde **400** (`property X should not exist`).

Antes esos campos se tiraban en silencio.

**Qué hacer:** en cada form, mandar solo los campos del contrato (`docs/API.md` / DTOs). No hagas `JSON.stringify` del objeto de la tabla (que trae `id`, `created_at`, …).

---

## 4. CORS (solo si algo deja de pegarle a la API)

La API ya no hace `origin: true` cuando falta `CORS_ORIGIN`.

Siguen permitidos:

- el valor de `CORS_ORIGIN` (o, si falta, `WEB_APP_URL` / `http://localhost:3000`)
- subdominios de club (`club-prueba.localhost:3000`, `slug.tudominio`)
- `localhost` y `*.localhost`

No hace falta listar cada slug en env. Si en local el panel corre en **otro puerto** (p. ej. 3002), agregalo a `CORS_ORIGIN` separado por coma.

Requests sin header `Origin` (Postman, server-to-server) siguen ok.

---

## Qué **no** cambió

- El token sigue en `localStorage` (riesgo XSS igual que antes; solo se achicó la ventana).
- Sigue `Authorization: Bearer`; no hay cookie.
- `credentials: true` en CORS ya estaba; no hace falta mandar cookies.
- Contratos de negocio (socios, reservas, etc.) iguales, salvo el 400 por campos extra.

---

## 5. Alta / baja / suspensión (mails y `must_change_password`)

El login de comisión es `http://localhost:3000/login` (sin slug).

| Situación | Qué hace la API | Qué hace el panel |
|-----------|-----------------|-------------------|
| Alta de club (aunque el mail ya existiera por un club **eliminado**) | Pass temporal **nueva** + mail de bienvenida + onboarding | `/gestion/onboarding` |
| Suspender (`activo: false`) | Mail de suspensión. El mail **sigue ocupado**. Pass igual. | No entra hasta rehabilitar |
| Rehabilitar (`activo: true`) | Pass temporal **nueva**, `must_change_password: true`. Onboarding **no** se toca | `/gestion/cambiar-clave` |
| Baja (`DELETE`) | Libera el mail **y el nombre**. Mail de eliminación. No es rehabilitación | Un alta posterior es club nuevo |

`PATCH /admins/me` con `{ newPassword }` (sin `currentPassword`) solo vale si `must_change_password` es true. Después el flag queda en false.
