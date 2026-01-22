#!/bin/bash

# Script để khởi động MongoDB và chạy seed

set -e

echo "🌱 Seed Database Script"
echo "========================"
echo ""

# Kiểm tra Docker có đang chạy không
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt"
    echo "   Vui lòng cài đặt Docker hoặc MongoDB local"
    exit 1
fi

# Kiểm tra MongoDB container có đang chạy không
MONGO_CONTAINERS=$(docker ps --filter "name=mongo" --format "{{.Names}}" 2>/dev/null || echo "")
MONGO_RUNNING=$(echo "$MONGO_CONTAINERS" | grep -c mongo 2>/dev/null || echo "0")

# Convert to integer for comparison
if [ -z "$MONGO_RUNNING" ] || [ "$MONGO_RUNNING" = "0" ] || [ "$MONGO_RUNNING" -eq 0 ] 2>/dev/null; then
    echo "🔄 MongoDB chưa chạy. Đang khởi động MongoDB container..."
    
    # Thử khởi động MongoDB từ docker-compose
    if [ -f "docker-compose.yml" ]; then
        # Detect docker compose command
        if docker compose version &> /dev/null; then
            DOCKER_COMPOSE_CMD="docker compose"
        else
            DOCKER_COMPOSE_CMD="docker-compose"
        fi
        
        $DOCKER_COMPOSE_CMD up -d mongo
        echo "⏳ Đợi MongoDB khởi động (5 giây)..."
        sleep 5
    else
        echo "❌ Không tìm thấy docker-compose.yml"
        echo "   Vui lòng khởi động MongoDB thủ công hoặc cài đặt MongoDB local"
        exit 1
    fi
else
    echo "✅ MongoDB đang chạy"
fi

# Kiểm tra lại MongoDB đã sẵn sàng chưa
echo "🔍 Kiểm tra MongoDB đã sẵn sàng..."

# Tìm MongoDB container (có thể là backend-mongo hoặc tên khác)
MONGO_CONTAINER=$(docker ps --filter "name=mongo" --format "{{.Names}}" 2>/dev/null | head -n1)

# Nếu không tìm thấy, thử tìm container có chứa "mongo" trong tên
if [ -z "$MONGO_CONTAINER" ]; then
    MONGO_CONTAINER=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -i mongo | head -n1)
fi

# Nếu vẫn không tìm thấy, thử tìm stopped container và start lại
if [ -z "$MONGO_CONTAINER" ]; then
    STOPPED_MONGO=$(docker ps -a --filter "name=mongo" --format "{{.Names}}" 2>/dev/null | head -n1)
    if [ -n "$STOPPED_MONGO" ]; then
        echo "🔄 Tìm thấy MongoDB container đã dừng: $STOPPED_MONGO"
        echo "   Đang khởi động lại..."
        docker start "$STOPPED_MONGO" 2>/dev/null
        sleep 3
        MONGO_CONTAINER="$STOPPED_MONGO"
    fi
fi

if [ -z "$MONGO_CONTAINER" ]; then
    echo "❌ Không tìm thấy MongoDB container"
    echo "   Đang thử khởi động từ docker-compose..."
    if [ -f "docker-compose.yml" ]; then
        if docker compose version &> /dev/null; then
            docker compose up -d mongo
        else
            docker-compose up -d mongo
        fi
        sleep 5
        MONGO_CONTAINER=$(docker ps --filter "name=mongo" --format "{{.Names}}" 2>/dev/null | head -n1)
    fi
    
    if [ -z "$MONGO_CONTAINER" ]; then
        echo "❌ Không thể tìm hoặc khởi động MongoDB container"
        echo "   Vui lòng chạy: docker-compose up -d mongo"
        exit 1
    fi
fi

echo "📦 MongoDB container: $MONGO_CONTAINER"

for i in {1..10}; do
    if docker exec "$MONGO_CONTAINER" mongosh --quiet --eval "db.adminCommand('ping')" &> /dev/null 2>&1; then
        echo "✅ MongoDB đã sẵn sàng"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  MongoDB có thể chưa sẵn sàng, nhưng sẽ thử seed anyway..."
    else
        echo "   Đợi... ($i/10)"
        sleep 1
    fi
done

# Chạy seed script
echo ""
echo "🌱 Đang chạy seed script..."
echo ""
npm run seed
