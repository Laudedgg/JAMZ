import mongoose from 'mongoose';

const trackVoteSchema = new mongoose.Schema({
  trackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous votes
  },
  sessionId: {
    type: String,
    required: false // For anonymous users (browser fingerprint or session ID)
  },
  voteType: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  },
  ipAddress: {
    type: String,
    required: false // For fraud prevention
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per user/session per track
trackVoteSchema.index({ trackId: 1, userId: 1 }, { unique: true, sparse: true });
trackVoteSchema.index({ trackId: 1, sessionId: 1 }, { unique: true, sparse: true });

// Index for efficient queries
trackVoteSchema.index({ trackId: 1 });
trackVoteSchema.index({ userId: 1 });

export default mongoose.model('TrackVote', trackVoteSchema);

