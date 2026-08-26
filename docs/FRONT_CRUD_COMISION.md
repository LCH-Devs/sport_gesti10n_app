# CRUD comisión — contrato para Front

## 0. Actualizar la base local (Docker)

Hacé esto **primero** después de un `git pull` que traiga migraciones. Cada uno tiene su Postgres en Docker.

```bash
# desde sport_gesti10n_app
pnpm db:sync
pnpm api:dev
```

`pnpm db:sync` levanta `clubapp_db` si hace falta, aplica las migraciones pendientes (tablas/columnas nuevas, dropea las que ya no existen) y regenera el client. Después reiniciá la API.

Si la base quedó a medias o querés arrancar de cero (**borra datos locales**):

```bash
pnpm db:reset
pnpm api:dev
```

Esto aplica, si todavía no estaban:

| Acción | Qué |
|--------|-----|
| Crea | `Usuario`, `Membresia` |
| Agrega | `eliminado` en Membresia, GrupoFamiliar, Actividad, Espacio, Horario, Noticia |
| Elimina | tablas `Admin` y `Socio` (los datos se copian a Usuario/Membresia) |

El front no habla con Postgres: consume la API.

---

Para armar / completar las pantallas de `/admin`.  
API: `http://localhost:3001`  
Web comisión: `http://localhost:3000` (host del club: `{slug}.localhost:3000`)

Headers en rutas autenticadas:

```http
Authorization: Bearer <access_token>
X-Club-Slug: <slug>
```

El tenant lo define el JWT (`club_id`). El slug es auxiliar.

Login único (landing `/entrar`): `POST /auth/login` `{ email, password }`.  
`role` en la respuesta: `admin` | `entrada` | `socio` | `profe`. Comisión entra a `/admin`.

---

## Convención de IDs

En el panel, **`socio_id` / `admin.id` = `Membresia.id`** (el vínculo con *este* club), no el id de `Usuario`.

El rol de comisión/portería/socio/profe vive en `Membresia.rol`, no en `Usuario`.

---

## 1. Socios

**Tablas:** `Usuario` (identidad) + `Membresia` (`rol`: `socio` | `profe`)  
**Relaciones:** club, grupo familiar, pagos, reservas, actividades, asistencias

### Endpoints

| Método | Ruta | Body |
|--------|------|------|
| `GET` | `/socios` | — |
| `POST` | `/socios` | `{ dni, nombre, apellido, email, telefono?, password?, rol?, fecha_nacimiento? }` |
| `PATCH` | `/socios/:id` | `{ nombre?, apellido?, email?, telefono?, estado?, rol?, fecha_nacimiento? }` |
| `DELETE` | `/socios/:id` | — |
| `POST` | `/socios/import-csv` | `{ csv }` o multipart |

`DELETE` = `eliminado: true` (deja de listarse y de loguear en ese club). Los pagos se conservan. Re-alta del mismo email **restaura** la membresía.

`rol`: `socio` (default) o `profe`.  
`estado`: `activo` | `moroso` | `suspendido`.  
Si el email ya existe como usuario, se **vincula** al club (misma password).

### Respuesta item

```json
{
  "id": 1,
  "dni": "30111222",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@test.com",
  "telefono": "3411111111",
  "estado": "activo",
  "rol": "socio",
  "fecha_nacimiento": "1990-08-14T00:00:00.000Z",
  "grupo_familiar_id": null
}
```

**UI hoy:** crear, editar, borrar, CSV. Completo.

---

## 2. Cobros

**Tabla:** `Pago`  
**Relaciones:** `club_id`, `socio_id` → membresía

No es un padrón: son cuotas del mes.

| Método | Ruta | Body / query |
|--------|------|----------------|
| `GET` | `/pagos/resumen?mes=YYYY-MM` | mes opcional (default mes actual) |
| `POST` | `/pagos/cobrar-mes` | `{ mes?, monto? }` |
| `POST` | `/api/cuotas/generar-links` | alias de cobrar-mes |
| `PATCH` | `/pagos/:id/marcar-manual` | — |

`estado` del pago: `pendiente` | `pagado`.  
Sin `MP_ACCESS_TOKEN` el link es mock.

**UI hoy:** listar mes, generar cobros, marcar pagado. No hay alta/baja de un pago suelto a mano (salvo marcar pagado).

---

## 3. Usuarios (staff del club)

**Tablas:** `Usuario` + `Membresia` (`rol`: `admin` | `entrada`)  
Un email **no** puede ser `admin` de dos clubes.

| Método | Ruta | Body |
|--------|------|------|
| `GET` | `/admins` | — |
| `POST` | `/admins` | `{ email, nombre, password, rol? }` |
| `PATCH` | `/admins/:id` | `{ nombre?, rol?, password? }` |
| `DELETE` | `/admins/:id` | — |

`rol`: `admin` (default) o `entrada`.  
`DELETE` = `eliminado: true`. No te podés borrar a vos mismo. Tiene que quedar al menos un `admin`.

### Respuesta item

```json
{ "id": 1, "email": "comision@club.com", "nombre": "Ana", "rol": "admin" }
```

**UI hoy:** crear y borrar. **Falta en UI:** editar (nombre / rol / password) — el `PATCH` ya existe.

---

## 4. Espacios

**Tabla:** `Espacio`  
**Relaciones:** `club_id`, `Reserva[]`

| Método | Ruta | Body / query |
|--------|------|----------------|
| `GET` | `/espacios` | — |
| `GET` | `/espacios/:id/disponibilidad?fecha=YYYY-MM-DD` | — |
| `POST` | `/espacios` | `{ nombre, tipo, descripcion?, duracion_slot_min?, precio_opcional?, hora_apertura?, hora_cierre? }` |
| `PATCH` | `/espacios/:id` | mismos campos + `activo?` |
| `DELETE` | `/espacios/:id` | — |

`tipo` libre (ej. `cancha`, `padel`, `quincho`).  
`activo` = está en uso. `DELETE` marca `eliminado`, no apaga `activo`.

**UI hoy:** crear. **Falta en UI:** editar, activar/desactivar, borrar.

---

## 5. Reservas

**Tabla:** `Reserva`  
**Relaciones:** espacio + socio (membresía) + club

| Método | Ruta | Body / query |
|--------|------|----------------|
| `GET` | `/reservas?desde=&hasta=&espacio_id=` | ISO dates |
| `POST` | `/reservas` | `{ espacio_id, socio_id, inicio, fin, nota? }` (`inicio`/`fin` ISO) |
| `PATCH` | `/reservas/:id/cancelar` | — |

`estado`: `confirmada` | `cancelada` | `no_show`.  
El back valida solape, socio suspendido, moroso (`bloquear_reservas`) y máximo de reservas activas.

**UI hoy:** crear y cancelar. No hay delete físico (correcto: se cancela).

---

## 6. Horarios

**Tabla:** `Horario`  
**Relaciones:** club; `profe_id` opcional (membresía profe)

| Método | Ruta | Body |
|--------|------|------|
| `GET` | `/horarios` | — |
| `POST` | `/horarios` | `{ titulo, dias, hora_inicio, hora_fin, profe_id?, activo? }` |
| `PATCH` | `/horarios/:id` | mismos campos |
| `DELETE` | `/horarios/:id` | — |

`dias`: string tipo `"lun,mie,vie"`. Horas `"HH:mm"`.  
`DELETE` = `eliminado: true` (sigue listándose solo lo no eliminado).

**UI hoy:** crear y borrar. **Falta en UI:** editar.

---

## 7. Noticias

**Tabla:** `Noticia`  
**Relaciones:** club

| Método | Ruta | Body / query |
|--------|------|----------------|
| `GET` | `/noticias?es_evento=` | filtro opcional |
| `POST` | `/noticias` | `{ titulo, cuerpo, imagen_url?, es_evento?, fecha?, published? }` |
| `PATCH` | `/noticias/:id` | mismos campos |
| `DELETE` | `/noticias/:id` | — |

`DELETE` = `eliminado: true`.

**UI hoy:** crear. **Falta en UI:** editar, publicar/ocultar, borrar.

---

## 8. Config

**Tabla:** `Club` (una fila: el tenant)

| Método | Ruta | Body |
|--------|------|------|
| `GET` | `/clubs/me` | — |
| `PATCH` | `/clubs/me` | ver abajo |
| `POST` | `/clubs/me/logo` | multipart `file` (JPG/PNG/WEBP/GIF, máx. 2 MB) |
| `PATCH` | `/clubs/me/onboarding` | primer acceso |

`PATCH /clubs/me`:

```json
{
  "nombre": "Club Prueba",
  "logo_url": "...",
  "color_primario": "#2563eb",
  "color_secundario": "#0f172a",
  "color_terciario": "#f59e0b",
  "cuota_monto": 5000,
  "regla_moroso_cuotas": 2,
  "bloquear_reservas": true,
  "bloquear_entrada": false,
  "cumples_auto": true,
  "max_reservas_activas": 2,
  "cancelar_reserva_horas": 2
}
```

**UI hoy:** formulario de config + logo. Completo para esta pantalla.

---

## 9. Fuga

**No hay tabla.** Es un reporte.

| Método | Ruta |
|--------|------|
| `GET` | `/reportes/alerta-fuga` |

Cruza socios + pagos pendientes + asistencias (30 días).  
Criterio: cuotas pendientes ≥ `regla_moroso_cuotas` **o** asistencia &lt; 50%.

Respuesta:

```json
{
  "total": 1,
  "socios": [
    {
      "id": 2,
      "dni": "30222333",
      "nombre": "Ana",
      "apellido": "García",
      "cuotas_pendientes": 2,
      "asistencia_pct": 0,
      "motivo": "moroso",
      "whatsapp_url": "https://wa.me/..."
    }
  ]
}
```

**UI hoy:** listado + WhatsApp. Solo lectura (correcto).

Relacionado: `GET /reportes/hoy` (dashboard inicio).

---

## 10. Familias

**Tabla:** `GrupoFamiliar`  
**Relaciones:** `titular_id` → membresía; miembros vía `Membresia.grupo_familiar_id`

| Método | Ruta | Body |
|--------|------|------|
| `GET` | `/familias` | — |
| `POST` | `/familias` | `{ nombre, titular_id, socio_ids? }` |
| `PATCH` | `/familias/:id` | `{ nombre?, titular_id?, socio_ids? }` |
| `DELETE` | `/familias/:id` | — |

`titular_id` y `socio_ids` son ids de **membresía** (`GET /socios`).  
`DELETE` = `eliminado: true`.

**UI hoy:** crear. **Falta en UI:** editar miembros, borrar.

---

## 11. Actividades

**Tablas:** `Actividad`, `SocioActividad`  
**Relaciones:** `profe_id` opcional; socios inscriptos N:N

| Método | Ruta | Body |
|--------|------|------|
| `GET` | `/actividades` | — |
| `POST` | `/actividades` | `{ nombre, modo_cobro, monto_adicional?, profe_id?, comision_tipo?, comision_valor?, activo? }` |
| `PATCH` | `/actividades/:id` | mismos campos |
| `DELETE` | `/actividades/:id` | — |
| `GET` | `/actividades/:id/socios` | — |
| `POST` | `/actividades/:id/socios` | `{ socio_ids: number[] }` (reemplaza el set) |

`modo_cobro`: `club` | `profe`.  
`comision_tipo`: `porcentaje` | `fijo`.  
`DELETE` = `eliminado: true`.

**UI hoy:** crear. **Falta en UI:** editar, inscribir socios, borrar.

---

## Qué falta en UI (la API ya está)

Usar estos endpoints para completar el panel:

1. `PATCH /admins/:id` — editar staff  
2. `PATCH` / `DELETE /espacios/:id` — editar / sacar espacio  
3. `PATCH /horarios/:id` — editar horario  
4. `PATCH` / `DELETE /noticias/:id` — editar / borrar noticia  
5. `PATCH` / `DELETE /familias/:id` — editar / borrar familia  
6. `PATCH` / `DELETE /actividades/:id` + `GET|POST /actividades/:id/socios` — editar e inscribir  

---

## Eliminado lógico

Los `GET` **no devuelven** filas con `eliminado: true`. El JSON de listado **no incluye** el campo `eliminado`. El front sigue llamando `DELETE`: el back marca el flag, no borra la fila.

```ts
eliminado: boolean  // default false
```

| Entidad | Soft delete | Notas |
|---------|-------------|--------|
| Socio / membresía | sí | deja de listarse y de loguear en ese club |
| Staff (`/admins`) | sí | debe quedar al menos un admin no eliminado |
| Espacio | sí | no confundir con `activo` (pausa operativa) |
| Horario | sí | ídem `activo` |
| Noticia | sí | |
| Familia | sí | |
| Actividad | sí | |
| Reserva | no (usar `cancelada`) | |
| Pago / cobro | no (usar `pagado` / anulado) | no borrar historia |
| Fuga | n/a | es reporte |
| Config / Club | `Club.activo` ya existe | suspender club desde plataforma |

Si se vuelve a dar de alta el mismo email en el mismo club, se **restaura** la membresía (`eliminado: false`). Los pagos históricos se conservan.

`activo` (espacio, actividad, horario, club) se queda: es “está en uso”, no “se eliminó”.
