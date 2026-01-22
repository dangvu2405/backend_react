# 🔧 Sửa lỗi MongoDB Authentication

## Vấn đề
MongoDB trong Docker yêu cầu authentication nhưng connection string không có username/password.

## Đã sửa
✅ Đã cập nhật `MONGODB_URI` và `MONGODB_TEST_URI` trong `.env` để bao gồm:
- Username: `admin`
- Password: `password`
- AuthSource: `admin`

## Cách áp dụng

### Option 1: Restart containers (nhanh)
```bash
make restart
```

### Option 2: Recreate containers (khuyến nghị nếu vẫn lỗi)
```bash
make down
make up
```

### Option 3: Xóa volume và tạo lại (nếu MongoDB đã được init không có auth)
```bash
make down
docker volume rm backend_react_mongo-data backend_react_mongo-config
make up
```

## Kiểm tra

Sau khi restart, kiểm tra logs:
```bash
make logs-backend
```

Bạn sẽ thấy:
```
✅ Connected to MongoDB successfully!
📊 Database: perfume-shop
```

Thay vì lỗi:
```
Command find requires authentication
```

## Lưu ý

- Username/password mặc định: `admin`/`password`
- Trong production, nên thay đổi password mạnh hơn trong `.env`
- `authSource=admin` là cần thiết vì root user được tạo trong database `admin`
