#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Pushing schema to database..."
npx prisma db push

if [ "$NODE_ENV" = "development" ]; then
  export WATCHPACK_POLLING=true
  echo "Starting Next.js dev server..."
  exec yarn dev
else
  echo "Starting Next.js server..."
  exec yarn start
fi
