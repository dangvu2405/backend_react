#!/bin/bash

# Script tự động cài đặt Docker và Docker Compose

set -e

echo "🐳 Docker Installation Script"
echo "=============================="
echo ""

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Script này cần quyền sudo"
    echo "Đang chạy với sudo..."
    exec sudo bash "$0" "$@"
fi

# Kiểm tra OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "❌ Không thể xác định hệ điều hành"
    exit 1
fi

echo "📦 Detected OS: $OS $VER"
echo ""

# Cài đặt Docker
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker đã được cài đặt: $(docker --version)"
else
    echo "📥 Installing Docker..."
    
    # Cập nhật package index
    apt-get update
    
    # Cài đặt các package cần thiết
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Thêm Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Setup repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Cài đặt Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    echo "✅ Docker đã được cài đặt!"
fi

# Cài đặt Docker Compose (nếu chưa có)
if docker compose version >/dev/null 2>&1; then
    echo "✅ Docker Compose V2 đã được cài đặt: $(docker compose version)"
elif command -v docker-compose >/dev/null 2>&1; then
    echo "✅ Docker Compose V1 đã được cài đặt: $(docker-compose --version)"
else
    echo "📥 Docker Compose plugin đã được cài cùng Docker Engine"
fi

# Thêm user vào docker group
CURRENT_USER=${SUDO_USER:-$USER}
if [ -n "$CURRENT_USER" ] && [ "$CURRENT_USER" != "root" ]; then
    echo ""
    echo "👤 Adding user '$CURRENT_USER' to docker group..."
    usermod -aG docker "$CURRENT_USER"
    echo "✅ User '$CURRENT_USER' đã được thêm vào docker group"
    echo "⚠️  Bạn cần logout và login lại để áp dụng thay đổi"
fi

# Start và enable Docker service
echo ""
echo "🔄 Starting Docker service..."
systemctl start docker
systemctl enable docker

echo ""
echo "✅ Cài đặt hoàn tất!"
echo ""
echo "📋 Kiểm tra cài đặt:"
echo "   docker --version"
echo "   docker compose version"
echo ""
echo "⚠️  QUAN TRỌNG: Bạn cần logout và login lại để sử dụng Docker không cần sudo"
echo ""
echo "🚀 Sau đó chạy: make up"
