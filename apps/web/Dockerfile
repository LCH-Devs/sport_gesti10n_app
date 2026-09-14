FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Las NEXT_PUBLIC_* se inline-an en el bundle JS durante "next build": no
# alcanza con setearlas como env var del contenedor en runtime, tienen que
# pasarse como --build-arg en el momento de construir la imagen. Si se
# reusa la misma imagen entre staging y producción con estas variables
# fijas al build, todos los entornos van a apuntar al mismo backend.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ARG NEXT_PUBLIC_TENANT_BASE_DOMAIN
ARG NEXT_PUBLIC_MP_PUBLIC_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_TENANT_BASE_DOMAIN=$NEXT_PUBLIC_TENANT_BASE_DOMAIN
ENV NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
