import express from 'express';
import Campaign from '../models/campaign.js';

const router = express.Router();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate({
        path: 'artistId',
        select: 'name imageUrl'
      })
      .populate({
        path: 'showcaseId',
        select: 'title description status isActive'
      })
      .sort({ order: 1, createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('artistId', 'name imageUrl socialMedia')
      .populate({
        path: 'showcaseId',
        select: 'title description status isActive'
      });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create campaign
router.post('/', async (req, res) => {
  const campaign = new Campaign({
    artistId: req.body.artistId,
    showcaseId: req.body.showcaseId,
    title: req.body.title,
    description: req.body.description,
    youtubeUrl: req.body.youtubeUrl,
    spotifyUrl: req.body.spotifyUrl,
    otherDspUrls: req.body.otherDspUrls,
    challengeRewardUsd: req.body.challengeRewardUsd || req.body.challengeRewardUsdt || 0,
    challengeRewardJamz: req.body.challengeRewardJamz || 0,
    challengeRewardNgn: req.body.challengeRewardNgn || 0,
    challengeRewardAed: req.body.challengeRewardAed || 0,
    shareRewardUsd: req.body.shareRewardUsd || req.body.shareRewardUsdt || 0,
    shareRewardJamz: req.body.shareRewardJamz || 0,
    shareRewardNgn: req.body.shareRewardNgn || 0,
    shareRewardAed: req.body.shareRewardAed || 0,
    watchRewardUsd: req.body.watchRewardUsd || req.body.watchRewardUsdt || 0,
    watchRewardJamz: req.body.watchRewardJamz || 5,
    watchRewardNgn: req.body.watchRewardNgn || 0,
    watchRewardAed: req.body.watchRewardAed || 0,
    maxReferralRewards: req.body.maxReferralRewards || 100,
    maxReferralRewardsPerUser: req.body.maxReferralRewardsPerUser || 5,
    isActive: req.body.isActive,
    startDate: req.body.startDate,
    endDate: req.body.endDate
  });

  try {
    const newCampaign = await campaign.save();
    const populatedCampaign = await Campaign.findById(newCampaign._id).populate('artistId', 'name imageUrl socialMedia');
    res.status(201).json(populatedCampaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update campaign
router.patch('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const updateFields = [
      'artistId', 'title', 'description', 'youtubeUrl', 'spotifyUrl', 'appleUrl',
      'otherDspUrls', 'challengeRewardUsd', 'challengeRewardJamz', 'challengeRewardNgn', 'challengeRewardAed',
      'shareRewardUsd', 'shareRewardJamz', 'shareRewardNgn', 'shareRewardAed',
      'watchRewardUsd', 'watchRewardJamz', 'watchRewardNgn', 'watchRewardAed',
      'maxReferralRewards', 'maxReferralRewardsPerUser', 'isActive', 'startDate', 'endDate',
      'order'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    const updatedCampaign = await campaign.save();
    const populatedCampaign = await Campaign.findById(updatedCampaign._id).populate('artistId', 'name imageUrl socialMedia');
    res.json(populatedCampaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reorder campaigns
router.post('/reorder', async (req, res) => {
  try {
    const { campaignOrders } = req.body;

    if (!Array.isArray(campaignOrders)) {
      return res.status(400).json({ message: 'campaignOrders must be an array' });
    }

    // Update each campaign's order
    const updatePromises = campaignOrders.map(item => {
      if (!item._id || item.order === undefined) {
        throw new Error('Each item must have _id and order');
      }

      return Campaign.findByIdAndUpdate(
        item._id,
        { order: item.order },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    // Get the updated campaigns
    const updatedCampaigns = await Campaign.find().populate({
      path: 'artistId',
      select: 'name imageUrl'
    }).sort({ order: 1, createdAt: -1 });

    res.json(updatedCampaigns);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
