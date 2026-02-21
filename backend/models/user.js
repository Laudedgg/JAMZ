import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values to maintain uniqueness only for non-null values
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.walletAddress && !this.authProvider; // Password only required if no wallet address or auth provider
    }
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values to maintain uniqueness only for non-null values
    trim: true,
    lowercase: true
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'facebook', 'twitter', 'github', 'discord', 'apple', 'farcaster', 'x', null],
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  discoverySource: {
    type: String,
    enum: ['google-search', 'youtube', 'instagram', 'twitter-x', 'tiktok', 'friend-word-of-mouth', 'other', null],
    default: null
  },
  discoverySourceOther: {
    type: String,
    trim: true,
    default: null
  },
  userType: {
    type: String,
    enum: ['artist', 'fan', null],
    default: null
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  uniqueCode: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values
    required: false,
    trim: true,
    // Format: 4 digits (e.g., 4287)
    match: /^\d{4}$/
  },
  spotify: {
    accessToken: {
      type: String,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    tokenExpiry: {
      type: Date,
      default: null
    },
    spotifyId: {
      type: String,
      default: null
    },
    displayName: {
      type: String,
      default: null
    },
    profileImage: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Helper function to generate unique 4-digit code
async function generateUniqueCode() {
  const User = mongoose.model('User');
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate random 4-digit code (1000-9999)
    code = String(Math.floor(1000 + Math.random() * 9000));

    // Check if code already exists
    const existing = await User.findOne({ uniqueCode: code });
    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Unable to generate unique code after maximum attempts');
}

userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();

  // Generate unique code for new users if not already set
  if (this.isNew && !this.uniqueCode) {
    try {
      this.uniqueCode = await generateUniqueCode();
    } catch (error) {
      return next(error);
    }
  }

  next();
});

export default mongoose.model('User', userSchema);
