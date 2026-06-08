# 🚀 Quick Start - Build & Deploy to VPS

This is a quick reference. See `VPS-DEPLOYMENT.md` for detailed guide.

## TL;DR - 3 Commands to Deploy

### On Your Local Machine (Windows):

```powershell
# Step 1: Build Docker images locally
.\build.ps1

# Step 2: Upload to VPS (enter your VPS details when prompted)
.\upload-to-vps.ps1
```

### On Your VPS Server (Linux):

```bash
# Step 3: Deploy (run only once)
cd /home/username/applesystem
chmod +x deploy.sh
./deploy.sh
```

## That's it! 🎉

Your application should now be live at:
- **Frontend**: `http://your-vps-ip/`
- **API Docs**: `http://your-vps-ip/api/docs`

---

## Key Benefits of This Approach

✅ **Fast** - No building on resource-limited VPS (5-10 min saved)  
✅ **Reliable** - Build tested on local machine before deployment  
✅ **Simple** - Just load pre-built images and run  
✅ **Offline** - Upload once, deploy multiple times  

---

## Files Created for You

| File | Purpose |
|------|---------|
| `build.ps1` | Builds Docker images locally |
| `upload-to-vps.ps1` | Transfers images to VPS via SCP |
| `deploy.sh` | Loads images and starts services on VPS |
| `docker-compose.prebuilt.yml` | Production config (uses pre-built images) |
| `VPS-DEPLOYMENT.md` | Comprehensive deployment guide |

---

## Common Commands

```bash
# SSH into VPS
ssh username@your-vps-ip
cd /home/username/applesystem

# View logs
docker-compose -f docker-compose.prebuilt.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prebuilt.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.prebuilt.yml down

# Restart services
docker-compose -f docker-compose.prebuilt.yml restart

# Check service status
docker-compose -f docker-compose.prebuilt.yml ps

# Access backend container
docker-compose -f docker-compose.prebuilt.yml exec backend bash

# Run database migrations
docker-compose -f docker-compose.prebuilt.yml exec backend alembic upgrade head
```

---

## Troubleshooting

**Images won't start?**
```bash
# Verify images loaded
docker images

# Verify containers running
docker ps -a

# Check logs
docker-compose -f docker-compose.prebuilt.yml logs
```

**Can't connect to VPS upload?**
```bash
# Test SSH connection
ssh -v username@your-vps-ip

# Ensure SSH key configured or password available
# For key-based auth, add key to VPS authorized_keys
```

**Port 80 already in use?**
```bash
# Check what's using port 80
sudo lsof -i :80

# Modify docker-compose.prebuilt.yml:
# Change: "80:80" to "8080:80"
# Then restart: docker-compose -f docker-compose.prebuilt.yml restart nginx
```

---

## Next Steps

1. ✅ Run `.\build.ps1` on your local machine
2. ✅ Run `.\upload-to-vps.ps1` and follow prompts
3. ✅ SSH into VPS and run `./deploy.sh`
4. ✅ Access application at `http://your-vps-ip`
5. ✅ Edit `.env` on VPS with secure passwords
6. ✅ View `VPS-DEPLOYMENT.md` for production setup

Enjoy! 🎊
