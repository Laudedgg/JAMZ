import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle2, X, ArrowUp, ArrowDown, MoveVertical, Key, Mail, Lock, RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { ArtistPasswordReset } from '../components/ArtistPasswordReset';

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
  order?: number;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface ArtistFormProps {
  artist: Artist | null;
  onClose: () => void;
}

export function ArtistsManagement() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderChanged, setReorderChanged] = useState(false);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [selectedArtistForCredentials, setSelectedArtistForCredentials] = useState<Artist | null>(null);
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [selectedArtistForPasswordReset, setSelectedArtistForPasswordReset] = useState<Artist | null>(null);
  const [showWalletTopup, setShowWalletTopup] = useState(false);
  const [selectedArtistForWallet, setSelectedArtistForWallet] = useState<Artist | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchArtists();
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

  const fetchArtists = async () => {
    try {
      const data = await api.artists.list();
      setArtists(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching artists:', err);
      setError(err.message || 'Failed to load artists');
      await handleAuthError(err);
    }
  };

  const handleSaveReorder = async () => {
    try {
      // Create array of artist IDs and their new order
      const artistOrders = artists.map((artist, index) => ({
        _id: artist._id,
        order: index
      }));

      // Call the API to update the order
      const updatedArtists = await api.artists.reorder(artistOrders);
      setArtists(updatedArtists);
      showNotification('success', 'Artist order updated successfully!');
    } catch (err: any) {
      console.error('Error reordering artists:', err);
      showNotification('error', 'Failed to update artist order');
      await handleAuthError(err);
    }
  };

  const ArtistForm = ({ artist = null, onClose }: ArtistFormProps) => {
    const [formData, setFormData] = useState({
      name: artist?.name || '',
      imageUrl: artist?.imageUrl || '',
      socialMedia: {
        instagram: artist?.socialMedia?.instagram || '',
        tiktok: artist?.socialMedia?.tiktok || '',
        twitter: artist?.socialMedia?.twitter || '',
        facebook: artist?.socialMedia?.facebook || ''
      }
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFormError(null);

      try {
        if (artist) {
          await api.artists.update(artist._id, formData);
        } else {
          await api.artists.create(formData);
        }

        await fetchArtists();
        showNotification('success', `Artist successfully ${artist ? 'updated' : 'created'}!`);
        onClose();
      } catch (err: any) {
        console.error('Error saving artist:', err);
        setFormError(err.message || 'Failed to save artist');
        await handleAuthError(err);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-lg w-full p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold gradient-text">
              {artist ? 'Edit Artist' : 'New Artist'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Artist Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                placeholder="https://example.com/image.jpg"
                disabled={submitting}
              />
            </div>

            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                  }}
                />
              </div>
            )}

            {/* Social Media Section */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Social Media Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Instagram Username
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    placeholder="@username"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    TikTok Username
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.tiktok}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, tiktok: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    placeholder="@username"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    X (Twitter) Username
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    placeholder="@username"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Facebook Page/Username
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    placeholder="username or page name"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="glass-button"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-button-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : artist ? 'Update Artist' : 'Create Artist'}
              </button>
            </div>
          </form>
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
            <p className="text-white/60 mb-8">Please log in as an admin to manage artists.</p>
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
    <div className="min-h-screen bg-black py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Artists Management</h1>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsReordering(!isReordering);
                if (isReordering && reorderChanged) {
                  // Save the new order
                  handleSaveReorder();
                  setReorderChanged(false);
                }
              }}
              className={isReordering ? "glass-button" : "glass-button-primary"}
            >
              <MoveVertical className="w-5 h-5" />
              {isReordering ? "Save Order" : "Reorder Artists"}
            </button>
            {!isReordering && (
              <button
                onClick={() => setShowForm(true)}
                className="glass-button-primary"
              >
                <Plus className="w-5 h-5" />
                New Artist
              </button>
            )}
          </div>
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
              className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg flex items-center gap-2 ${
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

        {isReordering ? (
          <Reorder.Group
            axis="y"
            values={artists}
            onReorder={(newOrder) => {
              setArtists(newOrder.map((artist, index) => ({
                ...artist,
                order: index
              })));
              setReorderChanged(true);
            }}
            className="space-y-4"
          >
            {artists.map((artist) => (
              <Reorder.Item
                key={artist._id}
                value={artist}
                className="glass-card p-6 cursor-move"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={artist.imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                    <h3 className="text-xl font-bold">{artist.name}</h3>
                  </div>
                  <MoveVertical className="w-5 h-5 text-white/40" />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artists.map((artist) => (
              <motion.div
                key={artist._id}
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={artist.imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
                  alt={artist.name}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
                <h3 className="text-xl font-bold">{artist.name}</h3>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCurrentArtist(artist);
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit Artist"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedArtistForCredentials(artist);
                    setShowCredentialsForm(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Create Login Credentials"
                >
                  <Key className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedArtistForPasswordReset(artist);
                    setShowPasswordResetForm(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset Password"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedArtistForWallet(artist);
                    setShowWalletTopup(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-green-500"
                  title="Top Up Wallet"
                >
                  <Wallet className="w-5 h-5" />
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this artist?')) {
                      try {
                        await api.artists.delete(artist._id);
                        await fetchArtists();
                        showNotification('success', 'Artist successfully deleted!');
                      } catch (err: any) {
                        console.error('Error deleting artist:', err);
                        showNotification('error', 'Failed to delete artist');
                        await handleAuthError(err);
                      }
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-500"
                  title="Delete Artist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>

      {showForm && (
        <ArtistForm
          artist={currentArtist}
          onClose={() => {
            setShowForm(false);
            setCurrentArtist(null);
          }}
        />
      )}

      {showCredentialsForm && (
        <ArtistCredentialsForm
          artist={selectedArtistForCredentials}
          onClose={() => {
            setShowCredentialsForm(false);
            setSelectedArtistForCredentials(null);
          }}
        />
      )}

      {showPasswordResetForm && (
        <ArtistPasswordReset
          artist={selectedArtistForPasswordReset}
          onClose={() => {
            setShowPasswordResetForm(false);
            setSelectedArtistForPasswordReset(null);
          }}
        />
      )}

      {showWalletTopup && (
        <WalletTopupForm
          artist={selectedArtistForWallet}
          onClose={() => {
            setShowWalletTopup(false);
            setSelectedArtistForWallet(null);
          }}
          onSuccess={() => {
            showNotification('success', 'Wallet topped up successfully!');
          }}
        />
      )}
    </div>
  );
}

interface ArtistCredentialsFormProps {
  artist: Artist | null;
  onClose: () => void;
}

function ArtistCredentialsForm({ artist, onClose }: ArtistCredentialsFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!artist) {
      setFormError('No artist selected');
      return;
    }

    if (!email || !password || !confirmPassword) {
      setFormError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await api.artistAuth.register(email, password, artist._id);

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error creating artist credentials:', err);
      setFormError(err.message || 'Failed to create artist credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-lg w-full p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">
            {success ? 'Success!' : `Create Login for ${artist?.name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {formError}
          </div>
        )}

        {success ? (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span>Artist login credentials created successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="artist@example.com"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="glass-button"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-button-primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Login'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

interface WalletTopupFormProps {
  artist: Artist | null;
  onClose: () => void;
  onSuccess: () => void;
}

function WalletTopupForm({ artist, onClose, onSuccess }: WalletTopupFormProps) {
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    if (artist) {
      fetchWalletData();
    }
  }, [artist]);

  const fetchWalletData = async () => {
    if (!artist) return;
    try {
      setLoadingWallet(true);
      const data = await api.artistWallet.adminGetWallet(artist._id);
      setWalletData(data);
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      // Wallet might not exist yet, that's ok
      setWalletData(null);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!artist) {
      setFormError('No artist selected');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await api.artistWallet.adminAddDeposit({
        artistId: artist._id,
        currency,
        amount: amountNum,
        reference: reference || undefined
      });

      setSuccess(true);
      onSuccess();

      // Refresh wallet data
      await fetchWalletData();

      // Reset form
      setAmount('');
      setReference('');

      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error topping up wallet:', err);
      setFormError(err.message || 'Failed to top up wallet');
    } finally {
      setSubmitting(false);
    }
  };

  const currencies = [
    { value: 'USDT', label: 'USDT', color: 'text-green-400' },
    { value: 'NGN', label: 'NGN (₦)', color: 'text-blue-400' },
    { value: 'AED', label: 'AED (د.إ)', color: 'text-yellow-400' },
    { value: 'INR', label: 'INR (₹)', color: 'text-orange-400' },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-lg w-full p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">
            Top Up Wallet: {artist?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Balance Display */}
        {loadingWallet ? (
          <div className="mb-6 p-4 rounded-lg bg-black/30 border border-white/10">
            <p className="text-white/60 text-center">Loading wallet...</p>
          </div>
        ) : walletData ? (
          <div className="mb-6 p-4 rounded-lg bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white/60 mb-2">Current Balances</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-green-400">USDT:</span>
                <span className="text-white font-medium">${walletData.balances?.usdt?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">NGN:</span>
                <span className="text-white font-medium">₦{walletData.balances?.ngn?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">AED:</span>
                <span className="text-white font-medium">د.إ{walletData.balances?.aed?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-400">INR:</span>
                <span className="text-white font-medium">₹{walletData.balances?.inr?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-500 text-sm">No wallet found. A deposit will create one.</p>
          </div>
        )}

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {formError}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span>Deposit added successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Currency
              </label>
              <div className="grid grid-cols-4 gap-2">
                {currencies.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCurrency(c.value)}
                    className={`py-2 px-3 rounded-lg border transition-colors ${
                      currency === c.value
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-black/30 border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <span className={currency === c.value ? c.color : ''}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-white/40" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter amount"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Reference (optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Bank transfer, Promo credit, etc."
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="glass-button"
              disabled={submitting}
            >
              Close
            </button>
            <button
              type="submit"
              className="glass-button-primary flex items-center gap-2"
              disabled={submitting || !amount}
            >
              {submitting ? (
                'Processing...'
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Add Deposit
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
