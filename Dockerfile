# Production build for the WhatsPlan website (TanStack Start SSR).
# Two stages: compile a self-contained Node server (.output) with all client
# assets, then run it on a clean slim image. Replaces the old `npm run dev`.

# ---- Build stage ----
FROM node:22-slim AS build
WORKDIR /app

# Install deps first so this layer caches between rebuilds.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

# VITE_API_URL is inlined into the client bundle at build time (production
# builds bake env, they don't read it at runtime). Defaults to the live domain.
ARG VITE_API_URL=https://whatsplan.social
ENV VITE_API_URL=$VITE_API_URL

# vite.config.ts sets nitro preset "node-server" → .output/server/index.mjs
RUN npm run build

# ---- Runtime stage ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# .output is fully self-contained (verified to run without node_modules).
COPY --from=build /app/.output ./.output

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
