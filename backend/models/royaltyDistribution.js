import mongoose from 'mongoose';

const royaltyDistributionSchema = new mongoose.Schema({
  // Campaign this distribution is for
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MFTCampaign',
    required: true
  },
  // Artist who initiated the distribution
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  // Total royalty amount being distributed
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Currency
  currency: {
    type: String,
    enum: ['USD', 'USDC'],
    default: 'USD'
  },
  // Platform fee taken
  platformFee: {
    type: Number,
    default: 0
  },
  // Net amount distributed to holders
  netDistributedAmount: {
    type: Number,
    required: true
  },
  // Total MFTs at time of distribution (for calculating per-MFT amount)
  totalMFTsAtDistribution: {
    type: Number,
    required: true
  },
  // Amount per MFT
  amountPerMFT: {
    type: Number,
    required: true
  },
  // Individual distributions
  distributions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    mftCount: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    // Whether this was credited to user's wallet
    credited: {
      type: Boolean,
      default: false
    },
    creditedAt: {
      type: Date,
      default: null
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // Source of royalties (for tracking)
  source: {
    type: String,
    default: 'manual' // manual, spotify, apple_music, youtube, etc.
  },
  // Period this royalty covers
  periodStart: {
    type: Date,
    default: null
  },
  periodEnd: {
    type: Date,
    default: null
  },
  // Notes
  notes: {
    type: String,
    default: ''
  },
  // Processing timestamps
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
royaltyDistributionSchema.index({ campaignId: 1 });
royaltyDistributionSchema.index({ artistId: 1 });
royaltyDistributionSchema.index({ status: 1 });
royaltyDistributionSchema.index({ createdAt: -1 });
royaltyDistributionSchema.index({ 'distributions.userId': 1 });

// Static method to get distributions for a user
royaltyDistributionSchema.statics.getUserDistributions = function(userId, limit = 50) {
  return this.find({
    'distributions.userId': userId,
    status: 'completed'
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('campaignId', 'title coverImage');
};

// Static method to get total royalties for a campaign
royaltyDistributionSchema.statics.getCampaignTotalRoyalties = async function(campaignId) {
  const result = await this.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$netDistributedAmount' } } }
  ]);
  return result[0]?.total || 0;
};

// Ensure virtuals are included in JSON
royaltyDistributionSchema.set('toJSON', { virtuals: true });
royaltyDistributionSchema.set('toObject', { virtuals: true });

const RoyaltyDistribution = mongoose.model('RoyaltyDistribution', royaltyDistributionSchema);

export default RoyaltyDistribution;

