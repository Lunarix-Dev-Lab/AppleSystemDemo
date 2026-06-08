# Deployment Workflow Summary

## 📋 What Was Created

I've created a complete build-and-deploy workflow for your Apple System Demo project. This allows you to build everything locally and upload pre-built Docker images to your VPS without any building happening on the small VPS.

### Files Added:

1. **build.ps1** - PowerShell script to build Docker images locally
2. **upload-to-vps.ps1** - PowerShell script to upload images to VPS via SCP  
3. **deploy.sh** - Bash script to run on VPS (loads pre-built images, no build)
4. **setup-vps.sh** - Optional VPS setup (installs Docker if needed)
5. **docker-compose.prebuilt.yml** - Docker Compose config for pre-built images
6. **VPS-DEPLOYMENT.md** - Comprehensive deployment guide
7. **QUICK-START.md** - Quick reference guide

---

## 🚀 The Complete Workflow

### Phase 1: Local Build (Windows) - ~10 minutes

```powershell
# Open PowerShell in project root
cd C:\Users\Agustin\Documents\GitHub\AppleSystemDemo

# Build Docker images locally
.\build.ps1

# Optional: with custom tag
.\build.ps1 -ImageTag "v1.0.0"
```

**What happens:**
- Backend Docker image built (~380 MB)
- Frontend Docker image built (~195 MB)
- Both images saved to `./build-artifacts/` as TAR files
- No registry needed, no credentials required

---

### Phase 2: Upload to VPS (Windows/Mac/Linux) - ~5-15 minutes

```powershell
# Run upload script
.\upload-to-vps.ps1

# Follow prompts:
# - Enter VPS hostname/IP (e.g., 192.168.1.100)
# - Enter VPS username (e.g., root or ubuntu)
```

**What gets uploaded:**
- `backend-latest.tar` - Pre-built backend image
- `frontend-latest.tar` - Pre-built frontend image
- `docker-compose.prebuilt.yml` - Production config
- `nginx/` - Nginx configuration
- `.env` - Environment variables (if exists)

**Upload size:** ~550 MB total (compressed in transit)

---

### Phase 3: Deploy on VPS (Linux) - ~2-3 minutes

```bash
# SSH into VPS
ssh username@your-vps-ip

# Navigate to deployment directory
cd /home/username/applesystem

# Make script executable
chmod +x deploy.sh

# Run deployment (NO BUILD - just loads images)
./deploy.sh
```

**What happens:**
- ✅ Docker images loaded from TAR files (instant)
- ✅ PostgreSQL container started
- ✅ Backend service started
- ✅ Frontend service started
- ✅ Nginx reverse proxy started
- ✅ All services set to auto-restart

**Time saved:** 5-10 minutes vs building on VPS

---

## 🏗️ Architecture After Deployment

```
Internet Traffic
        ↓
    Port 80 (HTTP)
        ↓
    ┌─────────────┐
    │   Nginx     │  (Reverse Proxy)
    └─────┬───────┘
          │
    ┌─────┴─────────────────┐
    │                       │
    ↓                       ↓
┌────────────┐      ┌──────────────┐
│ Frontend   │      │  Backend     │
│ Angular    │      │  FastAPI     │
│ :4000      │      │  :8000       │
└────────────┘      └──────┬───────┘
                           │
                    ┌──────▼────────┐
                    │  PostgreSQL   │
                    │  :5432 (int)  │
                    │  (DB Storage) │
                    └───────────────┘
```

---

## ⚙️ Key Configuration

### Environment Variables (.env)

Create/update on VPS before first deployment:

```env
# Database
POSTGRES_DB=sistemaapple
POSTGRES_USER=apple
POSTGRES_PASSWORD=YourSecurePassword123!

# Backend Database URL (auto-configured)
DATABASE_URL=postgresql+asyncpg://apple:YourSecurePassword123!@postgres:5432/sistemaapple
```

### Access Points After Deployment

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `http://your-vps-ip/` | Web application |
| API Swagger | `http://your-vps-ip/api/docs` | Interactive API docs |
| API ReDoc | `http://your-vps-ip/api/redoc` | Alternative API docs |

---

## 📊 Resource Usage Comparison

### With Building on VPS:
- ⚠️ Build time: 5-10 minutes
- ⚠️ Build requires: 2-4 GB RAM, compiler tools
- ⚠️ Disk I/O intensive
- ⚠️ CPU: 100% during build

### With Pre-built Images (Your Setup):
- ✅ Deployment time: 2-3 minutes
- ✅ Just loads images: minimal resource usage
- ✅ Low I/O after initial upload
- ✅ CPU: <5% during startup

---

## 🔄 Deployment Updates

To deploy a new version:

```bash
# On local machine - build with new tag
.\build.ps1 -ImageTag "v1.0.1"

# Upload new images
.\upload-to-vps.ps1

# On VPS - restart with new images
cd /home/username/applesystem
docker-compose -f docker-compose.prebuilt.yml down
./deploy.sh v1.0.1
```

---

## 🛠️ Common Operations

### View Logs
```bash
ssh username@your-vps-ip
cd /home/username/applesystem
docker-compose -f docker-compose.prebuilt.yml logs -f
```

### Stop Services
```bash
docker-compose -f docker-compose.prebuilt.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.prebuilt.yml restart
```

### Run Database Migrations
```bash
docker-compose -f docker-compose.prebuilt.yml exec backend alembic upgrade head
```

### Backup Database
```bash
docker-compose -f docker-compose.prebuilt.yml exec postgres pg_dump -U apple sistemaapple > backup.sql
```

---

## ✅ Pre-Flight Checklist

Before deployment, ensure:

- [ ] Local build completes successfully (`.\build.ps1` succeeds)
- [ ] SSH access to VPS configured (test with `ssh username@vps-ip`)
- [ ] VPS has Docker and Docker Compose installed
- [ ] VPS has at least 1 GB free disk space
- [ ] `.env` file created with secure passwords
- [ ] Port 80 not already in use on VPS

---

## ❓ FAQ

**Q: Can I build on Windows and run on Linux?**  
A: Yes! Docker images are platform-agnostic (contain compiled binaries).

**Q: What if VPS loses power?**  
A: Services auto-restart due to `restart: always` policy.

**Q: Can I have multiple versions?**  
A: Yes, use different image tags: `v1.0.0`, `v1.0.1`, etc.

**Q: How do I rollback to previous version?**  
A: Keep old TAR files, load them, and run deploy.sh again.

**Q: Can I use this for staging?**  
A: Yes! Build locally, upload to staging VPS same way.

**Q: What about SSL/HTTPS?**  
A: Modify nginx.conf for Let's Encrypt or add reverse proxy service.

---

## 📚 Related Files

- **VPS-DEPLOYMENT.md** - Detailed troubleshooting and setup guide
- **QUICK-START.md** - Quick reference for common tasks
- **docker-compose.prebuilt.yml** - Production compose config (uses pre-built images)
- **docker-compose.prod.yml** - Original production config (builds images)

---

## 🎯 Next Steps

1. **Build locally:**
   ```powershell
   .\build.ps1
   ```

2. **Upload to VPS:**
   ```powershell
   .\upload-to-vps.ps1
   ```

3. **Deploy on VPS:**
   ```bash
   ssh username@your-vps-ip
   cd /home/username/applesystem
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Verify deployment:**
   ```
   Visit: http://your-vps-ip/
   ```

That's it! Your application is live! 🎉

---

## 💡 Pro Tips

- Keep backup of TAR files for quick rollbacks
- Monitor VPS disk usage: `df -h`
- Check container health: `docker ps`
- View resource usage: `docker stats`
- Use `IMAGE_TAG=v1.0.0 docker-compose ... up` to run specific versions
- Set up automated backups for PostgreSQL volume

---

*Created: 2026-06-06*  
*Workflow: Build Local → Upload → Deploy*  
*Supports: Zero-build VPS deployment*
