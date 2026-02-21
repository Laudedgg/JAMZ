import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnifiedCampaign', // Updated to reference unified campaign
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'facebook', 'copy', 'tiktok', 'instagram', 'youtube'],
    required: true
  },
  linkUrl: {
    type: String,
    default: ''
  },
  rewardUsdt: {
    type: Number,
    required: true
  },
  rewardJamz: {
    type: Number,
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rewardsDistributed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Share = mongoose.model('Share', shareSchema);

export default Share;
