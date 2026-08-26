# CLAUDE.md

Instrucciones para Claude Code al trabajar en este repositorio.

## Agentes disponibles (.claude/)

Este proyecto define dos agentes especializados en frontend. Úsalos vía el tool `Agent` en lugar de implementar tú mismo el código frontend cuando la tarea encaje.

### `frontend-engineer`
Usar para tareas frontend **grandes o con impacto en varios archivos**: nuevos componentes complejos, formularios con validación, refactors que tocan estado/integraciones API, o cambios que requieren primero investigar patrones existentes en el código. Sigue un flujo formal: aclara requisitos → investiga código existente → presenta un plan → implementa → puede pedir revisión a un code-reviewer.

Ejemplos:
- "Crea un componente de perfil de jugador con avatar, stats y edición inline"
- "El navbar está roto en mobile, investiga y arregla"
- Cambios backend que rompen contratos usados por el frontend (revisar y actualizar el lado cliente)

### `frontend-specialist`
Usar para tareas frontend **rápidas y acotadas**: ajustes puntuales de estilo, refactors pequeños, modernizar un snippet, mejoras de performance localizadas. No requiere el paso de planificación explícita del `frontend-engineer`.

Ejemplos:
- "Simplifica este componente de menú"
- "Optimiza este listado que renderiza lento"

### Regla general
- Si la tarea toca múltiples componentes, estado global, o integración con el backend (`apps/api`), usa `frontend-engineer`.
- Si es un cambio aislado en un componente o estilo, usa `frontend-specialist`.
- Ambos agentes siguen KISS: preferir la solución más simple, reutilizar código existente, evitar `any` en TypeScript.

## Stack del proyecto

- Backend: NestJS + PostgreSQL en `apps/api` (puerto 3001)
- Frontend: Next.js en `apps/web` (puerto 3000)
- Monorepo gestionado con pnpm workspaces
