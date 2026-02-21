import mongoose from 'mongoose';

const mftHoldingSchema = new mongoose.Schema({
  // Campaign this MFT belongs to
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MFTCampaign',
    required: true
  },
  // Current owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Number of MFTs held
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  // Average purchase price per MFT
  averagePurchasePrice: {
    type: Number,
    default: 0
  },
  // Total invested
  totalInvested: {
    type: Number,
    default: 0
  },
  // Total royalties earned from this holding
  totalRoyaltiesEarned: {
    type: Number,
    default: 0
  },
  // First purchase date
  firstPurchaseDate: {
    type: Date,
    default: Date.now
  },
  // Last transaction date
  lastTransactionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique user-campaign combination
mftHoldingSchema.index({ campaignId: 1, userId: 1 }, { unique: true });
mftHoldingSchema.index({ userId: 1 });
mftHoldingSchema.index({ campaignId: 1 });

// Static method to get or create holding
mftHoldingSchema.statics.getOrCreate = async function(campaignId, userId) {
  let holding = await this.findOne({ campaignId, userId });
  if (!holding) {
    holding = new this({
      campaignId,
      userId,
      quantity: 0,
      averagePurchasePrice: 0,
      totalInvested: 0
    });
    await holding.save();
  }
  return holding;
};

// Method to add MFTs (buying)
mftHoldingSchema.methods.addMFTs = function(quantity, pricePerMFT) {
  const totalCost = quantity * pricePerMFT;
  const newTotalQuantity = this.quantity + quantity;
  
  // Calculate new average price
  if (newTotalQuantity > 0) {
    this.averagePurchasePrice = (this.totalInvested + totalCost) / newTotalQuantity;
  }
  
  this.quantity = newTotalQuantity;
  this.totalInvested += totalCost;
  this.lastTransactionDate = new Date();
  
  return this;
};

// Method to remove MFTs (selling)
mftHoldingSchema.methods.removeMFTs = function(quantity) {
  if (quantity > this.quantity) {
    throw new Error('Insufficient MFT balance');
  }
  
  // Reduce total invested proportionally
  const proportionSold = quantity / this.quantity;
  this.totalInvested -= this.totalInvested * proportionSold;
  this.quantity -= quantity;
  this.lastTransactionDate = new Date();
  
  return this;
};

// Method to add royalties
mftHoldingSchema.methods.addRoyalties = function(amount) {
  this.totalRoyaltiesEarned += amount;
  return this;
};

// Ensure virtuals are included in JSON
mftHoldingSchema.set('toJSON', { virtuals: true });
mftHoldingSchema.set('toObject', { virtuals: true });

const MFTHolding = mongoose.model('MFTHolding', mftHoldingSchema);

export default MFTHolding;

