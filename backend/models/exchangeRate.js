import mongoose from 'mongoose';

// Schema for individual exchange rate entries
const rateEntrySchema = new mongoose.Schema({
  fromCurrency: {
    type: String,
    enum: ['USDC', 'JAMZ', 'AED', 'NGN', 'INR'],
    required: true
  },
  toCurrency: {
    type: String,
    enum: ['USDC', 'JAMZ', 'AED', 'NGN', 'INR'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Main exchange rate schema (singleton pattern)
const exchangeRateSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'exchange_rates'
  },
  rates: [rateEntrySchema],
  // Transaction fee percentage (0-100)
  swapFeePercentage: {
    type: Number,
    default: 0.5, // 0.5% default fee
    min: 0,
    max: 100
  },
  // Minimum swap amounts per currency
  minimumSwapAmounts: {
    USDC: { type: Number, default: 1 },
    JAMZ: { type: Number, default: 10 },
    AED: { type: Number, default: 5 },
    NGN: { type: Number, default: 100 },
    INR: { type: Number, default: 100 }
  },
  // Rate history for auditing
  rateHistory: [{
    fromCurrency: String,
    toCurrency: String,
    oldRate: Number,
    newRate: Number,
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Static method to get or create exchange rates
exchangeRateSchema.statics.getRates = async function() {
  let rates = await this.findById('exchange_rates');
  if (!rates) {
    // Create default rates if none exist
    rates = await this.create({
      _id: 'exchange_rates',
      rates: [
        // USDC pairs
        { fromCurrency: 'USDC', toCurrency: 'JAMZ', rate: 100 },
        { fromCurrency: 'USDC', toCurrency: 'AED', rate: 3.67 },
        { fromCurrency: 'USDC', toCurrency: 'NGN', rate: 1650 },
        { fromCurrency: 'USDC', toCurrency: 'INR', rate: 83.5 },
        // JAMZ pairs
        { fromCurrency: 'JAMZ', toCurrency: 'USDC', rate: 0.01 },
        { fromCurrency: 'JAMZ', toCurrency: 'AED', rate: 0.0367 },
        { fromCurrency: 'JAMZ', toCurrency: 'NGN', rate: 16.5 },
        { fromCurrency: 'JAMZ', toCurrency: 'INR', rate: 0.835 },
        // AED pairs
        { fromCurrency: 'AED', toCurrency: 'USDC', rate: 0.272 },
        { fromCurrency: 'AED', toCurrency: 'JAMZ', rate: 27.2 },
        { fromCurrency: 'AED', toCurrency: 'NGN', rate: 449.5 },
        { fromCurrency: 'AED', toCurrency: 'INR', rate: 22.75 },
        // NGN pairs
        { fromCurrency: 'NGN', toCurrency: 'USDC', rate: 0.00061 },
        { fromCurrency: 'NGN', toCurrency: 'JAMZ', rate: 0.061 },
        { fromCurrency: 'NGN', toCurrency: 'AED', rate: 0.00222 },
        { fromCurrency: 'NGN', toCurrency: 'INR', rate: 0.0506 },
        // INR pairs
        { fromCurrency: 'INR', toCurrency: 'USDC', rate: 0.012 },
        { fromCurrency: 'INR', toCurrency: 'JAMZ', rate: 1.2 },
        { fromCurrency: 'INR', toCurrency: 'AED', rate: 0.044 },
        { fromCurrency: 'INR', toCurrency: 'NGN', rate: 19.76 }
      ]
    });
  }
  return rates;
};

// Method to get rate for a specific currency pair
exchangeRateSchema.statics.getRate = async function(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return 1; // Same currency
  }
  
  const rates = await this.getRates();
  const rateEntry = rates.rates.find(
    r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
  );
  
  if (!rateEntry) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }
  
  return rateEntry.rate;
};

// Method to update a specific rate
exchangeRateSchema.statics.updateRate = async function(fromCurrency, toCurrency, newRate, updatedBy) {
  const rates = await this.getRates();
  const rateEntry = rates.rates.find(
    r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
  );
  
  if (!rateEntry) {
    // Add new rate if it doesn't exist
    rates.rates.push({
      fromCurrency,
      toCurrency,
      rate: newRate,
      updatedBy,
      updatedAt: new Date()
    });
  } else {
    // Update existing rate and add to history
    rates.rateHistory.push({
      fromCurrency,
      toCurrency,
      oldRate: rateEntry.rate,
      newRate,
      changedBy: updatedBy,
      changedAt: new Date()
    });
    
    rateEntry.rate = newRate;
    rateEntry.updatedBy = updatedBy;
    rateEntry.updatedAt = new Date();
  }
  
  await rates.save();
  return rates;
};

export default mongoose.model('ExchangeRate', exchangeRateSchema);

