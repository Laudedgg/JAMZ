import mongoose from 'mongoose';

const mftCampaignSchema = new mongoose.Schema({
  // Artist who created the campaign
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    default: null
  },
  // Optional: Link to existing track
  trackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    default: null
  },
  // Campaign details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  // Music links
  spotifyUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  appleMusicUrl: { type: String, default: '' },
  
  // Funding details
  fundingGoal: {
    type: Number,
    required: true,
    min: 100 // Minimum $100 goal
  },
  currentFunding: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'USDC'],
    default: 'USD'
  },
  
  // Royalty sharing
  royaltyPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 50 // Max 50% royalty share
  },
  
  // MFT details
  mftPrice: {
    type: Number,
    required: true,
    min: 1 // Minimum $1 per MFT
  },
  totalSupply: {
    type: Number,
    required: true,
    min: 10 // Minimum 10 MFTs
  },
  soldSupply: {
    type: Number,
    default: 0
  },
  
  // Campaign status
  status: {
    type: String,
    enum: ['draft', 'active', 'funded', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Stats
  investorCount: {
    type: Number,
    default: 0
  },
  totalRoyaltiesDistributed: {
    type: Number,
    default: 0
  },
  
  // Trading settings
  tradingEnabled: {
    type: Boolean,
    default: true
  },
  tradingFeePercent: {
    type: Number,
    default: 2.5 // 2.5% trading fee
  },
  
  // Featured/promoted
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Campaign type classification
  campaignType: {
    type: String,
    enum: ['human', 'ai_agent'],
    default: 'human'
  },

  // AI Agent Artist (AAA) specific fields
  aiAgent: {
    creatorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    agentName: { type: String, default: '' },
    agentAvatar: { type: String, default: '' },
    agentBio: { type: String, default: '' },
    prompt: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    generationStatus: {
      type: String,
      enum: ['none', 'pending', 'completed', 'failed'],
      default: 'none'
    }
  },

  // Metadata
  tags: [{
    type: String
  }],
  genre: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
mftCampaignSchema.index({ artistId: 1 });
mftCampaignSchema.index({ status: 1 });
mftCampaignSchema.index({ isFeatured: 1, status: 1 });
mftCampaignSchema.index({ createdAt: -1 });
mftCampaignSchema.index({ campaignType: 1, status: 1 });
mftCampaignSchema.index({ currentFunding: -1 });

// Virtual for funding progress percentage
mftCampaignSchema.virtual('fundingProgress').get(function() {
  return Math.min(100, (this.currentFunding / this.fundingGoal) * 100);
});

// Virtual for remaining MFTs
mftCampaignSchema.virtual('remainingSupply').get(function() {
  return this.totalSupply - this.soldSupply;
});

// Virtual for checking if campaign is active
mftCampaignSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Ensure virtuals are included in JSON
mftCampaignSchema.set('toJSON', { virtuals: true });
mftCampaignSchema.set('toObject', { virtuals: true });

const MFTCampaign = mongoose.model('MFTCampaign', mftCampaignSchema);

export default MFTCampaign;

