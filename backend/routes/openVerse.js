import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import OpenVerseCampaign from '../models/openVerseCampaign.js';
import OpenVerseSubmission from '../models/openVerseSubmission.js';
import ManualShowcaseEntry from '../models/manualShowcaseEntry.js';
import Wallet from '../models/wallet.js';
import Notification from '../models/notification.js';
import { authenticateToken, isAdmin, optionalAuth } from '../middleware/auth.js';
import socialMediaService from '../services/socialMediaService.js';
import { isCodeInText, extractCodesFromText } from '../utils/codeGenerator.js';

const router = express.Router();

// Configure multer for campaign thumbnail uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/media/open-verse';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'campaign-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// PUBLIC ROUTES

// Utility function to update campaign statuses
async function updateCampaignStatuses() {
  try {
    const now = new Date();

    // Update campaigns that should be active
    await OpenVerseCampaign.updateMany(
      {
        status: 'draft',
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      },
      { status: 'active' }
    );

    // Update campaigns that should be ended
    await OpenVerseCampaign.updateMany(
      {
        status: 'active',
        endDate: { $lt: now }
      },
      { status: 'ended' }
    );
  } catch (error) {
    console.error('Error updating campaign statuses:', error);
  }
}

// Debug endpoint to check all campaigns (temporary)
router.get('/campaigns/debug', async (req, res) => {
  try {
    const allCampaigns = await OpenVerseCampaign.find()
      .select('title status isActive startDate endDate createdAt')
      .sort({ createdAt: -1 });

    const now = new Date();
    const debugInfo = allCampaigns.map(campaign => ({
      id: campaign._id,
      title: campaign.title,
      status: campaign.status,
      isActive: campaign.isActive,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      createdAt: campaign.createdAt,
      shouldBeActive: campaign.startDate <= now && campaign.endDate >= now,
      hasEnded: campaign.endDate < now,
      willShowOnPublic: campaign.isActive && ['active', 'ended'].includes(campaign.status)
    }));

    res.json({
      currentTime: now,
      totalCampaigns: allCampaigns.length,
      campaigns: debugInfo
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});


// Debug endpoint to check all submissions
router.get('/submissions/debug', async (req, res) => {
  try {
    const allSubmissions = await OpenVerseSubmission.find()
      .populate('userId', 'username email walletAddress')
      .populate('campaignId', 'title')
      .select('platform contentUrl status createdAt userId campaignId metadata')
      .sort({ createdAt: -1 });

    const submissionsByStatus = {
      pending: allSubmissions.filter(s => s.status === 'pending').length,
      approved: allSubmissions.filter(s => s.status === 'approved').length,
      rejected: allSubmissions.filter(s => s.status === 'rejected').length,
      disqualified: allSubmissions.filter(s => s.status === 'disqualified').length
    };

    res.json({
      totalSubmissions: allSubmissions.length,
      submissionsByStatus,
      recentSubmissions: allSubmissions.slice(0, 10).map(sub => ({
        id: sub._id,
        campaign: sub.campaignId?.title || 'Unknown',
        user: sub.userId?.username || sub.userId?.email || 'Unknown',
        platform: sub.platform,
        status: sub.status,
        createdAt: sub.createdAt,
        hasMetadata: !!sub.metadata
      }))
    });
  } catch (error) {
    console.error('Error in submissions debug endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Quick fix endpoint to activate all campaigns (temporary)
router.post('/campaigns/activate-all', async (req, res) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const result = await OpenVerseCampaign.updateMany(
      {},
      {
        isActive: true,
        status: 'active',
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        endDate: futureDate
      }
    );

    res.json({
      message: 'All campaigns activated with valid dates',
      modifiedCount: result.modifiedCount,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: futureDate
    });
  } catch (error) {
    console.error('Error activating campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Auto-approve all pending submissions (legacy cleanup - new submissions are auto-approved)
router.get('/submissions/auto-approve', async (req, res) => {
  try {
    const result = await OpenVerseSubmission.updateMany(
      { status: 'pending' },
      {
        status: 'approved',
        reviewedAt: new Date(),
        reviewNotes: 'Legacy auto-approval - new submissions are approved by default'
      }
    );

    // Update campaign participant counts
    const submissions = await OpenVerseSubmission.find({ status: 'approved' });
    const campaignCounts = {};

    submissions.forEach(sub => {
      const campaignId = sub.campaignId.toString();
      campaignCounts[campaignId] = (campaignCounts[campaignId] || 0) + 1;
    });

    // Update each campaign's participant count
    for (const [campaignId, count] of Object.entries(campaignCounts)) {
      await OpenVerseCampaign.findByIdAndUpdate(campaignId, {
        totalParticipants: count
      });
    }

    res.json({
      message: 'All pending submissions auto-approved',
      approvedCount: result.modifiedCount,
      campaignCounts
    });
  } catch (error) {
    console.error('Error auto-approving submissions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Manual status update endpoint
router.get('/campaigns/update-statuses', async (req, res) => {
  try {
    await updateCampaignStatuses();

    // Get updated campaigns for verification
    const campaigns = await OpenVerseCampaign.find()
      .select('title status isActive startDate endDate')
      .sort({ createdAt: -1 });

    const now = new Date();
    const summary = campaigns.map(campaign => ({
      id: campaign._id,
      title: campaign.title,
      status: campaign.status,
      isActive: campaign.isActive,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      shouldBeActive: campaign.startDate <= now && campaign.endDate >= now
    }));

    res.json({
      message: 'Campaign statuses updated successfully',
      currentTime: now,
      campaigns: summary
    });
  } catch (error) {
    console.error('Error updating campaign statuses:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET version for easy browser access
router.get('/campaigns/activate-all', async (req, res) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const result = await OpenVerseCampaign.updateMany(
      {},
      {
        isActive: true,
        status: 'active',
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        endDate: futureDate
      }
    );

    res.json({
      message: 'All campaigns activated with valid dates',
      modifiedCount: result.modifiedCount,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: futureDate
    });
  } catch (error) {
    console.error('Error activating campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});


// Fix participant counts for existing campaigns (includes manual showcase entries)
router.get('/campaigns/fix-counts', async (req, res) => {
  try {
    const campaigns = await OpenVerseCampaign.find();
    const results = [];

    for (const campaign of campaigns) {
      // Count total user submissions
      const totalUserSubmissions = await OpenVerseSubmission.countDocuments({
        campaignId: campaign._id
      });

      // Count manual showcase entries
      const totalManualEntries = await ManualShowcaseEntry.countDocuments({
        campaignId: campaign._id,
        status: 'active' // Only count active entries
      });

      // Count unique participants (unique userIds) from submissions
      const uniqueParticipants = await OpenVerseSubmission.distinct('userId', {
        campaignId: campaign._id
      });

      // Total submissions = user submissions + manual entries
      const combinedSubmissions = totalUserSubmissions + totalManualEntries;

      // Total participants = unique users + manual entries (each manual entry counts as 1 participant)
      const combinedParticipants = uniqueParticipants.length + totalManualEntries;

      // Update campaign
      await OpenVerseCampaign.findByIdAndUpdate(campaign._id, {
        totalParticipants: combinedParticipants,
        totalSubmissions: combinedSubmissions
      });

      results.push({
        campaignId: campaign._id,
        title: campaign.title,
        oldParticipants: campaign.totalParticipants,
        newParticipants: combinedParticipants,
        oldSubmissions: campaign.totalSubmissions,
        newSubmissions: combinedSubmissions,
        breakdown: {
          userSubmissions: totalUserSubmissions,
          manualEntries: totalManualEntries,
          uniqueUsers: uniqueParticipants.length
        }
      });
    }

    res.json({
      message: 'Campaign statistics fixed (including manual showcase entries)',
      results
    });
  } catch (error) {
    console.error('Error fixing counts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check manual showcase entries
router.get('/debug/manual-entries', async (req, res) => {
  try {
    const entries = await ManualShowcaseEntry.find()
      .populate('campaignId', 'title')
      .select('campaignId name platform status createdAt');

    const entriesByStatus = {
      active: entries.filter(e => e.status === 'active').length,
      hidden: entries.filter(e => e.status === 'hidden').length,
      featured: entries.filter(e => e.status === 'featured').length
    };

    res.json({
      totalEntries: entries.length,
      entriesByStatus,
      entries: entries.map(entry => ({
        id: entry._id,
        campaign: entry.campaignId?.title || 'Unknown',
        name: entry.name,
        platform: entry.platform,
        status: entry.status,
        createdAt: entry.createdAt
      }))
    });
  } catch (error) {
    console.error('Error in debug manual entries:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all active campaigns (public)
router.get('/campaigns', async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Update campaign statuses before fetching
    await updateCampaignStatuses();

    // Debug: Check all campaigns first
    const allCampaigns = await OpenVerseCampaign.find();
    console.log('🔍 All campaigns in DB:', allCampaigns.map(c => ({
      id: c._id,
      title: c.title,
      status: c.status,
      isActive: c.isActive,
      startDate: c.startDate,
      endDate: c.endDate
    })));

    // Get campaigns that should be visible to public
    const now = new Date();
    const campaigns = await OpenVerseCampaign.find({
      isActive: true,
      $or: [
        // Campaigns with active or ended status
        { status: { $in: ['active', 'ended'] } },
        // OR campaigns that should be active based on dates (even if status is still 'draft')
        {
          status: 'draft',
          startDate: { $lte: now },
          endDate: { $gte: now }
        }
      ]
    })
    .populate('artistId', 'name imageUrl socialMedia')
    .select('-createdBy -winnersSelectedBy -prizesDistributedBy')
    .sort({ createdAt: -1 });

    console.log('🎯 Filtered campaigns for public:', campaigns.length);
    console.log('📋 Public campaigns:', campaigns.map(c => ({
      id: c._id,
      title: c.title,
      status: c.status,
      isActive: c.isActive
    })));

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single campaign details (public)
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await OpenVerseCampaign.findById(req.params.id)
      .populate('artistId', 'name imageUrl socialMedia')
      .select('-createdBy -winnersSelectedBy -prizesDistributedBy');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get campaign submissions (public)
router.get('/campaigns/:id/submissions', optionalAuth, async (req, res) => {
  try {
    const { status = 'approved', includeOwn = 'false' } = req.query;
    const campaignId = req.params.id;

    let query = { campaignId };

    // If user is authenticated and wants to include their own submissions
    if (req.user && includeOwn === 'true') {
      // Show approved submissions + user's own submissions (any status)
      query = {
        campaignId,
        $or: [
          { status: 'approved' },
          { userId: req.user._id }
        ]
      };
    } else {
      // Public view: only approved submissions
      query.status = status;
    }

    const submissions = await OpenVerseSubmission.find(query)
      .populate('userId', 'username walletAddress')
      .select('-reviewNotes -submissionIp -validationErrors')
      .sort({ createdAt: -1 });

    console.log(`Fetching submissions for campaign ${campaignId}:`, {
      totalFound: submissions.length,
      query,
      userAuthenticated: !!req.user,
      includeOwn
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get campaign showcase (combines submissions and manual entries) (public)
router.get('/campaigns/:id/showcase', optionalAuth, async (req, res) => {
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
        .populate('userId', 'username walletAddress')
        .select('-reviewNotes -submissionIp -validationErrors')
        .sort({ createdAt: -1 }),

      ManualShowcaseEntry.find({
        campaignId,
        status: { $in: ['active', 'featured'] }
      })
        .populate('createdBy', 'username email')
        .sort({ isFeatured: -1, order: 1, createdAt: -1 })
    ]);

    // Transform manual entries to match submission format for consistent display
    const transformedManualEntries = manualEntries.map(entry => ({
      _id: entry._id,
      campaignId: entry.campaignId,
      platform: entry.platform,
      contentUrl: entry.link,
      metadata: {
        title: entry.name,
        description: entry.metadata?.description || '',
        thumbnailUrl: entry.metadata?.thumbnailUrl || null,
        author: entry.metadata?.author || {
          username: 'Admin',
          displayName: 'Admin'
        }
      },
      status: 'approved',
      isManualEntry: true,
      isFeatured: entry.isFeatured,
      order: entry.order,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
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

    console.log(`Fetching showcase for campaign ${campaignId}:`, {
      totalSubmissions: submissions.length,
      totalManualEntries: manualEntries.length,
      totalCombined: allEntries.length,
      userAuthenticated: !!req.user,
      includeOwn
    });

    res.json(allEntries);
  } catch (error) {
    console.error('Error fetching campaign showcase:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get campaign winners (public)
router.get('/campaigns/:id/winners', async (req, res) => {
  try {
    const winners = await OpenVerseSubmission.getWinners(req.params.id);
    res.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ message: error.message });
  }
});

// USER ROUTES (require authentication)

// Submit to campaign
router.post('/campaigns/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { platform, contentUrl } = req.body;
    const campaignId = req.params.id;
    const userId = req.user._id;

    // Validate required fields
    if (!platform || !contentUrl) {
      return res.status(400).json({ message: 'Platform and content URL are required' });
    }

    // Check if campaign exists and is accepting submissions
    const campaign = await OpenVerseCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Debug campaign status
    const now = new Date();
    console.log('🔍 Campaign submission check:', {
      campaignId,
      title: campaign.title,
      isActive: campaign.isActive,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      currentTime: now,
      isCurrentlyActive: campaign.isCurrentlyActive,
      startDateCheck: campaign.startDate <= now,
      endDateCheck: campaign.endDate >= now
    });

    if (!campaign.isCurrentlyActive) {
      return res.status(400).json({
        message: 'Campaign is not currently accepting submissions',
        debug: {
          isActive: campaign.isActive,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          currentTime: now
        }
      });
    }

    // Verify user exists (wallet not required for participation)
    const User = (await import('../models/user.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Note: Wallet connection is only required for prize withdrawal, not participation
    // Users can participate with email authentication and add payment methods later if they win

    // Check if user already submitted to this campaign on this platform
    const existingSubmission = await OpenVerseSubmission.findOne({
      campaignId,
      userId,
      platform
    });

    if (existingSubmission) {
      return res.status(400).json({
        message: `You have already submitted a ${platform} post to this campaign. You can submit on other platforms if they are allowed.`
      });
    }

    // Fetch metadata from social media platform
    let metadata = null;
    try {
      metadata = await socialMediaService.fetchMetadata(platform, contentUrl);
      console.log(`Fetched metadata for ${platform} content:`, metadata);
    } catch (error) {
      console.error(`Error fetching metadata for ${platform}:`, error);
      // Continue with submission even if metadata fetch fails
    }

    // Verify user's unique code in post metadata
    let codeVerified = false;
    let verificationCode = null;
    let codeVerificationMethod = null;

    if (metadata && user.uniqueCode) {
      // Extract all potential codes from metadata
      const metadataText = `${metadata.title || ''} ${metadata.description || ''}`;
      const foundCodes = extractCodesFromText(metadataText);

      // Check if user's code is in the post
      if (isCodeInText(user.uniqueCode, metadataText)) {
        codeVerified = true;
        verificationCode = user.uniqueCode;
        codeVerificationMethod = 'auto';
        console.log(`✓ Code verified for user ${userId}: ${user.uniqueCode}`);
      } else {
        console.log(`✗ Code not found for user ${userId}. User code: ${user.uniqueCode}, Found codes: ${foundCodes.join(', ')}`);
      }
    } else {
      console.log(`⚠ Code verification skipped: metadata=${!!metadata}, uniqueCode=${!!user.uniqueCode}`);
    }

    // Create submission
    const submission = new OpenVerseSubmission({
      campaignId,
      userId,
      platform,
      contentUrl,
      metadata,
      submissionIp: req.ip,
      verificationCode,
      codeVerified,
      codeVerificationMethod,
      // Auto-approve all submissions so they appear immediately
      status: 'approved'
    });

    await submission.save();

    // Track referral completion (if user was referred)
    try {
      // Import the referral tracking function
      const { trackReferralCompletion } = await import('./referrals.js');
      await trackReferralCompletion(userId, campaignId);
    } catch (error) {
      console.error('Error tracking referral completion:', error);
      // Don't fail the submission if referral tracking fails
    }

    // Populate user data for response
    await submission.populate('userId', 'username walletAddress');

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's submissions
router.get('/my-submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await OpenVerseSubmission.getByUser(req.user._id);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADMIN ROUTES (require admin authentication)

// Get all campaigns for admin
router.get('/admin/campaigns', authenticateToken, isAdmin, async (req, res) => {
  try {
    const campaigns = await OpenVerseCampaign.find()
      .populate('createdBy', 'email username')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching admin campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new campaign
router.post('/admin/campaigns', authenticateToken, isAdmin, upload.single('thumbnailImage'), async (req, res) => {
  try {
    const {
      title,
      description,
      youtubeUrl,
      spotifyUrl,
      appleMusicUrl,
      artistId,
      requireShareAction,
      prizePoolAmount,
      prizePoolCurrency,
      maxParticipants,
      maxWinners,
      startDate,
      endDate,
      allowedPlatforms,
      submissionGuidelines,
      prizeDistribution
    } = req.body;

    // Validate required fields
    if (!title || !description || !artistId || !prizePoolAmount || !prizePoolCurrency ||
        !maxParticipants || !maxWinners || !startDate || !endDate || !req.file) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Parse arrays and objects from form data
    const parsedAllowedPlatforms = JSON.parse(allowedPlatforms || '[]');
    const parsedPrizeDistribution = JSON.parse(prizeDistribution || '[]');

    // Validate prize distribution
    if (parsedPrizeDistribution.length > 0) {
      const totalDistributed = parsedPrizeDistribution.reduce((sum, prize) => sum + parseFloat(prize.amount), 0);
      const prizePoolAmountFloat = parseFloat(prizePoolAmount);

      if (Math.abs(totalDistributed - prizePoolAmountFloat) > 0.01) { // Allow for small floating point differences
        return res.status(400).json({
          message: `Total prize distribution ($${totalDistributed}) must equal the prize pool amount ($${prizePoolAmountFloat})`
        });
      }
    }

    // Determine initial status based on start date
    const now = new Date();
    const campaignStartDate = new Date(startDate);
    const campaignEndDate = new Date(endDate);

    let initialStatus = 'draft';
    let isActive = true;

    if (campaignStartDate <= now && campaignEndDate >= now) {
      initialStatus = 'active';
    } else if (campaignEndDate < now) {
      initialStatus = 'ended';
    }

    const campaignData = {
      title,
      description,
      thumbnailImage: req.file.path.replace(/\\/g, '/'),
      prizePool: {
        amount: parseFloat(prizePoolAmount),
        currency: prizePoolCurrency
      },
      maxParticipants: parseInt(maxParticipants),
      maxWinners: parseInt(maxWinners),
      startDate: campaignStartDate,
      endDate: campaignEndDate,
      allowedPlatforms: parsedAllowedPlatforms,
      submissionGuidelines: submissionGuidelines || '',
      prizeDistribution: parsedPrizeDistribution,
      createdBy: req.user._id,
      status: initialStatus,
      isActive: isActive
    };

    // Add optional fields if provided
    if (youtubeUrl) campaignData.youtubeUrl = youtubeUrl;
    if (spotifyUrl) campaignData.spotifyUrl = spotifyUrl;
    if (appleMusicUrl) campaignData.appleMusicUrl = appleMusicUrl;
    if (artistId) campaignData.artistId = artistId;

    // Set prerequisites
    campaignData.prerequisites = {
      requireShareAction: requireShareAction === 'true' || requireShareAction === true
    };

    const campaign = new OpenVerseCampaign(campaignData);

    await campaign.save();
    await campaign.populate('createdBy', 'email username');

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update campaign
router.put('/admin/campaigns/:id', authenticateToken, isAdmin, upload.single('thumbnailImage'), async (req, res) => {
  try {
    const campaign = await OpenVerseCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Parse form data
    const updateData = { ...req.body };
    
    if (req.body.allowedPlatforms) {
      updateData.allowedPlatforms = JSON.parse(req.body.allowedPlatforms);
    }
    
    if (req.body.prizeDistribution) {
      updateData.prizeDistribution = JSON.parse(req.body.prizeDistribution);
    }

    if (req.body.prizePoolAmount && req.body.prizePoolCurrency) {
      updateData.prizePool = {
        amount: parseFloat(req.body.prizePoolAmount),
        currency: req.body.prizePoolCurrency
      };
    }

    // Handle thumbnail image update
    if (req.file) {
      // Delete old image if it exists
      if (campaign.thumbnailImage && fs.existsSync(campaign.thumbnailImage)) {
        fs.unlinkSync(campaign.thumbnailImage);
      }
      updateData.thumbnailImage = req.file.path.replace(/\\/g, '/');
    }

    // Convert date strings to Date objects
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    Object.assign(campaign, updateData);
    await campaign.save();
    await campaign.populate('createdBy', 'email username');

    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete campaign
router.delete('/admin/campaigns/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const campaign = await OpenVerseCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if campaign has submissions
    const submissionCount = await OpenVerseSubmission.countDocuments({ campaignId: req.params.id });
    if (submissionCount > 0) {
      return res.status(400).json({ message: 'Cannot delete campaign with existing submissions' });
    }

    // Delete thumbnail image
    if (campaign.thumbnailImage && fs.existsSync(campaign.thumbnailImage)) {
      fs.unlinkSync(campaign.thumbnailImage);
    }

    await OpenVerseCampaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Activate/deactivate campaign
router.patch('/admin/campaigns/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, isActive } = req.body;

    const campaign = await OpenVerseCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (status !== undefined) campaign.status = status;
    if (isActive !== undefined) campaign.isActive = isActive;

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all submissions for admin review
router.get('/admin/campaigns/:id/submissions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    const submissions = await OpenVerseSubmission.getByCampaign(req.params.id, status);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching admin submissions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Review submission (approve/reject)
router.patch('/admin/submissions/:id/review', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected', 'disqualified'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const submission = await OpenVerseSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const oldStatus = submission.status;

    submission.status = status;
    submission.reviewNotes = reviewNotes || '';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    await submission.save();

    // Update campaign participant count based on status change
    let participantChange = 0;
    if (oldStatus !== 'approved' && status === 'approved') {
      participantChange = 1; // New approval
    } else if (oldStatus === 'approved' && status !== 'approved') {
      participantChange = -1; // Approval revoked
    }

    if (participantChange !== 0) {
      await OpenVerseCampaign.findByIdAndUpdate(
        submission.campaignId,
        { $inc: { totalParticipants: participantChange } }
      );
    }

    await submission.populate('userId', 'username email walletAddress');

    res.json(submission);
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Manually verify submission code
router.patch('/admin/submissions/:id/verify-code', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { codeVerified, reviewNotes } = req.body;

    if (typeof codeVerified !== 'boolean') {
      return res.status(400).json({ message: 'codeVerified must be a boolean' });
    }

    const submission = await OpenVerseSubmission.findById(req.params.id).populate('userId');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const oldCodeVerified = submission.codeVerified;

    // Update code verification
    submission.codeVerified = codeVerified;
    submission.codeVerificationMethod = 'manual';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes || submission.reviewNotes;

    // Auto-approve if code is verified, set to pending if not
    if (codeVerified && submission.status === 'pending') {
      submission.status = 'approved';
    } else if (!codeVerified && submission.status === 'approved') {
      submission.status = 'pending';
    }

    await submission.save();

    console.log(`✓ Admin verified code for submission ${submission._id}: ${oldCodeVerified} → ${codeVerified}`);

    res.json({
      message: 'Code verification updated',
      submission,
      changes: {
        codeVerified: { old: oldCodeVerified, new: codeVerified },
        codeVerificationMethod: 'manual',
        status: submission.status
      }
    });
  } catch (error) {
    console.error('Error verifying submission code:', error);
    res.status(500).json({ message: error.message });
  }
});

// Select winners
router.post('/admin/campaigns/:id/select-winners', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { winners } = req.body; // Array of { submissionId, rank, prizeAmount }

    const campaign = await OpenVerseCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.winnersSelected) {
      return res.status(400).json({ message: 'Winners have already been selected for this campaign' });
    }

    // Validate winners array
    if (!Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ message: 'Winners array is required' });
    }

    if (winners.length > campaign.maxWinners) {
      return res.status(400).json({ message: 'Too many winners selected' });
    }

    // Update submissions to mark winners and create notifications
    for (const winner of winners) {
      const submission = await OpenVerseSubmission.findById(winner.submissionId).populate('userId');
      if (!submission) {
        return res.status(400).json({ message: `Submission ${winner.submissionId} not found` });
      }

      submission.isWinner = true;
      submission.winnerRank = winner.rank;
      submission.prizeAmount = winner.prizeAmount;
      submission.prizeCurrency = campaign.prizePool.currency;
      await submission.save();

      // Create winner notification
      try {
        await Notification.createWinnerNotification(
          submission.userId._id,
          campaign,
          submission
        );
        console.log(`Winner notification created for user ${submission.userId._id}`);
      } catch (notificationError) {
        console.error('Error creating winner notification:', notificationError);
        // Don't fail the entire process if notification fails
      }
    }

    // Update campaign
    campaign.winnersSelected = true;
    campaign.winnersSelectedAt = new Date();
    campaign.winnersSelectedBy = req.user._id;
    campaign.status = 'winners_selected';
    await campaign.save();

    res.json({ message: 'Winners selected successfully', campaign });
  } catch (error) {
    console.error('Error selecting winners:', error);
    res.status(500).json({ message: error.message });
  }
});

// Distribute prizes
router.post('/admin/campaigns/:id/distribute-prizes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const campaign = await OpenVerseCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!campaign.winnersSelected) {
      return res.status(400).json({ message: 'Winners must be selected before distributing prizes' });
    }

    if (campaign.prizesDistributed) {
      return res.status(400).json({ message: 'Prizes have already been distributed for this campaign' });
    }

    // Get all winners
    const winners = await OpenVerseSubmission.getWinners(req.params.id);

    const distributionResults = [];

    for (const winner of winners) {
      try {
        // Get or create wallet for the winner
        const wallet = await Wallet.getOrCreate(winner.userId._id);

        // Add prize to wallet balance
        if (winner.prizeCurrency === 'JAMZ') {
          wallet.jamzBalance += winner.prizeAmount;
        } else if (winner.prizeCurrency === 'USDT') {
          wallet.usdtBalance += winner.prizeAmount;
        } else if (winner.prizeCurrency === 'NGN') {
          wallet.ngnBalance += winner.prizeAmount;
        } else if (winner.prizeCurrency === 'AED') {
          wallet.aedBalance += winner.prizeAmount;
        }

        // Add transaction record
        wallet.transactions.push({
          type: 'prize',
          amount: winner.prizeAmount,
          currency: winner.prizeCurrency,
          description: `Open Verse prize - ${campaign.title} (Rank ${winner.winnerRank})`,
          status: 'completed'
        });

        await wallet.save();

        // Update submission
        winner.prizeDistributed = true;
        winner.prizeDistributedAt = new Date();
        winner.prizeTransactionId = wallet.transactions[wallet.transactions.length - 1]._id;
        await winner.save();

        // Create prize distributed notification
        try {
          await Notification.createPrizeDistributedNotification(
            winner.userId._id,
            campaign,
            winner
          );
          console.log(`Prize distributed notification created for user ${winner.userId._id}`);
        } catch (notificationError) {
          console.error('Error creating prize distributed notification:', notificationError);
          // Don't fail the entire process if notification fails
        }

        distributionResults.push({
          userId: winner.userId._id,
          username: winner.userId.username,
          rank: winner.winnerRank,
          amount: winner.prizeAmount,
          currency: winner.prizeCurrency,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error distributing prize to user ${winner.userId._id}:`, error);
        distributionResults.push({
          userId: winner.userId._id,
          username: winner.userId.username,
          rank: winner.winnerRank,
          amount: winner.prizeAmount,
          currency: winner.prizeCurrency,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update campaign
    campaign.prizesDistributed = true;
    campaign.prizesDistributedAt = new Date();
    campaign.prizesDistributedBy = req.user._id;
    campaign.status = 'prizes_distributed';
    await campaign.save();

    res.json({
      message: 'Prize distribution completed',
      results: distributionResults,
      campaign
    });
  } catch (error) {
    console.error('Error distributing prizes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Refresh submission metadata
router.patch('/admin/submissions/:id/refresh-metadata', authenticateToken, isAdmin, async (req, res) => {
  try {
    const submission = await OpenVerseSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Fetch fresh metadata
    const metadata = await socialMediaService.fetchMetadata(submission.platform, submission.contentUrl);

    submission.metadata = metadata;
    await submission.save();

    res.json({ message: 'Metadata refreshed successfully', submission });
  } catch (error) {
    console.error('Error refreshing metadata:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create manual submission (admin only)
router.post('/admin/campaigns/:campaignId/submissions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const {
      platform,
      contentUrl,
      title,
      description,
      authorName,
      authorUsername,
      thumbnailUrl,
      isWinner,
      winnerRank,
      prizeAmount,
      prizeCurrency
    } = req.body;

    // Validate required fields
    if (!platform || !contentUrl || !title || !authorName) {
      return res.status(400).json({
        message: 'Platform, content URL, title, and author name are required'
      });
    }

    // Verify campaign exists
    const campaign = await OpenVerseCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if platform is allowed for this campaign
    if (!campaign.allowedPlatforms.includes(platform)) {
      return res.status(400).json({
        message: `${platform} is not an allowed platform for this campaign`
      });
    }

    // Create manual submission with metadata
    const submission = new OpenVerseSubmission({
      campaignId,
      platform,
      contentUrl: contentUrl.trim(),
      metadata: {
        title: title.trim(),
        description: description?.trim() || '',
        thumbnailUrl: thumbnailUrl?.trim() || '',
        author: {
          displayName: authorName.trim(),
          username: authorUsername?.trim() || ''
        },
        extractedAt: new Date()
      },
      status: 'approved', // Manual entries are pre-approved
      isWinner: Boolean(isWinner),
      winnerRank: isWinner ? winnerRank : undefined,
      prizeAmount: isWinner ? prizeAmount : undefined,
      prizeCurrency: isWinner ? prizeCurrency : undefined,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      reviewNotes: 'Manual entry created by admin',
      submissionIp: req.ip,
      isManualEntry: true // Custom flag to identify manual entries
    });

    await submission.save();

    // Update campaign statistics
    await OpenVerseCampaign.findByIdAndUpdate(campaignId, {
      $inc: {
        totalSubmissions: 1,
        totalParticipants: 1 // Count manual entries as participants
      }
    });

    // Populate the created submission for response
    const populatedSubmission = await OpenVerseSubmission.findById(submission._id)
      .populate('reviewedBy', 'email username');

    res.status(201).json({
      message: 'Manual submission created successfully',
      submission: populatedSubmission
    });
  } catch (error) {
    console.error('Error creating manual submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update manual submission (admin only)
router.patch('/admin/submissions/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      platform,
      contentUrl,
      title,
      description,
      authorName,
      authorUsername,
      thumbnailUrl,
      isWinner,
      winnerRank,
      prizeAmount,
      prizeCurrency,
      status
    } = req.body;

    const submission = await OpenVerseSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update basic fields
    if (platform) submission.platform = platform;
    if (contentUrl) submission.contentUrl = contentUrl.trim();
    if (status) submission.status = status;

    // Update metadata
    if (title || description || authorName || authorUsername || thumbnailUrl) {
      submission.metadata = {
        ...submission.metadata,
        title: title?.trim() || submission.metadata?.title,
        description: description?.trim() || submission.metadata?.description || '',
        thumbnailUrl: thumbnailUrl?.trim() || submission.metadata?.thumbnailUrl || '',
        author: {
          displayName: authorName?.trim() || submission.metadata?.author?.displayName,
          username: authorUsername?.trim() || submission.metadata?.author?.username || ''
        },
        extractedAt: submission.metadata?.extractedAt || new Date()
      };
    }

    // Update winner information
    submission.isWinner = Boolean(isWinner);
    if (isWinner) {
      submission.winnerRank = winnerRank;
      submission.prizeAmount = prizeAmount;
      submission.prizeCurrency = prizeCurrency;
    } else {
      submission.winnerRank = undefined;
      submission.prizeAmount = undefined;
      submission.prizeCurrency = undefined;
    }

    // Update review information
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.reviewNotes = 'Updated by admin';

    await submission.save();

    // Populate the updated submission for response
    const populatedSubmission = await OpenVerseSubmission.findById(submission._id)
      .populate('reviewedBy', 'email username')
      .populate('userId', 'username email');

    res.json({
      message: 'Submission updated successfully',
      submission: populatedSubmission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete submission (admin only)
router.delete('/admin/submissions/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const submission = await OpenVerseSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const campaignId = submission.campaignId;

    // Delete the submission
    await OpenVerseSubmission.findByIdAndDelete(req.params.id);

    // Update campaign statistics
    await OpenVerseCampaign.findByIdAndUpdate(campaignId, {
      $inc: {
        totalSubmissions: -1,
        totalParticipants: -1
      }
    });

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Validate content URL
router.post('/validate-url', async (req, res) => {
  try {
    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ message: 'Platform and URL are required' });
    }

    const isValid = socialMediaService.validateUrl(platform, url);
    const contentId = socialMediaService.extractContentId(platform, url);
    const thumbnailUrl = socialMediaService.getThumbnailUrl(platform, url);

    res.json({
      isValid,
      contentId,
      thumbnailUrl,
      platform
    });
  } catch (error) {
    console.error('Error validating URL:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get content metadata preview
router.post('/preview-content', async (req, res) => {
  try {
    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ message: 'Platform and URL are required' });
    }

    const metadata = await socialMediaService.fetchMetadata(platform, url);
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching content preview:', error);
    res.status(500).json({ message: error.message });
  }
});

// Serve campaign thumbnail images
router.get('/campaigns/:id/thumbnail', async (req, res) => {
  try {
    const campaign = await OpenVerseCampaign.findById(req.params.id);
    if (!campaign || !campaign.thumbnailImage) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    // Check if thumbnailImage is an external URL (http:// or https://)
    if (campaign.thumbnailImage.startsWith('http://') || campaign.thumbnailImage.startsWith('https://')) {
      // Redirect to the external URL
      return res.redirect(campaign.thumbnailImage);
    }

    // Handle local file paths (old and new formats)
    let imagePath;
    if (campaign.thumbnailImage.startsWith('public/')) {
      // New format: public/media/open-verse/filename.jpg
      imagePath = path.resolve(campaign.thumbnailImage);
    } else if (campaign.thumbnailImage.startsWith('backend/public/')) {
      // Old format: backend/public/media/open-verse/filename.jpg
      imagePath = path.resolve(campaign.thumbnailImage);
    } else {
      // Relative path format: media/open-verse/filename.jpg
      imagePath = path.resolve('public', campaign.thumbnailImage);
    }

    console.log('Thumbnail request for campaign:', req.params.id);
    console.log('Stored thumbnail path:', campaign.thumbnailImage);
    console.log('Resolved image path:', imagePath);

    if (!fs.existsSync(imagePath)) {
      console.error('Thumbnail file not found at:', imagePath);
      return res.status(404).json({ message: 'Thumbnail file not found' });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({ message: error.message });
  }
});

// Campaign statistics fixed - endpoint removed for security

export default router;
