# Plan de trabajo unificado

Este es el tablero documental único. Para cada tarea se usa: `Realizado`, `En
progreso`, `Pendiente`, `Bloqueado` o `Fuera de alcance`.

## Realizado

- Base del monorepo, setup local y módulos principales de API.
- Identidad compartida, tenant y sesiones JWT en backend.
- CRUD principal de socios, cuotas, reservas, espacios, noticias y configuración.
- Recuperación de contraseña backend.
- Fases 0–3 de mobile implementadas en código.

## En progreso

| Tarea | Criterio de cierre |
|---|---|
| Panel web administrativo | Navegación por rol, onboarding y CRUD validados en navegador |
| Portal socio/profe | Login, perfil, cuotas y reservas propias sin 404 ni datos ajenos |
| Integración API/frontend | Contratos, errores y estados parciales conectados |
| QA transversal | Responsive, traducciones, accesibilidad y contenido revisados |

## Pendiente prioritario

| Prioridad | Tarea | Dependencia |
|---|---|---|
| P0 | Type-check/build web reproducible | Flujo correcto de `.next/types` |
| P0 | Aislamiento tenant contra PostgreSQL real | DB local y tests e2e |
| P1 | Concurrencia e idempotencia de reservas/cuotas | Contratos API cerrados |
| P1 | Checklist manual de lanzamiento | Frontend integrado |
| P1 | CI, despliegue, backups y monitoreo | Decisión operativa |
| Posterior | OAuth MP por club y webhook firmado | Diseño de pagos productivo |

## No iniciar en este ciclo

Mobile adicional, cobro SaaS, QR offline, WhatsApp/SMS pagos, Kubernetes, S3/R2
y nuevos roles de comisión.

## Referencias archivadas

Roadmaps, planes frontend, pendientes backend y plan mobile originales quedan en
`HISTORICO/PLANIFICACION/`.
