# 🚀 Setup Rápido — ClubApp Arg + Diseño Nuevo

**¡Integración completada!** Backend + Web nuevo + Mobile + Shared

---

## Opción A: Setup Automático (Recomendado)

### Windows
```bash
.\setup.bat
```

### Mac/Linux
```bash
bash setup.sh
```

Esto hace todo automáticamente:
1. ✅ Instala dependencias de todos los packages
2. ✅ Levanta PostgreSQL en Docker
3. ✅ Ejecuta migraciones Prisma
4. ✅ Genera datos de prueba (seed)

---

## Opción B: Setup Manual

### 1. Instalar dependencias
```bash
cd apps/web && npm install && cd ../..
cd apps/mobile && npm install && cd ../..
cd packages/shared && npm install && cd ../..
cd apps/api && npm install && cd ../..
```

### 2. Database
```bash
docker compose up db -d
```

### 3. API
```bash
cd apps/api
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Levantar en local (3 terminales)

**Terminal 1 — API**
```bash
cd apps/api
npm run start:dev
```
→ http://localhost:3001

**Terminal 2 — Web**
```bash
cd apps/web
npm run dev
```
→ http://localhost:3000

**Terminal 3 — Mobile (opcional)**
```bash
cd apps/mobile
npm run start
```

---

## 🔐 Credenciales de Prueba

### Club Prueba
- **Slug:** `club-prueba`
- **Admin email:** `admin@clubprueba.com`
- **Password:** `admin123`

### Plataforma
- **Email:** `platform@clubapp.com`
- **Password:** `platform123`

### Socios
- **DNI:** `30111222` / `30222333` / `30333444`
- **Password:** `socio123`

---

## 📍 URLs

| URL | Descripción |
|-----|------------|
| http://localhost:3000 | Home (redirige a landing) |
| http://localhost:3000/landing | Landing page |
| http://localhost:3000/login/club-prueba | Login socio/admin |
| http://localhost:3000/admin | Panel admin (tras login) |
| http://localhost:3000/platform/login | Login plataforma |
| http://localhost:3001 | API REST |
| http://localhost:3001/health | Health check |

---

## ✅ Checklist Post-Setup

- [ ] API está en http://localhost:3001
- [ ] Web está en http://localhost:3000
- [ ] Landing page carga sin errores
- [ ] Puedo hacer login con `admin@clubprueba.com / admin123`
- [ ] Admin panel muestra datos desde API
- [ ] Socios lista se carga correctamente
- [ ] Cobros muestra pagos
- [ ] Config del club permite editar

---

## 🐛 Troubleshooting

### "Port 3000/3001 already in use"
```bash
# Mata el proceso anterior
lsof -ti:3000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3000   # Windows
```

### "Prisma migration error"
```bash
cd apps/api
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### "Module not found" en web
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

### API no conecta a DB
```bash
# Verifica que Docker está corriendo
docker ps

# Si no está, levanta DB
docker compose up db -d

# Espera 5 segundos y reintenta
```

---

## 📝 Nota sobre Git

Cambios listos para commitear:
```bash
git add apps/web apps/mobile packages/shared
git commit -m "feat: integrate new frontend design with admin pages connected to API"
```

Después puedes borrar el backup:
```bash
rm -rf apps/web.backup/
```

---

## 🆘 ¿Necesitas ayuda?

Ver `INTEGRACION_STATUS.md` para detalles técnicos de la integración.
