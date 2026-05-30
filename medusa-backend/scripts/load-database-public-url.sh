#!/usr/bin/env bash
# Source from other scripts: `. scripts/load-database-public-url.sh`
# Sets DATABASE_PUBLIC_URL from medusa-backend/.env when not already exported.
set -euo pipefail

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Source this file instead of executing it: . scripts/load-database-public-url.sh"
  exit 1
fi

if [ -n "${DATABASE_PUBLIC_URL:-}" ]; then
  return 0
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  return 0
fi

line="$(grep -E '^[[:space:]]*DATABASE_PUBLIC_URL=' "${ENV_FILE}" | tail -1 || true)"
if [ -z "${line}" ]; then
  return 0
fi

val="${line#DATABASE_PUBLIC_URL=}"
val="${val%\"}"
val="${val#\"}"
val="${val%\'}"
val="${val#\'}"
export DATABASE_PUBLIC_URL="${val}"
