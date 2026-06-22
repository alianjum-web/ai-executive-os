#!/usr/bin/env bash
# Apply Supabase SQL migrations to the database in ENV_FILE (default: .env.dev).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-.env.dev}"
ENV_PATH="$ROOT/$ENV_FILE"

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Missing env file: $ENV_PATH" >&2
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  echo "  npm install -g supabase   OR   npx supabase --version" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_PATH"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set in $ENV_FILE" >&2
  exit 1
fi

DB_URL="${DATABASE_URL/postgresql+asyncpg/postgresql}"

echo "Applying Supabase migrations → $(echo "$DB_URL" | sed -E 's#(://[^:]+:)[^@]+#\1***#')"
cd "$ROOT/.."
supabase db push --db-url "$DB_URL"
