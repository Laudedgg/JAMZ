import mongoose from 'mongoose';

const manualShowcaseEntrySchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnifiedCampaign', // Updated to reference unified campaign
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  platform: {
    type: String,
    enum: ['youtube', 'tiktok', 'instagram', 'twitter', 'facebook', 'spotify', 'soundcloud', 'other'],
    required: true
  },
  link: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid URL'
    }
  },
  // Optional metadata that can be manually entered or auto-extracted
  metadata: {
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    author: {
      username: String,
      displayName: String
    },
    extractedAt: {
      type: Date,
      default: Date.now
    }
  },
  // Admin who added this entry
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Display order (for manual sorting)
  order: {
    type: Number,
    default: 0
  },
  // Status for moderation
  status: {
    type: String,
    enum: ['active', 'hidden', 'featured'],
    default: 'active'
  },
  // Whether this entry should be featured prominently
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Optional notes for internal use
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
manualShowcaseEntrySchema.index({ campaignId: 1, status: 1 });
manualShowcaseEntrySchema.index({ campaignId: 1, order: 1 });
manualShowcaseEntrySchema.index({ createdBy: 1, createdAt: -1 });
manualShowcaseEntrySchema.index({ platform: 1 });
manualShowcaseEntrySchema.index({ isFeatured: 1, createdAt: -1 });

// Virtual for platform-specific URL validation
manualShowcaseEntrySchema.virtual('isValidPlatformUrl').get(function() {
  const urlPatterns = {
    youtube: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)[A-Za-z0-9_-]+|^https:\/\/youtu\.be\/[A-Za-z0-9_-]+/,
    tiktok: /^https:\/\/(www\.)?(vm\.)?tiktok\.com\/[A-Za-z0-9_-]+\/?|^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+/,
    instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/,
    twitter: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+/,
    facebook: /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+\/(posts|videos)\/[A-Za-z0-9_.-]+/,
    spotify: /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[A-Za-z0-9]+/,
    soundcloud: /^https:\/\/(www\.)?soundcloud\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/
  };
  
  if (this.platform === 'other') return true; // Allow any URL for 'other' platform
  return urlPatterns[this.platform] && urlPatterns[this.platform].test(this.link);
});

// Pre-save middleware for validation
manualShowcaseEntrySchema.pre('save', function(next) {
  // Validate platform-specific URL if not 'other'
  if (this.platform !== 'other' && !this.isValidPlatformUrl) {
    const error = new Error(`Invalid ${this.platform} URL format`);
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Static method to get entries for a campaign
manualShowcaseEntrySchema.statics.getByCampaign = function(campaignId, status = 'active') {
  return this.find({ 
    campaignId, 
    status: status === 'all' ? { $in: ['active', 'hidden', 'featured'] } : status 
  })
  .populate('createdBy', 'email username')
  .sort({ isFeatured: -1, order: 1, createdAt: -1 });
};

// Static method to get featured entries
manualShowcaseEntrySchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    status: { $in: ['active', 'featured'] },
    isFeatured: true 
  })
  .populate('campaignId', 'title description')
  .populate('createdBy', 'email username')
  .sort({ createdAt: -1 })
  .limit(limit);
};

export default mongoose.model('ManualShowcaseEntry', manualShowcaseEntrySchema);
