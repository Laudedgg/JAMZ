# 🎵 JAMZ.fun Server Setup & Configuration

Complete guide for setting up and running JAMZ.fun servers locally and in production.

---

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Server Architecture](#-server-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running Servers](#-running-servers)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment](#-production-deployment)

---

## 🚀 Quick Start

**One command to rule them all:**
```bash
./setup-and-start.sh
```

This automated script will:
1. ✅ Verify Node.js and npm installation
2. ✅ Install all dependencies (frontend + backend)
3. ✅ Configure environment variables
4. ✅ Start MongoDB (if available locally)
5. ✅ Launch backend server on port 3001
6. ✅ Launch frontend server on port 3000
7. ✅ Display access URLs and logs

**Access your app at:** http://localhost:3000

---

## 🏗️ Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    JAMZ.fun Stack                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Port 3000)                                   │
│  ├─ React + TypeScript                                  │
│  ├─ Vite Dev Server                                     │
│  ├─ TailwindCSS + Framer Motion                         │
│  └─ Proxies /api → Backend                              │
│                                                         │
│  Backend (Port 3001)                                    │
│  ├─ Node.js + Express                                   │
│  ├─ RESTful API                                         │
│  ├─ Socket.IO (WebSocket)                               │
│  └─ JWT Authentication                                  │
│                                                         │
│  Database (Port 27018)                                  │
│  ├─ MongoDB                                             │
│  └─ Local or MongoDB Atlas                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

### Required
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (comes with Node.js)

### Optional
- **MongoDB** v6+ (for local database)
  - Or use MongoDB Atlas (cloud)
- **Git** (for version control)

### Verify Installation
```bash
node --version   # Should be v18.0.0 or higher
npm --version    # Should be v9.0.0 or higher
```

---

## 📦 Installation

### Method 1: Automated (Recommended)
```bash
./setup-and-start.sh
```

### Method 2: Manual
```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Check status
./check-status.sh
```

---

## ⚙️ Configuration

### Environment Files

#### Frontend: `.env`
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_API_URL=http://localhost:3001/api
```

#### Backend: `backend/.env`
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27018/jamz-dev
JWT_SECRET=jamz-dev-secret-key-2025

# Payment APIs
STRIPE_SECRET_KEY=sk_live_...
NOWPAYMENTS_API_KEY=...

# Music APIs
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
YOUTUBE_API_KEY=...

# Kickoff Integration
KICKOFF_API_KEY=...
KICKOFF_PROJECT_SLUG=jamz-fun
```

### Port Configuration
| Service  | Port  | URL                          |
|----------|-------|------------------------------|
| Frontend | 3000  | http://localhost:3000        |
| Backend  | 3001  | http://localhost:3001        |
| API      | 3001  | http://localhost:3001/api    |
| MongoDB  | 27018 | mongodb://localhost:27018    |

---

## 🎮 Running Servers

### Start All Servers
```bash
./start-servers.sh
```

### Start Individually

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Terminal 3 - MongoDB (if local):**
```bash
mongod --port 27018 --dbpath ./mongodb-data
```

### Stop All Servers
```bash
./stop-servers.sh
```

Or press `Ctrl+C` in the terminal running the servers.

### Check Server Status
```bash
./check-status.sh
```

---

## 🔍 Available Scripts

### Frontend Scripts
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run ngrok     # Expose via ngrok
```

### Backend Scripts
```bash
npm run dev              # Start with auto-reload
npm start                # Start production mode
npm run ngrok            # Expose via ngrok
npm run create-admin     # Create admin user
npm run setup-db         # Initialize database
npm run create-sample-data  # Add sample data
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Option 1: Use stop script
./stop-servers.sh

# Option 2: Kill specific port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

### Dependencies Not Installed
```bash
# Clean install frontend
rm -rf node_modules package-lock.json
npm install

# Clean install backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

### MongoDB Connection Failed
```bash
# Option 1: Start local MongoDB
mongod --port 27018 --dbpath ./mongodb-data

# Option 2: Use MongoDB Atlas
# Update MONGODB_URI in backend/.env with Atlas connection string
```

### API Not Responding
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check backend logs: `tail -f backend.log`
3. Verify .env configuration
4. Check firewall settings

### CORS Errors
- Ensure backend allows frontend origin
- Check `backend/server.js` CORS configuration
- Verify API_URL in frontend .env

---

## 🌍 Production Deployment

### Google Cloud App Engine

**1. Setup Environment:**
```bash
./scripts/setup-env.sh
```

**2. Deploy:**
```bash
./scripts/deploy.sh
```

**3. Access:**
```
https://jamz-fun.uc.r.appspot.com
```

### Docker Deployment

**Build:**
```bash
docker build -t jamz-fun .
```

**Run:**
```bash
docker run -p 8080:8080 jamz-fun
```

---

## 📚 Additional Resources

- **[QUICK_START.md](./QUICK_START.md)** - Fast setup guide
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[URL_CONFIGURATION.md](./URL_CONFIGURATION.md)** - Complete URL reference
- **[KICKOFF_INTEGRATION.md](./KICKOFF_INTEGRATION.md)** - Kickoff.fun integration
- **[YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md)** - YouTube API setup

---

## 🆘 Getting Help

**Check Status:**
```bash
./check-status.sh
```

**View Logs:**
```bash
tail -f frontend.log
tail -f backend.log
```

**Common Issues:**
- Dependencies not installed → Run `npm install`
- Port conflicts → Run `./stop-servers.sh`
- MongoDB not running → Start MongoDB or use Atlas
- API errors → Check backend logs and .env configuration

---

## 📝 Quick Reference

```bash
# Setup and start everything
./setup-and-start.sh

# Start servers
./start-servers.sh

# Stop servers
./stop-servers.sh

# Check status
./check-status.sh

# View logs
tail -f frontend.log
tail -f backend.log
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API: http://localhost:3001/api
- Health: http://localhost:3001/api/health

---

**Happy Coding! 🎵**

