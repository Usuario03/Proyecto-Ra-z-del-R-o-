# ============================================================================
# Raíz del Río — Dockerfile (Next.js 16.4 + Backend server/ + Node 24.14.1)
# ============================================================================

FROM node:24.14.1-alpine AS base
WORKDIR /app
RUN npm install -g npm@11.11.0

# 1. Instalación limpia de dependencias
FROM base AS deps
COPY package.json package-lock.json .npmrc .nvmrc ./
RUN npm ci

# 2. Compilación de producción (Frontend src/ + Backend server/)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build || npm run build

# 3. Ejecución ligera en producción
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["npm", "run", "start"]
