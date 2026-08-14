# ClubApp Arg — Documento técnico para el equipo

Documento interno: arquitectura, features, responsabilidades por canal y decisiones de implementación.  
Para pitch a clubes usar [`VENTA_PUBLICO.md`](VENTA_PUBLICO.md).

---

## 1. Visión del producto

SaaS **multi-tenant** para clubes de barrio (Argentina):

- **1 codebase** → N clubes
- Aislamiento estricto por `club_id`
- Tenant por **subdominio** (`slug.clubapp.com.ar`) o selección de club en login
- Canales:
  - **Web** → comisión (admin)
  - **App móvil** → socio (cuota, reservas, carnet…) + profe + entrada (portería / scan QR)

Propuesta de valor interna: cobro + asistencia + comunicación en un solo stack, más barato/simple que Deportick / SportClub.

---

## 2. Stack

| Capa | Tecnología |
|------|------------|
| API | Node.js, NestJS, TypeScript, Prisma, PostgreSQL |
| Web | Next.js 14 (App Router), Tailwind, shadcn/ui |
| Mobile | React Native, Expo, TypeScript |
| Pagos | MercadoPago SDK oficial (`mercadopago`) |
| Auth | JWT + Bcrypt |
| Push | Firebase Cloud Messaging (vía `expo-notifications` en client) |
| Jobs | `@nestjs/schedule` (crons de cobranza) |
| Deploy local | `docker-compose` → `postgres` + `api` + `web` (+ volume `uploads`) |

App Expo **fuera** de Docker en desarrollo.

---

## 3. Multi-tenant (reglas duras)

1. Toda tabla de negocio tiene `club_id`.
2. Queries siempre filtradas por `club_id` del JWT / tenant resuelto.
3. Middleware Nest resuelve club por:
   - Host (`slug.localhost` / `slug.clubapp.com.ar`), o
   - Header `X-Club-Slug`
4. JWT claims: `{ sub, role, club_id }`
5. Roles: `admin` | `entrada` | `socio` | `profe`
   - `Admin.rol`: `admin` (comisión) | `entrada` (portería, solo scan)
   - `Socio.rol`: `socio` | `profe`
6. DNI único **por club**: `@@unique([club_id, dni])` (no global)
7. Plan `basico`: soft-limit ~100 socios (validar en create)
8. QR carnet payload: `club_id:dni` (scoped; el scan de entrada valida que coincida con el tenant del JWT)

**Nunca** devolver listados cross-tenant.

### Configuración por club (policies)
- Cada `Club` tiene su propia config (morosidad, reservas, cumples, branding, cuota).
- Solo `Admin.rol === 'admin'` del mismo `club_id` puede `PATCH /clubs/me/config`.
- Entrada/reservas/cobros leen `Club` del tenant en runtime — **cero reglas globales hardcodeadas** (solo defaults al crear el club).
- UI: `/admin/config` en el panel de ese subdominio/slug.

---

## 4. Modelo de datos (entidades)

### Core
- `Club` — slug, nombre, logo_url, color_primario, plan, cuota_monto, mp_access_token?
- `Admin` — comisión + portería (`rol`: `admin`|`entrada`), email + password_hash, scoped por club
- `Socio` — datos personales, password_hash, estado, rol (`socio`|`profe`), flags/tokens MP débito
- `Pago` — mes (`YYYY-MM`), monto, estado (`pendiente`|`pagado`), mp_preference_id, mp_init_point, fecha_pago; unique `(socio_id, mes)`
- `DeviceToken` — tokens FCM por socio
- `Acceso` — log de scans en puerta (`resultado`, `motivo`, `scanned_by`, timestamp)
- `Espacio` — cancha/quincho/salón (`tipo`, slots, apertura/cierre, `precio_opcional`)
- `Reserva` — turno de un socio sobre un espacio (`inicio`/`fin`/`estado`); sin solapes

### Club life
- `Horario` — actividad, días, hora_inicio/fin, profe opcional
- `Noticia` — título, cuerpo, imagen_url, es_evento, published
- `Asistencia` — horario + socio + fecha + estado (`presente`|`ausente`|`justificado`); unique por día/horario/socio
- `Justificacion` — audio_url, nota, estado (`pendiente`|`aceptada`|`rechazada`), link opcional a asistencia

### Uploads
- Fotos de noticias y audios de justificación → volumen `./uploads` servido por API (MVP). Evaluar S3/R2 en prod.

### Reportes (sin tabla propia)
- **Alerta de Fuga** = query:
  - socios con ≥ 2 `Pago` pendientes, **o**
  - asistencia &lt; 50% en últimos 30 días (umbral configurable)

---

## 5. Features por canal (checklist técnico)

### 5.1 Web admin (`apps/web`)

| Feature | Notas de implementación |
|---------|-------------------------|
| Login comisión | `POST /auth/admin/login` + slug/subdominio |
| Dashboard KPIs | Contadores al día / deben / fuga |
| CRUD socios | REST scoped; estados activo/moroso/suspendido |
| Import CSV | Parse server-side; upsert por DNI dentro del club |
| Cobrar mes | Llama motor de preferences MP; idempotente por `(socio_id, mes)` |
| Pagados vs deudores | Filtro por mes actual |
| Push masivo | A todos o solo deudores → FCM |
| ABM horarios | CRUD `/horarios` |
| Noticias + foto | Multipart → `uploads/` |
| Alerta de Fuga | `GET /reportes/alerta-fuga` + CTA “enviar recordatorio” |
| White label | CSS variables desde `color_primario` + `logo_url` |

### 5.2 App socio (`apps/mobile`)

| Feature | Notas |
|---------|--------|
| Elegir club | `GET /clubs/buscar?q=` |
| Login DNI+pass | `POST /auth/socio/login` |
| Estado de cuota | Agregar pagos pendientes del socio |
| Pagar | `Linking.openURL(mp_init_point)` |
| Débito on/off | Customer + card token MP; flags en `Socio` |
| Carnet QR | Payload = DNI (o `club_id:dni` si queremos evitar colisiones cross-club en escaneo) |
| Horarios / noticias | Read-only APIs |
| Push | Registrar token `POST /device-tokens` |
| Justificar falta | `expo-av` → multipart `POST /justificaciones` |

### 5.3 Modo Profe

| Feature | Notas |
|---------|--------|
| Gate por rol | `Socio.rol === 'profe'` |
| Pasar lista | `POST /asistencias/pasar` batch |
| Scan QR | Cámara Expo → match socio por DNI en el club actual |

### 5.4 Reservas (canchas / quinchos)

| Feature | Notas |
|---------|--------|
| Quién reserva | **El socio desde la app** (no solo la secretaría) |
| Web admin | ABM `Espacio` + calendario; cancelar/bloquear |
| App | Tab Reservas → espacio → fecha → slot libre → confirmar / mis reservas |
| API | `GET .../disponibilidad`, `POST /reservas`, cancelar |
| Reglas MVP | Sin doble booking; max 2 reservas futuras; cancelar hasta 2h antes |
| Pago del turno | `precio_opcional` nullable; cobro MP del slot = post-MVP si el club lo pide |
| Tipos | `padel`, `futbol`, `basquet`, `tenis`, `quincho`, `salon`, `otro` |

### 5.5 Modo Entrada (portería)

| Feature | Notas |
|---------|--------|
| Rol | `Admin.rol === 'entrada'` — usuario dedicado al celu de la puerta |
| UX | Login → cámara en loop (sesión larga); UI semáforo verde/amarillo/rojo |
| API | `POST /accesos/scan` con payload QR `club_id:dni` |
| Regla MVP | `suspendido` / no existe → denegado; `moroso` → permitido + alerta; al día → OK |
| Valor | Evita comprar lector QR USB (~USD 50); alcanza un celular viejo |
| Web | Alta del usuario entrada en `/admin/usuarios`; historial `/admin/accesos` |

---

## 6. Modelo de negocio (pagos) — no custodia

Reglas duras:
- ClubApp **no cobra** ni custodia fondos: solo genera preferences/links con el token MP **del club**.
- **Prod:** sin fallback a `MP_ACCESS_TOKEN` de plataforma; club “activo para cobrar” solo con OAuth/cuenta propia conectada (ver `security_issues.md` #2).
- Cobranza masiva: **solo push FCM** (gratis). Prohibido WhatsApp/SMS pagos como canal de cuotas.
- Webhook marca estado en DB (no mueve plata). Siempre existe **marcar pagado manual**.
- Job de reconciliación si el webhook no llega.

## 6b. MercadoPago — diseño de cobros

### Opción A — Link (default, ~90% del uso esperado)
1. `POST /checkout/preferences` con `external_reference = pago.id`
2. Guardar `preference_id` + `init_point`
3. Push al socio con deep link / URL
4. Webhook marca `pagado`

### Opción B — Débito automático
1. Socio tokeniza tarjeta → `Customer` + `Card` en MP
2. Persistir `mp_customer_id`, `mp_card_id`, `debito_activo=true`
3. Cron día 1: crear Payment con token para socios con débito y sin pago del mes
4. Mismo webhook unifica el estado

### Webhook (crítico)
`POST /api/webhook/mp`
1. Leer `data.id`
2. `Payment.get`
3. Si `status === 'approved'` → update `Pago` por `external_reference`
4. Push de confirmación al socio
5. **Siempre** responder `200` a MP
6. Idempotente: si ya está `pagado`, no-op

### Crons “Club Inteligente”
| Día | Job |
|-----|-----|
| 25 | Crear preferences faltantes + push link |
| 1 | Cobrar débitos activos |
| 5 | Push a deudores |
| 10 | Notificar admins / materializar alerta fuga |

### Credenciales
- Prod: solo `Club.mp_access_token` (cifrado; vault) vía OAuth del club
- `MP_ACCESS_TOKEN` del `.env`: **solo demo/sandbox**, nunca alcanzable si `NODE_ENV=production`
- Documentar CUIT / cuenta MP del club para prod

### Push de cobranza (FCM)
- Al generar links: enviar push a `DeviceToken` / `fcm_token` del socio
- Payload data: `{ screen: "PagarCuota", pago_id }` para deep link en la app
- Costo mensajería ≈ $0; no usar APIs pagas de WhatsApp/SMS para esto

Endpoints mínimos:
- `POST /api/mp/crear-pago`
- `POST /pagos/cobrar-mes` (generar links + encolar push)
- `PATCH /pagos/:id/marcar-manual`
- `POST /api/mp/guardar-tarjeta` / activar-débito (Opción B)
- `POST /api/webhook/mp` (firma obligatoria)

---

## 7. Auth y seguridad (MVP)

- Passwords con bcrypt (cost factor razonable, ej. 10)
- JWT con expiración corta-media; refresh opcional post-MVP
- Guards por rol en Nest
- Validar que `socio_id` / recursos pertenezcan al `club_id` del token
- Uploads: validar mime/size (audio + imágenes)
- No loguear access tokens de MP
- Webhook: validar origen según docs MP / secret si aplica

---

## 8. Notificaciones

- Client registra token FCM/Expo
- Admin dispara broadcast o segmento (deudores, fuga)
- Templates simples en español (cuota, pago OK, recordatorio, fuga)
- Fallo de push no debe romper el request de negocio (log + continue)

---

## 9. Estructura de monorepo (objetivo)

```
mi_club_online/
  docker-compose.yml
  .env.example
  README.md
  VENTA_PUBLICO.md      # pitch clubes
  TECNICO_EQUIPO.md     # este doc
  uploads/
  apps/
    api/                # NestJS + Prisma
    web/                # Next.js admin
    mobile/             # Expo
  packages/
    shared/             # tipos/DTOs opcionales
```

---

## 10. Seed de desarrollo

- Club: **Club Prueba** (`slug: club-prueba`)
- Admin: `admin@clubprueba.com` / `admin123`
- 3 socios (uno con `rol=profe`)
- 2 horarios, 1 noticia, pagos mixtos, asistencias para demo de fuga
- Colores/logo de prueba para white-label

---

## 11. Orden de build sugerido

**Fase 1 = Web comisión (+ API admin). Fase 2 = App socio/profe/entrada.** Misma API.

1. Scaffold + Docker + Prisma + seed  
2. Fase 1: API + Web core (“Hoy en el club”, cobros, espacios, fuga, WhatsApp, ranking %)  
3. Fase 1b: familia, reglas moroso, cumples, torneos, multideporte ABM  
4. Fase 2: App socio/profe/entrada + reservas, lista espera, offline, invitados  
5. README + docs  
6. Fase 3: escala (BullMQ, R2, réplicas)  
7. Fase 4: onboarding self-serve  
8. Después: cantina/consumo  


---

## 12. Diferenciales de producto (roadmap)

Ver detalle completo en [`PLAN.md`](PLAN.md). Resumen para el equipo:

| Prioridad | Feature | Fase |
|-----------|---------|------|
| Alto | Grupo familiar (1 pago, N DNIs) | 1b / 2 |
| Alto | Lista de espera reservas + push | 2 |
| Alto | Torneos / fixture / tabla | 1b / 2 |
| Alto | Reglas moroso configurables (reservas/entrada) | 1b + enforce en 2 |
| Alto | Carnet offline 24–48h | 2 |
| Demo | Cumpleaños auto (push + noticia) | 1b |
| Demo | Dashboard “Hoy en el club” + % cobranza | 1 |
| Demo | Multideporte + cobro actividad | 1b / 2 |
| Demo | Modo A: extra en cuota club | 1b (cobrar mes) |
| Demo | Modo B: profe cobra + %/fijo al club | 1b liquidaciones + app profe en 2 |
| Demo | Invitado / day pass QR | 2 |
| Demo | WhatsApp one-tap desde Alerta de Fuga | 1 |
| SaaS | Onboarding self-serve club | 4 |
| SaaS | Ranking cobranza | 1 (KPI) / 4 histórico |
| Después | Modo cantina / consumo | **post-MVP** |

Entidades nuevas clave: `GrupoFamiliar`, `Actividad` (`modo_cobro` club|profe), `SocioActividad`, `CobroProfe`, `LiquidacionProfe`, `ListaEspera`, `Torneo`, `Partido`, `Invitado` + reglas en `Club`.

### Cobro actividades (resumen)
- **Modo A `club`:** adicional en preference del mes → plata a MP del club.
- **Modo B `profe`:** si pagan en efectivo (u otro medio externo), el **profe marca a mano** “Cobrado” + medio en la app; sistema calcula comisión; liquidación profe→club. Auto-registro solo si más adelante hay link de pago del profe.

---

## 13. Escalabilidad 300+ y servidor (resumen)

**Veredicto:** shared DB + `club_id` alcanza para 300+ clubes. No hay un servidor por club.  
Cuellos reales: jobs del Club Inteligente (día 25), media, y rate-limits MP/FCM.

### Reglas de escala (diseñar desde el MVP aunque se activen después)

- Índices compuestos por `club_id` desde el schema inicial
- Cobros idempotentes (`external_reference = pago.id`, unique socio+mes)
- Proceso **`worker`** separado del HTTP (BullMQ + Redis) para preferences/débito/push
- Media en **R2/S3** en prod; `./uploads` solo local
- Cifrar `mp_access_token` en reposo
- Wildcard DNS/TLS: `*.clubapp.com.ar` + `api.clubapp.com.ar` estable para webhooks

### Hosting por etapas

| Etapa | Clubes | Stack | Costo infra orientativo |
|-------|--------|--------|-------------------------|
| A | 0–30 | 1 VPS: proxy + web + api + worker + Redis + Postgres | USD 15–40/mes |
| B | 30–150 | Postgres managed + R2 + VPS app | USD 60–150/mes |
| C | 300+ | API×2 + workers + Redis + Postgres + PgBouncer | USD 150–400/mes (típico 150–250) |

Región preferida: **LatAm / São Paulo**.  
Kubernetes: no requerido a esta escala si el equipo no lo opera ya.

### Gastos fijos nuestros (~300 clubes)

- Infra + tools típico: **~160–280 USD/mes**
- FCM ≈ 0; MP sin abono de plataforma (cuenta por club)
- Comisión de cuotas de socios ≠ costo nuestro
- Soporte/onboarding humano es el costo que más escala

Detalle comercial/ops ampliado: ver sección homónima en [`PLAN.md`](PLAN.md).

---

## 14. Fuera de alcance inmediato / deuda consciente

- Marketplace / billing SaaS automatizado de abonos $10/$20 (hoy manual; self-serve = Fase 4)
- Object storage + CDN en el **primer** deploy (local uploads OK; R2 en etapa B)
- App Store / Play Store release pipeline
- Conciliación contable / facturación AFIP
- Roles granulares comisión (tesorero vs presidente) — MVP: un `Admin` genérico
- Offline-first completo (sí hay carnet offline 24–48h)
- **Modo cantina / consumo** (explícitamente post-MVP)
- Kubernetes

---

## 15. Glosario rápido

| Término | Significado |
|---------|-------------|
| Tenant / Club | Institución aislada por `club_id` + slug |
| Preference | Checkout MP (link de pago) |
| Webhook | Callback de MP al aprobar pago |
| Modo Profe | UI + API de asistencia |
| Modo Entrada | Sesión de portería: scan QR continuo en un celular |
| Acceso | Registro de un scan en la puerta |
| Espacio | Cancha, quincho u otro recurso reservable |
| Reserva | Turno confirmado de un socio sobre un espacio |
| Alerta de Fuga | Score/lista de riesgo de baja |
| White label | Branding por club (logo + color) |
| Worker | Proceso Nest aparte que consume la cola (cobros/push) |

---

## 16. Criterio de “MVP listo”

- `docker-compose up` levanta DB + API + Web  
- Seed usable  
- Flujo completo: importar socios → cobrar mes → pagar (sandbox MP) → webhook → estado al día  
- App: login club, ver deuda, abrir link MP, ver QR, recibir push (o simulado)  
- Profe: pasar asistencia  
- Socio: subir audio de justificación  
- Web: ver Alerta de Fuga y mandar recordatorio  

Si falta el webhook funcionando de punta a punta, **el cobro no está listo**.
