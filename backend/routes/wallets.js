import express from 'express';
import mongoose from 'mongoose';
import Wallet from '../models/wallet.js';
import ExchangeRate from '../models/exchangeRate.js';
import WithdrawalRequest from '../models/withdrawalRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get video watch count for a user
router.post('/watch-count', authenticateToken, async (req, res) => {
  try {
    const { campaignId, videoId } = req.body;
    const userId = req.user._id;

    if (!campaignId) {
      return res.status(400).json({ message: 'Campaign ID is required' });
    }

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    // Get user's wallet
    const wallet = await Wallet.getOrCreate(userId);

    // Count how many times user has watched this video
    const watchCount = wallet.watchedVideos ?
      wallet.watchedVideos.filter(item =>
        item.campaignId.toString() === campaignId &&
        item.videoId === videoId
      ).length : 0;

    // Return watch count and max watches info
    return res.status(200).json({
      watchCount,
      maxWatches: 3, // This should match the same value used in the route handler
      remaining: Math.max(0, 3 - watchCount)
    });
  } catch (error) {
    console.error('Error getting watch count:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track video watch rewards
router.post('/watch-reward', authenticateToken, async (req, res) => {
  try {
    const { campaignId, videoId } = req.body;
    const userId = req.user._id;

    if (!campaignId) {
      return res.status(400).json({ message: 'Campaign ID is required' });
    }

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    // Get user's wallet
    const wallet = await Wallet.getOrCreate(userId);

    // Count how many times user has already watched this video
    const watchCount = wallet.watchedVideos ?
      wallet.watchedVideos.filter(item =>
        item.campaignId.toString() === campaignId &&
        item.videoId === videoId
      ).length : 0;

    // User can earn rewards up to 3 times per video
    if (watchCount >= 3) {
      return res.status(400).json({
        message: 'You have already received the maximum rewards (3) for watching this video',
        alreadyWatched: true,
        watchCount
      });
    }

    console.log(`User has watched this video ${watchCount} times out of 3 maximum`);

    // Get the campaign to get reward amount
    const Campaign = mongoose.model('Campaign');
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get reward amount from the campaign
    const rewardJamz = campaign.watchRewardJamz || 5;
    const rewardUsdt = campaign.watchRewardUsdt || 0;

    // Add JAMZ reward
    wallet.jamzBalance += rewardJamz;

    // Add transaction
    wallet.transactions.push({
      type: 'reward',
      token: 'JAMZ',
      amount: rewardJamz,
      status: 'completed',
      method: 'reward',
      description: `Reward for watching video ${videoId}`
    });

    // Track this video as watched
    if (!wallet.watchedVideos) {
      wallet.watchedVideos = [];
    }

    wallet.watchedVideos.push({
      campaignId,
      videoId,
      watchedAt: new Date()
    });

    await wallet.save();

    return res.status(200).json({
      message: `You earned ${rewardJamz} JAMZ for watching this video!`,
      reward: {
        jamz: rewardJamz
      },
      wallet
    });
  } catch (error) {
    console.error('Error processing watch reward:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's wallet
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.getOrCreate(req.user._id);

    res.json({
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance,
        ngnBalance: wallet.ngnBalance,
        aedBalance: wallet.aedBalance,
        usdcAddress: wallet.usdcAddress,
        jamzAddress: wallet.jamzAddress,
        paypalEmail: wallet.paypalEmail,
        ngnBankDetails: wallet.ngnBankDetails,
        aedBankDetails: wallet.aedBankDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.getOrCreate(req.user._id);

    // Sort transactions by createdAt in descending order (newest first)
    const transactions = wallet.transactions.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set withdrawal routes (blockchain addresses, PayPal email, and bank details)
router.post('/addresses', authenticateToken, async (req, res) => {
  try {
    const {
      usdcAddress,
      jamzAddress,
      paypalEmail,
      ngnBankDetails,
      aedBankDetails
    } = req.body;

    const wallet = await Wallet.getOrCreate(req.user._id);

    if (usdcAddress) {
      wallet.usdcAddress = usdcAddress;
    }

    if (jamzAddress) {
      wallet.jamzAddress = jamzAddress;
    }

    // Handle PayPal email
    if (paypalEmail !== undefined) {
      wallet.paypalEmail = paypalEmail;
    }

    // Handle NGN bank details
    if (ngnBankDetails !== undefined) {
      wallet.ngnBankDetails = {
        accountNumber: ngnBankDetails.accountNumber || wallet.ngnBankDetails?.accountNumber || null,
        bankName: ngnBankDetails.bankName || wallet.ngnBankDetails?.bankName || null,
        accountName: ngnBankDetails.accountName || wallet.ngnBankDetails?.accountName || null,
        bankCode: ngnBankDetails.bankCode || wallet.ngnBankDetails?.bankCode || null
      };
    }

    // Handle AED bank details
    if (aedBankDetails !== undefined) {
      wallet.aedBankDetails = {
        accountNumber: aedBankDetails.accountNumber || wallet.aedBankDetails?.accountNumber || null,
        bankName: aedBankDetails.bankName || wallet.aedBankDetails?.bankName || null,
        accountName: aedBankDetails.accountName || wallet.aedBankDetails?.accountName || null,
        iban: aedBankDetails.iban || wallet.aedBankDetails?.iban || null,
        swiftCode: aedBankDetails.swiftCode || wallet.aedBankDetails?.swiftCode || null
      };
    }

    await wallet.save();

    res.json({
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance,
        ngnBalance: wallet.ngnBalance,
        aedBalance: wallet.aedBalance,
        usdcAddress: wallet.usdcAddress,
        jamzAddress: wallet.jamzAddress,
        paypalEmail: wallet.paypalEmail,
        ngnBankDetails: wallet.ngnBankDetails,
        aedBankDetails: wallet.aedBankDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initiate USDC claim (onchain)
router.post('/claim/usdt/onchain', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await Wallet.getOrCreate(req.user._id);

    if (!wallet.usdcAddress) {
      return res.status(400).json({ message: 'USDC address not set' });
    }

    if (wallet.usdcBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create a new transaction
    wallet.transactions.push({
      type: 'claim',
      token: 'USDC',
      amount,
      method: 'onchain',
      status: 'pending'
    });

    // Deduct from balance
    wallet.usdcBalance -= amount;

    await wallet.save();

    const transaction = wallet.transactions[wallet.transactions.length - 1];

    // Create withdrawal request for admin approval
    const withdrawalRequest = new WithdrawalRequest({
      userId: req.user._id,
      walletId: wallet._id,
      amount,
      currency: 'USDC',
      method: 'onchain',
      status: 'pending',
      withdrawalDetails: {
        walletAddress: wallet.usdcAddress
      },
      transactionId: transaction._id
    });
    await withdrawalRequest.save();

    res.json({
      message: 'USDC claim initiated. Your withdrawal request is pending admin approval.',
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance
      },
      transaction,
      withdrawalRequestId: withdrawalRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initiate USDC claim (via Stripe/PayPal)
router.post('/claim/usdt/stripe', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await Wallet.getOrCreate(req.user._id);

    if (wallet.usdcBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (!wallet.paypalEmail) {
      return res.status(400).json({ message: 'PayPal email not set. Please add your PayPal email first.' });
    }

    // Create a new transaction
    wallet.transactions.push({
      type: 'claim',
      token: 'USDC',
      amount,
      method: 'stripe',
      status: 'pending'
    });

    // Deduct from balance
    wallet.usdcBalance -= amount;

    await wallet.save();

    const transaction = wallet.transactions[wallet.transactions.length - 1];

    // Create withdrawal request for admin approval
    const withdrawalRequest = new WithdrawalRequest({
      userId: req.user._id,
      walletId: wallet._id,
      amount,
      currency: 'USDC',
      method: 'paypal',
      status: 'pending',
      withdrawalDetails: {
        paypalEmail: wallet.paypalEmail
      },
      transactionId: transaction._id
    });
    await withdrawalRequest.save();

    res.json({
      message: 'USDC claim via PayPal initiated. Your withdrawal request is pending admin approval.',
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance
      },
      transaction,
      withdrawalRequestId: withdrawalRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initiate JAMZ claim (onchain)
router.post('/claim/jamz/onchain', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await Wallet.getOrCreate(req.user._id);

    if (!wallet.jamzAddress) {
      return res.status(400).json({ message: 'JAMZ address not set' });
    }

    if (wallet.jamzBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create a new transaction
    wallet.transactions.push({
      type: 'claim',
      token: 'JAMZ',
      amount,
      method: 'onchain',
      status: 'pending'
    });

    // Deduct from balance
    wallet.jamzBalance -= amount;

    await wallet.save();

    const transaction = wallet.transactions[wallet.transactions.length - 1];

    // Create withdrawal request for admin approval
    const withdrawalRequest = new WithdrawalRequest({
      userId: req.user._id,
      walletId: wallet._id,
      amount,
      currency: 'JAMZ',
      method: 'onchain',
      status: 'pending',
      withdrawalDetails: {
        walletAddress: wallet.jamzAddress
      },
      transactionId: transaction._id
    });
    await withdrawalRequest.save();

    res.json({
      message: 'JAMZ claim initiated. Your withdrawal request is pending admin approval.',
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance
      },
      transaction,
      withdrawalRequestId: withdrawalRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initiate NGN claim (via bank transfer)
router.post('/claim/ngn/bank', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await Wallet.getOrCreate(req.user._id);

    if (wallet.ngnBalance < amount) {
      return res.status(400).json({ message: 'Insufficient NGN balance' });
    }

    if (!wallet.ngnBankDetails?.accountNumber || !wallet.ngnBankDetails?.bankName) {
      return res.status(400).json({ message: 'NGN bank details not set. Please add your bank account details first.' });
    }

    // Create a new transaction
    wallet.transactions.push({
      type: 'claim',
      token: 'NGN',
      amount,
      method: 'bank',
      status: 'pending'
    });

    // Deduct from balance
    wallet.ngnBalance -= amount;

    await wallet.save();

    const transaction = wallet.transactions[wallet.transactions.length - 1];

    // Create withdrawal request for admin approval
    const withdrawalRequest = new WithdrawalRequest({
      userId: req.user._id,
      walletId: wallet._id,
      amount,
      currency: 'NGN',
      method: 'bank',
      status: 'pending',
      withdrawalDetails: {
        bankDetails: {
          accountNumber: wallet.ngnBankDetails.accountNumber,
          bankName: wallet.ngnBankDetails.bankName,
          accountName: wallet.ngnBankDetails.accountName,
          bankCode: wallet.ngnBankDetails.bankCode
        }
      },
      transactionId: transaction._id
    });
    await withdrawalRequest.save();

    res.json({
      message: 'NGN claim via bank transfer initiated. Your withdrawal request is pending admin approval.',
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance,
        ngnBalance: wallet.ngnBalance,
        aedBalance: wallet.aedBalance
      },
      transaction,
      withdrawalRequestId: withdrawalRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initiate AED claim (via bank transfer)
router.post('/claim/aed/bank', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await Wallet.getOrCreate(req.user._id);

    if (wallet.aedBalance < amount) {
      return res.status(400).json({ message: 'Insufficient AED balance' });
    }

    if (!wallet.aedBankDetails?.accountNumber || !wallet.aedBankDetails?.bankName) {
      return res.status(400).json({ message: 'AED bank details not set. Please add your bank account details first.' });
    }

    // Create a new transaction
    wallet.transactions.push({
      type: 'claim',
      token: 'AED',
      amount,
      method: 'bank',
      status: 'pending'
    });

    // Deduct from balance
    wallet.aedBalance -= amount;

    await wallet.save();

    const transaction = wallet.transactions[wallet.transactions.length - 1];

    // Create withdrawal request for admin approval
    const withdrawalRequest = new WithdrawalRequest({
      userId: req.user._id,
      walletId: wallet._id,
      amount,
      currency: 'AED',
      method: 'bank',
      status: 'pending',
      withdrawalDetails: {
        bankDetails: {
          accountNumber: wallet.aedBankDetails.accountNumber,
          bankName: wallet.aedBankDetails.bankName,
          accountName: wallet.aedBankDetails.accountName,
          iban: wallet.aedBankDetails.iban,
          swiftCode: wallet.aedBankDetails.swiftCode
        }
      },
      transactionId: transaction._id
    });
    await withdrawalRequest.save();

    res.json({
      message: 'AED claim via bank transfer initiated. Your withdrawal request is pending admin approval.',
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance,
        ngnBalance: wallet.ngnBalance,
        aedBalance: wallet.aedBalance
      },
      transaction,
      withdrawalRequestId: withdrawalRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin route to add rewards to a user's wallet
router.post('/admin/reward', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { userId, token, amount } = req.body;

    if (!userId || !token || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    if (!['USDC', 'JAMZ', 'NGN', 'AED'].includes(token)) {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const wallet = await Wallet.getOrCreate(userId);

    // Add to balance
    if (token === 'USDC') {
      wallet.usdcBalance += amount;
    } else if (token === 'JAMZ') {
      wallet.jamzBalance += amount;
    } else if (token === 'NGN') {
      wallet.ngnBalance += amount;
    } else if (token === 'AED') {
      wallet.aedBalance += amount;
    }

    // Create a new transaction
    wallet.transactions.push({
      type: 'reward',
      token,
      amount,
      method: 'reward',
      status: 'completed'
    });

    await wallet.save();

    res.json({
      message: `${token} reward added`,
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance
      },
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current exchange rates
router.get('/exchange-rates', authenticateToken, async (req, res) => {
  try {
    const rates = await ExchangeRate.getRates();
    res.json({
      rates: rates.rates,
      swapFeePercentage: rates.swapFeePercentage,
      minimumSwapAmounts: rates.minimumSwapAmounts
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Execute currency swap
router.post('/swap', authenticateToken, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.body;
    const userId = req.user._id;

    // Validation
    if (!fromCurrency || !toCurrency || !fromAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (fromCurrency === toCurrency) {
      return res.status(400).json({ message: 'Cannot swap same currency' });
    }

    if (fromAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Get exchange rates and settings
    const exchangeRates = await ExchangeRate.getRates();
    const rate = await ExchangeRate.getRate(fromCurrency, toCurrency);
    const feePercentage = exchangeRates.swapFeePercentage;
    const minimumAmount = exchangeRates.minimumSwapAmounts[fromCurrency] || 0;

    // Check minimum amount
    if (fromAmount < minimumAmount) {
      return res.status(400).json({
        message: `Minimum swap amount for ${fromCurrency} is ${minimumAmount}`
      });
    }

    // Get user's wallet
    const wallet = await Wallet.getOrCreate(userId);

    // Check balance
    const balanceField = `${fromCurrency.toLowerCase()}Balance`;
    if (wallet[balanceField] < fromAmount) {
      return res.status(400).json({ message: `Insufficient ${fromCurrency} balance` });
    }

    // Calculate amounts
    const grossToAmount = fromAmount * rate;
    const feeAmount = grossToAmount * (feePercentage / 100);
    const netToAmount = grossToAmount - feeAmount;

    // Execute swap atomically
    const fromBalanceField = `${fromCurrency.toLowerCase()}Balance`;
    const toBalanceField = `${toCurrency.toLowerCase()}Balance`;

    wallet[fromBalanceField] -= fromAmount;
    wallet[toBalanceField] += netToAmount;

    // Record transaction
    wallet.transactions.push({
      type: 'swap',
      token: toCurrency, // The currency received
      amount: netToAmount,
      status: 'completed',
      method: 'swap',
      swapDetails: {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount: netToAmount,
        exchangeRate: rate,
        feeAmount,
        feePercentage
      }
    });

    await wallet.save();

    res.json({
      message: 'Swap completed successfully',
      swap: {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount: netToAmount,
        exchangeRate: rate,
        feeAmount,
        feePercentage
      },
      wallet: {
        usdcBalance: wallet.usdcBalance,
        jamzBalance: wallet.jamzBalance,
        ngnBalance: wallet.ngnBalance,
        aedBalance: wallet.aedBalance,
        inrBalance: wallet.inrBalance
      },
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    console.error('Error executing swap:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
