#!/bin/bash

# Script để stop Docker containers

set -e

MODE=${1:-prod}

if [ "$MODE" = "dev" ]; then
    echo "🛑 Stopping DEVELOPMENT containers..."
    docker-compose -f docker-compose.dev.yml down
elif [ "$MODE" = "prod" ]; then
    echo "🛑 Stopping PRODUCTION containers..."
    docker-compose down
    echo "✅ Containers stopped"
else
    echo "Usage: ./docker-stop.sh [dev|prod]"
    exit 1
fi
