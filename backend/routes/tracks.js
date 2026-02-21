import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Track from '../models/track.js';
import TrackVote from '../models/trackVote.js';
import { authenticateToken } from '../middleware/auth.js';
import musicMetadataService from '../services/musicMetadataService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/media/tracks';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'coverImage') {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
  } else if (file.fieldname === 'audioFile') {
    // Accept audio files only
    if (!file.originalname.match(/\.(mp3|wav|ogg)$/)) {
      return cb(new Error('Only audio files are allowed!'), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all tracks (sorted by vote score by default)
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'votes' } = req.query;

    let sortCriteria;
    if (sortBy === 'votes') {
      sortCriteria = { voteScore: -1, createdAt: -1 }; // Sort by vote score (highest first), then newest
    } else if (sortBy === 'newest') {
      sortCriteria = { createdAt: -1 };
    } else {
      sortCriteria = { order: 1, createdAt: -1 }; // Manual order
    }

    const tracks = await Track.find({ isActive: true }).sort(sortCriteria);
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single track
router.get('/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get track cover image
router.get('/:id/cover', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track || !track.coverImage) {
      return res.status(404).json({ message: 'Track or cover image not found' });
    }

    // Get the path to the image, removing 'public/' prefix if it exists
    const relativePath = track.coverImage.replace(/^public\//, '');
    const imagePath = path.join(__dirname, '..', 'public', relativePath);
    console.log('Serving image from:', imagePath);

    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        message: 'Cover image file not found',
        path: imagePath,
        storedPath: track.coverImage,
        relativePath: relativePath
      });
    }

    // Send the file
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving track cover:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin middleware
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Create track (admin only)
router.post('/', authenticateToken, isAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]), async (req, res) => {
  try {
    // Validate that at least one media source is provided
    const hasAudioFile = req.files && req.files.audioFile;
    const hasSpotifyUrl = req.body.spotifyUrl && req.body.spotifyUrl.trim();
    const hasSpotifyPreview = req.body.spotifyPreviewUrl && req.body.spotifyPreviewUrl.trim();
    const hasAppleMusicUrl = req.body.appleMusicUrl && req.body.appleMusicUrl.trim();
    const hasAppleMusicPreview = req.body.appleMusicPreviewUrl && req.body.appleMusicPreviewUrl.trim();
    const hasYoutubeUrl = req.body.youtubeUrl && req.body.youtubeUrl.trim();

    if (!hasAudioFile && !hasSpotifyUrl && !hasSpotifyPreview && !hasAppleMusicUrl && !hasAppleMusicPreview && !hasYoutubeUrl) {
      return res.status(400).json({
        message: 'At least one media source is required: audio file, Spotify URL, Apple Music URL, or YouTube URL'
      });
    }

    // Cover image is optional
    let coverImagePath = '';
    if (req.files && req.files.coverImage) {
      coverImagePath = req.files.coverImage[0].path.replace(/\\/g, '/');
    }

    // Audio file is optional
    let audioFilePath = '';
    if (hasAudioFile) {
      audioFilePath = req.files.audioFile[0].path.replace(/\\/g, '/');
    }

    const track = new Track({
      title: req.body.title,
      artist: req.body.artist,
      coverImage: coverImagePath,
      audioFile: audioFilePath,
      duration: req.body.duration || 0,
      spotifyUrl: req.body.spotifyUrl || '',
      spotifyPreviewUrl: req.body.spotifyPreviewUrl || '',
      appleMusicUrl: req.body.appleMusicUrl || '',
      appleMusicPreviewUrl: req.body.appleMusicPreviewUrl || '',
      youtubeUrl: req.body.youtubeUrl || '',
      isActive: true
    });

    const newTrack = await track.save();
    res.status(201).json(newTrack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update track (admin only)
router.patch('/:id', authenticateToken, isAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Update fields if provided
    if (req.body.title) track.title = req.body.title;
    if (req.body.artist) track.artist = req.body.artist;
    if (req.body.duration) track.duration = req.body.duration;
    if (req.body.spotifyUrl !== undefined) track.spotifyUrl = req.body.spotifyUrl;
    if (req.body.spotifyPreviewUrl !== undefined) track.spotifyPreviewUrl = req.body.spotifyPreviewUrl;
    if (req.body.appleMusicUrl !== undefined) track.appleMusicUrl = req.body.appleMusicUrl;
    if (req.body.appleMusicPreviewUrl !== undefined) track.appleMusicPreviewUrl = req.body.appleMusicPreviewUrl;
    if (req.body.youtubeUrl !== undefined) track.youtubeUrl = req.body.youtubeUrl;
    if (req.body.isActive !== undefined) track.isActive = req.body.isActive;

    // Update files if provided
    if (req.files) {
      if (req.files.coverImage) {
        // Delete old cover image if it exists
        if (track.coverImage && fs.existsSync(track.coverImage)) {
          fs.unlinkSync(track.coverImage);
        }
        track.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
      }

      if (req.files.audioFile) {
        // Delete old audio file if it exists
        if (track.audioFile && fs.existsSync(track.audioFile)) {
          fs.unlinkSync(track.audioFile);
        }
        track.audioFile = req.files.audioFile[0].path.replace(/\\/g, '/');
      }
    }

    const updatedTrack = await track.save();
    res.json(updatedTrack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete track (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Delete associated files
    if (track.coverImage && fs.existsSync(track.coverImage)) {
      fs.unlinkSync(track.coverImage);
    }
    if (track.audioFile && fs.existsSync(track.audioFile)) {
      fs.unlinkSync(track.audioFile);
    }

    await track.deleteOne();
    res.json({ message: 'Track deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like a track
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    track.likes += 1;
    const updatedTrack = await track.save();
    res.json(updatedTrack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reorder tracks (admin only)
router.post('/reorder', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { trackOrders } = req.body;

    if (!trackOrders || !Array.isArray(trackOrders)) {
      return res.status(400).json({ message: 'Track orders array is required' });
    }

    // Update each track's order in the database
    const updatePromises = trackOrders.map(({ _id, order }) => {
      return Track.findByIdAndUpdate(_id, { order }, { new: true });
    });

    await Promise.all(updatePromises);

    // Get the updated tracks
    const updatedTracks = await Track.find().sort({ order: 1, createdAt: -1 });

    res.json(updatedTracks);
  } catch (error) {
    console.error('Error reordering tracks:', error);
    res.status(500).json({ message: error.message });
  }
});

// Quick update endpoint for Spotify URL (admin only)
router.post('/:id/spotify-url', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { spotifyUrl } = req.body;
    if (!spotifyUrl) {
      return res.status(400).json({ message: 'Spotify URL is required' });
    }

    const track = await Track.findByIdAndUpdate(
      req.params.id,
      { spotifyUrl },
      { new: true }
    );

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    res.json(track);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Proxy endpoint for Spotify preview URLs to bypass CORS restrictions
router.get('/preview/:trackId', async (req, res) => {
  try {
    const track = await Track.findById(req.params.trackId);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    if (!track.spotifyPreviewUrl) {
      return res.status(404).json({ message: 'No preview URL available for this track' });
    }

    // Fetch the preview from Spotify
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(track.spotifyPreviewUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Failed to fetch preview from Spotify' });
    }

    // Set proper CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream the audio
    response.body.pipe(res);
  } catch (error) {
    console.error('Error proxying preview:', error);
    res.status(500).json({ message: error.message });
  }
});

// Vote on a track (upvote or downvote)
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body; // voteType: 'upvote' or 'downvote'
    const trackId = req.params.id;

    // Validate vote type
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type. Must be "upvote" or "downvote"' });
    }

    // User must be authenticated (enforced by authenticateToken middleware)
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if user already voted on this track
    const existingVote = await TrackVote.findOne({
      trackId,
      userId
    });

    const track = await Track.findById(trackId);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    if (existingVote) {
      // User already voted - update their vote if different
      if (existingVote.voteType === voteType) {
        // Same vote - remove it (toggle off)
        if (voteType === 'upvote') {
          track.upvotes = Math.max(0, track.upvotes - 1);
        } else {
          track.downvotes = Math.max(0, track.downvotes - 1);
        }
        await existingVote.deleteOne();
      } else {
        // Different vote - switch vote
        if (existingVote.voteType === 'upvote') {
          track.upvotes = Math.max(0, track.upvotes - 1);
          track.downvotes += 1;
        } else {
          track.downvotes = Math.max(0, track.downvotes - 1);
          track.upvotes += 1;
        }
        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      // New vote
      const newVote = new TrackVote({
        trackId,
        userId,
        voteType,
        ipAddress
      });
      await newVote.save();

      if (voteType === 'upvote') {
        track.upvotes += 1;
      } else {
        track.downvotes += 1;
      }
    }

    // Update vote score
    track.voteScore = track.upvotes - track.downvotes;
    await track.save();

    res.json({
      track,
      userVote: existingVote && existingVote.voteType === voteType ? null : voteType
    });
  } catch (error) {
    console.error('Error voting on track:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's vote for a track (requires authentication)
router.get('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const trackId = req.params.id;
    const userId = req.user._id;

    const vote = await TrackVote.findOne({
      trackId,
      userId
    });

    res.json({
      userVote: vote ? vote.voteType : null
    });
  } catch (error) {
    console.error('Error getting user vote:', error);
    res.status(500).json({ message: error.message });
  }
});

// Bulk enrich tracks from YouTube URLs (Admin only)
router.post('/bulk-enrich-youtube', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { youtubeUrls } = req.body;

    if (!youtubeUrls || !Array.isArray(youtubeUrls) || youtubeUrls.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of YouTube URLs' });
    }

    console.log(`Enriching ${youtubeUrls.length} YouTube URLs...`);

    // Enrich all URLs
    const results = await musicMetadataService.bulkEnrichFromYouTube(youtubeUrls);

    res.json({
      message: `Processed ${results.length} URLs`,
      results
    });
  } catch (error) {
    console.error('Error bulk enriching YouTube URLs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Bulk create tracks from enriched data (Admin only)
router.post('/bulk-create-from-enriched', authenticateToken, upload.fields([
  { name: 'coverImages', maxCount: 50 }
]), async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { tracks } = req.body;

    if (!tracks) {
      return res.status(400).json({ message: 'Please provide tracks data' });
    }

    // Parse tracks if it's a string
    const tracksData = typeof tracks === 'string' ? JSON.parse(tracks) : tracks;

    if (!Array.isArray(tracksData) || tracksData.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of tracks' });
    }

    console.log(`Creating ${tracksData.length} tracks...`);

    const createdTracks = [];
    const errors = [];

    for (let i = 0; i < tracksData.length; i++) {
      try {
        const trackData = tracksData[i];

        // Download cover image if URL is provided
        let coverImagePath = null;
        if (trackData.coverImageUrl) {
          const imageBuffer = await musicMetadataService.downloadImage(trackData.coverImageUrl);
          if (imageBuffer) {
            const uploadPath = 'public/media/tracks';
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }

            const filename = `cover-${Date.now()}-${i}.jpg`;
            const filepath = path.join(uploadPath, filename);
            fs.writeFileSync(filepath, imageBuffer);
            coverImagePath = `media/tracks/${filename}`;
          }
        }

        // Create track
        const newTrack = new Track({
          title: trackData.title,
          artist: trackData.artist,
          duration: trackData.duration || 0,
          youtubeUrl: trackData.youtubeUrl,
          spotifyUrl: trackData.spotifyUrl || null,
          spotifyPreviewUrl: trackData.spotifyPreviewUrl || null,
          appleMusicUrl: trackData.appleMusicUrl || null,
          appleMusicPreviewUrl: trackData.appleMusicPreviewUrl || null,
          coverImage: coverImagePath,
          isActive: true,
          upvotes: 0,
          downvotes: 0,
          voteScore: 0
        });

        await newTrack.save();
        createdTracks.push(newTrack);
      } catch (error) {
        console.error(`Error creating track ${i}:`, error);
        errors.push({
          index: i,
          track: tracksData[i],
          error: error.message
        });
      }
    }

    res.json({
      message: `Created ${createdTracks.length} tracks`,
      created: createdTracks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk creating tracks:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
