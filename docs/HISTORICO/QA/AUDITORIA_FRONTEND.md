# Auditoría Frontend — sport_gesti10n_app

Rama analizada: `ladindgPageFormsNew` · Fecha: 2026-09-03
Alcance: `apps/web/src` (Next.js). No incluye backend (`apps/api`) ni mobile.

Contexto: hay una migración en curso del panel `gestion` a nuevos formularios de alta (`*/nuevo/`), un `gestion/layout.tsx` nuevo y componentes compartidos en `gestion/_components/`. Este documento es el insumo para dejar la app funcional antes de mergear.

---

## Cómo leer esto

- 🔴 **Crítico** — el usuario ve algo roto (texto sin traducir, botón muerto, formulario que no navega).
- 🟠 **Importante** — funciona pero está mal conectado, duplicado o inconsistente; genera deuda o confusión.
- 🟡 **Menor** — limpieza, copy desactualizado, código muerto sin impacto de runtime.

---

## 1. 🔴 Bugs que el usuario va a ver

### 1.1 Claves de traducción faltantes en `es.json` (idioma por defecto)
`apps/web/src/app/supercalifragilisticoespiralidoso/panel/page.tsx:155` y el resto del bloque de "solicitudes" usan claves (`solicitudes.resolver`, `titleII`, `subtitleII`, `back`, `institucion`, `solicitante`, `tipo`, `fecha`, `pendientes`, `aprobar`, `rechazar`, `noSolicitudes`) que **solo existen en [en.json](apps/web/src/lib/translations/en.json)**, no en [es.json](apps/web/src/lib/translations/es.json). Como el default de la app es español y `useTranslation` devuelve la key cruda si falta, el panel superadmin muestra literalmente `solicitudes.resolver` en vez de "Resolver".

**Fix:** copiar el bloque `solicitudes.*` de `en.json` a `es.json` con su traducción real.

### 1.2 Noticias con contenido roto (ambos idiomas)
[supercalifragilisticoespiralidoso/novedades/page.tsx:44-97](apps/web/src/app/supercalifragilisticoespiralidoso/novedades/page.tsx) y [news/page.tsx:43-98](apps/web/src/app/news/page.tsx) referencian `news.article4Title` … `article10Title/Date/Excerpt`, pero las traducciones **solo definen `article1`–`article3`** (`es.json:506-512`, `en.json:503-509`). Resultado: 7 de 10 tarjetas de noticias muestran claves crudas en vez de texto.

**Fix:** o se agregan los 7 artículos faltantes a ambos JSON, o se recorta el array a los 3 artículos que sí tienen contenido.

### 1.3 Landing: formulario de contacto duplicado, uno de ellos no funciona
[landing/page.tsx](apps/web/src/app/landing/page.tsx) renderiza `<ContactSection />` (que sí hace `POST /solicitudes` de verdad, ver `ContactForm.tsx:159-174`) y justo debajo un **segundo formulario hardcodeado**, también con `id="contacto"` (id duplicado → HTML inválido, rompe el ancla `href="#contacto"`), que usa `action="mailto:hola@clubapp.com.ar"` — no persiste nada, solo intenta abrir el cliente de correo del usuario.

**Fix:** eliminar el formulario `mailto` residual; dejar solo `<ContactSection />`.

### 1.4 Hero de landing: botones muertos + texto sin traducir
[landing/components/HeroSection.tsx:53-71](apps/web/src/app/landing/components/HeroSection.tsx) tiene 4 CTAs en vez de 2:
- Dos `<a>` con texto hardcodeado en inglés ("Start Free Trial", "Watch Demo", líneas 58 y 64), sin pasar por `t(...)`.
- Dos `<button>` traducidos (`t("landing.startTrial")`, `t("landing.watchDemo")`) **sin `onClick` ni `href`** — no hacen nada al clickear.

**Fix:** quedarse con un solo par de CTAs, traducido y funcional (con href real o handler).

### 1.5 Navbar del panel club: no se puede llegar a Perfil/Preferencias
[components/common/Navbar.tsx:108-109](apps/web/src/components/common/Navbar.tsx) calcula `profileHref`/`preferencesHref` (`/gestion/config?tab=perfil`, `?tab=preferencias`) pero solo los renderiza cuando `pathname.startsWith("/supercalifragilisticoespiralidoso/")` (línea 291). En el panel de club (`variant="club"`) el dropdown de usuario **solo tiene "Cerrar sesión"** — variables calculadas y nunca usadas en esa rama.

**Fix:** mostrar también esos dos links cuando `variant === 'club'`.

### 1.6 `Torneos` es una página inalcanzable
[gestion/torneos/page.tsx](apps/web/src/app/gestion/torneos/page.tsx) está completa y funcional (fetch a `/torneos`, `/torneos/:id/partidos`, alta de partidos) pero **no tiene ningún link en toda la app** — no está en el Sidebar, ni en el dashboard, ni en `publicAdminRoutes` del middleware. Solo se llega tecleando `/gestion/torneos` a mano.

**Fix:** agregar entrada en el Sidebar (o donde corresponda) y alias público en el middleware, igual que el resto de las secciones.

---

## 2. 🟠 Navegación incompleta / inconsistente

### 2.1 Sidebar le faltan secciones
[components/common/Sidebar.tsx:21-31](apps/web/src/components/common/Sidebar.tsx), variant `"club"`, solo lista: Inicio, Socios, Cobros, Usuarios, Espacios, Horarios, Noticias, Configuración, Liquidaciones.

Faltan enlaces directos a:
- **Actividades** y **Familias** (solo alcanzables entrando primero a Horarios/Socios y usando las tabs compartidas).
- **Reservas** (solo vía tab desde Espacios).
- **Torneos** (ver 1.6, totalmente huérfana).
- **Fuga** (solo alcanzable desde una card del dashboard, `gestion/page.tsx:97-106`).

**Fix:** decidir si estas 5 secciones merecen entrada propia en el Sidebar o si el patrón de tabs/cards es intencional — pero al menos Torneos necesita algún punto de entrada.

### 2.2 Rutas de redirección mixtas en los formularios "nuevo"
`socios/nuevo`, `familias/nuevo`, `usuarios/nuevo` navegan con prefijo explícito (`router.push('/gestion/socios')`), mientras que `actividades/nuevo`, `espacios/nuevo`, `horarios/nuevo`, `noticias/nuevo`, `reservas/nuevo` usan las rutas públicas sin prefijo (`router.push('/actividades')`). Ambas funcionan hoy gracias al rewrite del middleware, pero no hay convención única — riesgo si se toca `publicAdminRoutes` más adelante.

**Fix:** unificar todos a un mismo estilo (recomendado: sin prefijo `/gestion`, usando siempre el alias público, como ya hace la mayoría).

### 2.3 Superadmin sin sesión ve un 404 en vez de ir al login
En todo el árbol `supercalifragilisticoespiralidoso/*` (`panel/page.tsx:30-34`, `entidades/page.tsx`, `entidades/[id]/page.tsx`, `panel/perfil`, `panel/preferencias`, `panel/entidades/new`, `panel/solicitudes`), si no hay `getPlatformSession()` se llama `notFound()` en vez de redirigir a `/supercalifragilisticoespiralidoso/acceso`.

**Fix:** reemplazar `notFound()` por `redirect(...)` al login de plataforma en esas rutas.

---

## 3. 🟠 Datos mock / placeholders sin conectar

| Archivo | Qué es |
|---|---|
| [app/events/page.tsx:36-49](apps/web/src/app/events/page.tsx) | `mockEvents` hardcodeado, comentario explícito `// Mock event data` |
| [supercalifragilisticoespiralidoso/eventos/page.tsx](apps/web/src/app/supercalifragilisticoespiralidoso/eventos/page.tsx) | `MockEvent`, `mockEventsByDate` — mismo patrón mock duplicado |
| [landing/components/MapContent.tsx](apps/web/src/app/landing/components/MapContent.tsx) y su copia en `inicio/components/MapContent.tsx` | `mockClubs`: 5 clubes ficticios ("Metro City FC", "European United", etc.) en el mapa Leaflet — **conviven en la misma página** con `HeroSection.tsx`, que sí trae clubes reales vía `apiFetch('/clubs/buscar')` |
| [components/common/Navbar.tsx:37-66](apps/web/src/components/common/Navbar.tsx) | `MOCK_NOTIFICATIONS`, 4 notificaciones hardcodeadas, sin fetch real ni "marcar como leída" individual |

Además, el árbol completo `app/clubs/`, `app/events/`, `app/news/`, `app/users/` parece ser un **prototipo anterior no conectado**: no aparece linkeado desde ningún nav y duplica conceptualmente las versiones reales (`supercalifragilisticoespiralidoso/entidades`, `/eventos`, `/novedades`, `/usuarios`) que sí usan la API.

**Fix:** conectar el mapa a datos reales de clubes, conectar notificaciones a un endpoint real, y decidir si `app/clubs|events|news|users` se elimina o se termina de conectar.

---

## 4. 🟡 Código muerto / limpieza de repo

- **`supercalifragilisticoespiralidoso/inicio/components/{HeroSection,FeaturesGrid,MapContent,MapSection}.tsx`**: no los importa nadie (`inicio/page.tsx` usa las versiones de `landing/components/*`). Además esa `HeroSection.tsx` local está 100% hardcodeada en inglés, sin `useTranslation` ("Manage Your Sports Clubs Like a Pro"...) — draft de plantilla SaaS genérica nunca conectado.
- **`app/layout-admin.tsx`** y **`app/layout_backup.tsx`**: huérfanos, Next.js solo usa `app/layout.tsx`. Nota: `layout_backup.tsx` tenía metadata correcta en español ("ClubApp Arg — Panel") mientras el layout activo usa `<html lang="en">` y "Sports Management System" — ver punto 5.
- **`app/page.tsx`**: importa 6 símbolos que nunca usa (`HeroSection`, `FeaturesGrid`, `MapSection`, `ContactSection`, `LanguageSwitcher`, `useTranslation`) — solo hace `redirect("/landing")`.
- **`Navbar.tsx:183-192`**: bloque de búsqueda global comentado, código muerto sin remover.
- Footers de `landing/page.tsx:282` e `inicio/page.tsx:136`: `© 2024` (desactualizado) y todos los links (Precios, Seguridad, Nosotros, Blog, Privacidad, Términos, Docs API) son `href="#"`.
- `panel/page.tsx:75`: `change: "solicitudes"` es texto crudo, no pasa por `t(...)` — queda en español aunque el idioma sea inglés.

---

## 5. 🟠 Naming / branding inconsistente

Tres nombres de marca distintos conviven en la UI:
- **"ClubApp Arg"** (metadata de `layout_backup.tsx`, huérfano)
- **"AthlletiCorp"** (footer del landing actual)
- **"Sports Management System"** (metadata activa de `app/layout.tsx:73-76`, en inglés, pese a que la app es en español por defecto)

**Fix:** decidir el nombre final de marca y unificarlo en metadata, footer y cualquier otro lugar visible. Cambiar `<html lang="en">` a `"es"` si el español es el default real.

---

## 6. 🟡 Duplicación de patrón (refactor, no bug)

- **`gestion/_components/{ActividadesHorariosTabs,EspaciosReservasTabs,SociosFamiliasTabs}.tsx`**: tres componentes casi idénticos (mismo JSX, distinto array `tabs`). Candidato claro a un único `<SectionTabs tabs={[...]} />` genérico.
- **Formularios "nuevo"** (`actividades`, `espacios`, `familias`, `horarios`, `noticias`, `reservas`, `socios`, `usuarios`): no existe un `<FormField>` reutilizable — cada campo repite manualmente `<label className="text-sm">...<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>`, duplicado 10-15 veces por archivo en 8 archivos. Extraerlo reduciría bugs de copy-paste como el siguiente punto.
- **Título copy-paste sin adaptar**: `familias/nuevo/page.tsx:66`, `actividades/nuevo/page.tsx:36`, `espacios/nuevo/page.tsx:51`, `horarios/nuevo/page.tsx:38` usan los 4 la clave `t('admin.socios.quickCreate')` como título, en vez de una clave propia. Funciona porque el texto es genérico ("Alta Rápida") pero delata copy-paste sin ajustar.
- **`socios/nuevo/page.tsx`** es el único formulario "nuevo" que soporta editar (`?id=` query param). Si `usuarios/nuevo` (u otros) también van a necesitar edición, conviene definir el patrón una sola vez.

---

## 7. Prioridad sugerida (orden de trabajo)

1. **Traducciones rotas** (1.1, 1.2) — 30 min, impacto visual inmediato en dos paneles.
2. **Landing: formulario duplicado + CTAs muertos** (1.3, 1.4) — primera impresión de la app pública.
3. **Navbar sin acceso a Perfil/Preferencias en panel club** (1.5) — funcionalidad básica ausente.
4. **Torneos huérfana + Sidebar incompleto** (1.6, 2.1) — features ya construidas pero inalcanzables.
5. **Superadmin: 404 en vez de login** (2.3) — UX de auth.
6. **Mocks pendientes de conectar** (sección 3) — depende de qué tan prioritario sea el mapa/notificaciones reales.
7. **Branding unificado** (sección 5) — cosmético pero visible en producción.
8. **Limpieza de código muerto y refactor de duplicación** (secciones 4, 6) — housekeeping, sin apuro pero baja el riesgo de bugs futuros como el 1.7 del punto 6.

---

*Generado a partir de una exploración estática del código (no se verificó visualmente en navegador). Antes de dar por cerrado cada punto, confirmar el comportamiento real en el preview.*
