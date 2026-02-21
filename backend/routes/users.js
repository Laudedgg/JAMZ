import express from 'express';
import User from '../models/user.js';
import Wallet from '../models/wallet.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    // Get all users
    const users = await User.find().sort({ createdAt: -1 });
    
    // Get wallets for all users
    const userIds = users.map(user => user._id);
    const wallets = await Wallet.find({ userId: { $in: userIds } });
    
    // Create a map of userId to wallet
    const walletMap = wallets.reduce((map, wallet) => {
      map[wallet.userId.toString()] = wallet;
      return map;
    }, {});
    
    // Combine user and wallet data
    const usersWithWallets = users.map(user => {
      const wallet = walletMap[user._id.toString()] || {};
      return {
        _id: user._id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress,
        authProvider: user.authProvider,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallet: {
          usdtBalance: wallet.usdtBalance || 0,
          jamzBalance: wallet.jamzBalance || 0,
          usdtAddress: wallet.usdtAddress || null,
          jamzAddress: wallet.jamzAddress || null,
          paypalEmail: wallet.paypalEmail || null,
          transactions: wallet.transactions || []
        }
      };
    });
    
    res.json(usersWithWallets);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single user by ID (admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    // Get user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get wallet
    const wallet = await Wallet.findOne({ userId: user._id });
    
    // Combine user and wallet data
    const userWithWallet = {
      _id: user._id,
      email: user.email,
      username: user.username,
      walletAddress: user.walletAddress,
      authProvider: user.authProvider,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      wallet: wallet ? {
        usdtBalance: wallet.usdtBalance || 0,
        jamzBalance: wallet.jamzBalance || 0,
        usdtAddress: wallet.usdtAddress || null,
        jamzAddress: wallet.jamzAddress || null,
        paypalEmail: wallet.paypalEmail || null,
        transactions: wallet.transactions || []
      } : null
    };
    
    res.json(userWithWallet);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
