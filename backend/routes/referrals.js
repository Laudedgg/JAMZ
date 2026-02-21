import express from 'express';
import Referral from '../models/referral.js';
import Campaign from '../models/campaign.js';
import Wallet from '../models/wallet.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Generate referral link for a campaign
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    // Get campaign to determine rewards and showcase
    const campaign = await Campaign.findById(campaignId).populate('showcaseId');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (!campaign.showcaseId) {
      return res.status(400).json({ message: 'Campaign must have an associated showcase' });
    }
    
    // Generate unique referral code
    const referralCode = uuidv4();
    
    // Create referral record
    const referral = new Referral({
      referrerId: req.user._id,
      campaignId,
      showcaseId: campaign.showcaseId._id,
      referralCode,
      rewardUsd: campaign.shareRewardUsd || 0,
      rewardJamz: campaign.shareRewardJamz || 0,
      rewardNgn: campaign.shareRewardNgn || 0,
      rewardAed: campaign.shareRewardAed || 0
    });
    
    await referral.save();
    
    // Generate referral URL
    const referralUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/open-verse/${campaign.showcaseId._id}?ref=${referralCode}`;
    
    res.json({
      referralCode,
      referralUrl,
      campaign: {
        title: campaign.title,
        showcase: campaign.showcaseId.title
      },
      rewards: {
        usd: referral.rewardUsd,
        jamz: referral.rewardJamz,
        ngn: referral.rewardNgn,
        aed: referral.rewardAed
      }
    });
  } catch (error) {
    console.error('Error generating referral:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track referral join (when someone clicks the referral link)
router.post('/track-join', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    
    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required' });
    }
    
    // Find the referral
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    
    // Don't allow self-referral
    if (referral.referrerId.toString() === userId) {
      return res.status(400).json({ message: 'Cannot refer yourself' });
    }
    
    // Update referral with referred user info
    if (!referral.referredUserId && referral.status === 'pending') {
      referral.referredUserId = userId;
      referral.joinedAt = new Date();
      referral.status = 'joined';
      await referral.save();
    }
    
    res.json({ message: 'Referral tracked successfully' });
  } catch (error) {
    console.error('Error tracking referral join:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track referral completion (when referred user completes showcase)
router.post('/track-completion', authenticateToken, async (req, res) => {
  try {
    const { showcaseId } = req.body;
    
    // Find any pending referrals for this user and showcase
    const referrals = await Referral.find({
      referredUserId: req.user._id,
      showcaseId,
      status: 'joined'
    }).populate('referrerId');
    
    for (const referral of referrals) {
      // Mark as completed
      referral.completedAt = new Date();
      referral.status = 'completed';
      await referral.save();
      
      // Award rewards to referrer
      const wallet = await Wallet.getOrCreate(referral.referrerId._id);
      
      // Add USD reward
      if (referral.rewardUsd > 0) {
        wallet.usdBalance += referral.rewardUsd;
        wallet.transactions.push({
          type: 'reward',
          token: 'USD',
          amount: referral.rewardUsd,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for ${req.user.username || req.user.email} completing showcase`
        });
      }
      
      // Add JAMZ reward
      if (referral.rewardJamz > 0) {
        wallet.jamzBalance += referral.rewardJamz;
        wallet.transactions.push({
          type: 'reward',
          token: 'JAMZ',
          amount: referral.rewardJamz,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for ${req.user.username || req.user.email} completing showcase`
        });
      }
      
      // Add NGN reward
      if (referral.rewardNgn > 0) {
        wallet.ngnBalance += referral.rewardNgn;
        wallet.transactions.push({
          type: 'reward',
          token: 'NGN',
          amount: referral.rewardNgn,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for ${req.user.username || req.user.email} completing showcase`
        });
      }
      
      // Add AED reward
      if (referral.rewardAed > 0) {
        wallet.aedBalance += referral.rewardAed;
        wallet.transactions.push({
          type: 'reward',
          token: 'AED',
          amount: referral.rewardAed,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for ${req.user.username || req.user.email} completing showcase`
        });
      }
      
      await wallet.save();
      
      // Mark rewards as distributed
      referral.rewardsDistributed = true;
      referral.rewardsDistributedAt = new Date();
      referral.status = 'rewarded';
      await referral.save();
    }
    
    res.json({ 
      message: 'Referral completion tracked successfully',
      rewardsAwarded: referrals.length
    });
  } catch (error) {
    console.error('Error tracking referral completion:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's referral stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const referrals = await Referral.find({ referrerId: req.user._id })
      .populate('campaignId', 'title')
      .populate('showcaseId', 'title')
      .sort({ createdAt: -1 });
    
    const stats = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
      totalRewardsEarned: {
        usd: referrals.filter(r => r.rewardsDistributed).reduce((sum, r) => sum + r.rewardUsd, 0),
        jamz: referrals.filter(r => r.rewardsDistributed).reduce((sum, r) => sum + r.rewardJamz, 0),
        ngn: referrals.filter(r => r.rewardsDistributed).reduce((sum, r) => sum + r.rewardNgn, 0),
        aed: referrals.filter(r => r.rewardsDistributed).reduce((sum, r) => sum + r.rewardAed, 0)
      },
      referrals: referrals.map(r => ({
        _id: r._id,
        campaign: r.campaignId?.title,
        showcase: r.showcaseId?.title,
        status: r.status,
        sharedAt: r.sharedAt,
        joinedAt: r.joinedAt,
        completedAt: r.completedAt,
        rewards: {
          usd: r.rewardUsd,
          jamz: r.rewardJamz,
          ngn: r.rewardNgn,
          aed: r.rewardAed
        },
        rewardsDistributed: r.rewardsDistributed
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to track referral completion (can be called from other routes)
export const trackReferralCompletion = async (userId, showcaseId) => {
  try {
    // Find any pending referrals for this user and showcase
    const referrals = await Referral.find({
      referredUserId: userId,
      showcaseId,
      status: 'joined'
    }).populate('referrerId').populate('campaignId');

    for (const referral of referrals) {
      const campaign = referral.campaignId;

      // Check campaign-wide referral limit
      if (campaign.totalReferralRewardsGiven >= campaign.maxReferralRewards) {
        console.log(`Campaign ${campaign.title} has reached maximum referral rewards (${campaign.maxReferralRewards})`);
        // Mark as completed but don't give rewards
        referral.completedAt = new Date();
        referral.status = 'completed';
        await referral.save();
        continue;
      }

      // Check per-user referral limit
      const userReferralCount = await Referral.countDocuments({
        referrerId: referral.referrerId._id,
        campaignId: referral.campaignId._id,
        status: 'rewarded'
      });

      if (userReferralCount >= campaign.maxReferralRewardsPerUser) {
        console.log(`User ${referral.referrerId._id} has reached maximum referral rewards per user (${campaign.maxReferralRewardsPerUser}) for campaign ${campaign.title}`);
        // Mark as completed but don't give rewards
        referral.completedAt = new Date();
        referral.status = 'completed';
        await referral.save();
        continue;
      }
      // Mark as completed
      referral.completedAt = new Date();
      referral.status = 'completed';
      await referral.save();

      // Award rewards to referrer
      const wallet = await Wallet.getOrCreate(referral.referrerId._id);

      // Add USD reward
      if (referral.rewardUsd > 0) {
        wallet.usdBalance += referral.rewardUsd;
        wallet.transactions.push({
          type: 'reward',
          token: 'USD',
          amount: referral.rewardUsd,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for user completing showcase`
        });
      }

      // Add JAMZ reward
      if (referral.rewardJamz > 0) {
        wallet.jamzBalance += referral.rewardJamz;
        wallet.transactions.push({
          type: 'reward',
          token: 'JAMZ',
          amount: referral.rewardJamz,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for user completing showcase`
        });
      }

      // Add NGN reward
      if (referral.rewardNgn > 0) {
        wallet.ngnBalance += referral.rewardNgn;
        wallet.transactions.push({
          type: 'reward',
          token: 'NGN',
          amount: referral.rewardNgn,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for user completing showcase`
        });
      }

      // Add AED reward
      if (referral.rewardAed > 0) {
        wallet.aedBalance += referral.rewardAed;
        wallet.transactions.push({
          type: 'reward',
          token: 'AED',
          amount: referral.rewardAed,
          status: 'completed',
          method: 'referral',
          description: `Referral reward for user completing showcase`
        });
      }

      await wallet.save();

      // Mark rewards as distributed
      referral.rewardsDistributed = true;
      referral.rewardsDistributedAt = new Date();
      referral.status = 'rewarded';
      await referral.save();

      // Increment campaign's total referral rewards counter
      await Campaign.findByIdAndUpdate(
        referral.campaignId._id,
        { $inc: { totalReferralRewardsGiven: 1 } }
      );

      console.log(`Referral rewards distributed: ${referral.rewardNgn} NGN to user ${referral.referrerId._id} (${campaign.totalReferralRewardsGiven + 1}/${campaign.maxReferralRewards})`);
    }

    return referrals.length;
  } catch (error) {
    console.error('Error tracking referral completion:', error);
    throw error;
  }
};

export default router;
