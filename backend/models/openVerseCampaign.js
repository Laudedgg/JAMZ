import mongoose from 'mongoose';

const openVerseCampaignSchema = new mongoose.Schema({
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
  thumbnailImage: {
    type: String, // Path to uploaded thumbnail image
    required: true
  },
  youtubeUrl: {
    type: String, // YouTube video URL for the campaign
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  spotifyUrl: {
    type: String, // Spotify URL for the campaign
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[A-Za-z0-9]+/.test(v);
      },
      message: 'Please provide a valid Spotify URL'
    }
  },
  appleMusicUrl: {
    type: String, // Apple Music URL for the campaign
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https:\/\/music\.apple\.com\//.test(v);
      },
      message: 'Please provide a valid Apple Music URL'
    }
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: false // Make optional for OpenVerse campaigns
  },
  // Prerequisites for participation
  prerequisites: {
    requireShareAction: {
      type: Boolean,
      default: false
    }
  },
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
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  maxWinners: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // Reasonable limit for winners
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
  allowedPlatforms: [{
    type: String,
    enum: ['instagram', 'tiktok', 'youtube'],
    required: true
  }],
  submissionGuidelines: {
    type: String,
    default: ''
  },
  // Statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  totalParticipants: {
    type: Number,
    default: 0
  },
  // Admin who created the campaign
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Winners selection
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
  // Prize distribution
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
openVerseCampaignSchema.index({ status: 1, isActive: 1 });
openVerseCampaignSchema.index({ startDate: 1, endDate: 1 });
openVerseCampaignSchema.index({ createdAt: -1 });

// Virtual for checking if campaign is currently active
openVerseCampaignSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && 
         this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual for checking if campaign has ended
openVerseCampaignSchema.virtual('hasEnded').get(function() {
  const now = new Date();
  return this.endDate < now;
});

// Virtual for time remaining
openVerseCampaignSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (this.endDate < now) return 0;
  return Math.max(0, this.endDate.getTime() - now.getTime());
});

// Pre-save middleware to validate prize distribution
openVerseCampaignSchema.pre('save', function(next) {
  // Ensure prize distribution ranks are unique and sequential
  if (this.prizeDistribution && this.prizeDistribution.length > 0) {
    const ranks = this.prizeDistribution.map(p => p.rank).sort((a, b) => a - b);
    const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1);
    
    if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
      return next(new Error('Prize distribution ranks must be sequential starting from 1'));
    }
    
    // Ensure total prize distribution doesn't exceed prize pool
    const totalDistributed = this.prizeDistribution.reduce((sum, p) => sum + p.amount, 0);
    if (totalDistributed > this.prizePool.amount) {
      return next(new Error('Total prize distribution cannot exceed prize pool amount'));
    }
  }
  
  // Validate dates
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate max winners doesn't exceed max participants
  if (this.maxWinners > this.maxParticipants) {
    return next(new Error('Maximum winners cannot exceed maximum participants'));
  }
  
  next();
});

// Static method to get active campaigns
openVerseCampaignSchema.statics.getActiveCampaigns = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ createdAt: -1 });
};

// Static method to get campaigns that need status updates
openVerseCampaignSchema.statics.getCampaignsNeedingStatusUpdate = function() {
  const now = new Date();
  return this.find({
    $or: [
      // Campaigns that should start
      {
        status: 'draft',
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      },
      // Campaigns that should end
      {
        status: 'active',
        endDate: { $lt: now }
      }
    ]
  });
};

export default mongoose.model('OpenVerseCampaign', openVerseCampaignSchema);
