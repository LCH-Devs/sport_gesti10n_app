@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 ClubApp Arg - Setup Completo
echo ================================
echo.

REM 1. Install dependencies
echo [1/5] Instalando dependencias...
echo   - apps/web
cd apps\web
call npm install
cd ..\..

echo   - apps/mobile
cd apps\mobile
call npm install
cd ..\..

echo   - packages/shared
cd packages\shared
call npm install
cd ..\..

echo   - apps/api
cd apps\api
call npm install
cd ..\..

REM 2. Database
echo.
echo [2/5] Levantando PostgreSQL...
docker compose up db -d
timeout /t 3 /nobreak

REM 3. API Setup
echo.
echo [3/5] Setup API...
cd apps\api

echo   - Migraciones...
call npx prisma migrate dev --name init

echo   - Seed...
call npm run prisma:seed
cd ..\..

echo.
echo ✅ Setup completo!
echo.
echo Proximos pasos:
echo   Terminal 1: cd apps\api ^&^& npm run start:dev
echo   Terminal 2: cd apps\web ^&^& npm run dev
echo   Terminal 3: cd apps\mobile ^&^& npm run start
echo.
echo URLs:
echo   - Web:      http://localhost:3000
echo   - API:      http://localhost:3001
echo   - Landing:  http://localhost:3000/landing
echo   - Login:    http://localhost:3000/login/club-prueba
echo.
echo Credenciales:
echo   - Email:    admin@clubprueba.com
echo   - Password: admin123
echo.
pause
