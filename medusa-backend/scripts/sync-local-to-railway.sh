#!/usr/bin/env bash
set -euo pipefail

echo "==> Sync local (source of truth) -> Railway"

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx is required."
  exit 1
fi

if ! npx @railway/cli whoami >/dev/null 2>&1; then
  echo "ERROR: Railway CLI is not authenticated. Run: npx @railway/cli login"
  exit 1
fi

echo "==> Step 1/6: local parity snapshot"
npm run parity:snapshot:local

echo "==> Step 2/6: seed Egypt catalog on Railway"
npx @railway/cli run npm run seed:egypt:public

echo "==> Step 3/6: ensure HORO taxonomy on Railway"
npx @railway/cli run npm run seed:horo-taxonomy:public

echo "==> Step 4/6: migrate/link feelings categories on Railway"
npx @railway/cli run npm run migrate:feelings-categories:public

echo "==> Step 5/6: remote parity snapshot"
npx @railway/cli run npm run parity:snapshot:remote

echo "==> Step 6/6: parity compare (ignore media host drift)"
npm run parity:check:ignore-media

echo "==> Done. Local and Railway snapshots match (ignoring media host differences)."
