# Solicitudes — alta comercial desde la landing

Leads de clubes que piden ClubApp. **No** es un recurso de tenant: el club todavía no existe. Tabla `Solicitud`, sin `club_id`.

Aprobar **no** crea el club. El alta sigue siendo `POST /platform/clubs`. Acá solo se cambia `estado`.

---

## Después del pull (obligatorio)

Este módulo agrega la tabla `Solicitud`. Sin migrar, el formulario de la landing y `GET /platform/solicitudes` revientan.

**Pará la API.** Postgres (Docker `clubapp_db`) up. Desde `apps/api`:

```bash
npx prisma migrate deploy
npx prisma generate
```

Después: `pnpm api:dev`.

---

## Quién hace qué

| Quién | Qué |
|-------|-----|
| Anónimo (landing) | `POST /solicitudes` — siempre nace `pendiente` |
| Superadmin (`role: platform`) | listar, ver count, cambiar `estado` |
| Admin / socio / entrada | **403** en `/platform/solicitudes` |

---

## Contratos

### Alta pública (formulario landing)

`POST /solicitudes` — **sin** Bearer.

```ts
{
  nombre: string;           // letras, 2–80
  apellido: string;
  nombre_club: string;      // 2–120
  email: string;
  telefono: string;         // 8–20, dígitos / espacios / + - ()
  cantidad_miembros: number; // entero ≥ 0
}
```

No mandes `estado` ni `eliminado`. El form no pide `cantidad_socios` (el back guarda 0). `fecha_solicitud` la pone el back al crear (fecha **y** hora). Respuesta `{ id, estado: 'pendiente', fecha_solicitud }`.

**429** si hay más de 5 POST por IP en un minuto.

### Panel plataforma

JWT `role: platform`.

| Método | Ruta | Notas |
|--------|------|--------|
| `GET` | `/platform/solicitudes?estado=pendiente` | `estado` opcional. Nunca devuelve `eliminado=true` |
| `GET` | `/platform/solicitudes/pendientes/count` | `{ count }` → tarjeta **Salud del Sistema** |
| `GET` | `/platform/solicitudes/:id` | 404 si no existe o está borrada |
| `PATCH` | `/platform/solicitudes/:id` | `{ estado }` |

Estados: `pendiente` | `trial` | `aprobada` | `cancelada` | `borradas`.

`PATCH` `{ estado }` pisa el estado y la fecha de ese paso (`fecha_trial`, `fecha_aprobada`, `fecha_cancelada`, `fecha_eliminada`). No borra las fechas anteriores. `fecha_solicitud` se setea al crear (landing) y no cambia. `borradas` también pone `eliminado=true`.

`trial` dura **30 días** desde `fecha_trial`. A los 20 días (quedan 10) el back manda un mail al email de la solicitud (una vez; `mail_aviso_trial_enviado`). El panel muestra el contador. Elegir trial **no** cambia el estado: abre el alta de club precargada. Si cancelás, sigue `pendiente`. Si confirmás el alta, ahí sí pasa a `trial`.

---

## Front

- Landing `/`, `/landing`: `ContactForm` → `apiFetch('/solicitudes', { method: 'POST', body })` **sin** token.
- Overview `/supercalifragilisticoespiralidoso/panel`: `GET /platform/solicitudes/pendientes/count`. Resolver → listado.
- Listado `/supercalifragilisticoespiralidoso/panel/solicitudes`: `GET` + `PATCH` con `getPlatformSession()`.

Solo `apiFetch` (`apps/web/src/lib/api.ts`).
