import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, User, Wallet, Clock, ExternalLink, Shield, Mail, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { AdminNav } from './AdminDashboard';

interface UserWallet {
  usdtBalance: number;
  jamzBalance: number;
  usdtAddress: string | null;
  jamzAddress: string | null;
  paypalEmail: string | null;
  transactions: any[];
}

interface UserData {
  _id: string;
  email: string;
  username?: string;
  walletAddress?: string;
  authProvider?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  wallet: UserWallet;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, isAdmin, navigate]);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.list();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
      await handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAuthProviderIcon = (provider?: string) => {
    if (!provider || provider === 'email') return <Mail className="w-4 h-4" />;
    
    switch (provider) {
      case 'google':
        return <span className="text-xs">G</span>;
      case 'facebook':
        return <span className="text-xs">F</span>;
      case 'twitter':
      case 'x':
        return <span className="text-xs">X</span>;
      case 'github':
        return <span className="text-xs">GH</span>;
      case 'discord':
        return <span className="text-xs">D</span>;
      case 'apple':
        return <span className="text-xs">A</span>;
      case 'farcaster':
        return <span className="text-xs">FC</span>;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-black/80 border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-white/10 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">User Details</h2>
            <button
              onClick={() => setShowUserDetails(false)}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#6600FF]" />
                User Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                
                <div>
                  <p className="text-white/60 text-sm">Username</p>
                  <p className="font-medium">{selectedUser.username || 'Not set'}</p>
                </div>
                
                <div>
                  <p className="text-white/60 text-sm">Auth Provider</p>
                  <p className="font-medium flex items-center gap-1">
                    {getAuthProviderIcon(selectedUser.authProvider)}
                    {selectedUser.authProvider || 'Email'}
                  </p>
                </div>
                
                <div>
                  <p className="text-white/60 text-sm">Admin Status</p>
                  <p className="font-medium flex items-center gap-1">
                    {selectedUser.isAdmin ? (
                      <>
                        <Shield className="w-4 h-4 text-[#6600FF]" />
                        Admin
                      </>
                    ) : (
                      'Regular User'
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-white/60 text-sm">Created At</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                
                <div>
                  <p className="text-white/60 text-sm">Last Updated</p>
                  <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
                </div>
                
                {selectedUser.walletAddress && (
                  <div className="col-span-2">
                    <p className="text-white/60 text-sm">Wallet Address</p>
                    <p className="font-medium font-mono text-sm break-all">{selectedUser.walletAddress}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Wallet Info */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#6600FF]" />
                Wallet Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">USDT Balance</p>
                  <p className="font-medium text-yellow-400">${selectedUser.wallet?.usdtBalance.toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-white/60 text-sm">JAMZ Balance</p>
                  <p className="font-medium text-purple-400">{selectedUser.wallet?.jamzBalance.toFixed(2)} JAMZ</p>
                </div>
                
                {selectedUser.wallet?.usdtAddress && (
                  <div className="col-span-2">
                    <p className="text-white/60 text-sm">USDT Address</p>
                    <p className="font-medium font-mono text-sm break-all">{selectedUser.wallet.usdtAddress}</p>
                  </div>
                )}
                
                {selectedUser.wallet?.jamzAddress && (
                  <div className="col-span-2">
                    <p className="text-white/60 text-sm">JAMZ Address</p>
                    <p className="font-medium font-mono text-sm break-all">{selectedUser.wallet.jamzAddress}</p>
                  </div>
                )}
                
                {selectedUser.wallet?.paypalEmail && (
                  <div className="col-span-2">
                    <p className="text-white/60 text-sm">PayPal Email</p>
                    <p className="font-medium">{selectedUser.wallet.paypalEmail}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Transactions */}
            {selectedUser.wallet?.transactions && selectedUser.wallet.transactions.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#6600FF]" />
                  Transaction History
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-2 text-white/60 text-sm">Type</th>
                        <th className="text-left p-2 text-white/60 text-sm">Token</th>
                        <th className="text-left p-2 text-white/60 text-sm">Amount</th>
                        <th className="text-left p-2 text-white/60 text-sm">Status</th>
                        <th className="text-left p-2 text-white/60 text-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.wallet.transactions.map((tx, index) => (
                        <tr key={index} className="border-b border-white/5">
                          <td className="p-2 capitalize">{tx.type}</td>
                          <td className="p-2">{tx.token}</td>
                          <td className="p-2">
                            {tx.token === 'USDT' ? '$' : ''}{tx.amount}
                            {tx.token === 'JAMZ' ? ' JAMZ' : ''}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-2 text-sm">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
            <p className="text-white/60 mb-8">Please log in as an admin to manage users.</p>
            <button
              onClick={() => navigate('/admin/login')}
              className="glass-button-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminNav />

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">User Management</h1>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60">User</th>
                  <th className="text-left p-4 text-white/60">Auth</th>
                  <th className="text-left p-4 text-white/60">USDT Balance</th>
                  <th className="text-left p-4 text-white/60">JAMZ Balance</th>
                  <th className="text-left p-4 text-white/60">Created</th>
                  <th className="text-left p-4 text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username || 'No Username'}</span>
                        <span className="text-white/60 text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.isAdmin && <Shield className="w-4 h-4 text-[#6600FF]" />}
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10">
                          {getAuthProviderIcon(user.authProvider)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-yellow-400">${user.wallet?.usdtBalance.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-purple-400">{user.wallet?.jamzBalance.toFixed(2)} JAMZ</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                        className="glass-button-secondary text-xs py-1 px-2"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUserDetails && <UserDetailsModal />}
      </AnimatePresence>
    </div>
  );
}
