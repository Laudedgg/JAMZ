import express from 'express';
import mongoose from 'mongoose';
import MFTCampaign from '../models/mftCampaign.js';
import MFTHolding from '../models/mftHolding.js';
import MFTTransaction from '../models/mftTransaction.js';
import RoyaltyDistribution from '../models/royaltyDistribution.js';
import Wallet from '../models/wallet.js';
import ArtistWallet from '../models/artistWallet.js';
import CampaignComment from '../models/campaignComment.js';
import { authenticateToken, optionalAuth, isArtist, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all active campaigns (public)
router.get('/campaigns', optionalAuth, async (req, res) => {
  try {
    const { 
      status = 'active', 
      sort = 'newest', 
      genre, 
      featured,
      limit = 20,
      page = 1 
    } = req.query;

    const query = {};
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }
    
    // Campaign type filter
    if (req.query.campaignType && ['human', 'ai_agent'].includes(req.query.campaignType)) {
      query.campaignType = req.query.campaignType;
    }

    // Genre filter
    if (genre) {
      query.genre = genre;
    }
    
    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'ending':
        sortOption = { endDate: 1 };
        break;
      case 'funding':
        sortOption = { currentFunding: -1 };
        break;
      case 'popular':
        sortOption = { investorCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await MFTCampaign.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('artistId', 'name imageUrl')
      .populate('trackId', 'title coverImage');

    const total = await MFTCampaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get featured campaigns
router.get('/campaigns/featured', async (req, res) => {
  try {
    const campaigns = await MFTCampaign.find({ 
      status: 'active', 
      isFeatured: true 
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('artistId', 'name imageUrl');

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single campaign by ID
router.get('/campaigns/:id', optionalAuth, async (req, res) => {
  try {
    const campaign = await MFTCampaign.findById(req.params.id)
      .populate('artistId', 'name imageUrl bio socialMedia')
      .populate('trackId', 'title coverImage audioUrl');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get recent transactions
    const recentTransactions = await MFTTransaction.getCampaignHistory(req.params.id, 10);

    // Get holder count
    const holderCount = await MFTHolding.countDocuments({ 
      campaignId: req.params.id, 
      quantity: { $gt: 0 } 
    });

    // Check if user holds MFTs
    let userHolding = null;
    if (req.user) {
      userHolding = await MFTHolding.findOne({ 
        campaignId: req.params.id, 
        userId: req.user._id 
      });
    }

    res.json({
      campaign,
      recentTransactions,
      holderCount,
      userHolding
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get campaign transaction history
router.get('/campaigns/:id/transactions', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const transactions = await MFTTransaction.getCampaignHistory(req.params.id, parseInt(limit));
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get campaign holders (leaderboard)
router.get('/campaigns/:id/holders', async (req, res) => {
  try {
    const holders = await MFTHolding.find({
      campaignId: req.params.id,
      quantity: { $gt: 0 }
    })
      .sort({ quantity: -1 })
      .limit(50)
      .populate('userId', 'username');

    res.json(holders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== USER AUTHENTICATED ROUTES ====================

// Buy MFTs from campaign
router.post('/campaigns/:id/buy', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // Get campaign
    const campaign = await MFTCampaign.findById(req.params.id).session(session);
    if (!campaign) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Campaign is not active' });
    }

    if (campaign.remainingSupply < quantity) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not enough MFTs available' });
    }

    const totalCost = quantity * campaign.mftPrice;

    // Check user wallet balance
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet || wallet.balances.usdt < totalCost) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct from wallet
    wallet.balances.usdt -= totalCost;
    await wallet.save({ session });

    // Update campaign
    campaign.currentFunding += totalCost;
    campaign.soldSupply += quantity;

    // Check if this is a new investor
    const existingHolding = await MFTHolding.findOne({ campaignId: campaign._id, userId }).session(session);
    if (!existingHolding || existingHolding.quantity === 0) {
      campaign.investorCount += 1;
    }

    // Check if funding goal reached
    if (campaign.currentFunding >= campaign.fundingGoal && campaign.status === 'active') {
      campaign.status = 'funded';
    }

    await campaign.save({ session });

    // Create or update holding
    let holding = await MFTHolding.getOrCreate(campaign._id, userId);
    holding.addMFTs(quantity, campaign.mftPrice);
    await holding.save({ session });

    // Create transaction record
    const transaction = new MFTTransaction({
      type: 'buy',
      campaignId: campaign._id,
      fromUserId: null, // Primary sale
      toUserId: userId,
      quantity,
      pricePerMFT: campaign.mftPrice,
      totalAmount: totalCost,
      platformFee: 0, // No fee on primary sale
      netAmount: totalCost,
      status: 'completed',
      paymentMethod: 'wallet'
    });
    await transaction.save({ session });

    await session.commitTransaction();

    res.json({
      message: 'MFTs purchased successfully',
      transaction,
      holding,
      campaign: {
        soldSupply: campaign.soldSupply,
        currentFunding: campaign.currentFunding,
        status: campaign.status
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error buying MFTs:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Get user's portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const holdings = await MFTHolding.find({
      userId: req.user._id,
      quantity: { $gt: 0 }
    })
      .populate({
        path: 'campaignId',
        populate: { path: 'artistId', select: 'name imageUrl' }
      });

    // Calculate totals
    let totalInvested = 0;
    let totalRoyaltiesEarned = 0;

    holdings.forEach(h => {
      totalInvested += h.totalInvested;
      totalRoyaltiesEarned += h.totalRoyaltiesEarned;
    });

    res.json({
      holdings,
      summary: {
        totalHoldings: holdings.length,
        totalInvested,
        totalRoyaltiesEarned
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const transactions = await MFTTransaction.getUserHistory(req.user._id, parseInt(limit));
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's royalty distributions
router.get('/royalties', authenticateToken, async (req, res) => {
  try {
    const distributions = await RoyaltyDistribution.getUserDistributions(req.user._id);

    // Extract user-specific distribution amounts
    const userDistributions = distributions.map(d => {
      const userDist = d.distributions.find(
        dist => dist.userId.toString() === req.user._id.toString()
      );
      return {
        campaignId: d.campaignId,
        distributedAt: d.createdAt,
        mftCount: userDist?.mftCount || 0,
        amount: userDist?.amount || 0,
        credited: userDist?.credited || false
      };
    });

    res.json(userDistributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ARTIST ROUTES ====================

// Get artist's campaigns
router.get('/artist/campaigns', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaigns = await MFTCampaign.find({ artistId: req.user.artistId })
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new campaign (artist only)
router.post('/artist/campaigns', authenticateToken, isArtist, async (req, res) => {
  try {
    const {
      title,
      description,
      coverImage,
      trackId,
      spotifyUrl,
      youtubeUrl,
      appleMusicUrl,
      fundingGoal,
      royaltyPercentage,
      mftPrice,
      totalSupply,
      startDate,
      endDate,
      genre,
      tags
    } = req.body;

    // Validation
    if (!title || !description || !coverImage || !fundingGoal || !royaltyPercentage || !mftPrice || !totalSupply) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (royaltyPercentage < 1 || royaltyPercentage > 50) {
      return res.status(400).json({ message: 'Royalty percentage must be between 1% and 50%' });
    }

    const campaign = new MFTCampaign({
      artistId: req.user.artistId,
      trackId: trackId || null,
      title,
      description,
      coverImage,
      spotifyUrl: spotifyUrl || '',
      youtubeUrl: youtubeUrl || '',
      appleMusicUrl: appleMusicUrl || '',
      fundingGoal,
      royaltyPercentage,
      mftPrice,
      totalSupply,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      genre: genre || '',
      tags: tags || [],
      status: 'draft'
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update campaign (artist only, before launch)
router.put('/artist/campaigns/:id', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaign = await MFTCampaign.findOne({
      _id: req.params.id,
      artistId: req.user.artistId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ message: 'Can only edit draft campaigns' });
    }

    const allowedUpdates = [
      'title', 'description', 'coverImage', 'trackId',
      'spotifyUrl', 'youtubeUrl', 'appleMusicUrl',
      'fundingGoal', 'royaltyPercentage', 'mftPrice', 'totalSupply',
      'startDate', 'endDate', 'genre', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Launch campaign (artist only)
router.post('/artist/campaigns/:id/launch', authenticateToken, isArtist, async (req, res) => {
  try {
    const campaign = await MFTCampaign.findOne({
      _id: req.params.id,
      artistId: req.user.artistId
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ message: 'Campaign already launched' });
    }

    campaign.status = 'active';
    campaign.startDate = new Date();
    await campaign.save();

    res.json({ message: 'Campaign launched', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Distribute royalties (artist only)
router.post('/artist/campaigns/:id/distribute', authenticateToken, isArtist, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, source = 'manual', periodStart, periodEnd, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const campaign = await MFTCampaign.findOne({
      _id: req.params.id,
      artistId: req.user.artistId
    }).session(session);

    if (!campaign) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!['funded', 'completed'].includes(campaign.status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Campaign must be funded to distribute royalties' });
    }

    // Check artist wallet balance
    const artistWallet = await ArtistWallet.findOne({ artistId: req.user.artistId }).session(session);
    if (!artistWallet || artistWallet.balances.usdt < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Get all MFT holders
    const holdings = await MFTHolding.find({
      campaignId: campaign._id,
      quantity: { $gt: 0 }
    }).session(session);

    if (holdings.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No MFT holders to distribute to' });
    }

    // Calculate total MFTs held
    const totalMFTs = holdings.reduce((sum, h) => sum + h.quantity, 0);

    // Calculate royalty share based on campaign percentage
    const royaltyShare = amount * (campaign.royaltyPercentage / 100);
    const platformFee = royaltyShare * 0.05; // 5% platform fee
    const netDistributed = royaltyShare - platformFee;
    const amountPerMFT = netDistributed / totalMFTs;

    // Create distribution records
    const distributions = [];
    for (const holding of holdings) {
      const userAmount = amountPerMFT * holding.quantity;
      distributions.push({
        userId: holding.userId,
        mftCount: holding.quantity,
        amount: userAmount,
        credited: false
      });

      // Credit user wallet
      const userWallet = await Wallet.findOne({ userId: holding.userId }).session(session);
      if (userWallet) {
        userWallet.balances.usdt += userAmount;
        await userWallet.save({ session });
        distributions[distributions.length - 1].credited = true;
        distributions[distributions.length - 1].creditedAt = new Date();
      }

      // Update holding royalties earned
      holding.addRoyalties(userAmount);
      await holding.save({ session });
    }

    // Deduct from artist wallet
    artistWallet.balances.usdt -= royaltyShare;
    await artistWallet.save({ session });

    // Update campaign total royalties
    campaign.totalRoyaltiesDistributed += netDistributed;
    await campaign.save({ session });

    // Create distribution record
    const distribution = new RoyaltyDistribution({
      campaignId: campaign._id,
      artistId: req.user.artistId,
      totalAmount: amount,
      platformFee,
      netDistributedAmount: netDistributed,
      totalMFTsAtDistribution: totalMFTs,
      amountPerMFT,
      distributions,
      status: 'completed',
      source,
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      notes: notes || '',
      processedAt: new Date()
    });
    await distribution.save({ session });

    await session.commitTransaction();

    res.json({
      message: 'Royalties distributed successfully',
      distribution: {
        totalAmount: amount,
        royaltyShare,
        platformFee,
        netDistributed,
        holdersCount: holdings.length,
        amountPerMFT
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error distributing royalties:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// ==================== AI AGENT ARTIST (AAA) ROUTES ====================

// Get user's AI agent campaigns
router.get('/ai-agent/campaigns', authenticateToken, async (req, res) => {
  try {
    const campaigns = await MFTCampaign.find({
      campaignType: 'ai_agent',
      'aiAgent.creatorUserId': req.user._id
    }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new AI agent campaign
router.post('/ai-agent/campaigns', authenticateToken, async (req, res) => {
  try {
    const {
      agentName,
      agentAvatar,
      agentBio,
      prompt,
      audioUrl,
      title,
      description,
      coverImage,
      fundingGoal,
      royaltyPercentage,
      mftPrice,
      totalSupply,
      startDate,
      endDate,
      genre,
      tags
    } = req.body;

    if (!agentName || !title || !description || !coverImage || !fundingGoal || !royaltyPercentage || !mftPrice || !totalSupply) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (royaltyPercentage < 1 || royaltyPercentage > 50) {
      return res.status(400).json({ message: 'Royalty percentage must be between 1% and 50%' });
    }

    const campaign = new MFTCampaign({
      artistId: null,
      campaignType: 'ai_agent',
      aiAgent: {
        creatorUserId: req.user._id,
        agentName,
        agentAvatar: agentAvatar || '',
        agentBio: agentBio || '',
        prompt: prompt || '',
        audioUrl: audioUrl || '',
        generationStatus: audioUrl ? 'completed' : 'none'
      },
      title,
      description,
      coverImage,
      fundingGoal,
      royaltyPercentage,
      mftPrice,
      totalSupply,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      genre: genre || '',
      tags: tags || [],
      status: 'draft'
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating AI agent campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update AI agent campaign (draft only)
router.put('/ai-agent/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await MFTCampaign.findOne({
      _id: req.params.id,
      campaignType: 'ai_agent',
      'aiAgent.creatorUserId': req.user._id
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ message: 'Can only edit draft campaigns' });
    }

    const allowedUpdates = [
      'title', 'description', 'coverImage',
      'fundingGoal', 'royaltyPercentage', 'mftPrice', 'totalSupply',
      'startDate', 'endDate', 'genre', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    // Update AI agent specific fields
    const agentFields = ['agentName', 'agentAvatar', 'agentBio', 'prompt', 'audioUrl'];
    agentFields.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign.aiAgent[field] = req.body[field];
      }
    });

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Launch AI agent campaign
router.post('/ai-agent/campaigns/:id/launch', authenticateToken, async (req, res) => {
  try {
    const campaign = await MFTCampaign.findOne({
      _id: req.params.id,
      campaignType: 'ai_agent',
      'aiAgent.creatorUserId': req.user._id
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ message: 'Campaign already launched' });
    }

    campaign.status = 'active';
    campaign.startDate = new Date();
    await campaign.save();

    res.json({ message: 'Campaign launched', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate AI track (placeholder - wire in actual AI music API later)
router.post('/ai-agent/campaigns/:id/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const campaign = await MFTCampaign.findOne({
      _id: req.params.id,
      campaignType: 'ai_agent',
      'aiAgent.creatorUserId': req.user._id
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.aiAgent.prompt = prompt.trim();
    campaign.aiAgent.generationStatus = 'pending';
    await campaign.save();

    // TODO: Integrate with AI music generation API (e.g., Suno, Udio)
    // For now, return a placeholder response
    res.json({
      message: 'Track generation initiated',
      status: 'pending',
      prompt: prompt.trim(),
      note: 'AI music generation integration coming soon. Upload a track manually in the meantime.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== COMMENT ROUTES ====================

// Get comments for a campaign (public)
router.get('/campaigns/:id/comments', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const comments = await CampaignComment.find({ campaignId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username walletAddress');
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Post a comment on a campaign (authenticated)
router.post('/campaigns/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: 'Comment must be 500 characters or less' });
    }

    const campaign = await MFTCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const comment = await CampaignComment.create({
      campaignId: req.params.id,
      userId: req.user.userId,
      text: text.trim()
    });

    const populated = await comment.populate('userId', 'username walletAddress');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

