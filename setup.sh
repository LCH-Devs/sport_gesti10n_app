#!/bin/bash
set -e

echo "🚀 ClubApp Arg — Setup Completo"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Install dependencies
echo -e "\n${BLUE}1. Instalando dependencias...${NC}"
echo "   → apps/web"
cd apps/web && npm install
cd ../..

echo "   → apps/mobile"
cd apps/mobile && npm install
cd ../..

echo "   → packages/shared"
cd packages/shared && npm install
cd ../..

echo "   → apps/api"
cd apps/api && npm install
cd ../..

# 2. Database
echo -e "\n${BLUE}2. Levantando PostgreSQL...${NC}"
docker compose up db -d
echo "   → Esperando que DB esté lista..."
sleep 3

# 3. API Setup
echo -e "\n${BLUE}3. Setup API...${NC}"
cd apps/api
echo "   → Migraciones..."
npx prisma migrate dev --name init
echo "   → Seed..."
npm run prisma:seed
cd ../..

echo -e "\n${GREEN}✅ Setup completo!${NC}"
echo -e "\n${BLUE}Próximos pasos:${NC}"
echo "  Terminal 1: cd apps/api && npm run start:dev"
echo "  Terminal 2: cd apps/web && npm run dev"
echo "  Terminal 3: cd apps/mobile && npm run start"
echo ""
echo "URLs:"
echo "  • Web:      http://localhost:3000"
echo "  • API:      http://localhost:3001"
echo "  • Landing:  http://localhost:3000/landing"
echo "  • Login:    http://localhost:3000/login/club-prueba"
echo ""
echo "Credenciales:"
echo "  • Email:    admin@clubprueba.com"
echo "  • Password: admin123"
