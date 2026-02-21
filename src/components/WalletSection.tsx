import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../lib/currencyUtils';
import FundingModal from './payment/FundingModal';
import { SwapInterface } from './SwapInterface';

interface WalletSectionProps {
  // No props needed for now
}

const WalletSection: React.FC<WalletSectionProps> = () => {
  console.log('WalletSection component rendered');

  const [wallet, setWallet] = useState<{
    usdBalance: number;
    jamzBalance: number;
    ngnBalance: number;
    aedBalance: number;
    inrBalance: number;
    usdcAddress: string | null;
    jamzAddress: string | null;
    paypalEmail: string | null;
    ngnBankDetails: {
      accountNumber: string | null;
      bankName: string | null;
      accountName: string | null;
      bankCode: string | null;
    } | null;
    aedBankDetails: {
      accountNumber: string | null;
      bankName: string | null;
      accountName: string | null;
      iban: string | null;
      swiftCode: string | null;
    } | null;
    inrBankDetails: {
      upiId: string | null;
      accountNumber: string | null;
      ifscCode: string | null;
      bankName: string | null;
      accountName: string | null;
    } | null;
  }>({
    usdBalance: 0,
    jamzBalance: 0,
    ngnBalance: 0,
    aedBalance: 0,
    inrBalance: 0,
    usdcAddress: null,
    jamzAddress: null,
    paypalEmail: null,
    ngnBankDetails: null,
    aedBankDetails: null,
    inrBankDetails: null
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [usdcAddress, setUsdcAddress] = useState('');
  const [jamzAddress, setJamzAddress] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimType, setClaimType] = useState<'usd-crypto' | 'usd-paypal' | 'jamz-onchain' | 'ngn-bank' | 'aed-bank' | 'inr-bank'>('usd-crypto');

  // NGN bank details form states
  const [ngnAccountNumber, setNgnAccountNumber] = useState('');
  const [ngnBankName, setNgnBankName] = useState('');
  const [ngnAccountName, setNgnAccountName] = useState('');
  const [ngnBankCode, setNgnBankCode] = useState('');

  // AED bank details form states
  const [aedAccountNumber, setAedAccountNumber] = useState('');
  const [aedBankName, setAedBankName] = useState('');
  const [aedAccountName, setAedAccountName] = useState('');
  const [aedIban, setAedIban] = useState('');
  const [aedSwiftCode, setAedSwiftCode] = useState('');

  // INR bank details form states
  const [inrUpiId, setInrUpiId] = useState('');
  const [inrAccountNumber, setInrAccountNumber] = useState('');
  const [inrIfscCode, setInrIfscCode] = useState('');
  const [inrBankName, setInrBankName] = useState('');
  const [inrAccountName, setInrAccountName] = useState('');

  // UI states
  const [activeTab, setActiveTab] = useState<'balances' | 'transactions' | 'swap'>('balances');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Individual modal states for each currency type
  const [showUsdcModal, setShowUsdcModal] = useState(false);
  const [showJamzModal, setShowJamzModal] = useState(false);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [showNgnBankModal, setShowNgnBankModal] = useState(false);
  const [showAedBankModal, setShowAedBankModal] = useState(false);
  const [showInrBankModal, setShowInrBankModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);

  // Debug log for state changes
  console.log('WalletSection state:', { showAddressForm, showClaimForm, activeTab });

  // Test: Add a button to force open the modal for debugging
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { wallet } = await api.wallets.getWallet();
      console.log('Fetched wallet data:', wallet);
      console.log('PayPal email from API:', wallet.paypalEmail);

      // Map the API response to our expected format
      const updatedWallet = {
        usdBalance: wallet.usdBalance || 0,
        jamzBalance: wallet.jamzBalance || 0,
        ngnBalance: wallet.ngnBalance || 0,
        aedBalance: wallet.aedBalance || 0,
        inrBalance: wallet.inrBalance || 0,
        usdcAddress: wallet.usdcAddress,
        jamzAddress: wallet.jamzAddress,
        paypalEmail: wallet.paypalEmail,
        ngnBankDetails: wallet.ngnBankDetails,
        aedBankDetails: wallet.aedBankDetails,
        inrBankDetails: wallet.inrBankDetails
      };

      console.log('Setting wallet state to:', updatedWallet);
      setWallet(updatedWallet);

      const { transactions } = await api.wallets.getTransactions();
      setTransactions(transactions);

      setLoading(false);
    } catch (err) {
      setError('Failed to load wallet data. Please try again.');
      setLoading(false);
      console.error('Error fetching wallet data:', err);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Handle address form submission
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Create a simple data object with all fields
      const data = {
        usdcAddress: usdcAddress,
        jamzAddress: jamzAddress,
        paypalEmail: paypalEmail,
        ngnBankDetails: {
          accountNumber: ngnAccountNumber,
          bankName: ngnBankName,
          accountName: ngnAccountName,
          bankCode: ngnBankCode
        },
        aedBankDetails: {
          accountNumber: aedAccountNumber,
          bankName: aedBankName,
          accountName: aedAccountName,
          iban: aedIban,
          swiftCode: aedSwiftCode
        }
      };

      console.log('Sending data to API:', data);
      console.log('PayPal email being sent:', paypalEmail);

      // Send the data to the API
      const response = await api.wallets.setAddresses(data);
      console.log('API Response:', response);

      // Log the PayPal email from the response
      console.log('PayPal email in response:', response.wallet.paypalEmail);

      // Log the raw response
      console.log('Raw response wallet:', response.wallet);

      // Update the wallet state with the response data
      setWallet({
        usdBalance: response.wallet.usdBalance || 0,
        jamzBalance: response.wallet.jamzBalance || 0,
        ngnBalance: response.wallet.ngnBalance || 0,
        aedBalance: response.wallet.aedBalance || 0,
        usdcAddress: response.wallet.usdcAddress,
        jamzAddress: response.wallet.jamzAddress,
        paypalEmail: response.wallet.paypalEmail,
        ngnBankDetails: response.wallet.ngnBankDetails,
        aedBankDetails: response.wallet.aedBankDetails
      });

      // Show success message
      setSuccessMessage('Withdrawal routes updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Close the form
      setShowAddressForm(false);
      setLoading(false);

      // Force a refresh of the wallet data
      fetchWalletData();
    } catch (err: any) {
      console.error('Error setting addresses:', err);
      setError(err.message || 'Failed to update addresses. Please try again.');
      setLoading(false);
    }
  };

  // Individual submit handlers for each currency type
  const handleUsdcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.wallets.setAddresses({
        usdcAddress: usdcAddress,
        jamzAddress: wallet.jamzAddress || '',
        paypalEmail: wallet.paypalEmail || '',
        ngnBankDetails: wallet.ngnBankDetails || { accountNumber: '', bankName: '', accountName: '', bankCode: '' },
        aedBankDetails: wallet.aedBankDetails || { accountNumber: '', bankName: '', accountName: '', iban: '', swiftCode: '' }
      });

      setWallet(prev => ({ ...prev, usdcAddress: response.wallet.usdcAddress }));
      setShowUsdcModal(false);
      setSuccessMessage('USDC address updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update USDC address.');
    } finally {
      setLoading(false);
    }
  };

  const handleJamzSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.wallets.setAddresses({
        usdcAddress: wallet.usdcAddress || '',
        jamzAddress: jamzAddress,
        paypalEmail: wallet.paypalEmail || '',
        ngnBankDetails: wallet.ngnBankDetails || { accountNumber: '', bankName: '', accountName: '', bankCode: '' },
        aedBankDetails: wallet.aedBankDetails || { accountNumber: '', bankName: '', accountName: '', iban: '', swiftCode: '' }
      });

      setWallet(prev => ({ ...prev, jamzAddress: response.wallet.jamzAddress }));
      setShowJamzModal(false);
      setSuccessMessage('JAMZ address updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update JAMZ address.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaypalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.wallets.setAddresses({
        usdcAddress: wallet.usdcAddress || '',
        jamzAddress: wallet.jamzAddress || '',
        paypalEmail: paypalEmail,
        ngnBankDetails: wallet.ngnBankDetails || { accountNumber: '', bankName: '', accountName: '', bankCode: '' },
        aedBankDetails: wallet.aedBankDetails || { accountNumber: '', bankName: '', accountName: '', iban: '', swiftCode: '' }
      });

      setWallet(prev => ({ ...prev, paypalEmail: response.wallet.paypalEmail }));
      setShowPaypalModal(false);
      setSuccessMessage('PayPal email updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update PayPal email.');
    } finally {
      setLoading(false);
    }
  };

  const handleNgnBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.wallets.setAddresses({
        usdcAddress: wallet.usdcAddress || '',
        jamzAddress: wallet.jamzAddress || '',
        paypalEmail: wallet.paypalEmail || '',
        ngnBankDetails: {
          accountNumber: ngnAccountNumber,
          bankName: ngnBankName,
          accountName: ngnAccountName,
          bankCode: ngnBankCode
        },
        aedBankDetails: wallet.aedBankDetails || { accountNumber: '', bankName: '', accountName: '', iban: '', swiftCode: '' }
      });

      setWallet(prev => ({ ...prev, ngnBankDetails: response.wallet.ngnBankDetails }));
      setShowNgnBankModal(false);
      setSuccessMessage('NGN bank details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update NGN bank details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAedBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await api.wallets.setAddresses({
        usdcAddress: wallet.usdcAddress || '',
        jamzAddress: wallet.jamzAddress || '',
        paypalEmail: wallet.paypalEmail || '',
        ngnBankDetails: wallet.ngnBankDetails || { accountNumber: '', bankName: '', accountName: '', bankCode: '' },
        aedBankDetails: {
          accountNumber: aedAccountNumber,
          bankName: aedBankName,
          accountName: aedAccountName,
          iban: aedIban,
          swiftCode: aedSwiftCode
        }
      });

      setWallet(prev => ({ ...prev, aedBankDetails: response.wallet.aedBankDetails }));
      setShowAedBankModal(false);
      setSuccessMessage('AED bank details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update AED bank details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle INR bank details submission
  const handleInrBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.wallets.setAddresses({
        usdcAddress: wallet.usdcAddress || '',
        jamzAddress: wallet.jamzAddress || '',
        paypalEmail: wallet.paypalEmail || '',
        ngnBankDetails: wallet.ngnBankDetails || { accountNumber: '', bankName: '', accountName: '', bankCode: '' },
        aedBankDetails: wallet.aedBankDetails || { accountNumber: '', bankName: '', accountName: '', iban: '', swiftCode: '' },
        inrBankDetails: {
          upiId: inrUpiId,
          accountNumber: inrAccountNumber,
          ifscCode: inrIfscCode,
          bankName: inrBankName,
          accountName: inrAccountName
        }
      });

      setWallet(prev => ({ ...prev, inrBankDetails: response.wallet.inrBankDetails }));
      setShowInrBankModal(false);
      setSuccessMessage('INR bank details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update INR bank details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle claim form submission
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claimAmount || parseFloat(claimAmount) <= 0) {
      setError('Please enter a valid amount to claim.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const amount = parseFloat(claimAmount);
      let response;

      switch (claimType) {
        case 'usd-crypto':
          response = await api.wallets.claimUsdToCrypto(amount);
          break;
        case 'usd-paypal':
          response = await api.wallets.claimUsdToPaypal(amount);
          break;
        case 'jamz-onchain':
          response = await api.wallets.claimJamzOnchain(amount);
          break;
        case 'ngn-bank':
          response = await api.wallets.claimNgnToBank(amount);
          break;
        case 'aed-bank':
          response = await api.wallets.claimAedToBank(amount);
          break;
      }

      // Map the API response to our expected format
      setWallet({
        usdBalance: response.wallet.usdBalance || 0,
        jamzBalance: response.wallet.jamzBalance || 0,
        ngnBalance: response.wallet.ngnBalance || 0,
        aedBalance: response.wallet.aedBalance || 0,
        usdcAddress: response.wallet.usdcAddress,
        jamzAddress: response.wallet.jamzAddress,
        paypalEmail: response.wallet.paypalEmail || null,
        ngnBankDetails: response.wallet.ngnBankDetails,
        aedBankDetails: response.wallet.aedBankDetails
      });

      // Add the new transaction to the list
      setTransactions([response.transaction, ...transactions]);

      setSuccessMessage(`Claim initiated successfully! ${response.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowClaimForm(false);
      setClaimAmount('');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process claim. Please try again.');
      setLoading(false);
    }
  };

  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading && !wallet.usdBalance && !wallet.jamzBalance) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center">
        <div className="animate-pulse-slow">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
        <p className="text-white/60 text-lg">Loading wallet data...</p>
        <p className="text-white/40 text-sm mt-2">Please wait while we fetch your balance information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Tabs */}
      <div className="glass-card p-1 rounded-xl inline-flex">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'balances'
              ? 'bg-primary text-white shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('balances')}
        >
          Balances
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'swap'
              ? 'bg-primary text-white shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('swap')}
        >
          Swap
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'transactions'
              ? 'bg-primary text-white shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Portfolio Overview - Redesigned */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Portfolio Overview</h3>
                <p className="text-white/50 text-sm">Your complete balance across all currencies</p>
              </div>
              <div className="text-xs text-white/60">
                Configure individual withdrawal methods below
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-sm font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">USD Balance</p>
                    <p className="text-lg font-semibold text-green-400">{formatCurrency(wallet.usdBalance, 'USD')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">J</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">JAMZ Tokens</p>
                    <p className="text-lg font-semibold text-accent">{formatCurrency(wallet.jamzBalance, 'JAMZ')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-4 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 text-sm font-bold">₦</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">NGN Balance</p>
                    <p className="text-lg font-semibold text-orange-400">{formatCurrency(wallet.ngnBalance, 'NGN')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 p-4 rounded-lg border border-teal-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <span className="text-teal-400 text-sm font-bold">د</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">AED Balance</p>
                    <p className="text-lg font-semibold text-teal-400">{formatCurrency(wallet.aedBalance, 'AED')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-bold">₹</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">INR Balance</p>
                    <p className="text-lg font-semibold text-blue-400">{formatCurrency(wallet.inrBalance, 'INR')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fund Wallet Button - Removed for regular users, only available in Artist Dashboard */}
          </div>

          {/* Quick Actions - Redesigned */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  wallet.usdBalance <= 0
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10'
                    : 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30'
                }`}
                onClick={() => {
                  setClaimType('usd-crypto');
                  setShowClaimForm(true);
                }}
                disabled={wallet.usdBalance <= 0}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-xs font-bold">$</span>
                  </div>
                  <span className="text-sm font-medium text-white">Withdraw USD</span>
                </div>
                <p className="text-xs text-white/50">To crypto or PayPal</p>
              </button>

              <button
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  wallet.jamzBalance <= 0
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10'
                    : 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30'
                }`}
                onClick={() => {
                  setClaimType('jamz-onchain');
                  setShowClaimForm(true);
                }}
                disabled={wallet.jamzBalance <= 0}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">J</span>
                  </div>
                  <span className="text-sm font-medium text-white">Claim JAMZ</span>
                </div>
                <p className="text-xs text-white/50">To blockchain wallet</p>
              </button>

              <button
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  wallet.ngnBalance <= 0
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10'
                    : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/30'
                }`}
                onClick={() => {
                  setClaimType('ngn-bank');
                  setShowClaimForm(true);
                }}
                disabled={wallet.ngnBalance <= 0}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 text-xs font-bold">₦</span>
                  </div>
                  <span className="text-sm font-medium text-white">Withdraw NGN</span>
                </div>
                <p className="text-xs text-white/50">To Nigerian bank</p>
              </button>

              <button
                className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                  wallet.aedBalance <= 0
                    ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10'
                    : 'bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/30'
                }`}
                onClick={() => {
                  setClaimType('aed-bank');
                  setShowClaimForm(true);
                }}
                disabled={wallet.aedBalance <= 0}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <span className="text-teal-400 text-xs font-bold">د</span>
                  </div>
                  <span className="text-sm font-medium text-white">Withdraw AED</span>
                </div>
                <p className="text-xs text-white/50">To UAE bank</p>
              </button>
            </div>
          </div>

          {/* Withdrawal Methods - Redesigned */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Withdrawal Methods</h3>
            <div className="space-y-4">

              {/* USD Methods */}
              <div className="border border-green-500/20 rounded-lg p-4 bg-green-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-sm font-bold">$</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">USD Withdrawal</h4>
                    <p className="text-green-400 font-semibold">{formatCurrency(wallet.usdBalance, 'USD')} available</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white/70">USDC (Base)</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Crypto</span>
                    </div>
                    <p className="text-xs font-mono text-white/60 break-all mb-2">
                      {wallet.usdcAddress ?
                        `${wallet.usdcAddress.slice(0, 8)}...${wallet.usdcAddress.slice(-6)}` :
                        'Not configured'
                      }
                    </p>
                    <button
                      className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-all duration-200"
                      onClick={() => {
                        setUsdcAddress(wallet.usdcAddress || '');
                        setShowUsdcModal(true);
                      }}
                    >
                      ⚙️ Configure
                    </button>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white/70">PayPal</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Non-Crypto</span>
                    </div>
                    <p className="text-xs font-mono text-white/60 break-all mb-2">
                      {wallet.paypalEmail || 'Not configured'}
                    </p>
                    <button
                      className="text-xs bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 text-blue-400 hover:text-blue-300 transition-all duration-200"
                      onClick={() => {
                        setPaypalEmail(wallet.paypalEmail || '');
                        setShowPaypalModal(true);
                      }}
                    >
                      ⚙️ Configure
                    </button>
                  </div>
                </div>
              </div>

              {/* JAMZ Methods */}
              <div className="border border-purple-500/20 rounded-lg p-4 bg-purple-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">J</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">JAMZ Tokens</h4>
                    <p className="text-accent font-semibold">{formatCurrency(wallet.jamzBalance, 'JAMZ')} available</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/70">Blockchain Wallet</span>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Crypto</span>
                  </div>
                  <p className="text-xs font-mono text-white/60 break-all mb-2">
                    {wallet.jamzAddress ?
                      `${wallet.jamzAddress.slice(0, 8)}...${wallet.jamzAddress.slice(-6)}` :
                      'Not configured'
                    }
                  </p>
                  <button
                    className="text-xs bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded border border-purple-500/20 text-purple-400 hover:text-purple-300 transition-all duration-200"
                    onClick={() => {
                      setJamzAddress(wallet.jamzAddress || '');
                      setShowJamzModal(true);
                    }}
                  >
                    ⚙️ Configure
                  </button>
                </div>
              </div>

              {/* NGN Methods */}
              <div className="border border-orange-500/20 rounded-lg p-4 bg-orange-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 text-sm font-bold">₦</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">NGN Withdrawal</h4>
                    <p className="text-orange-400 font-semibold">{formatCurrency(wallet.ngnBalance, 'NGN')} available</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/70">Nigerian Bank</span>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Bank Transfer</span>
                  </div>
                  <p className="text-xs text-white/60 mb-2">
                    {wallet.ngnBankDetails?.accountNumber ?
                      `${wallet.ngnBankDetails.bankName} - ***${wallet.ngnBankDetails.accountNumber.slice(-4)}` :
                      'Not configured'
                    }
                  </p>
                  <button
                    className="text-xs bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded border border-orange-500/20 text-orange-400 hover:text-orange-300 transition-all duration-200"
                    onClick={() => {
                      setNgnAccountNumber(wallet.ngnBankDetails?.accountNumber || '');
                      setNgnBankName(wallet.ngnBankDetails?.bankName || '');
                      setNgnAccountName(wallet.ngnBankDetails?.accountName || '');
                      setNgnBankCode(wallet.ngnBankDetails?.bankCode || '');
                      setShowNgnBankModal(true);
                    }}
                  >
                    ⚙️ Configure
                  </button>
                </div>
              </div>

              {/* AED Methods */}
              <div className="border border-teal-500/20 rounded-lg p-4 bg-teal-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <span className="text-teal-400 text-sm font-bold">د</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">AED Withdrawal</h4>
                    <p className="text-teal-400 font-semibold">{formatCurrency(wallet.aedBalance, 'AED')} available</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/70">UAE Bank</span>
                    <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">Bank Transfer</span>
                  </div>
                  <p className="text-xs text-white/60 mb-2">
                    {wallet.aedBankDetails?.accountNumber ?
                      `${wallet.aedBankDetails.bankName} - ***${wallet.aedBankDetails.accountNumber.slice(-4)}` :
                      'Not configured'
                    }
                  </p>
                  <button
                    className="text-xs bg-teal-500/10 hover:bg-teal-500/20 px-2 py-1 rounded border border-teal-500/20 text-teal-400 hover:text-teal-300 transition-all duration-200"
                    onClick={() => {
                      setAedAccountNumber(wallet.aedBankDetails?.accountNumber || '');
                      setAedBankName(wallet.aedBankDetails?.bankName || '');
                      setAedAccountName(wallet.aedBankDetails?.accountName || '');
                      setAedIban(wallet.aedBankDetails?.iban || '');
                      setAedSwiftCode(wallet.aedBankDetails?.swiftCode || '');
                      setShowAedBankModal(true);
                    }}
                  >
                    ⚙️ Configure
                  </button>
                </div>
              </div>

              {/* INR Methods */}
              <div className="border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-bold">₹</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">INR Withdrawal</h4>
                    <p className="text-blue-400 font-semibold">{formatCurrency(wallet.inrBalance, 'INR')} available</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/70">UPI / Bank Transfer</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Bank Transfer</span>
                  </div>
                  <p className="text-xs text-white/60 mb-2">
                    {wallet.inrBankDetails?.upiId ?
                      `UPI: ${wallet.inrBankDetails.upiId}` :
                      wallet.inrBankDetails?.accountNumber ?
                      `${wallet.inrBankDetails.bankName} - ***${wallet.inrBankDetails.accountNumber.slice(-4)}` :
                      'Not configured'
                    }
                  </p>
                  <button
                    className="text-xs bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 text-blue-400 hover:text-blue-300 transition-all duration-200"
                    onClick={() => {
                      setInrUpiId(wallet.inrBankDetails?.upiId || '');
                      setInrAccountNumber(wallet.inrBankDetails?.accountNumber || '');
                      setInrIfscCode(wallet.inrBankDetails?.ifscCode || '');
                      setInrBankName(wallet.inrBankDetails?.bankName || '');
                      setInrAccountName(wallet.inrBankDetails?.accountName || '');
                      setShowInrBankModal(true);
                    }}
                  >
                    ⚙️ Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Swap Tab */}
      {activeTab === 'swap' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <SwapInterface
            wallet={{
              usdcBalance: wallet.usdBalance,
              jamzBalance: wallet.jamzBalance,
              ngnBalance: wallet.ngnBalance,
              aedBalance: wallet.aedBalance,
              inrBalance: wallet.inrBalance
            }}
            onSwapComplete={fetchWalletData}
          />
        </motion.div>
      )}

      {/* Transactions Tab - Redesigned */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {transactions.length === 0 ? (
            <div className="glass-card p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white/40 text-2xl">📊</span>
              </div>
              <p className="text-white/60 mb-2">No transactions yet</p>
              <p className="text-white/40 text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                <p className="text-white/50 text-sm">Recent activity in your wallet</p>
              </div>

              <div className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <div key={tx._id} className="p-4 hover:bg-white/5 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'deposit' ? 'bg-green-500/20' :
                          tx.type === 'withdrawal' ? 'bg-red-500/20' :
                          tx.type === 'reward' ? 'bg-blue-500/20' :
                          'bg-yellow-500/20'
                        }`}>
                          <span className={`text-sm ${
                            tx.type === 'deposit' ? 'text-green-400' :
                            tx.type === 'withdrawal' ? 'text-red-400' :
                            tx.type === 'reward' ? 'text-blue-400' :
                            'text-yellow-400'
                          }`}>
                            {tx.type === 'deposit' ? '↓' :
                             tx.type === 'withdrawal' ? '↑' :
                             tx.type === 'reward' ? '🎁' : '⚡'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium capitalize">{tx.type}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                          <p className="text-white/50 text-sm">{formatDate(tx.createdAt)}</p>
                          {tx.method && (
                            <p className="text-white/40 text-xs">via {tx.method}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === 'withdrawal' || tx.type === 'claim' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {tx.type === 'withdrawal' || tx.type === 'claim' ? '-' : '+'}
                          {formatCurrency(tx.amount, tx.token)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Individual Currency Configuration Modals */}

      {/* USDT Address Modal */}
      <AnimatePresence>
        {showUsdcModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowUsdcModal(false);
              }
            }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">Configure USDC Address</h3>
                <p className="text-white/50 text-xs">Set up your USDC (Base) withdrawal address</p>
              </div>

              <form onSubmit={handleUsdcSubmit} className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-white/80">USDC Address (Base)</label>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">Crypto</span>
                  </div>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-transparent"
                    value={usdcAddress}
                    onChange={(e) => setUsdcAddress(e.target.value)}
                    placeholder="0x..."
                  />
                  <p className="text-xs text-white/40 mt-1">Your USDC wallet address on Base network</p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowUsdcModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-500/90 rounded-lg text-black font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JAMZ Address Modal */}
      <AnimatePresence>
        {showJamzModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowJamzModal(false);
              }
            }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">Configure JAMZ Address</h3>
                <p className="text-white/50 text-xs">Set up your JAMZ token withdrawal address</p>
              </div>

              <form onSubmit={handleJamzSubmit} className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-white/80">JAMZ Address</label>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Token</span>
                  </div>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-transparent"
                    value={jamzAddress}
                    onChange={(e) => setJamzAddress(e.target.value)}
                    placeholder="0x..."
                  />
                  <p className="text-xs text-white/40 mt-1">Your JAMZ token wallet address</p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowJamzModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-purple-500 hover:bg-purple-500/90 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PayPal Email Modal */}
      <AnimatePresence>
        {showPaypalModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPaypalModal(false);
              }
            }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">Configure PayPal Email</h3>
                <p className="text-white/50 text-xs">Set up your PayPal email for USD withdrawals</p>
              </div>

              <form onSubmit={handlePaypalSubmit} className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-white/80">PayPal Email</label>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Non-Crypto</span>
                  </div>
                  <input
                    type="email"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent"
                    value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                  <p className="text-xs text-white/40 mt-1">Your verified PayPal email address</p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowPaypalModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-500/90 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Email'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NGN Bank Details Modal */}
      <AnimatePresence>
        {showNgnBankModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNgnBankModal(false);
              }
            }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">Configure NGN Bank Details</h3>
                <p className="text-white/50 text-xs">Set up your Nigerian bank account for NGN withdrawals</p>
              </div>

              <form onSubmit={handleNgnBankSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-white/70 text-xs mb-1">Account Number</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-transparent"
                    value={ngnAccountNumber}
                    onChange={(e) => setNgnAccountNumber(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Bank Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-transparent"
                    value={ngnBankName}
                    onChange={(e) => setNgnBankName(e.target.value)}
                    placeholder="e.g. First Bank"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Account Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-transparent"
                    value={ngnAccountName}
                    onChange={(e) => setNgnAccountName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Bank Code</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-transparent"
                    value={ngnBankCode}
                    onChange={(e) => setNgnBankCode(e.target.value)}
                    placeholder="e.g. 011"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowNgnBankModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-orange-500 hover:bg-orange-500/90 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Bank Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AED Bank Details Modal */}
      <AnimatePresence>
        {showAedBankModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAedBankModal(false);
              }
            }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">Configure AED Bank Details</h3>
                <p className="text-white/50 text-xs">Set up your UAE bank account for AED withdrawals</p>
              </div>

              <form onSubmit={handleAedBankSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-white/70 text-xs mb-1">Account Number</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-transparent"
                    value={aedAccountNumber}
                    onChange={(e) => setAedAccountNumber(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Bank Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-transparent"
                    value={aedBankName}
                    onChange={(e) => setAedBankName(e.target.value)}
                    placeholder="e.g. Emirates NBD"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Account Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-transparent"
                    value={aedAccountName}
                    onChange={(e) => setAedAccountName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">IBAN</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-transparent"
                    value={aedIban}
                    onChange={(e) => setAedIban(e.target.value)}
                    placeholder="AE123456789012345678"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">SWIFT Code</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-transparent"
                    value={aedSwiftCode}
                    onChange={(e) => setAedSwiftCode(e.target.value)}
                    placeholder="EBILAEAD"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowAedBankModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-teal-500 hover:bg-teal-500/90 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Bank Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INR Bank Details Modal */}
      <AnimatePresence>
        {showInrBankModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowInrBankModal(false);
              }
            }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-1">Configure INR Bank Details</h3>
                <p className="text-white/50 text-xs">Set up your Indian bank account or UPI for INR withdrawals</p>
              </div>

              <form onSubmit={handleInrBankSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-white/70 text-xs mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent"
                    value={inrUpiId}
                    onChange={(e) => setInrUpiId(e.target.value)}
                    placeholder="yourname@upi"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Account Number</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent"
                    value={inrAccountNumber}
                    onChange={(e) => setInrAccountNumber(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">IFSC Code</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent"
                    value={inrIfscCode}
                    onChange={(e) => setInrIfscCode(e.target.value)}
                    placeholder="SBIN0001234"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Bank Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent"
                    value={inrBankName}
                    onChange={(e) => setInrBankName(e.target.value)}
                    placeholder="State Bank of India"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent"
                    value={inrAccountName}
                    onChange={(e) => setInrAccountName(e.target.value)}
                    placeholder="Full name as per bank records"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowInrBankModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-500/90 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Bank Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Form Modal - Redesigned */}
      <AnimatePresence>
        {showClaimForm && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card w-full max-w-md rounded-xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className={`p-4 border-b border-white/10 ${
                claimType === 'usd-crypto' || claimType === 'usd-paypal'
                  ? 'bg-green-500/10'
                  : claimType === 'jamz-onchain'
                  ? 'bg-purple-500/10'
                  : claimType === 'ngn-bank'
                  ? 'bg-orange-500/10'
                  : 'bg-teal-500/10'
              }`}>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {claimType === 'usd-crypto' ? 'Withdraw USD to USDC' :
                   claimType === 'usd-paypal' ? 'Withdraw USD to PayPal' :
                   claimType === 'jamz-onchain' ? 'Claim JAMZ Tokens' :
                   claimType === 'ngn-bank' ? 'Withdraw NGN to Bank' :
                   'Withdraw AED to Bank'}
                </h3>
                <p className="text-white/50 text-sm">
                  {claimType === 'usd-crypto' ? 'Convert to USDC (Base) and send to your wallet' :
                   claimType === 'usd-paypal' ? 'Send USD directly to your PayPal account' :
                   claimType === 'jamz-onchain' ? 'Transfer tokens to your blockchain wallet' :
                   claimType === 'ngn-bank' ? 'Transfer to your Nigerian bank account' :
                   'Transfer to your UAE bank account'}
                </p>
              </div>

              <motion.div>
                <form onSubmit={handleClaimSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Amount to Withdraw</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent pr-16"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="0.00"
                      max={
                        claimType.startsWith('usd') ? wallet.usdBalance :
                        claimType === 'jamz-onchain' ? wallet.jamzBalance :
                        claimType === 'ngn-bank' ? wallet.ngnBalance :
                        wallet.aedBalance
                      }
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                      {claimType.startsWith('usd') ? 'USD' :
                       claimType === 'jamz-onchain' ? 'JAMZ' :
                       claimType === 'ngn-bank' ? 'NGN' :
                       'AED'}
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-1">
                    Available: {formatCurrency(
                      claimType.startsWith('usd') ? wallet.usdBalance :
                      claimType === 'jamz-onchain' ? wallet.jamzBalance :
                      claimType === 'ngn-bank' ? wallet.ngnBalance :
                      wallet.aedBalance,
                      claimType.startsWith('usd') ? 'USD' :
                      claimType === 'jamz-onchain' ? 'JAMZ' :
                      claimType === 'ngn-bank' ? 'NGN' :
                      'AED'
                    )}
                  </p>
                </div>

                {/* Destination Information */}
                <div className="bg-black/10 border border-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-sm mb-2">
                    {claimType === 'usd-crypto' ? 'Destination USDC Address:' :
                     claimType === 'usd-paypal' ? 'Destination PayPal Account:' :
                     claimType === 'jamz-onchain' ? 'Destination JAMZ Address:' :
                     claimType === 'ngn-bank' ? 'Destination Bank Account:' :
                     'Destination Bank Account:'}
                  </p>

                  {claimType === 'usd-crypto' && (
                    <div>
                      <p className="font-mono text-xs bg-black/20 py-2 px-3 rounded border border-white/10 break-all">
                        {wallet.usdcAddress ?
                          `${wallet.usdcAddress.slice(0, 10)}...${wallet.usdcAddress.slice(-8)}` :
                          'Not configured'
                        }
                      </p>
                      {!wallet.usdcAddress && (
                        <p className="text-red-400 text-xs mt-1">
                          Please configure your USDC address in settings first.
                        </p>
                      )}
                    </div>
                  )}

                  {claimType === 'usd-paypal' && (
                    <div>
                      <p className="font-mono text-xs bg-black/20 py-2 px-3 rounded border border-white/10 break-all">
                        {wallet.paypalEmail || 'Not configured'}
                      </p>
                      {!wallet.paypalEmail && (
                        <p className="text-red-400 text-xs mt-1">
                          Please configure your PayPal email in settings first.
                        </p>
                      )}
                    </div>
                  )}

                  {claimType === 'jamz-onchain' && (
                    <div>
                      <p className="font-mono text-xs bg-black/20 py-2 px-3 rounded border border-white/10 break-all">
                        {wallet.jamzAddress ?
                          `${wallet.jamzAddress.slice(0, 10)}...${wallet.jamzAddress.slice(-8)}` :
                          'Not configured'
                        }
                      </p>
                      {!wallet.jamzAddress && (
                        <p className="text-red-400 text-xs mt-1">
                          Please configure your JAMZ address in settings first.
                        </p>
                      )}
                    </div>
                  )}

                  {claimType === 'ngn-bank' && (
                    <div>
                      {wallet.ngnBankDetails?.accountNumber ? (
                        <div className="text-xs space-y-1">
                          <p><span className="text-white/50">Bank:</span> {wallet.ngnBankDetails.bankName}</p>
                          <p><span className="text-white/50">Account:</span> ***{wallet.ngnBankDetails.accountNumber.slice(-4)}</p>
                          <p><span className="text-white/50">Name:</span> {wallet.ngnBankDetails.accountName}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-white/60">Not configured</p>
                          <p className="text-red-400 text-xs mt-1">
                            Please configure your NGN bank details in settings first.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {claimType === 'aed-bank' && (
                    <div>
                      {wallet.aedBankDetails?.accountNumber ? (
                        <div className="text-xs space-y-1">
                          <p><span className="text-white/50">Bank:</span> {wallet.aedBankDetails.bankName}</p>
                          <p><span className="text-white/50">Account:</span> ***{wallet.aedBankDetails.accountNumber.slice(-4)}</p>
                          <p><span className="text-white/50">Name:</span> {wallet.aedBankDetails.accountName}</p>
                          {wallet.aedBankDetails.iban && (
                            <p><span className="text-white/50">IBAN:</span> {wallet.aedBankDetails.iban.slice(0, 8)}***</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-white/60">Not configured</p>
                          <p className="text-red-400 text-xs mt-1">
                            Please configure your AED bank details in settings first.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                  {claimType.startsWith('usd') && (
                    <div className="mb-5">
                      <label className="block text-white/70 mb-2 font-medium">Withdrawal Method</label>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                            claimType === 'usd-crypto'
                              ? 'bg-gradient-to-r from-primary/80 to-secondary/80 text-white border border-white/10'
                              : 'bg-black/30 text-white/70 border border-white/5 hover:bg-black/40'
                          }`}
                          onClick={() => setClaimType('usd-crypto')}
                        >
                          USDC (Base)
                        </button>
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                            claimType === 'usd-paypal'
                              ? 'bg-gradient-to-r from-primary/80 to-secondary/80 text-white border border-white/10'
                              : 'bg-black/30 text-white/70 border border-white/5 hover:bg-black/40'
                          }`}
                          onClick={() => setClaimType('usd-paypal')}
                        >
                          PayPal
                        </button>
                      </div>
                    </div>
                  )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all duration-200"
                    onClick={() => setShowClaimForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                      loading ||
                      !claimAmount ||
                      parseFloat(claimAmount) <= 0 ||
                      parseFloat(claimAmount) > (
                        claimType.startsWith('usd') ? wallet.usdBalance :
                        claimType === 'jamz-onchain' ? wallet.jamzBalance :
                        claimType === 'ngn-bank' ? wallet.ngnBalance :
                        wallet.aedBalance
                      ) ||
                      (claimType === 'usd-crypto' && !wallet.usdcAddress) ||
                      (claimType === 'usd-paypal' && !wallet.paypalEmail) ||
                      (claimType === 'jamz-onchain' && !wallet.jamzAddress) ||
                      (claimType === 'ngn-bank' && (!wallet.ngnBankDetails?.accountNumber || !wallet.ngnBankDetails?.bankName)) ||
                      (claimType === 'aed-bank' && (!wallet.aedBankDetails?.accountNumber || !wallet.aedBankDetails?.bankName))
                        ? 'opacity-50 cursor-not-allowed bg-gray-600 text-white/50'
                        : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                    disabled={
                      loading ||
                      !claimAmount ||
                      parseFloat(claimAmount) <= 0 ||
                      parseFloat(claimAmount) > (
                        claimType.startsWith('usd') ? wallet.usdBalance :
                        claimType === 'jamz-onchain' ? wallet.jamzBalance :
                        claimType === 'ngn-bank' ? wallet.ngnBalance :
                        wallet.aedBalance
                      ) ||
                      (claimType === 'usd-crypto' && !wallet.usdcAddress) ||
                      (claimType === 'usd-paypal' && !wallet.paypalEmail) ||
                      (claimType === 'jamz-onchain' && !wallet.jamzAddress) ||
                      (claimType === 'ngn-bank' && (!wallet.ngnBankDetails?.accountNumber || !wallet.ngnBankDetails?.bankName)) ||
                      (claimType === 'aed-bank' && (!wallet.aedBankDetails?.accountNumber || !wallet.aedBankDetails?.bankName))
                    }
                  >
                    {loading ? 'Processing...' : 'Withdraw Now'}
                  </button>
                </div>
                </form>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Funding Modal */}
      <FundingModal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
        onSuccess={() => {
          // Refresh wallet data after successful payment
          fetchWalletData();
          setShowFundingModal(false);
        }}
      />
    </div>
  );
};

export default WalletSection;
