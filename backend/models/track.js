import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  audioFile: {
    type: String,
    required: false,
    default: null
  },
  duration: {
    type: Number,
    default: 0
  },
  spotifyUrl: {
    type: String,
    default: ''
  },
  spotifyPreviewUrl: {
    type: String,
    default: ''
  },
  appleMusicUrl: {
    type: String,
    default: ''
  },
  appleMusicPreviewUrl: {
    type: String,
    default: ''
  },
  youtubeUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 9999 // Default to a high number so new tracks appear at the end
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  voteScore: {
    type: Number,
    default: 0 // upvotes - downvotes (for sorting)
  }
}, {
  timestamps: true
});

// Index for efficient sorting by vote score
trackSchema.index({ voteScore: -1, createdAt: -1 });

export default mongoose.model('Track', trackSchema);
