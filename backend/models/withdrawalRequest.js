import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USDC', 'JAMZ', 'NGN', 'AED', 'INR'],
    required: true
  },
  method: {
    type: String,
    enum: ['onchain', 'stripe', 'paypal', 'bank'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  // Withdrawal destination details (copied at time of request)
  withdrawalDetails: {
    // For onchain (USDC/JAMZ)
    walletAddress: { type: String, default: null },
    // For PayPal
    paypalEmail: { type: String, default: null },
    // For bank transfers
    bankDetails: {
      accountNumber: { type: String, default: null },
      bankName: { type: String, default: null },
      accountName: { type: String, default: null },
      bankCode: { type: String, default: null },
      iban: { type: String, default: null },
      swiftCode: { type: String, default: null },
      ifscCode: { type: String, default: null },
      upiId: { type: String, default: null }
    }
  },
  // Reference to the wallet transaction created for this withdrawal
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Admin processing fields
  adminNotes: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Transaction reference/hash after payment is made
  txReference: {
    type: String,
    default: null
  },
  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ userId: 1 });
withdrawalRequestSchema.index({ requestedAt: -1 });
withdrawalRequestSchema.index({ currency: 1 });

// Virtual to get user details
withdrawalRequestSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Enable virtuals in JSON
withdrawalRequestSchema.set('toJSON', { virtuals: true });
withdrawalRequestSchema.set('toObject', { virtuals: true });

export default mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

