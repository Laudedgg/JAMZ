import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, Edit2, Save, X, History } from 'lucide-react';
import { api } from '../../lib/api';

const CURRENCIES = ['USDC', 'JAMZ', 'AED', 'NGN', 'INR'];

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

export function ExchangeRatesAdmin() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [swapFeePercentage, setSwapFeePercentage] = useState(0);
  const [minimumAmounts, setMinimumAmounts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingFee, setEditingFee] = useState(false);
  const [feeValue, setFeeValue] = useState('');
  const [editingMinimums, setEditingMinimums] = useState(false);
  const [minimumValues, setMinimumValues] = useState<any>({});
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await api.adminSettings.getExchangeRates();
      setRates(data.rates);
      setSwapFeePercentage(data.swapFeePercentage);
      setMinimumAmounts(data.minimumSwapAmounts);
      setMinimumValues(data.minimumSwapAmounts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.adminSettings.getExchangeRateHistory();
      setHistory(data);
      setShowHistory(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history');
    }
  };

  const handleEditRate = (fromCurrency: string, toCurrency: string, currentRate: number) => {
    setEditingRate(`${fromCurrency}-${toCurrency}`);
    setEditValue(currentRate.toString());
  };

  const handleSaveRate = async (fromCurrency: string, toCurrency: string) => {
    try {
      setError(null);
      setSuccess(null);
      await api.adminSettings.updateExchangeRate(fromCurrency, toCurrency, parseFloat(editValue));
      setSuccess(`Updated ${fromCurrency} to ${toCurrency} rate`);
      setEditingRate(null);
      fetchRates();
    } catch (err: any) {
      setError(err.message || 'Failed to update rate');
    }
  };

  const handleSaveFee = async () => {
    try {
      setError(null);
      setSuccess(null);
      await api.adminSettings.updateSwapFee(parseFloat(feeValue));
      setSuccess('Updated swap fee percentage');
      setEditingFee(false);
      fetchRates();
    } catch (err: any) {
      setError(err.message || 'Failed to update fee');
    }
  };

  const handleSaveMinimums = async () => {
    try {
      setError(null);
      setSuccess(null);
      await api.adminSettings.updateMinimumSwapAmounts(minimumValues);
      setSuccess('Updated minimum swap amounts');
      setEditingMinimums(false);
      fetchRates();
    } catch (err: any) {
      setError(err.message || 'Failed to update minimums');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Exchange Rates Management</h2>
        <button
          onClick={fetchHistory}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
        >
          <History className="w-4 h-4" />
          <span>View History</span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start space-x-3"
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
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Swap Fee Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Swap Fee Percentage</h3>
          {!editingFee ? (
            <button
              onClick={() => {
                setEditingFee(true);
                setFeeValue(swapFeePercentage.toString());
              }}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveFee}
                className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setEditingFee(false)}
                className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
        {editingFee ? (
          <input
            type="number"
            value={feeValue}
            onChange={(e) => setFeeValue(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            step="0.1"
            min="0"
            max="100"
          />
        ) : (
          <p className="text-2xl font-bold text-white">{swapFeePercentage}%</p>
        )}
      </div>

      {/* Minimum Swap Amounts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Minimum Swap Amounts</h3>
          {!editingMinimums ? (
            <button
              onClick={() => setEditingMinimums(true)}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveMinimums}
                className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setEditingMinimums(false);
                  setMinimumValues(minimumAmounts);
                }}
                className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CURRENCIES.map((currency) => (
            <div key={currency}>
              <label className="block text-sm text-gray-400 mb-1">{currency}</label>
              {editingMinimums ? (
                <input
                  type="number"
                  value={minimumValues[currency] || 0}
                  onChange={(e) => setMinimumValues({ ...minimumValues, [currency]: parseFloat(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  step="0.01"
                  min="0"
                />
              ) : (
                <p className="text-white font-medium">{minimumAmounts[currency] || 0}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Exchange Rates</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">From</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">To</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Rate</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Updated</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const rateKey = `${rate.fromCurrency}-${rate.toCurrency}`;
                const isEditing = editingRate === rateKey;
                return (
                  <tr key={rateKey} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">{rate.fromCurrency}</td>
                    <td className="py-3 px-4 text-white">{rate.toCurrency}</td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32 bg-black/40 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500"
                          step="0.000001"
                          min="0"
                        />
                      ) : (
                        <span className="text-white font-medium">{rate.rate}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(rate.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSaveRate(rate.fromCurrency, rate.toCurrency)}
                            className="p-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRate(null)}
                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditRate(rate.fromCurrency, rate.toCurrency, rate.rate)}
                          className="p-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-purple-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Exchange Rate History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={index} className="bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        {entry.fromCurrency} → {entry.toCurrency}
                      </p>
                      <p className="text-sm text-gray-400">
                        {entry.oldRate} → {entry.newRate}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(entry.changedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

