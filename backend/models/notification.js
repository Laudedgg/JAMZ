import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // User who receives the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'winner_selected',      // When user wins a campaign
      'prize_distributed',    // When prize is added to wallet
      'campaign_ended',       // When campaign ends
      'campaign_started',     // When new campaign starts
      'submission_approved',  // When submission is approved
      'submission_rejected',  // When submission is rejected
      'general'              // General notifications
    ],
    required: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Notification message/description
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Related campaign (if applicable)
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpenVerseCampaign',
    index: true
  },
  
  // Related submission (if applicable)
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpenVerseSubmission'
  },
  
  // Additional data (flexible for different notification types)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Read timestamp
  readAt: {
    type: Date
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Expiration date (optional)
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Static methods
notificationSchema.statics.createWinnerNotification = async function(userId, campaign, submission) {
  const notification = new this({
    userId,
    type: 'winner_selected',
    title: '🎉 Congratulations! You Won!',
    message: `You've been selected as a winner in "${campaign.title}"! Rank #${submission.winnerRank} with a prize of ${submission.prizeAmount} ${submission.prizeCurrency}.`,
    campaignId: campaign._id,
    submissionId: submission._id,
    priority: 'high',
    data: {
      rank: submission.winnerRank,
      prizeAmount: submission.prizeAmount,
      prizeCurrency: submission.prizeCurrency,
      campaignTitle: campaign.title
    }
  });
  
  return await notification.save();
};

notificationSchema.statics.createPrizeDistributedNotification = async function(userId, campaign, submission) {
  const notification = new this({
    userId,
    type: 'prize_distributed',
    title: '💰 Prize Added to Wallet!',
    message: `Your prize of ${submission.prizeAmount} ${submission.prizeCurrency} from "${campaign.title}" has been added to your wallet!`,
    campaignId: campaign._id,
    submissionId: submission._id,
    priority: 'high',
    data: {
      rank: submission.winnerRank,
      prizeAmount: submission.prizeAmount,
      prizeCurrency: submission.prizeCurrency,
      campaignTitle: campaign.title
    }
  });
  
  return await notification.save();
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    unreadOnly = false,
    type = null
  } = options;
  
  const query = { userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  // Don't show expired notifications
  query.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: { $gt: new Date() } }
  ];
  
  return await this.find(query)
    .populate('campaignId', 'title thumbnailImage')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  return await this.updateMany(
    {
      _id: { $in: notificationIds },
      userId
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Instance methods
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Auto-expire old notifications (optional cleanup)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90 days

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
