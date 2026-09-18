# Estado unificado del proyecto

Última revisión documental: 17/09/2026.

Este archivo es el punto de entrada para saber qué está realizado, en progreso,
pendiente, bloqueado o fuera de alcance. El código actual y `AGENTS.md` siguen
siendo la autoridad final cuando un documento contradice la implementación.

## Auditoría contra el repositorio

Verificación ejecutada el 17/09/2026:

- `pnpm type-check`: API y `packages/shared` pasan.
- `pnpm type-check`: web bloqueada porque `apps/web/tsconfig.json` incluye
  tipos generados en `.next/types` que no existen en este checkout. Hay que
  generar primero los artefactos de Next o ajustar el flujo de validación.
- El API tiene pruebas unitarias para socios, aislamiento lógico, importación y
  exportación CSV, solicitudes, Social y ocupación de espacios.
- El e2e visible en `apps/api/test` solo cubre el endpoint raíz; no alcanza para
  declarar cerrado el aislamiento real de tenant, concurrencia de reservas o
  los recorridos completos de autenticación.
- La revisión de archivos confirmó que la aplicación web vive bajo
  `apps/web/src`; no existe `apps/web/app` en este checkout.

## Resumen

| Área | Estado | Fuente principal |
|---|---|---|
| Monorepo y setup local | Realizado | `README.md`, `SETUP_RAPIDO.md` |
| Identidad y multi-tenant | Realizado en gran parte | `TECNICO_EQUIPO.md`, código API |
| API de clubes y plataforma | Realizado funcionalmente | `API.md`, `API_POST.md` |
| Auth, JWT y recuperación | Realizado en backend; frontend requiere validación | `SEGURIDAD_SESION.md`, `FRONT_SESION.md` |
| Panel administrativo web | En progreso; type-check bloqueado por `.next/types` | `PLAN_FRONTEND_LANZAMIENTO.md`, `AUDITORIA_FRONTEND.md` |
| Portal web de socio/profe | Parcial | `MANUAL_USUARIO.md`, `PLAN_FRONTEND_LANZAMIENTO.md` |
| Solicitudes y Social | API realizada; UI parcial | `FRONT_SOLICITUDES.md`, `FRONT_SOCIAL.md` |
| Mobile | Código de fases 0–3 realizado; QA pendiente | `PLAN_ACTUALIZACION_MOBILE.md` |
| MercadoPago productivo por club | Pendiente | `SECURITY_ISSUES.md`, `ROADMAP_LANZAMIENTO.md` |
| Seguridad específica de pagos | Pendiente | `SECURITY_ISSUES.md` |
| Tests reales de aislamiento y concurrencia | Pendiente/incompleto; e2e actual insuficiente | `ROADMAP_LANZAMIENTO.md` |
| CI, despliegue y monitoreo | Parcial | `ROADMAP_LANZAMIENTO.md` |
| QA visual, responsive y accesibilidad | Pendiente | `TAREAS_MANUALES_FRONTEND.md` |
| Nombre, dominio y branding comercial definitivo | Pendiente de decisión | `ROADMAP_LANZAMIENTO.md` |

## Realizado

- Base del monorepo, API NestJS, web Next.js y base Prisma.
- Modelo actual de identidad con `Usuario`, `Membresia` y `PlatformAdmin`.
- Reglas principales de tenant y roles documentadas.
- CRUD principal de socios, staff, cuotas, reservas, espacios, noticias y configuración.
- Sesiones JWT con TTL de 8 horas y revalidación de membresía.
- Recuperación de contraseña en backend y conexión frontend declarada.
- Contratos API principales documentados.
- Fases 0–3 de mobile implementadas en código, sujetas a revisión manual.

## En progreso

- Cierre del panel web administrativo y navegación por rol.
- Validación en navegador de sesión, cambio de club, onboarding y recorridos de alta.
- Portal de socio/profe y sus estados de error.
- Integración de contratos backend con pantallas frontend.
- QA de responsive, accesibilidad, traducciones y contenido visible.

## Pendiente

- Resolver los hallazgos críticos y altos de `SECURITY_ISSUES.md`.
- Completar pruebas reales con PostgreSQL para aislamiento tenant y concurrencia.
- Terminar emisión idempotente de cuotas y contratos de resultados parciales.
- Completar pruebas manuales del checklist de lanzamiento.
- Definir operación de despliegue, backups, monitoreo y recuperación.
- Decidir nombre comercial definitivo: ClubApp/Kanri.
- MercadoPago OAuth por club, webhook firmado, reconciliación y estados completos.
- Corregir el flujo de type-check del web para que genere o no dependa de
  `.next/types` ausentes.
- Ampliar e2e con aislamiento tenant, auth, reservas concurrentes y contratos
  de plataforma.

## Fuera de alcance actual

- App mobile adicional fuera de las fases ya implementadas.
- Modo Entrada QR/carnet offline.
- Cobro SaaS de ClubApp a los clubes.
- WhatsApp/SMS pagos para cobranza.
- Kubernetes, S3/R2 y roles granulares de comisión.

## Regla de actualización

Cada cambio de código que cierre una tarea debe actualizar este documento y el
documento técnico o contrato correspondiente. No marcar como realizado algo que
solo tenga mocks o una pantalla sin integración y prueba del contrato.

## Cómo registrar nuevas tareas

Usar este formato en el área correspondiente:

| ID | Tarea | Estado | Prioridad | Dependencia | Criterio de cierre |
|---|---|---|---|---|---|
| EJ-00 | Descripción breve | Pendiente | P0/P1/P2 | API, QA o decisión | Evidencia verificable |

Estados permitidos: `Realizado`, `En progreso`, `Pendiente`, `Bloqueado`,
`Fuera de alcance` e `Histórico`. Una tarea solo pasa a `Realizado` cuando el
código, el contrato y la validación que corresponda están cerrados.
