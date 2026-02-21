import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, Wallet, Building2, CreditCard, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { ExchangeRatesAdmin } from '../components/admin/ExchangeRatesAdmin';

interface PaymentMethod {
  _id?: string;
  type: 'crypto' | 'bank';
  name: string;
  isEnabled: boolean;
  // Crypto fields
  cryptoType?: 'USDT_TRC20' | 'USDT_BEP20';
  walletAddress?: string;
  // Bank fields
  currency?: 'NGN' | 'AED' | 'USD';
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  additionalInfo?: string;
  minimumAmount?: number;
}

interface AdminSettings {
  _id: string;
  paymentMethods: PaymentMethod[];
  platformSettings: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    allowNewRegistrations: boolean;
    defaultCampaignDuration: number;
  };
  campaignSettings: {
    requireManualApproval: boolean;
    autoActivateAfterPayment: boolean;
    paymentConfirmationRequired: boolean;
  };
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'payment-methods' | 'exchange-rates'>('payment-methods');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.adminSettings.getSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (updatedSettings: Partial<AdminSettings>) => {
    try {
      setSaving(true);
      setError(null);
      const data = await api.adminSettings.updateSettings(updatedSettings);
      setSettings(data);
      setSuccessMessage('Settings updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePaymentMethod = async (paymentId: string) => {
    try {
      setError(null);
      await api.adminSettings.togglePaymentMethod(paymentId);
      await fetchSettings();
      setSuccessMessage('Payment method status updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle payment method');
    }
  };

  const handleDeletePaymentMethod = async (paymentId: string, paymentName: string) => {
    if (!confirm(`Are you sure you want to delete "${paymentName}"? This action cannot be undone.`)) return;

    try {
      setError(null);
      await api.adminSettings.deletePaymentMethod(paymentId);
      await fetchSettings();
      setSuccessMessage(`Payment method "${paymentName}" deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment method');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl mb-4">Error loading settings</p>
          <p>{error}</p>
          <button 
            onClick={fetchSettings}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Settings className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className="text-3xl font-bold gradient-text">Admin Settings</h1>
          </div>
          <p className="text-white/60">Configure payment methods and platform settings</p>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="glass-card p-1 rounded-xl inline-flex mb-8">
          <button
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'payment-methods'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('payment-methods')}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Methods</span>
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'exchange-rates'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('exchange-rates')}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Exchange Rates</span>
          </button>
        </div>

        {/* Payment Methods Section */}
        {activeTab === 'payment-methods' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Payment Methods</h2>
            <button
              onClick={() => setShowAddPayment(true)}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Payment Method
            </button>
          </div>

          <div className="space-y-4">
            {settings?.paymentMethods.map((method) => (
              <motion.div
                key={method._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-lg border transition-all ${
                  method.isEnabled
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-800/50 border-gray-700/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      method.type === 'crypto'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {method.type === 'crypto' ? (
                        <Wallet className="w-6 h-6" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{method.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          method.isEnabled
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {method.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <p className="text-sm text-white/60 mb-3">
                        {method.type === 'crypto'
                          ? `${method.cryptoType?.replace('_', ' ')} Wallet`
                          : `${method.currency} Bank Account`}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {method.type === 'crypto' ? (
                          <>
                            <div>
                              <span className="text-white/40">Address:</span>
                              <p className="text-white/80 font-mono text-xs break-all">
                                {method.walletAddress}
                              </p>
                            </div>
                            <div>
                              <span className="text-white/40">Network:</span>
                              <p className="text-white/80">
                                {method.cryptoType === 'USDT_TRC20' ? 'Tron (TRC20)' : 'BNB Smart Chain (BEP20)'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-white/40">Bank:</span>
                              <p className="text-white/80">{method.bankName}</p>
                            </div>
                            <div>
                              <span className="text-white/40">Account:</span>
                              <p className="text-white/80">{method.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-white/40">Holder:</span>
                              <p className="text-white/80">{method.accountHolderName}</p>
                            </div>
                            <div>
                              <span className="text-white/40">Currency:</span>
                              <p className="text-white/80">{method.currency}</p>
                            </div>
                            {method.swiftCode && (
                              <div>
                                <span className="text-white/40">SWIFT:</span>
                                <p className="text-white/80">{method.swiftCode}</p>
                              </div>
                            )}
                            {method.iban && (
                              <div>
                                <span className="text-white/40">IBAN:</span>
                                <p className="text-white/80 font-mono text-xs">{method.iban}</p>
                              </div>
                            )}
                          </>
                        )}
                        {method.minimumAmount && method.minimumAmount > 0 && (
                          <div>
                            <span className="text-white/40">Minimum:</span>
                            <p className="text-white/80">
                              {method.type === 'crypto' ? '$' : ''}{method.minimumAmount}
                              {method.type === 'bank' ? ` ${method.currency}` : ' USDT'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTogglePaymentMethod(method._id!)}
                      className={`p-2 rounded-lg transition-colors ${
                        method.isEnabled
                          ? 'text-green-400 hover:bg-green-500/10'
                          : 'text-gray-400 hover:bg-gray-500/10'
                      }`}
                      title={method.isEnabled ? 'Disable' : 'Enable'}
                    >
                      {method.isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingPayment(method)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePaymentMethod(method._id!, method.name)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {(!settings?.paymentMethods || settings.paymentMethods.length === 0) && (
              <div className="text-center py-8 text-white/60">
                No payment methods configured yet.
              </div>
            )}
          </div>
        </motion.div>
        )}

        {/* Exchange Rates Section */}
        {activeTab === 'exchange-rates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ExchangeRatesAdmin />
          </motion.div>
        )}

        {/* Platform Settings Section */}
        {activeTab === 'payment-methods' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-2xl font-bold mb-6">Platform Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Maintenance Mode</label>
              <button
                onClick={() => {
                  if (settings) {
                    handleSaveSettings({
                      platformSettings: {
                        ...settings.platformSettings,
                        maintenanceMode: !settings.platformSettings.maintenanceMode
                      }
                    });
                  }
                }}
                disabled={saving}
                className={`flex items-center p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  settings?.platformSettings.maintenanceMode
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : settings?.platformSettings.maintenanceMode ? (
                  <ToggleRight className="w-5 h-5 mr-2" />
                ) : (
                  <ToggleLeft className="w-5 h-5 mr-2" />
                )}
                {saving ? 'Updating...' : settings?.platformSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Allow New Registrations</label>
              <button
                onClick={() => {
                  if (settings) {
                    handleSaveSettings({
                      platformSettings: {
                        ...settings.platformSettings,
                        allowNewRegistrations: !settings.platformSettings.allowNewRegistrations
                      }
                    });
                  }
                }}
                disabled={saving}
                className={`flex items-center p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  settings?.platformSettings.allowNewRegistrations
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : settings?.platformSettings.allowNewRegistrations ? (
                  <ToggleRight className="w-5 h-5 mr-2" />
                ) : (
                  <ToggleLeft className="w-5 h-5 mr-2" />
                )}
                {saving ? 'Updating...' : settings?.platformSettings.allowNewRegistrations ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </motion.div>
        )}
      </div>

      {/* Add/Edit Payment Method Modal */}
      {(showAddPayment || editingPayment) && (
        <PaymentMethodModal
          paymentMethod={editingPayment}
          onClose={() => {
            setShowAddPayment(false);
            setEditingPayment(null);
          }}
          onSave={async (method) => {
            try {
              setError(null);
              if (editingPayment) {
                await api.adminSettings.updatePaymentMethod(editingPayment._id!, method);
                setSuccessMessage(`Payment method "${method.name}" updated successfully`);
              } else {
                await api.adminSettings.addPaymentMethod(method);
                setSuccessMessage(`Payment method "${method.name}" added successfully`);
              }
              await fetchSettings();
              setShowAddPayment(false);
              setEditingPayment(null);
              setTimeout(() => setSuccessMessage(null), 3000);
            } catch (err: any) {
              setError(err.message || 'Failed to save payment method');
            }
          }}
        />
      )}
    </div>
  );
}

// Enhanced Payment Method Modal Component
function PaymentMethodModal({
  paymentMethod,
  onClose,
  onSave
}: {
  paymentMethod: PaymentMethod | null;
  onClose: () => void;
  onSave: (method: PaymentMethod) => Promise<void>;
}) {
  const [formData, setFormData] = useState<PaymentMethod>({
    type: 'crypto',
    name: '',
    isEnabled: true,
    cryptoType: 'USDT_TRC20',
    currency: 'USD',
    minimumAmount: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (paymentMethod) {
      setFormData(paymentMethod);
    } else {
      setFormData({
        type: 'crypto',
        name: '',
        isEnabled: true,
        cryptoType: 'USDT_TRC20',
        currency: 'USD',
        minimumAmount: 0,
      });
    }
    setErrors({});
  }, [paymentMethod]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.type === 'crypto') {
      if (!formData.walletAddress?.trim()) {
        newErrors.walletAddress = 'Wallet address is required';
      } else if (formData.cryptoType === 'USDT_TRC20' && !formData.walletAddress.startsWith('T')) {
        newErrors.walletAddress = 'TRC20 address must start with T';
      } else if (formData.cryptoType === 'USDT_BEP20' && !formData.walletAddress.startsWith('0x')) {
        newErrors.walletAddress = 'BEP20 address must start with 0x';
      }
    } else {
      if (!formData.bankName?.trim()) {
        newErrors.bankName = 'Bank name is required';
      }
      if (!formData.accountHolderName?.trim()) {
        newErrors.accountHolderName = 'Account holder name is required';
      }
      if (!formData.accountNumber?.trim()) {
        newErrors.accountNumber = 'Account number is required';
      }
      if (formData.currency === 'USD' && !formData.routingNumber?.trim()) {
        newErrors.routingNumber = 'Routing number is required for USD accounts';
      }
      if ((formData.currency === 'AED' || formData.currency === 'USD') && !formData.swiftCode?.trim()) {
        newErrors.swiftCode = 'SWIFT code is required for international transfers';
      }
      if (formData.currency === 'AED' && !formData.iban?.trim()) {
        newErrors.iban = 'IBAN is required for AED accounts';
      }
    }

    if (formData.minimumAmount !== undefined && formData.minimumAmount < 0) {
      newErrors.minimumAmount = 'Minimum amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {paymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Payment Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'crypto' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.type === 'crypto'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Wallet className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-white font-medium">Cryptocurrency</div>
                  <div className="text-gray-400 text-sm">USDT Wallets</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'bank' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.type === 'bank'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-white font-medium">Bank Account</div>
                  <div className="text-gray-400 text-sm">Traditional Banking</div>
                </button>
              </div>
            </div>

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g., Main USDT Wallet, Primary Bank Account"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Cryptocurrency Fields */}
            {formData.type === 'crypto' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Crypto Type *
                  </label>
                  <select
                    value={formData.cryptoType}
                    onChange={(e) => setFormData({ ...formData, cryptoType: e.target.value as 'USDT_TRC20' | 'USDT_BEP20' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="USDT_TRC20">USDT (TRC20) - Tron Network</option>
                    <option value="USDT_BEP20">USDT (BEP20) - BNB Smart Chain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={formData.walletAddress || ''}
                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                    placeholder={formData.cryptoType === 'USDT_TRC20' ? 'T...' : '0x...'}
                  />
                  {errors.walletAddress && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.walletAddress}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Bank Account Fields */}
            {formData.type === 'bank' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'NGN' | 'AED' | 'USD' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ''}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Chase Bank, GTBank"
                    />
                    {errors.bankName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.bankName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName || ''}
                      onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Full name on account"
                    />
                    {errors.accountHolderName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.accountHolderName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Bank account number"
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                {/* Currency-specific fields */}
                {formData.currency === 'USD' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Routing Number *
                    </label>
                    <input
                      type="text"
                      value={formData.routingNumber || ''}
                      onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="9-digit routing number"
                    />
                    {errors.routingNumber && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.routingNumber}
                      </p>
                    )}
                  </div>
                )}

                {(formData.currency === 'AED' || formData.currency === 'USD') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SWIFT Code *
                    </label>
                    <input
                      type="text"
                      value={formData.swiftCode || ''}
                      onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="8 or 11 character SWIFT code"
                    />
                    {errors.swiftCode && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.swiftCode}
                      </p>
                    )}
                  </div>
                )}

                {formData.currency === 'AED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IBAN *
                    </label>
                    <input
                      type="text"
                      value={formData.iban || ''}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="International Bank Account Number"
                    />
                    {errors.iban && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.iban}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Minimum Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumAmount || ''}
                onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="0.00"
              />
              {errors.minimumAmount && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.minimumAmount}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {paymentMethod ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
