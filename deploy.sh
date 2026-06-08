#!/bin/bash
# Deployment script for VPS - run this after uploading artifacts
# No build happens here - only loads pre-built images and starts services

set -e

IMAGE_TAG="${1:-latest}"
APPDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Apple System - VPS Deployment"
echo "=================================="
echo "Working directory: $APPDIR"
echo "Image tag: $IMAGE_TAG"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Load Docker images from tar files
echo "📦 Loading Docker images..."
if [ -f "$APPDIR/backend-$IMAGE_TAG.tar" ]; then
    echo "  Loading backend..."
    docker load -i "$APPDIR/backend-$IMAGE_TAG.tar"
else
    echo "  ⚠️  backend-$IMAGE_TAG.tar not found"
fi

if [ -f "$APPDIR/frontend-$IMAGE_TAG.tar" ]; then
    echo "  Loading frontend..."
    docker load -i "$APPDIR/frontend-$IMAGE_TAG.tar"
else
    echo "  ⚠️  frontend-$IMAGE_TAG.tar not found"
fi

echo "✅ Images loaded"
echo ""

# Check for .env file
if [ ! -f "$APPDIR/.env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > "$APPDIR/.env" <<EOF
# Database Configuration
POSTGRES_DB=sistemaapple
POSTGRES_USER=apple
POSTGRES_PASSWORD=change_me_to_secure_password

# Backend
DATABASE_URL=postgresql+asyncpg://apple:change_me_to_secure_password@postgres:5432/sistemaapple

# API Configuration
SECRET_KEY=change_me_to_a_random_secret_key
EOF
    echo "⚠️  Created .env template - PLEASE EDIT WITH SECURE PASSWORDS!"
    echo "   Run: nano .env"
    exit 1
fi

echo "✅ Configuration file found"
echo ""

# Prepare docker-compose for production
echo "🔧 Starting services with docker-compose..."
docker-compose -f docker-compose.prebuilt.yml up -d

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prebuilt.yml ps
echo ""
echo "🌐 Services running:"
echo "   Frontend:  http://$(hostname -I | awk '{print $1}'):80"
echo "   API Docs:  http://$(hostname -I | awk '{print $1}'):80/api/docs"
echo ""
echo "📝 Logs:"
echo "   docker-compose -f docker-compose.prebuilt.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.prebuilt.yml down"
