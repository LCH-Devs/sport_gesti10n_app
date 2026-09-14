FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
EXPOSE 3001
# Solo migra y arranca. El seed NO corre acá: crea cuentas con contraseñas
# fijas y públicas en el código (admin123/socio123/platform123 — esta
# última es el superadmin de toda la plataforma). Si algún entorno lo
# necesita (dataset de demo/staging), correrlo a mano y una sola vez:
#   docker compose run --rm api npx ts-node --transpile-only prisma/seed.ts
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
