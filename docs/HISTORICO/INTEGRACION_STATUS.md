# Integración de Diseño — Status ✅ COMPLETADO

**Fecha:** 2026-08-20  
**Objetivo:** Integrar frontend diseñado + admin pages conectadas al backend.

---

## ✅ Completado

### 1️⃣ Nuevo Web (Next.js 15 + Diseño)
- ✅ `apps/web/src` → Diseño nuevo (landing, clubs, dashboard, news, events)
- ✅ `apps/web/package.json` → React 19, Next 15, @heroicons, leaflet
- ✅ Configs: next.config.js, tailwind.config.js, postcss.config.js, tsconfig.json
- ✅ **`lib/api.ts` preservado** (conexión con backend NestJS)

### 2️⃣ Admin Pages Conectadas (del Backup)
- ✅ `/admin/*` → todas las páginas administrativas
  - socios, cobros, usuarios, espacios, reservas, horarios
  - noticias, config, fuga, familias, actividades, torneos, liquidaciones
- ✅ `/login/*` → login de socios y admin con API
- ✅ `/platform/*` → plataforma de super-admin

### 3️⃣ Autenticación y Temas
- ✅ `admin/layout.tsx` → verifica sesión, aplica temas del club, maneja onboarding
- ✅ Componentes específicos: ClubColorFields.tsx, ClubLogoField.tsx

### 4️⃣ Mobile + Shared (Expo)
- ✅ `apps/mobile/` → Expo 57, React Native, Expo Router
- ✅ `packages/shared/` → tipos y utilidades compartidas

---

## 📁 Estructura Final

```
apps/
├── api/                          # ← Backend NestJS (INTACTO ✅)
│   ├── src/
│   │   ├── auth/, clubs/, socios/, pagos/, etc.
│   │   └── main.ts
│   └── prisma/
│
├── web/                          # ← Next.js 15 + Diseño + Admin Conectado
│   ├── src/
│   │   ├── app/
│   │   │   ├── landing/          # Landing & features
│   │   │   ├── clubs/            # Clubs browser
│   │   │   ├── dashboard/        # Dashboard
│   │   │   ├── news/, events/    # Social
│   │   │   │
│   │   │   ├── admin/            # ← Admin conectado al API
│   │   │   │   ├── socios/       # Alta/baja/edit
│   │   │   │   ├── cobros/       # Pagos y cuotas
│   │   │   │   ├── usuarios/     # Admin/entrada
│   │   │   │   ├── espacios/     # Canchas, quinchos
│   │   │   │   ├── reservas/     # Calendario
│   │   │   │   ├── horarios/     # Actividades
│   │   │   │   ├── config/       # Club config
│   │   │   │   ├── fuga/         # Alerta de fuga
│   │   │   │   └── layout.tsx    # Auth + menú admin
│   │   │   │
│   │   │   ├── login/            # ← Login con API
│   │   │   └── platform/         # ← Platform admin
│   │   │
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Sidebar, etc.
│   │   │   ├── ClubColorFields.tsx
│   │   │   └── ClubLogoField.tsx
│   │   │
│   │   └── lib/
│   │       └── api.ts            # ← API client (JWT, fetch, multitenancy)
│   │
│   ├── package.json              # React 19, Next 15
│   └── next.config.js
│
├── mobile/                       # ← Expo app (React Native)
│   ├── src/
│   │   ├── app/                  # Expo Router
│   │   ├── components/
│   │   ├── hooks/
│   │   └── context/
│   └── package.json              # Expo 57
│
└── web.backup/                   # Backup (puedes borrar)

packages/
└── shared/                       # ← Tipos y utilidades compartidas
    ├── src/
    │   ├── types.ts
    │   ├── utils.ts
    │   ├── constants.ts
    │   └── index.ts
    └── package.json
```

---

## 🚀 Próximos Pasos

### 1. Instalar dependencias
```bash
cd apps/web && npm install
cd apps/api && npm install
cd apps/mobile && npm install
cd packages/shared && npm install
```

### 2. Levantar en local
```bash
# Terminal 1: Database
docker compose up db -d

# Terminal 2: API
cd apps/api
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev

# Terminal 3: Web
cd apps/web
npm run dev

# Terminal 4: Mobile (opcional)
cd apps/mobile
npm run start
```

### 3. Verificar
- ✅ API en http://localhost:3001
- ✅ Web en http://localhost:3000
  - Landing: http://localhost:3000/landing
  - Login club: http://localhost:3000/login/club-prueba
  - Admin: http://localhost:3000/admin (tras login)
  - Platform: http://localhost:3000/platform/login

### 4. Credenciales seed
```
Club: club-prueba
Admin: admin@clubprueba.com / admin123
Platform: platform@clubapp.com / platform123
```

---

## ⚠️ Cosas a Verificar (Pruebas Manuales)

- [ ] Login con admin funciona y redirige a `/admin`
- [ ] Admin/socios lista socios desde API
- [ ] Admin/cobros carga pagos desde API
- [ ] Admin/config permite editar y guarda en API
- [ ] Landing page carga sin errores
- [ ] Logout limpia sesión y redirige a login
- [ ] Temas de club se aplican (colores en header)
- [ ] Mobile app compila (npm run start)

---

## 📝 Git Status

**Cambios:**
```
✅ apps/web/           → Reemplazado (diseño + admin)
✅ apps/mobile/        → Nuevo (Expo)
✅ packages/shared/    → Nuevo (tipos)
✅ apps/api/           → Intacto
```

**A commitear:**
```bash
git add apps/web apps/mobile packages/shared
git commit -m "feat: integrate new frontend design with admin pages connected to API

- Replace web with new design (Next 15, React 19)
- Integrate admin pages from backup (socios, cobros, config, etc)
- Preserve api.ts for backend connectivity
- Add mobile app (Expo) and shared package
- Keep api/ unchanged"
```

---

## 🧹 Limpiar (cuando todo funcione)
```bash
rm -rf apps/web.backup/
```
