#!/bin/bash

# Script to run Docker-backed Playwright tests locally.
# Make sure to update .env.test.compose with your actual values first.

set -e

ENV_FILE="${ENV_FILE:-.env.test.compose}"
BUILD_IMAGE=true
RUN_TESTS=true
PLAYWRIGHT_HEADLESS_VALUE=true
TEST_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --headed)
            PLAYWRIGHT_HEADLESS_VALUE=false
            shift
            ;;
        --headless)
            PLAYWRIGHT_HEADLESS_VALUE=true
            shift
            ;;
        --no-build)
            BUILD_IMAGE=false
            shift
            ;;
        --no-test)
            RUN_TESTS=false
            shift
            ;;
        --)
            shift
            TEST_ARGS+=("$@")
            break
            ;;
        *)
            TEST_ARGS+=("$1")
            shift
            ;;
    esac
done

echo "🚀 Starting local Docker tests..."

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE file not found!"
    echo "Please create this file with your environment variables first."
    exit 1
fi

# Load environment variables into the shell
set -a
source "$ENV_FILE"
set +a

: "${NUXT_PUBLIC_AUTH_STRATEGY:=auth0}"

# Check if required environment variables are set in the file
echo "📋 Checking environment variables..."
required_vars=(
    "NUXT_SESSION_SECRET"
    "MAPBOX_ACCESS_TOKEN"
    "NUXT_OAUTH_AUTH0_DOMAIN"
    "NUXT_OAUTH_AUTH0_CLIENT_ID"
    "NUXT_OAUTH_AUTH0_CLIENT_SECRET"
    "E2E_AUTH0_SIGNEDIN_PASSWORD"
    "E2E_AUTH0_GUEST_PASSWORD"
    "E2E_AUTH0_MEMBER_PASSWORD"
    "E2E_AUTH0_ADMIN_PASSWORD"
)
for var in "${required_vars[@]}"; do
    value="${!var:-}"
    if [ -z "$value" ] || [ "$value" = "your_$(echo $var | tr '[:upper:]' '[:lower:]')_here" ]; then
        echo "❌ Error: $var is not set or still has placeholder value!"
        echo "Please update $ENV_FILE with your actual values."
        exit 1
    fi
done

echo "✅ Environment variables look good"
if [ -z "${ImgTag:-}" ]; then
     echo "❌ ImgTag is not set! Please set ImgTag in your $ENV_FILE file."
     exit 1
fi

if [ "$BUILD_IMAGE" = true ]; then
    echo "🔨 Building Docker image locally..."
    docker build -t communityfirst/guardianconnector-explorer:local .
fi

# Build and start the services
echo "🐳 Starting Docker services..."
docker compose -f docker-compose.tests.yml --env-file "$ENV_FILE" up -d database backend

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f docker-compose.tests.yml --env-file "$ENV_FILE" ps

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
timeout 60 bash -c 'until curl -fsS http://localhost:8080 >/dev/null; do sleep 2; done'
echo "✅ Backend is ready!"

# Show logs
echo "📋 Recent logs from backend:"
docker compose -f docker-compose.tests.yml --env-file "$ENV_FILE" logs --tail=20 backend

echo "📋 Recent logs from database:"
docker compose -f docker-compose.tests.yml --env-file "$ENV_FILE" logs --tail=20 database

echo "🎯 Services are ready for testing!"
if [ "$RUN_TESTS" = true ]; then
    echo "🎭 Running Playwright tests..."
    export CI=true
    export PLAYWRIGHT_HEADLESS="$PLAYWRIGHT_HEADLESS_VALUE"
    if [ ${#TEST_ARGS[@]} -eq 0 ]; then
        pnpm exec playwright test --project=chromium
    else
        pnpm exec playwright test --project=chromium "${TEST_ARGS[@]}"
    fi
else
    echo "You can now run your tests or inspect the services."
fi
echo ""
echo "📋 To view logs:"
echo "  Backend logs: docker compose -f docker-compose.tests.yml logs -f backend"
echo "  Database logs: docker compose -f docker-compose.tests.yml logs -f database"
echo "  All logs: docker compose -f docker-compose.tests.yml logs -f"
echo ""
echo "🛑 To stop the services, run:"
echo "docker compose -f docker-compose.tests.yml --env-file $ENV_FILE down" 