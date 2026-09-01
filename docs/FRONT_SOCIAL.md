# Social — feed entre clubes (front)

Módulo **nuevo**. No reuses `GET /noticias` ni la solapa de eventos del club.

Eventos internos del club (`Noticia` + `es_evento`) siguen igual: solo socios de ese tenant.

**Social** es un muro de la app: torneos abiertos, interclubes, avisos pensados para otros clubes.

No hay pantallas todavía: hay que armarlas. Solo `apiFetch` (`apps/web/src/lib/api.ts`).

---

## Después del pull (obligatorio)

Este módulo agrega la tabla `PublicacionSocial`. Sin migrar, `GET /social/posts` revienta.

**Pará la API** (en Windows, si Nest está en watch, `prisma generate` suele fallar con `EPERM`). Postgres (Docker `clubapp_db`) tiene que estar up.

Desde `apps/api`:

```bash
npx prisma migrate deploy
npx prisma generate
```

Después: `pnpm api:dev`.

Si `pnpm db:sync` desde la raíz te anda (no choca el contenedor Docker), también aplica migraciones + generate. Si Compose dice que `clubapp_db` ya existe, usá los dos `npx` de arriba.

Esto hay que hacerlo **en cada máquina** que corra la API local después de un pull que traiga migraciones nuevas, no solo en Social.

---

## Quién hace qué

| Rol | Ver feed | Crear / editar / borrar |
|-----|----------|-------------------------|
| `admin` (comisión) | Sí | Solo posts de **su** club |
| `platform` (superadmin) | Sí | Todos. Puede publicar como ClubApp (`club: null`) o en nombre de un club (`club_id`) |
| `socio` / `profe` / `entrada` | Sí | **403** |

Cualquier JWT válido (club o plataforma). **No** uses `UseClubAuth` / no es un recurso tenant-only: el listado **no** filtra por el `club_id` del token.

---

## Endpoints

Base: `http://localhost:3001`

Header: `Authorization: Bearer <token>`  
`X-Club-Slug` no cambia el feed. En mutaciones de admin el club sale del JWT.

### `GET /social/posts`

Feed público (logueados). Solo `visible: true`, no eliminados, club vivo (activo y no dado de baja). Posts de plataforma (`club: null`) siempre entran.

Query opcional:

| Query | Default | Notas |
|-------|---------|--------|
| `take` | 30 | máx. 50 |
| `skip` | 0 | paginado |
| `club_id` | — | solo posts de ese club |

### `GET /social/posts/:id`

Detalle. Si está oculta o el club está suspendido/eliminado → **404** para socio. Admin dueño o platform sí la ven.

### `GET /social/mis-publicaciones`

- Admin: posts de su club, **incluye ocultos**.
- Platform: **todas** (incluye ocultas).
- Socio / entrada / profe: **403**.

Usalo en el ABM de “mis publicaciones”, no en la solapa Social del socio.

### `POST /social/posts`

Body:

```json
{
  "titulo": "Copa de verano — inscripciones abiertas",
  "cuerpo": "Sábado 12, cancha 1. Clubes invitados.",
  "imagen_url": null,
  "fecha_evento": "2026-12-12T15:00:00.000Z",
  "lugar": "Sede Club Prueba",
  "visible": true,
  "club_id": 1
}
```

- `titulo` máx. 200 · `cuerpo` máx. 10000 · `lugar` máx. 200 · `imagen_url` máx. 500 (URL; no hay upload propio todavía, podés reusar el de logo o pegar URL).
- `fecha_evento` y `lugar` opcionales.
- **Admin:** se ignora `club_id` del body; se usa el del JWT.
- **Platform:** sin `club_id` → post ClubApp (`club: null`). Con `club_id` → tiene que ser un club **activo**.

### `PATCH /social/posts/:id`

Campos opcionales: `titulo`, `cuerpo`, `imagen_url`, `fecha_evento`, `lugar`, `visible`.  
No se puede cambiar el club.  
`visible: false` = ocultar (moderación / borrador).

### `DELETE /social/posts/:id`

Baja lógica (`eliminado`). No borra la fila.

---

## Forma de cada post

```ts
type SocialClub = {
  id: number;
  nombre: string;
  slug: string;
  logo_url: string | null;
} | null;

type SocialPost = {
  id: number;
  titulo: string;
  cuerpo: string;
  imagen_url: string | null;
  fecha_evento: string | null;
  lugar: string | null;
  visible: boolean;
  created_at: string;
  autor_tipo: 'admin' | 'platform';
  club: SocialClub; // null = publicado por ClubApp
};
```

Si `club` es `null`, mostrá autor “ClubApp” (plataforma), no un club.

---

## UI sugerida

**Socio / profe / entrada (y admin leyendo):** solapa **Social** (distinta de Eventos). Lista `GET /social/posts`, detalle opcional. Sin botones de alta.

**Admin del club:** misma solapa + “Publicar” / editar las propias (`GET /social/mis-publicaciones`). No editar posts de otro club ni los de ClubApp (403).

**Superadmin:** en el panel plataforma, listado + alta ClubApp o eligiendo club + ocultar/borrar cualquiera.

Errores: `message` del body. 401 sin sesión · 403 si un socio intenta POST · 404 post inexistente u oculto.

---

## Qué no hacer

- No mezclar con `/noticias?es_evento=true`.
- No mandar `club_id` en el body desde el panel del club (se ignora, pero no hace falta).
- No armar un `fetch` suelto: `apiFetch('/social/posts', { token })`.
- No hace falta Redis ni WebSocket para el v1 (lista paginada).

Contrato también en [`API.md`](./API.md).
