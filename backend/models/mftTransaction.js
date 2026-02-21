import mongoose from 'mongoose';

const mftTransactionSchema = new mongoose.Schema({
  // Transaction type
  type: {
    type: String,
    enum: ['buy', 'sell', 'transfer'],
    required: true
  },
  // Campaign
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MFTCampaign',
    required: true
  },
  // Parties involved
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for initial purchase from campaign
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Transaction details
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerMFT: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  // Fees
  platformFee: {
    type: Number,
    default: 0
  },
  artistFee: {
    type: Number,
    default: 0
  },
  // Net amount (after fees)
  netAmount: {
    type: Number,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Payment reference
  paymentMethod: {
    type: String,
    enum: ['wallet', 'stripe', 'crypto'],
    default: 'wallet'
  },
  paymentReference: {
    type: String,
    default: null
  },
  // Metadata
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
mftTransactionSchema.index({ campaignId: 1 });
mftTransactionSchema.index({ fromUserId: 1 });
mftTransactionSchema.index({ toUserId: 1 });
mftTransactionSchema.index({ type: 1 });
mftTransactionSchema.index({ status: 1 });
mftTransactionSchema.index({ createdAt: -1 });

// Static method to get transaction history for a campaign
mftTransactionSchema.statics.getCampaignHistory = function(campaignId, limit = 50) {
  return this.find({ campaignId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('fromUserId', 'username')
    .populate('toUserId', 'username');
};

// Static method to get user's transaction history
mftTransactionSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
    status: 'completed'
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('campaignId', 'title coverImage');
};

// Ensure virtuals are included in JSON
mftTransactionSchema.set('toJSON', { virtuals: true });
mftTransactionSchema.set('toObject', { virtuals: true });

const MFTTransaction = mongoose.model('MFTTransaction', mftTransactionSchema);

export default MFTTransaction;

