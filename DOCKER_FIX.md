# 🔧 Sửa lỗi Docker Permission

Nếu gặp lỗi `permission denied while trying to connect to the Docker daemon socket`, làm theo các bước sau:

## Bước 1: Thêm user vào docker group

```bash
sudo usermod -aG docker $USER
```

## Bước 2: Áp dụng thay đổi

**Cách 1: Áp dụng ngay (không cần logout)**
```bash
newgrp docker
```

**Cách 2: Logout và login lại** (khuyến nghị)

## Bước 3: Kiểm tra

```bash
docker --version
docker compose version
groups | grep docker  # Nên thấy "docker" trong danh sách
```

## Bước 4: Chạy lại

```bash
make up
```

## Nếu vẫn lỗi:

```bash
# Kiểm tra Docker service
sudo systemctl status docker

# Start Docker nếu chưa chạy
sudo systemctl start docker
sudo systemctl enable docker

# Kiểm tra quyền socket
ls -la /var/run/docker.sock
```
