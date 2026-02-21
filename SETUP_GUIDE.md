# JAMZ.fun Server Setup Guide

## Overview
This guide will help you set up and run the JAMZ.fun application locally.

## Architecture
- **Frontend**: React + Vite (Port 3000)
- **Backend**: Node.js + Express (Port 3001)
- **Database**: MongoDB (Port 27018)
- **WebSocket**: Socket.IO for real-time features

## Prerequisites
1. **Node.js** (v18 or higher)
2. **MongoDB** (running locally or MongoDB Atlas)
3. **npm** or **yarn**

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Make the setup script executable
chmod +x setup-and-start.sh

# Run the setup script
./setup-and-start.sh
```

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 2. Configure Environment Variables

**Frontend (.env)**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51SGKGaPbY0SWUViVKTHudcwMtapta4FPrs86bossmC11HvxHJuIixpOGPhDbme5o5HtMdztd0TEeijoVRRHgMBbL00VwpmaT5L
REACT_APP_API_URL=http://localhost:3001/api
```

**Backend (backend/.env)**
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27018/jamz-dev
JWT_SECRET=jamz-dev-secret-key-2025
MAGIC_SECRET_KEY=sk_test_placeholder_replace_with_real_key

# Payment Configuration
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_placeholder_replace_with_real_webhook_secret
NOWPAYMENTS_API_KEY=KEGP3R0-8ZAMJ7D-M2KPX4C-28PZA5M

# URLs
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Spotify Configuration
SPOTIFY_CLIENT_ID=7fe54d3aede54a29bd6735b3c308aa35
SPOTIFY_CLIENT_SECRET=8872baaa9eaa4867a0e7e07983fb9af7

# YouTube API Configuration
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE

# Kickoff API Configuration
KICKOFF_API_KEY=c4d12fdb-b877-4128-a153-12aae3ab2b17
KICKOFF_PROJECT_SLUG=jamz-fun
KICKOFF_API_URL=https://www.kickoff.fun/api
```

#### 3. Start MongoDB
```bash
# If using local MongoDB
mongod --port 27018 --dbpath ./mongodb-data

# Or use MongoDB Atlas (update MONGODB_URI in backend/.env)
```

#### 4. Start the Servers

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run ngrok` - Expose frontend via ngrok

### Backend
- `npm run dev` - Start backend with auto-reload (port 3001)
- `npm start` - Start backend in production mode
- `npm run ngrok` - Expose backend via ngrok
- `npm run create-admin` - Create admin user
- `npm run setup-db` - Initialize database

## URLs

### Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **MongoDB**: mongodb://localhost:27018/jamz-dev

### Production (Google Cloud App Engine)
- **Production URL**: https://jamz-fun.uc.r.appspot.com
- **API**: https://jamz-fun.uc.r.appspot.com/api

## Testing with ngrok

For testing with external services (webhooks, OAuth, etc.):

```bash
# Terminal 1: Start backend with ngrok
cd backend
npm run ngrok

# Terminal 2: Start frontend with ngrok
npm run ngrok
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running on port 27018
- Check MONGODB_URI in backend/.env
- Verify mongodb-data directory exists and has proper permissions

### API Connection Issues
- Verify backend is running on port 3001
- Check REACT_APP_API_URL in frontend .env
- Check browser console for CORS errors

## Database Setup

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

## Deployment

See deployment documentation:
- `scripts/deploy.sh` - Deploy to Google Cloud App Engine
- `scripts/setup-env.sh` - Configure production environment variables
- `Dockerfile` - Container configuration

## Support

For issues or questions, check:
- `KICKOFF_INTEGRATION.md` - Kickoff.fun integration details
- `YOUTUBE_API_SETUP.md` - YouTube API configuration
- `README.md` - General project information

