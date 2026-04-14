#!/usr/bin/env sh
# Run `medusa exec` while targeting Railway Postgres from your laptop.
#
# - If DATABASE_PUBLIC_URL is set, DATABASE_URL is set to it (public Postgres URL).
# - REDIS_URL and CACHE_REDIS_URL are unset so medusa-config does not register
#   Redis modules (redis.railway.internal is not reachable from your machine).
#   One-off scripts use in-memory event bus / locking for the process lifetime.
#
# Usage (from medusa-backend/):
#   sh scripts/medusa-exec-public-db.sh ./src/scripts/apply-store-delivery-metadata.ts

set -e

if [ -n "${DATABASE_PUBLIC_URL}" ]; then
  export DATABASE_URL="${DATABASE_PUBLIC_URL}"
fi

unset REDIS_URL CACHE_REDIS_URL

exec medusa exec "$@"
