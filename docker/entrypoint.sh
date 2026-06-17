#!/bin/sh
set -e

# -- Wait for PostgreSQL ----------------------------------------
echo "[Dev] Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 2>/dev/null; do
  sleep 2
done
echo "[Dev] PostgreSQL ready"

# -- Prisma : generate + migrate --------------------------------
echo "[Dev] Running Prisma generate..."
npm run prisma:generate
echo "[Dev] Running Prisma migrations..."
npm run prisma:migrate:prod
echo "[Dev] Migrations done"

# -- Seed -------------------------------------------------------
echo "[Dev] Running seed..."
npm run prisma:seed
echo "[Dev] Seed done"

# -- Wait for ArangoDB -------------------------------------------
echo "[Dev] Waiting for ArangoDB..."
until curl -sf "http://arangodb:8529/_api/version" \
  -u "root:${ARANGO_PASSWORD}" > /dev/null 2>&1; do
  sleep 2
done
echo "[Dev] ArangoDB ready"

echo "[Dev] Setup complete. Run 'npm run dev' manually to start the Nuxt dev server."
exec tail -f /dev/null
