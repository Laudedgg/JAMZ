# JAMZ.fun Quick Start Guide

## 🚀 One-Command Setup

```bash
./setup-and-start.sh
```

This will:
- ✅ Check prerequisites (Node.js, npm)
- ✅ Install all dependencies
- ✅ Configure environment variables
- ✅ Start MongoDB (if installed locally)
- ✅ Start backend server (port 3001)
- ✅ Start frontend server (port 3000)

## 📍 Access Points

Once servers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🎮 Common Commands

### Start Servers
```bash
./start-servers.sh
```

### Stop Servers
```bash
./stop-servers.sh
```

### Check Status
```bash
./check-status.sh
```

### View Logs
```bash
# Frontend logs
tail -f frontend.log

# Backend logs
tail -f backend.log
```

## 🔧 Manual Setup (If Needed)

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 2. Start MongoDB (Local)
```bash
mongod --port 27018 --dbpath ./mongodb-data
```

### 3. Start Backend
```bash
cd backend
npm run dev
```

### 4. Start Frontend (New Terminal)
```bash
npm run dev
```

## 🌐 Server Configuration

### Ports
- **Frontend**: 3000 (Vite dev server)
- **Backend**: 3001 (Express API)
- **MongoDB**: 27018 (Local database)

### Environment Files

**Frontend (.env)**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_API_URL=http://localhost:3001/api
```

**Backend (backend/.env)**
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27018/jamz-dev
JWT_SECRET=YOUR_JWT_SECRET_HERE
# ... other config
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill specific port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend

# Or use stop script
./stop-servers.sh
```

### MongoDB Not Running
```bash
# Start MongoDB manually
mongod --port 27018 --dbpath ./mongodb-data

# Or use MongoDB Atlas (update MONGODB_URI in backend/.env)
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

### API Connection Failed
1. Check backend is running: `curl http://localhost:3001/api/health`
2. Verify .env has correct API_URL
3. Check browser console for errors
4. Verify CORS settings in backend

## 📦 Database Setup

### Create Admin User
```bash
cd backend
npm run create-admin
```

### Add Sample Data
```bash
cd backend
npm run create-sample-data
```

### Add YouTube Tracks
```bash
cd backend
npm run add-youtube-tracks
```

## 🌍 Production Deployment

### Google Cloud App Engine
```bash
# Setup environment
./scripts/setup-env.sh

# Deploy
./scripts/deploy.sh
```

### Using Docker
```bash
# Build image
docker build -t jamz-fun .

# Run container
docker run -p 8080:8080 jamz-fun
```

## 🔗 Useful Links

- **Setup Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Kickoff Integration**: [KICKOFF_INTEGRATION.md](./KICKOFF_INTEGRATION.md)
- **YouTube API**: [YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md)
- **Main README**: [README.md](./README.md)

## 💡 Tips

1. **Use ngrok for testing webhooks**:
   ```bash
   cd backend && npm run ngrok
   ```

2. **Watch mode is enabled** - Changes auto-reload in development

3. **Check server status anytime**:
   ```bash
   ./check-status.sh
   ```

4. **Stop servers cleanly** with Ctrl+C or:
   ```bash
   ./stop-servers.sh
   ```

