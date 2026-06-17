# syntax=docker/dockerfile:1

# ---- Build stage --------------------------------------------------------
# Full toolchain: install all deps, generate the Prisma client and build Nuxt.
FROM node:24-alpine AS builder

WORKDIR /app

# Dependencies first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for the build) from the lockfile
# for deterministic, reproducible builds matching what was tested locally.
RUN npm ci --legacy-peer-deps

# Copy the rest of the source and build
COPY . .

# Temporary DATABASE_URL is only needed for client generation / build, not at runtime
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public" npm run prisma:generate
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public" npm run build

# ---- Runtime stage ------------------------------------------------------
# Slim image: only what the app and the startup script actually need.
# Notably excluded vs. the build stage: git, openssh-client, dev toolchain
# and the application source tree (only the built .output ships).
FROM node:24-alpine AS runtime

# Runtime-only OS tools used by docker-entrypoint.sh (pg_isready, curl)
RUN apk add --no-cache bash curl postgresql-client

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Bring over the built app, the generated Prisma client and the installed
# node_modules from the builder (native bcrypt binary is reused, not rebuilt).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Drop dev dependencies (nuxt, vite, vitest, ...) to shrink the image and its
# attack surface. tsx is needed by the entrypoint to run the TypeScript seed,
# so install it globally (a global install is not subject to NODE_ENV=production
# dev-dependency omission, unlike a local one).
RUN npm prune --omit=dev --no-package-lock --legacy-peer-deps \
 && npm install -g tsx \
 && npm cache clean --force

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Startup: waits for DBs, pushes Prisma schema, seeds, then starts Nuxt
CMD ["sh", "docker-entrypoint.sh"]
