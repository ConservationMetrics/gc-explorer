#!/bin/bash

# Exit on any error
set -e

echo "Starting migration and application startup..."

# Debug: Show what environment variables we have
echo "Debug - Environment variables:"
echo "NUXT_DB_HOST: ${NUXT_DB_HOST:-'NOT SET'}"
echo "NUXT_DB_USER: ${NUXT_DB_USER:-'NOT SET'}"
echo "NUXT_DB_PASSWORD: ${NUXT_DB_PASSWORD:-'NOT SET'}"
echo "NUXT_CONFIG_DATABASE: ${NUXT_CONFIG_DATABASE:-'NOT SET'}"

# Set default config database if not provided
export NUXT_CONFIG_DATABASE=${NUXT_CONFIG_DATABASE:-guardianconnector}

# Check if we have the required environment variables
if [ -z "$NUXT_DB_HOST" ] || [ -z "$NUXT_DB_USER" ] || [ -z "$NUXT_DB_PASSWORD" ]; then
    echo "Missing required database environment variables"
    echo "Required: NUXT_DB_HOST, NUXT_DB_USER, NUXT_DB_PASSWORD"
    echo "NUXT_CONFIG_DATABASE defaults to: guardianconnector"
    exit 1
fi

echo "Running database migrations..."

# Run migrations for the config database (guardianconnector)
echo "Running migrations for config database: $NUXT_CONFIG_DATABASE"
pnpm db:migrate

echo "Migrations completed successfully"

# Start the application
echo "Starting application..."
exec node .output/server/index.mjs
