import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Clock, DollarSign, Play, Instagram, Youtube, Plus, X, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, ExternalLink, Eye, Share2, Heart, Sparkles, Music2, Music, Twitter, Facebook, Upload } from 'lucide-react';
import { openVerseApi, OpenVerseCampaign, OpenVerseSubmission } from '../lib/openVerseApi';
import { useAuthStore } from '../lib/auth';
import { useAppKit } from '@reown/appkit/react';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { formatMultipleCurrencies, formatCurrency } from '../lib/currencyUtils';
import SimpleShareEarn from '../components/SimpleShareEarn';
import { BottomNavigation } from '../components/BottomNavigation';
import { NotificationBell } from '../components/NotificationBell';

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};



// RewardBadge component for displaying rewards
interface PlatformReward {
  usdt: number;
  jamz: number;
  ngn?: number;
  aed?: number;
}

const RewardBadge = ({ usdt, jamz, ngn = 0, aed = 0 }: PlatformReward) => {
  const rewards = {
    USD: usdt,
    JAMZ: jamz,
    NGN: ngn,
    AED: aed
  };

  const formattedRewards = formatMultipleCurrencies(rewards);

  if (formattedRewards === 'TBA') {
    return <span className="text-white/60 text-sm">No rewards</span>;
  }

  return (
    <div className="px-3 py-2 rounded-md bg-gradient-to-r from-[#6600FF]/20 to-[#6600FF]/10 border border-[#6600FF]/30">
      <span className="text-[#6600FF] text-lg font-bold">{formattedRewards}</span>
    </div>
  );
};

interface SubmissionModalProps {
  campaign: OpenVerseCampaign;
  onClose: () => void;
  onSubmit: (platform: string, url: string) => void;
  loading: boolean;
  userSubmissions: OpenVerseSubmission[];
}

function SubmissionModal({ campaign, onClose, onSubmit, loading, userSubmissions }: SubmissionModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [contentUrl, setContentUrl] = useState('');
  const [error, setError] = useState<string>('');
  const [validating, setValidating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Get platforms user has already submitted to
  const submittedPlatforms = userSubmissions.map(sub => sub.platform);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
    { id: 'tiktok', name: 'TikTok', icon: Play, color: 'from-black to-red-500' },
    { id: 'youtube', name: 'YouTube Shorts', icon: Youtube, color: 'from-red-500 to-red-600' }
  ].filter(platform =>
    campaign.allowedPlatforms.includes(platform.id) &&
    !submittedPlatforms.includes(platform.id)
  );

  const validateUrl = async (platform: string, url: string) => {
    if (!platform || !url.trim()) return;

    try {
      setValidating(true);
      setError('');

      const result = await openVerseApi.content.validateUrl(platform, url);
      setValidationResult(result);

      if (result.isValid) {
        // Try to get preview if URL is valid
        try {
          const previewData = await openVerseApi.content.getPreview(platform, url);
          setPreview(previewData);
        } catch (previewError) {
          console.warn('Could not fetch preview:', previewError);
          setPreview(null);
        }
      } else {
        setPreview(null);
        setError(`Invalid ${platform} URL format`);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate URL');
      setValidationResult(null);
      setPreview(null);
    } finally {
      setValidating(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setContentUrl(url);
    setValidationResult(null);
    setPreview(null);
    setError('');

    // Debounce validation
    if (selectedPlatform && url.trim()) {
      const timeoutId = setTimeout(() => {
        validateUrl(selectedPlatform, url);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    setValidationResult(null);
    setPreview(null);
    setError('');

    // Re-validate if URL exists
    if (contentUrl.trim()) {
      validateUrl(platform, contentUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPlatform) {
      setError('Please select a platform');
      return;
    }

    if (!contentUrl.trim()) {
      setError('Please enter a content URL');
      return;
    }

    if (validationResult && !validationResult.isValid) {
      setError(`Please enter a valid ${selectedPlatform} URL`);
      return;
    }

    onSubmit(selectedPlatform, contentUrl);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 pt-16 md:pt-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="glass-card w-full max-w-md mx-auto mb-40 md:mb-4 flex flex-col"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 pb-2 sm:pb-4 border-b border-white/10 sticky top-0 bg-black/50 backdrop-blur-xl rounded-t-2xl z-10">
          <h2 className="text-lg sm:text-xl font-bold text-white">Submit Your Entry</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 -mr-2 hover:bg-white/10 rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-4">
          <form id="submission-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3">
                Select Platform
              </label>

            {/* Show already submitted platforms */}
            {submittedPlatforms.length > 0 && (
              <div className="mb-3 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-400 text-sm font-medium mb-1">Already submitted on:</p>
                <div className="flex flex-wrap gap-2">
                  {submittedPlatforms.map(platform => {
                    const platformInfo = [
                      { id: 'instagram', name: 'Instagram' },
                      { id: 'tiktok', name: 'TikTok' },
                      { id: 'youtube', name: 'YouTube Shorts' }
                    ].find(p => p.id === platform);
                    return (
                      <span key={platform} className="px-2 py-1 bg-blue-500/30 text-blue-300 text-xs rounded">
                        {platformInfo?.name || platform}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {platforms.length === 0 ? (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">
                  You have already submitted to all available platforms for this campaign.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
              {platforms.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <div
                    key={platform.id}
                    onClick={() => handlePlatformChange(platform.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlatform === platform.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">{platform.name}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Content URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={`Enter your ${selectedPlatform || 'content'} URL`}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                  validating ? 'border-yellow-500' :
                  validationResult?.isValid ? 'border-green-500' :
                  validationResult?.isValid === false ? 'border-red-500' :
                  'border-white/20 focus:border-purple-500'
                }`}
              />
              {validating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                </div>
              )}
            </div>

            {/* URL Validation Status */}
            {validationResult && (
              <div className={`text-sm ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {validationResult.isValid ? '✓ Valid URL' : '✗ Invalid URL format'}
              </div>
            )}

            {/* Content Preview */}
            {preview && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex gap-3">
                  {preview.thumbnailUrl && (
                    <img
                      src={preview.thumbnailUrl}
                      alt="Content preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm line-clamp-1">
                      {preview.title || 'Content Preview'}
                    </h4>
                    {preview.author?.displayName && (
                      <p className="text-white/60 text-xs">
                        by {preview.author.displayName}
                      </p>
                    )}
                    {preview.description && (
                      <p className="text-white/50 text-xs line-clamp-2 mt-1">
                        {preview.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Sticky Button Container - Always visible at bottom */}
        <div className="sticky bottom-0 p-4 sm:p-6 pt-4 border-t border-white/10 bg-black/80 backdrop-blur-xl rounded-b-2xl safe-area-bottom">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-button justify-center"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="submission-form"
              className={`flex-1 glass-button-primary ${
                (!selectedPlatform || !contentUrl.trim() || (validationResult && !validationResult.isValid))
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              disabled={loading || !selectedPlatform || !contentUrl.trim() || (validationResult && !validationResult.isValid)}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Submit Entry
                </span>
              )}
            </button>
          </div>
          {/* Helper text for form validation */}
          {!selectedPlatform && (
            <p className="text-white/50 text-xs text-center mt-2">Select a platform to continue</p>
          )}
          {selectedPlatform && !contentUrl.trim() && (
            <p className="text-white/50 text-xs text-center mt-2">Enter your content URL to submit</p>
          )}
          {validationResult?.isValid && contentUrl.trim() && (
            <p className="text-green-400 text-xs text-center mt-2">✓ Ready to submit</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function OpenVerseCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, walletAddress } = useAuthStore();
  const { open } = useAppKit();
  const [campaign, setCampaign] = useState<OpenVerseCampaign | null>(null);
  const [submissions, setSubmissions] = useState<OpenVerseSubmission[]>([]);
  const [winners, setWinners] = useState<OpenVerseSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<OpenVerseSubmission | null>(null);
  const [userSubmission, setUserSubmission] = useState<OpenVerseSubmission | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<OpenVerseSubmission[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCampaignData();
      checkFavoriteStatus();
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && campaign) {
      checkUserSubmission();
    }
  }, [isAuthenticated, campaign]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);

      // Try to fetch from unified campaigns first (for artist-created campaigns)
      let campaignData, submissionsData, winnersData;

      try {
        // Try unified campaigns API first
        const response = await fetch(`/api/unified-campaigns/${id}`);
        if (response.ok) {
          campaignData = await response.json();
          // For unified campaigns, use unified API for submissions and winners
          const [submissionsResponse, winnersResponse] = await Promise.all([
            fetch(`/api/unified-campaigns/${id}/showcase?status=approved`),
            fetch(`/api/unified-campaigns/${id}/winners`)
          ]);

          submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : [];
          winnersData = winnersResponse.ok ? await winnersResponse.json() : [];
        } else {
          throw new Error('Not a unified campaign');
        }
      } catch (unifiedError) {
        // If unified campaign fetch fails, try original OpenVerse API
        const [campaignResponse, submissionsResponse, winnersResponse] = await Promise.all([
          openVerseApi.campaigns.get(id!),
          openVerseApi.campaigns.getShowcase(id!, 'approved', isAuthenticated),
          openVerseApi.campaigns.getWinners(id!)
        ]);

        campaignData = campaignResponse;
        submissionsData = submissionsResponse;
        winnersData = winnersResponse;
      }

      setCampaign(campaignData);
      setSubmissions(submissionsData);
      setWinners(winnersData);
    } catch (err) {
      console.error('Error fetching campaign data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubmission = async () => {
    try {
      const userSubmissions = await openVerseApi.submissions.getUserSubmissions();
      const campaignSubmissions = userSubmissions.filter(s => s.campaignId === id);
      // For now, we'll still use the first submission for backward compatibility
      // but we now have access to all user's submissions for this campaign
      setUserSubmission(campaignSubmissions[0] || null);
      setUserSubmissions(campaignSubmissions);
    } catch (err) {
      console.error('Error checking user submission:', err);
    }
  };

  const checkFavoriteStatus = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
      setIsFavorited(favorites.includes(id));
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const handleToggleFavorite = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteCampaigns') || '[]');
      let updatedFavorites;

      if (isFavorited) {
        // Remove from favorites
        updatedFavorites = favorites.filter((favId: string) => favId !== id);
        showNotification('success', 'Campaign removed from favorites');
      } else {
        // Add to favorites
        updatedFavorites = [...favorites, id];
        showNotification('success', 'Campaign added to favorites');
      }

      localStorage.setItem('favoriteCampaigns', JSON.stringify(updatedFavorites));
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showNotification('error', 'Failed to update favorites');
    }
  };

  const handleSubmitClick = () => {
    // Check if user is authenticated (wallet not required for participation)
    if (!isAuthenticated) {
      // Set pending submission flag and trigger authentication
      setPendingSubmission(true);
      open();
      return;
    }

    // User is authenticated, show submission modal
    setShowSubmissionModal(true);
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  // Effect to handle authentication and show submission modal
  useEffect(() => {
    if (pendingSubmission && isAuthenticated) {
      // User just authenticated and was trying to submit
      setPendingSubmission(false);
      setShowSubmissionModal(true);
    }
  }, [isAuthenticated, pendingSubmission]);

  const handleSubmission = async (platform: string, contentUrl: string) => {
    try {
      setSubmissionLoading(true);

      const submission = await openVerseApi.submissions.create(id!, { platform: platform as any, contentUrl });
      setUserSubmission(submission);
      setShowSubmissionModal(false);
      showNotification('success', 'Submission created successfully! Your content is now live in the showcase.');

      // Refresh showcase - include user's own submissions (even if pending)
      const updatedSubmissions = await openVerseApi.campaigns.getShowcase(id!, 'approved', true);
      setSubmissions(updatedSubmissions);
    } catch (err) {
      console.error('Error submitting:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Helper function to generate embed URLs
  const getEmbedUrl = (platform: string, contentUrl: string): string | null => {
    try {
      console.log(`🔗 Generating embed URL for ${platform}:`, contentUrl);

      switch (platform) {
        case 'instagram':
          // Extract post ID from Instagram URL
          const instagramMatch = contentUrl.match(/\/p\/([^\/\?]+)/);
          if (instagramMatch) {
            const embedUrl = `https://www.instagram.com/p/${instagramMatch[1]}/embed/`;
            console.log('📸 Instagram embed URL:', embedUrl);
            return embedUrl;
          }
          // Handle reel URLs
          const reelMatch = contentUrl.match(/\/reel\/([^\/\?]+)/);
          if (reelMatch) {
            const embedUrl = `https://www.instagram.com/reel/${reelMatch[1]}/embed/`;
            console.log('📸 Instagram reel embed URL:', embedUrl);
            return embedUrl;
          }
          break;

        case 'tiktok':
          // Extract video ID from TikTok URL
          const tiktokMatch = contentUrl.match(/\/video\/(\d+)/);
          if (tiktokMatch) {
            const embedUrl = `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
            console.log('🎵 TikTok embed URL:', embedUrl);
            return embedUrl;
          }
          break;

        case 'youtube':
          // Extract video ID from YouTube URL
          const youtubeMatch = contentUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
          if (youtubeMatch) {
            const embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
            console.log('📺 YouTube embed URL:', embedUrl);
            return embedUrl;
          }
          break;
      }

      console.log('❌ No embed URL generated for:', platform, contentUrl);
      return null;
    } catch (error) {
      console.error('Error generating embed URL:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-4 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6600FF]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen pt-4 pb-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h2>
            <p className="text-white/60 mb-6">{error || 'The campaign you are looking for does not exist.'}</p>
            <Link to="/open-verse" className="glass-button-primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Campaign Page
            </Link>
          </div>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-2 sm:pt-4 pb-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Back Button with Notification Bell */}
        <motion.div
          className="mb-4 sm:mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/open-verse"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm sm:text-base touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Campaign Page</span>
          </Link>

          {/* Right side: Notification Bell and Toast Notification */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Toast Notification */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className={`p-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                  } text-white backdrop-blur-sm border border-white/10`}
                >
                  <div className="flex items-center gap-2">
                    {notification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{notification.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-0 lg:items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Video Player or Campaign Header */}
            <motion.div
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {campaign.youtubeUrl && getYouTubeVideoId(campaign.youtubeUrl) ? (
                <YouTubePlayer
                  videoId={getYouTubeVideoId(campaign.youtubeUrl)!}
                  title={campaign.title}
                  onReady={() => {}}
                  onStateChange={() => {}}
                />
              ) : campaign.thumbnailImage ? (
                <div className="aspect-video relative">
                  <img
                    src={openVerseApi.campaigns.getThumbnailUrl(campaign._id)}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="text-2xl font-bold text-white mb-2">{campaign.title}</h1>
                    <p className="text-white/80">{campaign.description}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-[#6600FF]/20 to-pink-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">{campaign.title}</h1>
                    <p className="text-white/80">{campaign.description}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Campaign Info - Polished box design */}
            <motion.div
              className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              {/* Header bar */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 sm:px-6 py-4 border-b border-white/10">
                <h3 className="font-bold text-white text-base sm:text-lg">Campaign Info</h3>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {/* Artist Section */}
                {campaign.artistId && (
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/10">
                    <img
                      src={campaign.artistId.imageUrl}
                      alt={campaign.artistId.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-purple-500/30 shadow-lg"
                    />
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{campaign.artistId.name}</h2>
                      {/* Social Media Links */}
                      {campaign.artistId?.socialMedia && (
                        <div className="flex items-center gap-2 mt-2">
                          {campaign.artistId.socialMedia.instagram && (
                            <a
                              href={campaign.artistId.socialMedia.instagram.startsWith('http')
                                ? campaign.artistId.socialMedia.instagram
                                : `https://instagram.com/${campaign.artistId.socialMedia.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full hover:scale-110 transition-transform"
                              title="Follow on Instagram"
                            >
                              <Instagram className="w-4 h-4 text-white" />
                            </a>
                          )}
                          {campaign.artistId.socialMedia.twitter && (
                            <a
                              href={campaign.artistId.socialMedia.twitter.startsWith('http')
                                ? campaign.artistId.socialMedia.twitter
                                : `https://twitter.com/${campaign.artistId.socialMedia.twitter.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-zinc-800 rounded-full hover:scale-110 transition-transform border border-zinc-600"
                              title="Follow on X (Twitter)"
                            >
                              <Twitter className="w-4 h-4 text-white" />
                            </a>
                          )}
                          {campaign.artistId.socialMedia.facebook && (
                            <a
                              href={campaign.artistId.socialMedia.facebook.startsWith('http')
                                ? campaign.artistId.socialMedia.facebook
                                : `https://facebook.com/${campaign.artistId.socialMedia.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full hover:scale-110 transition-transform"
                              title="Follow on Facebook"
                            >
                              <Facebook className="w-4 h-4 text-white" />
                            </a>
                          )}
                          {campaign.artistId.socialMedia.tiktok && (
                            <a
                              href={campaign.artistId.socialMedia.tiktok.startsWith('http')
                                ? campaign.artistId.socialMedia.tiktok
                                : `https://tiktok.com/@${campaign.artistId.socialMedia.tiktok.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full hover:scale-110 transition-transform"
                              title="Follow on TikTok"
                            >
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Campaign Details */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{campaign.title}</h1>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed whitespace-pre-line">{campaign.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Submission Guidelines */}
            {campaign.submissionGuidelines && (
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <h3 className="text-lg font-bold text-white mb-3">Submission Guidelines</h3>
                <p className="text-white/70 whitespace-pre-wrap">{campaign.submissionGuidelines}</p>
              </motion.div>
            )}

            {/* Campaign Actions */}
            <motion.div
              className="glass-card p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Mobile: Stack all buttons vertically, Desktop: Flex row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <button
                  onClick={handleSubmitClick}
                  className="glass-button-primary w-full sm:w-auto sm:min-w-[180px] touch-target justify-center"
                  disabled={!isAuthenticated || userSubmissions.length > 0 || campaign.status !== 'active' || new Date() >= new Date(campaign.endDate)}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm sm:text-base">{userSubmissions.length > 0 ? 'Submitted' : 'Submit Your Entry'}</span>
                </button>
                <button
                  onClick={handleShareClick}
                  className="glass-button w-full sm:w-auto touch-target justify-center"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm sm:text-base">Share Campaign</span>
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`glass-button w-full sm:w-auto touch-target justify-center ${isFavorited ? 'bg-red-500/20 border-red-500/40' : ''}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-sm sm:text-base">{isFavorited ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="glass-card p-4 sm:p-6 backdrop-blur-xl h-fit">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">Campaign Details</h2>

            <div className="space-y-4 sm:space-y-6">
              {/* Prize Pool Section */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-black/30 px-3 sm:px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">Prize Pool</h3>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-500 mb-1">
                      {formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency as any)}
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm">Total Rewards</div>
                  </div>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-white/60" />
                    <span className="text-white/70 text-xs sm:text-sm">Winners</span>
                  </div>
                  <span className="text-white font-medium text-xs sm:text-sm">{campaign.maxWinners}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span className="text-white/70 text-xs sm:text-sm">Time Left</span>
                  </div>
                  <span className="text-white font-medium">{openVerseApi.utils.formatTimeRemaining(campaign.endDate)}</span>
                </div>
              </div>

              {/* Prerequisites Section */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-black/30 px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#6600FF]" />
                    <h3 className="font-semibold text-white">Prerequisites</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Share2 className="w-4 h-4 text-white/60" />
                      <span className="text-white/70">Share Campaign</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      campaign.prerequisites?.requireShareAction
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {campaign.prerequisites?.requireShareAction ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <button
                    onClick={handleShareClick}
                    className="w-full py-3 bg-gradient-to-r from-[#6600FF] via-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Share Campaign
                  </button>
                </div>
              </div>

              {/* Music Platform Links */}
              {(campaign.spotifyUrl || campaign.appleMusicUrl) && (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="bg-black/30 px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#6600FF]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                      <h3 className="font-semibold text-white">Listen Now</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {campaign.appleMusicUrl && (
                      <a
                        href={campaign.appleMusicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-black/40 hover:bg-black/60 rounded-lg transition-colors border border-white/10"
                      >
                        {/* Apple Logo SVG */}
                        <div className="w-4 h-4 flex-shrink-0">
                          <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                        </div>
                        <span className="text-white font-medium text-sm">Listen on Apple Music</span>
                      </a>
                    )}

                    {campaign.spotifyUrl && (
                      <a
                        href={campaign.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-black/40 hover:bg-black/60 rounded-lg transition-colors border border-white/10"
                      >
                        {/* Spotify Logo SVG */}
                        <div className="w-4 h-4 flex-shrink-0">
                          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#1DB954]">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        </div>
                        <span className="text-white font-medium text-sm">Listen on Spotify</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Submission Status */}
              {isAuthenticated && userSubmissions.length > 0 ? (
                // User has submissions - show submission status
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      {userSubmissions.length === 1 ? 'Submission Received' : `${userSubmissions.length} Submissions Received`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {userSubmissions.map((submission) => {
                      const platformInfo = openVerseApi.utils.getPlatformInfo(submission.platform);
                      return (
                        <p key={submission._id} className="text-white/60 text-sm">
                          {platformInfo.name}: Submitted
                        </p>
                      );
                    })}
                  </div>
                  {userSubmissions.length < campaign.allowedPlatforms.length && campaign.status === 'active' && new Date() < new Date(campaign.endDate) && (
                    <button
                      onClick={handleSubmitClick}
                      className="w-full mt-3 py-2 bg-gradient-to-r from-[#6600FF] to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Submit on Another Platform
                    </button>
                  )}
                </div>
              ) : isAuthenticated && userSubmissions.length === 0 && campaign.status === 'active' && new Date() < new Date(campaign.endDate) ? (
                // User is authenticated, no submissions, campaign is active and not ended - show submit button
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white/80 mb-4">Ready to submit your entry?</p>
                    <button
                      onClick={handleSubmitClick}
                      className="w-full py-2 bg-gradient-to-r from-[#6600FF] to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      Submit Your Entry
                    </button>
                  </div>
                </div>
              ) : (
                // Show appropriate message for other cases
                <div className="rounded-xl border border-gray-500/30 bg-gray-500/10 p-4">
                  <p className="text-gray-400 text-center">
                    {!isAuthenticated
                      ? 'Please sign in to submit your entry'
                      : campaign.status !== 'active'
                        ? 'Campaign is not active'
                        : new Date() >= new Date(campaign.endDate)
                          ? 'Submission period has ended'
                          : 'Unable to submit at this time'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Winners Section */}
        {winners.length > 0 && (
          <motion.div
            className="mt-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">🏆 Winners</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {winners.map((winner, index) => {
                const platformInfo = openVerseApi.utils.getPlatformInfo(winner.platform);
                return (
                  <motion.div
                    key={winner._id}
                    className="glass-card p-6 border-2 border-[#6600FF]/50 bg-gradient-to-br from-[#6600FF]/10 to-purple-500/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#6600FF] to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {winner.winnerRank}
                      </div>
                      <div>
                        <div className="text-white font-medium">@{winner.userId?.username || winner.metadata?.author?.username || 'Anonymous'}</div>
                        <div className="text-white/60 text-sm">{platformInfo.name}</div>
                      </div>
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-[#6600FF]/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center relative">
                      <Play className="w-8 h-8 text-white/70" />
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                        <span className="text-xs">{platformInfo.icon}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#6600FF]">
                        {winner.prizeAmount} {winner.prizeCurrency}
                      </div>
                      <div className="text-white/60 text-sm">Prize Amount</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Submissions Gallery */}
        <motion.div
          className="mt-2 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-white">Submissions</h2>
            <button
              onClick={async () => {
                const updatedSubmissions = await openVerseApi.campaigns.getShowcase(id!, 'approved', isAuthenticated); // Combined showcase content
                setSubmissions(updatedSubmissions);
                showNotification('success', 'Showcase refreshed!');
              }}
              className="glass-button flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {submissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {submissions.map((submission, index) => {
                const platformInfo = openVerseApi.utils.getPlatformInfo(submission.platform);
                return (
                  <motion.div
                    key={submission._id}
                    className={`glass-card p-4 hover:scale-105 transition-transform relative hover:border-[#6600FF]/30 ${
                      submission.isWinner ? 'border border-[#6600FF]/50 bg-[#6600FF]/10' : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >

                    <div
                      className="submission-thumbnail aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3 overflow-hidden relative cursor-pointer group"
                      onClick={() => window.open(submission.contentUrl, '_blank')}
                    >
                      {/* Content preview with fallback */}
                      {(() => {
                        const embedUrl = getEmbedUrl(submission.platform, submission.contentUrl);

                        // Try to show iframe preview first (with pointer-events disabled)
                        if (embedUrl) {
                          // Platform-specific iframe attributes
                          const iframeProps = submission.platform === 'tiktok' ? {
                            sandbox: "allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin",
                            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          } : {};

                          return (
                            <>
                              <iframe
                                src={embedUrl}
                                className="w-full h-full rounded-lg border-0"
                                frameBorder="0"
                                loading="lazy"
                                style={{ pointerEvents: 'none' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                {...iframeProps}
                              />
                              {/* Fallback thumbnail if iframe fails */}
                              {submission.metadata?.thumbnailUrl && (
                                <img
                                  src={submission.metadata.thumbnailUrl}
                                  alt="Submission thumbnail"
                                  className="w-full h-full object-cover absolute inset-0"
                                  style={{ zIndex: -1 }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                            </>
                          );
                        }

                        // Fallback to thumbnail image
                        if (submission.metadata?.thumbnailUrl) {
                          return (
                            <img
                              src={submission.metadata.thumbnailUrl}
                              alt="Submission thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          );
                        }

                        // Final fallback to platform icon
                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-2xl">{platformInfo.icon}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>

                      {/* Platform badge */}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                        <span className="text-xs">{platformInfo.icon}</span>
                      </div>

                      {/* Winner badge */}
                      {submission.isWinner && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-white/60 mb-2">
                      @{submission.userId?.username || submission.metadata?.author?.username || 'Anonymous'}
                    </div>

                    {submission.metadata?.title && (
                      <div className="text-xs text-white/40 mb-2 line-clamp-2">
                        {submission.metadata.title}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(submission.contentUrl, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#6600FF]/20 hover:bg-[#6600FF]/30 text-[#6600FF] rounded-lg text-xs transition-colors"
                        title="View original post"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Post
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(submission);
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs transition-colors"
                        title="View in modal"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
              <p className="text-white/60">Be the first to submit your entry!</p>
            </div>
          )}
        </motion.div>

        {/* Submission Modal */}
        <AnimatePresence>
          {showSubmissionModal && (
            <SubmissionModal
              campaign={campaign}
              onClose={() => setShowSubmissionModal(false)}
              onSubmit={handleSubmission}
              loading={submissionLoading}
              userSubmissions={userSubmissions}
            />
          )}
        </AnimatePresence>

        {/* Submission Viewer Modal */}
        <AnimatePresence>
          {selectedSubmission && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {openVerseApi.utils.getPlatformInfo(selectedSubmission.platform).name} Submission
                    </h3>
                    <p className="text-white/60">by @{selectedSubmission.userId?.username || selectedSubmission.metadata?.author?.username || 'Anonymous'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    {(() => {
                      const embedUrl = getEmbedUrl(selectedSubmission.platform, selectedSubmission.contentUrl);

                      if (embedUrl) {
                        // Platform-specific iframe attributes for full-screen modal
                        const iframeProps = selectedSubmission.platform === 'tiktok' ? {
                          sandbox: "allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"
                        } : {};

                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            {...iframeProps}
                          />
                        );
                      }

                      // Fallback for platforms without embed support
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                            <span className="text-2xl">{openVerseApi.utils.getPlatformInfo(selectedSubmission.platform).icon}</span>
                          </div>
                          <p className="text-lg font-medium mb-2">Content Preview Not Available</p>
                          <p className="text-sm text-center mb-4">This platform doesn't support embedding. Click below to view on the original platform.</p>
                          <a
                            href={selectedSubmission.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-button-primary"
                          >
                            View on {openVerseApi.utils.getPlatformInfo(selectedSubmission.platform).name}
                          </a>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedSubmission.isWinner && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Winner
                        </span>
                      )}
                    </div>

                    <a
                      href={selectedSubmission.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button-secondary"
                    >
                      View Original
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share & Earn Modal */}
        <AnimatePresence>
          {showShareModal && (
            <SimpleShareEarn
              trackId={id!}
              title={campaign.title}
              artist={campaign.artistId}
              rewardAmount={campaign.shareRewardUsd || 0}
              rewardCurrency="USD"
              onClose={() => setShowShareModal(false)}
              onShareComplete={(platform) => {
                console.log(`Shared on ${platform}`);
                setShowShareModal(false);
                showNotification('success', `Campaign shared on ${platform}!`);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}
