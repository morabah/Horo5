#!/usr/bin/env sh
# Run `medusa db:migrate` against Railway Postgres from your laptop (same env swap as medusa-exec-public-db.sh).
set -e

if [ -n "${DATABASE_PUBLIC_URL}" ]; then
  export DATABASE_URL="${DATABASE_PUBLIC_URL}"
fi

unset REDIS_URL CACHE_REDIS_URL

exec medusa db:migrate
