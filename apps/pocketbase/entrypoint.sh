#!/bin/sh
set -e

# Lightweight entrypoint for PocketBase image
# Responsibilities:
# - Start pocketbase
# - Wait a few seconds for it to boot
# - Ensure a superuser exists (upsert from Railway env vars)
# - If no db is present, warn (do not auto-seed or overwrite production DB)

PB_SUPERUSER_EMAIL=${PB_SUPERUSER_EMAIL:-admin@seniorcare.com}
PB_SUPERUSER_PASSWORD=${PB_SUPERUSER_PASSWORD:-Admin123!}
PORT=${PORT:-8090}

echo "[entrypoint] Debug - Email: ${PB_SUPERUSER_EMAIL}"
echo "[entrypoint] Debug - Password length: ${#PB_SUPERUSER_PASSWORD}"
echo "[entrypoint] Creating superuser before starting server..."

# Create superuser BEFORE starting the server (database must not be in use)
/app/pocketbase superuser upsert --dir=/app/pb_data "${PB_SUPERUSER_EMAIL}" "${PB_SUPERUSER_PASSWORD}" 2>&1

if [ $? -eq 0 ]; then
  echo "[entrypoint] Superuser created/updated: ✓"
else
  echo "[entrypoint] WARNING: Superuser creation failed"
fi

echo "[entrypoint] Starting PocketBase..."
exec /app/pocketbase serve --http=0.0.0.0:${PORT} --hooksDir=/app/pb_hooks --hooksWatch=false

if [ ! -f /app/pb_data/data.db ]; then
  cat <<'EOF'
=================================================================
WARNING: No PocketBase DB found at /app/pb_data/data.db

This container will run with an empty DB. To avoid accidentally
overwriting production data, this image no longer seeds or copies
`pb_data` at build time. Please do one of the following:

  1) Mount a persistent volume to /app/pb_data so PocketBase can
     persist its DB across restarts and deploys (recommended).

  2) Run the repo's setup script ONCE against this running instance to
     create collections and seed demo data:

       PB_URL=http://localhost:${PORT} node /app/pb_hooks/../setup.js

  3) If you unexpectedly committed `apps/pocketbase/pb_data` to git,
     remove it from the repo (see repo script: tools/remove_pb_data_from_git.sh)

This image will continue running but will not overwrite any external
persisted DB or attempt destructive seeding.
=================================================================
EOF
fi

wait $PB_PID
