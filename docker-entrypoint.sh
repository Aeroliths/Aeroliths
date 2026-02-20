#!/bin/sh
set -e

# ── Wait for PostgreSQL ──────────────────────────────────────────────
echo "[Setup] Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 2>/dev/null; do
  sleep 2
done
echo "[Setup] PostgreSQL ready"

# ── Prisma migrations (idempotent — skips already applied) ──────────
echo "[Setup] Running Prisma migrations..."
npx prisma migrate deploy
echo "[Setup] Migrations done"

# ── Seed (uses upsert — safe to run on existing data) ───────────────
echo "[Setup] Running seed..."
npx tsx prisma/seed.ts
echo "[Setup] Seed done"

# ── Wait for ArangoDB ────────────────────────────────────────────────
echo "[Setup] Waiting for ArangoDB..."
until curl -sf "http://arangodb:8529/_api/version" \
  -u "root:${ARANGO_PASSWORD}" > /dev/null 2>&1; do
  sleep 2
done
echo "[Setup] ArangoDB ready"

# ── Start application ────────────────────────────────────────────────
echo "[Setup] Starting application..."
exec node .output/server/index.mjs
