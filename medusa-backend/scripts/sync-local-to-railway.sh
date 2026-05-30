#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

echo "==> Sync local (source of truth) -> Railway"

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx is required."
  exit 1
fi

# shellcheck source=/dev/null
source "${ROOT}/scripts/load-database-public-url.sh"

USE_DIRECT=0
if [ -n "${DATABASE_PUBLIC_URL:-}" ]; then
  USE_DIRECT=1
  echo "==> Using DATABASE_PUBLIC_URL from environment / .env (direct :public scripts)"
elif npx @railway/cli whoami >/dev/null 2>&1; then
  echo "==> Using Railway CLI (railway run …)"
else
  cat <<'EOF'
ERROR: Cannot reach Railway Postgres.

Fix one of:
  1. Run: npx @railway/cli login
     Then re-run: npm run sync:local-to-railway

  2. Add DATABASE_PUBLIC_URL to medusa-backend/.env (from Railway → Postgres → Variables → DATABASE_PUBLIC_URL)
     Then re-run: npm run sync:local-to-railway

See medusa-backend/README.md § "Local is the source of truth".
EOF
  exit 1
fi

run_remote() {
  local label="$1"
  shift
  echo "==> ${label}"
  if [ "${USE_DIRECT}" -eq 1 ]; then
    "$@"
  else
    npx @railway/cli run "$@"
  fi
}

echo "==> Step 1/14: local parity snapshot"
npm run parity:snapshot:local

run_remote "Step 2/14: Railway schema migrate" npm run migrate:public

run_remote "Step 3/14: seed Egypt catalog on Railway (includes shipping_profile_id)" npm run seed:egypt:public

run_remote "Step 4/14: link products to shipping profile on Railway (backfill)" npm run link:shipping-profile:public

run_remote "Step 5/14: enable variant stock tracking on Railway" npm run enable:stock-tracking:public

run_remote "Step 6/14: backfill inventory items + levels on Railway" npm run backfill:inventory:public

run_remote "Step 7/14: ensure HORO taxonomy on Railway" npm run seed:horo-taxonomy:public

run_remote "Step 8/14: migrate/link feelings categories on Railway" npm run migrate:feelings-categories:public

run_remote "Step 9/14: seed homepage sections on Railway" npm run seed:homepage-sections:public

run_remote "Step 10/14: seed incentives on Railway" npm run seed:incentives:public

run_remote "Step 11/14: ensure Egypt payment providers on Railway" npm run ensure:egypt-payment-providers:public

run_remote "Step 12/14: apply store delivery + size tables metadata on Railway" npm run apply:store-delivery-metadata:public

run_remote "Step 12b/14: size tables metadata" npm run apply:size-tables-metadata:public

run_remote "Step 13/14: backfill product artist metadata on Railway" npm run backfill:product-artist-metadata:public

run_remote "Step 14/14: EGP whole-pound prices on Railway" npm run migrate:egp-prices:public

echo "==> Remote parity snapshot"
if [ "${USE_DIRECT}" -eq 1 ]; then
  npm run parity:snapshot:remote
else
  npx @railway/cli run npm run parity:snapshot:remote
fi

echo "==> Parity compare (ignore media host drift)"
npm run parity:check:ignore-media

echo "==> Done. Local and Railway catalog snapshots match (ignoring media host differences)."
