#!/bin/sh
set -eu

echo "Generating Prisma client..."
pnpm run db:generate

echo "Running Prisma migrations..."
pnpm run db:migrate:prod

echo "Starting API..."
exec node dist/main
