#!/bin/sh
set -e

# ── Debug: show DATABASE_URL (masked password) ────────────────────
echo "[Setup] DATABASE_URL host: $(echo $DATABASE_URL | sed 's|://[^@]*@|://***@|')"

# ── Wait for PostgreSQL ──────────────────────────────────────────────
echo "[Setup] Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U "${POSTGRES_USER:-postgres}" 2>/dev/null; do
  sleep 2
done
echo "[Setup] PostgreSQL ready"

# ── Prisma schema push (creates/updates tables) ────────────────────
echo "[Setup] Pushing Prisma schema to database..."
npx prisma db push --skip-generate --accept-data-loss 2>&1
echo "[Setup] Schema push done"

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
