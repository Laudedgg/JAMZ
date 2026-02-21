import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Edit, Trash2, ExternalLink, Users, Music, X, CheckCircle2, UserCheck, MoveVertical, Mail, MessageSquare, Gamepad2, Settings, Wallet } from 'lucide-react';
import { CampaignParticipants } from '../components/CampaignParticipants';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { formatMultipleCurrencies } from '../lib/currencyUtils';

// No unused interfaces

interface Campaign {
  _id: string;
  title: string;
  artistId: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  youtubeUrl: string;
  spotifyUrl: string;
  appleUrl: string;
  shareRewardUsd: number;
  shareRewardUsdt?: number; // For backward compatibility
  shareRewardJamz: number;
  shareRewardNgn: number;
  shareRewardAed: number;
  maxReferralRewards?: number;
  maxReferralRewardsPerUser?: number;
  totalReferralRewardsGiven?: number;
  isActive: boolean;
  description: string;
  order?: number;
}

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export const AdminNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/open-verse', label: 'Campaigns', icon: <Music className="w-5 h-5" /> },
    { path: '/admin/artists', label: 'Artists', icon: <Users className="w-5 h-5" /> },
    { path: '/admin/tracks', label: 'Tracks', icon: <Music className="w-5 h-5" /> },
    { path: '/admin/users', label: 'Users', icon: <UserCheck className="w-5 h-5" /> },
    { path: '/admin/musicsense-games', label: 'MusicSense Games', icon: <Gamepad2 className="w-5 h-5" /> },
    { path: '/admin/aaa-waitlist', label: 'AAA Waitlist', icon: <Mail className="w-5 h-5" /> },
    { path: '/admin/contact-submissions', label: 'Contact Messages', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/admin/withdrawals', label: 'Withdrawals', icon: <Wallet className="w-5 h-5" /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="mb-8 border-b border-white/10">
      <div className="flex space-x-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              location.pathname === item.path
                ? 'border-[#6600FF] text-white'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

const RewardsInput = ({
  label,
  usdt,
  jamz,
  ngn,
  aed,
  onUsdtChange,
  onJamzChange,
  onNgnChange,
  onAedChange,
  disabled = false
}: {
  label: string;
  usdt: number;
  jamz: number;
  ngn: number;
  aed: number;
  onUsdtChange: (value: number) => void;
  onJamzChange: (value: number) => void;
  onNgnChange: (value: number) => void;
  onAedChange: (value: number) => void;
  disabled?: boolean;
}) => {
  // Convert numeric values to string for input fields
  const [usdValue, setUsdValue] = useState(usdt === 0 ? '' : usdt.toString());
  const [jamzValue, setJamzValue] = useState(jamz === 0 ? '' : jamz.toString());
  const [ngnValue, setNgnValue] = useState(ngn === 0 ? '' : ngn.toString());
  const [aedValue, setAedValue] = useState(aed === 0 ? '' : aed.toString());

  // Update local state when props change
  useEffect(() => {
    setUsdValue(usdt === 0 ? '' : usdt.toString());
  }, [usdt]);

  useEffect(() => {
    setJamzValue(jamz === 0 ? '' : jamz.toString());
  }, [jamz]);

  useEffect(() => {
    setNgnValue(ngn === 0 ? '' : ngn.toString());
  }, [ngn]);

  useEffect(() => {
    setAedValue(aed === 0 ? '' : aed.toString());
  }, [aed]);

  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdValue(value);
    onUsdtChange(value === '' ? 0 : parseFloat(value) || 0);
  };

  const handleJamzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJamzValue(value);
    onJamzChange(value === '' ? 0 : parseFloat(value) || 0);
  };

  const handleNgnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNgnValue(value);
    onNgnChange(value === '' ? 0 : parseFloat(value) || 0);
  };

  const handleAedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAedValue(value);
    onAedChange(value === '' ? 0 : parseFloat(value) || 0);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <div>
        <label className="block text-xs text-white/40 mb-1">{label} USD</label>
        <input
          type="number"
          value={usdValue}
          onChange={handleUsdChange}
          className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          min="0"
          step="0.01"
          disabled={disabled}
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">{label} JAMZ</label>
        <input
          type="number"
          value={jamzValue}
          onChange={handleJamzChange}
          className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          min="0"
          step="1"
          disabled={disabled}
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">{label} NGN</label>
        <input
          type="number"
          value={ngnValue}
          onChange={handleNgnChange}
          className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          min="0"
          step="0.01"
          disabled={disabled}
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">{label} AED</label>
        <input
          type="number"
          value={aedValue}
          onChange={handleAedChange}
          className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          min="0"
          step="0.01"
          disabled={disabled}
          placeholder="0.00"
        />
      </div>
    </div>
  );
};

export function AdminDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderChanged, setReorderChanged] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchCampaigns();
    fetchArtists();
    fetchShowcases();
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

  const fetchShowcases = async () => {
    try {
      const { openVerseApi } = await import('../lib/openVerseApi');
      const data = await openVerseApi.admin.campaigns.list();
      console.log('Fetched showcases:', data);
      setShowcases(data);
    } catch (err: any) {
      console.error('Error fetching showcases:', err);
      // Don't set error for showcases as they're optional
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await api.campaigns.list();
      setCampaigns(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message || 'Failed to load campaigns');
      await handleAuthError(err);
    }
  };

  const handleSaveReorder = async () => {
    try {
      // Create array of campaign IDs and their new order
      const campaignOrders = campaigns.map((campaign, index) => ({
        _id: campaign._id,
        order: index
      }));

      // Call the API to update the order
      const updatedCampaigns = await api.campaigns.reorder(campaignOrders);
      setCampaigns(updatedCampaigns);
      showNotification('success', 'Campaign order updated successfully!');
    } catch (err: any) {
      console.error('Error reordering campaigns:', err);
      showNotification('error', 'Failed to update campaign order');
      await handleAuthError(err);
    }
  };

  interface CampaignFormProps {
    campaign: Campaign | null;
    onClose: () => void;
  }

  const CampaignForm = ({ campaign = null, onClose }: CampaignFormProps) => {
    const [formData, setFormData] = useState(() => {
      const savedData = localStorage.getItem('campaignFormData');
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
      const defaultFormData = {
        title: '',
        artistId: '',
        showcaseId: '',
        youtubeUrl: '',
        spotifyUrl: '',
        appleUrl: '',
        description: '',
        shareRewardUsd: 0,
        shareRewardJamz: 0,
        shareRewardNgn: 0,
        shareRewardAed: 0,
        maxReferralRewards: 100,
        maxReferralRewardsPerUser: 5,
        isActive: true,
      };

      if (campaign) {
        return {
          title: campaign.title,
          artistId: campaign.artistId._id,
          showcaseId: campaign.showcaseId?._id || '',
          youtubeUrl: campaign.youtubeUrl,
          spotifyUrl: campaign.spotifyUrl,
          appleUrl: campaign.appleUrl || '',
          description: campaign.description,
          shareRewardUsd: campaign.shareRewardUsd || campaign.shareRewardUsdt || 0,
          shareRewardJamz: campaign.shareRewardJamz || 0,
          shareRewardNgn: campaign.shareRewardNgn || 0,
          shareRewardAed: campaign.shareRewardAed || 0,
          maxReferralRewards: campaign.maxReferralRewards || 100,
          maxReferralRewardsPerUser: campaign.maxReferralRewardsPerUser || 5,
          isActive: campaign.isActive,
        };
      }

      return defaultFormData;
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
      localStorage.setItem('campaignFormData', JSON.stringify(formData));
    }, [formData]);

    const cleanup = () => {
      localStorage.removeItem('campaignFormData');
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFormError(null);

      try {
        if (!formData.artistId) {
          throw new Error('Please select an artist');
        }

        if (!formData.showcaseId) {
          throw new Error('Please select a showcase');
        }

        if (campaign) {
          await api.campaigns.update(campaign._id, formData);
        } else {
          await api.campaigns.create(formData);
        }

        await fetchCampaigns();
        showNotification('success', `Campaign successfully ${campaign ? 'updated' : 'created'}!`);
        cleanup();
        onClose();
      } catch (err: any) {
        console.error('Error saving campaign:', err);
        setFormError(err.message || 'Failed to save campaign');
        await handleAuthError(err);
      } finally {
        setSubmitting(false);
      }
    };

    useEffect(() => {
      return () => {
        if (submitting) {
          cleanup();
        }
      };
    }, [submitting]);

    return (
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold gradient-text">
              {campaign ? 'Edit Campaign' : 'New Campaign'}
            </h2>
            <button
              onClick={() => {
                cleanup();
                onClose();
              }}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Artist
                </label>
                <select
                  value={formData.artistId}
                  onChange={(e) => setFormData({ ...formData, artistId: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  required
                  disabled={submitting}
                >
                  <option value="">Select Artist</option>
                  {artists.map((artist) => (
                    <option key={artist._id} value={artist._id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Showcase <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.showcaseId}
                  onChange={(e) => setFormData({ ...formData, showcaseId: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  required
                  disabled={submitting}
                >
                  <option value="">Select Showcase</option>
                  {showcases.map((showcase) => (
                    <option key={showcase._id} value={showcase._id}>
                      {showcase.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://youtube.com/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Spotify URL
                </label>
                <input
                  type="url"
                  value={formData.spotifyUrl}
                  onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://open.spotify.com/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Apple Music URL
                </label>
                <input
                  type="url"
                  value={formData.appleUrl}
                  onChange={(e) => setFormData({ ...formData, appleUrl: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://music.apple.com/..."
                  disabled={submitting}
                />
              </div>
            </div>



            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold mb-3">Share & Earn Rewards</h3>
              <RewardsInput
                label="Share"
                usdt={formData.shareRewardUsd}
                jamz={formData.shareRewardJamz}
                ngn={formData.shareRewardNgn}
                aed={formData.shareRewardAed}
                onUsdtChange={(value) => setFormData({ ...formData, shareRewardUsd: value })}
                onJamzChange={(value) => setFormData({ ...formData, shareRewardJamz: value })}
                onNgnChange={(value) => setFormData({ ...formData, shareRewardNgn: value })}
                onAedChange={(value) => setFormData({ ...formData, shareRewardAed: value })}
                disabled={submitting}
              />

              {/* Referral Limits */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Max Total Referral Rewards
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxReferralRewards}
                    onChange={(e) => setFormData({ ...formData, maxReferralRewards: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                    disabled={submitting}
                    placeholder="e.g., 100"
                  />
                  <p className="text-xs text-white/40 mt-1">Total referral rewards for this campaign</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Max Rewards Per User
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxReferralRewardsPerUser}
                    onChange={(e) => setFormData({ ...formData, maxReferralRewardsPerUser: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                    disabled={submitting}
                    placeholder="e.g., 5"
                  />
                  <p className="text-xs text-white/40 mt-1">Max referral rewards each user can earn</p>
                </div>
              </div>
            </div>



            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only"
                  disabled={submitting}
                />
                <div className={`w-8 h-5 rounded-full transition-colors ${
                  formData.isActive ? 'bg-[#6600FF]' : 'bg-gray-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${
                    formData.isActive ? 'translate-x-4' : 'translate-x-1'
                  }`} />
                </div>
                <span className="ml-2 text-xs text-white/60">Active Campaign</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    cleanup();
                    onClose();
                  }}
                  className="px-3 py-1 text-sm glass-button"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm glass-button-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : campaign ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const formatRewards = (campaign: Campaign) => {
    const challengeRewards = {
      USD: campaign.challengeRewardUsd || campaign.challengeRewardUsdt || 0,
      JAMZ: campaign.challengeRewardJamz || 0,
      NGN: campaign.challengeRewardNgn || 0,
      AED: campaign.challengeRewardAed || 0
    };

    const shareRewards = {
      USD: campaign.shareRewardUsd || campaign.shareRewardUsdt || 0,
      JAMZ: campaign.shareRewardJamz || 0,
      NGN: campaign.shareRewardNgn || 0,
      AED: campaign.shareRewardAed || 0
    };

    return {
      challenge: formatMultipleCurrencies(challengeRewards),
      share: formatMultipleCurrencies(shareRewards)
    };
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
            <p className="text-white/60 mb-8">Please log in as an admin to manage campaigns.</p>
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
          <h1 className="text-3xl font-bold gradient-text">Campaign Management</h1>
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
              {isReordering ? "Save Order" : "Reorder Campaigns"}
            </button>
            {!isReordering && (
              <button
                onClick={() => setShowForm(true)}
                className="glass-button-primary"
              >
                <Plus className="w-5 h-5" />
                New Campaign
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
            values={campaigns}
            onReorder={(newOrder) => {
              setCampaigns(newOrder.map((campaign, index) => ({
                ...campaign,
                order: index
              })));
              setReorderChanged(true);
            }}
            className="space-y-4"
          >
            {campaigns.map((campaign) => (
              <Reorder.Item
                key={campaign._id}
                value={campaign}
                className="glass-card p-4 cursor-move"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold">{campaign.title}</h3>
                    {campaign.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs bg-[#6600FF]/20 text-[#6600FF]">
                        Active
                      </span>
                    )}
                  </div>
                  <MoveVertical className="w-5 h-5 text-white/40" />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map((campaign) => (
            <motion.div
              key={campaign._id}
              className="glass-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold">{campaign.title}</h3>
                  {campaign.isActive && (
                    <span className="px-2 py-1 rounded-full text-xs bg-[#6600FF]/20 text-[#6600FF]">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentCampaign(campaign);
                      setShowForm(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this campaign?')) {
                        try {
                          await api.campaigns.delete(campaign._id);
                          await fetchCampaigns();
                          showNotification('success', 'Campaign successfully deleted!');
                        } catch (err: any) {
                          console.error('Error deleting campaign:', err);
                          showNotification('error', err.message || 'Failed to delete campaign');
                          await handleAuthError(err);
                        }
                      }
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <h4 className="text-xs font-medium text-white/60">Artist</h4>
                  <p className="text-sm mt-0.5">{campaign.artistId?.name}</p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-white/60">Challenge Rewards</h4>
                  <p className="text-sm mt-0.5">
                    {formatRewards(campaign).challenge}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-white/60">Share & Earn</h4>
                  <p className="text-sm mt-0.5">
                    {formatRewards(campaign).share}
                  </p>
                  {campaign.maxReferralRewards && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Referrals: {campaign.totalReferralRewardsGiven || 0}/{campaign.maxReferralRewards}
                      (Max {campaign.maxReferralRewardsPerUser || 5}/user)
                    </p>
                  )}
                </div>

              <div>
                <h4 className="text-xs font-medium text-white/60">Actions</h4>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingParticipants(campaign._id);
                    }}
                    className="flex items-center gap-1 text-xs glass-button-small"
                    title="View Participants"
                  >
                    <UserCheck className="w-3 h-3" />
                    Participants
                  </button>

                  {campaign.youtubeUrl && (
                    <a
                      href={campaign.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF0000] hover:text-[#FF0000]/80 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {campaign.spotifyUrl && (
                    <a
                      href={campaign.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1DB954] hover:text-[#1DB954]/80 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      {showForm && (
        <CampaignForm
          campaign={currentCampaign}
          onClose={() => {
            setShowForm(false);
            setCurrentCampaign(null);
          }}
        />
      )}

      {viewingParticipants && (() => {
        console.log("Opening CampaignParticipants with ID:", viewingParticipants);
        return (
          <CampaignParticipants
            campaignId={viewingParticipants}
            onClose={() => setViewingParticipants(null)}
          />
        );
      })()}
    </div>
  );
}
