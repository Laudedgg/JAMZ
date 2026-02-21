import mongoose from 'mongoose';

const artistWalletSchema = new mongoose.Schema({
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true,
    unique: true
  },
  // Balance tracking for different currencies
  usdcBalance: {
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
  // Funding method details
  fundingMethods: {
    usdc: {
      walletAddress: {
        type: String,
        default: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC contract address on Base
      },
      network: {
        type: String,
        default: 'Base'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    ngn: {
      bankName: {
        type: String,
        default: 'Guaranty Trust Bank'
      },
      accountNumber: {
        type: String,
        default: '0123456789'
      },
      accountName: {
        type: String,
        default: 'Jamz Fun Limited'
      },
      bankCode: {
        type: String,
        default: '058'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    aed: {
      bankName: {
        type: String,
        default: 'Emirates NBD'
      },
      accountNumber: {
        type: String,
        default: '1234567890123'
      },
      accountName: {
        type: String,
        default: 'Jamz Fun DMCC'
      },
      iban: {
        type: String,
        default: 'AE070260001234567890123'
      },
      swiftCode: {
        type: String,
        default: 'EBILAEAD'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }
  },
  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'campaign_payment', 'refund', 'adjustment'],
      required: true
    },
    currency: {
      type: String,
      enum: ['USDT', 'NGN', 'AED', 'INR'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    // Reference to campaign if this is a campaign payment
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UnifiedCampaign',
      default: null
    },
    // External transaction reference (bank transfer ID, crypto tx hash, etc.)
    externalReference: {
      type: String,
      default: null
    },
    // Admin who processed the transaction (for manual deposits/adjustments)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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
  // Campaign pricing configuration
  campaignPricing: {
    baseCost: {
      type: Number,
      default: 100, // Base cost in USD equivalent
      min: 0
    },
    // Additional costs based on campaign features
    additionalCosts: {
      extendedDuration: {
        type: Number,
        default: 50, // Cost per additional week
        min: 0
      },
      premiumPlacement: {
        type: Number,
        default: 200, // Cost for premium placement
        min: 0
      },
      multiPlatform: {
        type: Number,
        default: 75, // Cost for each additional platform
        min: 0
      }
    }
  },
  // Wallet settings
  settings: {
    autoApproveDeposits: {
      type: Boolean,
      default: false // Require manual approval for deposits
    },
    notificationPreferences: {
      emailOnDeposit: {
        type: Boolean,
        default: true
      },
      emailOnCampaignPayment: {
        type: Boolean,
        default: true
      },
      emailOnLowBalance: {
        type: Boolean,
        default: true
      }
    },
    lowBalanceThreshold: {
      type: Number,
      default: 50 // Notify when balance falls below this amount (USD equivalent)
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
artistWalletSchema.index({ artistId: 1 });
artistWalletSchema.index({ 'transactions.createdAt': -1 });
artistWalletSchema.index({ 'transactions.status': 1 });

// Virtual for total balance in USD equivalent (simplified conversion)
artistWalletSchema.virtual('totalBalanceUSD').get(function() {
  // Simplified conversion rates (in production, use real-time rates)
  const usdcToUsd = 1;
  const ngnToUsd = 0.0012; // Approximate rate
  const aedToUsd = 0.27; // Approximate rate
  const inrToUsd = 0.012; // Approximate rate

  return (this.usdcBalance * usdcToUsd) +
         (this.ngnBalance * ngnToUsd) +
         (this.aedBalance * aedToUsd) +
         (this.inrBalance * inrToUsd);
});

// Method to check if artist has sufficient balance for campaign
artistWalletSchema.methods.hasSufficientBalance = function(costUSD, currency = 'USD') {
  if (currency === 'USDT') {
    return this.usdtBalance >= costUSD;
  } else if (currency === 'NGN') {
    const costNGN = costUSD / 0.0012; // Convert USD to NGN
    return this.ngnBalance >= costNGN;
  } else if (currency === 'AED') {
    const costAED = costUSD / 0.27; // Convert USD to AED
    return this.aedBalance >= costAED;
  } else if (currency === 'INR') {
    const costINR = costUSD / 0.012; // Convert USD to INR
    return this.inrBalance >= costINR;
  }
  return this.totalBalanceUSD >= costUSD;
};

// Method to deduct campaign cost
artistWalletSchema.methods.deductCampaignCost = function(costUSD, currency, campaignId, description) {
  let deductedAmount;
  
  if (currency === 'USDT') {
    deductedAmount = costUSD;
    this.usdtBalance -= deductedAmount;
  } else if (currency === 'NGN') {
    deductedAmount = costUSD / 0.0012; // Convert USD to NGN
    this.ngnBalance -= deductedAmount;
  } else if (currency === 'AED') {
    deductedAmount = costUSD / 0.27; // Convert USD to AED
    this.aedBalance -= deductedAmount;
  }
  
  // Add transaction record
  this.transactions.push({
    type: 'campaign_payment',
    currency: currency,
    amount: deductedAmount,
    description: description,
    status: 'completed',
    campaignId: campaignId,
    updatedAt: new Date()
  });
  
  return deductedAmount;
};

// Static method to get or create wallet for artist
artistWalletSchema.statics.getOrCreate = async function(artistId) {
  let wallet = await this.findOne({ artistId });
  
  if (!wallet) {
    wallet = new this({
      artistId,
      usdtBalance: 0,
      ngnBalance: 0,
      aedBalance: 0
    });
    await wallet.save();
  }
  
  return wallet;
};

// Method to add deposit
artistWalletSchema.methods.addDeposit = function(amount, currency, externalReference, processedBy) {
  // Normalize currency - treat USDT and USDC the same
  const normalizedCurrency = currency === 'USDC' ? 'USDT' : currency;

  if (normalizedCurrency === 'USDT') {
    this.usdcBalance = (this.usdcBalance || 0) + amount;
  } else if (normalizedCurrency === 'NGN') {
    this.ngnBalance = (this.ngnBalance || 0) + amount;
  } else if (normalizedCurrency === 'AED') {
    this.aedBalance = (this.aedBalance || 0) + amount;
  } else if (normalizedCurrency === 'INR') {
    this.inrBalance = (this.inrBalance || 0) + amount;
  }

  this.transactions.push({
    type: 'deposit',
    currency: normalizedCurrency,
    amount: amount,
    description: `${normalizedCurrency} deposit - Admin top up`,
    status: 'completed',
    externalReference: externalReference,
    processedBy: processedBy,
    updatedAt: new Date()
  });
};

export default mongoose.model('ArtistWallet', artistWalletSchema);
