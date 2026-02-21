import express from 'express';
import WithdrawalRequest from '../models/withdrawalRequest.js';
import Wallet from '../models/wallet.js';
import User from '../models/user.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all withdrawal requests with filters
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, currency, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (currency) filter.currency = currency;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [requests, total] = await Promise.all([
      WithdrawalRequest.find(filter)
        .populate('userId', 'email username')
        .populate('processedBy', 'email username')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WithdrawalRequest.countDocuments(filter)
    ]);
    
    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single withdrawal request
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id)
      .populate('userId', 'email username walletAddress')
      .populate('processedBy', 'email username');
    
    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching withdrawal request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Approve withdrawal request
router.patch('/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve request with status: ${request.status}` });
    }
    
    request.status = 'approved';
    request.approvedAt = new Date();
    request.processedBy = req.user._id;
    if (adminNotes) request.adminNotes = adminNotes;
    
    await request.save();
    
    res.json({ message: 'Withdrawal approved', request });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark as processing
router.patch('/:id/process', authenticateToken, isAdmin, async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: `Cannot process request with status: ${request.status}` });
    }

    request.status = 'processing';
    request.processedAt = new Date();
    request.processedBy = req.user._id;

    await request.save();

    res.json({ message: 'Withdrawal marked as processing', request });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

// Complete withdrawal (after manual payment is made)
router.patch('/:id/complete', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { txReference, adminNotes } = req.body;

    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (!['approved', 'processing'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot complete request with status: ${request.status}` });
    }

    // Update the wallet transaction status to completed
    if (request.transactionId) {
      const wallet = await Wallet.findById(request.walletId);
      if (wallet) {
        const tx = wallet.transactions.id(request.transactionId);
        if (tx) {
          tx.status = 'completed';
          tx.txHash = txReference || null;
          await wallet.save();
        }
      }
    }

    request.status = 'completed';
    request.completedAt = new Date();
    request.txReference = txReference || null;
    request.processedBy = req.user._id;
    if (adminNotes) request.adminNotes = adminNotes;

    await request.save();

    res.json({ message: 'Withdrawal completed', request });
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject withdrawal (refund balance to user)
router.patch('/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (!['pending', 'approved', 'processing'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot reject request with status: ${request.status}` });
    }

    // Refund the balance to user's wallet
    const wallet = await Wallet.findById(request.walletId);
    if (wallet) {
      // Add back the amount based on currency
      const balanceField = `${request.currency.toLowerCase()}Balance`;
      if (wallet[balanceField] !== undefined) {
        wallet[balanceField] += request.amount;
      }

      // Update the transaction status to failed
      if (request.transactionId) {
        const tx = wallet.transactions.id(request.transactionId);
        if (tx) {
          tx.status = 'failed';
        }
      }

      await wallet.save();
    }

    request.status = 'rejected';
    request.rejectedAt = new Date();
    request.rejectionReason = rejectionReason;
    request.processedBy = req.user._id;

    await request.save();

    res.json({ message: 'Withdrawal rejected and balance refunded', request });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get withdrawal statistics
router.get('/stats/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await WithdrawalRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const pending = await WithdrawalRequest.countDocuments({ status: 'pending' });

    res.json({ stats, pendingCount: pending });
  } catch (error) {
    console.error('Error fetching withdrawal stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

