# JAMZ.fun URL Configuration Guide

## 📍 Environment URLs

### Development (Local)
```
Frontend:  http://localhost:3000
Backend:   http://localhost:3001
API:       http://localhost:3001/api
MongoDB:   mongodb://localhost:27018/jamz-dev
WebSocket: ws://localhost:3001
```

### Production (Google Cloud App Engine)
```
Application: https://jamz-fun.uc.r.appspot.com
API:         https://jamz-fun.uc.r.appspot.com/api
```

### ngrok (Testing/Webhooks)
```
# Generated dynamically when running:
npm run ngrok              # Frontend
cd backend && npm run ngrok # Backend
```

## 🔧 Configuration Files

### Frontend Environment (.env)
```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51SGKGaPbY0SWUViVKTHudcwMtapta4FPrs86bossmC11HvxHJuIixpOGPhDbme5o5HtMdztd0TEeijoVRRHgMBbL00VwpmaT5L

# API Configuration
# Backend runs on port 3001, Vite dev server proxies /api requests
REACT_APP_API_URL=http://localhost:3001/api
```

### Backend Environment (backend/.env)
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
YOUTUBE_API_KEY=AIzaSyABF1nkwLma-mr6kBDxaG4ZPH7UsXCYdwA

# Kickoff API Configuration
KICKOFF_API_KEY=c4d12fdb-b877-4128-a153-12aae3ab2b17
KICKOFF_PROJECT_SLUG=jamz-fun
KICKOFF_API_URL=https://www.kickoff.fun/api
```

### Vite Proxy Configuration (vite.config.ts)
```typescript
server: {
  port: 3000,
  https: false,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me
```

### Artists
```
GET    /api/artists
GET    /api/artists/:id
POST   /api/artists
PUT    /api/artists/:id
DELETE /api/artists/:id
```

### Campaigns
```
GET    /api/campaigns
GET    /api/campaigns/:id
POST   /api/campaigns
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
```

### Tracks
```
GET    /api/tracks
GET    /api/tracks/:id
POST   /api/tracks
PUT    /api/tracks/:id
DELETE /api/tracks/:id
```

### Users
```
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/:id
```

### Wallets
```
GET    /api/wallets/balance
POST   /api/wallets/deposit
POST   /api/wallets/withdraw
GET    /api/wallets/transactions
```

### MusicSense (Game)
```
GET    /api/musicsense/games
POST   /api/musicsense/games
GET    /api/musicsense/games/:id
POST   /api/musicsense/games/:id/join
POST   /api/musicsense/games/:id/answer
```

### OpenVerse
```
GET    /api/open-verse/campaigns
POST   /api/open-verse/campaigns
GET    /api/open-verse/campaigns/:id
```

### Unified Campaigns
```
GET    /api/unified-campaigns
POST   /api/unified-campaigns
GET    /api/unified-campaigns/:id
```

### Referrals
```
POST   /api/referrals/generate
POST   /api/referrals/track-join
POST   /api/referrals/track-completion
GET    /api/referrals/stats
```

### Health Check
```
GET    /api/health
```

## 🔌 WebSocket Endpoints

### MusicSense Game
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3001');

// Events
socket.on('gameStarted', (data) => {});
socket.on('questionStarted', (data) => {});
socket.on('answerSubmitted', (data) => {});
socket.on('gameEnded', (data) => {});
```

## 🌍 External Service URLs

### Spotify API
```
Authorization: https://accounts.spotify.com/authorize
Token:         https://accounts.spotify.com/api/token
API:           https://api.spotify.com/v1
```

### YouTube API
```
API:           https://www.googleapis.com/youtube/v3
```

### Stripe
```
API:           https://api.stripe.com/v1
Dashboard:     https://dashboard.stripe.com
```

### Kickoff.fun
```
API:           https://www.kickoff.fun/api
Dashboard:     https://www.kickoff.fun
```

### NOWPayments
```
API:           https://api.nowpayments.io/v1
```

## 🔄 Changing URLs

### For Development
1. Update `.env` for frontend
2. Update `backend/.env` for backend
3. Restart servers

### For Production
1. Update `app.yaml` environment variables
2. Run `./scripts/setup-env.sh`
3. Deploy with `./scripts/deploy.sh`

### For ngrok Testing
1. Run `npm run ngrok` (frontend) or `cd backend && npm run ngrok`
2. Copy the generated URL
3. Update webhook URLs in external services (Stripe, etc.)

## 🔒 CORS Configuration

Backend allows requests from:
- `http://localhost:3000` (Development)
- `https://jamz-fun.uc.r.appspot.com` (Production)
- ngrok URLs (when testing)

To add more origins, update `backend/server.js`:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://jamz-fun.uc.r.appspot.com',
    // Add your URLs here
  ],
  credentials: true
};
```

## 📝 Notes

1. **Vite Proxy**: In development, Vite proxies `/api` requests to backend automatically
2. **Production**: Backend serves frontend static files from `/backend/public/dist`
3. **WebSocket**: Uses same port as backend (3001 in dev, 8080 in production)
4. **MongoDB**: Local development uses port 27018 to avoid conflicts with default 27017

