#!/bin/bash

# Script to run Docker tests locally
# Make sure to update env.local-docker-tests with your actual values first

set -e

echo "🚀 Starting local Docker tests..."

# Check if environment file exists
if [ ! -f ".env.local.docker-tests" ]; then
    echo "❌ Error: env.local-docker-tests file not found!"
    echo "Please create this file with your environment variables first."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.local.docker-tests" ]; then
    echo "❌ Error: .env.local.docker-tests file not found!"
    echo "Please create this file with your environment variables first."
    exit 1
fi
# Load environment variables into the shell
set -a
source .env.local.docker-tests
set +a
# Check if required environment variables are set in the file
echo "📋 Checking environment variables..."
required_vars=("NUXT_PUBLIC_APP_API_KEY" "NUXT_SESSION_SECRET" "MAPBOX_ACCESS_TOKEN" "MEDIA_BASE_PATH" "PLANET_API_KEY")
for var in "${required_vars[@]}"; do
    value=$(grep "^${var}=" .env.local.docker-tests | cut -d'=' -f2)
    if [ -z "$value" ] || [ "$value" = "your_$(echo $var | tr '[:upper:]' '[:lower:]')_here" ]; then
        echo "❌ Error: $var is not set or still has placeholder value!"
        echo "Please update .env.local.docker-tests with your actual values."
        exit 1
    fi
done

echo "✅ Environment variables look good"
if [ -z "$ImgTag" ]; then
     echo "❌ ImgTag is not set! Please set ImgTag in your .env.local.docker-tests file."
     exit 1
   fi

echo "🔨 Building Docker image locally..."
  docker build -t communityfirst/guardianconnector-explorer:local .

# Build and start the services
echo "🐳 Starting Docker services..."
docker compose -f docker-compose.tests.yml --env-file .env.local.docker-tests up --build -d database backend

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker compose -f docker-compose.tests.yml ps

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
timeout 60 bash -c 'until curl -f http://localhost:8080; do sleep 2; done'
echo "✅ Backend is ready!"

# Show logs
echo "📋 Recent logs from backend:"
docker compose -f docker-compose.tests.yml logs --tail=20 backend

echo "📋 Recent logs from database:"
docker compose -f docker-compose.tests.yml logs --tail=20 database

echo "🎯 Services are ready for testing!"
echo "You can now run your tests or inspect the services."
echo ""
echo "📋 To view logs:"
echo "  Backend logs: docker compose -f docker-compose.tests.yml logs -f backend"
echo "  Database logs: docker compose -f docker-compose.tests.yml logs -f database"
echo "  All logs: docker compose -f docker-compose.tests.yml logs -f"
echo ""
echo "🛑 To stop the services, run:"
echo "docker compose -f docker-compose.tests.yml down" 