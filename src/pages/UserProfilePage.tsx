import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Save, X, ExternalLink, User, Wallet, Trophy, Heart, DollarSign, Users, Play, Instagram, Youtube } from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';
import { openVerseApi, OpenVerseCampaign } from '../lib/openVerseApi';
import { BottomNavigation } from '../components/BottomNavigation';

interface Challenge {
  _id: string;
  campaignId: {
    _id: string;
    title: string;
    artistId: {
      name: string;
      imageUrl: string;
    };
  };
  platform: 'youtube' | 'tiktok' | 'instagram';
  videoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rewardUsdt: number;
  rewardJamz: number;
  createdAt: string;
}

export function UserProfilePage() {
  const { isAuthenticated, user, username } = useAuthStore();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stats
  const [totalEarnedUsdt, setTotalEarnedUsdt] = useState(0);
  const [totalEarnedJamz, setTotalEarnedJamz] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);

  // Favorites
  const [favoriteCampaigns, setFavoriteCampaigns] = useState<OpenVerseCampaign[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
      fetchFavoriteCampaigns();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Update the input when username changes (e.g. after saving)
    setUsernameInput(username || '');
  }, [username]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch challenges
      const challengesData = await api.challenges.list();
      setChallenges(challengesData);

      // Calculate stats
      const approvedChallenges = challengesData.filter(c => c.status === 'approved');
      setCompletedChallenges(approvedChallenges.length);

      const totalUsdt = approvedChallenges.reduce((sum, c) => sum + c.rewardUsdt, 0);
      const totalJamz = approvedChallenges.reduce((sum, c) => sum + c.rewardJamz, 0);
      setTotalEarnedUsdt(totalUsdt);
      setTotalEarnedJamz(totalJamz);

    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setUsernameError(null);

      // Since we've removed the username prompting functionality,
      // we'll just show a message that this feature is disabled
      setUsernameError('Username editing has been disabled');

      // Uncomment this if you want to implement direct API call instead
      // const response = await api.auth.setUsername(usernameInput.trim());
      // Update local state if needed

      setIsSaving(false);
    } catch (err: any) {
      setUsernameError(err.message || 'Failed to update username');
      setIsSaving(false);
    }
  };

  const fetchFavoriteCampaigns = async () => {
    try {
      setFavoritesLoading(true);
      const favoriteIds = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');

      if (favoriteIds.length === 0) {
        setFavoriteCampaigns([]);
        return;
      }

      // Fetch campaign details for each favorite ID
      const campaignPromises = favoriteIds.map(async (id: string) => {
        try {
          return await openVerseApi.campaigns.get(id);
        } catch (err) {
          console.error(`Error fetching campaign ${id}:`, err);
          return null;
        }
      });

      const campaigns = await Promise.all(campaignPromises);
      const validCampaigns = campaigns.filter(campaign => campaign !== null) as OpenVerseCampaign[];

      setFavoriteCampaigns(validCampaigns);

      // Clean up localStorage if some campaigns were not found
      if (validCampaigns.length !== favoriteIds.length) {
        const validIds = validCampaigns.map(c => c._id);
        localStorage.setItem('favoriteCampaigns', JSON.stringify(validIds));
      }
    } catch (err) {
      console.error('Error fetching favorite campaigns:', err);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const removeFavorite = (campaignId: string) => {
    const updatedFavorites = favoriteCampaigns.filter(c => c._id !== campaignId);
    setFavoriteCampaigns(updatedFavorites);

    const favoriteIds = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
    const updatedIds = favoriteIds.filter((id: string) => id !== campaignId);
    localStorage.setItem('favoriteCampaigns', JSON.stringify(updatedIds));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
      case 'tiktok':
        return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
      case 'instagram':
        return <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };



  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-16 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="section-title gradient-text mb-2">My Profile</h1>
          <p className="text-white/60">Manage your profile and view your challenge history</p>
        </motion.div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Stats */}
          <div className="space-y-8">
            {/* Profile Card */}
            <motion.div
              className="glass-card p-6 backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-400" />
                  Profile
                </h2>
                {/* Username editing disabled */}
                <div className="text-white/30 cursor-not-allowed" title="Username editing has been disabled">
                  <Edit className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Username
                  </label>
                  <p className="text-white font-medium">{username || 'Not set'}</p>
                </div>

                {user?.uniqueCode && (
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Your Unique Code
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-lg bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
                        JAMZ{user.uniqueCode}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`JAMZ${user.uniqueCode}`);
                          showNotification('success', 'Code copied to clipboard!');
                        }}
                        className="text-white/60 hover:text-white transition-colors p-2"
                        title="Copy code"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                      Include this code in your campaign submissions (e.g., "JAMZ{user.uniqueCode}")
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              className="glass-card p-6 backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-purple-400" />
                Stats
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Completed Challenges</span>
                  <span className="text-white font-bold">{completedChallenges}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Earned (USD)</span>
                  <span className="text-yellow-400 font-bold">${totalEarnedUsdt.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Earned (JAMZ)</span>
                  <span className="text-purple-400 font-bold">{totalEarnedJamz.toFixed(2)} JAMZ</span>
                </div>
              </div>
            </motion.div>


          </div>

          {/* Right Column - Challenge History */}
          <div className="lg:col-span-2">
            <motion.div
              className="glass-card p-6 backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-purple-400" />
                Challenge History
              </h2>

              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="mt-2 text-white/60">Loading your challenges...</p>
                </div>
              ) : challenges.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-white/60">You haven't submitted any challenges yet.</p>
                  <button
                    onClick={() => navigate('/campaigns')}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Browse Campaigns
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge._id}
                      className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={challenge.campaignId.artistId.imageUrl || 'https://via.placeholder.com/40?text=Artist'}
                            alt={challenge.campaignId.artistId.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-medium text-white">{challenge.campaignId.title}</h3>
                            <p className="text-sm text-white/60">{challenge.campaignId.artistId.name}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                            {getPlatformIcon(challenge.platform)}
                            <span className="text-xs capitalize">{challenge.platform}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <p className="text-sm text-white/60">Submitted on {formatDate(challenge.createdAt)}</p>
                          <a
                            href={challenge.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-400 hover:text-purple-300 flex items-center mt-1"
                          >
                            View Submission
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="bg-black/40 px-3 py-1 rounded border border-yellow-500/20">
                            <span className="text-yellow-400 font-bold">${challenge.rewardUsdt.toFixed(2)}</span>
                          </div>
                          <div className="bg-black/40 px-3 py-1 rounded border border-purple-500/20">
                            <span className="text-purple-400 font-bold">{challenge.rewardJamz.toFixed(2)} JAMZ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Favorite Campaigns */}
            <motion.div
              className="glass-card p-6 backdrop-blur-xl mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-400" />
                Favorite Campaigns
              </h2>

              {favoritesLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="mt-2 text-white/60">Loading your favorites...</p>
                </div>
              ) : favoriteCampaigns.length === 0 ? (
                <div className="py-8 text-center">
                  <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">You haven't saved any campaigns yet.</p>
                  <button
                    onClick={() => navigate('/open-verse')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Browse Campaigns
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteCampaigns.map((campaign) => (
                    <div
                      key={campaign._id}
                      className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-colors relative group"
                    >
                      {/* Remove from favorites button */}
                      <button
                        onClick={() => removeFavorite(campaign._id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/40 text-red-400 p-1 rounded-full"
                        title="Remove from favorites"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-start gap-3 mb-3">
                        {campaign.artistId && (
                          <img
                            src={campaign.artistId.imageUrl || 'https://via.placeholder.com/40?text=Artist'}
                            alt={campaign.artistId.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{campaign.title}</h3>
                          {campaign.artistId && (
                            <p className="text-sm text-white/60">{campaign.artistId.name}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{campaign.prizePool.amount} {campaign.prizePool.currency}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{campaign.totalParticipants}/{campaign.maxParticipants}</span>
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          campaign.status === 'ended' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {campaign.status === 'active' ? 'Active' :
                           campaign.status === 'ended' ? 'Ended' :
                           campaign.status === 'winners_selected' ? 'Winners' :
                           campaign.status === 'prizes_distributed' ? 'Complete' :
                           'Draft'}
                        </div>
                      </div>

                      <Link
                        to={`/open-verse/${campaign._id}`}
                        className="block w-full py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-center rounded-lg transition-colors text-sm font-medium"
                      >
                        View Campaign
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}

export default UserProfilePage;
