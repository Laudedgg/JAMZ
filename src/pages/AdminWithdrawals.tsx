import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Clock, Ban, DollarSign, Building2, Wallet, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { AdminNav } from './AdminDashboard';

interface WithdrawalRequest {
  _id: string;
  userId: { _id: string; email: string; username?: string };
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  withdrawalDetails: {
    walletAddress?: string;
    paypalEmail?: string;
    bankDetails?: {
      accountNumber?: string;
      bankName?: string;
      accountName?: string;
      bankCode?: string;
      iban?: string;
      swiftCode?: string;
      ifscCode?: string;
      upiId?: string;
    };
  };
  adminNotes?: string;
  rejectionReason?: string;
  txReference?: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [txReference, setTxReference] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchWithdrawals();
  }, [isAuthenticated, isAdmin, navigate, statusFilter, currencyFilter, pagination.page]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuthError = async (error: any) => {
    if (error.message?.includes('JWT')) {
      await signOut();
      navigate('/admin/login');
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await api.adminWithdrawals.getWithdrawals({
        status: statusFilter || undefined,
        currency: currencyFilter || undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      setWithdrawals(data.requests);
      setPagination(prev => ({ ...prev, ...data.pagination }));
      setError(null);
    } catch (err: any) {
      console.error('Error fetching withdrawals:', err);
      setError(err.message || 'Failed to load withdrawals');
      await handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await api.adminWithdrawals.approveWithdrawal(id);
      showNotification('success', 'Withdrawal approved');
      fetchWithdrawals();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async (id: string) => {
    try {
      setActionLoading(id);
      await api.adminWithdrawals.processWithdrawal(id);
      showNotification('success', 'Withdrawal marked as processing');
      fetchWithdrawals();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!selectedWithdrawal) return;
    try {
      setActionLoading(selectedWithdrawal._id);
      await api.adminWithdrawals.completeWithdrawal(selectedWithdrawal._id, txReference);
      showNotification('success', 'Withdrawal completed');
      setShowCompleteModal(false);
      setTxReference('');
      fetchWithdrawals();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) return;
    try {
      setActionLoading(selectedWithdrawal._id);
      await api.adminWithdrawals.rejectWithdrawal(selectedWithdrawal._id, rejectionReason);
      showNotification('success', 'Withdrawal rejected and balance refunded');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'processing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'onchain': return <Wallet className="w-4 h-4" />;
      case 'paypal': return <DollarSign className="w-4 h-4" />;
      case 'bank': return <Building2 className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const WithdrawalDetailsModal = () => {
    if (!selectedWithdrawal) return null;
    const w = selectedWithdrawal;
    return (
      <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-black/90 border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
          <div className="sticky top-0 bg-black/90 border-b border-white/10 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Withdrawal Details</h2>
            <button onClick={() => setShowDetails(false)} className="p-1 rounded-full hover:bg-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-white/60 text-sm">User</p><p className="font-medium">{w.userId?.email || 'N/A'}</p></div>
              <div><p className="text-white/60 text-sm">Amount</p><p className="font-medium text-[#6600FF]">{formatCurrency(w.amount, w.currency)}</p></div>
              <div><p className="text-white/60 text-sm">Method</p><p className="font-medium capitalize flex items-center gap-2">{getMethodIcon(w.method)} {w.method}</p></div>
              <div><p className="text-white/60 text-sm">Status</p><span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(w.status)}`}>{w.status}</span></div>
              <div><p className="text-white/60 text-sm">Requested</p><p className="font-medium">{formatDate(w.requestedAt)}</p></div>
              {w.completedAt && <div><p className="text-white/60 text-sm">Completed</p><p className="font-medium">{formatDate(w.completedAt)}</p></div>}
            </div>
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-bold mb-2">Withdrawal Destination</h3>
              {w.withdrawalDetails.walletAddress && <p><span className="text-white/60">Wallet:</span> <code className="text-sm bg-white/10 px-2 py-1 rounded">{w.withdrawalDetails.walletAddress}</code></p>}
              {w.withdrawalDetails.paypalEmail && <p><span className="text-white/60">PayPal:</span> {w.withdrawalDetails.paypalEmail}</p>}
              {w.withdrawalDetails.bankDetails && (
                <div className="space-y-1 text-sm">
                  {w.withdrawalDetails.bankDetails.bankName && <p><span className="text-white/60">Bank:</span> {w.withdrawalDetails.bankDetails.bankName}</p>}
                  {w.withdrawalDetails.bankDetails.accountName && <p><span className="text-white/60">Account Name:</span> {w.withdrawalDetails.bankDetails.accountName}</p>}
                  {w.withdrawalDetails.bankDetails.accountNumber && <p><span className="text-white/60">Account #:</span> {w.withdrawalDetails.bankDetails.accountNumber}</p>}
                  {w.withdrawalDetails.bankDetails.iban && <p><span className="text-white/60">IBAN:</span> {w.withdrawalDetails.bankDetails.iban}</p>}
                  {w.withdrawalDetails.bankDetails.swiftCode && <p><span className="text-white/60">SWIFT:</span> {w.withdrawalDetails.bankDetails.swiftCode}</p>}
                  {w.withdrawalDetails.bankDetails.ifscCode && <p><span className="text-white/60">IFSC:</span> {w.withdrawalDetails.bankDetails.ifscCode}</p>}
                  {w.withdrawalDetails.bankDetails.upiId && <p><span className="text-white/60">UPI:</span> {w.withdrawalDetails.bankDetails.upiId}</p>}
                </div>
              )}
            </div>
            {w.txReference && <div className="border-t border-white/10 pt-4"><p className="text-white/60 text-sm">Transaction Reference</p><code className="text-sm bg-white/10 px-2 py-1 rounded">{w.txReference}</code></div>}
            {w.rejectionReason && <div className="border-t border-white/10 pt-4 text-red-400"><p className="text-sm">Rejection Reason: {w.rejectionReason}</p></div>}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
          <div className="flex gap-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-sm">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-sm">
              <option value="">All Currencies</option>
              <option value="USDC">USDC</option>
              <option value="JAMZ">JAMZ</option>
              <option value="NGN">NGN</option>
              <option value="AED">AED</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6600FF]" /></div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12 text-white/60">No withdrawal requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-left text-white/60 text-sm">
                  <th className="pb-4 pr-4">User</th>
                  <th className="pb-4 pr-4">Amount</th>
                  <th className="pb-4 pr-4">Method</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4 pr-4">Requested</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 pr-4">{w.userId?.email || 'N/A'}</td>
                    <td className="py-4 pr-4 font-medium text-[#6600FF]">{formatCurrency(w.amount, w.currency)}</td>
                    <td className="py-4 pr-4 capitalize flex items-center gap-2">{getMethodIcon(w.method)} {w.method}</td>
                    <td className="py-4 pr-4"><span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(w.status)}`}>{w.status}</span></td>
                    <td className="py-4 pr-4 text-sm text-white/60">{formatDate(w.requestedAt)}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedWithdrawal(w); setShowDetails(true); }}
                          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg">View</button>
                        {w.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(w._id)} disabled={actionLoading === w._id}
                              className="px-3 py-1 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg disabled:opacity-50">
                              {actionLoading === w._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                            </button>
                            <button onClick={() => { setSelectedWithdrawal(w); setShowRejectModal(true); }}
                              className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg">Reject</button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <button onClick={() => handleProcess(w._id)} disabled={actionLoading === w._id}
                            className="px-3 py-1 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg disabled:opacity-50">
                            {actionLoading === w._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Processing'}
                          </button>
                        )}
                        {(w.status === 'approved' || w.status === 'processing') && (
                          <button onClick={() => { setSelectedWithdrawal(w); setShowCompleteModal(true); }}
                            className="px-3 py-1 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg">Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button key={i} onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                className={`px-4 py-2 rounded-lg ${pagination.page === i + 1 ? 'bg-[#6600FF]' : 'bg-white/10 hover:bg-white/20'}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDetails && <WithdrawalDetailsModal />}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-black/90 border border-white/10 rounded-xl w-full max-w-md p-6"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <h2 className="text-xl font-bold mb-4">Reject Withdrawal</h2>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..." className="w-full bg-black/50 border border-white/20 rounded-lg p-3 mb-4 h-32" />
              <div className="flex gap-4">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">Cancel</button>
                <button onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading !== null}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50">Reject & Refund</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompleteModal && (
          <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-black/90 border border-white/10 rounded-xl w-full max-w-md p-6"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <h2 className="text-xl font-bold mb-4">Complete Withdrawal</h2>
              <p className="text-white/60 mb-4">Enter the transaction reference/hash after making the payment:</p>
              <input value={txReference} onChange={(e) => setTxReference(e.target.value)}
                placeholder="Transaction reference (optional)" className="w-full bg-black/50 border border-white/20 rounded-lg p-3 mb-4" />
              <div className="flex gap-4">
                <button onClick={() => setShowCompleteModal(false)} className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">Cancel</button>
                <button onClick={handleComplete} disabled={actionLoading !== null}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg disabled:opacity-50">Mark Complete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

