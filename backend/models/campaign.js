import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  showcaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpenVerseCampaign',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  youtubeUrl: {
    type: String
  },
  spotifyUrl: {
    type: String
  },
  appleUrl: {
    type: String
  },
  otherDspUrls: {
    type: Map,
    of: String,
    default: {}
  },
  shareRewardUsd: {
    type: Number,
    default: 0
  },
  // Keep for backward compatibility
  shareRewardUsdt: {
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
  challengeRewardUsd: {
    type: Number,
    default: 0
  },
  // Keep for backward compatibility
  challengeRewardUsdt: {
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
  watchRewardUsd: {
    type: Number,
    default: 0
  },
  // Keep for backward compatibility
  watchRewardUsdt: {
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
  // Referral limits
  maxReferralRewards: {
    type: Number,
    default: 100, // Maximum number of referral rewards for this campaign
    min: 0
  },
  maxReferralRewardsPerUser: {
    type: Number,
    default: 5, // Maximum referral rewards each user can earn for this campaign
    min: 0
  },
  totalReferralRewardsGiven: {
    type: Number,
    default: 0, // Track how many referral rewards have been distributed
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 999 // Default to a high number so new campaigns appear at the end
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Campaign', campaignSchema);
