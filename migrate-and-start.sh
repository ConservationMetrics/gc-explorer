#!/bin/bash
set -e

# Fail fast before Node starts — migrations run in the Nitro plugin and need DB env vars.
if [ -z "$NUXT_DB_HOST" ] || [ -z "$NUXT_DB_USER" ] || [ -z "$NUXT_DB_PASSWORD" ]; then
  echo "Missing required database environment variables"
  echo "Required: NUXT_DB_HOST, NUXT_DB_USER, NUXT_DB_PASSWORD"
  echo "NUXT_CONFIG_DATABASE defaults to: guardianconnector"
  exit 1
fi

echo "Starting application..."
exec node .output/server/index.mjs
