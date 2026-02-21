import mongoose from 'mongoose';

const campaignCommentSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MFTCampaign',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  }
}, {
  timestamps: true
});

campaignCommentSchema.index({ campaignId: 1, createdAt: -1 });

export default mongoose.model('CampaignComment', campaignCommentSchema);
