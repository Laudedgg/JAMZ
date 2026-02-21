import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Will be set when someone clicks the referral link
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnifiedCampaign', // Updated to reference unified campaign
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    index: true
  },
  // Track when the referral link was shared
  sharedAt: {
    type: Date,
    default: Date.now
  },
  // Track when the referred user joined through the link
  joinedAt: {
    type: Date
  },
  // Track when the referred user completed the showcase
  completedAt: {
    type: Date
  },
  // Reward amounts for the referrer
  rewardUsd: {
    type: Number,
    default: 0
  },
  rewardJamz: {
    type: Number,
    default: 0
  },
  rewardNgn: {
    type: Number,
    default: 0
  },
  rewardAed: {
    type: Number,
    default: 0
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'joined', 'completed', 'rewarded'],
    default: 'pending'
  },
  // Reward distribution tracking
  rewardsDistributed: {
    type: Boolean,
    default: false
  },
  rewardsDistributedAt: {
    type: Date
  }
}, { timestamps: true });

// Indexes for better query performance
referralSchema.index({ referrerId: 1, campaignId: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;
