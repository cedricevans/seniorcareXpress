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

echo "[entrypoint] Starting PocketBase on port ${PORT}..."

# Start PocketBase in background
/app/pocketbase serve --http=0.0.0.0:${PORT} --hooksDir=/app/pb_hooks --hooksWatch=false &
PB_PID=$!

# Wait for PocketBase to be ready (max 10 seconds)
echo "[entrypoint] Waiting for PocketBase to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if wget -q -O- http://localhost:${PORT}/api/health > /dev/null 2>&1; then
    echo "[entrypoint] PocketBase is ready!"
    break
  fi
  echo "[entrypoint] Waiting... ($i/10)"
  sleep 1
done

# Create/update superuser now that server is running
echo "[entrypoint] Creating/updating superuser: ${PB_SUPERUSER_EMAIL}"
/app/pocketbase superuser upsert --dir=/app/pb_data "${PB_SUPERUSER_EMAIL}" "${PB_SUPERUSER_PASSWORD}" > /dev/null 2>&1 || echo "[entrypoint] Note: Superuser command returned non-zero (may already exist)"

echo "[entrypoint] Setup complete. PocketBase is running."

# Wait for PocketBase process
wait $PB_PID

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
