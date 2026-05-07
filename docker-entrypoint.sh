#!/bin/sh
set -e

echo "Pushing schema to database..."
npx prisma db push --skip-generate

echo "Starting Next.js server..."
exec yarn start
