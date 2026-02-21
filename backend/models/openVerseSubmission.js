import mongoose from 'mongoose';

const openVerseSubmissionSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnifiedCampaign', // Updated to reference unified campaign
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // userId is required only if this is not a manual entry
      return !this.isManualEntry;
    }
  },
  platform: {
    type: String,
    enum: ['instagram', 'tiktok', 'youtube'],
    required: true
  },
  contentUrl: {
    type: String,
    required: true,
    trim: true
  },
  // Extracted metadata from the platform
  metadata: {
    title: String,
    description: String,
    thumbnailUrl: String,
    duration: Number, // in seconds
    viewCount: Number,
    likeCount: Number,
    author: {
      username: String,
      displayName: String,
      profilePicture: String
    },
    extractedAt: {
      type: Date,
      default: Date.now
    }
  },
  // Submission status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'disqualified'],
    default: 'approved'
  },
  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  // Winner information
  isWinner: {
    type: Boolean,
    default: false
  },
  winnerRank: {
    type: Number,
    min: 1
  },
  prizeAmount: {
    type: Number,
    min: 0
  },
  prizeCurrency: {
    type: String,
    enum: ['JAMZ', 'USDT', 'NGN', 'AED']
  },
  // Prize distribution
  prizeDistributed: {
    type: Boolean,
    default: false
  },
  prizeDistributedAt: {
    type: Date
  },
  prizeTransactionId: {
    type: String // Reference to wallet transaction
  },
  // Engagement metrics (can be updated periodically)
  engagementMetrics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Submission validation
  isValidUrl: {
    type: Boolean,
    default: true
  },
  validationErrors: [String],
  // IP address for fraud prevention
  submissionIp: {
    type: String
  },

  // NEW: Eligibility tracking
  eligibilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampaignEligibility'
  },

  // NEW: Prerequisite completion status at time of submission
  prerequisitesMetAtSubmission: {
    youtubeWatchCompleted: { type: Boolean, default: false },
    shareActionCompleted: { type: Boolean, default: false }
  },

  // Flag to identify manual admin entries
  isManualEntry: {
    type: Boolean,
    default: false
  },

  // Unique code verification for campaign submission ownership
  verificationCode: {
    type: String,
    trim: true
    // The code user added to their post (extracted from metadata)
  },
  codeVerified: {
    type: Boolean,
    default: false
    // Whether the user's unique code was found in the post metadata
  },
  codeVerificationMethod: {
    type: String,
    enum: ['auto', 'manual', null],
    default: null
    // 'auto' = automatically verified by system
    // 'manual' = manually verified by admin
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
openVerseSubmissionSchema.index({ campaignId: 1, userId: 1, platform: 1 }, { unique: true }); // One submission per user per platform per campaign
openVerseSubmissionSchema.index({ campaignId: 1, status: 1 });
openVerseSubmissionSchema.index({ campaignId: 1, isWinner: 1 });
openVerseSubmissionSchema.index({ userId: 1, createdAt: -1 });
openVerseSubmissionSchema.index({ platform: 1, createdAt: -1 });
openVerseSubmissionSchema.index({ status: 1, createdAt: -1 });

// Virtual for platform-specific URL validation
openVerseSubmissionSchema.virtual('isValidPlatformUrl').get(function() {
  const urlPatterns = {
    instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/,
    tiktok: /^https:\/\/(www\.)?(vm\.)?tiktok\.com\/[A-Za-z0-9_-]+\/?|^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+/,
    youtube: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)[A-Za-z0-9_-]+|^https:\/\/youtu\.be\/[A-Za-z0-9_-]+/
  };
  
  return urlPatterns[this.platform] && urlPatterns[this.platform].test(this.contentUrl);
});

// Virtual for extracting platform-specific content ID
openVerseSubmissionSchema.virtual('contentId').get(function() {
  try {
    switch (this.platform) {
      case 'instagram':
        const igMatch = this.contentUrl.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        return igMatch ? igMatch[2] : null;
      
      case 'tiktok':
        // Handle both short URLs and full URLs
        if (this.contentUrl.includes('vm.tiktok.com')) {
          const shortMatch = this.contentUrl.match(/vm\.tiktok\.com\/([A-Za-z0-9_-]+)/);
          return shortMatch ? shortMatch[1] : null;
        } else {
          const fullMatch = this.contentUrl.match(/video\/(\d+)/);
          return fullMatch ? fullMatch[1] : null;
        }
      
      case 'youtube':
        if (this.contentUrl.includes('youtube.com/watch')) {
          const watchMatch = this.contentUrl.match(/watch\?v=([A-Za-z0-9_-]+)/);
          return watchMatch ? watchMatch[1] : null;
        } else if (this.contentUrl.includes('youtube.com/shorts')) {
          const shortsMatch = this.contentUrl.match(/shorts\/([A-Za-z0-9_-]+)/);
          return shortsMatch ? shortsMatch[1] : null;
        } else if (this.contentUrl.includes('youtu.be')) {
          const shortMatch = this.contentUrl.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
          return shortMatch ? shortMatch[1] : null;
        }
        return null;
      
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
});

// Pre-save middleware for validation
openVerseSubmissionSchema.pre('save', async function(next) {
  // Validate URL format
  if (!this.isValidPlatformUrl) {
    this.isValidUrl = false;
    this.validationErrors.push(`Invalid ${this.platform} URL format`);
  }
  
  // Check if campaign allows this platform
  if (this.isNew) {
    try {
      const campaign = await mongoose.model('OpenVerseCampaign').findById(this.campaignId);
      if (campaign && !campaign.allowedPlatforms.includes(this.platform)) {
        return next(new Error(`Platform ${this.platform} is not allowed for this campaign`));
      }
      
      // Check if campaign is still accepting submissions
      if (campaign && (!campaign.isCurrentlyActive || campaign.hasEnded)) {
        return next(new Error('Campaign is not currently accepting submissions'));
      }
      
      // Check if max participants limit is reached
      if (campaign && campaign.totalParticipants >= campaign.maxParticipants) {
        return next(new Error('Campaign has reached maximum participants limit'));
      }
    } catch (error) {
      return next(error);
    }
  }
  
  // Validate winner information
  if (this.isWinner) {
    if (!this.winnerRank || !this.prizeAmount || !this.prizeCurrency) {
      return next(new Error('Winner submissions must have rank, prize amount, and currency'));
    }
  }
  
  next();
});

// Post-save middleware to update campaign statistics
openVerseSubmissionSchema.post('save', async function(doc) {
  if (doc.isNew) {
    try {
      // Recalculate campaign statistics properly
      await updateCampaignStatistics(doc.campaignId);
    } catch (error) {
      console.error('Error updating campaign statistics:', error);
    }
  }
});

// Helper function to update campaign statistics
async function updateCampaignStatistics(campaignId) {
  try {
    const OpenVerseCampaign = mongoose.model('OpenVerseCampaign');
    const ManualShowcaseEntry = mongoose.model('ManualShowcaseEntry');

    // Count total submissions for this campaign
    const totalSubmissions = await mongoose.model('OpenVerseSubmission').countDocuments({
      campaignId: campaignId
    });

    // Count manual showcase entries for this campaign
    const totalManualEntries = await ManualShowcaseEntry.countDocuments({
      campaignId: campaignId,
      status: 'active' // Only count active entries
    });

    // Count unique participants (unique userIds) for this campaign
    const uniqueParticipants = await mongoose.model('OpenVerseSubmission').distinct('userId', {
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

// Static method to get submissions for a campaign
openVerseSubmissionSchema.statics.getByCampaign = function(campaignId, status = null) {
  const query = { campaignId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('userId', 'username email walletAddress')
    .sort({ createdAt: -1 });
};

// Static method to get user's submissions
openVerseSubmissionSchema.statics.getByUser = function(userId) {
  return this.find({ userId })
    .populate('campaignId', 'title status endDate')
    .sort({ createdAt: -1 });
};

// Static method to get winners for a campaign
openVerseSubmissionSchema.statics.getWinners = function(campaignId) {
  return this.find({ 
    campaignId, 
    isWinner: true 
  })
    .populate('userId', 'username email walletAddress')
    .sort({ winnerRank: 1 });
};

export default mongoose.model('OpenVerseSubmission', openVerseSubmissionSchema);
