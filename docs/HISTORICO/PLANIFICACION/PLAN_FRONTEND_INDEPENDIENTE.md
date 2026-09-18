# Plan frontend independiente del backend

> Documento de apoyo. No redefine el roadmap ni marca tareas como realizadas;
> consultar [`ESTADO_PROYECTO.md`](ESTADO_PROYECTO.md).

Checklist de ejecución manual: [Tareas manuales frontend](TAREAS_MANUALES_FRONTEND.md).

Trabajo que puede ejecutarse ahora usando datos tipados de desarrollo, sin crear endpoints ni cambiar contratos de API. Cuando una pantalla pase a integración, los mocks deben retirarse y conectarse al contrato aprobado.

## Lote 1 — Base y navegación

| ID | Trabajo | Criterio de terminado |
|---|---|---|
| FI01 | Resolver inconsistencias de marca ClubApp/Kanri | Nombre, favicon, títulos, descripción y logo coherentes en landing, login y panel |
| FI02 | Auditar enlaces y rutas existentes | Ningún enlace interno apunta a `#`, rutas inexistentes o prefijos mezclados; navegación directa y atrás/adelante funcionan |
| FI03 | Consolidar layouts y navegación responsive | Navbar, Sidebar, menú móvil y contenido no se pisan ni generan scroll horizontal |
| FI04 | Crear estados reutilizables | Componentes de carga, vacío, error, confirmación y reintento con el mismo lenguaje visual |
| FI05 | Normalizar estilos y componentes comunes | Botones, formularios, tablas, badges, modales y foco usan componentes/common y variables del club |

## Lote 2 — Calidad de pantallas existentes

| ID | Trabajo | Criterio de terminado |
|---|---|---|
| FI06 | Revisar todas las páginas de gestión en celular | Formularios, tablas, calendarios y acciones utilizables desde 320 px sin desbordes |
| FI07 | Estados de formulario | Validación visual, botón ocupado, prevención de doble clic y preservación del formulario ante error |
| FI08 | Accesibilidad básica | Labels asociados, foco visible, navegación por teclado, `aria-label` en iconos y mensajes con `role=alert` |
| FI09 | Unificar textos en español | Mensajes de éxito/error, títulos y acciones consistentes; sin textos de prueba o inglés residual |
| FI10 | Revisar responsive del onboarding | Pasos, botones, errores y resumen funcionan en móvil; no se solicitan datos de tarjeta |
| FI11 | Limpieza de datos mock visibles | Eventos, notificaciones, mapas y tarjetas demo se identifican como demo o se reemplazan por estados vacíos |
| FI12 | Estados de sesión en interfaz | Logout, sesión ausente, pantalla de carga inicial y redirección no dejan contenido incorrecto visible |

## Lote 3 — Pantallas independientes con datos locales tipados

Estas tareas permiten preparar experiencia y componentes sin afirmar integración real.

| ID | Trabajo | Criterio de terminado |
|---|---|---|
| FI13 | Maquetar portal socio | Inicio, perfil, cuotas, reservas y novedades con tipos locales alineados a `SocioSession`; marcar datos como desarrollo |
| FI14 | Maquetar recuperación de contraseña | Solicitud, enlace inválido, vencimiento, éxito y error; conectar al backend solo cuando exista contrato |
| FI15 | Rediseñar cobros manuales | Tabla, filtros, detalle, confirmación y estados pendiente/pagado usando fixtures; no mostrar MP ni push como activos |
| FI16 | Mejorar importación CSV | Selector, progreso, resumen por fila, errores y reintento con fixtures de 100 filas |
| FI17 | Mejorar reservas | Selector de fecha, espacios, disponibilidad, conflicto y cancelación con fixtures; sin enviar datos reales |
| FI18 | Preparar vistas de plataforma | Alta, solicitudes, suspensión y baja con estados de confirmación/error y fixtures seguros |

## Lote 4 — Verificación frontend

| ID | Trabajo | Criterio de terminado |
|---|---|---|
| FI19 | Type-check y lint | Comandos del paquete web sin errores ni warnings nuevos atribuibles a los cambios |
| FI20 | Build productivo | Build completo en CI/Linux; en Windows registrar limitaciones de symlinks si aparecen |
| FI21 | Smoke test de rutas | Landing, login, panel, onboarding, socios, cobros, reservas, plataforma y portal responden sin 404 |
| FI22 | Prueba de viewport | 320, 375, 768 y escritorio; capturar defectos de layout y corregirlos antes de integrar |
| FI23 | Revisión de contenido | Ningún botón promete una función no implementada; estados demo y limitaciones están explicados |
| FI24 | Checklist de entrega | Lista de archivos, cambios visuales, riesgos, fixtures retirados y contratos pendientes para el siguiente turno |

## Orden recomendado sin esperar backend

1. FI01–FI05: consistencia visual, rutas y componentes.
2. FI06–FI12: calidad de las pantallas actuales.
3. FI13–FI18: preparar experiencias nuevas con fixtures tipados.
4. FI19–FI24: verificación y limpieza final.

## Límites

No implementar en este plan lógica de autorización, aislamiento tenant, idempotencia, importación real, cobro real, recuperación real, concurrencia de reservas ni cambios de schema. Todo eso requiere backend y queda en [BACKEND_PENDIENTES_FRONTEND.md](BACKEND_PENDIENTES_FRONTEND.md).

El trabajo independiente puede comenzar hoy, pero una pantalla hecha con fixtures no se considera funcionalidad lanzable hasta pasar la integración y las pruebas del [PLAN_FRONTEND_LANZAMIENTO.md](PLAN_FRONTEND_LANZAMIENTO.md).
