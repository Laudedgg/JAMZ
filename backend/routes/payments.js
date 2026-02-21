import express from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import ArtistWallet from '../models/artistWallet.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// NowPayments configuration
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Create Stripe payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    // Check if user is an artist
    if (!req.user.isArtist) {
      return res.status(403).json({ message: 'Access denied. Artist only.' });
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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency.toLowerCase(),
      metadata: {
        artistId: req.user.id,
        type: 'wallet_funding'
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
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Stripe webhook to handle successful payments
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
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

// Create NowPayments crypto payment
router.post('/create-crypto-payment', authenticateToken, async (req, res) => {
  try {
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

    // Create payment with NowPayments
    const paymentData = {
      price_amount: price_amount,
      price_currency: price_currency || 'USD',
      pay_currency: pay_currency.toLowerCase(),
      order_id: order_id || `wallet-${req.user.id}-${Date.now()}`,
      order_description: order_description || `Wallet funding for artist ${req.user.id}`,
      ipn_callback_url: `${process.env.BASE_URL}/api/payments/nowpayments-callback`,
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
    const wallet = await ArtistWallet.findOne({ artistId: req.user.id });
    if (wallet) {
      wallet.transactions.push({
        type: 'deposit',
        currency: 'USD',
        amount: price_amount,
        description: `Crypto payment pending - ${pay_currency.toUpperCase()}`,
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
    let artistId, amount, currency, externalReference;

    if (provider === 'stripe') {
      artistId = paymentData.metadata.artistId;
      amount = paymentData.amount / 100; // Convert from cents
      currency = paymentData.currency.toUpperCase();
      externalReference = paymentData.id;
    } else if (provider === 'nowpayments') {
      // Extract artist ID from order_id or description
      const orderParts = paymentData.order_id.split('-');
      artistId = orderParts[1]; // Assuming format: wallet-{artistId}-{timestamp}
      amount = paymentData.price_amount;
      currency = paymentData.price_currency;
      externalReference = paymentData.payment_id;
    }

    // Find and update artist wallet
    const wallet = await ArtistWallet.findOne({ artistId });
    if (!wallet) {
      console.error('Wallet not found for artist:', artistId);
      return;
    }

    // Add deposit to wallet
    if (currency === 'USD') {
      wallet.usdtBalance += amount; // Treat USD as USDT for now
    } else if (currency === 'NGN') {
      wallet.ngnBalance += amount;
    } else if (currency === 'AED') {
      wallet.aedBalance += amount;
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
        currency: currency,
        amount: amount,
        description: `${provider === 'stripe' ? 'Card' : 'Crypto'} payment deposit`,
        status: 'completed',
        externalReference: externalReference,
        updatedAt: new Date()
      });
    }

    await wallet.save();
    console.log(`Successfully processed ${provider} payment for artist ${artistId}: ${amount} ${currency}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

export default router;
