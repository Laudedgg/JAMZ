import mongoose from 'mongoose';

/**
 * Campaign Eligibility Model
 * 
 * Tracks user completion of prerequisites for campaign participation.
 * This replaces the old reward-based system with a prerequisite-based system.
 */
const campaignEligibilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnifiedCampaign',
    required: true
  },
  
  // Prerequisite completion tracking
  prerequisites: {
    youtubeWatchCompleted: {
      type: Boolean,
      default: false
    },
    youtubeWatchCompletedAt: {
      type: Date
    },
    youtubeVideoId: {
      type: String // Track which video was watched
    },
    
    shareActionCompleted: {
      type: Boolean,
      default: false
    },
    shareActionCompletedAt: {
      type: Date
    },
    shareActionPlatform: {
      type: String,
      enum: ['twitter', 'facebook', 'copy', 'tiktok', 'instagram', 'youtube']
    },
    shareActionUrl: {
      type: String // Track the shared URL
    }
  },
  
  // Overall eligibility status
  isEligible: {
    type: Boolean,
    default: false
  },
  eligibilityCheckedAt: {
    type: Date
  },
  
  // Submission tracking
  hasSubmitted: {
    type: Boolean,
    default: false
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpenVerseSubmission'
  },
  submittedAt: {
    type: Date
  },
  
  // Legacy reward tracking (for backward compatibility)
  rewardsEarned: {
    watchRewards: {
      jamz: { type: Number, default: 0 },
      usd: { type: Number, default: 0 },
      ngn: { type: Number, default: 0 },
      aed: { type: Number, default: 0 }
    },
    shareRewards: {
      jamz: { type: Number, default: 0 },
      usd: { type: Number, default: 0 },
      ngn: { type: Number, default: 0 },
      aed: { type: Number, default: 0 }
    }
  },
  
  // Metadata
  ipAddress: {
    type: String // For fraud prevention
  },
  userAgent: {
    type: String // For fraud prevention
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
campaignEligibilitySchema.index({ userId: 1, campaignId: 1 }, { unique: true });
campaignEligibilitySchema.index({ campaignId: 1, isEligible: 1 });
campaignEligibilitySchema.index({ userId: 1, isEligible: 1 });

// Method to check and update eligibility based on campaign requirements
campaignEligibilitySchema.methods.checkEligibility = async function() {
  const campaign = await mongoose.model('UnifiedCampaign').findById(this.campaignId);
  if (!campaign) {
    this.isEligible = false;
    return false;
  }
  
  let eligible = true;
  
  // Check YouTube watch prerequisite
  if (campaign.prerequisites.requireYouTubeWatch) {
    if (!this.prerequisites.youtubeWatchCompleted) {
      eligible = false;
    }
  }
  
  // Check share action prerequisite
  if (campaign.prerequisites.requireShareAction) {
    if (!this.prerequisites.shareActionCompleted) {
      eligible = false;
    }
  }
  
  this.isEligible = eligible;
  this.eligibilityCheckedAt = new Date();
  
  return eligible;
};

// Method to complete YouTube watch prerequisite
campaignEligibilitySchema.methods.completeYouTubeWatch = function(videoId) {
  this.prerequisites.youtubeWatchCompleted = true;
  this.prerequisites.youtubeWatchCompletedAt = new Date();
  this.prerequisites.youtubeVideoId = videoId;
  
  return this.checkEligibility();
};

// Method to complete share action prerequisite
campaignEligibilitySchema.methods.completeShareAction = function(platform, url) {
  this.prerequisites.shareActionCompleted = true;
  this.prerequisites.shareActionCompletedAt = new Date();
  this.prerequisites.shareActionPlatform = platform;
  this.prerequisites.shareActionUrl = url;
  
  return this.checkEligibility();
};

// Static method to get or create eligibility record
campaignEligibilitySchema.statics.getOrCreate = async function(userId, campaignId, ipAddress, userAgent) {
  let eligibility = await this.findOne({ userId, campaignId });
  
  if (!eligibility) {
    eligibility = new this({
      userId,
      campaignId,
      ipAddress,
      userAgent
    });
    
    // Check initial eligibility
    await eligibility.checkEligibility();
    await eligibility.save();
  }
  
  return eligibility;
};

// Static method to get eligible users for a campaign
campaignEligibilitySchema.statics.getEligibleUsers = function(campaignId) {
  return this.find({ 
    campaignId, 
    isEligible: true 
  }).populate('userId', 'username email walletAddress');
};

// Static method to get user's eligibility status for multiple campaigns
campaignEligibilitySchema.statics.getUserEligibilityStatus = function(userId, campaignIds) {
  return this.find({ 
    userId, 
    campaignId: { $in: campaignIds } 
  }).populate('campaignId', 'title prerequisites');
};

// Pre-save middleware to auto-check eligibility
campaignEligibilitySchema.pre('save', async function(next) {
  if (this.isModified('prerequisites')) {
    await this.checkEligibility();
  }
  next();
});

export default mongoose.model('CampaignEligibility', campaignEligibilitySchema);
