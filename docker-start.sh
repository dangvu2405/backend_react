#!/bin/bash

# Script để start Docker containers

set -e

echo "🐳 Starting Docker containers..."

# Kiểm tra xem .env có tồn tại không
if [ ! -f .env ]; then
    echo "⚠️  File .env không tồn tại. Đang tạo từ .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Đã tạo file .env từ .env.example"
        echo "📝 Vui lòng cập nhật các giá trị trong file .env trước khi tiếp tục"
        exit 1
    else
        echo "❌ Không tìm thấy .env.example"
        exit 1
    fi
fi

# Kiểm tra mode
MODE=${1:-prod}

if [ "$MODE" = "dev" ]; then
    echo "🔧 Starting in DEVELOPMENT mode..."
    docker-compose -f docker-compose.dev.yml up --build
elif [ "$MODE" = "prod" ]; then
    echo "🚀 Starting in PRODUCTION mode..."
    docker-compose up --build -d
    echo "✅ Containers started in background"
    echo "📊 View logs: docker-compose logs -f"
else
    echo "Usage: ./docker-start.sh [dev|prod]"
    exit 1
fi
