import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  usdcBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  jamzBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  msenseBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  ngnBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  aedBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  inrBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  usdcAddress: {
    type: String,
    default: null,
    sparse: true
  },
  jamzAddress: {
    type: String,
    default: null,
    sparse: true
  },
  paypalEmail: {
    type: String,
    default: null,
    sparse: true
  },
  // NGN bank account details
  ngnBankDetails: {
    accountNumber: {
      type: String,
      default: null,
      sparse: true
    },
    bankName: {
      type: String,
      default: null,
      sparse: true
    },
    accountName: {
      type: String,
      default: null,
      sparse: true
    },
    bankCode: {
      type: String,
      default: null,
      sparse: true
    }
  },
  // AED bank account details
  aedBankDetails: {
    accountNumber: {
      type: String,
      default: null,
      sparse: true
    },
    bankName: {
      type: String,
      default: null,
      sparse: true
    },
    accountName: {
      type: String,
      default: null,
      sparse: true
    },
    iban: {
      type: String,
      default: null,
      sparse: true
    },
    swiftCode: {
      type: String,
      default: null,
      sparse: true
    }
  },
  // INR bank account details (UPI)
  inrBankDetails: {
    upiId: {
      type: String,
      default: null,
      sparse: true
    },
    accountNumber: {
      type: String,
      default: null,
      sparse: true
    },
    ifscCode: {
      type: String,
      default: null,
      sparse: true
    },
    bankName: {
      type: String,
      default: null,
      sparse: true
    },
    accountName: {
      type: String,
      default: null,
      sparse: true
    }
  },
  watchedVideos: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true
    },
    videoId: {
      type: String,
      required: true
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'reward', 'claim', 'swap'],
      required: true
    },
    token: {
      type: String,
      enum: ['USDC', 'JAMZ', 'MSENSE', 'NGN', 'AED', 'INR'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    txHash: {
      type: String,
      default: null
    },
    method: {
      type: String,
      enum: ['onchain', 'stripe', 'reward', 'swap', null],
      default: null
    },
    // Swap-specific fields
    swapDetails: {
      fromCurrency: {
        type: String,
        enum: ['USDC', 'JAMZ', 'NGN', 'AED', 'INR', null],
        default: null
      },
      toCurrency: {
        type: String,
        enum: ['USDC', 'JAMZ', 'NGN', 'AED', 'INR', null],
        default: null
      },
      fromAmount: {
        type: Number,
        default: null
      },
      toAmount: {
        type: Number,
        default: null
      },
      exchangeRate: {
        type: Number,
        default: null
      },
      feeAmount: {
        type: Number,
        default: null
      },
      feePercentage: {
        type: Number,
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
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

walletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Update transaction timestamps
  if (this.isModified('transactions')) {
    this.transactions.forEach(transaction => {
      if (transaction.isNew) {
        transaction.createdAt = Date.now();
      }
      transaction.updatedAt = Date.now();
    });
  }

  next();
});

// Static method to get or create a wallet for a user
walletSchema.statics.getOrCreate = async function(userId) {
  let wallet = await this.findOne({ userId });

  if (!wallet) {
    wallet = new this({
      userId,
      usdcBalance: 0,
      jamzBalance: 0,
      msenseBalance: 1000, // Give new users 1000 MSENSE to start
      ngnBalance: 0,
      aedBalance: 0,
      inrBalance: 0
    });
    await wallet.save();
  }

  return wallet;
};

export default mongoose.model('Wallet', walletSchema);
