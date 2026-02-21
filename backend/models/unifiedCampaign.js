import mongoose from 'mongoose';

const unifiedCampaignSchema = new mongoose.Schema({
  // Basic Campaign Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Artist Information (from original Campaign model)
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  
  // Media URLs (from original Campaign model)
  youtubeUrl: {
    type: String,
    trim: true
  },
  spotifyUrl: {
    type: String,
    trim: true
  },
  appleUrl: {
    type: String,
    trim: true
  },
  otherDspUrls: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Thumbnail Image (from Showcase model)
  thumbnailImage: {
    type: String, // Path to uploaded thumbnail image
    required: true
  },
  
  // Prize Pool System (from Showcase model)
  prizePool: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['JAMZ', 'USDT', 'NGN', 'AED'],
      required: true
    }
  },
  
  // Prize Distribution (from Showcase model)
  maxWinners: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  prizeDistribution: [{
    rank: {
      type: Number,
      required: true,
      min: 1
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Participation Settings (from Showcase model)
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  allowedPlatforms: [{
    type: String,
    enum: ['instagram', 'tiktok', 'youtube'],
    required: true
  }],
  submissionGuidelines: {
    type: String,
    default: ''
  },
  
  // NEW: Prerequisite System
  prerequisites: {
    requireYouTubeWatch: {
      type: Boolean,
      default: false
    },
    requireShareAction: {
      type: Boolean,
      default: false
    }
  },
  
  // Legacy Reward System (kept for backward compatibility but now used as prerequisites)
  shareRewardUsd: {
    type: Number,
    default: 0
  },
  shareRewardJamz: {
    type: Number,
    default: 0
  },
  shareRewardNgn: {
    type: Number,
    default: 0
  },
  shareRewardAed: {
    type: Number,
    default: 0
  },
  watchRewardUsd: {
    type: Number,
    default: 0
  },
  watchRewardJamz: {
    type: Number,
    default: 5
  },
  watchRewardNgn: {
    type: Number,
    default: 0
  },
  watchRewardAed: {
    type: Number,
    default: 0
  },
  
  // Challenge/Submission Rewards (kept for backward compatibility)
  challengeRewardUsd: {
    type: Number,
    default: 0
  },
  challengeRewardJamz: {
    type: Number,
    default: 0
  },
  challengeRewardNgn: {
    type: Number,
    default: 0
  },
  challengeRewardAed: {
    type: Number,
    default: 0
  },
  
  // Referral System (from original Campaign model)
  maxReferralRewards: {
    type: Number,
    default: 100,
    min: 0
  },
  maxReferralRewardsPerUser: {
    type: Number,
    default: 5,
    min: 0
  },
  totalReferralRewardsGiven: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Campaign Status and Timing
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'ended', 'winners_selected', 'prizes_distributed'],
    default: 'draft'
  },
  
  // Statistics (from Showcase model)
  totalSubmissions: {
    type: Number,
    default: 0
  },
  totalParticipants: {
    type: Number,
    default: 0
  },
  
  // Admin Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Flag to indicate if campaign was created by an artist (vs admin)
  createdByArtist: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 999
  },
  
  // Winners Management (from Showcase model)
  winnersSelected: {
    type: Boolean,
    default: false
  },
  winnersSelectedAt: {
    type: Date
  },
  winnersSelectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  prizesDistributed: {
    type: Boolean,
    default: false
  },
  prizesDistributedAt: {
    type: Date
  },
  prizesDistributedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
unifiedCampaignSchema.index({ status: 1, isActive: 1 });
unifiedCampaignSchema.index({ startDate: 1, endDate: 1 });
unifiedCampaignSchema.index({ artistId: 1 });
unifiedCampaignSchema.index({ createdAt: -1 });

// Virtual for checking if campaign is currently active
unifiedCampaignSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && 
         this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual for checking if campaign has ended
unifiedCampaignSchema.virtual('hasEnded').get(function() {
  const now = new Date();
  return this.endDate < now;
});

// Virtual for time remaining
unifiedCampaignSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (this.endDate < now) return 0;
  return Math.max(0, this.endDate.getTime() - now.getTime());
});

// Pre-save middleware to validate prize distribution
unifiedCampaignSchema.pre('save', function(next) {
  if (this.prizeDistribution && this.prizeDistribution.length > 0) {
    const ranks = this.prizeDistribution.map(p => p.rank).sort((a, b) => a - b);
    const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1);
    
    if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
      return next(new Error('Prize distribution ranks must be sequential starting from 1'));
    }
    
    const totalDistributed = this.prizeDistribution.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalDistributed - this.prizePool.amount) > 0.01) { // Allow for small floating point differences
      return next(new Error(`Total prize distribution ($${totalDistributed}) must equal the prize pool amount ($${this.prizePool.amount})`));
    }
  }
  
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  next();
});

// Static method to get active campaigns
unifiedCampaignSchema.statics.getActiveCampaigns = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('artistId').sort({ createdAt: -1 });
};

export default mongoose.model('UnifiedCampaign', unifiedCampaignSchema);
