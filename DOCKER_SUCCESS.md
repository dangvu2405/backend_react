# ✅ Docker Setup Thành Công!

Backend của bạn đã được containerize và đang chạy trong Docker.

## 📊 Trạng thái Containers

Để xem trạng thái containers:
```bash
make status
# hoặc
docker compose ps
```

## 📋 Xem Logs

### Xem tất cả logs:
```bash
make logs
```

### Xem logs của backend:
```bash
make logs-backend
```

### Xem logs của MongoDB:
```bash
make logs-mongo
```

## 🔍 Kiểm tra API

### Health Check:
```bash
curl http://localhost:3001/api/health
```

### Swagger Documentation:
Mở trình duyệt và truy cập:
```
http://localhost:3001/api/docs
```

## 🛠️ Các lệnh hữu ích

```bash
# Xem trạng thái
make status

# Xem logs
make logs

# Dừng containers
make down

# Restart containers
make restart

# Mở shell trong container backend
make shell

# Mở MongoDB shell
make mongo

# Dọn dẹp (xóa containers và volumes)
make clean
```

## 🐛 Troubleshooting

### Nếu API không phản hồi:

1. **Kiểm tra logs:**
   ```bash
   make logs-backend
   ```

2. **Kiểm tra MongoDB connection:**
   ```bash
   make logs-mongo
   ```

3. **Restart containers:**
   ```bash
   make restart
   ```

### Nếu gặp lỗi permission:

Chạy trong terminal mới (sau khi đã thêm vào docker group):
```bash
newgrp docker
```

Hoặc logout và login lại.

## 📝 Lưu ý

- Containers sẽ tự động restart khi máy khởi động lại (restart: unless-stopped)
- Data MongoDB được lưu trong Docker volume `mongo-data`
- Uploads được mount từ `./uploads` vào container
- Environment variables được đọc từ file `.env`

## 🎉 Chúc mừng!

Backend của bạn đã sẵn sàng để phát triển và deploy!
