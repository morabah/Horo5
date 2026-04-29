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

echo "==> Step 1/11: local parity snapshot"
npm run parity:snapshot:local

echo "==> Step 2/11: seed Egypt catalog on Railway (includes shipping_profile_id)"
npx @railway/cli run npm run seed:egypt:public

echo "==> Step 3/11: link products to shipping profile on Railway (backfill)"
npx @railway/cli run npm run link:shipping-profile:public

echo "==> Step 4/11: enable variant stock tracking on Railway"
npx @railway/cli run npm run enable:stock-tracking:public

echo "==> Step 4b/11: backfill inventory items + levels on Railway"
npx @railway/cli run npm run backfill:inventory:public

echo "==> Step 5/11: ensure HORO taxonomy on Railway"
npx @railway/cli run npm run seed:horo-taxonomy:public

echo "==> Step 6/11: migrate/link feelings categories on Railway"
npx @railway/cli run npm run migrate:feelings-categories:public

echo "==> Step 7/11: seed homepage sections on Railway"
npx @railway/cli run npm run seed:homepage-sections:public

echo "==> Step 8/11: seed incentives on Railway"
npx @railway/cli run npm run seed:incentives:public

echo "==> Step 9/11: apply store delivery + size tables metadata on Railway"
npx @railway/cli run npm run apply:store-delivery-metadata:public
npx @railway/cli run npm run apply:size-tables-metadata:public

echo "==> Step 10/11: remote parity snapshot"
npx @railway/cli run npm run parity:snapshot:remote

echo "==> Step 11/11: parity compare (ignore media host drift)"
npm run parity:check:ignore-media

echo "==> Done. Local and Railway snapshots match (ignoring media host differences)."
