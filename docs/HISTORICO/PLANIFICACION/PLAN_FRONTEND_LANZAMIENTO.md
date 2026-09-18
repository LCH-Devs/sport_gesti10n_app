# Plan frontend de lanzamiento

Trabajo que puede avanzar sin backend: [Plan frontend independiente](PLAN_FRONTEND_INDEPENDIENTE.md).

Fecha: **09/09/2026**. Fuente: [ROADMAP_LANZAMIENTO.md](ROADMAP_LANZAMIENTO.md).

Este documento extrae todo el trabajo de frontend del roadmap general y lo organiza para su ejecución. Conserva sus prioridades y alcance: **versión 1.0 web con cuotas manuales; MercadoPago en 1.1**. No reemplaza los criterios generales de seguridad, operación y piloto.

**Aplicación objetivo: `apps/web`.** El inventario del roadmap no encontró `apps/web-v2`; mobile queda fuera. Antes de implementar, contrastar los archivos con el código vigente y seguir [AGENTS.md](../AGENTS.md).

Estado actualizado al 09/09/2026: B01 de backend está implementado y habilita la integración de FE04, FE05 y FE08. El cierre frontend de esas tareas todavía requiere validación en navegador. Los resultados de pruebas citados son los del análisis original salvo donde se indique explícitamente.

## 1. Alcance y responsabilidades

El equipo frontend se encarga de las pantallas, navegación, sesiones en navegador, consumo de contratos, estados de interacción, adaptación a celular, componentes compartidos, build web y validación de recorridos. Participa con operaciones en staging y despliegue del artefacto web.

La API sigue siendo la autoridad sobre permisos, tenant, titularidad, importes y estados. Ocultar un botón, filtrar una lista o impedir un segundo clic no implementa seguridad ni idempotencia en el servidor. Las dependencias backend se registran aquí para coordinar entregas; no son tareas de implementación del equipo frontend.

| Prioridad | Significado |
|---|---|
| P0 | Bloquea el piloto con datos reales |
| P1 | Bloquea la salida comercial 1.0 |
| P2 | Posterior a 1.0; no retrasa ese lanzamiento |

Responsable por defecto de FE01–FE20: **frontend**. QA valida recorridos; backend entrega contratos; producto define marca, textos y reglas comerciales; operaciones entrega entorno. Asignar un nombre a cada tarea al iniciarla.

### Recorridos incluidos

- Plataforma: solicitudes, alta asistida de clubes, entrega de acceso, suspensión, rehabilitación y baja lógica.
- Comisión: configuración/onboarding, socios y CSV, cuotas manuales, espacios/reservas, noticias y horarios.
- Socio y profe: portal básico con datos propios, cuotas, reservas y novedades; sin funciones especiales de profesor.
- Transversales: login, recuperación, cambio de clave/club, marca del club, soporte y acceso a condiciones del servicio.

Familias y actividades se conservan como organización si están expuestas. Descuentos y adicionales automáticos, liquidaciones, torneos, Social, QR, push, mobile y billing autoservicio no se incorporan a la oferta 1.0. Ocultar funciones fuera de oferta no implica borrar módulos existentes.

## 2. Punto de partida heredado del roadmap

| Hallazgo | Consecuencia frontend | Tarea |
|---|---|---|
| TypeScript web aprobado, pero build productivo falló por `useSearchParams()` sin Suspense en alta de club | Resolver prerender antes de publicar | FE01 |
| Dockerfile web espera `.next/standalone`; configuración no lo habilita | Alinear artefacto y despliegue | FE02 |
| Next 15.5.23 en lock y locks npm/pnpm coexistentes | Revisar parches aplicables e instalación reproducible | FE02 |
| Middleware activo reescribe hacia `/gestion`; documentación conserva otras rutas | Inventariar y unificar navegación sin renombrar rutas a ciegas | FE03 |
| Layout de gestión solo envuelve contenido; el global tiene controles parciales | Revisar acceso directo, sesión ausente y gates centralizados | FE04 |
| TTL real de 30 días frente a 8 horas documentadas | Consumir la política que se acuerde con backend | FE04 |
| Plataforma devuelve grafos con datos privados en algunos recursos | Adaptar consumidores al contrato seguro y plano | FE05 |
| “Olvidé contraseña” enlaza a `#` | Completar flujo junto con API | FE06 |
| Onboarding solicita tarjeta/CVV sin completar suscripción | Retirar el paso y su estado de formulario | FE07 |
| Login de miembro apunta a `/socio`, sin portal completo encontrado | Completar recorrido y endpoints propios | FE14 |
| Enlaces de cobro simulados y push sin entrega real | Mostrar modo manual y resultados honestos | FE11, FE16 |
| Eventos/mapa con mocks; marca Kanri/ClubApp inconsistente | Depurar oferta y unificar marca | FE17 |

No se afirma que estos problemas sigan iguales después de nuevas modificaciones: verificar al tomar cada tarea. Este plan no introduce una auditoría técnica adicional.

## 3. Fase A — Base técnica, rutas y acceso

### FE01 — Corregir el build de producción · P0

- **Origen:** R03, diagnóstico de build.
- **Puntos de entrada:** `apps/web/src/app/supercalifragilisticoespiralidoso/panel/entidades/new/page.tsx` y los componentes que utiliza.
- Resolver el uso de `useSearchParams` y el límite de Suspense en el recorrido afectado. Revisar los errores adicionales que aparezcan al completar el build.
- **Dependencia:** ninguna API nueva.
- **Aceptación:** `pnpm --filter web build` termina con salida 0 y la página de alta funciona al abrirla directamente y al navegar desde el panel. No deshabilitar validaciones para hacer pasar la compilación.

### FE02 — Preparar instalación, CI y artefacto web · P0

- **Origen:** R02, R03, R04; parte técnica de R20.
- **Puntos de entrada:** `apps/web/package.json`, `apps/web/next.config.js`, `apps/web/Dockerfile`, locks y configuración de CI del repositorio.
- Acordar con el responsable del monorepo el lock reproducible; revisar parches aplicables de Next/React y dependencias web al ejecutar la tarea.
- Alinear el formato de salida web con el despliegue elegido; configurar variables públicas del entorno en el momento correcto del build.
- Incorporar type-check, build y pruebas frontend pertinentes a CI; un fallo bloquea la entrega web.
- **Dependencia:** operaciones proporciona staging, URL API y dominio/hosts de prueba; coordinar cambios compartidos de locks.
- **Aceptación:** instalación desde checkout limpio, checks aprobados y arranque del artefacto productivo en staging. Sin URLs de desarrollo en la versión publicada ni variables privadas expuestas al navegador.

### FE03 — Unificar mapa de rutas y navegación · P0

- **Origen:** R01, R17, R20.
- **Puntos de entrada:** `src/middleware.ts`, `src/lib/tenant-routing.ts`, `src/lib/tenant-host.ts`, `src/lib/apply-login.ts`, Sidebar y Navbar.
- Documentar ruta pública, destino interno, host permitido y roles para landing, login, comisión, plataforma y portal.
- Alinear enlaces, redirecciones y reescrituras con el mapa acordado; reutilizar helpers de host. Revisar la integración del helper tenant existente con el middleware activo.
- Mantener las rutas actuales como punto de partida; cualquier cambio de prefijo exige revisar enlaces y compatibilidad.
- **Dependencia:** producto/líder técnico acuerdan mapa y dominio; backend mantiene la separación de endpoints club/plataforma.
- **Aceptación:** acceso directo, refresco, atrás/adelante y cambio de host/club sin bucles, 404 ni destinos de otro rol. La navegación al portal termina en una ruta implementada.

### FE04 — Sesión, permisos visibles y cambio de club · P0

- **Origen:** R06, R08, R09, R17; política de sesión de la sección 5.
- **Puntos de entrada:** `src/lib/api.ts`, `src/lib/apply-login.ts`, layouts y componentes de navegación.
- Centralizar gates de sesión/onboarding/cambio de contraseña; evitar repetirlos en cada página.
- Resolver expiración, 401, 403 y suspensión sin dejar datos anteriores visibles; al cambiar de club renovar datos y tema, descartando respuestas pendientes del club previo.
- Alinear “recordarme” con la política real. Usar `expires_in` si lo expone el contrato acordado; no fijar un TTL distinto en frontend.
- Ajustar acciones visibles por rol. `entrada` conserva lectura staff; no presentarlo como permiso exclusivo de portería.
- Si el backend conserva soporte impersonado, identificar claramente esa sesión y su contexto; no crear una vía de acceso mediante contraseña maestra en la UI.
- **Dependencia:** R06/R08: vigencia y revocación reales, semántica de errores y política de soporte/TTL.
- **Aceptación:** sin sesión, sesión vencida, club suspendido, rol cambiado y plataforma desactivada producen una salida coherente tras respuesta del servidor; no quedan pantallas con datos de otro club.

### FE05 — Consumir personas aplanadas y respetar identidad compartida · P0

- **Origen:** R05, R07, R09.
- **Puntos de entrada:** `src/lib/api.ts`, recursos de plataforma, formularios de socios/usuarios y perfil.
- Adaptar tipos y vistas al contrato seguro: `id` de persona es `membresia.id`; email/nombre/DNI se consumen aplanados.
- Ajustar campos editables y mensajes de vinculación/restauración según la política de identidad global que defina backend.
- No resolver la exposición de hashes borrándolos después de recibirlos: la corrección debe ocurrir en API.
- **Dependencia:** R05/R07 y documentación de campos permitidos, respuestas de vinculación y conflictos.
- **Aceptación:** pantallas funcionan con DTOs planos; la inspección de red no muestra hashes/secretos; un operador no recibe una opción que prometa modificar datos globales fuera de su autorización.

### FE06 — Recuperación, invitación y cambio de contraseña · P1

- **Origen:** R10, recorridos de acceso/recuperación.
- **Puntos de entrada:** login, página existente de cambio de clave, `src/lib/api.ts`; localizar equivalentes de plataforma antes de crear vistas.
- Reemplazar enlace vacío por solicitud de recuperación y pantalla de definición de contraseña mediante token; incluir entrada desde invitación según contrato.
- Cubrir éxito, expiración, reutilización, enlace inválido, error de correo/reintento y confirmación de nueva sesión.
- Respuestas genéricas de recuperación; no revelar si un email pertenece a alguien. No persistir tokens de recuperación innecesariamente ni enviarlos a telemetría.
- **Dependencia:** R10: endpoints, enlaces, validaciones y envío de correo; los nombres de rutas API quedan por acordar.
- **Aceptación:** un usuario completa el flujo con un enlace real del entorno de pruebas, sin intervención en DB y sin recurrir a contraseña común.

## 4. Fase B — Alta y administración diaria

### FE07 — Simplificar onboarding · P1

- **Origen:** R18, R24.
- **Punto de entrada:** `src/app/gestion/onboarding/page.tsx`.
- Retirar tarjeta, CVV y simulación de suscripción, incluyendo estado y resumen asociado.
- Mantener titular, datos del club, branding, seguridad, deportes/espacios previstos y cierre; revisar validaciones y consistencia al avanzar/retroceder.
- Mostrar fallos parciales de creación de espacios y permitir recuperarse sin sugerir que todo se guardó ni duplicar altas exitosas.
- **Dependencia:** contrato de onboarding existente; backend para reintentos que requieran idempotencia.
- **Aceptación:** acceso temporal → clave propia → club configurado → panel. No se solicitan datos de tarjeta; resultado parcial y total se distinguen.

### FE08 — Completar el recorrido de plataforma · P1

- **Origen:** alcance plataforma, R17, R24 y pruebas de alta/salida del servicio.
- **Puntos de entrada:** pantallas de solicitudes, entidades y usuarios bajo `src/app/supercalifragilisticoespiralidoso`.
- Validar solicitud → alta asistida → credenciales de una sola visualización → acceso del club; mostrar resultado del correo sin confundir alta con entrega de email.
- Revisar suspensión, rehabilitación y baja lógica: confirmación con nombre del club, efecto explicado, errores y estado actualizado tras respuesta.
- Consumir recursos seguros de FE05; mantener el acceso de plataforma separado del de club.
- **Dependencia:** contratos de plataforma y R05/R06/R07; producto proporciona procedimiento de alta/baja.
- **Aceptación:** operador completa el ciclo con datos ficticios; las acciones de un club no modifican la sesión de otro ni se muestran como completadas antes de confirmación del servidor.

### FE09 — Padrón, altas y edición de socios · P1

- **Origen:** R07, R14, R19.
- **Puntos de entrada:** `src/app/gestion/socios`, formularios de usuarios/familias/actividades.
- Completar listado, alta, edición, baja/restauración admitida por API y mensajes de duplicado/vinculación.
- Mostrar el límite de miembros conforme al contrato comercial y al backend, sin calcularlo con una regla distinta en pantalla.
- Mantener familias/actividades como organización y aclarar u ocultar descuentos/adicionales todavía no aplicados.
- **Dependencia:** R07/R14: identidad compartida, límites y comportamiento de restauración.
- **Aceptación:** CRUD y organización funcionan usando componentes comunes/DataTable; errores no pierden innecesariamente el formulario; ningún cambio de UI altera IDs de membresía.

### FE10 — Importación y exportación del padrón · P1

- **Origen:** R14, R24, salida del servicio.
- **Punto de entrada:** importación existente de socios y componentes de listado.
- Facilitar plantilla CSV, selección/envío, estado de carga y resumen de creados/actualizados/errores por fila.
- Ofrecer corrección/reintento sin sugerir que falló todo cuando el servidor aceptó parte del archivo.
- Añadir exportación íntegra del padrón autorizado; no exportar solo las filas paginadas visibles. Acordar obtención de datos con backend.
- **Dependencia:** R14: parser, contrato de resultados y exportación/límites. No implementar un parser alternativo como fuente de verdad.
- **Aceptación:** CSV de 100 registros con duplicados/comillas/errores produce resultado comprensible; reimportación y exportación mantienen datos e identidad por club.

### FE11 — Emisión y consulta de cuotas manuales · P1

- **Origen:** R11, R12, R18.
- **Punto de entrada:** `src/app/gestion/cobros/page.tsx`, tipos y cliente API.
- Mostrar período, monto y resultado de emisión manual; eliminar mensajes de envío automático, enlaces mock y CTAs MP en 1.0.
- Presentar pendientes/pagadas, filtros y totales coherentes. Mostrar errores parciales y reintento según contrato.
- Desactivar acciones mientras se envían para evitar repeticiones accidentales; refrescar con el estado canónico al terminar. No recalcular ni cambiar en cliente cuotas ya emitidas.
- **Dependencia:** R11/R12: emisión desacoplada de MP, idempotencia, precisión monetaria y respuesta parcial.
- **Aceptación:** generar deuda funciona sin MP; repetir la operación muestra el resultado real sin falsas duplicaciones; importes coinciden con los del servidor y no aparecen promesas de push.

### FE12 — Registrar pago y consultar correcciones · P1

- **Origen:** R13 y cierre mensual.
- **Punto de entrada:** pantalla de cobros y detalle/componente de pago existente, si lo hay.
- Formulario de pago manual con medio y fecha; operador tomado del resultado de API, no de una identidad seleccionable por el cliente.
- Permitir corrección conforme al contrato, solicitar motivo y mostrar historial/valor anterior y origen manual.
- Confirmar acciones relevantes y actualizar totales tras guardado.
- **Dependencia:** R13: persistencia de auditoría, campos, permisos y operación de corrección todavía por definir.
- **Aceptación:** registrar → consultar → corregir conserva historial visible y coincide con el reporte del mes. No sustituir auditoría por historial local del navegador.

### FE13 — Espacios, disponibilidad y reservas · P1

- **Origen:** R15, R17.
- **Puntos de entrada:** `src/app/gestion/espacios`, `src/app/gestion/reservas` y calendario existente.
- Completar configuración del espacio, disponibilidad, creación y cancelación; presentar horarios argentinos y reglas del club.
- Manejar turno ocupado entre selección y confirmación, límite alcanzado, socio suspendido/moroso y cancelación fuera de plazo según rol.
- Tras conflicto, refrescar disponibilidad y conservar lo recuperable de la selección; confirmar éxito únicamente con respuesta de API.
- **Dependencia:** R15: exclusión atómica, validación temporal y reglas de cancelación del servidor.
- **Aceptación:** dos navegadores intentan reservar el mismo intervalo: uno confirma y el otro ve un conflicto accionable. Probar solape parcial, pasado, límite y medianoche.

## 5. Fase C — Portal y comunicación

### FE14 — Portal básico de socio/profe · P1

- **Origen:** R16 y alcance del portal.
- **Puntos de entrada:** `src/lib/apply-login.ts`, helpers de sesión socio y perfil existente. Ruta definitiva según FE03.
- Crear/completar inicio y navegación del portal: perfil propio, cuotas, reservas propias y novedades.
- Mostrar instrucciones de pago manual provistas por el club y estado del servidor; no agregar carga de comprobantes ni otra función no prevista.
- Integrar alta/cancelación de reserva propia con la experiencia de FE13; API determina el titular por sesión.
- Profe recibe este mismo alcance básico; no incluir liquidaciones ni asistencia avanzada.
- **Dependencia:** R16: endpoints propios de cuotas, disponibilidad/reservas y contenido; solo el perfil está identificado en el análisis. También FE04, FE06 y R15.
- **Aceptación:** login real lleva a una página existente; socio opera desde celular y solo recibe sus datos. Nunca descargar listados de staff para filtrarlos en cliente.

### FE15 — Noticias, horarios y resumen del club · P1

- **Origen:** R18, alcance de comunicación/cuotas y matriz de aceptación.
- **Puntos de entrada:** noticias, horarios y dashboard de gestión; vistas de novedades del portal.
- Validar publicación/edición y consulta de noticias/horarios con contenido real; mensajes de vacío/carga/error.
- Revisar resumen de cuotas y reservas para que refleje información del servidor. No presentar reportes de asistencia/fuga como completos si dependen de datos fuera de esta versión.
- Respetar visibilidad de borrador/publicado y alcance por club; renderizar contenido de forma segura usando patrones existentes.
- **Dependencia:** endpoints de lectura autorizada del portal y reglas de visibilidad; backend mantiene filtrado y totales.
- **Aceptación:** noticia publicada se ve en el club correspondiente; borrador no llega a quien no puede verlo; horarios y resumen coinciden con las operaciones realizadas.

### FE16 — Configuración, branding y preferencias honestas · P1

- **Origen:** R18, R19, alcance de marca; diagnóstico de logos/preferencias.
- **Puntos de entrada:** configuración, `ClubLogoField`, `ClubColorFields`, helpers de tema y preferencias de plataforma.
- Completar guardado/lectura de configuración y aplicar nombre/logo/colores al cambiar de club o recargar.
- Mostrar límites/tipos admitidos de logo, progreso y errores; alinear validaciones cliente con las del servidor.
- Retirar o aclarar preferencias locales que aparenten activar notificaciones reales; no confirmar entregas inexistentes.
- **Dependencia:** API de configuración/uploads existente; operaciones garantiza URL y persistencia del archivo.
- **Aceptación:** logo y tema sobreviven a recarga y despliegue de prueba; rechazo de archivo se explica; preferencias visibles describen lo que realmente hacen.

## 6. Fase D — Oferta visible y calidad transversal

### FE17 — Landing, marca, demos y navegación del alcance · P1

- **Origen:** R01, R19, R24, diagnóstico de mocks y marca.
- **Puntos de entrada:** landing, eventos genéricos/de plataforma, mapa, menús y textos existentes.
- Aplicar nombre comercial aprobado y promesa 1.0; distinguir abono del software de cuota del socio y mostrar límites/precio solo según definición comercial.
- Reemplazar datos demo con datos autorizados, identificarlos como demostración o retirarlos de producción.
- Ocultar navegación de módulos fuera de oferta y opciones inoperantes; conservar el código existente salvo decisión explícita.
- Verificar formulario de solicitud, confirmación/error y estados de envío.
- **Dependencia:** producto define marca/oferta/textos y autoriza datos públicos; backend de solicitudes existente.
- **Aceptación:** toda función anunciada tiene recorrido usable en 1.0; no hay clubes ficticios presentados como clientes, enlaces vacíos ni oferta de push/MP automático.

### FE18 — Adaptación a celular y componentes comunes · P1

- **Origen:** R17, R19, R25 y prueba web real.
- **Puntos de entrada:** componentes comunes, layouts y todas las pantallas incluidas.
- Usar Button/Card/Badge/DataTable/Header/Sidebar/Navbar existentes, variables del club y español; respetar i18n donde esté conectado.
- Resolver carga, vacío, error, validación, éxito y acción repetida en cada flujo.
- Probar teclado, foco, etiquetas de formulario, lectura de mensajes y tamaños móviles; evitar acciones inaccesibles por desbordamiento o navegación.
- **Dependencia:** se aplica durante FE03–FE17; no exige una reescritura visual general.
- **Aceptación:** completar todos los recorridos de la sección 9 en escritorio y celular sin bloquear interacción; listados con DataTable y tema coherente.

### FE19 — Soporte, condiciones y contingencias visibles · P1

- **Origen:** R22, R23, R24; recorridos de operación y salida del servicio.
- Publicar textos/enlaces aprobados de términos, privacidad y condiciones, así como canal/horario de soporte definidos por producto.
- Presentar errores de servicio/red sin éxito ficticio; mostrar identificador de solicitud si lo entrega el servidor para facilitar soporte, sin registrar tokens/datos privados.
- Explicar en las vistas de suspensión/baja/exportación el efecto de la operación conforme a política aprobada.
- **Dependencia:** responsables comerciales/legales entregan textos y política; operaciones/backend entregan canal, estados y correlación de errores.
- **Aceptación:** usuario encuentra asistencia y condiciones desde puntos pertinentes; ante caída de API puede entender qué ocurrió y reintentar sin repetir una operación incierta como si hubiese fallado con certeza.

### FE20 — Validación integrada y entrega web · P1

- **Origen:** R02, R09, R20–R25; secciones 10 y 11 del roadmap.
- Ejecutar type-check, build y pruebas relevantes; recorridos reales de la sección 9 con API/staging y dos clubes ficticios.
- Acompañar verificación de dominio/HTTPS/CORS, recuperación tras deploy/rollback y visualización de datos/logos restaurados. Los backups y su ejecución pertenecen a operaciones.
- Medir experiencia de listados/importación/calendario con el volumen objetivo del roadmap; separar latencia de API de problemas de renderizado. Coordinar carga con backend/QA.
- Registrar versión, rol, host, datos de prueba, resultado, defectos y evidencia; preparar guía de uso de la versión entregada.
- Dar soporte al piloto: recoger fricción de onboarding/cierre/reserva, corregir defectos y verificar no regresión.
- **Dependencia:** todas las FE P0/P1, APIs corregidas y staging operativo. Tests mock no cierran integración.
- **Aceptación:** matriz web aprobada y cero defectos críticos/altos abiertos del alcance. El cierre frontend no autoriza lanzamiento si siguen abiertos criterios generales del roadmap.

## 7. Contratos y dependencias que debe entregar backend

| Dependencia | Necesidad del frontend | Bloquea |
|---|---|---|
| B01 — Sesión y soporte (R06/R08) | Entregado: JWT de 8 h, `expires_in` en segundos, revocación por estado de membresía/club/plataforma y respuestas públicas del panel | FE04, FE05, FE08 |
| B02 — Personas seguras (R05/R07) | DTO plano, IDs de membresía, campos editables y flujos de vinculación/restauración seguros | FE05, FE08–FE10 |
| B03 — Recuperación (R10) | Solicitud/confirmación de recuperación e invitación, enlace temporal y errores definidos | FE06 |
| B04 — Cuota manual (R11/R12) | Emitir sin MP; montos, reintentos, resultados parciales y estados canónicos | FE11 |
| B05 — Auditoría de pago (R13) | Medio/fecha/operador, corrección y consulta de historial | FE12 |
| B06 — Padrón (R14) | Límites coherentes, resultado CSV por fila y obtención completa para exportación | FE09–FE10 |
| B07 — Reserva (R15) | Disponibilidad, validación atómica, errores de conflicto y cancelación por rol | FE13–FE14 |
| B08 — Portal (R16) | Cuotas/reservas/contenido propios; instrucciones de pago manual; permisos por sesión | FE14–FE15 |
| B09 — Operación (R20/R22) | URLs de entorno, CORS/hosts, errores identificables y estados del servicio | FE02, FE19–FE20 |

Para cada contrato registrar método/ruta, request, respuesta, errores y permisos en `docs/API.md`; actualizar tipos en `src/lib/api.ts` o consumidores existentes según el patrón del proyecto. Las rutas faltantes no se inventan en este plan.

El equipo frontend puede preparar componentes y estados con datos ficticios aislados de desarrollo mientras espera un contrato. Una pantalla con datos simulados se marca **pendiente de integración**, nunca terminada ni habilitada como funcionalidad productiva.

## 8. Orden de ejecución y entregables

| Entrega | Tareas | Puede avanzar inicialmente | Condición para cerrar |
|---|---|---|---|
| A — Web compilable y mapa consistente | FE01–FE03 | Corrección build, inventario rutas, configuración web | CI/build y staging; mapa acordado |
| B — Acceso y contratos seguros | FE04–FE06 | Gates y estados, tipos/formularios con contrato acordado | B01–B03 funcionando y pruebas con API |
| C — Operación de comisión/plataforma | FE07–FE13 | Retiro de tarjeta, limpieza y componentes existentes | B02/B04–B07 y recorridos integrados |
| D — Portal y comunicación | FE14–FE16 | Estructura portal, branding y estados | B07/B08, perfil y datos propios reales |
| E — Oferta y calidad | FE17–FE19 | Limpieza mocks, responsive, textos aprobados | Oferta fiel, soporte/condiciones, errores coherentes |
| F — Aceptación y piloto | FE20 | Preparar matriz desde A | Integración completa, QA y gates generales |

FE18 se aplica a cada entrega; FE17 puede avanzar en paralelo con backend una vez acordada la oferta. La dependencia crítica del portal son sus endpoints, no el maquetado.

No sumar los plazos completos del roadmap como si fueran solo frontend: las 8–12 semanas incluyen backend, operación y piloto. Estimar esfuerzo frontend por tarea después de A y de acordar contratos. El piloto conserva un ciclo mensual completo según el plan general.

### Primer lote ejecutable

1. FE01: resolver el build y comprobar alta de club en producción local/staging.
2. FE03: inventario de rutas y destinos de login por rol.
3. FE07: retirar la captura de tarjeta/CVV y ajustar pasos/resumen.
4. FE17: inventario y retiro/identificación de mocks y promesas fuera de 1.0.
5. FE02: cerrar artefacto web/CI con operaciones; acordar B01–B08 para iniciar integración.

## 9. Matriz de aceptación frontend

| Recorrido | Qué se prueba en navegador | Tareas |
|---|---|---|
| Acceso y sesión | Login, refresco, logout, vencimiento, suspensión, cambio de clave/rol y recuperación | FE03–FE06 |
| Dos clubes | Cambio de club, tema, navegación y respuestas pendientes; no quedan datos previos | FE03–FE05, FE16 |
| Plataforma | Solicitud, alta, entrega de acceso, rehabilitación y baja con confirmaciones | FE01, FE05, FE08 |
| Onboarding | Avanzar/retroceder, errores, guardado parcial de espacios y llegada al panel | FE07 |
| Padrón | Alta/edición/baja/restauración, usuario compartido y límites | FE05, FE09 |
| CSV | 100 registros, duplicados, comillas, errores por fila, reintento y exportación completa | FE10 |
| Cuotas | Emitir/repetir, consultar monto, registrar/corregir pago y comprobar totales/historial | FE11–FE12 |
| Reserva | Dos navegadores, solape parcial, horario argentino, límites y cancelación por rol | FE13 |
| Portal | Socio/profe básico, cuotas/instrucciones y reservas propias desde celular | FE14 |
| Contenido | Publicar noticia, privacidad de borrador y horarios coherentes | FE15 |
| Marca/uploads | Cambio de logo/colores, archivo inválido, recarga y cambio de club | FE16 |
| Oferta | Landing real, formulario de solicitud, navegación y textos sin funciones simuladas | FE17 |
| Interacción | Teclado, foco, mensajes, vacío/carga/error, acciones repetidas y ancho móvil | FE18 |
| Servicio | API caída, operación de resultado incierto, soporte/condiciones y exportación/baja | FE19 |
| Entrega | Build productivo, URLs/hosts, smoke tras deploy/rollback/restauración y piloto | FE02, FE20 |

La prueba de dos navegadores valida la experiencia; backend/QA debe aportar además evidencia de concurrencia y aislamiento en DB. Para cada fila registrar resultado y defecto pendiente. No aprobar un flujo solo con captura de pantalla.

## 10. Frontend de MercadoPago — Versión 1.1 separada

Estas tareas quedan **P2 respecto de 1.0** y son obligatorias si se habilita 1.1. No incluyen OAuth productivo, custodia, tarjetas guardadas ni débito automático. Si el flujo requiere OAuth, se abre el milestone explícito previsto por el roadmap.

| ID | Trabajo frontend | Dependencia del roadmap | Aceptación |
|---|---|---|---|
| FMP01 | Mostrar estado de conexión/habilitación de MP del club y desconexión solo si el contrato aprobado la soporta | MP01–MP02 | Estado viene de API; ninguna credencial privada aparece en navegador; club no habilitado no recibe un CTA funcional de cobro |
| FMP02 | Botón de pagar, apertura de checkout y retorno al portal | MP03 | Monto/referencia provienen de API; retorno éxito/pendiente/error claro. URL de retorno nunca se toma como prueba de pago |
| FMP03 | Mostrar estado confirmado, reconciliación pendiente, reversión y origen manual/MP | MP04–MP06 | Estado se consulta al backend; actualización y reintento sin declarar pago por un parámetro de URL; operador ve contingencia y conserva registro manual |
| FMP04 | Validar checkout y retorno con dos clubes, fallo/token inválido y eventos duplicados/atrasados coordinados con backend | MP07 | Evidencia end-to-end en sandbox; prueba real solo cuando se autorice el bloque general |

Firma de webhook, cifrado de tokens, receptor del dinero, idempotencia y reconciliación se implementan en backend; frontend refleja su resultado. Las interfaces de 1.1 pueden planificarse, pero no se habilitan junto con la salida manual por defecto.

## 11. Trazabilidad completa con el roadmap general

| Origen | Parte frontend extraída | Parte que permanece fuera del frontend |
|---|---|---|
| R01 | FE03, FE17: rutas, rol visible, marca/oferta | Decisiones comerciales y alcance de producto |
| R02 | FE02, FE20: app en staging y dataset para recorridos | Infraestructura, migraciones y provisión de datos |
| R03 | FE01–FE02: build y CI web | Tests/build de API |
| R04 | FE02: dependencias, lock coordinado, empaquetado web | Secretos/seed y empaquetado API |
| R05 | FE05, FE08: consumidores del contrato plano | Eliminación de campos privados en respuestas API |
| R06 | FE04: expiración y estados de sesión | Revocación, validación JWT y vigencia real |
| R07 | FE05, FE09–FE10: identidad y formularios/CSV | Política de identidad y protección de datos compartidos |
| R08 | FE02, FE04: no exposición de secretos y contexto de soporte | Secretos productivos, autenticación y auditoría de soporte |
| R09 | FE04–FE05, FE20: recorridos y manejo de rechazo | Guards, aislamiento y tests con DB |
| R10 | FE06: recuperación/invitación/cambio de clave | Tokens, correo y revocación |
| R11 | FE11: emisión manual sin promesa MP/push | Desacoplar emisión y bloquear integración en servidor |
| R12 | FE11: montos, resultados parciales y reintentos | Idempotencia, precisión monetaria y concurrencia |
| R13 | FE12: registro, corrección e historial visibles | Persistencia y auditoría del pago |
| R14 | FE09–FE10: padrón, importación/exportación y límites visibles | Parsing, límites y consistencia de importación |
| R15 | FE13–FE14: disponibilidad, reserva/cancelación y conflictos | Exclusión atómica y validación de reglas |
| R16 | FE14: portal propio | Nuevos endpoints y autorización por titular |
| R17 | FE03–FE04, FE08, FE18: navegación y estados por rol | Permisos efectivos de API |
| R18 | FE07, FE11, FE15–FE16: onboarding y comunicación reales | Publicación, envío y persistencia del servidor |
| R19 | FE09, FE17–FE18: simplificación y componentes | Decisión de oferta |
| R20 | FE02, FE03, FE20: artefacto/variables/hosts y smoke | HTTPS, infraestructura, despliegue y reversión de DB |
| R21 | FE20: comprobar datos/logos después de restaurar | Backups, retención y restauración; sin pantalla nueva exigida |
| R22 | FE19–FE20: fallos, correlación y soporte visibles | Health DB, logs/alertas y atención de incidentes |
| R23 | FE19: acceso a textos y políticas aprobadas | Redacción/revisión profesional y política de datos |
| R24 | FE07–FE10, FE17, FE19–FE20: demo, alta, plantilla y ayuda | Precio, propuesta comercial, captación y capacitación |
| R25 | FE18, FE20: QA navegador y experiencia con volumen objetivo | Carga/persistencia API y aprobación conjunta |
| MP01–MP07 | FMP01–FMP04, exclusivamente en 1.1 | Conexión, credenciales, pagos, webhook y conciliación |
| Secciones 10–11 | FE20 y matriz de sección 9: aceptación y piloto | Criterios generales de lanzamiento y validación comercial |

### Evolución posterior identificada, sin tareas de implementación 1.0

Las pantallas de cuotas familiares/adicionales, profesores/liquidaciones, reportes ampliados, torneos/Social y lista de espera se retoman cuando se active el bloque correspondiente del roadmap. Cada una necesitará contrato y aceptación propios. Mobile, FCM, entrada QR y carnet offline continúan como milestone separado; no se trasladan a este plan web.

## 12. Definición de frontend listo

- [ ] FE01–FE20 cerradas con evidencia y dependencias satisfechas.
- [ ] Type-check y build productivo aprobados; artefacto web funciona en staging.
- [ ] Matriz de navegador aprobada con datos reales de prueba, dos clubes y los roles incluidos.
- [ ] Sin mocks presentados como datos reales, enlaces vacíos ni funciones anunciadas sin integración.
- [ ] Sin campos privados recibidos por los consumidores; acceso y cambio de club coherentes.
- [ ] Padrón, cuotas manuales, reservas, portal, noticias y onboarding completos en celular y escritorio.
- [ ] Textos de oferta, soporte y condiciones aprobados y accesibles.
- [ ] No quedan defectos críticos/altos del frontend incluido; guía y evidencia entregadas para piloto.

Este cierre habilita la entrega frontend al piloto **solo si también se cumplen seguridad y operación del roadmap general**. La aceptación comercial sigue requiriendo el ciclo mensual y aprobación conjunta. No se implementó código de aplicación al extraer este plan.
