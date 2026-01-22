# Hướng dẫn cài đặt Docker và Docker Compose

## Kiểm tra Docker

```bash
docker --version
```

Nếu chưa có, cài đặt Docker:

## Cài đặt Docker trên Ubuntu/Debian

### 1. Cài đặt Docker

```bash
# Cập nhật package index
sudo apt-get update

# Cài đặt các package cần thiết
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Thêm Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Thêm user vào docker group (để chạy docker không cần sudo)
sudo usermod -aG docker $USER

# Logout và login lại để áp dụng thay đổi
```

### 2. Kiểm tra cài đặt

```bash
# Kiểm tra Docker
docker --version

# Kiểm tra Docker Compose (V2)
docker compose version

# Test Docker
docker run hello-world
```

## Nếu đã có Docker nhưng chưa có Docker Compose

### Cài Docker Compose V2 (Plugin - Khuyến nghị)

```bash
# Cài đặt Docker Compose plugin
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Kiểm tra
docker compose version
```

### Hoặc cài Docker Compose V1 (Standalone)

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Cấp quyền thực thi
sudo chmod +x /usr/local/bin/docker-compose

# Kiểm tra
docker-compose --version
```

## Sau khi cài đặt

1. **Logout và login lại** để áp dụng group changes
2. **Kiểm tra lại**:
   ```bash
   docker --version
   docker compose version  # hoặc docker-compose --version
   ```

3. **Chạy backend**:
   ```bash
   make up
   ```

## Cài đặt tự động (Script)

Bạn có thể sử dụng script tự động:

```bash
./install-docker.sh
```

Script sẽ:
- Cài đặt Docker Engine
- Cài đặt Docker Compose plugin
- Thêm user vào docker group
- Start Docker service

## Troubleshooting

### Permission denied
```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER
# Logout và login lại
```

Hoặc áp dụng ngay (không cần logout):
```bash
newgrp docker
```

### Docker daemon not running
```bash
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker  # Auto-start on boot
```

### Kiểm tra Docker service
```bash
sudo systemctl status docker
```

### Kiểm tra user có trong docker group
```bash
groups | grep docker
```

Nếu không thấy "docker", thêm lại:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Các lệnh hữu ích

### Xem thông tin Docker
```bash
docker info
docker version
docker compose version
```

### Test Docker
```bash
docker run hello-world
```

### Xem containers đang chạy
```bash
docker ps
docker compose ps
```

### Xem logs
```bash
docker compose logs
docker compose logs backend
```

## Lưu ý

- Sau khi cài đặt, bạn **phải logout và login lại** để áp dụng thay đổi docker group
- Hoặc chạy `newgrp docker` để áp dụng ngay trong terminal hiện tại
- Docker Compose V2 (plugin) được khuyến nghị hơn V1 (standalone)
- Đảm bảo Docker service đang chạy: `sudo systemctl status docker`

## Tài liệu tham khảo

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
