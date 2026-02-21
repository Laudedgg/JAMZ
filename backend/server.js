import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv FIRST before any other imports
// This ensures environment variables are available when modules are loaded
dotenv.config({ path: path.join(__dirname, '.env') });

// Kickoff configuration loaded from environment variables

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import { createServer } from 'http';
import { initializeSocket } from './websocket/musicSenseSocket.js';

// Import all models first to ensure proper registration
import './models/artist.js';
import './models/artistAuth.js';
import './models/campaign.js';
import './models/challenge.js';
import './models/share.js';
import './models/track.js';
import './models/trackVote.js';
import './models/user.js';
import './models/wallet.js';
import './models/musicSenseGame.js';
import './models/openVerseCampaign.js';
import './models/openVerseSubmission.js';
import './models/manualShowcaseEntry.js';
import './models/referral.js';
import './models/unifiedCampaign.js';
import './models/campaignEligibility.js';
import './models/notification.js';
import './models/adminSettings.js';
import './models/mftCampaign.js';
import './models/mftHolding.js';
import './models/mftTransaction.js';
import './models/royaltyDistribution.js';
import './models/campaignComment.js';

// Import routes after models are registered
import artistRoutes from './routes/artists.js';
import campaignRoutes from './routes/campaigns.js';
import authRoutes from './routes/auth.js';
import artistAuthRoutes from './routes/artistAuth.js';
import artistWalletRoutes from './routes/artistWallet.js';
import artistCampaignsRoutes from './routes/artistCampaigns.js';
import challengeRoutes from './routes/challenges.js';
import shareRoutes from './routes/shares.js';
import walletRoutes from './routes/wallets.js';
import trackRoutes from './routes/tracks.js';
import userRoutes from './routes/users.js';
import musicSenseRoutes from './routes/musicSense.js';
import openVerseRoutes from './routes/openVerse.js';
import manualShowcaseRoutes from './routes/manualShowcase.js';
import referralRoutes from './routes/referrals.js';
import unifiedCampaignRoutes from './routes/unifiedCampaigns.js';
import notificationRoutes from './routes/notifications.js';
import adminSettingsRoutes from './routes/adminSettings.js';
import adminWithdrawalsRoutes from './routes/adminWithdrawals.js';
import spotifyRoutes from './routes/spotify.js';
import kickstarterRoutes from './routes/kickstarter.js';

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost, ngrok domains, and jamz.fun
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      origin.includes('.ngrok.io') ||
      origin.includes('.ngrok-free.app') ||
      origin === 'https://jamz.fun'
    ) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Stripe webhook endpoint (must be before express.json middleware)
app.use('/api/artist/wallet/stripe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz';
console.log('Connecting to MongoDB:', mongoUri);
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Serve static files from public directory at the root path
app.use(express.static(path.join(__dirname, 'public')));

// PWA-specific headers middleware
app.use((req, res, next) => {
  // Set proper headers for manifest.json
  if (req.url === '/manifest.json') {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  // Set proper headers for service worker
  if (req.url === '/sw.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
  }

  // Set proper headers for PWA icons
  if (req.url.match(/\/jamzfunl.*\.png$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  next();
});

// Static file middleware
app.use((req, res, next) => {
  next();
});

// Media files endpoint - serves files from the public directory
app.get('/api/media/*', (req, res) => {
  try {
    // Extract the path after /api/media/
    const mediaPath = req.path.replace(/^\/api\/media\//, '');
    console.log('Media request for:', mediaPath);

    // Try multiple paths - some files are in public/media/, some directly in public/
    const possiblePaths = [
      path.join(__dirname, 'public', 'media', mediaPath),
      path.join(__dirname, 'public', mediaPath)
    ];

    let filePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      console.error('Media file not found in any location:', possiblePaths);
      return res.status(404).json({
        message: 'Media file not found',
        path: mediaPath
      });
    }

    console.log('Serving media from:', filePath);
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving media file:', error);
    res.status(500).json({ message: error.message });
  }
});



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artist-auth', artistAuthRoutes);
app.use('/api/artist/wallet', artistWalletRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/artist/campaigns', artistCampaignsRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/musicsense', musicSenseRoutes);
app.use('/api/open-verse', openVerseRoutes);
app.use('/api/manual-showcase', manualShowcaseRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/unified-campaigns', unifiedCampaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalsRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/kickstarter', kickstarterRoutes);



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack);

  // Check if the response has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Send JSON for API errors instead of HTML
  if (req.url.startsWith('/api/')) {
    return res.status(500).json({
      message: 'Something went wrong!',
      error: err.message,
      path: req.url
    });
  }

  // For non-API routes, you might want to render an error page
  res.status(500).json({ message: 'Something went wrong!' });
});

// Serve static files from the frontend build
if (process.env.NODE_ENV === 'production') {
  // Serve static assets
  app.use('/assets', express.static(path.join(__dirname, 'public/dist/assets')));

  // Serve the frontend app for all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({
        message: 'Endpoint not found',
        path: req.url,
        method: req.method
      });
    }

    // Serve the React app
    res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  });
} else {
  // Development 404 handler
  app.use((req, res) => {
    // Check if it's an API request
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({
        message: 'Endpoint not found',
        path: req.url,
        method: req.method
      });
    }

    // For non-API routes
    res.status(404).json({ message: 'Not found' });
  });
}

const PORT = process.env.PORT || 5002;

// Create HTTP server and initialize Socket.IO
const server = createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized for MusicSense`);
});
