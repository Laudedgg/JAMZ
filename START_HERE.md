# 🎵 JAMZ.fun - Start Here!

Welcome to JAMZ.fun! This guide will get you up and running in minutes.

---

## 🚀 Fastest Way to Start

```bash
./setup-and-start.sh
```

That's it! This single command will:
- ✅ Install all dependencies
- ✅ Configure environment
- ✅ Start all servers
- ✅ Open your app at http://localhost:3000

---

## 📍 What You Get

### Development Servers
- **Frontend**: http://localhost:3000 (React + Vite)
- **Backend**: http://localhost:3001 (Node.js + Express)
- **API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001

### Production
- **Live Site**: https://jamz-fun.uc.r.appspot.com

---

## 🎮 Essential Commands

| Command | Description |
|---------|-------------|
| `./setup-and-start.sh` | First-time setup + start servers |
| `./start-servers.sh` | Start servers (after setup) |
| `./stop-servers.sh` | Stop all servers |
| `./check-status.sh` | Check if servers are running |

---

## 📚 Documentation

### Quick References
- **[QUICK_START.md](./QUICK_START.md)** - Fast setup guide with common commands
- **[SERVER_SETUP_README.md](./SERVER_SETUP_README.md)** - Complete setup documentation
- **[URL_CONFIGURATION.md](./URL_CONFIGURATION.md)** - All URLs and API endpoints

### Detailed Guides
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[KICKOFF_INTEGRATION.md](./KICKOFF_INTEGRATION.md)** - Kickoff.fun integration
- **[YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md)** - YouTube API configuration

---

## 🔧 Manual Setup (If Needed)

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 2. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 3. Access App
Open http://localhost:3000 in your browser

---

## 🐛 Troubleshooting

### Servers Won't Start?
```bash
# Check what's wrong
./check-status.sh

# Stop any running servers
./stop-servers.sh

# Try again
./setup-and-start.sh
```

### Port Already in Use?
```bash
./stop-servers.sh
```

### Dependencies Issues?
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Project Structure

```
JAMZ/
├── src/                    # Frontend React code
├── backend/                # Backend Node.js code
│   ├── server.js          # Main server file
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   └── .env               # Backend config
├── public/                # Static assets
├── .env                   # Frontend config
├── setup-and-start.sh     # Automated setup
├── start-servers.sh       # Start servers
├── stop-servers.sh        # Stop servers
└── check-status.sh        # Status check
```

---

## 🎯 Next Steps After Setup

### 1. Create Admin User
```bash
cd backend
npm run create-admin
```

### 2. Add Sample Data
```bash
cd backend
npm run create-sample-data
```

### 3. Explore the App
- Browse tracks at http://localhost:3000
- Play MusicSense games
- Check out campaigns
- Test wallet features

---

## 🌐 Environment Configuration

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend (backend/.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27018/jamz-dev
JWT_SECRET=jamz-dev-secret-key-2025
SPOTIFY_CLIENT_ID=...
YOUTUBE_API_KEY=...
```

---

## 🆘 Need Help?

### Check Server Status
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

### Common Issues
1. **Port conflicts** → Run `./stop-servers.sh`
2. **Dependencies missing** → Run `npm install`
3. **MongoDB not running** → Check backend/.env for MongoDB URI
4. **API errors** → Check backend logs

---

## 🎵 Features

- 🎧 Music streaming and discovery
- 🎮 MusicSense interactive games
- 💰 Wallet and payment integration
- 🎨 Artist campaigns and showcases
- 🔗 Web3 wallet connectivity
- 📱 Mobile-responsive design
- 🔴 Real-time features with WebSocket

---

## 📞 Support

For detailed information, check:
- **[SERVER_SETUP_README.md](./SERVER_SETUP_README.md)** - Complete guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference
- **[README.md](./README.md)** - Project overview

---

**Ready to start? Run:**
```bash
./setup-and-start.sh
```

**Then open:** http://localhost:3000

**Happy coding! 🎵**

