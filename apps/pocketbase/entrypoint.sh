#!/bin/sh
set -e

PB_SUPERUSER_EMAIL=${PB_SUPERUSER_EMAIL:-admin@seniorcare.com}
PB_SUPERUSER_PASSWORD=${PB_SUPERUSER_PASSWORD:-Admin123!}
PORT=${PORT:-8090}

echo "[entrypoint] Creating/updating superuser: ${PB_SUPERUSER_EMAIL}"
/app/pocketbase superuser upsert --dir=/app/pb_data "${PB_SUPERUSER_EMAIL}" "${PB_SUPERUSER_PASSWORD}" 2>&1 || true

echo "[entrypoint] Starting PocketBase on port ${PORT}..."
exec /app/pocketbase serve --http=0.0.0.0:${PORT} --hooksDir=/app/pb_hooks --hooksWatch=false
