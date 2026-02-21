import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  // Social Media Accounts
  socialMedia: {
    instagram: {
      type: String,
      trim: true,
      default: ''
    },
    tiktok: {
      type: String,
      trim: true,
      default: ''
    },
    twitter: { // X (formerly Twitter)
      type: String,
      trim: true,
      default: ''
    },
    facebook: {
      type: String,
      trim: true,
      default: ''
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Artist', artistSchema);
