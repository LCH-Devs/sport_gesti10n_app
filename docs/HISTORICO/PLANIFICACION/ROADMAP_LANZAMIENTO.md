# Roadmap de lanzamiento — ClubApp / Kanri

Fecha de análisis: **9 de septiembre de 2026**. Base revisada: commit `0b851d5` y archivos locales. Estado: propuesta de ejecución basada en código; **no certificación de producción**.

**Plan por equipo:** [Frontend de lanzamiento](PLAN_FRONTEND_LANZAMIENTO.md) — extracción de tareas web, dependencias backend y criterios de aceptación; mantiene trazabilidad con R01–R25 y MP01–MP07.

**Coordinación backend:** [Pendientes de backend para frontend](BACKEND_PENDIENTES_FRONTEND.md) — contratos bloqueantes para cerrar la web 1.0.

## 1. Decisión de producto

**El proyecto tiene una base funcional amplia, pero todavía no está listo para venderse como servicio de producción. La prioridad es cerrar recorridos completos, seguridad y operación; no sumar módulos.**

La primera versión comercial será una **web adaptable a celular para administrar socios, registrar cuotas, gestionar reservas y publicar novedades**, con portal básico del socio y alta asistida de clubes. El dinero se recibe por los medios habituales del club; la comisión registra los pagos. La suscripción al software se acuerda y administra comercialmente, sin autoservicio de billing.

MercadoPago integrado será una **versión 1.1 con habilitación independiente**. No puede activarse con el servicio actual: usa una credencial global y enlaces simulados. Si la venta exige pago online integrado desde el primer día, la versión comercial deberá esperar también los criterios de la sección 8. No se presenta un registro manual como integración automática.

Este documento es el plan propuesto para el lanzamiento. `PLAN.md` y `TECNICO_EQUIPO.md` conservan valor histórico, pero sus listas de funciones no son compromisos de esta versión. El código actual y `AGENTS.md` siguen gobernando la implementación. No se modifica arquitectura ni contratos mediante este documento.

### Cliente inicial y promesa

- Clubes de barrio argentinos con una comisión pequeña, padrón manejado en planillas y hasta 100 miembros para el primer paquete, sujeto a validar el límite real del servicio.
- Comprador: comisión directiva; operador diario: secretaría o tesorería; beneficiario: socio.
- Promesa: **“Tu padrón, cuotas y reservas en un solo lugar, con acceso desde el celular.”**
- Primeros clientes: 3 clubes piloto con un responsable operativo y disponibilidad para un ciclo mensual completo.
- Identidad comercial pendiente de unificar: el repositorio habla de ClubApp y la web muestra Kanri. Elegir nombre, dominio y remitente antes de producir materiales finales.

### Qué incluye la versión 1.0

| Área | Compromiso de lanzamiento |
|---|---|
| Plataforma | Alta asistida, suspensión, rehabilitación y baja lógica; acceso de soporte controlado |
| Acceso | Login, recuperación, cambio de contraseña, cambio de club y permisos coherentes |
| Socios | Alta, edición, baja lógica, importación CSV con errores por fila y exportación |
| Cuotas | Emisión mensual sin duplicados, pendientes/pagadas, registro manual con responsable y medio, corrección trazable |
| Reservas | Espacios, disponibilidad, alta y cancelación por comisión y socio, reglas del club, protección contra solapes simultáneos |
| Comunicación | Noticias y horarios visibles en el portal; sin promesa de push ni envíos automáticos |
| Portal socio | Sus propios datos, cuotas e instrucciones de pago manual, reservas propias y novedades |
| Marca del club | Nombre, logo y colores; recorrido de acceso por host/ruta documentado y probado |
| Servicio | Onboarding guiado, respaldo y restauración probados, soporte, exportación de datos y procedimiento de baja |

Familias y actividades pueden conservarse como organización del padrón. En 1.0 la cuota es simple: **no ofrecer descuentos familiares ni adicionales calculados automáticamente**. Las opciones que hoy sugieren esos cálculos deben ocultarse o aclararse de forma inequívoca. Si un club necesita esos cálculos para operar, se pospone su incorporación hasta implementarlos y verificarlos.

## 2. Diagnóstico basado en el repositorio

“Existe” significa que hay implementación; no significa que el recorrido haya sido aceptado en producción. Los hallazgos siguientes provienen de lectura estática salvo donde se indique una comprobación ejecutada.

| Área | Evidencia | Evaluación |
|---|---|---|
| Identidad | `apps/api/prisma/schema.prisma`: `Usuario`, `Membresia`, `PlatformAdmin` | Modelo actual reutilizable. No volver a tablas Admin/Socio |
| Aislamiento | `common/tenant.guard.ts`, `tenant-isolation.spec.ts` | Hay guard y tests HTTP; el servicio se simula en parte de esas pruebas. Falta demostrar aislamiento con PostgreSQL real y recursos relacionados |
| Sesiones | `auth/auth-security.ts`, `jwt.strategy.ts` | JWT actual de **30 días**, frente a 8 horas documentadas. La estrategia devuelve claims sin consultar vigencia de usuario/membresía |
| Secretos | `auth/auth.module.ts`, `jwt.strategy.ts`, `docker-compose.yml` | Hay fallback `dev-secret` y configuración de ejemplo. Producción debe rechazar secretos ausentes o de desarrollo |
| Respuestas de plataforma | `platform/platform.service.ts:getClubResource` | Varias lecturas devuelven `usuario: true`, incluido `password_hash`, en un grafo sin aplanar. Endpoint protegido por plataforma; no es un acceso público, pero expone campos innecesarios |
| Datos compartidos | `socios/socios.service.ts:create/update`, `admins/admins.service.ts:update` | Operaciones de un club modifican datos o contraseña de la identidad global. Revisar propiedad de estos cambios y efectos sobre otras membresías |
| MercadoPago | `pagos/mercadopago.service.ts` | Lee únicamente `MP_ACCESS_TOKEN`; sin token retorna URL mock sin impedirlo por entorno. `Club` no tiene credenciales MP en el schema actual |
| Cuotas | `pagos/pagos.service.ts:generarYEnviar` | Unique socio/mes existe. Sin embargo, vuelve a generar preferences pendientes; puede generar link para un pago manual ya pagado sin link. Envía el monto anterior a MP y después persiste el nuevo monto |
| Webhook | `pagos.controller.ts`, `pagos.service.ts:handleWebhook` | No lee firma; actualiza por referencia interna sin verificar club/receptor/importe/moneda. Hay reversión simple para cancelado/rechazado/reembolsado/contracargo, aunque el documento de seguridad dice que no existe |
| Idempotencia webhook | `pagos.service.ts:handleWebhook` | `approved` vuelve a escribir fecha de pago. No se encontró deduplicación persistente, reconciliación ni control de eventos fuera de orden en el módulo |
| Reservas | `reservas/reservas.service.ts`, modelo `Reserva` | Consulta solapes y luego inserta, sin exclusión atómica visible. No basta frente a dos solicitudes simultáneas. Revisar horarios, pasado, duración y reglas de cancelación |
| Portal socio | `socios/socio-portal.controller.ts`, `web/src/lib/apply-login.ts` | Backend de perfil propio; login apunta por defecto a `/socio`, pero no se encontró esa página ni un portal completo en `apps/web/src/app` |
| Rutas web | `web/src/middleware.ts`, `lib/tenant-routing.ts` | Middleware activo usa reescrituras hacia `/gestion`, y plataforma bajo `/supercalifragilisticoespiralidoso`. No llama a `runTenantMiddleware` |
| Apps reales | Directorio `apps` | Existen `api`, `web`, `mobile`; **no existe `web-v2`** en esta copia. No planificar duplicar cambios en una app ausente |
| Gates del frontend | `app/layout.tsx`, `app/gestion/layout.tsx` | El layout global redirige onboarding/cambio de clave si encuentra sesión; el layout de gestión solo envuelve contenido. Validar acceso sin sesión y por rol en todo el recorrido |
| Recuperación | `app/login/page.tsx`, `auth/auth.controller.ts` | Enlace “olvidé contraseña” a `#`; no se encontró flujo de recuperación en el controlador de auth |
| Onboarding | `app/gestion/onboarding/page.tsx` | Pide número de tarjeta/CVV para suscripción, pero `finish` no los envía ni completa billing. Retirar ese paso del lanzamiento |
| Notificaciones | `pagos.service.ts`, preferencias locales web | `push_enviados: 0`; algunas preferencias viven solo en localStorage. No venderlas como comunicación entregada |
| Demostración | `app/events/page.tsx`, eventos de plataforma, `landing/components/MapContent.tsx` | Hay eventos y clubes mock. Sustituir, identificar como demo o retirar de producción |
| Familias/actividades | Schema y `generarYEnviar` | Descuento familiar persistido sin aplicar; el motor de cuota simple tampoco suma adicionales de actividades |
| Límites | `socios.service.ts:create` | Tope 100 fijo y conteo de miembros no eliminados, sin distinguir plan/estado activo. Alinear contrato comercial, importación y carreras concurrentes |
| Logos | `clubs.service.ts`, `media/media.service.ts` | Ya existe límite de tamaño y whitelist MIME. No partir del diagnóstico viejo “sin validación”. Completar pruebas de contenido real y persistencia |
| Despliegue | Dockerfiles, `next.config.js`, locks | API ejecuta seed al arrancar; web espera `.next/standalone` sin configurar `output: 'standalone'`. Coexisten locks npm y pnpm |
| Operación | `health.controller.ts`, logger, árbol del repo | Health responde estático y hay logs básicos. No se encontraron workflows de CI ni procedimientos verificados de backup/restauración en lo revisado |
| Dependencias | `pnpm-lock.yaml` y compilación web | Next.js **15.5.23**, React **19.2.3**. Revisar avisos actuales y actualizar parches antes de publicar |
| Build de producción | `pnpm --filter web build`, ejecutado en esta revisión | El fallo de prerender de `/supercalifragilisticoespiralidoso/panel/entidades/new` fue corregido. El build ahora llega al empaquetado standalone, donde Windows bloquea la creación de symlinks con `EPERM`; verificar en Linux/CI |

La información sensible en respuestas de plataforma y las modificaciones de identidad compartida merecen prioridad aunque todavía no se active MercadoPago. Una ruta de plataforma poco visible no reemplaza controles de autorización.

### Comprobaciones de esta revisión

- TypeScript de web: `pnpm --filter web type-check` — **aprobado**.
- TypeScript de API: `pnpm --filter @clubapp/api exec tsc --noEmit --incremental false` — **aprobado**.
- Suite API y build web: resultados finales en la sección 12.
- No se modificó código de aplicación ni se ejecutaron migraciones, seed o cobros.
- No se verificaron flujos reales en navegador, infraestructura productiva, restauración ni pagos reales. Esas verificaciones son entregables del roadmap, no resultados de esta revisión.

## 3. Reglas para ejecutar el plan

1. **P0:** bloquea cualquier piloto con datos reales. **P1:** bloquea la versión comercial. **P2:** posterior; no debe retrasar 1.0.
2. Mantener NestJS, Prisma, PostgreSQL, Next y componentes existentes. No reescritura, microservicios ni aplicación paralela.
3. Cambios de API incluyen contrato en `docs/API.md`, DTOs, tipos y consumidores. Mantener IDs de membresía y personas aplanadas.
4. Corregir la app `web` real; si reaparece `web-v2`, reevaluar equivalencias antes de editarla.
5. No cambiar roles por accidente: `entrada` hoy integra staff de lectura; no venderlo como permiso exclusivo de portería. Profe usa el portal básico; funciones especiales quedan fuera.
6. Cada entrega termina con evidencia: prueba, recorrido y resultado. “Pantalla hecha” no cierra una tarea de negocio.
7. Cada ítem tiene un único responsable. Los roles de las tablas son asignaciones propuestas; el equipo debe poner nombres al iniciar.

## 4. Fase 0 — Congelar alcance y establecer una base reproducible

Duración orientativa: **3–5 días hábiles**. Responsable: líder técnico + producto.

| ID | Prioridad | Trabajo | Criterio de aceptación |
|---|---|---|---|
| R01 | P0 | Unificar mapa de rutas, roles, marca, versión y alcance 1.0 | Inventario cotejado con código; landing y demos sin promesas de módulos futuros |
| R02 | P0 | Preparar staging separado y dataset ficticio de dos clubes | Instalación desde checkout limpio, variables validadas, migraciones repetibles; sin datos reales ni secretos de producción |
| R03 | P0 | Corregir build web y establecer CI para API/web | Prerender corregido; falta validar empaquetado standalone en CI/Linux. Instalación reproducible con pnpm, checks de tipos, tests y builds completos; un fallo impide liberar |
| R04 | P0 | Revisar dependencias y empaquetado | Lock acordado, parches de seguridad aplicables resueltos, API sin seed automático productivo y artefacto web compatible con despliegue |

**Salida:** cualquier integrante puede levantar la misma versión y ejecutar la misma verificación. Dependencias de seguridad y configuración no se difieren al piloto.

## 5. Fase 1 — Seguridad y consistencia de datos

Duración orientativa: **1–2 semanas**, posterior a Fase 0. Responsable: backend; QA valida de manera independiente.

| ID | Prioridad | Trabajo | Criterio de aceptación |
|---|---|---|---|
| R05 | P0 | Retirar campos privados de todas las respuestas, incluidas plataforma | Tests recursivos de respuestas: ningún hash, secreto o grafo privado; consumidores actualizados al contrato plano |
| R06 | P0 | Vigencia real de sesión y suspensión | Token emitido antes de baja, suspensión o cambio de rol deja de autorizar operaciones indebidas; plataforma desactivada también pierde acceso |
| R07 | P0 | Resolver seguridad de identidad compartida | Admin de A no cambia credenciales ni identidad global de alguien de B mediante alta, restauración, edición o CSV. Vinculación conserva identidad y requiere la validación de titularidad acordada |
| R08 | P0 | Secretos y acceso de soporte | Producción no inicia con secretos de desarrollo; contraseña maestra deshabilitada o soporte autenticado, acotado y auditado; sin credenciales seed accesibles |
| R09 | P0 | Ampliar pruebas multi-tenant con DB real | A no lee/escribe recursos de B ni usa sus IDs relacionados. Se cubren familias, reservas, pagos, actividades y usuario compartido; excepciones Social/plataforma explícitas |
| R10 | P1 | Recuperación e invitaciones seguras | Token temporal de un solo uso; respuestas sin enumerar usuarios; cambio de clave invalida sesiones según política; ningún usuario real depende de password común |

Resolver explícitamente el TTL de sesión: el código hoy usa 30 días. Propuesta para primera salida: restaurar 8 horas para JWT de acceso y manejo claro de expiración; cualquier “recordarme” persistente requiere diseño de revocación. Registrar decisión y actualizar documentación y UI juntas. El TTL corto por sí solo no resuelve la suspensión inmediata.

La política de cambios sobre `Usuario` debe definirse antes de tocar el schema. Reusar `Usuario/Membresia`; no duplicar identidades para evitar el problema. Revisar además que un cambio de DNI compartido no rompa unicidad de otro club y que las validaciones resistan concurrencia.

**Salida:** ningún P0 de privacidad/acceso abierto y pruebas negativas reproducibles. No ingresar datos reales antes de este punto y de la preparación operativa de Fase 3.

## 6. Fase 2 — Completar el producto que se va a vender

Duración orientativa: **2–3 semanas**, después de definir R01/R07; partes de frontend pueden prepararse mientras termina Fase 1. Responsables: frontend + backend + producto.

| ID | Prioridad | Trabajo | Criterio de aceptación |
|---|---|---|---|
| R11 | P1 | Separar emisión de cuotas de creación de links MP | En modo manual se emite deuda sin llamar MP y sin enlaces ficticios; backend rechaza integración deshabilitada aunque se invoque directo |
| R12 | P1 | Idempotencia y montos de cuotas | Repetición y concurrencia producen una cuota por socio/mes, sin alterar pagos cerrados; importe consistente; errores parciales recuperables; precisión monetaria y redondeo definidos |
| R13 | P1 | Registro manual y corrección trazables | Medio, fecha, operador y motivo de corrección registrados; historial conserva valor anterior; reporte coincide con los movimientos |
| R14 | P1 | Padrón utilizable e importación/exportación | CSV de 100 registros con duplicados, comillas y filas inválidas: resultado por fila, reintento sin duplicación, tope coherente y exportación íntegra por club |
| R15 | P1 | Reservas atómicas y reglas completas | Dos peticiones por el mismo intervalo: exactamente una confirma. Validar pasado, duración, apertura/cierre, límite de activas y cancelación por rol, en horario argentino |
| R16 | P1 | Portal web socio mínimo | Login llega a página real; perfil/cuotas/reservas son propias; reservar/cancelar no acepta otra membresía como titular. Agregar los endpoints faltantes con contrato y tests |
| R17 | P1 | Navegación y estados por rol | Rutas directas, refresco, expiración y cambio de club funcionan; no loops/404; estados vacíos/error/carga; flujos completos en escritorio y celular |
| R18 | P1 | Onboarding y comunicación honestos | Sin campos de tarjeta simulados; alta/configuración/importación/primera cuota completas; noticias y horarios visibles; ningún botón informa envíos inexistentes |
| R19 | P1 | Simplificar funciones expuestas | Ocultar demos, opciones inoperantes y módulos fuera de alcance; componentes comunes y tema del club; listados con DataTable |

Para R12, definir importes con centavos exactos mediante representación adecuada y migración probada si corresponde; no imponer un cambio de schema sin revisar datos y consumidores. Cobros ya emitidos no cambian silenciosamente al editar la cuota del club.

Para R15, elegir una protección compatible con PostgreSQL que haga indivisible la comprobación y escritura, incluyendo el máximo de reservas del socio. Una prueba unitaria con mocks no demuestra ausencia de doble reserva.

Para R16, ampliar el portal existente: no reutilizar listados de staff para luego filtrar en navegador. Deshabilitar login de miembro en un piloto administrativo si todavía no está terminado; ese piloto no cuenta como aceptación de 1.0 completa.

**Salida:** demostración desde alta del club hasta cierre de cuota, reserva y lectura por socio, con datos reales de prueba y sin intervención en la base de datos.

## 7. Fase 3 — Operación y preparación comercial

Duración orientativa: **1–2 semanas**, parcialmente concurrente con Fase 2. Responsables: operaciones, producto/comercial y QA.

| ID | Prioridad | Trabajo | Criterio de aceptación |
|---|---|---|---|
| R20 | P1 | Publicación reproducible y reversión | HTTPS, dominio, CORS y host probados; variables públicas correctas al build; despliegue desde CI; reversión del código y estrategia compatible de DB ensayadas |
| R21 | P1 | Respaldos y restauración | Copia automática de DB y uploads fuera del servidor; restauración en entorno aislado con conteos y archivos verificados; responsable y calendario definidos |
| R22 | P1 | Monitoreo y soporte | Health comprueba disponibilidad de DB; alertas de caída/errores, logs sin secretos y con identificador de solicitud; responsable de incidentes y guía operativa |
| R23 | P1 | Contrato y operación de clientes | Revisión profesional de términos, privacidad, tratamiento de datos de menores si aplica, retención/baja y condiciones comerciales; canales y horarios de soporte visibles |
| R24 | P1 | Paquete comercial y onboarding | Demo consistente, precio acordado, límites explícitos, propuesta escrita, responsable del club, plantilla CSV y capacitación; distinguir cuota del socio de abono al software |
| R25 | P1 | QA de aceptación y carga | Matriz de recorridos de sección 10 aprobada; prueba con volumen objetivo; defectos críticos y altos del alcance cerrados |

Objetivos iniciales propuestos, **todavía no medidos**:

- Backup con pérdida máxima objetivo de 24 horas (RPO) y recuperación en 4 horas (RTO). Validarlo con los pilotos; no prometer menor pérdida sin el mecanismo necesario.
- Disponibilidad objetivo mensual 99,5%, con medición externa; no ofrecer SLA contractual superior a lo demostrado.
- Lecturas principales p95 menor a 1 segundo y mutaciones locales p95 menor a 2 segundos, excluyendo cargas de archivos/proveedores; validar inicialmente 10 clubes × 100 miembros y 20 usuarios concurrentes en staging.
- Una importación de 100 registros produce un resumen verificable y errores recuperables; medir duración y fijar presupuesto luego de establecer la línea base.

Uploads locales son aceptables si tienen volumen persistente, backup y límites. No hace falta introducir S3/R2, Kubernetes u otra plataforma para cumplir estos objetivos.

Precio: no fijar un número como supuesto “de mercado” sin entrevistar clubes. Cotizar un único paquete inicial con abono, alta/capacitación y límites claros. Medir por club: ingreso neto menos infraestructura atribuible, soporte y otros costos variables. Registrar horas de onboarding y margen antes de ampliar ventas. El tratamiento de moneda, actualización, impuestos y facturación lo define comercial con su asesoría.

**Salida:** el equipo puede abrir, atender, respaldar y dar de baja un club sin depender de editar registros a mano.

## 8. Versión 1.1 — MercadoPago por club, sin custodia

Bloque independiente: **no está autorizado para producción por el mero lanzamiento de 1.0**. Estimación inicial: 2–4 semanas adicionales de ingeniería y una validación operativa posterior; recalcular al definir conexión y credenciales. OAuth productivo queda fuera del milestone actual según `AGENTS.md`: si es necesario, requiere un alcance posterior explícito.

| ID | Trabajo | Criterio obligatorio antes de habilitar |
|---|---|---|
| MP01 | Definir conexión soportada por cuenta del club | Revisión del flujo con documentación vigente; credencial correcta por tenant. Si exige OAuth, abrir ese milestone y mantener MP apagado hasta terminarlo |
| MP02 | Protección de credenciales y entornos | Secretos fuera de respuestas/logs, cifrado o almacenamiento seguro aprobado, rotación; sin token global ni mock en producción; desconexión segura |
| MP03 | Checkout consistente | Preferencia y cuota coinciden en monto/moneda/referencia; retorno y notificación públicos configurados; reintentos sin links de cobro indebidos |
| MP04 | Notificaciones verificadas | Firma validada y consulta al proveedor con cuenta correcta; comprobar receptor, referencia, importe, moneda y tenant antes de cambiar estado |
| MP05 | Estado e idempotencia | Repeticiones no cambian fecha ni duplican efectos; eventos atrasados no deshacen un estado válido; conservar pago externo, auditoría y origen manual/MP |
| MP06 | Reconciliación y contingencias | Notificación perdida se recupera; fallos/reembolsos parciales y totales/contracargos tienen tratamiento verificable; aviso al operador y procedimiento manual |
| MP07 | Ensayo de aceptación | Sandbox con dos clubes/cuentas, notificación inválida/duplicada/fuera de orden, timeout y token inválido; después prueba real autorizada de importe acotado, con evidencia del destino del dinero |

El webhook permanece público, sin JWT; una notificación no verificada nunca modifica datos. Definir explícitamente acuse HTTP y reintentos conforme al proveedor: actualmente el `@Post` no fija código 200. Registrar aceptación de duplicados sin repetir efectos y no ocultar fallos de procesamiento.

La documentación de MercadoPago describe la validación de origen con `x-signature`; el código revisado no la implementa. Referencia técnica: [Configurar notificaciones de pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications).

No habilitar débito automático, tarjetas guardadas, pagos QR presenciales ni reparto de fondos a profesores como parte de este bloque. Mantener disponible registro manual con trazabilidad.

## 9. Calendario y dependencias

Estimación de planificación, no fecha comprometida: **8–12 semanas hasta salida comercial 1.0**, suponiendo dos desarrolladores con dedicación principal, QA parcial y una persona de producto/comercial. Incluye aproximadamente 35–55 jornadas de ingeniería, margen de correcciones y 4 semanas de piloto; revisar al cerrar Fase 0. Con una sola persona de desarrollo, reservar aproximadamente 12–18 semanas según disponibilidad y defectos encontrados.

| Ventana desde inicio | Resultado |
|---|---|
| Semana 1 | Alcance y staging reproducibles; inventario de fallos y parches |
| Semanas 2–3 | Privacidad, sesiones, permisos y datos compartidos corregidos |
| Semanas 3–5 | Cuotas manuales, reservas, portal y onboarding completos |
| Semanas 4–6 | Despliegue, backups, soporte, QA y propuesta comercial |
| Semanas 6–10 | Piloto de un ciclo mensual; correcciones sin ampliar alcance |
| Semanas 10–12 | Decisión comercial, margen para bloqueos y apertura gradual |

La banda 8–12 semanas admite mayor solapamiento si los trabajos cierran antes; usar **10 semanas como escenario central**, nunca recortar la validación del ciclo mensual para cumplir una fecha. Si los pilotos no están disponibles, se desplaza la fecha comercial aunque termine ingeniería.

Ruta crítica: **R01–R04 → R05–R09 → R11–R18 → R20–R25 → piloto → lanzamiento**. Comercial puede captar pilotos desde semana 1 y operaciones preparar backups en paralelo; los datos reales esperan el cierre de seguridad y operación.

MercadoPago puede investigarse después de congelar 1.0, pero no consume la capacidad necesaria para cerrar su ruta crítica. Si se lo convierte en requisito comercial inicial, agregar su bloque y validación a la fecha final.

### Primera semana concreta

1. Nombrar responsables y congelar la lista incluida/excluida; acordar cuota simple y modo manual.
2. Convertir R01–R10 en tareas con archivos afectados y pruebas de aceptación.
3. Corregir exposición de hashes y configuración insegura; definir política de identidad global y revocación.
4. Preparar staging/CI y registrar línea base de pruebas y builds.
5. Conseguir compromiso de 3 pilotos, sus planillas ficticias/anonimizadas y una fecha tentativa de capacitación.

## 10. Pruebas que deciden la salida

| Recorrido | Evidencia exigida |
|---|---|
| Alta de club | Solicitud → alta → acceso temporal → clave propia → configuración → padrón → primera cuota |
| Identidad compartida | Usuario en A y B; alta/edición/baja en A no da acceso indebido ni cambia credenciales desde A para B |
| Permisos | Admin, entrada, socio, profe y plataforma; acceso directo a rutas y API; sesión ausente/expirada/suspendida |
| Tenant | Host/header/Origin contradictorios rechazados; ID de otro club no se lee ni muta; relaciones también aisladas |
| Padrón | Importar/reimportar CSV, corregir filas, alcanzar límite, dar baja/restaurar y exportar sin mezclar clubes |
| Cuota | Generar dos veces y simultáneamente; variar monto; registrar pago manual y corregirlo; cierre del mes coincide con movimientos |
| Reserva | Dos personas para un turno, intervalos parcialmente solapados, límites, medianoche argentina, cancelación y usuario suspendido |
| Portal | Socio solo ve sus cuotas y reservas; opera desde celular, refresca y vuelve a entrar sin terminar en 404 |
| Comunicación | Noticia publicada visible para miembros del club; borrador y contenido privado no filtrados; sin simulación de envío |
| Recuperación | Solicitud válida/inválida, token vencido/reutilizado y notificación de cambio; fallos de correo recuperables |
| Operación | Caída de DB, alerta, restauración de DB/uploads, deploy fallido y reversión documentada |
| Salida del servicio | Exportación del club, suspensión, baja lógica y política de conservación aplicada sin eliminar otra membresía |

Toda modificación web requiere flujo real en navegador; probar ancho de celular, teclado, mensajes de error y acciones repetidas, no solo capturas. No se necesita reescribir toda la interfaz ni traducir módulos adicionales.

## 11. Piloto, lanzamiento y evolución

### Piloto de 4 semanas o un ciclo mensual completo

- 3 clubes, inicialmente dentro del volumen objetivo, con aceptación escrita del alcance manual y soporte acordado.
- Registrar línea base: tiempo para alta de socio, preparación del cierre, reservas y conciliación de pagos.
- Capacitación breve y acompañamiento del primer cobro/cierre; revisión semanal de errores y uso.
- Registrar incidentes con severidad, impacto, responsable, solución y prueba de no regresión.

Condiciones propuestas de éxito:

- Los 3 clubes completan onboarding y primer cierre con importes conciliados por su responsable.
- Cero filtraciones entre clubes, pérdida de datos, cuotas duplicadas o reservas confirmadas superpuestas.
- Al menos 2 clubes operan el cierre y una reserva sin intervención del desarrollador y aceptan continuar con precio explícito.
- Todos los incidentes críticos/altos del alcance cerrados; 14 días finales sin incidentes de esas severidades.
- Backup restaurado y soporte ensayado; métricas de carga y errores dentro del objetivo acordado.

Con una muestra tan pequeña, esos resultados validan capacidad operativa inicial, no tamaño de mercado ni retención a largo plazo.

### Decisión de lanzamiento

Producto, tecnología y operaciones firman una misma lista: alcance cumplido, pruebas, privacidad/acceso, respaldo, soporte, materiales comerciales y aceptación piloto. **Si falta cualquiera de esos puntos, se mantiene piloto cerrado.**

Abrir después por cohortes pequeñas (por ejemplo, 5 clubes), revisando capacidad de soporte y métricas antes de la siguiente. No iniciar campañas amplias antes de demostrar onboarding y cierre mensual repetibles.

### Después de 1.0

| Orden | Evolución | Disparador |
|---|---|---|
| 1 | MercadoPago 1.1 | Demanda de pago integrado y todos los criterios MP cerrados |
| 2 | Cuotas familiares y adicionales | Reglas reales documentadas de clubes que no pueden operar con cuota simple |
| 3 | Profesores/liquidaciones y reportes mejorados | Uso recurrente que justifique validar y exponer estos módulos existentes |
| 4 | Torneos y Social | Necesidad comercial comprobada y responsables de contenido/moderación |
| 5 | Mobile, FCM, entrada QR, carnet offline, lista de espera | Nuevo milestone explícito con recursos y validación de demanda |

Permanecen fuera: cantina, billing autoservicio, roles granulares, split de pagos y ampliación de infraestructura sin necesidad medida. Un módulo ya presente puede ocultarse de la oferta inicial; no debe eliminarse por este análisis.

## 12. Registro de verificación y referencias

### Resultado de comandos

| Comprobación | Resultado |
|---|---|
| TypeScript web | Aprobado, código de salida 0 |
| TypeScript API | Aprobado, código de salida 0 |
| Suite API: `pnpm --filter @clubapp/api test -- --runInBand` | **Aprobada: 13 suites, 70 tests**, código de salida 0 |
| Build web: `pnpm --filter web build` | **Falló en Windows**, código de salida 1. El prerender completó (47/47); el empaquetado `standalone` no pudo crear symlinks por `EPERM`. Validar en CI/Linux |
| Build API / contenedores | No ejecutado; TypeScript API aprobado no sustituye estas verificaciones |
| E2E con PostgreSQL / navegador | No ejecutado |
| Deploy, migraciones, backup y cobro real | No ejecutado |

La prueba `apps/api/test/app.e2e-spec.ts` aún espera `Hello World!` en `/`; no demuestra los flujos actuales. Hay tests de guards, auth, socios, mail, solicitudes y Social, pero no se encontraron suites específicas de pagos y reservas en el inventario. Los resultados unitarios no reemplazan pruebas de persistencia/concurrencia.

### Fuentes internas principales

- [Reglas del repositorio](../AGENTS.md), [contrato API](API.md), [guía frontend](FRONT.md).
- [Schema actual](../apps/api/prisma/schema.prisma).
- [Auth](../apps/api/src/auth/auth.service.ts), [TTL actual](../apps/api/src/auth/auth-security.ts), [guard tenant](../apps/api/src/common/tenant.guard.ts).
- [Pagos](../apps/api/src/pagos/pagos.service.ts), [MercadoPago](../apps/api/src/pagos/mercadopago.service.ts), [reservas](../apps/api/src/reservas/reservas.service.ts).
- [Recursos de plataforma](../apps/api/src/platform/platform.service.ts), [socios](../apps/api/src/socios/socios.service.ts).
- [Middleware web](../apps/web/src/middleware.ts), [login y redirección](../apps/web/src/lib/apply-login.ts), [onboarding](../apps/web/src/app/gestion/onboarding/page.tsx).
- [Plan histórico](PLAN.md), [documento técnico histórico](TECNICO_EQUIPO.md), [riesgos de pagos previos](SECURITY_ISSUES.md).

### Referencias externas consultadas el 09/09/2026

- [MercadoPago: notificaciones de pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications): base para validación de firma y recepción de notificaciones.
- [Next.js: actualización de seguridad del 25/08/2026](https://nextjs.org/blog/august-2026-security-release): publica parches 15.5.24 y 16.3.3. El lock del proyecto usa 15.5.23; revisar aplicabilidad y avisos posteriores antes de actualizar. No se afirma explotación ni que todos los avisos afecten a esta configuración: la optimización de imágenes está deshabilitada y las condiciones de cada aviso importan.

Los plazos, tamaño de cohorte y métricas de este documento son objetivos propuestos; no son benchmarks del mercado ni resultados observados. Revisar el plan al finalizar cada fase, conservando los criterios de salida y registrando cualquier cambio de alcance.
