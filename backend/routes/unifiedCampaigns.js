import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import UnifiedCampaign from '../models/unifiedCampaign.js';
import CampaignEligibility from '../models/campaignEligibility.js';
import OpenVerseSubmission from '../models/openVerseSubmission.js';
import ManualShowcaseEntry from '../models/manualShowcaseEntry.js';
import User from '../models/user.js';
import ArtistAuth from '../models/artistAuth.js';
import { authenticateToken, isAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/campaign-thumbnails');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'campaign-' + uniqueSuffix + path.extname(file.originalname));
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

// PUBLIC ROUTES

// Get all active campaigns (public)
router.get('/', async (req, res) => {
  try {
    const campaigns = await UnifiedCampaign.find({
      isActive: true,
      status: { $in: ['active', 'ended'] }
    })
    .populate('artistId', 'name imageUrl socialMedia')
    .sort({ order: 1, createdAt: -1 });
    
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single campaign (public)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await UnifiedCampaign.findById(req.params.id)
      .populate('artistId', 'name imageUrl socialMedia')
      .populate('createdBy', 'username email');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get campaign thumbnail (public)
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const campaign = await UnifiedCampaign.findById(req.params.id);
    if (!campaign || !campaign.thumbnailImage) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }
    
    const thumbnailPath = path.join(__dirname, '../public/campaign-thumbnails', campaign.thumbnailImage);
    
    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ message: 'Thumbnail file not found' });
    }
    
    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get campaign showcase (combines submissions and manual entries) (public)
router.get('/:id/showcase', optionalAuth, async (req, res) => {
  try {
    const { status = 'approved', includeOwn = 'false' } = req.query;
    const campaignId = req.params.id;

    // Get user submissions
    let submissionQuery = { campaignId };
    if (req.user && includeOwn === 'true') {
      submissionQuery = {
        campaignId,
        $or: [
          { status: 'approved' },
          { userId: req.user._id }
        ]
      };
    } else {
      submissionQuery.status = status;
    }

    const [submissions, manualEntries] = await Promise.all([
      OpenVerseSubmission.find(submissionQuery)
        .populate('userId', 'username email walletAddress')
        .populate('eligibilityId')
        .sort({ createdAt: -1 }),
      ManualShowcaseEntry.find({ 
        campaignId, 
        status: { $in: ['active', 'featured'] } 
      })
        .populate('createdBy', 'username email')
        .sort({ isFeatured: -1, order: 1, createdAt: -1 })
    ]);

    // Transform manual entries to match submission format
    const transformedManualEntries = manualEntries.map(entry => ({
      _id: entry._id,
      campaignId: entry.campaignId,
      platform: entry.platform,
      contentUrl: entry.link,
      metadata: {
        title: entry.name,
        description: entry.metadata.description,
        thumbnailUrl: entry.metadata.thumbnailUrl,
        author: entry.metadata.author
      },
      status: 'approved',
      isManualEntry: true,
      isFeatured: entry.isFeatured,
      order: entry.order,
      createdAt: entry.createdAt,
      createdBy: entry.createdBy
    }));

    // Combine and sort all entries
    const allEntries = [
      ...submissions.map(sub => ({ ...sub.toObject(), isManualEntry: false })),
      ...transformedManualEntries
    ].sort((a, b) => {
      // Featured entries first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // Then by order (manual entries only)
      if (a.isManualEntry && b.isManualEntry) {
        if (a.order !== b.order) return a.order - b.order;
      }

      // Finally by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(allEntries);
  } catch (error) {
    console.error('Error fetching campaign showcase:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get campaign winners (public)
router.get('/:id/winners', async (req, res) => {
  try {
    const winners = await OpenVerseSubmission.find({
      campaignId: req.params.id,
      isWinner: true
    })
    .populate('userId', 'username email walletAddress')
    .sort({ winnerRank: 1 });
    
    res.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ message: error.message });
  }
});

// AUTHENTICATED USER ROUTES

// Check user eligibility for campaign
router.get('/:id/eligibility', authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user._id;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    const eligibility = await CampaignEligibility.getOrCreate(
      userId, 
      campaignId, 
      ipAddress, 
      userAgent
    );
    
    res.json({
      isEligible: eligibility.isEligible,
      prerequisites: eligibility.prerequisites,
      hasSubmitted: eligibility.hasSubmitted,
      submissionId: eligibility.submissionId
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ message: error.message });
  }
});

// Complete YouTube watch prerequisite
router.post('/:id/complete-youtube-watch', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.body;
    const campaignId = req.params.id;
    const userId = req.user._id;
    
    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }
    
    const eligibility = await CampaignEligibility.getOrCreate(
      userId, 
      campaignId, 
      req.ip, 
      req.get('User-Agent')
    );
    
    await eligibility.completeYouTubeWatch(videoId);
    await eligibility.save();
    
    res.json({
      message: 'YouTube watch prerequisite completed',
      isEligible: eligibility.isEligible,
      prerequisites: eligibility.prerequisites
    });
  } catch (error) {
    console.error('Error completing YouTube watch:', error);
    res.status(500).json({ message: error.message });
  }
});

// Complete share action prerequisite
router.post('/:id/complete-share-action', authenticateToken, async (req, res) => {
  try {
    const { platform, url } = req.body;
    const campaignId = req.params.id;
    const userId = req.user._id;
    
    if (!platform) {
      return res.status(400).json({ message: 'Platform is required' });
    }
    
    const eligibility = await CampaignEligibility.getOrCreate(
      userId, 
      campaignId, 
      req.ip, 
      req.get('User-Agent')
    );
    
    await eligibility.completeShareAction(platform, url || '');
    await eligibility.save();
    
    res.json({
      message: 'Share action prerequisite completed',
      isEligible: eligibility.isEligible,
      prerequisites: eligibility.prerequisites
    });
  } catch (error) {
    console.error('Error completing share action:', error);
    res.status(500).json({ message: error.message });
  }
});

// Submit to campaign
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { platform, contentUrl } = req.body;
    const campaignId = req.params.id;
    const userId = req.user._id;
    
    // Validate input
    if (!platform || !contentUrl) {
      return res.status(400).json({ message: 'Platform and content URL are required' });
    }
    
    // Get campaign
    const campaign = await UnifiedCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Check if campaign is active and accepting submissions
    if (!campaign.isCurrentlyActive) {
      return res.status(400).json({ message: 'Campaign is not currently accepting submissions' });
    }
    
    // Check platform is allowed
    if (!campaign.allowedPlatforms.includes(platform)) {
      return res.status(400).json({ message: `Platform ${platform} is not allowed for this campaign` });
    }
    
    // Check eligibility
    const eligibility = await CampaignEligibility.getOrCreate(
      userId, 
      campaignId, 
      req.ip, 
      req.get('User-Agent')
    );
    
    if (!eligibility.isEligible) {
      return res.status(400).json({ 
        message: 'You must complete all prerequisites before submitting',
        prerequisites: eligibility.prerequisites,
        requiredPrerequisites: campaign.prerequisites
      });
    }
    
    // Check if user already submitted
    if (eligibility.hasSubmitted) {
      return res.status(400).json({ message: 'You have already submitted to this campaign' });
    }
    
    // Create submission
    const submission = new OpenVerseSubmission({
      campaignId,
      userId,
      platform,
      contentUrl,
      eligibilityId: eligibility._id,
      prerequisitesMetAtSubmission: {
        youtubeWatchCompleted: eligibility.prerequisites.youtubeWatchCompleted,
        shareActionCompleted: eligibility.prerequisites.shareActionCompleted
      },
      submissionIp: req.ip
    });
    
    await submission.save();
    
    // Update eligibility record
    eligibility.hasSubmitted = true;
    eligibility.submissionId = submission._id;
    eligibility.submittedAt = new Date();
    await eligibility.save();
    
    // Update campaign statistics
    await UnifiedCampaign.findByIdAndUpdate(campaignId, {
      $inc: { 
        totalSubmissions: 1,
        totalParticipants: 1 // This might need more sophisticated logic to avoid double counting
      }
    });
    
    res.status(201).json({
      message: 'Submission created successfully',
      submission: await submission.populate('userId', 'username email')
    });
    
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Select winners for a campaign (available to campaign creators and admins)
router.post('/:id/select-winners', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { winners } = req.body;

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ message: 'Winners array is required' });
    }

    // Find the campaign
    const campaign = await UnifiedCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user is authorized (campaign creator or admin)
    const isCreator = campaign.createdByArtist && campaign.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to select winners for this campaign' });
    }

    // Check if winners already selected
    if (campaign.winnersSelected) {
      return res.status(400).json({ message: 'Winners have already been selected for this campaign' });
    }

    // Validate winners data
    for (const winner of winners) {
      if (!winner.submissionId || !winner.rank || !winner.prizeAmount) {
        return res.status(400).json({ message: 'Each winner must have submissionId, rank, and prizeAmount' });
      }
    }

    // Update submissions to mark winners
    const submissionUpdates = winners.map(winner => ({
      updateOne: {
        filter: { _id: winner.submissionId, campaignId: id },
        update: {
          isWinner: true,
          winnerRank: winner.rank,
          prizeAmount: winner.prizeAmount,
          prizeCurrency: campaign.prizePool.currency
        }
      }
    }));

    await OpenVerseSubmission.bulkWrite(submissionUpdates);

    // Update campaign to mark winners as selected
    campaign.winnersSelected = true;
    campaign.status = 'winners_selected';
    await campaign.save();

    res.json({ message: 'Winners selected successfully' });

  } catch (error) {
    console.error('Error selecting winners:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADMIN ROUTES

// Get all campaigns (admin)
router.get('/admin/campaigns', authenticateToken, isAdmin, async (req, res) => {
  try {
    const campaigns = await UnifiedCampaign.find({})
      .populate('artistId', 'name imageUrl socialMedia')
      .sort({ createdAt: -1 });

    // Manually populate createdBy based on createdByArtist flag
    const campaignsWithCreator = await Promise.all(campaigns.map(async (campaign) => {
      const campaignObj = campaign.toObject();

      if (campaignObj.createdByArtist) {
        // For artist-created campaigns, populate from ArtistAuth
        const artistAuth = await ArtistAuth.findById(campaignObj.createdBy).select('email');
        campaignObj.createdBy = artistAuth ? {
          _id: artistAuth._id,
          email: artistAuth.email,
          type: 'artist'
        } : null;
      } else {
        // For admin-created campaigns, populate from User
        const user = await User.findById(campaignObj.createdBy).select('username email');
        campaignObj.createdBy = user ? {
          _id: user._id,
          username: user.username,
          email: user.email,
          type: 'admin'
        } : null;
      }

      return campaignObj;
    }));

    res.json(campaignsWithCreator);
  } catch (error) {
    console.error('Error fetching admin campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create campaign (admin)
router.post('/admin/campaigns', authenticateToken, isAdmin, upload.single('thumbnailImage'), async (req, res) => {
  try {
    const {
      title,
      description,
      artistId,
      youtubeUrl,
      spotifyUrl,
      appleUrl,
      otherDspUrls,
      prizePoolAmount,
      prizePoolCurrency,
      maxParticipants,
      maxWinners,
      startDate,
      endDate,
      allowedPlatforms,
      submissionGuidelines,
      prizeDistribution,
      requireYouTubeWatch,
      requireShareAction,
      shareRewardUsd,
      shareRewardJamz,
      shareRewardNgn,
      shareRewardAed,
      watchRewardUsd,
      watchRewardJamz,
      watchRewardNgn,
      watchRewardAed,
      maxReferralRewards,
      maxReferralRewardsPerUser,
      isActive
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Thumbnail image is required' });
    }

    // Validate prize distribution
    const parsedPrizeDistribution = JSON.parse(prizeDistribution);
    const totalDistributed = parsedPrizeDistribution.reduce((sum, prize) => sum + parseFloat(prize.amount), 0);
    const prizePoolAmountFloat = parseFloat(prizePoolAmount);

    if (Math.abs(totalDistributed - prizePoolAmountFloat) > 0.01) { // Allow for small floating point differences
      return res.status(400).json({
        message: `Total prize distribution ($${totalDistributed}) must equal the prize pool amount ($${prizePoolAmountFloat})`
      });
    }

    const campaign = new UnifiedCampaign({
      title,
      description,
      artistId,
      youtubeUrl,
      spotifyUrl,
      appleUrl,
      otherDspUrls: otherDspUrls ? JSON.parse(otherDspUrls) : {},
      thumbnailImage: req.file.filename,
      prizePool: {
        amount: parseFloat(prizePoolAmount),
        currency: prizePoolCurrency
      },
      maxParticipants: parseInt(maxParticipants),
      maxWinners: parseInt(maxWinners),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allowedPlatforms: JSON.parse(allowedPlatforms),
      submissionGuidelines,
      prizeDistribution: JSON.parse(prizeDistribution),
      prerequisites: {
        requireYouTubeWatch: requireYouTubeWatch === 'true',
        requireShareAction: requireShareAction === 'true'
      },
      shareRewardUsd: parseFloat(shareRewardUsd) || 0,
      shareRewardJamz: parseFloat(shareRewardJamz) || 0,
      shareRewardNgn: parseFloat(shareRewardNgn) || 0,
      shareRewardAed: parseFloat(shareRewardAed) || 0,
      watchRewardUsd: parseFloat(watchRewardUsd) || 0,
      watchRewardJamz: parseFloat(watchRewardJamz) || 0,
      watchRewardNgn: parseFloat(watchRewardNgn) || 0,
      watchRewardAed: parseFloat(watchRewardAed) || 0,
      maxReferralRewards: parseInt(maxReferralRewards) || 100,
      maxReferralRewardsPerUser: parseInt(maxReferralRewardsPerUser) || 5,
      isActive: isActive === 'true',
      createdBy: req.user._id
    });

    await campaign.save();

    const populatedCampaign = await UnifiedCampaign.findById(campaign._id)
      .populate('artistId', 'name imageUrl socialMedia')
      .populate('createdBy', 'username email');

    res.status(201).json(populatedCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update campaign (admin)
router.put('/admin/campaigns/:id', authenticateToken, isAdmin, upload.single('thumbnailImage'), async (req, res) => {
  try {
    const campaign = await UnifiedCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const {
      title,
      description,
      artistId,
      youtubeUrl,
      spotifyUrl,
      appleUrl,
      otherDspUrls,
      prizePoolAmount,
      prizePoolCurrency,
      maxParticipants,
      maxWinners,
      startDate,
      endDate,
      allowedPlatforms,
      submissionGuidelines,
      prizeDistribution,
      requireYouTubeWatch,
      requireShareAction,
      shareRewardUsd,
      shareRewardJamz,
      shareRewardNgn,
      shareRewardAed,
      watchRewardUsd,
      watchRewardJamz,
      watchRewardNgn,
      watchRewardAed,
      maxReferralRewards,
      maxReferralRewardsPerUser,
      isActive
    } = req.body;

    // Validate prize distribution if provided
    if (prizeDistribution && prizePoolAmount) {
      const parsedPrizeDistribution = JSON.parse(prizeDistribution);
      const totalDistributed = parsedPrizeDistribution.reduce((sum, prize) => sum + parseFloat(prize.amount), 0);
      const prizePoolAmountFloat = parseFloat(prizePoolAmount);

      if (Math.abs(totalDistributed - prizePoolAmountFloat) > 0.01) { // Allow for small floating point differences
        return res.status(400).json({
          message: `Total prize distribution ($${totalDistributed}) must equal the prize pool amount ($${prizePoolAmountFloat})`
        });
      }
    }

    // Update fields
    campaign.title = title;
    campaign.description = description;
    campaign.artistId = artistId;
    campaign.youtubeUrl = youtubeUrl;
    campaign.spotifyUrl = spotifyUrl;
    campaign.appleUrl = appleUrl;
    campaign.otherDspUrls = otherDspUrls ? JSON.parse(otherDspUrls) : campaign.otherDspUrls;
    campaign.prizePool = {
      amount: parseFloat(prizePoolAmount),
      currency: prizePoolCurrency
    };
    campaign.maxParticipants = parseInt(maxParticipants);
    campaign.maxWinners = parseInt(maxWinners);
    campaign.startDate = new Date(startDate);
    campaign.endDate = new Date(endDate);
    campaign.allowedPlatforms = JSON.parse(allowedPlatforms);
    campaign.submissionGuidelines = submissionGuidelines;
    campaign.prizeDistribution = JSON.parse(prizeDistribution);
    campaign.prerequisites = {
      requireYouTubeWatch: requireYouTubeWatch === 'true',
      requireShareAction: requireShareAction === 'true'
    };
    campaign.shareRewardUsd = parseFloat(shareRewardUsd) || 0;
    campaign.shareRewardJamz = parseFloat(shareRewardJamz) || 0;
    campaign.shareRewardNgn = parseFloat(shareRewardNgn) || 0;
    campaign.shareRewardAed = parseFloat(shareRewardAed) || 0;
    campaign.watchRewardUsd = parseFloat(watchRewardUsd) || 0;
    campaign.watchRewardJamz = parseFloat(watchRewardJamz) || 0;
    campaign.watchRewardNgn = parseFloat(watchRewardNgn) || 0;
    campaign.watchRewardAed = parseFloat(watchRewardAed) || 0;
    campaign.maxReferralRewards = parseInt(maxReferralRewards) || 100;
    campaign.maxReferralRewardsPerUser = parseInt(maxReferralRewardsPerUser) || 5;
    campaign.isActive = isActive === 'true';

    // Update thumbnail if new file uploaded
    if (req.file) {
      // Delete old thumbnail
      if (campaign.thumbnailImage) {
        const oldThumbnailPath = path.join(__dirname, '../public/campaign-thumbnails', campaign.thumbnailImage);
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
      campaign.thumbnailImage = req.file.filename;
    }

    await campaign.save();

    const populatedCampaign = await UnifiedCampaign.findById(campaign._id)
      .populate('artistId', 'name imageUrl socialMedia')
      .populate('createdBy', 'username email');

    res.json(populatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete campaign (admin)
router.delete('/admin/campaigns/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const campaign = await UnifiedCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete thumbnail file
    if (campaign.thumbnailImage) {
      const thumbnailPath = path.join(__dirname, '../public/campaign-thumbnails', campaign.thumbnailImage);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    await UnifiedCampaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
