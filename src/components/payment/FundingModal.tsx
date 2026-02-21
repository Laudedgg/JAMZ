import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Bitcoin, Sparkles, Zap, Shield, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import StripePayment from './StripePayment';
import CryptoPayment from './CryptoPayment';

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'stripe' | 'crypto';
type Currency = 'USD' | 'NGN' | 'AED' | 'INR';
type CryptoCurrency = 'usdcbase' | 'usdcerc20' | 'usdcbsc';

const FundingModal: React.FC<FundingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('usdcbase');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('50');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');

  const predefinedAmounts = {
    USD: [25, 50, 100, 250, 500],
    NGN: [10000, 25000, 50000, 100000, 250000],
    AED: [100, 200, 500, 1000, 2000],
    INR: [500, 1000, 2500, 5000, 10000]
  };

  const minimumAmounts = {
    USD: 2,
    NGN: 5000,
    AED: 50,
    INR: 100
  };

  const currencyInfo = {
    USD: { symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
    NGN: { symbol: '₦', flag: '🇳🇬', name: 'Nigerian Naira' },
    AED: { symbol: 'د.إ', flag: '🇦🇪', name: 'UAE Dirham' },
    INR: { symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' }
  };

  const cryptoOptions = [
    { value: 'usdcbase', label: 'USDC on Base', sublabel: 'Low fees', icon: '🔵' },
    { value: 'usdcerc20', label: 'USDC on Ethereum', sublabel: 'ERC-20', icon: '⟠' },
    { value: 'usdcbsc', label: 'USDC on BNB', sublabel: 'BEP-20', icon: '🟡' }
  ];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount(selectedAmount.toString());
    setError('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
      setError('');
    } else if (value && !isNaN(numValue) && numValue <= 0) {
      setError('Please enter a valid amount');
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData);

    // Check if wallet credit failed (payment succeeded but backend save failed)
    if (paymentData.walletCreditError) {
      console.error('Wallet credit error:', paymentData.walletCreditError);
      setWarningMessage(`Payment processed but wallet update failed: ${paymentData.walletCreditError}. Please contact support with payment ID: ${paymentData.id}`);
      setError('');
      // Don't close modal - show warning to user
      return;
    }

    // Show success message briefly before closing
    setSuccessMessage(`Successfully added ${paymentData.amount ? `$${paymentData.amount}` : 'funds'} to your wallet!`);
    setError('');
    setWarningMessage('');

    // Call onSuccess to refresh wallet data
    onSuccess();

    // Close modal after a brief delay to show success message
    setTimeout(() => {
      onClose();
      setSuccessMessage('');
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage('');
    setWarningMessage('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl"
        >
          {/* Gradient border effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl opacity-75 blur-sm" />

          <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header with gradient */}
            <div className="relative px-6 pt-6 pb-4">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Fund Your Wallet</h2>
                    <p className="text-white/50 text-sm">Choose your payment method</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('stripe')}
                    className={`relative p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                      paymentMethod === 'stripe'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {paymentMethod === 'stripe' && (
                      <motion.div
                        layoutId="paymentHighlight"
                        className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                      />
                    )}
                    <div className="relative flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'stripe'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-white/10'
                      }`}>
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold">Card Payment</div>
                        <div className="text-white/50 text-xs">Visa, Mastercard, etc.</div>
                      </div>
                    </div>
                    {paymentMethod === 'stripe' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('crypto')}
                    className={`relative p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                      paymentMethod === 'crypto'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {paymentMethod === 'crypto' && (
                      <motion.div
                        layoutId="paymentHighlight"
                        className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20"
                      />
                    )}
                    <div className="relative flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'crypto'
                          ? 'bg-gradient-to-br from-orange-500 to-yellow-500'
                          : 'bg-white/10'
                      }`}>
                        <Bitcoin className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold">Crypto</div>
                        <div className="text-white/50 text-xs">USDC payments</div>
                      </div>
                    </div>
                    {paymentMethod === 'crypto' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Currency Selection for Stripe */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'stripe' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-white/70 mb-3">Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['USD', 'NGN', 'AED', 'INR'] as Currency[]).map((curr) => (
                        <motion.button
                          key={curr}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrency(curr);
                            setAmount(predefinedAmounts[curr][1]);
                            setCustomAmount(predefinedAmounts[curr][1].toString());
                          }}
                          className={`p-3 rounded-xl border transition-all ${
                            currency === curr
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="text-lg mb-0.5">{currencyInfo[curr].flag}</div>
                          <div className="text-white font-semibold text-sm">{curr}</div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Crypto Currency Selection */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'crypto' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-white/70 mb-3">Network</label>
                    <div className="grid grid-cols-3 gap-2">
                      {cryptoOptions.map((crypto) => (
                        <motion.button
                          key={crypto.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCryptoCurrency(crypto.value as CryptoCurrency)}
                          className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                            cryptoCurrency === crypto.value
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className="text-2xl">{crypto.icon}</span>
                          <div className="text-left">
                            <div className="text-white font-medium text-sm">{crypto.label}</div>
                            <div className="text-white/50 text-xs">{crypto.sublabel}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  {paymentMethod === 'crypto' ? 'Amount (USD)' : 'Amount'}
                </label>

                {/* Predefined amounts */}
                {paymentMethod === 'stripe' && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    {predefinedAmounts[currency].map((presetAmount) => (
                      <motion.button
                        key={presetAmount}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAmountSelect(presetAmount)}
                        className={`px-4 py-2 rounded-full border whitespace-nowrap transition-all ${
                          amount === presetAmount
                            ? 'border-purple-500 bg-purple-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                        }`}
                      >
                        {currencyInfo[currency].symbol}{presetAmount.toLocaleString()}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Custom amount input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
                    {paymentMethod === 'crypto' ? '$' : currencyInfo[currency].symbol}
                  </div>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Enter amount"
                  />
                  {paymentMethod === 'stripe' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                      {currency}
                    </div>
                  )}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2 flex items-center gap-1"
                  >
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mt-2 flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm">{successMessage}</span>
                  </motion.div>
                )}

                {warningMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mt-2 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-yellow-400 text-sm">{warningMessage}</span>
                      <button
                        onClick={onClose}
                        className="block mt-2 text-xs text-yellow-400/80 hover:text-yellow-400 underline"
                      >
                        Close and contact support
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm">You'll receive</span>
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <Shield className="w-3 h-3" />
                    Secure payment
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {paymentMethod === 'crypto' ? '$' : currencyInfo[currency].symbol}
                      {amount.toLocaleString()}
                    </div>
                    <div className="text-white/50 text-sm">
                      {paymentMethod === 'crypto' ? 'USD equivalent' : currencyInfo[currency].name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400 text-sm">
                    <Zap className="w-4 h-4" />
                    Instant credit
                  </div>
                </div>
              </div>

              {/* Payment Component */}
              <AnimatePresence mode="wait">
                {amount > 0 && !error && !successMessage && !warningMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {paymentMethod === 'stripe' ? (
                      <StripePayment
                        amount={amount}
                        currency={currency}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    ) : (
                      <CryptoPayment
                        amount={amount}
                        currency={cryptoCurrency}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FundingModal;
