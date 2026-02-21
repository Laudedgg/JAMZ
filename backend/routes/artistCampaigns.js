import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, isArtist } from '../middleware/auth.js';
import Campaign from '../models/campaign.js';
import Challenge from '../models/challenge.js';
import Wallet from '../models/wallet.js';
import UnifiedCampaign from '../models/unifiedCampaign.js';
import ArtistWallet from '../models/artistWallet.js';

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
    cb(null, 'artist-campaign-' + uniqueSuffix + path.extname(file.originalname));
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
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all campaigns for the authenticated artist
router.get('/', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ artistId: req.user.artistId })
      .populate('artistId', 'name imageUrl socialMedia');
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get campaigns created by the artist
router.get('/my-campaigns', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaigns = await UnifiedCampaign.find({
      createdBy: req.user._id,
      createdByArtist: true
    }).sort({ createdAt: -1 });

    const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
      // Get participant count (this would depend on your participation tracking model)
      const participantCount = 0; // Placeholder - implement based on your participation model

      return {
        id: campaign._id,
        title: campaign.title,
        description: campaign.description,
        prizePool: campaign.prizePool,
        maxParticipants: campaign.maxParticipants,
        currentParticipants: participantCount,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        isActive: campaign.isActive,
        createdAt: campaign.createdAt
      };
    }));

    res.json(campaignsWithStats);
  } catch (error) {
    console.error('Error fetching artist campaigns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a specific campaign by ID (must belong to the authenticated artist)
router.get('/:id', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      artistId: req.user.artistId
    }).populate('artistId', 'name imageUrl socialMedia');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or access denied' });
    }
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all challenges for a specific campaign
router.get('/:id/challenges', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      artistId: req.user.artistId
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or access denied' });
    }
    
    const challenges = await Challenge.find({ campaignId: req.params.id })
      .populate('userId', 'email username')
      .sort({ createdAt: -1 });
    
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or reject a challenge
router.patch('/:campaignId/challenges/:challengeId', authenticateToken, isArtist, async (req, res) => {
  const { status, feedback } = req.body;
  const { campaignId, challengeId } = req.params;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Verify campaign belongs to artist
    const campaign = await Campaign.findOne({
      _id: campaignId,
      artistId: req.user.artistId
    }).session(session);
    
    if (!campaign) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Campaign not found or access denied' });
    }
    
    // Find the challenge
    const challenge = await Challenge.findOne({
      _id: challengeId,
      campaignId: campaignId
    }).session(session);
    
    if (!challenge) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Check if challenge is already processed
    if (challenge.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Challenge is already ${challenge.status}` });
    }
    
    // Update challenge status
    challenge.status = status;
    if (feedback) {
      challenge.feedback = feedback;
    }
    await challenge.save({ session });
    
    // If approved, distribute rewards
    if (status === 'approved') {
      // Find or create user wallet
      let wallet = await Wallet.findOne({ userId: challenge.userId }).session(session);
      
      if (!wallet) {
        wallet = new Wallet({
          userId: challenge.userId,
          usdtBalance: 0,
          jamzBalance: 0
        });
      }
      
      // Add rewards to wallet
      wallet.usdtBalance += challenge.rewardUsdt;
      wallet.jamzBalance += challenge.rewardJamz;
      
      await wallet.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      message: `Challenge ${status} successfully`,
      challenge
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
});

// Get campaign statistics
router.get('/:id/stats', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      artistId: req.user.artistId
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or access denied' });
    }
    
    // Get challenge statistics
    const totalChallenges = await Challenge.countDocuments({ campaignId: req.params.id });
    const pendingChallenges = await Challenge.countDocuments({ 
      campaignId: req.params.id,
      status: 'pending'
    });
    const approvedChallenges = await Challenge.countDocuments({ 
      campaignId: req.params.id,
      status: 'approved'
    });
    const rejectedChallenges = await Challenge.countDocuments({ 
      campaignId: req.params.id,
      status: 'rejected'
    });
    
    // Calculate total rewards distributed
    const totalRewards = await Challenge.aggregate([
      { $match: { campaignId: mongoose.Types.ObjectId.createFromHexString(req.params.id), status: 'approved' } },
      { $group: {
          _id: null,
          totalUsdt: { $sum: '$rewardUsdt' },
          totalJamz: { $sum: '$rewardJamz' }
        }
      }
    ]);
    
    const stats = {
      totalChallenges,
      pendingChallenges,
      approvedChallenges,
      rejectedChallenges,
      rewardsDistributed: {
        usdt: totalRewards.length > 0 ? totalRewards[0].totalUsdt : 0,
        jamz: totalRewards.length > 0 ? totalRewards[0].totalJamz : 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new campaign (artist only)
router.post('/create', authenticateToken, isArtist, upload.single('thumbnailImage'), async (req, res) => {
  try {
    const {
      title,
      description,
      youtubeUrl,
      spotifyUrl,
      appleUrl,
      prizePoolAmount,
      prizePoolCurrency = 'USDT',
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
      isActive = true
    } = req.body;

    // Validate required fields
    if (!title || !description || !prizePoolAmount || !maxParticipants || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Title, description, prize pool amount, max participants, start date, and end date are required'
      });
    }

    // Parse JSON fields
    let parsedAllowedPlatforms = ['instagram', 'tiktok', 'youtube'];
    let parsedPrizeDistribution = [
      { rank: 1, amount: prizePoolAmount * 0.5 },
      { rank: 2, amount: prizePoolAmount * 0.3 },
      { rank: 3, amount: prizePoolAmount * 0.2 }
    ];

    try {
      if (allowedPlatforms) parsedAllowedPlatforms = JSON.parse(allowedPlatforms);
      if (prizeDistribution) parsedPrizeDistribution = JSON.parse(prizeDistribution);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON in allowedPlatforms or prizeDistribution' });
    }

    // Get artist wallet
    const wallet = await ArtistWallet.getOrCreate(req.user.artistId);

    // Calculate campaign cost (simplified - base cost + prize pool)
    const baseCost = wallet.campaignPricing.baseCost;
    const totalCost = baseCost + parseFloat(prizePoolAmount);

    // Check if artist has sufficient balance
    if (!wallet.hasSufficientBalance(totalCost, prizePoolCurrency)) {
      return res.status(400).json({
        message: `Insufficient balance. Campaign cost: ${totalCost} ${prizePoolCurrency}. Your balance: ${wallet[prizePoolCurrency.toLowerCase() + 'Balance']} ${prizePoolCurrency}`,
        requiredAmount: totalCost,
        currentBalance: wallet[prizePoolCurrency.toLowerCase() + 'Balance'],
        currency: prizePoolCurrency
      });
    }

    // Handle thumbnail image
    let thumbnailImage = null;
    if (req.file) {
      thumbnailImage = `/campaign-thumbnails/${req.file.filename}`;
    }

    // Create the campaign
    const campaign = new UnifiedCampaign({
      title,
      description,
      artistId: req.user.artistId,
      youtubeUrl: youtubeUrl || '',
      spotifyUrl: spotifyUrl || '',
      appleUrl: appleUrl || '',
      otherDspUrls: {},
      thumbnailImage,
      prizePool: {
        amount: parseFloat(prizePoolAmount),
        currency: prizePoolCurrency
      },
      maxParticipants: parseInt(maxParticipants),
      maxWinners: parseInt(maxWinners) || 3,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allowedPlatforms: parsedAllowedPlatforms,
      submissionGuidelines: submissionGuidelines || '',
      prizeDistribution: parsedPrizeDistribution,
      prerequisites: {
        requireYouTubeWatch: requireYouTubeWatch === 'true',
        requireShareAction: requireShareAction === 'true'
      },
      rewards: {
        share: {
          usd: parseFloat(shareRewardUsd) || 0,
          jamz: parseFloat(shareRewardJamz) || 5,
          ngn: parseFloat(shareRewardNgn) || 0,
          aed: parseFloat(shareRewardAed) || 0
        },
        watch: {
          usd: parseFloat(watchRewardUsd) || 0,
          jamz: parseFloat(watchRewardJamz) || 5,
          ngn: parseFloat(watchRewardNgn) || 0,
          aed: parseFloat(watchRewardAed) || 0
        }
      },
      maxReferralRewards: parseInt(maxReferralRewards) || 100,
      maxReferralRewardsPerUser: parseInt(maxReferralRewardsPerUser) || 5,
      createdBy: req.user._id, // Use the ArtistAuth ID, not the Artist ID
      createdByArtist: true,
      campaignCost: totalCost,
      currency: prizePoolCurrency,
      isActive: isActive === 'true',
      status: 'active'
    });

    await campaign.save();

    // Deduct cost from artist wallet
    const deductedAmount = wallet.deductCampaignCost(
      totalCost,
      prizePoolCurrency,
      campaign._id,
      `Campaign creation: ${title}`
    );

    await wallet.save();

    res.status(201).json({
      message: 'Campaign created successfully!',
      campaign: {
        id: campaign._id,
        title: campaign.title,
        description: campaign.description,
        thumbnailImage: campaign.thumbnailImage,
        prizePool: campaign.prizePool,
        maxParticipants: campaign.maxParticipants,
        maxWinners: campaign.maxWinners,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        isActive: campaign.isActive
      },
      deductedAmount,
      remainingBalance: {
        usdt: wallet.usdtBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        totalUSD: wallet.totalBalanceUSD
      }
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




// Update campaign status (artist only - for their own campaigns)
router.patch('/:id/status', authenticateToken, isArtist, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const campaign = await UnifiedCampaign.findOne({
      _id: req.params.id,
      createdBy: req.user.artistId,
      createdByArtist: true
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or access denied' });
    }

    campaign.status = status;
    campaign.isActive = status === 'active';

    await campaign.save();

    res.json({
      message: 'Campaign status updated successfully',
      campaign: {
        id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        isActive: campaign.isActive
      }
    });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
