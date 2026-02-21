import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Loader2, AlertCircle, CheckCircle2, RefreshCw, ChevronDown, Info } from 'lucide-react';
import { api } from '../lib/api';

interface ArtistSwapInterfaceProps {
  wallet: {
    usdBalance: number;
    ngnBalance: number;
    aedBalance: number;
    inrBalance: number;
  };
  onSwapComplete: () => void;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', icon: '💵', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', textColor: 'text-green-400' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', icon: '🇳🇬', color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', icon: '🇦🇪', color: 'from-teal-500 to-cyan-600', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30', textColor: 'text-teal-400' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', icon: '🇮🇳', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-400' }
];

export function ArtistSwapInterface({ wallet, onSwapComplete }: ArtistSwapInterfaceProps) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [feePercentage, setFeePercentage] = useState(2);
  const [feeAmount, setFeeAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);

  const fromSelectorRef = useRef<HTMLDivElement>(null);
  const toSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromSelectorRef.current && !fromSelectorRef.current.contains(event.target as Node)) setShowFromSelector(false);
      if (toSelectorRef.current && !toSelectorRef.current.contains(event.target as Node)) setShowToSelector(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { fetchExchangeRates(); }, []);

  useEffect(() => {
    if (fromAmount && exchangeRate > 0) {
      const grossAmount = parseFloat(fromAmount) * exchangeRate;
      const fee = grossAmount * (feePercentage / 100);
      setToAmount((grossAmount - fee).toFixed(2));
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
      setFeePercentage(data.swapFeePercentage || 2);
      const rate = data.rates.find((r: any) => r.fromCurrency === (fromCurrency === 'USD' ? 'USDC' : fromCurrency) && r.toCurrency === (toCurrency === 'USD' ? 'USDC' : toCurrency));
      if (rate) setExchangeRate(rate.rate);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exchange rates');
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => { if (fromCurrency !== toCurrency) fetchExchangeRates(); }, [fromCurrency, toCurrency]);

  const getBalance = (currency: string): number => {
    const map: any = { USD: wallet.usdBalance, NGN: wallet.ngnBalance, AED: wallet.aedBalance, INR: wallet.inrBalance };
    return map[currency] || 0;
  };

  const handleSwapCurrencies = () => { const temp = fromCurrency; setFromCurrency(toCurrency); setToCurrency(temp); setFromAmount(''); setToAmount(''); };
  const handleMaxClick = () => setFromAmount(getBalance(fromCurrency).toString());
  const getCurrencyData = (code: string) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

  const validateSwap = (): string | null => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return 'Please enter an amount';
    if (parseFloat(fromAmount) > getBalance(fromCurrency)) return `Insufficient ${fromCurrency} balance`;
    if (fromCurrency === toCurrency) return 'Cannot swap same currency';
    return null;
  };

  const handleSwap = () => { const err = validateSwap(); if (err) { setError(err); return; } setShowConfirmation(true); };

  const executeSwap = async () => {
    try {
      setLoading(true); setError(null); setSuccess(null);
      await api.artistWallet.executeSwap({ fromCurrency: fromCurrency === 'USD' ? 'USDC' : fromCurrency, toCurrency: toCurrency === 'USD' ? 'USDC' : toCurrency, fromAmount: parseFloat(fromAmount) });
      setSuccess(`Successfully swapped ${fromAmount} ${fromCurrency} to ${toAmount} ${toCurrency}`);
      setFromAmount(''); setToAmount(''); setShowConfirmation(false);
      onSwapComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRates) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;

  const fromData = getCurrencyData(fromCurrency);
  const toData = getCurrencyData(toCurrency);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <AnimatePresence>
        {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" /><p className="text-green-400 text-sm">{success}</p></motion.div>}
        {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-400 text-sm">{error}</p></motion.div>}
      </AnimatePresence>

      {/* From Currency */}
      <div className={`${fromData.bgColor} border ${fromData.borderColor} rounded-xl p-4 space-y-3`}>
        <div className="relative" ref={fromSelectorRef}>
          <button onClick={() => setShowFromSelector(!showFromSelector)} className="flex items-center gap-3 w-full">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fromData.color} flex items-center justify-center text-xl`}>{fromData.icon}</div>
            <div className="flex-1 text-left"><div className="flex items-center gap-2"><span className="text-white font-semibold">{fromData.code}</span><ChevronDown className={`w-4 h-4 text-white/60 ${showFromSelector ? 'rotate-180' : ''}`} /></div></div>
          </button>
          <AnimatePresence>{showFromSelector && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 border border-white/10 rounded-xl z-50">{CURRENCIES.filter(c => c.code !== toCurrency).map(c => <button key={c.code} onClick={() => { setFromCurrency(c.code); setShowFromSelector(false); setFromAmount(''); }} className="w-full flex items-center gap-3 p-3 hover:bg-white/10"><div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center`}>{c.icon}</div><span className="text-white">{c.code}</span></button>)}</motion.div>}</AnimatePresence>
        </div>
        <input type="number" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="0" className="w-full bg-transparent text-white text-3xl font-bold focus:outline-none" />
        <div className="flex justify-between text-sm"><span className="text-white/40">Balance: {getBalance(fromCurrency).toFixed(2)}</span><button onClick={handleMaxClick} className={`${fromData.textColor} font-medium`}>MAX</button></div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center"><button onClick={handleSwapCurrencies} className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full"><ArrowDownUp className="w-5 h-5 text-white" /></button></div>

      {/* To Currency */}
      <div className={`${toData.bgColor} border ${toData.borderColor} rounded-xl p-4 space-y-3`}>
        <div className="relative" ref={toSelectorRef}>
          <button onClick={() => setShowToSelector(!showToSelector)} className="flex items-center gap-3 w-full">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${toData.color} flex items-center justify-center text-xl`}>{toData.icon}</div>
            <div className="flex-1 text-left"><div className="flex items-center gap-2"><span className="text-white font-semibold">{toData.code}</span><ChevronDown className={`w-4 h-4 text-white/60 ${showToSelector ? 'rotate-180' : ''}`} /></div></div>
          </button>
          <AnimatePresence>{showToSelector && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 border border-white/10 rounded-xl z-50">{CURRENCIES.filter(c => c.code !== fromCurrency).map(c => <button key={c.code} onClick={() => { setToCurrency(c.code); setShowToSelector(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-white/10"><div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center`}>{c.icon}</div><span className="text-white">{c.code}</span></button>)}</motion.div>}</AnimatePresence>
        </div>
        <div className="w-full text-white text-3xl font-bold">{toAmount || '0'}</div>
        <div className="text-white/40 text-sm">Balance: {getBalance(toCurrency).toFixed(2)}</div>
      </div>

      {/* Rate Info */}
      {exchangeRate > 0 && <div className="glass-card rounded-xl p-4"><div className="flex justify-between text-sm"><span className="text-white/60">Rate</span><span className="text-white">1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}</span></div><div className="flex justify-between text-sm mt-2"><span className="text-white/60">Fee ({feePercentage}%)</span><span className="text-white">{feeAmount.toFixed(2)} {toCurrency}</span></div></div>}

      {/* Swap Action */}
      <button onClick={handleSwap} disabled={loading || !fromAmount} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl">{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Swap Currencies'}</button>

      {/* Confirmation Modal */}
      <AnimatePresence>{showConfirmation && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !loading && setShowConfirmation(false)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="glass-card rounded-2xl p-6 max-w-md w-full space-y-6"><h3 className="text-xl font-bold text-white text-center">Confirm Swap</h3><div className="text-center space-y-2"><p className="text-white/60">You pay</p><p className="text-2xl font-bold text-white">{fromAmount} {fromCurrency}</p><ArrowDownUp className="w-5 h-5 mx-auto text-white/40" /><p className="text-white/60">You receive</p><p className="text-2xl font-bold text-white">{toAmount} {toCurrency}</p></div><div className="flex gap-3"><button onClick={() => setShowConfirmation(false)} disabled={loading} className="flex-1 bg-white/10 text-white py-3 rounded-xl">Cancel</button><button onClick={executeSwap} disabled={loading} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-xl">{loading ? 'Swapping...' : 'Confirm'}</button></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}

