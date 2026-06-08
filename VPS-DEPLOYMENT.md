# VPS Deployment Guide - Apple System Demo

This guide explains how to build the project locally and deploy pre-built images to your VPS without requiring build resources on the VPS.

## Overview

```
Local Machine (Windows)     →     VPS (Linux)
├── Build Backend            ├── Load Backend Image
├── Build Frontend           ├── Load Frontend Image
├── Save as TAR files        ├── Run docker-compose
└── Upload via SCP           └── Services Online
```

## Prerequisites

**Local Machine:**
- Docker installed and running
- PowerShell (Windows)
- `scp` and `ssh` commands (or use Git Bash)

**VPS Server:**
- Docker installed
- Docker Compose installed
- SSH access configured
- At least 1GB available disk space for images

---

## Step 1: Build Locally (Windows)

Run the build script to create Docker images and save them as tar files:

```powershell
# Open PowerShell in your project root
cd C:\Users\Agustin\Documents\GitHub\AppleSystemDemo

# Run the build script
.\build.ps1

# Optional: specify custom tag
.\build.ps1 -ImageTag "v1.0.0"
```

**What happens:**
- ✅ Backend Docker image is built (~400MB)
- ✅ Frontend Docker image is built (~200MB)
- ✅ Images saved to `./build-artifacts/` directory as `.tar` files
- ✅ No images pushed to registry

**Output:**
```
✨ Build complete! Ready for upload to VPS
📊 Build Summary:
  Backend:  380.45 MB
  Frontend: 195.32 MB
  Total:    575.77 MB
```

---

## Step 2: Upload to VPS

Run the upload script to transfer pre-built images:

```powershell
.\upload-to-vps.ps1
```

When prompted, enter:
- **VPS hostname/IP**: e.g., `192.168.1.100` or `your-domain.com`
- **VPS username**: e.g., `root` or `ubuntu`

**What happens:**
- ✅ Creates remote directory `/home/username/applesystem/`
- ✅ Uploads `backend-*.tar` and `frontend-*.tar` files via SCP
- ✅ Uploads `docker-compose.prod.yml` and nginx config
- ✅ Uploads `.env` file (if it exists)

**Typical upload size:** 500-600 MB (fast on most connections)

---

## Step 3: Deploy on VPS

SSH into your VPS and run the deployment script:

```bash
# Connect to VPS
ssh username@your-vps-ip

# Navigate to deployment directory
cd /home/username/applesystem

# Make deployment script executable
chmod +x deploy.sh

# Run deployment (NO BUILD - only loads pre-built images)
./deploy.sh
```

**What happens:**
- ✅ Loads backend and frontend images from tar files into Docker
- ✅ Checks for `.env` configuration file
- ✅ Starts PostgreSQL container
- ✅ Starts backend service
- ✅ Starts frontend service
- ✅ Starts nginx reverse proxy
- ✅ All services run with `restart: always`

---

## Step 4: Verify Deployment

```bash
# Check running services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API
curl http://your-vps-ip/api/docs
```

---

## Environment Configuration

Before deploying, ensure `.env` is properly configured on VPS:

```bash
# SSH into VPS
ssh username@your-vps-ip

# Edit configuration
cd /home/username/applesystem
nano .env
```

**Required variables:**
```env
# Database
POSTGRES_DB=sistemaapple
POSTGRES_USER=apple
POSTGRES_PASSWORD=<secure_password>  # Change this!

# Backend
DATABASE_URL=postgresql+asyncpg://apple:<password>@postgres:5432/sistemaapple
SECRET_KEY=<random_secret_key>       # Change this!
```

---

## Post-Deployment

### Access Your Application

| Service | URL |
|---------|-----|
| Frontend | `http://your-vps-ip/` |
| API Docs | `http://your-vps-ip/api/docs` |
| API Redoc | `http://your-vps-ip/api/redoc` |

### Database Migrations

```bash
# SSH into VPS backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Exit container
exit
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services

```bash
docker-compose -f docker-compose.prod.yml restart
```

---

## Troubleshooting

### Images won't load
```bash
# Verify tar files exist
ls -lh *.tar

# Try loading manually
docker load -i backend-latest.tar
docker load -i frontend-latest.tar

# Verify images loaded
docker images
```

### Port conflicts
```bash
# Check what's using port 80
sudo lsof -i :80

# Modify docker-compose.prod.yml if needed
# Change: "80:80" to "8080:80"
```

### Database connection errors
```bash
# Verify DATABASE_URL in .env matches docker-compose
# Format: postgresql+asyncpg://user:password@postgres:5432/dbname

# Test connection
docker-compose exec backend python -c "import app.core.database; print('OK')"
```

### Disk space issues
```bash
# Clean up old images
docker image prune -a

# Check disk usage
df -h
```

---

## Updating Deployment

To deploy a new version:

1. **Build locally** with new tag:
   ```powershell
   .\build.ps1 -ImageTag "v1.0.1"
   ```

2. **Upload new images**:
   ```powershell
   .\upload-to-vps.ps1
   ```
   (Will be prompted for tag)

3. **On VPS, stop and restart**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ./deploy.sh v1.0.1
   ```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    nginx:80                      │
│          (Reverse Proxy / Load Balancer)         │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌────▼───┐
│Frontend │          │Backend  │
│:4000   │          │:8000    │
└───┬────┘          └────┬───┘
    │                     │
    └──────────┬──────────┘
               │
          ┌────▼───────┐
          │ PostgreSQL  │
          │ :5432       │
          │ (Internal)  │
          └─────────────┘
```

---

## Security Notes

- 🔒 Change all default passwords in `.env`
- 🔒 Use `restart: always` to auto-recover from crashes
- 🔒 Keep database port (5432) internal only
- 🔒 Only expose nginx (port 80) publicly
- 🔒 Consider setting up SSL/TLS with Let's Encrypt
- 🔒 Regularly backup PostgreSQL data volume

---

## VPS Resource Requirements

| Component | Min | Recommended |
|-----------|-----|-------------|
| CPU | 1 core | 2 cores |
| RAM | 1 GB | 2 GB |
| Disk | 2 GB | 10 GB |
| Bandwidth | 50 Mbps | 100 Mbps |

The pre-built image approach **saves ~5-10 minutes** of build time on VPS and doesn't require build tools!

---

## Support

For issues:
1. Check VPS logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify `.env` configuration
3. Ensure ports 80 isn't in use: `sudo lsof -i :80`
4. Check Docker and Docker Compose versions: `docker --version`
