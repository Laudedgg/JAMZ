import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['crypto', 'bank'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  // Crypto-specific fields
  cryptoType: {
    type: String,
    enum: ['USDT_TRC20', 'USDT_BEP20'],
    required: function() { return this.type === 'crypto'; }
  },
  walletAddress: {
    type: String,
    required: function() { return this.type === 'crypto'; },
    validate: {
      validator: function(v) {
        if (this.type !== 'crypto') return true;
        // Basic validation for crypto addresses
        return v && v.length >= 26 && v.length <= 62;
      },
      message: 'Invalid wallet address format'
    }
  },
  // Bank-specific fields
  currency: {
    type: String,
    enum: ['NGN', 'AED', 'USD'],
    required: function() { return this.type === 'bank'; }
  },
  bankName: {
    type: String,
    required: function() { return this.type === 'bank'; }
  },
  accountHolderName: {
    type: String,
    required: function() { return this.type === 'bank'; }
  },
  accountNumber: {
    type: String,
    required: function() { return this.type === 'bank'; }
  },
  routingNumber: {
    type: String,
    required: function() { 
      return this.type === 'bank' && (this.currency === 'USD');
    }
  },
  swiftCode: {
    type: String,
    required: function() { 
      return this.type === 'bank' && (this.currency === 'AED');
    }
  },
  iban: {
    type: String,
    required: function() { 
      return this.type === 'bank' && (this.currency === 'AED');
    }
  },
  // Additional bank details
  bankAddress: String,
  additionalInfo: String,
  minimumAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const adminSettingsSchema = new mongoose.Schema({
  // Singleton pattern - only one settings document
  _id: {
    type: String,
    default: 'admin_settings'
  },
  paymentMethods: [paymentMethodSchema],
  // General settings
  platformSettings: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'Platform is under maintenance. Please check back later.'
    },
    allowNewRegistrations: {
      type: Boolean,
      default: true
    },
    defaultCampaignDuration: {
      type: Number,
      default: 30 // days
    }
  },
  // Campaign funding settings
  campaignSettings: {
    requireManualApproval: {
      type: Boolean,
      default: true
    },
    autoActivateAfterPayment: {
      type: Boolean,
      default: false
    },
    paymentConfirmationRequired: {
      type: Boolean,
      default: true
    }
  },
  // Last updated info
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
adminSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findById('admin_settings');
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      _id: 'admin_settings',
      paymentMethods: [],
      platformSettings: {},
      campaignSettings: {}
    });
  }
  return settings;
};

adminSettingsSchema.statics.updateSettings = async function(updateData, updatedBy) {
  return await this.findByIdAndUpdate(
    'admin_settings',
    { 
      ...updateData, 
      lastUpdatedBy: updatedBy,
      updatedAt: new Date()
    },
    { 
      new: true, 
      upsert: true,
      runValidators: true
    }
  );
};

export default mongoose.model('AdminSettings', adminSettingsSchema);
