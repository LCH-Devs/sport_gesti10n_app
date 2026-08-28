# CLAUDE.md

Instrucciones para agentes al trabajar en este repositorio.

**Fuente de verdad:** [`AGENTS.md`](./AGENTS.md)

Seguí esas reglas (multi-tenant, identidad `Usuario`/`Membresia`, NestJS, Next.js, pagos). No uses los agentes `frontend-engineer` / `frontend-specialist` de versiones viejas de este archivo: no existen en el repo.

## Stack (resumen)

- Backend: NestJS + Prisma + PostgreSQL en `apps/api` (puerto 3001)
- Frontend canónico: Next.js en `apps/web` (puerto 3000). `apps/web-v2` es el mismo panel con rutas distintas
- Monorepo: pnpm workspaces
- Mobile (`apps/mobile`): fuera de este milestone
