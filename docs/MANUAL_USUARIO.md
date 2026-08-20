# Manual de usuario — ClubApp Arg (estado actual)

Documento para **tester**, **front** y quien necesite recorrer lo que ya existe.  
No reemplaza el detalle técnico: eso está en [`API.md`](./API.md) y [`FRONT.md`](./FRONT.md).

**Fecha de referencia:** agosto 2026 · Milestone web comisión (Fase 1 + 1b) + panel plataforma.

---

## 1. Qué es ClubApp (en una frase)

Plataforma multi-club: cada club tiene su espacio, branding y datos aislados.  
**ClubApp no cobra ni custodia plata** — solo genera links de MercadoPago de la cuenta del club y sincroniza el estado “pagado”.

Hay **dos paneles web** hoy:

| Panel | Quién | URL |
|--------|--------|-----|
| **Plataforma** (superadmin ClubApp) | Ustedes: alta de clubes y superusuarios | `http://localhost:3000/platform/login` |
| **Admin del club** (comisión) | Secretario / tesorero del club | `http://localhost:3000/login/{slug}` |

La **app móvil** (socio / profe / portería) **todavía no** está en este milestone.

---

## 2. Cómo levantarlo (antes de probar)

En la PC de cada uno (no hay DB compartida):

```bash
# 1) Postgres
docker compose up db -d

# 2) API
cd apps/api
cp ../../.env.example .env   # si no existe
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
# → http://localhost:3001/health

# 3) Web
cd apps/web
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
# → http://localhost:3000
```

Setup ampliado: [`FRONT.md`](./FRONT.md).

---

## 3. Credenciales de prueba (seed)

| Rol | Dónde entrar | Usuario | Password |
|-----|----------------|---------|----------|
| Superadmin plataforma | `/platform/login` | `platform@clubapp.com` | `platform123` |
| Admin del Club Prueba | `/login/club-prueba` | `admin@clubprueba.com` | `admin123` |
| Soporte (pass maestra) | login del club | email del admin | `clubapp-master-dev` |
| Socios (API / futuro mobile) | — | DNI `30111222`, `30222333`, `30333444` | `socio123` |

### Datos demo útiles para QA

- **Juan Pérez** (`30111222`): cuota del mes pagada; titular Familia Pérez  
- **Ana García** (`30222333`): 2 cuotas pendientes → aparece en **Alerta de Fuga**  
- **Luis Profe** (`30333444`): rol profe  
- Espacios: Pádel 1, Quincho; hay reserva demo  
- Torneo: Copa Verano con partidos  

Si necesitás resetear datos:

```bash
cd apps/api
npx prisma migrate reset   # borra DB, migra y seed
```

---

## 4. Mapa de pantallas (qué hay ahora)

### 4.1 Panel plataforma — `/platform`

| Pantalla | Qué hace |
|----------|----------|
| `/platform/login` | Login interno de superusuario (email + contraseña). No está enlazado desde `/login`. |
| `/platform` | Select para abrir el login de un club, alta de club (nombre, email admin, **USD/mes**), listado y suspender |
| `/platform/usuarios` | Crear / desactivar otros superusuarios |

**Flujo comercial típico**

1. Login plataforma (`/platform/login`)  
2. Crear club: **nombre + email del admin + precio USD/mes** (la pass se genera sola, el slug también)  
3. Copiar `login_url` + usuario + password temporal. Si hay SMTP configurado, también se manda el mail; si no, copiá el texto.  
4. El cliente entra a `/login/{slug}` (pantalla con logo/colores de su club)  
5. Primer acceso → wizard de onboarding (titular, CUIT/CUIL, logo, colores, cuota, pass nueva)  
6. Recién ahí usa el panel completo  

Para entrar ustedes a un club: el **select** del header → “Ir al login”. 

**Colores del club**

- Primario: obligatorio (se define en onboarding o config)  
- Secundario / terciario: opcionales  
- Si no se definen: en preview aparecen como “No se usa”; en la UI se reutiliza el primario  

Cada club tiene **config, cuota, espacios, deportes y branding independientes**. El login de A no muestra datos ni marca de B.

### 4.2 Panel del club — `/admin`

| Ruta | Nombre en nav | Qué hace hoy |
|------|----------------|--------------|
| `/login` | — | Pedís slug y te manda al login del club |
| `/login/{slug}` | — | Login white-label (logo + colores del club) |
| `/platform/login` | — | Panel interno ClubApp (superusuario) |
| `/admin/onboarding` | — | Primer acceso: completar registro |
| `/admin` | Inicio | Dashboard “Hoy en el club”: % cobranza, deudores, reservas/horarios del día, alertas fuga |
| `/admin/socios` | Socios | Alta/listado, import CSV |
| `/admin/cobros` | Cobros | Generar cobros del mes, ver resumen, marcar pagado manual |
| `/admin/usuarios` | Usuarios | Admins del club (`admin` / `entrada`) |
| `/admin/config` | Config | Nombre, logo, colores, cuota, reglas moroso/reservas/entrada, cumples |
| `/admin/espacios` | Espacios | ABM canchas / quinchos / etc. |
| `/admin/reservas` | Reservas | Listar / crear / cancelar |
| `/admin/horarios` | Horarios | Entrenamientos (días + horas) |
| `/admin/noticias` | Noticias | Noticias / eventos |
| `/admin/fuga` | Fuga | Socios en riesgo (deuda o baja asistencia) + link WhatsApp si hay teléfono |
| `/admin/familias` | Familias | Grupos familiares |
| `/admin/actividades` | Actividades | Actividades modo club / profe |
| `/admin/torneos` | Torneos | Torneos, partidos, tabla |
| `/admin/liquidaciones` | Liquidaciones | Cerrar mes profe / marcar pagada |

**Importante para el front:** las pantallas son **base funcional** (listar + crear). El trabajo de UX/diseño es sobre esto; los contratos están en [`API.md`](./API.md).

---

## 5. Cómo funciona cada módulo (para tester y front)

### Plataforma
- Crea el **tenant** (`Club`) y el primer `Admin`.  
- Suspender club (`activo=false`) → ese club **no puede** loguearse.  

### Login club
- Siempre pide **slug** (identifica el club) + email + password.  
- Tras login, el color primario (y secundario/terciario si hay) se aplican como CSS variables.  

### Socios
- CRUD básico.  
- Import CSV cabecera: `dni,nombre,apellido,email,telefono`.  
- DNI único **por club**.  

### Cobros
1. “Generar cobros del mes” → crea `Pago` pendiente + link MP (o **mock** si no hay `MP_ACCESS_TOKEN`).  
2. Se puede **marcar pagado manual** (efectivo / transferencia / fallo de webhook).  
3. Push FCM: todavía **no envía** (`push_enviados: 0`).  

### Config
- Solo afecta **ese** club.  
- Reglas: cuántas cuotas = moroso, bloquear reservas/entrada, máx. reservas, ventana cancelación, cumples on/off.  

### Espacios + reservas
- La API valida: solape, socio suspendido, moroso (si `bloquear_reservas`), máximo de reservas futuras activas.  
- Cancelar marca la reserva como cancelada.  

### Reportes / Fuga
- **Hoy:** snapshot del día + % cobrado del mes.  
- **Fuga:** ≥ N cuotas pendientes (regla del club) **o** asistencia &lt; 50% en 30 días (si hay asistencias).  

### Familias / actividades / liquidaciones / torneos
- ABM básico listo.  
- Liquidaciones: registrar cobros del profe → cerrar mes → marcar pagada.  

---

## 6. Checklist de pruebas (QA)

Usar seed o un club creado desde plataforma. Anotar bugs con: URL, pasos, esperado vs actual, screenshot.

### A. Humo
- [ ] `GET http://localhost:3001/health` OK  
- [ ] Login plataforma OK  
- [ ] Login club `club-prueba` OK  
- [ ] Login con slug incorrecto / pass incorrecta falla  

### B. Plataforma
- [ ] Crear club nuevo con nombre + email + USD/mes  
- [ ] Ver `login_url` + password temporal (una sola vez)  
- [ ] Select del header abre el login del club  
- [ ] Crear otro superusuario y loguearse con esa cuenta  
- [ ] No se puede desactivar el último superusuario ni a uno mismo  
- [ ] Ver `login_url` + password temporal (una sola vez)  
- [ ] Entrar al club nuevo por `/login/{slug}`  
- [ ] Completar onboarding (titular, CUIT, colores, pass nueva)  
- [ ] Crear segundo club y verificar que no ve socios/espacios del primero  
- [ ] Login A no muestra branding de B  
- [ ] Suspender club → login del club debe fallar  
- [ ] Reactivar → login OK  
- [ ] Entrar con pass maestra y ver banner “Modo soporte”  

### C. Socios y usuarios
- [ ] Crear socio  
- [ ] Importar CSV (al menos 1 fila válida)  
- [ ] Crear usuario `entrada` y otro `admin`  
- [ ] No ver socios de otro club (crear 2 clubes y verificar aislamiento)  

### D. Cobros
- [ ] Generar cobros del mes  
- [ ] Ver deudores / pagados en resumen  
- [ ] Marcar uno como pagado manual  
- [ ] Ver impacto en Inicio (% cobranza)  

### E. Reservas
- [ ] Crear espacio  
- [ ] Crear reserva  
- [ ] Intentar solape en mismo espacio/horario → error  
- [ ] Cancelar reserva  

### F. Fuga y dashboard
- [ ] Con seed, Ana aparece en Fuga  
- [ ] Inicio muestra count de alertas / deudores  

### G. Config y branding
- [ ] Cambiar color primario → nav/botones cambian  
- [ ] Quitar secundario/terciario → preview “No se usa”  
- [ ] Cambiar cuota / regla moroso y guardar  

### H. Resto 1b (smoke)
- [ ] Familia, actividad, noticia, horario, torneo + partido + tabla  
- [ ] Liquidación: cerrar mes / marcar pagada (con datos)  

### I. Contratos API (opcional Postman)
- Colección mental: [`API.md`](./API.md)  
- Header: `Authorization: Bearer …` y opcional `X-Club-Slug`  

---

## 7. Qué falta (no probar como “listo”)

| Área | Estado | Notas |
|------|--------|--------|
| App móvil Expo | No empezada | Socio / profe / entrada |
| Push FCM real | Stub | No llegan notificaciones |
| MercadoPago OAuth por club | Pendiente | Hoy token global o mock |
| Firma webhook MP | Pendiente | |
| Débito automático | Pendiente | |
| Auth socio (login DNI) en web/app | Pendiente | |
| Carnet QR / Modo Entrada | Pendiente | |
| Lista de espera reservas | Pendiente | |
| Onboarding self-serve público | Fase 4 | Hoy alta = panel plataforma |
| Uploads reales (logo) | Listo | ImageKit (CDN) si hay `IMAGEKIT_PRIVATE_KEY`; si no, disco local en dev |
| UX pulida del admin | En curso | Pantallas base; front mejora UI |
| WhatsApp Business / SMS cobro | **Fuera de alcance** | Cobranza = push (cuando exista) |

Producto completo deseado: [`../CARACTERISTICAS.md`](../CARACTERISTICAS.md) · plan: [`../PLAN.md`](../PLAN.md).

---

## 8. Guía rápida para el front

1. Leer este manual + [`FRONT.md`](./FRONT.md).  
2. Levantar DB + API + web.  
3. Recorrer todas las rutas de la sección 4.  
4. Cliente HTTP: `apps/web/src/lib/api.ts` (`apiFetch`, sesión, `applyClubTheme`).  
5. No inventar endpoints: si falta algo, pedirlo al back y documentarlo en `API.md`.  
6. Prioridad UX sugerida: Login → Inicio → Socios → Cobros → Config → Fuga.  

Estructura de carpetas: ver mapa en [`FRONT.md`](./FRONT.md).

---

## 9. Guía rápida para el tester

1. Setup sección 2 + credenciales sección 3.  
2. Seguir checklist sección 6 (A → H).  
3. Reportar bugs con pasos reproducibles.  
4. Diferenciar:  
   - **Bug de UI** (front)  
   - **Bug de API / regla** (back)  
   - **Pendiente de producto** (sección 7) — no es bug  

Si la API no levanta: un solo `npm run start:dev`; si `EADDRINUSE :3001`, hay otro proceso Nest abierto.

---

## 10. Roles (quién ve qué)

| Actor | Acceso hoy |
|-------|------------|
| Superadmin ClubApp | `/platform` |
| Admin comisión | `/admin` completo |
| Usuario `entrada` | Existe en API; UI aún no tiene panel portería separado |
| Socio / profe | Solo datos seed + API; sin app |

---

## 11. Glosario corto

| Término | Significado |
|---------|-------------|
| Slug | Identificador del club en login (`club-prueba`) |
| Tenant | Un club = un “espacio” de datos |
| Preferencia / init_point | Link de pago MercadoPago |
| Mock MP | Link falso para probar UI sin token MP |
| Alerta de Fuga | Socio en riesgo de irse (deuda o poca asistencia) |
| Modo cobro club / profe | Quién cobra la actividad |

---

## 12. Links del repo

| Doc | Para qué |
|-----|----------|
| [MANUAL_USUARIO.md](./MANUAL_USUARIO.md) | Este archivo |
| [FRONT.md](./FRONT.md) | Setup front + mapa de carpetas |
| [API.md](./API.md) | Contratos HTTP |
| [../README.md](../README.md) | Arranque monorepo |
| [../CARACTERISTICAS.md](../CARACTERISTICAS.md) | Visión de producto |
| [../PLAN.md](../PLAN.md) | Fases y arquitectura |

---

**Resumen para el equipo:**  
Ya se puede **probar de punta a punta** el panel plataforma + panel comisión (socios, cobros, reservas, reportes, 1b).  
Todavía **no** hay app móvil ni push/MP de producción. El front puede pulir UI; el tester puede usar la checklist de la sección 6.
