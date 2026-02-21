import express from 'express';
import Challenge from '../models/challenge.js';
import Campaign from '../models/campaign.js';
import Wallet from '../models/wallet.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all challenges for a user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user._id })
      .populate('campaignId')
      .sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all challenges for a campaign
router.get('/campaign/:campaignId', authenticateToken, async (req, res) => {
  try {
    const challenges = await Challenge.find({ campaignId: req.params.campaignId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all challenges for a campaign (participants view - admin only)
router.get('/campaign/:campaignId/participants', authenticateToken, async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can view challenge participants' });
    }
    
    console.log(`Fetching challenge participants for campaign: ${req.params.campaignId}`);
    
    const challenges = await Challenge.find({ campaignId: req.params.campaignId })
      .populate('userId', 'email username')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${challenges.length} challenge participants`);
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenge participants:', error);
    res.status(500).json({ message: error.message });
  }
});

// Submit a new challenge
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { campaignId, platform, videoUrl } = req.body;

    // Validate URL based on platform
    const urlPattern = {
      tiktok: /^https:\/\/(www\.)?(vm\.)?tiktok\.com\//,
      instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel)\//,
      youtube: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)|^https:\/\/youtu\.be\//
    };

    if (!urlPattern[platform].test(videoUrl)) {
      return res.status(400).json({ message: `Invalid ${platform} URL format` });
    }

    // Get campaign to set reward amounts
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Count total challenges for this user on this campaign
    const userChallengesCount = await Challenge.countDocuments({
      campaignId,
      userId: req.user._id
    });
    
    // Limit to maximum 3 challenges per campaign
    if (userChallengesCount >= 3) {
      return res.status(400).json({ message: 'You have already submitted the maximum number of challenges (3) for this campaign' });
    }
    
    // Check if user has already submitted a challenge for this platform
    const existingChallenge = await Challenge.findOne({
      campaignId,
      userId: req.user._id,
      platform
    });

    if (existingChallenge) {
      return res.status(400).json({ message: `You have already submitted a ${platform} challenge for this campaign` });
    }

    const challenge = new Challenge({
      campaignId,
      userId: req.user._id,
      platform,
      videoUrl,
      rewardUsdt: campaign.challengeRewardUsdt,
      rewardJamz: campaign.challengeRewardJamz
    });

    const newChallenge = await challenge.save();
    const populatedChallenge = await Challenge.findById(newChallenge._id)
      .populate('campaignId')
      .populate('userId', 'email');

    res.status(201).json(populatedChallenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update challenge status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can update challenge status' });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // If the challenge is being approved and wasn't already approved
    if (status === 'approved' && challenge.status !== 'approved') {
      // Add rewards to user's wallet
      const wallet = await Wallet.getOrCreate(challenge.userId);
      
      // Add USDT reward
      if (challenge.rewardUsdt > 0) {
        wallet.usdtBalance += challenge.rewardUsdt;
        wallet.transactions.push({
          type: 'reward',
          token: 'USDT',
          amount: challenge.rewardUsdt,
          status: 'completed',
          method: 'reward'
        });
      }
      
      // Add JAMZ reward
      if (challenge.rewardJamz > 0) {
        wallet.jamzBalance += challenge.rewardJamz;
        wallet.transactions.push({
          type: 'reward',
          token: 'JAMZ',
          amount: challenge.rewardJamz,
          status: 'completed',
          method: 'reward'
        });
      }
      
      await wallet.save();
    }

    challenge.status = status;
    await challenge.save();

    const populatedChallenge = await Challenge.findById(challenge._id)
      .populate('campaignId')
      .populate('userId', 'email');

    res.json(populatedChallenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
