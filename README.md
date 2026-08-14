# ClubApp Arg — Base del monorepo

SaaS multi-tenant para clubes de barrio.  
**Este milestone:** API NestJS + panel web Next.js + PostgreSQL en Docker.  
**Después:** app móvil Expo.

## Equipo

| Quién | Rol |
|--------|-----|
| Back | `apps/api` (Nest + Prisma) |
| Front | `apps/web` (Next 14) |
| Tester | Manual + checklist en [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) · contratos [`docs/API.md`](docs/API.md) |

## Requisitos

- Node 20+
- Docker (solo para Postgres en el día a día)

## Levantar en local

### 1. Base de datos

```bash
docker compose up db -d
```

Postgres: `localhost:5432` — user/pass/db: `clubapp` / `clubapp` / `clubapp`

### 2. API

```bash
cd apps/api
cp ../../.env.example .env   # o usar el .env ya incluido
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

API: http://localhost:3001 — health: `GET /health`

### 3. Web

```bash
cd apps/web
npm install
npm run dev
```

Panel clubes: http://localhost:3000/login  
Panel interno: http://localhost:3000/platform/login

### Credenciales seed (Club Prueba)

- **Plataforma:** `platform@clubapp.com` / `platform123` → http://localhost:3000/platform/login
- Slug: `club-prueba`
- Admin: `admin@clubprueba.com` / `admin123` → http://localhost:3000/login/club-prueba
- Socios: DNI `30111222`, `30222333`, `30333444` — pass `socio123`

## Stack completo en Docker (opcional)

```bash
docker compose --profile full up --build
```

## Convención

- Branches: `feat/api-…`, `feat/web-…`
- PRs chicos contra `main`
- Multi-tenant: siempre filtrar por `club_id` / header `X-Club-Slug`
- Mobile (`apps/mobile`) no entra en este milestone

## Docs

- [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) — **manual para tester/front** (qué hay, checklist, qué falta)
- [PLAN.md](PLAN.md) — producto y fases
- [TECNICO_EQUIPO.md](TECNICO_EQUIPO.md) — arquitectura
- [docs/API.md](docs/API.md) — endpoints para QA
- [docs/FRONT.md](docs/FRONT.md) — onboarding front (DB local, API, pantallas)
- [security_issues.md](security_issues.md) — seguridad MP
