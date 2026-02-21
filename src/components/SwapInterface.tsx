import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Loader2, AlertCircle, CheckCircle2, RefreshCw, ChevronDown, Info } from 'lucide-react';
import { api } from '../lib/api';

interface SwapInterfaceProps {
  wallet: {
    usdcBalance: number;
    jamzBalance: number;
    ngnBalance: number;
    aedBalance: number;
    inrBalance: number;
  };
  onSwapComplete: () => void;
}

const CURRENCIES = [
  {
    code: 'USDC',
    name: 'USD Coin',
    symbol: '$',
    icon: '💵',
    chain: 'Base',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400'
  },
  {
    code: 'JAMZ',
    name: 'JAMZ Token',
    symbol: 'J',
    icon: '🎵',
    chain: 'Base',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400'
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    icon: '🇦🇪',
    chain: 'Fiat',
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    textColor: 'text-teal-400'
  },
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    icon: '🇳🇬',
    chain: 'Fiat',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400'
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    icon: '🇮🇳',
    chain: 'Fiat',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400'
  }
];

export function SwapInterface({ wallet, onSwapComplete }: SwapInterfaceProps) {
  const [fromCurrency, setFromCurrency] = useState('USDC');
  const [toCurrency, setToCurrency] = useState('JAMZ');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [feePercentage, setFeePercentage] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [minimumAmounts, setMinimumAmounts] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);

  // Refs for click outside handling
  const fromSelectorRef = useRef<HTMLDivElement>(null);
  const toSelectorRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromSelectorRef.current && !fromSelectorRef.current.contains(event.target as Node)) {
        setShowFromSelector(false);
      }
      if (toSelectorRef.current && !toSelectorRef.current.contains(event.target as Node)) {
        setShowToSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Calculate toAmount when fromAmount or currencies change
  useEffect(() => {
    if (fromAmount && exchangeRate > 0) {
      const grossAmount = parseFloat(fromAmount) * exchangeRate;
      const fee = grossAmount * (feePercentage / 100);
      const netAmount = grossAmount - fee;
      setToAmount(netAmount.toFixed(6));
      setFeeAmount(fee);
    } else {
      setToAmount('');
      setFeeAmount(0);
    }
  }, [fromAmount, exchangeRate, feePercentage]);

  const fetchExchangeRates = async () => {
    try {
      setLoadingRates(true);
      const data = await api.wallets.getExchangeRates();
      setFeePercentage(data.swapFeePercentage);
      setMinimumAmounts(data.minimumSwapAmounts);
      
      // Find the rate for current pair
      const rate = data.rates.find(
        (r: any) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
      );
      if (rate) {
        setExchangeRate(rate.rate);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exchange rates');
    } finally {
      setLoadingRates(false);
    }
  };

  // Update exchange rate when currencies change
  useEffect(() => {
    if (fromCurrency !== toCurrency) {
      fetchExchangeRates();
    }
  }, [fromCurrency, toCurrency]);

  const getBalance = (currency: string): number => {
    const balanceMap: any = {
      USDC: wallet.usdcBalance,
      JAMZ: wallet.jamzBalance,
      AED: wallet.aedBalance,
      NGN: wallet.ngnBalance,
      INR: wallet.inrBalance
    };
    return balanceMap[currency] || 0;
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setFromAmount('');
    setToAmount('');
  };

  const handleMaxClick = () => {
    const balance = getBalance(fromCurrency);
    setFromAmount(balance.toString());
  };

  const validateSwap = (): string | null => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return 'Please enter an amount';
    }

    const amount = parseFloat(fromAmount);
    const balance = getBalance(fromCurrency);

    if (amount > balance) {
      return `Insufficient ${fromCurrency} balance`;
    }

    const minAmount = minimumAmounts[fromCurrency] || 0;
    if (amount < minAmount) {
      return `Minimum swap amount for ${fromCurrency} is ${minAmount}`;
    }

    if (fromCurrency === toCurrency) {
      return 'Cannot swap same currency';
    }

    return null;
  };

  const handleSwap = async () => {
    const validationError = validateSwap();
    if (validationError) {
      setError(validationError);
      return;
    }

    setShowConfirmation(true);
  };

  const executeSwap = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await api.wallets.executeSwap({
        fromCurrency,
        toCurrency,
        fromAmount: parseFloat(fromAmount)
      });

      setSuccess(`Successfully swapped ${fromAmount} ${fromCurrency} to ${toAmount} ${toCurrency}`);
      setFromAmount('');
      setToAmount('');
      setShowConfirmation(false);
      onSwapComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyData = (code: string) => {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  };

  if (loadingRates) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const fromCurrencyData = getCurrencyData(fromCurrency);
  const toCurrencyData = getCurrencyData(toCurrency);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Swap anytime, anywhere.
        </h2>
        <p className="text-white/60 text-sm md:text-base">
          Exchange your tokens instantly across multiple currencies
        </p>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start space-x-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-400 text-sm">{success}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Interface Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-4 md:p-6 space-y-1 relative"
      >
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none rounded-2xl overflow-hidden" />

        <div className="relative z-10 space-y-1">
          {/* From Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/70 px-1">You send</label>

            {/* From Currency Card */}
            <div className={`${fromCurrencyData.bgColor} border ${fromCurrencyData.borderColor} rounded-xl p-4 space-y-3`}>
              {/* Token Selector */}
              <div className="relative" ref={fromSelectorRef}>
                <button
                  onClick={() => setShowFromSelector(!showFromSelector)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity w-full"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fromCurrencyData.color} flex items-center justify-center text-xl`}>
                    {fromCurrencyData.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-lg">{fromCurrencyData.code}</span>
                      <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showFromSelector ? 'rotate-180' : ''}`} />
                    </div>
                    <span className="text-white/50 text-xs">{fromCurrencyData.chain}</span>
                  </div>
                </button>

                {/* From Currency Dropdown */}
                <AnimatePresence>
                  {showFromSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {CURRENCIES.filter(c => c.code !== toCurrency).map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => {
                            setFromCurrency(currency.code);
                            setShowFromSelector(false);
                            setFromAmount('');
                          }}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors ${
                            fromCurrency === currency.code ? 'bg-white/5' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currency.color} flex items-center justify-center text-lg`}>
                            {currency.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-white font-medium">{currency.code}</div>
                            <div className="text-white/50 text-xs">{currency.name}</div>
                          </div>
                          <div className="text-white/40 text-xs">{currency.chain}</div>
                          {fromCurrency === currency.code && (
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-white text-3xl md:text-4xl font-bold focus:outline-none placeholder:text-white/20"
                  style={{ caretColor: 'white' }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">
                    ≈${(parseFloat(fromAmount || '0') * (fromCurrency === 'USDC' ? 1 : exchangeRate)).toFixed(2)}
                  </span>
                  <button
                    onClick={handleMaxClick}
                    className={`${fromCurrencyData.textColor} hover:opacity-80 text-sm font-medium transition-opacity`}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-white/50 text-xs">
                  Balance: <span className="text-white font-medium">{getBalance(fromCurrency).toFixed(4)}</span> {fromCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-20">
            <button
              onClick={handleSwapCurrencies}
              className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <ArrowDownUp className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* To Section */}
          <div className="space-y-3 relative z-20">
            <label className="block text-sm font-medium text-white/70 px-1">You receive</label>

            {/* To Currency Card */}
            <div className={`${toCurrencyData.bgColor} border ${toCurrencyData.borderColor} rounded-xl p-4 space-y-3 ${showToSelector ? 'pb-48' : ''}`}>
              {/* Token Selector */}
              <div className="relative" ref={toSelectorRef}>
                <button
                  onClick={() => setShowToSelector(!showToSelector)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity w-full"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${toCurrencyData.color} flex items-center justify-center text-xl`}>
                    {toCurrencyData.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-lg">{toCurrencyData.code}</span>
                      <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showToSelector ? 'rotate-180' : ''}`} />
                    </div>
                    <span className="text-white/50 text-xs">{toCurrencyData.chain}</span>
                  </div>
                </button>

                {/* To Currency Dropdown */}
                <AnimatePresence>
                  {showToSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {CURRENCIES.filter(c => c.code !== fromCurrency).map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => {
                            setToCurrency(currency.code);
                            setShowToSelector(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors ${
                            toCurrency === currency.code ? 'bg-white/5' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currency.color} flex items-center justify-center text-lg`}>
                            {currency.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-white font-medium">{currency.code}</div>
                            <div className="text-white/50 text-xs">{currency.name}</div>
                          </div>
                          <div className="text-white/40 text-xs">{currency.chain}</div>
                          {toCurrency === currency.code && (
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amount Display */}
              <div className="space-y-2">
                <div className="w-full text-white text-3xl md:text-4xl font-bold">
                  {toAmount || '0'}
                </div>
                <div className="text-white/40 text-sm">
                  ≈${(parseFloat(toAmount || '0') * (toCurrency === 'USDC' ? 1 : 1/exchangeRate)).toFixed(2)}
                </div>
              </div>

              {/* Balance */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-white/50 text-xs">
                  Balance: <span className="text-white font-medium">{getBalance(toCurrency).toFixed(4)}</span> {toCurrency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Exchange Rate Info Card */}
      {exchangeRate > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-white/60" />
              <span className="text-white/70 text-sm font-medium">Exchange Details</span>
            </div>
            <button
              onClick={fetchExchangeRates}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              title="Refresh rate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Rate</span>
              <span className="text-white font-medium">
                1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
              </span>
            </div>

            {feePercentage > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Network Fee ({feePercentage}%)</span>
                  <span className="text-white/80">{feeAmount.toFixed(6)} {fromCurrency}</span>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm font-medium">You'll receive</span>
                    <span className="text-white font-bold text-lg">{toAmount} {toCurrency}</span>
                  </div>
                </div>
              </>
            )}

            {minimumAmounts[fromCurrency] > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Minimum Amount</span>
                <span className="text-white/80">{minimumAmounts[fromCurrency]} {fromCurrency}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Swap Button */}
      <motion.button
        onClick={handleSwap}
        disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Swap...</span>
          </>
        ) : (
          <span className="text-lg">Swap Tokens</span>
        )}
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => !loading && setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-md w-full space-y-6 relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Confirm Swap</h3>
                  <p className="text-white/60 text-sm">Review your transaction details</p>
                </div>

                {/* Swap Summary */}
                <div className="space-y-4">
                  {/* From */}
                  <div className={`${fromCurrencyData.bgColor} border ${fromCurrencyData.borderColor} rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fromCurrencyData.color} flex items-center justify-center text-xl`}>
                          {fromCurrencyData.icon}
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">You pay</p>
                          <p className="text-white font-bold text-lg">{fromAmount} {fromCurrency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="p-2 bg-white/5 rounded-full">
                      <ArrowDownUp className="w-4 h-4 text-white/60" />
                    </div>
                  </div>

                  {/* To */}
                  <div className={`${toCurrencyData.bgColor} border ${toCurrencyData.borderColor} rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${toCurrencyData.color} flex items-center justify-center text-xl`}>
                          {toCurrencyData.icon}
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">You receive</p>
                          <p className="text-white font-bold text-lg">{toAmount} {toCurrency}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Exchange Rate</span>
                    <span className="text-white font-medium">1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Network Fee</span>
                    <span className="text-white font-medium">{feeAmount.toFixed(6)} {fromCurrency}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    disabled={loading}
                    className="flex-1 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeSwap}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Swapping...</span>
                      </>
                    ) : (
                      <span>Confirm Swap</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

