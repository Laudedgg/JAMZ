import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ArtistAuth from '../models/artistAuth.js';
import Artist from '../models/artist.js';
import ArtistWallet from '../models/artistWallet.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for artist image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/artist-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'artist-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Artist self-registration (public endpoint)
router.post('/self-register', async (req, res) => {
  try {
    const { email, password, artistName, imageUrl, socialLinks } = req.body;

    // Validate required fields
    if (!email || !password || !artistName) {
      return res.status(400).json({ message: 'Email, password, and artist name are required' });
    }

    // Check if artist account already exists
    const existingAccount = await ArtistAuth.findOne({ email });
    if (existingAccount) {
      return res.status(400).json({ message: 'Artist account with this email already exists' });
    }

    // Create new artist profile first
    const artist = new Artist({
      name: artistName,
      imageUrl: imageUrl || '',
      socialMedia: socialLinks || {},
      isVerified: false // Artists need verification
    });

    await artist.save();

    // Create artist authentication account
    const artistAuth = new ArtistAuth({
      email,
      password,
      artistId: artist._id,
      isVerified: true // Auto-verify for self-registration
    });

    await artistAuth.save();

    // Create artist wallet
    const wallet = new ArtistWallet({
      artistId: artist._id,
      usdtBalance: 0,
      ngnBalance: 0,
      aedBalance: 0
    });

    await wallet.save();

    // Generate JWT token for auto-login after registration
    const token = jwt.sign(
      {
        id: artistAuth._id,
        artistId: artist._id,
        email: artistAuth.email,
        isArtist: true
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Artist account created successfully!',
      token,
      artist: {
        id: artist._id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        email: artistAuth.email,
        socialMedia: artist.socialMedia
      }
    });
  } catch (error) {
    console.error('Error in artist self-registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register artist account (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  // Only admins can register artist accounts
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Only admins can register artist accounts' });
  }

  try {
    const { email, password, artistId } = req.body;

    // Check if artist exists
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Check if artist account already exists
    const existingAccount = await ArtistAuth.findOne({ email });
    if (existingAccount) {
      return res.status(400).json({ message: 'Artist account with this email already exists' });
    }

    // Create new artist account
    const artistAuth = new ArtistAuth({
      email,
      password,
      artistId,
      isVerified: true // Auto-verify since admin is creating
    });

    await artistAuth.save();

    // Create artist wallet if it doesn't exist
    let wallet = await ArtistWallet.findOne({ artistId });
    if (!wallet) {
      wallet = new ArtistWallet({
        artistId,
        usdtBalance: 0,
        ngnBalance: 0,
        aedBalance: 0
      });
      await wallet.save();
    }

    res.status(201).json({
      message: 'Artist account created successfully',
      artistId: artistAuth.artistId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Artist login
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 Artist login attempt:', req.body);
    const { email, password } = req.body;

    // Find artist account
    const artistAuth = await ArtistAuth.findOne({ email });
    console.log('🎯 Artist found:', !!artistAuth, artistAuth ? artistAuth.email : 'none');
    if (!artistAuth) {
      console.log('❌ Artist not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is verified
    if (!artistAuth.isVerified) {
      console.log('❌ Artist account not verified:', email);
      return res.status(401).json({ message: 'Account not verified' });
    }

    // Check password
    const isMatch = await artistAuth.comparePassword(password);
    console.log('🔐 Password check:', isMatch ? '✅ CORRECT' : '❌ WRONG');
    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get artist details
    const artist = await Artist.findById(artistAuth.artistId);
    console.log('👤 Artist profile found:', !!artist, artist ? artist.name : 'none');
    if (!artist) {
      console.log('❌ Artist profile not found for ID:', artistAuth.artistId);
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: artistAuth._id,
        artistId: artistAuth.artistId,
        email: artistAuth.email,
        isArtist: true
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Artist login successful:', email);
    res.json({
      token,
      artist: {
        id: artist._id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        email: artistAuth.email,
        socialMedia: artist.socialMedia || {}
      }
    });
  } catch (error) {
    console.error('❌ Artist login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current artist profile
router.get('/profile', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    console.log('🔍 Profile request - ArtistAuth ID:', req.user._id, 'Artist ID:', req.user.artistId);

    // Find the artist by artistId from the token
    const artist = await Artist.findById(req.user.artistId);
    console.log('🎯 Artist found:', artist ? `Yes - Name: ${artist.name}` : 'No');

    if (!artist) {
      console.log('❌ Artist account not found for artist ID:', req.user.artistId);
      return res.status(404).json({ message: 'Artist account not found' });
    }

    // Get the artist auth info for email
    const artistAuth = await ArtistAuth.findById(req.user._id);
    console.log('🔍 ArtistAuth found:', artistAuth ? `Yes - Email: ${artistAuth.email}` : 'No');

    console.log('✅ Artist profile retrieved successfully');
    console.log('📋 Returning data:', {
      name: artist.name,
      email: artistAuth ? artistAuth.email : 'no-email',
      artistId: artist._id,
      authId: req.user._id
    });

    res.json({
      id: artist._id,
      name: artist.name,
      imageUrl: artist.imageUrl,
      email: artistAuth ? artistAuth.email : artist.email,
      socialMedia: artist.socialMedia
    });
  } catch (error) {
    console.log('💥 Profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update artist profile
router.put('/profile', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const { name, imageUrl, socialMedia } = req.body;

    const artistAuth = await ArtistAuth.findById(req.user._id);
    if (!artistAuth) {
      return res.status(404).json({ message: 'Artist account not found' });
    }

    const artist = await Artist.findById(artistAuth.artistId);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Update artist profile
    if (name) artist.name = name;
    if (imageUrl !== undefined) artist.imageUrl = imageUrl;
    if (socialMedia) artist.socialMedia = { ...artist.socialMedia, ...socialMedia };

    await artist.save();

    res.json({
      id: artist._id,
      name: artist.name,
      imageUrl: artist.imageUrl,
      email: artistAuth.email,
      socialMedia: artist.socialMedia
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password (for artists)
router.post('/change-password', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    const artistAuth = await ArtistAuth.findById(req.user.id);
    if (!artistAuth) {
      return res.status(404).json({ message: 'Artist account not found' });
    }

    // Verify current password
    const isMatch = await artistAuth.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    artistAuth.password = newPassword;
    await artistAuth.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password (admin only)
router.post('/reset-password', authenticateToken, async (req, res) => {
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const { artistId, newPassword } = req.body;

    if (!artistId || !newPassword) {
      return res.status(400).json({ message: 'Artist ID and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Find artist account by artistId
    const artistAuth = await ArtistAuth.findOne({ artistId });
    if (!artistAuth) {
      return res.status(404).json({ message: 'Artist account not found' });
    }

    // Update password
    artistAuth.password = newPassword;
    await artistAuth.save();

    res.json({
      message: 'Password reset successfully',
      artistId: artistAuth.artistId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload artist image (authenticated)
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Return the image URL
    const imageUrl = `/api/media/artist-images/${req.file.filename}`;

    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload artist image during registration (public endpoint)
router.post('/upload-registration-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Return the image URL
    const imageUrl = `/api/media/artist-images/${req.file.filename}`;

    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
