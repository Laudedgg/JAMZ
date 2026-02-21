import express from 'express';
import Share from '../models/share.js';
import Campaign from '../models/campaign.js';
import Wallet from '../models/wallet.js';
import User from '../models/user.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// -----------------------------------------------------------------
// IMPORTANT: Route order matters in Express! More specific routes must come first
// -----------------------------------------------------------------

// Debug endpoint - goes first since it's most specific
router.get('/campaign/debug/:id', authenticateToken, async (req, res) => {
  try {
    // Log everything about the request and the database
    console.log('DEBUG endpoint accessed with ID:', req.params.id);
    console.log('User in request:', req.user);
    
    // Check campaign ID format
    const isValidFormat = req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/);
    console.log('Is valid ID format:', isValidFormat);
    
    // Is the user an admin
    const isAdmin = req.user && req.user.isAdmin === true;
    console.log('Is admin user:', isAdmin);
    
    // Try to find the campaign without additional checks
    let campaign = null;
    try {
      campaign = await Campaign.findById(req.params.id);
    } catch (err) {
      console.log('Error finding campaign:', err.message);
    }
    
    // Return all details for debugging
    return res.json({
      requestInfo: {
        campaignId: req.params.id,
        isValidFormat: isValidFormat,
        userIsAdmin: isAdmin,
        userId: req.user?._id?.toString()
      },
      campaignDetails: campaign ? {
        id: campaign._id?.toString(),
        title: campaign.title,
        exists: true
      } : { exists: false },
      message: "Debug information successfully retrieved"
    });
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// IMPORTANT! Test route at the top of the file with a simple response
// This MUST go before any /campaign/* routes
router.get('/test', (req, res) => {
  console.log('****************** TEST ROUTE HIT ******************');
  return res.json({ success: true, message: 'Test route works!', timestamp: new Date().toISOString() });
});

// Get participants for a campaign (for admin view)
router.get('/campaign/:id/participants', authenticateToken, async (req, res) => {
  try {
    // Ensure the user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }
    
    console.log('Campaign participants route accessed, ID:', req.params.id);
    
    // Find all shares for this campaign
    const shares = await Share.find({ campaignId: req.params.id })
      .populate('userId', 'username email') // Populate user info
      .sort({ createdAt: -1 });
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(shares.map(share => share.userId._id.toString()))];
    
    // Group shares by user
    const participants = uniqueUserIds.map(userId => {
      const userShares = shares.filter(share => 
        share.userId._id.toString() === userId
      );
      
      // Get user details from first share
      const user = userShares[0].userId;
      
      return {
        userId: userId,
        username: user.username || 'Anonymous',
        email: user.email || 'No email',
        shareCount: userShares.length,
        totalRewardUsdt: userShares.reduce((sum, share) => sum + share.rewardUsdt, 0),
        totalRewardJamz: userShares.reduce((sum, share) => sum + share.rewardJamz, 0),
        shares: userShares.map(share => ({
          id: share._id,
          platform: share.platform,
          linkUrl: share.linkUrl,
          approved: share.approved,
          createdAt: share.createdAt
        }))
      };
    });
    
    return res.json({ 
      success: true,
      campaignId: req.params.id,
      participantCount: uniqueUserIds.length,
      shareCount: shares.length,
      participants
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user-specific shares for a campaign - less specific than participants
router.get('/campaign/:id', authenticateToken, async (req, res) => {
  try {
    const shares = await Share.find({ 
      campaignId: req.params.id,
      userId: req.user._id 
    }).sort({ createdAt: -1 });
    res.json(shares);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all shares for the authenticated user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const shares = await Share.find({ userId: req.user._id })
      .populate('campaignId')
      .sort({ createdAt: -1 });
    res.json(shares);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve a share
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);
    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    // Fetch the campaign to check if user is admin or the campaign's artist
    const campaign = await Campaign.findById(share.campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user is admin
    const isAdmin = req.user.isAdmin === true;
    
    // For now, only allow admins to approve shares
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied: Only admins can approve shares' });
    }

    // Update share to approved status
    share.approved = true;
    share.approvedAt = new Date();
    await share.save();

    // Get the user's wallet to add rewards (only if not already rewarded)
    if (!share.rewardsDistributed) {
      const wallet = await Wallet.getOrCreate(share.userId);
      
      // Add USDT reward
      if (campaign.shareRewardUsdt > 0) {
        wallet.usdtBalance += campaign.shareRewardUsdt;
        wallet.transactions.push({
          type: 'reward',
          token: 'USDT',
          amount: campaign.shareRewardUsdt,
          status: 'completed',
          method: 'reward',
          description: `Approved share reward for ${campaign.title}`
        });
      }

      // Add JAMZ reward
      if (campaign.shareRewardJamz > 0) {
        wallet.jamzBalance += campaign.shareRewardJamz;
        wallet.transactions.push({
          type: 'reward',
          token: 'JAMZ',
          amount: campaign.shareRewardJamz,
          status: 'completed',
          method: 'reward',
          description: `Approved share reward for ${campaign.title}`
        });
      }

      // Add NGN reward
      if (campaign.shareRewardNgn > 0) {
        wallet.ngnBalance += campaign.shareRewardNgn;
        wallet.transactions.push({
          type: 'reward',
          token: 'NGN',
          amount: campaign.shareRewardNgn,
          status: 'completed',
          method: 'reward',
          description: `Approved share reward for ${campaign.title}`
        });
      }

      // Add AED reward
      if (campaign.shareRewardAed > 0) {
        wallet.aedBalance += campaign.shareRewardAed;
        wallet.transactions.push({
          type: 'reward',
          token: 'AED',
          amount: campaign.shareRewardAed,
          status: 'completed',
          method: 'reward',
          description: `Approved share reward for ${campaign.title}`
        });
      }
      
      await wallet.save();
      
      // Mark share as rewarded to prevent double rewards
      share.rewardsDistributed = true;
      await share.save();
    }
    
    res.json(share);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new share
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { campaignId, platform, linkUrl } = req.body;
    
    // Validate platform (updated to include more social platforms)
    if (!['twitter', 'facebook', 'copy', 'tiktok', 'instagram', 'youtube'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }
    
    // Get campaign to determine rewards
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Count total shares for this user on this campaign
    const userSharesCount = await Share.countDocuments({
      campaignId,
      userId: req.user._id
    });
    
    // Limit to maximum 3 shares per campaign
    if (userSharesCount >= 3) {
      return res.status(400).json({ message: 'You have already submitted the maximum number of links (3) for this campaign' });
    }
    
    // Create share with rewards from campaign
    const share = new Share({
      campaignId,
      userId: req.user._id,
      platform,
      linkUrl: linkUrl || '',
      rewardUsdt: campaign.shareRewardUsdt,
      rewardJamz: campaign.shareRewardJamz
    });
    
    const newShare = await share.save();
    
    // Add rewards to user's wallet
    const wallet = await Wallet.getOrCreate(req.user._id);
    
    // Add USDT reward
    if (campaign.shareRewardUsdt > 0) {
      wallet.usdtBalance += campaign.shareRewardUsdt;
      wallet.transactions.push({
        type: 'reward',
        token: 'USDT',
        amount: campaign.shareRewardUsdt,
        status: 'completed',
        method: 'reward'
      });
    }

    // Add JAMZ reward
    if (campaign.shareRewardJamz > 0) {
      wallet.jamzBalance += campaign.shareRewardJamz;
      wallet.transactions.push({
        type: 'reward',
        token: 'JAMZ',
        amount: campaign.shareRewardJamz,
        status: 'completed',
        method: 'reward'
      });
    }

    // Add NGN reward
    if (campaign.shareRewardNgn > 0) {
      wallet.ngnBalance += campaign.shareRewardNgn;
      wallet.transactions.push({
        type: 'reward',
        token: 'NGN',
        amount: campaign.shareRewardNgn,
        status: 'completed',
        method: 'reward'
      });
    }

    // Add AED reward
    if (campaign.shareRewardAed > 0) {
      wallet.aedBalance += campaign.shareRewardAed;
      wallet.transactions.push({
        type: 'reward',
        token: 'AED',
        amount: campaign.shareRewardAed,
        status: 'completed',
        method: 'reward'
      });
    }
    
    await wallet.save();
    
    res.status(201).json(newShare);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
