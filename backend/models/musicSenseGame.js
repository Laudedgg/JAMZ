import mongoose from 'mongoose';

const musicSenseGameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String for anonymous hosts
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  gameType: {
    type: String,
    enum: ['free', 'msense', 'premium'],
    required: true
  },
  entryFee: {
    type: Number,
    default: 0 // $25 for premium games
  },
  msenseRequirement: {
    type: Number,
    default: 0 // Minimum MSENSE tokens required to join
  },
  msensePrizePool: {
    type: Number,
    default: 0 // MSENSE tokens funded by host for msense games
  },
  maxPlayers: {
    type: Number,
    default: 8,
    min: 2,
    max: 16,
    validate: {
      validator: function(value) {
        // Premium games must have exactly 16 players
        if (this.gameType === 'premium') {
          return value === 16;
        }
        // Tournament brackets require powers of 2
        const validSizes = [2, 4, 8, 16];
        return validSizes.includes(value);
      },
      message: 'Tournament brackets require powers of 2 (2, 4, 8, or 16 players)'
    }
  },
  currentPlayers: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String for anonymous players
      required: true
    },
    username: String,
    walletAddress: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isReady: {
      type: Boolean,
      default: false
    },
    hasPaid: {
      type: Boolean,
      default: true // Always true for free games
    },
    isAnonymous: {
      type: Boolean,
      default: false // True for anonymous players in free games
    },
    submittedSong: {
      songTitle: String,
      artist: String,
      platform: {
        type: String,
        enum: ['spotify', 'youtube', 'apple-music', 'soundcloud', 'suno']
      },
      url: String,
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }
  }],
  rounds: [{
    roundNumber: Number,
    songs: [{
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      songTitle: String,
      artist: String,
      platform: {
        type: String,
        enum: ['youtube', 'spotify']
      },
      url: String,
      votes: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }],
      voteCount: {
        type: Number,
        default: 0
      }
    }],
    winner: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      songIndex: Number
    },
    startTime: Date,
    endTime: Date,
    status: {
      type: String,
      enum: ['pending', 'active', 'voting', 'completed'],
      default: 'pending'
    }
  }],
  prizePool: {
    totalAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      enum: ['MSENSE', 'USD'],
      default: 'MSENSE'
    },
    distribution: {
      winner: {
        type: Number,
        default: 0.7 // 70% to winner
      },
      runnerUp: {
        type: Number,
        default: 0.2 // 20% to runner-up
      },
      participation: {
        type: Number,
        default: 0.1 // 10% split among participants
      }
    }
  },
  allowedPlatforms: {
    type: [String],
    enum: ['spotify', 'youtube', 'apple-music', 'soundcloud', 'suno'],
    default: ['spotify', 'youtube', 'apple-music']
  },
  settings: {
    roundDuration: {
      type: Number,
      default: 120 // 2 minutes in seconds
    },
    votingDuration: {
      type: Number,
      default: 60 // 1 minute in seconds
    },
    songsPerRound: {
      type: Number,
      default: 2,
      min: 2,
      max: 4
    },
    allowDuplicateArtists: {
      type: Boolean,
      default: false
    },
    chatEnabled: {
      type: Boolean,
      default: true
    }
  },
  chat: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['message', 'system', 'vote', 'song_submission'],
      default: 'message'
    }
  }],
  gameResults: {
    finalWinner: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      prize: Number
    },
    leaderboard: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      position: Number,
      totalVotes: Number,
      prize: Number
    }],
    totalPrizeDistributed: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
musicSenseGameSchema.index({ gameId: 1 });
musicSenseGameSchema.index({ hostId: 1 });
musicSenseGameSchema.index({ status: 1 });
musicSenseGameSchema.index({ gameType: 1 });
musicSenseGameSchema.index({ createdAt: -1 });

export default mongoose.model('MusicSenseGame', musicSenseGameSchema);
