import express from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import ArtistWallet from '../models/artistWallet.js';
import AdminSettings from '../models/adminSettings.js';
import { authenticateToken } from '../middleware/auth.js';
import ArtistAuth from '../models/artistAuth.js';

const router = express.Router();

// Lazy-load Stripe (environment variables are available after dotenv.config())
let stripe = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    console.log('Stripe initialized successfully');
  }
  return stripe;
};

// NowPayments configuration
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';
const getNowPaymentsApiKey = () => process.env.NOWPAYMENTS_API_KEY;

// Rate limiting protection
let lastApiCall = 0;
const API_RATE_LIMIT_MS = 2000; // 2 seconds between calls

const rateLimitedApiCall = async (apiCall) => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;

  if (timeSinceLastCall < API_RATE_LIMIT_MS) {
    const waitTime = API_RATE_LIMIT_MS - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${waitTime}ms before API call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastApiCall = Date.now();
  return await apiCall();
};

// TEMPORARY TEST ENDPOINT - Test payment methods transformation without auth
router.get('/test-payment-methods', async (req, res) => {
  try {
    console.log('🧪 TEST: Testing payment methods transformation...');

    // Get payment methods from admin settings
    const adminSettings = await AdminSettings.getSettings();
    console.log('📊 Admin settings found, payment methods count:', adminSettings.paymentMethods?.length || 0);

    const enabledPaymentMethods = adminSettings.paymentMethods.filter(method => method.isEnabled);
    console.log('✅ Enabled payment methods count:', enabledPaymentMethods.length);

    // Log each payment method
    enabledPaymentMethods.forEach((method, index) => {
      console.log(`  ${index + 1}. ${method.name} (${method.type}) - Enabled: ${method.isEnabled}`);
    });

    // Transform admin payment methods to the format expected by frontend
    const fundingMethods = {};

    enabledPaymentMethods.forEach(method => {
      console.log(`🔄 Processing: ${method.name} (${method.type})`);

      if (method.type === 'USDC_TRC20' || method.type === 'USDC_BEP20') {
        fundingMethods.usdt = fundingMethods.usdt || [];
        fundingMethods.usdt.push({
          name: method.name,
          address: method.walletAddress,
          network: method.type === 'USDC_TRC20' ? 'TRC20' : 'BEP20',
          minimumAmount: method.minimumAmount
        });
        console.log('  → Added to USDC methods');
      } else if (method.type === 'BANK_USD' || method.type === 'BANK_NGN' || method.type === 'BANK_AED') {
        const currency = method.type.split('_')[1].toLowerCase();
        fundingMethods[currency] = fundingMethods[currency] || [];
        fundingMethods[currency].push({
          name: method.name,
          bankName: method.bankName,
          accountNumber: method.accountNumber,
          accountHolder: method.accountHolder,
          swiftCode: method.swiftCode,
          minimumAmount: method.minimumAmount
        });
        console.log(`  → Added to ${currency.toUpperCase()} methods`);
      } else {
        console.log(`  → Unknown type: ${method.type}`);
      }
    });

    console.log('📋 Final funding methods structure:');
    console.log(JSON.stringify(fundingMethods, null, 2));

    const response = {
      balances: {
        usdt: 0,
        ngn: 0,
        aed: 0,
        totalUSD: 0
      },
      fundingMethods: fundingMethods,
      campaignPricing: {
        basic: 50,
        premium: 100,
        enterprise: 200
      },
      settings: {
        autoWithdraw: false,
        minimumBalance: 10
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get artist wallet information
router.get('/', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied. Artist only.' });
  }

  try {
    const wallet = await ArtistWallet.getOrCreate(req.user.artistId);

    // Get payment methods from admin settings
    const adminSettings = await AdminSettings.getSettings();
    const enabledPaymentMethods = adminSettings.paymentMethods.filter(method => method.isEnabled);

    // Transform admin payment methods to the format expected by frontend
    const fundingMethods = {};

    enabledPaymentMethods.forEach(method => {
      if (method.type === 'USDC_TRC20' || method.type === 'USDC_BEP20') {
        fundingMethods.usdt = fundingMethods.usdt || [];
        fundingMethods.usdt.push({
          name: method.name,
          address: method.walletAddress,
          network: method.type === 'USDC_TRC20' ? 'TRC20' : 'BEP20',
          minimumAmount: method.minimumAmount
        });
      } else if (method.type === 'BANK_USD' || method.type === 'BANK_NGN' || method.type === 'BANK_AED') {
        const currency = method.type.split('_')[1].toLowerCase();
        fundingMethods[currency] = fundingMethods[currency] || [];
        fundingMethods[currency].push({
          name: method.name,
          bankName: method.bankName,
          accountNumber: method.accountNumber,
          accountHolder: method.accountHolder,
          swiftCode: method.swiftCode,
          minimumAmount: method.minimumAmount
        });
      }
    });

    res.json({
      balances: {
        usdt: wallet.usdcBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        inr: wallet.inrBalance,
        totalUSD: wallet.totalBalanceUSD
      },
      fundingMethods: fundingMethods,
      campaignPricing: wallet.campaignPricing,
      settings: wallet.settings
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get wallet transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied. Artist only.' });
  }

  try {
    const { page = 1, limit = 20, type, currency, status } = req.query;
    
    const wallet = await ArtistWallet.findOne({ artistId: req.user.artistId });
    if (!wallet) {
      return res.json({ transactions: [], total: 0, page: 1, totalPages: 0 });
    }

    let transactions = wallet.transactions;

    // Apply filters
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    if (currency) {
      transactions = transactions.filter(tx => tx.currency === currency);
    }
    if (status) {
      transactions = transactions.filter(tx => tx.status === status);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      total: transactions.length,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.length / limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get funding methods and deposit instructions
router.get('/funding-methods', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied. Artist only.' });
  }

  try {
    // Get payment methods from admin settings
    const adminSettings = await AdminSettings.getSettings();
    const enabledPaymentMethods = adminSettings.paymentMethods.filter(method => method.isEnabled);

    // Transform admin payment methods to the format expected by frontend
    const fundingMethods = {};

    enabledPaymentMethods.forEach(method => {
      if (method.type === 'crypto') {
        if (method.cryptoType === 'USDC_TRC20') {
          fundingMethods.usdt = {
            walletAddress: method.walletAddress,
            minimumAmount: method.minimumAmount || 10,
            instructions: `Send USDC to the wallet address above using TRC20 network. Minimum deposit: $${method.minimumAmount || 10} USDC`
          };
        }
      } else if (method.type === 'bank') {
        if (method.currency === 'NGN') {
          fundingMethods.ngn = {
            bankName: method.bankName,
            accountNumber: method.accountNumber,
            accountName: method.accountHolderName,
            minimumAmount: method.minimumAmount || 5000,
            instructions: `Transfer NGN to the bank account above. Include your artist email in the transfer description. Minimum deposit: ₦${method.minimumAmount || 5000}`
          };
        } else if (method.currency === 'AED') {
          fundingMethods.aed = {
            bankName: method.bankName,
            iban: method.iban,
            accountName: method.accountHolderName,
            swiftCode: method.swiftCode,
            minimumAmount: method.minimumAmount || 50,
            instructions: `Transfer AED to the bank account above using the IBAN. Include your artist email in the transfer description. Minimum deposit: ${method.minimumAmount || 50} AED`
          };
        }
      }
    });

    res.json(fundingMethods);
  } catch (error) {
    console.error('Error fetching funding methods:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Calculate campaign cost
router.post('/calculate-campaign-cost', authenticateToken, async (req, res) => {
  // Check if user is an artist
  if (!req.user.isArtist) {
    return res.status(403).json({ message: 'Access denied. Artist only.' });
  }

  try {
    const { 
      duration = 1, // weeks
      premiumPlacement = false,
      multiPlatform = false,
      additionalPlatforms = 0
    } = req.body;

    const wallet = await ArtistWallet.getOrCreate(req.user.artistId);
    
    let totalCost = wallet.campaignPricing.baseCost;

    // Add extended duration cost
    if (duration > 1) {
      totalCost += (duration - 1) * wallet.campaignPricing.additionalCosts.extendedDuration;
    }

    // Add premium placement cost
    if (premiumPlacement) {
      totalCost += wallet.campaignPricing.additionalCosts.premiumPlacement;
    }

    // Add multi-platform cost
    if (multiPlatform && additionalPlatforms > 0) {
      totalCost += additionalPlatforms * wallet.campaignPricing.additionalCosts.multiPlatform;
    }

    // Check if artist has sufficient balance
    const hasSufficientBalance = wallet.hasSufficientBalance(totalCost);

    res.json({
      costBreakdown: {
        baseCost: wallet.campaignPricing.baseCost,
        extendedDurationCost: duration > 1 ? (duration - 1) * wallet.campaignPricing.additionalCosts.extendedDuration : 0,
        premiumPlacementCost: premiumPlacement ? wallet.campaignPricing.additionalCosts.premiumPlacement : 0,
        multiPlatformCost: multiPlatform ? additionalPlatforms * wallet.campaignPricing.additionalCosts.multiPlatform : 0,
        totalCost
      },
      hasSufficientBalance,
      currentBalance: {
        usdt: wallet.usdcBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        inr: wallet.inrBalance,
        totalUSD: wallet.totalBalanceUSD
      }
    });
  } catch (error) {
    console.error('Error calculating campaign cost:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin endpoints for wallet management

// Add deposit (admin only)
router.post('/admin/add-deposit', authenticateToken, async (req, res) => {
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const { artistId, amount, currency, reference } = req.body;

    if (!artistId || !amount || !currency) {
      return res.status(400).json({ message: 'Artist ID, amount, and currency are required' });
    }

    // Accept USDT, USDC, NGN, AED, INR
    if (!['USDT', 'USDC', 'NGN', 'AED', 'INR'].includes(currency)) {
      return res.status(400).json({ message: 'Invalid currency. Must be USDT, USDC, NGN, AED, or INR' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const wallet = await ArtistWallet.getOrCreate(artistId);

    wallet.addDeposit(
      amount,
      currency,
      reference || null,
      req.user._id
    );

    await wallet.save();

    res.json({
      message: 'Deposit added successfully',
      newBalance: {
        usdt: wallet.usdcBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        inr: wallet.inrBalance,
        totalUSD: wallet.totalBalanceUSD
      }
    });
  } catch (error) {
    console.error('Error adding deposit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all artist wallets (admin only)
router.get('/admin/all', authenticateToken, async (req, res) => {
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const wallets = await ArtistWallet.find({})
      .populate('artistId', 'name email')
      .sort({ createdAt: -1 });

    const walletsWithSummary = wallets.map(wallet => ({
      artistId: wallet.artistId._id,
      artistName: wallet.artistId.name,
      balances: {
        usdt: wallet.usdcBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        inr: wallet.inrBalance,
        totalUSD: wallet.totalBalanceUSD
      },
      totalTransactions: wallet.transactions.length,
      lastTransaction: wallet.transactions.length > 0
        ? wallet.transactions[wallet.transactions.length - 1].createdAt
        : null,
      createdAt: wallet.createdAt
    }));

    res.json(walletsWithSummary);
  } catch (error) {
    console.error('Error fetching all wallets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific artist wallet (admin only)
router.get('/admin/:artistId', authenticateToken, async (req, res) => {
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const { artistId } = req.params;
    
    const wallet = await ArtistWallet.findOne({ artistId })
      .populate('artistId', 'name email bio');

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json({
      artist: wallet.artistId,
      balances: {
        usdt: wallet.usdcBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        inr: wallet.inrBalance,
        totalUSD: wallet.totalBalanceUSD
      },
      fundingMethods: wallet.fundingMethods,
      transactions: wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      campaignPricing: wallet.campaignPricing,
      settings: wallet.settings,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt
    });
  } catch (error) {
    console.error('Error fetching artist wallet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payment endpoints

// Create Stripe payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    // Get Stripe instance (lazy initialization)
    const stripeInstance = getStripe();

    // Check if Stripe is configured
    if (!stripeInstance) {
      console.error('Stripe not configured - missing STRIPE_SECRET_KEY');
      return res.status(503).json({ message: 'Stripe payment processing is not configured' });
    }

    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Access denied. Artist only.' });
    }

    const { amount, currency } = req.body;
    console.log(`Creating payment intent: amount=${amount}, currency=${currency}, user=${req.user._id}`);

    // Validate amount and currency
    if (!amount || amount < 50) { // Minimum $0.50
      return res.status(400).json({ message: 'Invalid amount. Minimum is $0.50' });
    }

    if (!['usd', 'ngn', 'aed', 'inr'].includes(currency.toLowerCase())) {
      return res.status(400).json({ message: 'Unsupported currency' });
    }

    // Use artistId for wallet lookup (the Artist document reference, not the ArtistAuth document ID)
    const artistId = req.user.artistId ? req.user.artistId.toString() : req.user._id.toString();

    // Create payment intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency.toLowerCase(),
      metadata: {
        artistId: artistId,
        type: 'wallet_funding'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`Payment intent created for artist ${artistId}: ${paymentIntent.id}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
});

// Confirm Stripe payment and credit wallet (fallback for when webhook doesn't work)
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    // Get Stripe instance (lazy initialization)
    const stripeInstance = getStripe();

    // Check if Stripe is configured
    if (!stripeInstance) {
      console.error('Stripe not configured - missing STRIPE_SECRET_KEY');
      return res.status(503).json({ message: 'Stripe payment processing is not configured' });
    }

    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Access denied. Artist only.' });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    // Use artistId for wallet lookup (the Artist document reference, not the ArtistAuth document ID)
    const artistId = req.user.artistId ? req.user.artistId.toString() : req.user._id.toString();

    console.log(`Confirming payment ${paymentIntentId} for artist ${artistId}`);

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

    console.log(`Payment intent status: ${paymentIntent.status}, metadata artistId: ${paymentIntent.metadata.artistId}`);

    // Verify the payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }

    // Verify the payment is for this artist
    if (paymentIntent.metadata.artistId !== artistId) {
      console.error(`Artist ID mismatch: payment has ${paymentIntent.metadata.artistId}, user is ${artistId}`);
      return res.status(403).json({ message: 'Payment does not belong to this artist' });
    }

    // Get or create wallet for artist (auto-create if first payment)
    let wallet = await ArtistWallet.findOne({ artistId: artistId });
    if (!wallet) {
      console.log(`Creating new wallet for artist ${artistId} (first payment)`);
      wallet = new ArtistWallet({
        artistId: artistId,
        usdcBalance: 0,
        ngnBalance: 0,
        aedBalance: 0,
        inrBalance: 0
      });
    }

    const existingTransaction = wallet.transactions.find(
      tx => tx.externalReference === paymentIntentId && tx.status === 'completed'
    );

    if (existingTransaction) {
      // Payment already credited - return success but don't double-credit
      return res.json({
        success: true,
        message: 'Payment already credited',
        alreadyCredited: true,
        newBalance: {
          usdt: wallet.usdcBalance,
          ngn: wallet.ngnBalance,
          aed: wallet.aedBalance,
          inr: wallet.inrBalance,
          totalUSD: wallet.totalBalanceUSD
        }
      });
    }

    // Credit the wallet
    const amount = paymentIntent.amount / 100; // Convert from cents
    const stripeCurrency = paymentIntent.currency.toUpperCase();

    // Map Stripe currency to our schema currency (USD -> USDT for wallet storage)
    // The schema enum allows: 'USDT', 'NGN', 'AED', 'INR'
    const walletCurrency = stripeCurrency === 'USD' ? 'USDT' : stripeCurrency;

    if (stripeCurrency === 'USD') {
      wallet.usdcBalance = (wallet.usdcBalance || 0) + amount;
    } else if (stripeCurrency === 'NGN') {
      wallet.ngnBalance = (wallet.ngnBalance || 0) + amount;
    } else if (stripeCurrency === 'AED') {
      wallet.aedBalance = (wallet.aedBalance || 0) + amount;
    } else if (stripeCurrency === 'INR') {
      wallet.inrBalance = (wallet.inrBalance || 0) + amount;
    }

    // Add transaction record with schema-compatible currency
    wallet.transactions.push({
      type: 'deposit',
      currency: walletCurrency, // Use mapped currency that matches schema enum
      amount: amount,
      description: `Card payment deposit (${stripeCurrency})`,
      status: 'completed',
      externalReference: paymentIntentId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await wallet.save();

    console.log(`Successfully credited wallet for artist ${artistId}: ${amount} ${stripeCurrency} (stored as ${walletCurrency})`);

    res.json({
      success: true,
      message: 'Payment confirmed and credited',
      amount: amount,
      currency: stripeCurrency,
      walletCurrency: walletCurrency,
      newBalance: {
        usdt: wallet.usdcBalance,
        ngn: wallet.ngnBalance,
        aed: wallet.aedBalance,
        inr: wallet.inrBalance,
        totalUSD: wallet.totalBalanceUSD
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Create NowPayments crypto payment
router.post('/create-crypto-payment', authenticateToken, async (req, res) => {
  try {
    // Check if NowPayments is configured
    if (!NOWPAYMENTS_API_KEY) {
      return res.status(503).json({ message: 'Crypto payment processing is not configured' });
    }

    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Access denied. Artist only.' });
    }

    const { price_amount, price_currency, pay_currency, order_id, order_description } = req.body;

    // Validate input
    if (!price_amount || price_amount < 10) {
      return res.status(400).json({ message: 'Invalid amount. Minimum is $10' });
    }

    if (!['usdc'].includes(pay_currency.toLowerCase())) {
      return res.status(400).json({ message: 'Unsupported cryptocurrency. Only USDC is supported.' });
    }

    // Use artistId for wallet lookup (the Artist document reference, not the ArtistAuth document ID)
    const artistId = req.user.artistId ? req.user.artistId.toString() : req.user._id.toString();

    // Create payment with NowPayments
    const paymentData = {
      price_amount: price_amount,
      price_currency: price_currency || 'USD',
      pay_currency: pay_currency.toLowerCase(),
      order_id: order_id || `wallet-${artistId}-${Date.now()}`,
      order_description: order_description || `Wallet funding for artist ${artistId}`,
      ipn_callback_url: `${process.env.BASE_URL}/api/artist/wallet/nowpayments-callback`,
      success_url: `${process.env.FRONTEND_URL}/artist/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/artist/dashboard?payment=cancelled`
    };

    const response = await axios.post(`${NOWPAYMENTS_BASE_URL}/payment`, paymentData, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Store payment reference in database for tracking
    const wallet = await ArtistWallet.findOne({ artistId: artistId });
    if (wallet) {
      wallet.transactions.push({
        type: 'deposit',
        currency: 'USDT', // Use schema-compatible currency (USD -> USDT)
        amount: price_amount,
        description: `Crypto payment pending - ${pay_currency.toUpperCase()} (USD)`,
        status: 'pending',
        externalReference: response.data.payment_id,
        updatedAt: new Date()
      });
      await wallet.save();
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error creating crypto payment:', error);
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Failed to create crypto payment'
      });
    } else {
      res.status(500).json({ message: 'Failed to create crypto payment' });
    }
  }
});

// Check crypto payment status
router.get('/crypto-payment-status/:paymentId', authenticateToken, async (req, res) => {
  try {
    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Access denied. Artist only.' });
    }

    const { paymentId } = req.params;

    const response = await axios.get(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error checking payment status:', error);
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Failed to check payment status'
      });
    } else {
      res.status(500).json({ message: 'Failed to check payment status' });
    }
  }
});

// Get available bank accounts for funding
router.get('/bank-accounts', async (req, res) => {
  try {
    // Get admin settings to fetch enabled bank payment methods
    const adminSettings = await AdminSettings.getSettings();
    const bankAccounts = adminSettings.paymentMethods
      .filter(method => method.type === 'bank' && method.isEnabled)
      .map(method => ({
        id: method._id.toString(),
        name: method.name,
        currency: method.currency,
        bankName: method.bankName,
        accountHolderName: method.accountHolderName,
        accountNumber: method.accountNumber,
        routingNumber: method.routingNumber,
        swiftCode: method.swiftCode,
        iban: method.iban,
        bankAddress: method.bankAddress,
        additionalInfo: method.additionalInfo,
        minimumAmount: method.minimumAmount || 0
      }));

    res.json({
      success: true,
      bankAccounts
    });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank accounts',
      error: error.message
    });
  }
});

// Test endpoint for payment functionality (no auth required)
router.get('/test-payment-integration', async (req, res) => {
  try {
    res.json({
      message: 'Payment integration is working!',
      features: {
        stripe: {
          configured: !!getStripe(),
          supportedCurrencies: ['USD', 'NGN', 'AED', 'INR'],
          minimumAmounts: {
            USD: 0.50,
            NGN: 50,
            AED: 2,
            INR: 10
          }
        },
        nowpayments: {
          configured: !!getNowPaymentsApiKey(),
          supportedCrypto: ['USDC'],
          minimumAmount: 10
        },
        bankTransfer: {
          configured: true,
          supportedCurrencies: ['USD', 'NGN', 'AED', 'INR'],
          note: 'Bank accounts configured via admin settings'
        }
      },
      endpoints: {
        createStripePayment: '/api/artist/wallet/create-payment-intent',
        createCryptoPayment: '/api/artist/wallet/create-crypto-payment',
        checkCryptoStatus: '/api/artist/wallet/crypto-payment-status/:paymentId',
        getBankAccounts: '/api/artist/wallet/bank-accounts'
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ message: 'Test endpoint error' });
  }
});

// Test Stripe payment intent creation (no auth required for demo)
router.post('/test-create-payment-intent', async (req, res) => {
  try {
    // Check if Stripe is configured
    const stripeInstance = getStripe();
    if (!stripeInstance) {
      return res.status(503).json({ message: 'Stripe payment processing is not configured' });
    }

    const { amount, currency } = req.body;

    // Validate amount and currency
    if (!amount || amount < 50) { // Minimum $0.50
      return res.status(400).json({ message: 'Invalid amount. Minimum is $0.50' });
    }

    if (!['usd', 'ngn', 'aed'].includes(currency.toLowerCase())) {
      return res.status(400).json({ message: 'Unsupported currency' });
    }

    // Create payment intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency.toLowerCase(),
      metadata: {
        artistId: 'test-artist-id',
        type: 'wallet_funding_test'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating test payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Test crypto payment creation (no auth required for demo)
router.post('/test-create-crypto-payment', async (req, res) => {
  try {
    const { price_amount, price_currency, pay_currency, order_id, order_description } = req.body;

    // Validate required fields
    if (!price_amount || !price_currency || !pay_currency) {
      return res.status(400).json({ message: 'Missing required fields: price_amount, price_currency, pay_currency' });
    }

    // Check if NowPayments is configured
    const nowPaymentsApiKey = getNowPaymentsApiKey();
    if (!nowPaymentsApiKey || nowPaymentsApiKey === 'placeholder_replace_with_real_nowpayments_key') {
      // Return mock response for demo purposes
      return res.json({
        payment_id: 'demo_payment_' + Date.now(),
        payment_status: 'waiting',
        pay_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Demo Bitcoin address
        price_amount: price_amount,
        price_currency: price_currency.toUpperCase(),
        pay_amount: price_amount * 0.000025, // Mock conversion rate
        pay_currency: pay_currency.toUpperCase(),
        order_id: order_id || `demo_order_${Date.now()}`,
        order_description: order_description || 'Demo crypto payment',
        payment_url: `https://demo.nowpayments.io/payment/${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        demo_mode: true,
        message: 'This is a demo response. Configure NOWPAYMENTS_API_KEY for live payments.'
      });
    }

    // If NowPayments is configured, make real API call with rate limiting
    const paymentData = {
      price_amount: parseFloat(price_amount),
      price_currency: price_currency.toLowerCase(), // NowPayments uses lowercase
      pay_currency: pay_currency.toLowerCase(), // NowPayments uses lowercase
      order_id: order_id || `wallet-funding-${Date.now()}`,
      order_description: order_description || `Wallet funding - ${price_amount} ${price_currency.toUpperCase()}`,
      ipn_callback_url: `${process.env.BASE_URL}/api/artist/wallet/nowpayments-callback`,
      success_url: `${process.env.FRONTEND_URL}/artist-dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/artist-dashboard?payment=cancelled`
    };

    const response = await rateLimitedApiCall(async () => {
      return await axios.post(`${NOWPAYMENTS_BASE_URL}/payment`, paymentData, {
        headers: {
          'x-api-key': nowPaymentsApiKey,
          'Content-Type': 'application/json'
        }
      });
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error creating test crypto payment:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data || 'Failed to create crypto payment';

      if (status === 429) {
        // Return demo response for rate limiting
        const demoResponse = {
          payment_id: `demo_${Date.now()}`,
          payment_status: "waiting",
          pay_address: "DEMO_ADDRESS_" + pay_currency.toUpperCase(),
          price_amount: parseFloat(price_amount),
          price_currency: price_currency,
          pay_amount: parseFloat(price_amount) * 0.998, // Mock conversion
          pay_currency: pay_currency,
          order_id: order_id || `demo-order-${Date.now()}`,
          order_description: order_description || `Demo payment - ${price_amount} ${price_currency.toUpperCase()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          network: pay_currency.includes('trc20') ? 'trx' : pay_currency.includes('bsc') ? 'bsc' : 'eth',
          demo_mode: true,
          message: 'Demo mode: Rate limit exceeded. This is a simulated payment for testing.'
        };

        res.json(demoResponse);
      } else {
        res.status(status).json({
          message: typeof message === 'string' ? message : 'Failed to create crypto payment',
          error: 'API_ERROR',
          details: error.response.data
        });
      }
    } else {
      res.status(500).json({
        message: 'Failed to create crypto payment',
        error: 'NETWORK_ERROR'
      });
    }
  }
});

// Test crypto payment status check (no auth required for demo)
router.get('/test-crypto-payment-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Check if this is a demo payment
    if (paymentId.startsWith('demo_payment_')) {
      // Return mock status for demo payments
      const statuses = ['waiting', 'confirming', 'confirmed', 'finished'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return res.json({
        payment_id: paymentId,
        payment_status: randomStatus,
        pay_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        price_amount: 50,
        price_currency: 'USD',
        pay_amount: 0.00125,
        pay_currency: 'BTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        demo_mode: true,
        message: 'This is a demo status response. Configure NOWPAYMENTS_API_KEY for live payments.'
      });
    }

    // Check if NowPayments is configured
    const nowPaymentsApiKey = getNowPaymentsApiKey();
    if (!nowPaymentsApiKey || nowPaymentsApiKey === 'placeholder_replace_with_real_nowpayments_key') {
      return res.status(503).json({ message: 'NowPayments is not configured' });
    }

    // If NowPayments is configured, make real API call
    const response = await axios.get(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
      headers: {
        'x-api-key': nowPaymentsApiKey
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error checking test payment status:', error);
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Failed to check payment status'
      });
    } else {
      res.status(500).json({ message: 'Failed to check payment status' });
    }
  }
});

// Get available cryptocurrencies from NowPayments
router.get('/available-currencies', async (req, res) => {
  try {
    const nowPaymentsApiKey = getNowPaymentsApiKey();
    if (!nowPaymentsApiKey || nowPaymentsApiKey === 'placeholder_replace_with_real_nowpayments_key') {
      return res.json({
        currencies: ['usdcbase', 'usdcbsc', 'usdcsol', 'usdcmatic', 'usdc', 'usdttrc20', 'usdtbsc'],
        demo_mode: true
      });
    }

    const response = await axios.get(`${NOWPAYMENTS_BASE_URL}/currencies`, {
      headers: {
        'x-api-key': nowPaymentsApiKey
      }
    });

    // Filter to show only popular cryptocurrencies and stablecoins
    const popularCryptos = [
      // USDC stablecoins (priority)
      'usdcbase',   // USDC on Base
      'usdcbsc',    // USDC on BSC
      'usdcsol',    // USDC on Solana
      'usdcmatic',  // USDC on Polygon
      'usdc',       // USDC on Ethereum
      // USDT stablecoins
      'usdttrc20',  // USDT on Tron
      'usdtbsc',    // USDT on BSC
      'usdterc20',  // USDT on Ethereum
      // Major cryptocurrencies
      'btc', 'eth', 'ltc', 'bnbbsc', 'sol', 'avax', 'matic'
    ];
    const availableCurrencies = response.data.currencies.filter(currency =>
      popularCryptos.includes(currency.toLowerCase())
    );

    res.json({
      currencies: availableCurrencies,
      demo_mode: false
    });
  } catch (error) {
    console.error('Error fetching available currencies:', error);
    res.status(500).json({ message: 'Failed to fetch available currencies' });
  }
});

// Get estimate for crypto payment
router.get('/crypto-estimate', async (req, res) => {
  try {
    const { amount, currency_from, currency_to } = req.query;

    if (!amount || !currency_from || !currency_to) {
      return res.status(400).json({ message: 'Missing required parameters: amount, currency_from, currency_to' });
    }

    const nowPaymentsApiKey = getNowPaymentsApiKey();
    if (!nowPaymentsApiKey || nowPaymentsApiKey === 'placeholder_replace_with_real_nowpayments_key') {
      // Return mock estimate for demo
      const mockRates = {
        usdttrc20: 1.002,
        btc: 0.0000234,
        eth: 0.000345,
        ltc: 0.0123
      };
      const estimatedAmount = parseFloat(amount) * (mockRates[currency_to.toLowerCase()] || 1);

      return res.json({
        currency_from: currency_from,
        amount_from: parseFloat(amount),
        currency_to: currency_to,
        estimated_amount: estimatedAmount.toFixed(8),
        demo_mode: true
      });
    }

    const response = await rateLimitedApiCall(async () => {
      return await axios.get(`${NOWPAYMENTS_BASE_URL}/estimate`, {
        params: {
          amount: amount,
          currency_from: currency_from,
          currency_to: currency_to
        },
        headers: {
          'x-api-key': nowPaymentsApiKey
        }
      });
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error getting crypto estimate:', error);
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Failed to get estimate'
      });
    } else {
      res.status(500).json({ message: 'Failed to get estimate' });
    }
  }
});

// Get minimum payment amount
router.get('/crypto-min-amount', async (req, res) => {
  try {
    const { currency_from, currency_to } = req.query;

    if (!currency_from || !currency_to) {
      return res.status(400).json({ message: 'Missing required parameters: currency_from, currency_to' });
    }

    const nowPaymentsApiKey = getNowPaymentsApiKey();
    if (!nowPaymentsApiKey || nowPaymentsApiKey === 'placeholder_replace_with_real_nowpayments_key') {
      // Return mock minimum amounts
      return res.json({
        currency_from: currency_from,
        currency_to: currency_to,
        min_amount: 10,
        demo_mode: true
      });
    }

    const response = await axios.get(`${NOWPAYMENTS_BASE_URL}/min-amount`, {
      params: {
        currency_from: currency_from,
        currency_to: currency_to
      },
      headers: {
        'x-api-key': nowPaymentsApiKey
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error getting minimum amount:', error);
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Failed to get minimum amount'
      });
    } else {
      res.status(500).json({ message: 'Failed to get minimum amount' });
    }
  }
});

// Stripe webhook to handle successful payments
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    console.error('Stripe webhook called but Stripe not configured');
    return res.status(503).send('Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent, 'stripe');
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// NowPayments IPN callback
router.post('/nowpayments-callback', express.json(), async (req, res) => {
  try {
    const paymentData = req.body;

    // Verify the callback (you should implement signature verification in production)
    if (paymentData.payment_status === 'finished') {
      await handleSuccessfulPayment(paymentData, 'nowpayments');
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling NowPayments callback:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// Helper function to handle successful payments
async function handleSuccessfulPayment(paymentData, provider) {
  try {
    let artistId, amount, stripeCurrency, externalReference;

    if (provider === 'stripe') {
      artistId = paymentData.metadata.artistId;
      amount = paymentData.amount / 100; // Convert from cents
      stripeCurrency = paymentData.currency.toUpperCase();
      externalReference = paymentData.id;
    } else if (provider === 'nowpayments') {
      // Extract artist ID from order_id or description
      const orderParts = paymentData.order_id.split('-');
      artistId = orderParts[1]; // Assuming format: wallet-{artistId}-{timestamp}
      amount = paymentData.price_amount;
      stripeCurrency = paymentData.price_currency.toUpperCase();
      externalReference = paymentData.payment_id;
    }

    // Map currency to schema-compatible value (USD -> USDT)
    // The schema enum allows: 'USDT', 'NGN', 'AED', 'INR'
    const walletCurrency = stripeCurrency === 'USD' ? 'USDT' : stripeCurrency;

    // Find or create wallet for artist
    let wallet = await ArtistWallet.findOne({ artistId });
    if (!wallet) {
      console.log(`Creating new wallet for artist ${artistId} via webhook`);
      wallet = new ArtistWallet({
        artistId: artistId,
        usdcBalance: 0,
        ngnBalance: 0,
        aedBalance: 0,
        inrBalance: 0
      });
    }

    // Add deposit to wallet
    if (stripeCurrency === 'USD') {
      wallet.usdcBalance = (wallet.usdcBalance || 0) + amount;
    } else if (stripeCurrency === 'NGN') {
      wallet.ngnBalance = (wallet.ngnBalance || 0) + amount;
    } else if (stripeCurrency === 'AED') {
      wallet.aedBalance = (wallet.aedBalance || 0) + amount;
    } else if (stripeCurrency === 'INR') {
      wallet.inrBalance = (wallet.inrBalance || 0) + amount;
    }

    // Update transaction status or add new transaction
    const existingTransaction = wallet.transactions.find(
      tx => tx.externalReference === externalReference
    );

    if (existingTransaction) {
      existingTransaction.status = 'completed';
      existingTransaction.updatedAt = new Date();
    } else {
      wallet.transactions.push({
        type: 'deposit',
        currency: walletCurrency, // Use schema-compatible currency
        amount: amount,
        description: `${provider === 'stripe' ? 'Card' : 'Crypto'} payment deposit (${stripeCurrency})`,
        status: 'completed',
        externalReference: externalReference,
        updatedAt: new Date()
      });
    }

    await wallet.save();
    console.log(`Successfully processed ${provider} payment for artist ${artistId}: ${amount} ${stripeCurrency} (stored as ${walletCurrency})`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

export default router;
