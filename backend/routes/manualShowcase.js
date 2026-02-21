import express from 'express';
import ManualShowcaseEntry from '../models/manualShowcaseEntry.js';
import OpenVerseCampaign from '../models/openVerseCampaign.js';
import OpenVerseSubmission from '../models/openVerseSubmission.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all manual showcase entries for a campaign (admin only)
router.get('/campaigns/:campaignId/entries', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status = 'all' } = req.query;

    // Verify campaign exists
    const campaign = await OpenVerseCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const entries = await ManualShowcaseEntry.getByCampaign(campaignId, status);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching manual showcase entries:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all campaigns for dropdown selection (admin only)
router.get('/campaigns', authenticateToken, isAdmin, async (req, res) => {
  try {
    const campaigns = await OpenVerseCampaign.find({ isActive: true })
      .select('title description status startDate endDate')
      .sort({ createdAt: -1 });
    
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new manual showcase entry (admin only)
router.post('/entries', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { campaignId, name, platform, link, description, isFeatured, adminNotes } = req.body;

    // Validate required fields
    if (!campaignId || !name || !platform || !link) {
      return res.status(400).json({ 
        message: 'Campaign ID, name, platform, and link are required' 
      });
    }

    // Verify campaign exists
    const campaign = await OpenVerseCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Create the entry
    const entry = new ManualShowcaseEntry({
      campaignId,
      name: name.trim(),
      platform,
      link: link.trim(),
      metadata: {
        description: description?.trim() || '',
        extractedAt: new Date()
      },
      createdBy: req.user._id,
      isFeatured: Boolean(isFeatured),
      adminNotes: adminNotes?.trim() || ''
    });

    await entry.save();

    // Update campaign statistics (increment submission and participant counts)
    await updateCampaignStatistics(campaignId);

    // Populate the created entry for response
    const populatedEntry = await ManualShowcaseEntry.findById(entry._id)
      .populate('createdBy', 'email username')
      .populate('campaignId', 'title');

    res.status(201).json({
      message: 'Showcase entry created successfully',
      entry: populatedEntry
    });
  } catch (error) {
    console.error('Error creating manual showcase entry:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: error.message,
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Update a manual showcase entry (admin only)
router.put('/entries/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, platform, link, description, isFeatured, status, adminNotes, order } = req.body;

    const entry = await ManualShowcaseEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Showcase entry not found' });
    }

    const oldStatus = entry.status;

    // Update fields if provided
    if (name !== undefined) entry.name = name.trim();
    if (platform !== undefined) entry.platform = platform;
    if (link !== undefined) entry.link = link.trim();
    if (description !== undefined) {
      entry.metadata.description = description.trim();
    }
    if (isFeatured !== undefined) entry.isFeatured = Boolean(isFeatured);
    if (status !== undefined) entry.status = status;
    if (adminNotes !== undefined) entry.adminNotes = adminNotes.trim();
    if (order !== undefined) entry.order = parseInt(order);

    await entry.save();

    // Update campaign statistics if status changed (affects participant count)
    if (status !== undefined && oldStatus !== status) {
      await updateCampaignStatistics(entry.campaignId);
    }

    // Populate the updated entry for response
    const populatedEntry = await ManualShowcaseEntry.findById(entry._id)
      .populate('createdBy', 'email username')
      .populate('campaignId', 'title');

    res.json({
      message: 'Showcase entry updated successfully',
      entry: populatedEntry
    });
  } catch (error) {
    console.error('Error updating manual showcase entry:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: error.message,
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Delete a manual showcase entry (admin only)
router.delete('/entries/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await ManualShowcaseEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Showcase entry not found' });
    }

    const campaignId = entry.campaignId;
    await ManualShowcaseEntry.findByIdAndDelete(id);

    // Update campaign statistics after deletion
    await updateCampaignStatistics(campaignId);

    res.json({ message: 'Showcase entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting manual showcase entry:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single manual showcase entry (admin only)
router.get('/entries/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await ManualShowcaseEntry.findById(id)
      .populate('createdBy', 'email username')
      .populate('campaignId', 'title description');

    if (!entry) {
      return res.status(404).json({ message: 'Showcase entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching manual showcase entry:', error);
    res.status(500).json({ message: error.message });
  }
});

// Bulk update order of entries (admin only)
router.patch('/entries/reorder', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { entries } = req.body; // Array of { id, order }

    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'Entries must be an array' });
    }

    // Update each entry's order
    const updatePromises = entries.map(({ id, order }) => 
      ManualShowcaseEntry.findByIdAndUpdate(id, { order: parseInt(order) })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Entry order updated successfully' });
  } catch (error) {
    console.error('Error reordering entries:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get featured entries across all campaigns (public)
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const entries = await ManualShowcaseEntry.getFeatured(parseInt(limit));
    res.json(entries);
  } catch (error) {
    console.error('Error fetching featured entries:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to update campaign statistics
async function updateCampaignStatistics(campaignId) {
  try {
    // Count total submissions for this campaign
    const totalSubmissions = await OpenVerseSubmission.countDocuments({
      campaignId: campaignId
    });

    // Count manual showcase entries for this campaign
    const totalManualEntries = await ManualShowcaseEntry.countDocuments({
      campaignId: campaignId,
      status: 'active' // Only count active entries
    });

    // Count unique participants (unique userIds) from submissions
    const uniqueParticipants = await OpenVerseSubmission.distinct('userId', {
      campaignId: campaignId
    });

    // Total submissions = user submissions + manual entries
    const combinedSubmissions = totalSubmissions + totalManualEntries;

    // Total participants = unique users + manual entries (each manual entry counts as 1 participant)
    const combinedParticipants = uniqueParticipants.length + totalManualEntries;

    // Update campaign with correct counts
    await OpenVerseCampaign.findByIdAndUpdate(campaignId, {
      totalSubmissions: combinedSubmissions,
      totalParticipants: combinedParticipants
    });

    console.log(`📊 Updated campaign ${campaignId} stats: ${combinedSubmissions} total submissions (${totalSubmissions} user + ${totalManualEntries} manual), ${combinedParticipants} participants`);
  } catch (error) {
    console.error('Error in updateCampaignStatistics:', error);
  }
}

export default router;
