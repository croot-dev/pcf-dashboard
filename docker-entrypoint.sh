#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

if [ "${RUN_DB_PUSH:-true}" = "true" ]; then
  echo "Syncing database schema..."
  npx prisma db push
fi

if [ "${SEED_DB:-false}" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

if [ "$#" -eq 0 ]; then
  if [ "${NODE_ENV:-production}" = "development" ]; then
    export WATCHPACK_POLLING="${WATCHPACK_POLLING:-true}"
    set -- yarn dev
  else
    set -- yarn start
  fi
fi

echo "Starting application..."
exec "$@"
