#!/usr/bin/env bash
set -e

echo "[build-prod] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[build-prod] Building all packages..."
export NODE_ENV=production
export INTERNAL_API_URL=http://localhost:4000

pnpm run build

echo "[build-prod] Done."
