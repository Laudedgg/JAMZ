import express from 'express';
import User from '../models/user.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSpotifyAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getUserProfile,
  getLikedSongs,
  getAllLikedSongs,
  isTokenExpired
} from '../utils/spotifyService.js';

const router = express.Router();

/**
 * GET /api/spotify/auth-url
 * Get Spotify OAuth authorization URL
 */
router.get('/auth-url', (req, res) => {
  try {
    console.log('🎵 Spotify auth-url endpoint called');
    console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ NOT SET');

    // For localhost development, use HTTP instead of HTTPS for Spotify redirect
    // Spotify doesn't accept self-signed HTTPS certificates
    let redirectUri;
    if (process.env.NODE_ENV === 'development' && process.env.FRONTEND_URL?.includes('localhost')) {
      redirectUri = 'http://localhost:3000/spotify-callback';
      console.log('🔧 Using HTTP for localhost Spotify redirect (development mode)');
    } else {
      redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/spotify-callback`;
    }

    console.log('Redirect URI:', redirectUri);

    const authUrl = getSpotifyAuthUrl(redirectUri);
    console.log('Generated auth URL:', authUrl.substring(0, 100) + '...');

    res.json({ authUrl });
  } catch (error) {
    console.error('❌ Error generating Spotify auth URL:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/spotify/callback
 * Handle Spotify OAuth callback
 */
router.post('/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    // For localhost development, use HTTP instead of HTTPS for Spotify redirect
    let redirectUri;
    if (process.env.NODE_ENV === 'development' && process.env.FRONTEND_URL?.includes('localhost')) {
      redirectUri = 'http://localhost:3000/spotify-callback';
    } else {
      redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/spotify-callback`;
    }
    
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    
    // Get user profile
    const profile = await getUserProfile(tokenData.access_token);

    // Update user with Spotify data
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        'spotify.accessToken': tokenData.access_token,
        'spotify.refreshToken': tokenData.refresh_token,
        'spotify.tokenExpiry': new Date(Date.now() + tokenData.expires_in * 1000),
        'spotify.spotifyId': profile.id,
        'spotify.displayName': profile.display_name,
        'spotify.profileImage': profile.images?.[0]?.url || null
      },
      { new: true }
    );

    res.json({
      message: 'Spotify connected successfully',
      user: {
        id: user._id,
        email: user.email,
        spotify: {
          displayName: user.spotify.displayName,
          profileImage: user.spotify.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/spotify/liked-songs
 * Get user's liked songs from Spotify
 */
router.get('/liked-songs', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user?.spotify?.accessToken) {
      return res.status(401).json({
        message: 'Spotify not connected. Please connect your Spotify account first.'
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = user.spotify.accessToken;
    if (isTokenExpired(user.spotify.tokenExpiry) && user.spotify.refreshToken) {
      try {
        const newTokenData = await refreshAccessToken(user.spotify.refreshToken);
        accessToken = newTokenData.access_token;
        
        // Update user with new token
        user.spotify.accessToken = newTokenData.access_token;
        user.spotify.tokenExpiry = new Date(Date.now() + newTokenData.expires_in * 1000);
        await user.save();
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return res.status(401).json({
          message: 'Spotify session expired. Please reconnect your account.'
        });
      }
    }

    // Get limit from query params (default 50)
    const limit = Math.min(parseInt(req.query.limit) || 50, 50);
    const offset = parseInt(req.query.offset) || 0;

    const likedSongs = await getLikedSongs(accessToken, limit, offset);

    res.json({
      message: 'Liked songs fetched successfully',
      total: likedSongs.total,
      songs: likedSongs.songs
    });
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/spotify/liked-songs/all
 * Get ALL user's liked songs from Spotify (with pagination)
 */
router.get('/liked-songs/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user?.spotify?.accessToken) {
      return res.status(401).json({
        message: 'Spotify not connected. Please connect your Spotify account first.'
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = user.spotify.accessToken;
    if (isTokenExpired(user.spotify.tokenExpiry) && user.spotify.refreshToken) {
      try {
        const newTokenData = await refreshAccessToken(user.spotify.refreshToken);
        accessToken = newTokenData.access_token;
        
        user.spotify.accessToken = newTokenData.access_token;
        user.spotify.tokenExpiry = new Date(Date.now() + newTokenData.expires_in * 1000);
        await user.save();
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return res.status(401).json({
          message: 'Spotify session expired. Please reconnect your account.'
        });
      }
    }

    const allLikedSongs = await getAllLikedSongs(accessToken);

    res.json({
      message: 'All liked songs fetched successfully',
      total: allLikedSongs.total,
      songs: allLikedSongs.songs
    });
  } catch (error) {
    console.error('Error fetching all liked songs:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/spotify/status
 * Check if Spotify is connected
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    const isConnected = !!user?.spotify?.accessToken;
    
    res.json({
      connected: isConnected,
      spotify: isConnected ? {
        displayName: user.spotify.displayName,
        profileImage: user.spotify.profileImage,
        spotifyId: user.spotify.spotifyId
      } : null
    });
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/spotify/disconnect
 * Disconnect Spotify account
 */
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.userId,
      {
        'spotify.accessToken': null,
        'spotify.refreshToken': null,
        'spotify.tokenExpiry': null,
        'spotify.spotifyId': null,
        'spotify.displayName': null,
        'spotify.profileImage': null
      }
    );

    res.json({ message: 'Spotify disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Spotify:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

