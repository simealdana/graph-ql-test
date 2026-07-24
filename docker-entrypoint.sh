#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting service..."
exec node dist/main.js
