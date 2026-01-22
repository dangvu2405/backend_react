# Docker Setup cho Backend API

## Yêu cầu

- Docker >= 20.10
- Docker Compose >= 2.0

## Cài đặt nhanh

### 1. Development Mode

```bash
# Copy file .env.example thành .env và cấu hình
cp .env.example .env

# Chạy với docker-compose dev
docker-compose -f docker-compose.dev.yml up --build

# Hoặc chạy ở background
docker-compose -f docker-compose.dev.yml up -d --build
```

### 2. Production Mode

```bash
# Copy file .env.example thành .env và cấu hình
cp .env.example .env

# Build và chạy
docker-compose up --build -d

# Xem logs
docker-compose logs -f backend

# Dừng services
docker-compose down

# Dừng và xóa volumes
docker-compose down -v
```

## Các lệnh hữu ích

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ MongoDB
docker-compose logs -f mongo
```

### Restart services
```bash
# Restart tất cả
docker-compose restart

# Restart chỉ backend
docker-compose restart backend
```

### Vào container
```bash
# Vào container backend
docker-compose exec backend sh

# Vào MongoDB shell
docker-compose exec mongo mongosh
```

### Xem status
```bash
# Xem trạng thái các containers
docker-compose ps

# Xem health check
docker-compose ps --format json | jq '.[] | {name: .Name, health: .Health}'
```

## Build image riêng

```bash
# Build image
docker build -t backend-api:latest .

# Chạy container từ image
docker run -d \
  --name backend-api \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  backend-api:latest
```

## Environment Variables

Tất cả các biến môi trường cần được cấu hình trong file `.env`. Xem `.env.example` để biết danh sách đầy đủ.

## Volumes

- `mongo-data`: Lưu trữ dữ liệu MongoDB
- `./uploads`: Thư mục uploads (được mount từ host)

## Networks

Tất cả services được kết nối qua network `backend-network` để có thể giao tiếp với nhau.

## Health Checks

- Backend: `GET /api/health` mỗi 30 giây
- MongoDB: `mongosh ping` mỗi 10 giây

## Troubleshooting

### Container không start
```bash
# Xem logs chi tiết
docker-compose logs backend

# Kiểm tra health check
docker inspect backend-api | grep -A 10 Health
```

### MongoDB connection error
```bash
# Kiểm tra MongoDB đã sẵn sàng chưa
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Kiểm tra network
docker network inspect backend_backend-network
```

### Port đã được sử dụng
```bash
# Thay đổi port trong docker-compose.yml hoặc .env
PORT=3002
```

### Permission issues với uploads
```bash
# Fix permissions
sudo chown -R $USER:$USER uploads
chmod -R 755 uploads
```
