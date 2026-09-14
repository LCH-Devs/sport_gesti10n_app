# Paralelismo Backend/Web ↔ Mobile y Plan de Actualización

_Fecha: 2026-09-14_

> Nota: `CLAUDE.md` marca `apps/mobile` como "fuera de este milestone". Este documento se generó a pedido explícito del usuario para trazar el paralelismo y dejar un plan listo para cuando se decida retomarlo.

## 1. Qué es hoy `apps/mobile`

Stack: **Expo SDK 57 + React Native 0.86 + Expo Router** (file-based routing), sin Redux/Zustand (solo `AuthContext` y `LanguageContext` con React Context), cliente HTTP propio (`apiFetch<T>()` sobre `fetch`, sin interceptores).

Diagnóstico general: es un **scaffold visual**, no una app funcional conectada al backend real.
- Login real contra `/auth/socio/login` (`apps/mobile/src/lib/api.ts:32`), es el **único** endpoint que la app consume.
- Sesión **no persistida** — vive en `useState` de `AuthContext`, se pierde al recargar la app (sin `AsyncStorage`/`SecureStore`).
- El tipo `LoginResponse` ya declara `role`, `cuentas[]`, `must_complete_onboarding`, `must_change_password`, `impersonated_by_platform` — pero **ninguno se usa** en la lógica de la app.
- Todas las pantallas de tabs (`Home`, `Schedule`, `Payments`) y **todas** las pantallas de `/admin/*` (salvo el layout) muestran datos **hardcodeados**; las de admin son literalmente el mismo componente genérico `AdminSection` repetido con distinto título.
- `packages/shared` está declarado como dependencia pero no se usa en ningún archivo — y además sus tipos (`User`, `Club`, `Event`, etc., en camelCase con `id: string`) no coinciden con la forma real de las respuestas de `apps/api` (que tampoco lo usa). Es un paquete de scaffolding viejo, desalineado; no conviene resucitarlo como base común, mejor definir tipos mobile a partir de las respuestas reales de la API (mismo criterio que ya se usa en `apps/web/src/lib/api.ts`).
- Sin tests, sin CI (el `ci.yml` solo tiene jobs `api` y `web`), sin README propio.

## 2. Paralelismo módulo por módulo

| Módulo / feature (hecho en backend+web) | Endpoint real | Estado en mobile |
|---|---|---|
| Login unificado por rol (R10/R17) | `POST /auth/login` | Mobile pega a `/auth/socio/login` (endpoint viejo, solo socio). No diferencia rol ni tiene login de staff. |
| Cambio de contraseña obligatorio (R10) | `must_change_password` en login | Campo tipado, no usado. Sin pantalla de cambio. |
| Multi-cuenta / switcher de clubes (R17) | `cuentas[]` en login | Campo tipado, no usado. Sin UI. |
| Portal del socio — datos reales (R16) | `GET /socio/me` | No implementado. Home/Payments muestran mocks. |
| Reservas propias del socio (R16) | `GET/POST/DELETE /socio/reservas` | No implementado. |
| Espacios activos (R16) | `GET /socio/espacios` | No implementado (pantalla admin de espacios es mock). |
| Export CSV socios (R14) | `GET /socios/export-csv` | N/A, es funcionalidad de admin/web, no aplica a mobile. |
| Eventos (nuevo módulo, reemplaza "Torneos" como concepto general) | `GET /eventos-publicos`, `/eventos` (staff) | No implementado. Solo copy hardcodeado "Fall Tennis Tournament" / "Upcoming Events" sin datos. |
| Torneos (fixtures/tabla, se mantuvo intacto) | `GET /torneos/...` | No implementado en mobile. |
| Identidad compartida / cross-club (R07) | — | No aplica directamente a UI, pero el switcher de cuentas (R17) es el punto de entrada natural en mobile y no existe. |
| Sesión invalidada tras cambio de password (R10, JWT `iat` vs `password_changed_at`) | — | Como no hay persistencia de sesión ni refresh, este mecanismo no puede probarse ni romperse en mobile hoy — pero tampoco hay manejo de token expirado/401 en `apiFetch`. |

**Conclusión del paralelismo:** todo lo construido en las últimas fases (Eventos, reservas propias, portal socio, seguridad de login) vive únicamente en backend+web. Mobile quedó congelado en un estado anterior (ni siquiera tiene el login viejo de staff) y no tiene ganchos para nada de esto.

## 3. Plan de actualización (por fases, incremental)

### Fase 0 — Cimientos (bloqueante para todo lo demás) ✅ implementada 2026-09-14
1. **Cliente API real** (`apps/mobile/src/lib/api.ts`): `apiFetch` sigue inyectando `Authorization: Bearer` cuando hay token; se agregó `UnauthorizedError` + `setUnauthorizedHandler()` para reaccionar a un 401 desde cualquier request (logout automático, ver punto 2). `EXPO_PUBLIC_API_URL` sigue siendo la forma de configurar el host (no se tocó, sigue con default `localhost:3001` — falta `.env` de mobile, queda anotado).
2. **Persistencia de sesión** (`apps/mobile/src/lib/session-storage.ts`, nuevo): `expo-secure-store` guarda el `access_token`; el resto de la sesión (role, cuentas, club, socio/admin) va en `AsyncStorage` vía `@react-native-async-storage/async-storage`. `AuthContext` restaura la sesión al montar (`restoring` state + splash) y el 401 global limpia el storage y desloguea.
3. **Login unificado**: `apps/mobile/src/lib/api.ts` ahora pega a `POST /auth/login` (antes `/auth/socio/login`) — mismo endpoint que usa `apps/web`, resuelve socio o staff según credenciales. `AuthContext` expone `isStaff` (via `isStaffRole(session.role)`) y `profile.tsx` usa ese flag para mostrar "Modo administración" solo a roles staff (antes era un botón fijo para cualquiera).
4. **`must_change_password`**: nueva pantalla `apps/mobile/src/app/cambiar-clave.tsx` (mismo patrón/regex que `apps/web/src/app/socio/cambiar-clave/page.tsx`), llama a `PATCH /socio/me` o `PATCH /admins/me` según rol (`changePassword()` en `api.ts`). El gate en `_layout.tsx` (`AuthGate`) redirige ahí si `session.must_change_password` es `true`, antes de dejar entrar a cualquier tab.
5. **Multi-cuenta**: `apps/mobile/src/components/AccountSwitcherModal.tsx` (nuevo) — modal simple que lista `session.cuentas` y llama a `POST /auth/switch` (`switchCuenta()` en `api.ts`). Se muestra desde `profile.tsx` solo si `cuentas.length > 1`.

**Para revisar a mano (Fase 0):**
- Instalar deps nuevas si no corriste `pnpm install` todavía (`expo-secure-store`, `@react-native-async-storage/async-storage` — ya corrido en este entorno, pero falta `expo prebuild`/rebuild nativo si vas a probar en dispositivo/simulador real, ya que `expo-secure-store` es un módulo nativo).
- Probar el flujo completo a mano: login con socio, login con staff, forzar `must_change_password` en un socio de prueba y confirmar el redirect + que loguea bien después, cerrar la app y reabrir para confirmar que la sesión persiste, y probar "Cerrar sesión" (nuevo botón en Perfil).
- Si el socio/admin de prueba tiene más de un club, probar el switcher de cuentas nuevo en Perfil.
- No se creó `.env`/`app.config` con `EXPO_PUBLIC_API_URL` — sigue apuntando a `localhost:3001` por default; en dispositivo físico hay que exportar esa variable con la IP de la máquina.
- No se tocó el resto de las pantallas mock (Home/Schedule/Payments/Admin) — eso es Fase 1 en adelante.

### Fase 1 — Portal del socio real ✅ implementada 2026-09-14
6. **`apps/mobile/src/hooks/useSocioPortal.ts`** (nuevo): pega a `GET /socio/me` (`getPortalMe()` en `api.ts`, con tipos `Pago`/`Noticia`/`ActividadResumen`/`PortalMe`) solo cuando la sesión es de socio (`!isStaff`); expone `{portal, loading, error, reload}`.
7. **Home** (`(tabs)/index.tsx`): la credencial ahora muestra DNI/estado/nombre reales del socio, "Mis actividades" lista las inscripciones reales (`portal.actividades`), y se agregó una card de "Última noticia" (`portal.noticias[0]`). Accesos rápidos navegan a Schedule/Payments/Perfil reales en vez de ser botones sin acción.
8. **Payments** (`(tabs)/payments.tsx`): reemplazado por completo — nombre del club real, saldo pendiente calculado de `portal.pagos` (suma de `estado === 'pendiente'`), y listado real de cuotas con badge de estado (pendiente/pagado/cancelado/rechazado/reembolsado). Se sacaron los datos de tarjeta/método de pago inventados (ese flujo de cobro online es de MercadoPago, fuera de alcance de esta fase).
9. **Schedule** (`(tabs)/schedule.tsx`): pestañas renombradas a "Mis actividades" (`portal.actividades`) y "Noticias del club" (`portal.noticias`, con fecha/título/cuerpo reales) — el tab de "eventos" tipo torneo/seminario queda para la Fase 3 (módulo Eventos), no se mezcló con noticias a propósito.
10. Todas las pantallas manejan `loading` (spinner o skeleton simple), `error` (mensaje visible) y `pull-to-refresh` (`RefreshControl`), algo que no existía antes en ningún lado de mobile.
11. Si el usuario logueado es staff (`isStaff`), Home/Schedule/Payments muestran un mensaje corto en vez de intentar pegarle a `/socio/me` (ese endpoint 403-ea para roles no-socio) — Fase 4 decide qué mostrar ahí en su lugar.

**Para revisar a mano (Fase 1):**
- Loguearse como socio con cuotas/noticias/actividades reales cargadas en el club de prueba y confirmar que Home/Payments/Schedule muestran los datos correctos (no mocks).
- Probar con un socio sin cuotas/actividades/noticias (empty states).
- Probar pull-to-refresh en las tres pantallas.
- Confirmar que un login de staff no rompe estas pantallas (debe mostrar el mensaje corto, no crashear ni pegarle a `/socio/me`).
- Los estilos son un ajuste rápido sobre el mock existente, no un rediseño — revisar visualmente en un dispositivo/simulador si el team de diseño quiere pulir esto.

### Fase 2 — Reservas y espacios ✅ implementada 2026-09-14
12. **`apps/mobile/src/lib/api.ts`**: agregados `listEspaciosSocio()`, `getDisponibilidad()`, `listReservasSocio()`, `crearReservaSocio()`, `cancelarReservaSocio()` (tipos `Espacio`/`Reserva`/`Slot`), contra `/socio/espacios`, `/socio/espacios/:id/disponibilidad`, `/socio/reservas` y `/socio/reservas/:id/cancelar` — mismos endpoints que ya usa `apps/web/src/app/socio/page.tsx`.
13. **`apps/mobile/src/hooks/useReservas.ts`** (nuevo): carga espacios + reservas propias, expone `buscarDisponibilidad(espacioId, fecha)`, `reservar(espacioId, slot)` y `cancelar(reservaId)`.
14. **`apps/mobile/src/components/ReservasPanel.tsx`** (nuevo): elegir espacio (chips horizontales) + fecha (texto `AAAA-MM-DD`, sin date-picker nativo todavía — ver nota abajo) → buscar horarios libres → tocar un horario para reservar; abajo, "Mis reservas" separadas en futuras (con botón cancelar vía `Alert.alert` de confirmación) e historial colapsado.
15. Integrado como tercera pestaña interna ("Reservas") en `(tabs)/schedule.tsx`, junto a "Mis actividades" y "Noticias del club" — no se agregó un 5° tab en la barra inferior para no recargarla.

**Para revisar a mano (Fase 2):**
- Probar el flujo completo: elegir espacio, poner una fecha válida, ver horarios libres, reservar uno, confirmar que aparece en "Mis reservas" y que el horario ocupado ya no aparece como libre si volvés a buscar.
- Probar cancelar una reserva futura y confirmar que se mueve al historial.
- Probar con un club sin espacios cargados (empty state) y con una fecha inválida (mensaje de validación).
- **Pendiente de pulido, no bloqueante**: la fecha se ingresa como texto libre `AAAA-MM-DD` en vez de un selector de calendario nativo — usable pero poco amigable; si se justifica, se puede sumar `@react-native-community/datetimepicker` más adelante.
- Confirmar que un login de staff no intenta cargar este panel (la pestaña completa de Schedule ya está gateada por `isStaff` desde la Fase 1).

### Fase 3 — Eventos ✅ implementada 2026-09-14
16. **`apps/mobile/src/lib/api.ts`**: agregado `listEventosPublicos()` contra `GET /eventos-publicos` (tipo `EventoPublico`, incluye `club{id,nombre,slug,logo_url}`) — mismo endpoint cross-tenant que usa `apps/web/src/app/gestion/eventos/page.tsx` para el feed público, disponible para cualquier identidad logueada (socio o staff, sin necesidad de `club_id`).
17. **`apps/mobile/src/hooks/useEventosPublicos.ts`** (nuevo) + **`apps/mobile/src/components/EventosPanel.tsx`** (nuevo): lista de próximos eventos públicos con badge de tipo (seminario/torneo/social, con ícono distinto para cada uno) y club de origen.
18. Reemplazó el placeholder "Upcoming Events"/"Fall Tennis Tournament" — quedó integrado como cuarta pestaña interna ("Eventos") en `(tabs)/schedule.tsx`, junto a Actividades/Noticias/Reservas. Achiqué las etiquetas de las pestañas ("Mis actividades"→"Actividades", "Noticias del club"→"Noticias") para que entren 4 en la fila.
19. **Pendiente, fuera de esta fase a propósito**: la gestión de eventos por parte del staff (crear/editar vía `/eventos`, admin) no se conectó — como toda la sección `/admin/*` de mobile sigue siendo 100% mock (ver Fase 4), y hoy la pantalla de Schedule completa (con las 4 pestañas) está gateada por `isStaff` — un staff que loguea en mobile hoy no ve ni siquiera el feed público de eventos, aunque el endpoint se lo permitiría. Vale la pena revisarlo cuando se aborde Fase 4.

**Para revisar a mano (Fase 3):**
- Loguearse como socio y confirmar que la pestaña "Eventos" trae los eventos públicos reales (creados desde `apps/web` → Eventos, marcados público + publicado).
- Probar con cero eventos públicos cargados (empty state).
- Confirmar visualmente que los 4 tabs entran bien en pantallas angostas (se acortaron las etiquetas para esto, pero conviene chequear en un dispositivo real).

### Fase 4 — Admin mobile (evaluar si entra en alcance)
12. Las pantallas `/admin/*` hoy son 100% mock; conectarlas de a una (socios, finanzas, operación) sería un proyecto en sí mismo — recomiendo tratarlo como decisión aparte una vez cerradas las fases 0-3, dado que `apps/web` ya cubre ese rol.

### Transversal
13. **CI para mobile**: agregar un job liviano (`expo-doctor` / `tsc --noEmit` / lint) al `ci.yml`, aunque sea sin build nativo completo.
14. **Tests**: al menos tests de la capa `lib/api.ts` y del `AuthContext` (hoy no hay ninguno).
15. Revisar si conviene alinear tipos con `apps/web/src/lib/api.ts` (que ya modela bien las respuestas reales) en vez de con `packages/shared`.

## 4. Orden recomendado

Fase 0 es estrictamente bloqueante (sin sesión persistida ni login correcto, nada de lo demás tiene sentido). Fases 1-3 son independientes entre sí y se pueden priorizar según qué use más el socio en el día a día (portal + cuotas primero, después reservas, después eventos). Fase 4 y el punto de CI/tests quedan para después, como se hizo con el resto del roadmap.
