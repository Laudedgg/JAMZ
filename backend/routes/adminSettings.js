import express from 'express';
import AdminSettings from '../models/adminSettings.js';
import ExchangeRate from '../models/exchangeRate.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get admin settings
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update admin settings
router.put('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await AdminSettings.updateSettings(req.body, req.user._id);
    res.json(settings);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get payment methods (public endpoint for artists)
router.get('/payment-methods', async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    const enabledPaymentMethods = settings.paymentMethods.filter(method => method.isEnabled);
    
    // Return only necessary information for artists
    const publicPaymentMethods = enabledPaymentMethods.map(method => ({
      _id: method._id,
      type: method.type,
      name: method.name,
      cryptoType: method.cryptoType,
      walletAddress: method.walletAddress,
      currency: method.currency,
      bankName: method.bankName,
      accountHolderName: method.accountHolderName,
      accountNumber: method.accountNumber,
      routingNumber: method.routingNumber,
      swiftCode: method.swiftCode,
      iban: method.iban,
      bankAddress: method.bankAddress,
      additionalInfo: method.additionalInfo,
      minimumAmount: method.minimumAmount
    }));
    
    res.json(publicPaymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add payment method
router.post('/payment-methods', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    settings.paymentMethods.push(req.body);
    settings.lastUpdatedBy = req.user._id;
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update payment method
router.put('/payment-methods/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    const paymentMethod = settings.paymentMethods.id(req.params.id);
    
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    Object.assign(paymentMethod, req.body);
    settings.lastUpdatedBy = req.user._id;
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete payment method
router.delete('/payment-methods/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    settings.paymentMethods.pull({ _id: req.params.id });
    settings.lastUpdatedBy = req.user._id;
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle payment method status
router.patch('/payment-methods/:id/toggle', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    const paymentMethod = settings.paymentMethods.id(req.params.id);
    
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    paymentMethod.isEnabled = !paymentMethod.isEnabled;
    settings.lastUpdatedBy = req.user._id;
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error toggling payment method:', error);
    res.status(500).json({ message: error.message });
  }
});

// Exchange Rate Management Endpoints

// Get all exchange rates
router.get('/exchange-rates', authenticateToken, isAdmin, async (req, res) => {
  try {
    const rates = await ExchangeRate.getRates();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update a specific exchange rate
router.put('/exchange-rates/:fromCurrency/:toCurrency', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.params;
    const { rate } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({ message: 'Invalid rate value' });
    }

    const rates = await ExchangeRate.updateRate(fromCurrency, toCurrency, rate, req.user._id);
    res.json(rates);
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update swap fee percentage
router.put('/exchange-rates/fee', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { swapFeePercentage } = req.body;

    if (swapFeePercentage === undefined || swapFeePercentage < 0 || swapFeePercentage > 100) {
      return res.status(400).json({ message: 'Invalid fee percentage (must be 0-100)' });
    }

    const rates = await ExchangeRate.getRates();
    rates.swapFeePercentage = swapFeePercentage;
    await rates.save();

    res.json(rates);
  } catch (error) {
    console.error('Error updating swap fee:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update minimum swap amounts
router.put('/exchange-rates/minimums', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { minimumSwapAmounts } = req.body;

    if (!minimumSwapAmounts) {
      return res.status(400).json({ message: 'Missing minimum swap amounts' });
    }

    const rates = await ExchangeRate.getRates();
    rates.minimumSwapAmounts = { ...rates.minimumSwapAmounts, ...minimumSwapAmounts };
    await rates.save();

    res.json(rates);
  } catch (error) {
    console.error('Error updating minimum swap amounts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get exchange rate history
router.get('/exchange-rates/history', authenticateToken, isAdmin, async (req, res) => {
  try {
    const rates = await ExchangeRate.getRates();
    const history = rates.rateHistory
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
      .slice(0, 100); // Return last 100 changes

    res.json(history);
  } catch (error) {
    console.error('Error fetching rate history:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
