# Docker Setup Guide - Maidenov Passwords Frontend

This document explains how to run the React/Vite frontend in Docker containers.

## 📋 What Was Created

### New Files:
- ✅ `Dockerfile` - Multi-stage build for dev and prod
- ✅ `.dockerignore` - Excludes unnecessary files from Docker build
- ✅ `nginx.conf` - Nginx configuration for production mode
- ✅ Updated `vite.config.js` - Docker-compatible configuration

### Updated Files:
- ✅ `/var/www/drupal/docker-compose.yml` - Added frontend services

---

## 🚀 Quick Start

### Development Mode (Recommended for Development)

```bash
cd /var/www/drupal

# Start ALL services including frontend-dev
docker-compose up -d

# Or start ONLY frontend-dev (backend must be running)
docker-compose up -d frontend-dev
```

**Access the app:** http://localhost:5173

**Features:**
- ✅ Hot Module Replacement (HMR) - instant code updates
- ✅ Source code mounted as volume - edit on host, see changes immediately
- ✅ React DevTools support
- ✅ Full debugging capabilities

---

### Production Mode (Optimized Build)

```bash
cd /var/www/drupal

# Build and start production frontend
docker-compose --profile production up -d frontend-prod
```

**Access the app:** http://localhost:5174

**Features:**
- ✅ Optimized, minified bundle
- ✅ Served by Nginx (fast and efficient)
- ✅ Gzip compression enabled
- ✅ Production-ready performance
- ✅ Smaller image size

---

## 📦 Available Commands

### View Logs
```bash
# Frontend development logs
docker-compose logs -f frontend-dev

# Frontend production logs
docker-compose logs -f frontend-prod

# All services logs
docker-compose logs -f
```

### Rebuild Containers
```bash
# Rebuild frontend-dev after dependency changes
docker-compose build frontend-dev

# Rebuild frontend-prod
docker-compose build frontend-prod

# Force rebuild (no cache)
docker-compose build --no-cache frontend-dev
```

### Stop Services
```bash
# Stop frontend-dev
docker-compose stop frontend-dev

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data!)
docker-compose down -v
```

### Restart Services
```bash
# Restart frontend-dev
docker-compose restart frontend-dev

# Restart all services
docker-compose restart
```

### Execute Commands Inside Container
```bash
# Open shell in frontend-dev container
docker-compose exec frontend-dev sh

# Run npm commands
docker-compose exec frontend-dev npm install <package-name>
docker-compose exec frontend-dev npm run build
docker-compose exec frontend-dev npm test
```

---

## 🏗️ Architecture

### Service Connectivity
```
┌─────────────────┐
│   Browser       │
│ localhost:5173  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐      ┌─────────────────┐
│  frontend-dev       │─────▶│   drupal:80     │
│  (Vite Dev Server)  │      │   (Backend)     │
│  Port: 5173         │      └────────┬────────┘
└─────────────────────┘               │
                                      ▼
                             ┌─────────────────┐
                             │  db (Postgres)  │
                             └─────────────────┘
```

### Docker Network
- All services are on the same Docker network
- Frontend accesses backend via service name: `http://drupal:80`
- No need for localhost or port 8080 inside Docker

---

## 🔧 Configuration Details

### Environment Variables

**Development Mode:**
- `NODE_ENV=development`
- `VITE_BACKEND_URL=http://drupal:80` (uses Docker service name)

**Production Mode:**
- `NODE_ENV=production`

### Port Mappings

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| frontend-dev | 5173 | 5173 | http://localhost:5173 |
| frontend-prod | 80 | 5174 | http://localhost:5174 |
| drupal | 80 | 8080 | http://localhost:8080 |
| adminer | 8080 | 8081 | http://localhost:8081 |

### Volume Mounts (Development Only)

```yaml
volumes:
  - /var/www/maidenov-passwords:/app  # Source code
  - /app/node_modules                  # Exclude node_modules
```

This allows you to:
- Edit code on your host machine
- See changes instantly in the container (HMR)
- Use your favorite IDE/editor

---

## 🐛 Troubleshooting

### Issue: Hot reload not working

**Solution:**
```bash
# Restart the frontend container
docker-compose restart frontend-dev

# If still not working, rebuild
docker-compose build --no-cache frontend-dev
docker-compose up -d frontend-dev
```

### Issue: Cannot connect to backend API

**Check:**
1. Backend is running: `docker-compose ps`
2. Backend logs: `docker-compose logs drupal`
3. Network connectivity: `docker-compose exec frontend-dev ping drupal`

### Issue: Port already in use

**Solution:**
```bash
# Check what's using port 5173
sudo lsof -i :5173

# Stop the process or change port in docker-compose.yml
# For example: "5175:5173"
```

### Issue: Permission denied errors

**Solution:**
```bash
# Fix permissions on mounted volumes
sudo chown -R $USER:$USER /var/www/maidenov-passwords

# Restart containers
docker-compose restart frontend-dev
```

### Issue: Changes not reflecting

**Solution:**
```bash
# Clear browser cache and hard reload (Ctrl+Shift+R)

# If still not working, check file watcher:
docker-compose exec frontend-dev sh
# Inside container:
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase on host:
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 🔄 Switching Between Dev and Prod

### From Development to Production:
```bash
# Stop dev
docker-compose stop frontend-dev

# Start prod
docker-compose --profile production up -d frontend-prod
```

### From Production to Development:
```bash
# Stop prod
docker-compose stop frontend-prod

# Start dev
docker-compose up -d frontend-dev
```

---

## 📊 Performance Tips

### Development Mode:
- Use for daily development
- Hot reload for instant feedback
- Source maps for debugging

### Production Mode:
- Use for testing production builds
- Faster page loads
- Smaller bundle size
- Test before deployment

---

## 🔒 Security Notes

### Production Mode Includes:
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Gzip compression
- Static asset caching
- Health check endpoint

### Development Mode:
- **Do NOT use in production!**
- Source code is exposed
- No optimizations
- Slower performance

---

## 📝 Summary

**For Development:** Use `frontend-dev` (port 5173)
- Edit code on host → Changes appear instantly
- Full debugging support
- Comfortable development experience

**For Production Testing:** Use `frontend-prod` (port 5174)
- Optimized build
- Production-like environment
- Test performance and bundle size

**Default:** When you run `docker-compose up`, only `frontend-dev` starts automatically. Production requires the `--profile production` flag.

---

## 🆘 Need Help?

Check logs:
```bash
docker-compose logs -f frontend-dev
docker-compose logs -f frontend-prod
docker-compose logs -f drupal
```

Rebuild everything:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

Access container shell:
```bash
docker-compose exec frontend-dev sh
```
