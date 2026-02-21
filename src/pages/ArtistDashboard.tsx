import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Music, LogOut, BarChart2, Users, Clock, CheckCircle, XCircle, AlertTriangle, Settings, Lock, Wallet, Plus, DollarSign, CreditCard, TrendingUp, User, Eye, UserCheck, Instagram, Twitter, Facebook, ArrowDownUp, Zap, Award, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useArtistAuthStore } from '../lib/artistAuth';
import { ArtistPasswordChange } from '../components/ArtistPasswordChange';
import { ArtistCampaignForm } from '../components/ArtistCampaignForm';
import { ArtistProfile } from '../components/ArtistProfile';
import { AnimatePresence } from 'framer-motion';
import FundingModal from '../components/payment/FundingModal';
import { ArtistSwapInterface } from '../components/ArtistSwapInterface';

interface Campaign {
  _id: string;
  title: string;
  artistId: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  youtubeUrl: string;
  isActive: boolean;
  challengeRewardUsdt: number;
  challengeRewardJamz: number;
  shareRewardUsdt: number;
  shareRewardJamz: number;
}

interface CampaignStats {
  totalChallenges: number;
  pendingChallenges: number;
  approvedChallenges: number;
  rejectedChallenges: number;
  rewardsDistributed: {
    usdt: number;
    jamz: number;
  };
}

interface WalletData {
  balances: {
    usdt: number;
    ngn: number;
    aed: number;
    inr?: number;
    totalUSD: number;
  };
  fundingMethods: any;
  campaignPricing: any;
  settings: any;
}

interface MyCampaign {
  id: string;
  title: string;
  description: string;
  prizePool: {
    amount: number;
    currency: string;
  };
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export function ArtistDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [myCampaigns, setMyCampaigns] = useState<MyCampaign[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'my-campaigns' | 'wallet' | 'swap' | 'profile' | 'kickstarter'>('overview');

  const navigate = useNavigate();
  const { isAuthenticated, artist, logout, updateArtist } = useArtistAuthStore();

  // Fetch artist profile to ensure we have latest data (including social media)
  const fetchArtistProfile = async () => {
    try {
      const profile = await api.artistAuth.getProfile();
      updateArtist({
        name: profile.name,
        imageUrl: profile.imageUrl,
        email: profile.email,
        socialMedia: profile.socialMedia
      });
    } catch (err: any) {
      console.error('Error fetching artist profile:', err);
      if (err.message === 'Invalid token' || err.message === 'No token provided') {
        setError('Session expired. Redirecting to login...');
        logout();
        setTimeout(() => navigate('/artist/login'), 1500);
      }
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/artist/login');
      return;
    }

    fetchArtistProfile();
    fetchCampaigns();
    fetchWalletData();
    fetchMyCampaigns();
  }, [isAuthenticated, navigate]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the artist token from storage to check if it's valid
      const artistTokenStorage = localStorage.getItem('artist-auth-storage');
      if (!artistTokenStorage) {
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const parsedStorage = JSON.parse(artistTokenStorage);
        if (!parsedStorage.state || !parsedStorage.state.token) {
          setError('Authentication error. Please log in again.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing artist token:', e);
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }

      const campaignsData = await api.artistCampaigns.list();
      setCampaigns(campaignsData);

      // Fetch stats for each campaign
      const statsPromises = campaignsData.map(campaign =>
        api.artistCampaigns.getStats(campaign._id)
          .then(stats => ({ campaignId: campaign._id, stats }))
          .catch(err => {
            console.error(`Error fetching stats for campaign ${campaign._id}:`, err);
            return {
              campaignId: campaign._id,
              stats: {
                totalChallenges: 0,
                pendingChallenges: 0,
                approvedChallenges: 0,
                rejectedChallenges: 0,
                rewardsDistributed: { usdt: 0, jamz: 0 }
              }
            };
          })
      );

      const statsResults = await Promise.all(statsPromises);

      // Convert to record object
      const statsRecord: Record<string, CampaignStats> = {};
      statsResults.forEach(result => {
        statsRecord[result.campaignId] = result.stats;
      });

      setCampaignStats(statsRecord);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      if (err.message === 'Access denied. Artist only.' || err.message === 'Invalid token' || err.message === 'No token provided') {
        // Authentication error - clear storage and redirect to login
        setError('Session expired. Redirecting to login...');
        logout();
        setTimeout(() => navigate('/artist/login'), 1500);
      } else {
        setError(err.message || 'Failed to load campaigns');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      console.log('🔄 Fetching wallet data...');
      const wallet = await api.artistWallet.getWallet();
      console.log('✅ Wallet data received:', wallet);
      setWalletData(wallet);
    } catch (err: any) {
      console.error('❌ Error fetching wallet:', err);
      // Don't set error for wallet - it's not critical for dashboard
    }
  };

  const fetchMyCampaigns = async () => {
    try {
      const campaigns = await api.artistCampaigns.getMyCampaigns();
      setMyCampaigns(campaigns);
    } catch (err: any) {
      console.error('Error fetching my campaigns:', err);
      // Don't set error for my campaigns - it's not critical for dashboard
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/artist/login');
  };

  const handleCampaignCreated = () => {
    // Refresh data after campaign creation
    fetchCampaigns();
    fetchMyCampaigns();
    fetchWalletData();
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {/* Use artist profile image instead of generic music icon */}
                  {artist?.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name || 'Artist'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-500"
                      onError={(e) => {
                        // Fallback to gradient icon if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center ${artist?.imageUrl ? 'hidden' : ''}`}>
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <span className="ml-2 text-white font-bold hover:text-purple-400 transition-colors">Artist Dashboard</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              {artist && (
                <div className="flex items-center mr-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center hover:bg-white/5 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                    title="View Profile"
                  >
                    <span className="text-white/60 font-medium">Hi</span>
                    <span className="text-white font-medium ml-1">{artist.name}</span>
                  </button>

                  {/* Social Media Icons */}
                  {artist.socialMedia && (
                    <div className="flex items-center ml-3 gap-2">
                      {artist.socialMedia.instagram && (
                        <a
                          href={artist.socialMedia.instagram.startsWith('http') ? artist.socialMedia.instagram : `https://instagram.com/${artist.socialMedia.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-pink-400 transition-colors"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {artist.socialMedia.twitter && (
                        <a
                          href={artist.socialMedia.twitter.startsWith('http') ? artist.socialMedia.twitter : `https://twitter.com/${artist.socialMedia.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-blue-400 transition-colors"
                          title="Twitter/X"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {artist.socialMedia.tiktok && (
                        <a
                          href={artist.socialMedia.tiktok.startsWith('http') ? artist.socialMedia.tiktok : `https://tiktok.com/@${artist.socialMedia.tiktok}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-white transition-colors"
                          title="TikTok"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                          </svg>
                        </a>
                      )}
                      {artist.socialMedia.facebook && (
                        <a
                          href={artist.socialMedia.facebook.startsWith('http') ? artist.socialMedia.facebook : `https://facebook.com/${artist.socialMedia.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-blue-500 transition-colors"
                          title="Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center text-white/60 hover:text-white transition-colors"
                  title="Change Password"
                >
                  <Lock className="w-5 h-5" />
                  <span className="ml-1 text-sm">Change Password</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-white/60 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="ml-1 text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="glass-card p-6 bg-gradient-to-r from-purple-900/30 via-black to-pink-900/20 border border-purple-500/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Artist welcome & status */}
                <div className="flex items-center gap-4">
                  {artist?.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name || 'Artist'}
                      className="w-16 h-16 rounded-full object-cover border-3 border-purple-500/50"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      Welcome back, <span className="gradient-text inline">{artist?.name || 'Artist'}</span>
                    </h1>
                    <p className="text-white/60 mt-1">Here's your campaign performance overview</p>
                  </div>
                </div>

                {/* Right: Quick wallet balance */}
                {walletData && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-white/60">Wallet Balance</div>
                      <div className="text-2xl font-bold text-green-400">${(walletData.balances.totalUSD || 0).toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                      title="View Wallet"
                    >
                      <Wallet className="w-5 h-5 text-purple-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-lg">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart2 },
                { id: 'campaigns', label: 'Assigned Campaigns', icon: Music },
                { id: 'my-campaigns', label: 'My Campaigns', icon: Users },
                { id: 'kickstarter', label: 'Kickstarter', icon: Sparkles },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
                { id: 'swap', label: 'Swap', icon: ArrowDownUp },
                { id: 'profile', label: 'Profile', icon: User }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Quick Actions - Prominent at top */}
              <div className="glass-card p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Quick Actions
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCampaignForm(true);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-600/30 to-purple-800/20 hover:from-purple-600/40 hover:to-purple-800/30 rounded-xl transition-all border border-purple-500/20 hover:border-purple-500/40 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium">Create Campaign</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-600/30 to-blue-800/20 hover:from-blue-600/40 hover:to-blue-800/30 rounded-xl transition-all border border-blue-500/20 hover:border-blue-500/40 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium">Fund Wallet</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-600/30 to-green-800/20 hover:from-green-600/40 hover:to-green-800/30 rounded-xl transition-all border border-green-500/20 hover:border-green-500/40 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <span className="text-sm font-medium">View Campaigns</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('my-campaigns')}
                    className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-600/30 to-pink-800/20 hover:from-pink-600/40 hover:to-pink-800/30 rounded-xl transition-all border border-pink-500/20 hover:border-pink-500/40 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-pink-600/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Music className="w-6 h-6 text-pink-400" />
                    </div>
                    <span className="text-sm font-medium">My Campaigns</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-5 border border-white/5 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-sm text-white/60">Assigned</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{campaigns.length}</div>
                  <p className="text-xs text-white/40 mt-1">Active campaigns</p>
                </div>

                <div className="glass-card p-5 border border-white/5 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-white/60">Created</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{myCampaigns.length}</div>
                  <p className="text-xs text-white/40 mt-1">My campaigns</p>
                </div>

                <div className="glass-card p-5 border border-white/5 hover:border-green-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-sm text-white/60">Balance</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${(walletData?.balances.totalUSD || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-white/40 mt-1">Total USD</p>
                </div>

                <div className="glass-card p-5 border border-white/5 hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-sm text-white/60">Rewards</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {Object.values(campaignStats).reduce((sum, s) => sum + (s.rewardsDistributed?.usdt || 0), 0).toFixed(0)}
                  </div>
                  <p className="text-xs text-white/40 mt-1">USDT distributed</p>
                </div>
              </div>

              {/* Wallet Currencies Breakdown */}
              {walletData && (
                <div className="glass-card p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-purple-400" />
                      Wallet Breakdown
                    </h3>
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      Manage <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <div className="text-xl font-bold text-green-400">${(walletData.balances.usdt || 0).toFixed(2)}</div>
                      <div className="text-xs text-white/60 mt-1">USDT</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <div className="text-xl font-bold text-blue-400">₦{(walletData.balances.ngn || 0).toFixed(2)}</div>
                      <div className="text-xs text-white/60 mt-1">NGN</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <div className="text-xl font-bold text-yellow-400">{(walletData.balances.aed || 0).toFixed(2)}</div>
                      <div className="text-xs text-white/60 mt-1">AED</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 text-center">
                      <div className="text-xl font-bold text-indigo-400">₹{(walletData.balances.inr || 0).toFixed(2)}</div>
                      <div className="text-xs text-white/60 mt-1">INR</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'campaigns' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Music className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">No Campaigns Found</h2>
                  <p className="text-white/60 mb-6">You don't have any campaigns assigned to you yet.</p>
                  <p className="text-white/60">Contact the admin to create campaigns for your artist profile.</p>
                </div>
              ) : (
            <div className="space-y-8">
              {campaigns.map((campaign) => {
                const stats = campaignStats[campaign._id] || {
                  totalChallenges: 0,
                  pendingChallenges: 0,
                  approvedChallenges: 0,
                  rejectedChallenges: 0,
                  rewardsDistributed: { usdt: 0, jamz: 0 }
                };

                return (
                  <motion.div
                    key={campaign._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center">
                          <img
                            src={campaign.artistId?.imageUrl || 'https://via.placeholder.com/48?text=A'}
                            alt={campaign.artistId?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="ml-4">
                            <h2 className="text-xl font-bold">{campaign.title}</h2>
                            <p className="text-white/60">{campaign.artistId?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {campaign.isActive ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                              Inactive
                            </span>
                          )}

                          <Link
                            to={`/artist/campaigns/${campaign._id}`}
                            className="ml-4 glass-button-primary"
                          >
                            Manage Campaign
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-card p-4 bg-black/30">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-white/60">Total Challenges</h3>
                            <Users className="w-5 h-5 text-white/40" />
                          </div>
                          <p className="text-2xl font-bold">{stats.totalChallenges}</p>
                        </div>

                        <div className="glass-card p-4 bg-black/30">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-white/60">Pending</h3>
                            <Clock className="w-5 h-5 text-yellow-400" />
                          </div>
                          <p className="text-2xl font-bold text-yellow-400">{stats.pendingChallenges}</p>
                        </div>

                        <div className="glass-card p-4 bg-black/30">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-white/60">Approved</h3>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                          <p className="text-2xl font-bold text-green-400">{stats.approvedChallenges}</p>
                        </div>

                        <div className="glass-card p-4 bg-black/30">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-white/60">Rejected</h3>
                            <XCircle className="w-5 h-5 text-red-400" />
                          </div>
                          <p className="text-2xl font-bold text-red-400">{stats.rejectedChallenges}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-white/60 mb-1">Total Rewards Distributed</h3>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <span className="text-xl font-bold text-yellow-400">${stats.rewardsDistributed.usdc.toFixed(2)}</span>
                                <span className="ml-1 text-white/60">USDC</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xl font-bold text-purple-400">{stats.rewardsDistributed.jamz.toFixed(2)}</span>
                                <span className="ml-1 text-white/60">JAMZ</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-white/60 mb-1">Challenge Reward</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-yellow-400">${campaign.challengeRewardUsdt.toFixed(2)}</span>
                                <span className="text-xs text-white/60">+</span>
                                <span className="text-sm font-bold text-purple-400">{campaign.challengeRewardJamz.toFixed(2)} JAMZ</span>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-white/60 mb-1">Share Reward</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-yellow-400">${campaign.shareRewardUsdt.toFixed(2)}</span>
                                <span className="text-xs text-white/60">+</span>
                                <span className="text-sm font-bold text-purple-400">{campaign.shareRewardJamz.toFixed(2)} JAMZ</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
              )}
            </motion.div>
          )}

          {activeTab === 'my-campaigns' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Campaigns</h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCampaignForm(true);
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </button>
              </div>

              {myCampaigns.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Campaigns Created</h3>
                  <p className="text-white/60 mb-6">You haven't created any campaigns yet.</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCampaignForm(true);
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    Create Your First Campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myCampaigns.map((campaign) => (
                    <div key={campaign.id} className="glass-card p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                          <p className="text-white/60 mb-2">{campaign.description}</p>
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <span>Prize Pool: {campaign.prizePool.amount} {campaign.prizePool.currency}</span>
                            <span>Participants: {campaign.currentParticipants}/{campaign.maxParticipants}</span>
                            <span>Status: {campaign.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : campaign.status === 'paused'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-white/60 mb-4">
                        <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                        <span>Ends: {new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          to={`/artist/campaign-management/${campaign.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          Manage Campaign
                        </Link>
                        <Link
                          to={`/open-verse/${campaign.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View Public Page
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h2 className="text-2xl font-bold mb-6">Wallet Balance</h2>
                  {walletData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <div className="text-3xl font-bold text-green-400 mb-2">${(walletData.balances.usdt || 0).toFixed(2)}</div>
                        <div className="text-white/60">USD</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                        <div className="text-3xl font-bold text-blue-400 mb-2">₦{(walletData.balances.ngn || 0).toFixed(2)}</div>
                        <div className="text-white/60">Nigerian Naira</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-400 mb-2">{(walletData.balances.aed || 0).toFixed(2)} AED</div>
                        <div className="text-white/60">UAE Dirham</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-500/10 rounded-lg">
                        <div className="text-3xl font-bold text-indigo-400 mb-2">₹{(walletData.balances.inr || 0).toFixed(2)}</div>
                        <div className="text-white/60">Indian Rupee</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                        <div className="text-3xl font-bold text-purple-400 mb-2">${(walletData.balances.totalUSD || 0).toFixed(2)}</div>
                        <div className="text-white/60">Total USD</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-white/60 mt-4">Loading wallet data...</p>
                    </div>
                  )}
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4">Funding Methods</h3>
                  {!walletData ? (
                    <div className="text-center py-8">
                      <p className="text-white/60">Loading funding methods...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* USDC Methods */}
                      {walletData.fundingMethods?.usdc && walletData.fundingMethods.usdc.length > 0 && (
                        walletData.fundingMethods.usdc.map((usdtMethod: any, index: number) => (
                          <div key={`usdt-${index}`} className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-green-400 mb-2">
                              {usdtMethod.name || `USDC (${usdtMethod.network || 'Base'})`}
                            </h4>
                            <p className="text-sm text-white/60 mb-2">Send USDC to this wallet address:</p>
                            <code className="text-sm bg-black/30 px-2 py-1 rounded">
                              {usdtMethod.address || 'Address not available'}
                            </code>
                            <p className="text-xs text-white/40 mt-2">
                              Minimum deposit: ${usdtMethod.minimumAmount || '10'} USDC
                            </p>
                          </div>
                        ))
                      )}

                      {/* NGN Bank Methods */}
                      {walletData.fundingMethods?.ngn && walletData.fundingMethods.ngn.length > 0 && (
                        walletData.fundingMethods.ngn.map((ngnMethod: any, index: number) => (
                          <div key={`ngn-${index}`} className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-blue-400 mb-2">
                              {ngnMethod.name || 'Nigerian Naira (NGN)'}
                            </h4>
                            <div className="text-sm text-white/60 space-y-1">
                              <p>Bank: {ngnMethod.bankName || 'Not available'}</p>
                              <p>Account: {ngnMethod.accountNumber || 'Not available'}</p>
                              <p>Name: {ngnMethod.accountHolder || 'Not available'}</p>
                            </div>
                            <p className="text-xs text-white/40 mt-2">
                              Minimum deposit: ₦{ngnMethod.minimumAmount || '5,000'}
                            </p>
                          </div>
                        ))
                      )}

                      {/* AED Bank Methods */}
                      {walletData.fundingMethods?.aed && walletData.fundingMethods.aed.length > 0 && (
                        walletData.fundingMethods.aed.map((aedMethod: any, index: number) => (
                          <div key={`aed-${index}`} className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-yellow-400 mb-2">
                              {aedMethod.name || 'UAE Dirham (AED)'}
                            </h4>
                            <div className="text-sm text-white/60 space-y-1">
                              <p>Bank: {aedMethod.bankName || 'Not available'}</p>
                              <p>IBAN: {aedMethod.iban || aedMethod.accountNumber || 'Not available'}</p>
                              <p>Name: {aedMethod.accountHolder || 'Not available'}</p>
                            </div>
                            <p className="text-xs text-white/40 mt-2">
                              Minimum deposit: {aedMethod.minimumAmount || '50'} AED
                            </p>
                          </div>
                        ))
                      )}

                      {/* USD Bank Methods */}
                      {walletData.fundingMethods?.usd && walletData.fundingMethods.usd.length > 0 && (
                        walletData.fundingMethods.usd.map((usdMethod: any, index: number) => (
                          <div key={`usd-${index}`} className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-green-400 mb-2">
                              {usdMethod.name || 'US Dollar (USD)'}
                            </h4>
                            <div className="text-sm text-white/60 space-y-1">
                              <p>Bank: {usdMethod.bankName || 'Not available'}</p>
                              <p>Account: {usdMethod.accountNumber || 'Not available'}</p>
                              <p>Name: {usdMethod.accountHolder || 'Not available'}</p>
                              {usdMethod.swiftCode && <p>SWIFT: {usdMethod.swiftCode}</p>}
                            </div>
                            <p className="text-xs text-white/40 mt-2">
                              Minimum deposit: ${usdMethod.minimumAmount || '50'} USD
                            </p>
                          </div>
                        ))
                      )}

                      {/* Fund Wallet Button */}
                      <div className="text-center py-6">
                        <button
                          onClick={() => setShowFundingModal(true)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 mx-auto"
                        >
                          <Plus className="w-5 h-5" />
                          Fund Wallet
                        </button>
                        <p className="text-white/60 text-sm mt-3">
                          Add funds using credit card or cryptocurrency
                        </p>
                      </div>

                      {/* Legacy funding methods (if any) */}
                      {(!walletData.fundingMethods ||
                        (!walletData.fundingMethods.usdc?.length &&
                         !walletData.fundingMethods.ngn?.length &&
                         !walletData.fundingMethods.aed?.length &&
                         !walletData.fundingMethods.usd?.length)) && (
                        <div className="text-center py-4 border-t border-white/10">
                          <p className="text-white/40 text-sm">
                            Or contact admin for alternative payment methods
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Swap Tab */}
          {activeTab === 'swap' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-6">Currency Swap</h2>
                <p className="text-white/60 mb-6">
                  Convert between different currencies to run campaigns in your preferred currency.
                </p>
                {walletData ? (
                  <ArtistSwapInterface
                    wallet={{
                      usdBalance: walletData.balances.usdt || 0,
                      ngnBalance: walletData.balances.ngn || 0,
                      aedBalance: walletData.balances.aed || 0,
                      inrBalance: walletData.balances.inr || 0
                    }}
                    onSwapComplete={fetchWalletData}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-white/60 mt-4">Loading wallet data...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Kickstarter Tab */}
          {activeTab === 'kickstarter' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Kickstarter Campaigns</h2>
                  <p className="text-white/60">Raise funds for your tracks by selling MFTs (Music Fungible Tokens)</p>
                </div>
                <Link
                  to="/kickstarter"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Marketplace
                </Link>
              </div>

              {/* Info Card */}
              <div className="glass-card p-6 border-emerald-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">What are MFTs?</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Music Fungible Tokens (MFTs) allow your fans to invest in your tracks.
                      When you sell MFTs, investors receive a share of your track's royalties.
                      MFTs can be traded between users, and whoever holds them receives the royalty payments.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-white/60">Raise funds upfront</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white/60">Build investor community</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-white/60">Tradeable tokens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="glass-card p-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Campaign Creation Coming Soon</h3>
                <p className="text-white/60 mb-6">
                  You'll soon be able to create MFT campaigns for your tracks directly from here.
                </p>
                <Link
                  to="/kickstarter"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Explore MFT Marketplace
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <ArtistProfile />
          )}
        </div>
      </main>

      <AnimatePresence>
        {showPasswordChange && (
          <ArtistPasswordChange onClose={() => setShowPasswordChange(false)} />
        )}
        {showCampaignForm && (
          <ArtistCampaignForm
            onClose={() => setShowCampaignForm(false)}
            onSuccess={handleCampaignCreated}
          />
        )}
      </AnimatePresence>

      {/* Funding Modal */}
      <FundingModal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
        onSuccess={() => {
          // Refresh wallet data after successful payment
          fetchWalletData();
        }}
      />
    </div>
  );
}

export default ArtistDashboard;
