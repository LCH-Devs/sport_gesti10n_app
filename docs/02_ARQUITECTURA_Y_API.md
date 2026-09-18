# Arquitectura, datos y contratos API

Fuente unificada para reglas técnicas, modelo de datos y contratos entre API y
frontend. El código actual y `AGENTS.md` tienen prioridad ante contradicciones.

## Arquitectura vigente

- API NestJS + Prisma + PostgreSQL en `apps/api`.
- Panel web Next.js en `apps/web`.
- Identidad: `Usuario` + `Membresia`; plataforma mediante `PlatformAdmin`.
- Toda operación de club usa `club_id` proveniente del JWT.
- La API devuelve personas aplanadas; los IDs de negocio son IDs de membresía.

## Contratos agrupados

| Área | Estado | Cobertura |
|---|---|---|
| Auth, JWT, cambio de club y recuperación | Backend realizado; UI por validar | `auth`, `FRONT_SESION` archivado |
| Socios, staff, familias y actividades | API realizada; UI parcial | CRUD y DTOs |
| Cuotas y pagos manuales | Parcial | Requiere validar idempotencia y resultados parciales |
| Espacios y reservas | API con pruebas unitarias; concurrencia real pendiente | CRUD y reglas de slots |
| Solicitudes de plataforma | API realizada; UI por validar | Alta pública y panel plataforma |
| Social | API realizada; UI parcial | Feed entre clubes |

## Validación obligatoria

- Actualizar contrato y tipos frontend juntos.
- Filtrar siempre por tenant y verificar recursos por `:id` dentro del club.
- Agregar pruebas reales de aislamiento, auth y concurrencia.
- No documentar rutas que no existan en el código.

## Referencias archivadas

Los documentos API, DB, FRONT y contrastes detallados se conservan en
`HISTORICO/ARQUITECTURA_API/`.
