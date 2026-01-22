.PHONY: help up down build logs dev dev-down restart clean test

# Detect Docker Compose command (V2 uses 'docker compose', V1 uses 'docker-compose')
# Fallback to checking both commands
DOCKER_COMPOSE := $(shell \
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
        echo "docker compose"; \
    elif command -v docker-compose >/dev/null 2>&1; then \
        echo "docker-compose"; \
    else \
        echo ""; \
    fi)

# Check if Docker Compose is available
check-docker:
	@if [ -z "$(DOCKER_COMPOSE)" ]; then \
		echo "❌ Docker Compose không được tìm thấy!"; \
		echo ""; \
		echo "📖 Có 2 cách cài đặt:"; \
		echo ""; \
		echo "1. Tự động (khuyến nghị):"; \
		echo "   ./install-docker.sh"; \
		echo ""; \
		echo "2. Thủ công:"; \
		echo "   cat INSTALL_DOCKER.md"; \
		echo "   hoặc"; \
		echo "   sudo apt-get install -y docker-compose-plugin"; \
		echo ""; \
		echo "⚠️  Sau khi cài đặt, logout và login lại!"; \
		exit 1; \
	fi
	@echo "✅ Using: $(DOCKER_COMPOSE)"

# Default target
help:
	@echo "🐳 Docker Commands for Backend API"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  make up          - Start production containers (detached)"
	@echo "  make down        - Stop production containers"
	@echo "  make build       - Build Docker images"
	@echo "  make logs        - View logs from all containers"
	@echo "  make logs-backend - View logs from backend only"
	@echo "  make logs-mongo  - View logs from MongoDB only"
	@echo "  make dev         - Start development containers"
	@echo "  make dev-down    - Stop development containers"
	@echo "  make restart     - Restart production containers"
	@echo "  make clean       - Stop containers and remove volumes"
	@echo "  make shell       - Open shell in backend container"
	@echo "  make mongo       - Open MongoDB shell"
	@echo "  make test        - Run tests"
	@echo "  make install     - Install dependencies locally"
	@echo "  make install-docker - Install Docker and Docker Compose"
	@echo ""

# Production commands
up: check-docker
	@echo "🚀 Starting production containers..."
	$(DOCKER_COMPOSE) up -d --build
	@echo "✅ Containers started!"
	@echo "📊 View logs: make logs"

down: check-docker
	@echo "🛑 Stopping production containers..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Containers stopped"

build: check-docker
	@echo "🔨 Building Docker images..."
	$(DOCKER_COMPOSE) build --no-cache

logs:
	@echo "📋 Viewing logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f

logs-backend:
	@echo "📋 Viewing backend logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f backend

logs-mongo:
	@echo "📋 Viewing MongoDB logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f mongo

restart:
	@echo "🔄 Restarting containers..."
	$(DOCKER_COMPOSE) restart
	@echo "✅ Containers restarted"

# Development commands
dev: check-docker
	@echo "🔧 Starting development containers..."
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml up --build

dev-down:
	@echo "🛑 Stopping development containers..."
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml down

# Utility commands
shell:
	@echo "🐚 Opening shell in backend container..."
	$(DOCKER_COMPOSE) exec backend sh

mongo:
	@echo "🍃 Opening MongoDB shell..."
	$(DOCKER_COMPOSE) exec mongo mongosh

clean:
	@echo "🧹 Cleaning up containers and volumes..."
	$(DOCKER_COMPOSE) down -v
	@echo "✅ Cleaned up!"

# Install Docker
install-docker:
	@echo "🐳 Installing Docker and Docker Compose..."
	@if [ -f ./install-docker.sh ]; then \
		./install-docker.sh; \
	else \
		echo "❌ install-docker.sh not found!"; \
		echo "📖 Xem hướng dẫn: cat INSTALL_DOCKER.md"; \
	fi

# Local development (without Docker)
install:
	@echo "📦 Installing dependencies..."
	npm install

test:
	@echo "🧪 Running tests..."
	npm test

# Status check
status:
	@echo "📊 Container status:"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "💾 Volume status:"
	@docker volume ls | grep backend || echo "No volumes found"

# Health check
health:
	@echo "🏥 Checking container health..."
	@$(DOCKER_COMPOSE) ps --format json | grep -q '"Health":"healthy"' && echo "✅ All containers healthy" || echo "⚠️  Some containers may not be healthy"
