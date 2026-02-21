import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Share2, X, Youtube, Instagram, Music2, Heart, ExternalLink, CheckCircle2, Sparkles, Twitter, Facebook, Music } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { useModal } from '../lib/modalContext';
import { YouTubePlayer } from './YouTubePlayer';
import { CustomLoginButton } from './CustomLoginButton';
import { formatMultipleCurrencies } from '../lib/currencyUtils';
import SimpleShareEarn from './SimpleShareEarn';

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

interface PlatformReward {
  usdt: number;
  jamz: number;
  ngn?: number;
  aed?: number;
}

interface Campaign {
  _id: string;
  title: string;
  youtubeUrl: string;
  spotifyUrl: string;
  appleUrl: string;
  challengeRewardUsd?: number;
  challengeRewardUsdt?: number; // For backward compatibility
  challengeRewardJamz: number;
  challengeRewardNgn: number;
  challengeRewardAed: number;
  shareRewardUsd?: number;
  shareRewardUsdt?: number; // For backward compatibility
  shareRewardJamz: number;
  shareRewardNgn: number;
  shareRewardAed: number;
  artistId: {
    name: string;
    imageUrl: string;
  };
  showcaseId: {
    _id: string;
    title: string;
    description: string;
    status: string;
    isActive: boolean;
  };
}

// Track Details View Component
const TrackDetailsView = ({ track }: { track: Track }) => {
  const { getMediaUrl } = require('../lib/mediaUtils');

  const videoId = track.youtubeUrl ? getYouTubeVideoId(track.youtubeUrl) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => window.history.back()}
          className="mb-6 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player */}
            <div className="glass-card overflow-hidden">
              {videoId ? (
                <YouTubePlayer
                  videoId={videoId}
                  onReady={() => {}}
                  onStateChange={() => {}}
                />
              ) : (
                <div className="aspect-video bg-black/50 flex items-center justify-center">
                  <img
                    src={track.coverImage ? getMediaUrl(track.coverImage) : '/placeholder-album.svg'}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="glass-card p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{track.title}</h1>
              <p className="text-xl text-white/60 mb-6">{track.artist}</p>

              {/* DSP Links */}
              <div className="flex flex-wrap gap-3">
                {track.spotifyUrl && (
                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button flex items-center gap-2"
                  >
                    <Music2 className="w-4 h-4" />
                    Spotify
                  </a>
                )}
                {track.appleMusicUrl && (
                  <a
                    href={track.appleMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button flex items-center gap-2"
                  >
                    <Music2 className="w-4 h-4" />
                    Apple Music
                  </a>
                )}
                {track.youtubeUrl && (
                  <a
                    href={track.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Track Cover */}
            <div className="glass-card overflow-hidden">
              <img
                src={track.coverImage ? getMediaUrl(track.coverImage) : '/placeholder-album.svg'}
                alt={track.title}
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Track Info Card */}
            <div className="glass-card p-6 space-y-4">
              <div>
                <p className="text-white/60 text-sm mb-1">Artist</p>
                <p className="text-white font-semibold">{track.artist}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Duration</p>
                <p className="text-white font-semibold">{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Track ID</p>
                <p className="text-white/80 text-xs font-mono break-all">{track._id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const PlatformButton = ({
  icon,
  platform,
  rewards,
  selected,
  onClick
}: {
  icon: React.ReactNode;
  platform: string;
  rewards: PlatformReward;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl ${
        selected
          ? 'bg-[#6600FF] text-white'
          : 'bg-[#1A1E2E] hover:bg-[#232738] text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{platform}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-md px-4 py-2 bg-[#3A1E7F]">
          <div className="flex items-baseline gap-1">
            <span className="text-white text-xl font-bold">${rewards.usdt}</span>
            <span className="text-white/80 text-xs font-medium">USD</span>
          </div>
        </div>
        <div className="rounded-md px-4 py-2 bg-[#3F1E3F]">
          <div className="flex items-baseline gap-1">
            <span className="text-[#FF3366] text-xl font-bold">{rewards.jamz}</span>
            <span className="text-[#FF3366]/80 text-xs font-medium">JAMZ</span>
          </div>
        </div>
      </div>
    </button>
  );
};

interface Track {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioFile?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  spotifyPreviewUrl?: string;
  appleMusicUrl?: string;
  appleMusicPreviewUrl?: string;
  duration: number;
}

export function TrackDetails() {
  const { id } = useParams();
  const { walletAddress } = useAuthStore();
  const { openModal, closeModal } = useModal();
  const [showChallenge, setShowChallenge] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedPlatform, setSubmittedPlatform] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [referralUrl, setReferralUrl] = useState<string>('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchTrackAndCampaign();
    if (walletAddress) {
      fetchReferralStats();
    }
  }, [id, walletAddress]);

  // Auto-generate referral link when share modal opens
  useEffect(() => {
    if (showShare && walletAddress && campaign?._id && !referralUrl) {
      generateReferralLink();
    }
  }, [showShare, walletAddress, campaign?._id, referralUrl]);

  // Listen for wallet connection
  useEffect(() => {
    console.log('Wallet address changed:', walletAddress);
  }, [walletAddress]);

  const fetchTrackAndCampaign = async () => {
    try {
      if (!id) return;

      // First try to fetch as a track
      try {
        const trackData = await api.tracks.get(id);
        setTrack(trackData);
        setLoading(false);
        return;
      } catch (trackError) {
        // If track not found, try to fetch as campaign
        console.log('Track not found, trying campaign...');
      }

      // If not a track, try campaign
      const data = await api.campaigns.get(id);

      // Log campaign data for debugging
      console.log('Campaign data:', data);
      console.log('Reward values:', {
        challengeRewardUsd: data.challengeRewardUsd,
        challengeRewardUsdt: data.challengeRewardUsdt,
        shareRewardUsd: data.shareRewardUsd,
        shareRewardUsdt: data.shareRewardUsdt,
        // Calculate what will be displayed
        displayChallengeReward: data.challengeRewardUsd ?? data.challengeRewardUsdt ?? 0,
        displayShareReward: data.shareRewardUsd ?? data.shareRewardUsdt ?? 0
      });

      setCampaign(data);
    } catch (err: any) {
      console.error('Error fetching campaign:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const stats = await api.referrals.getStats();
      setReferralStats(stats);
    } catch (err: any) {
      console.error('Error fetching referral stats:', err);
      // Don't show error notification for stats, it's not critical
    }
  };

  const generateReferralLink = async () => {
    try {
      if (!campaign?._id) {
        showNotification('error', 'Campaign not loaded');
        return;
      }

      console.log('Generating referral link for campaign:', campaign._id);
      const result = await api.referrals.generate(campaign._id);
      console.log('Referral link generated:', result);
      setReferralUrl(result.referralUrl);

      // Refresh stats
      fetchReferralStats();
    } catch (err: any) {
      console.error('Error generating referral link:', err);
      showNotification('error', `Failed to generate referral link: ${err.message || 'Unknown error'}`);
    }
  };

  // Add overflow hidden to body when modal is open and update modal context
  useEffect(() => {
    if (showChallenge || showShare || showSuccessModal) {
      document.body.style.overflow = 'hidden';
      openModal(); // Tell the app a modal is open
    } else {
      document.body.style.overflow = '';
      closeModal(); // Tell the app no modal is open
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = '';
      closeModal();
    };
  }, [showChallenge, showShare, showSuccessModal, openModal, closeModal]);

  const ChallengeModal = () => {
    return (
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
        onClick={() => setShowChallenge(false)}
      >
        <div
          className="bg-[#0F1221] backdrop-blur-xl rounded-2xl max-w-xl w-full p-6 relative"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setShowChallenge(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold text-blue-400">Challenge 2 Earn</h3>
            <p className="text-white/60 text-sm mt-1">Create content and earn rewards</p>
          </div>

          {/* Important Eligibility Notice */}
          <div className="bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <div className="text-orange-300 font-semibold mb-2">⚠️ Eligibility Requirement</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  You must watch the artist's YouTube video at least once to be eligible for challenge rewards.
                  Our AI algorithm verifies all activities for authenticity.
                </p>
              </div>
            </div>
          </div>

          {/* Platform selection */}
          <div className="space-y-4 mb-6">
            <PlatformButton
              icon={<Music2 className="w-5 h-5" />}
              platform="TikTok"
              rewards={{
                usdt: campaign?.challengeRewardUsd ?? campaign?.challengeRewardUsdt ?? 0,
                jamz: campaign?.challengeRewardJamz || 0
              }}
              selected={selectedPlatform === 'tiktok'}
              onClick={() => setSelectedPlatform('tiktok')}
            />
            <PlatformButton
              icon={<Instagram className="w-5 h-5" />}
              platform="Instagram"
              rewards={{
                usdt: campaign?.challengeRewardUsd ?? campaign?.challengeRewardUsdt ?? 0,
                jamz: campaign?.challengeRewardJamz || 0
              }}
              selected={selectedPlatform === 'instagram'}
              onClick={() => setSelectedPlatform('instagram')}
            />
            <PlatformButton
              icon={<Youtube className="w-5 h-5" />}
              platform="YouTube"
              rewards={{
                usdt: campaign?.challengeRewardUsd ?? campaign?.challengeRewardUsdt ?? 0,
                jamz: campaign?.challengeRewardJamz || 0
              }}
              selected={selectedPlatform === 'youtube'}
              onClick={() => setSelectedPlatform('youtube')}
            />
          </div>

          {/* URL input and submit */}
          <div className="space-y-6 pb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Your {selectedPlatform || "Platform"} Link
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={`Paste your ${selectedPlatform || "platform"} video link`}
                className="w-full px-4 py-3 rounded-xl bg-[#1A1E2E] border border-[#2A2E3E] text-white"
                disabled={!selectedPlatform || submitting}
              />
              {challengeError && (
                <p className="mt-2 text-sm text-red-500">{challengeError}</p>
              )}
              {!challengeError && (
                <p className="mt-2 text-sm text-white/60">
                  Select a platform and paste your video link to submit a challenge
                </p>
              )}
            </div>

            {!walletAddress ? (
              <div className="space-y-2">
                <p className="text-sm text-white/60">Connect your wallet to submit challenge</p>
                <CustomLoginButton />
              </div>
            ) : (
              <button
                className="w-full py-3 text-base font-medium rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white"
                onClick={async () => {
                  if (!selectedPlatform) {
                    setChallengeError("Please select a platform first");
                    return;
                  }

                  try {
                    setSubmitting(true);
                    setChallengeError(null);

                    if (!videoUrl) {
                      throw new Error('Please enter a video URL');
                    }

                    if (!campaign) return;

                    try {
                      await api.challenges.submit({
                        campaignId: campaign._id,
                        platform: selectedPlatform?.toLowerCase() as any,
                        videoUrl
                      });

                      // Store the submitted platform for the success modal
                      setSubmittedPlatform(selectedPlatform);

                      // Close the challenge modal and show the success modal
                      setShowChallenge(false);
                      setShowSuccessModal(true);

                      // Reset form
                      setVideoUrl('');
                      setSelectedPlatform(null);
                    } catch (err: any) {
                      console.error('Challenge submission error:', err);

                      // Display more user-friendly error messages
                      if (err.message.includes('maximum number of challenges')) {
                        setChallengeError('You have already submitted 3 challenges for this campaign. You can\'t submit more.');
                      } else if (err.message.includes('already submitted a')) {
                        setChallengeError(`You have already submitted a challenge for ${selectedPlatform}. Try another platform!`);
                      } else if (err.message.includes('Invalid')) {
                        setChallengeError(`Please enter a valid ${selectedPlatform} URL`);
                      } else {
                        setChallengeError(err.message);
                      }
                    }
                  } catch (err: any) {
                    setChallengeError(err.message);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!selectedPlatform || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Challenge'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ShareModal = () => {
    const shareToX = () => {
      // Use campaign URL with referral parameter if available, otherwise use basic URL
      const baseUrl = `${window.location.origin}/track/${id}`;
      const shareUrl = referralUrl || baseUrl;

      const text = `Check out this amazing track: ${campaign?.title} by ${campaign?.artistId?.name}! 🎵`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');

      if (referralUrl) {
        showNotification('success', 'Shared to X! You\'ll earn rewards when people join through your link.');
      } else {
        showNotification('success', 'Shared to X!');
      }
    };

    const shareToFacebook = () => {
      // Use campaign URL with referral parameter if available, otherwise use basic URL
      const baseUrl = `${window.location.origin}/track/${id}`;
      const shareUrl = referralUrl || baseUrl;

      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(facebookUrl, '_blank', 'width=550,height=420');

      if (referralUrl) {
        showNotification('success', 'Shared to Facebook! You\'ll earn rewards when people join through your link.');
      } else {
        showNotification('success', 'Shared to Facebook!');
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={() => setShowShare(false)}
      >
        <div
          className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1221] border border-purple-500/20 rounded-xl max-w-md w-full p-5 relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setShowShare(false)}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>

          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Share & Earn</h3>
            <p className="text-white/50 text-xs mt-1">Earn rewards when people join through your link</p>
          </div>

          {/* Important Eligibility Notice */}
          <div className="bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs">
                <div className="text-orange-300 font-semibold mb-1">Eligibility Requirements:</div>
                <ul className="text-white/70 space-y-1 text-xs">
                  <li>• You must watch the artist's YouTube video at least once to be eligible for rewards</li>
                  <li>• Referred users must join a showcase on the platform for you to earn referral rewards</li>
                  <li>• Our AI algorithm verifies all activities for authenticity</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reward Info */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Reward per completion</span>
              <RewardBadge
                usdt={campaign?.shareRewardUsd ?? campaign?.shareRewardUsdt ?? 0}
                jamz={campaign?.shareRewardJamz || 0}
                ngn={campaign?.shareRewardNgn || 0}
                aed={campaign?.shareRewardAed || 0}
              />
            </div>
          </div>

          {/* Referral Stats - Compact */}
          {referralStats && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-white/50">Total:</span>
                    <span className="ml-1 font-semibold text-white">{referralStats.totalReferrals}</span>
                  </div>
                  <div>
                    <span className="text-white/50">Completed:</span>
                    <span className="ml-1 font-semibold text-green-400">{referralStats.completedReferrals}</span>
                  </div>
                </div>
                {(referralStats.totalRewardsEarned.usd > 0 || referralStats.totalRewardsEarned.jamz > 0) && (
                  <div className="text-right">
                    <div className="text-xs text-white/50">Earned</div>
                    <div className="flex items-center gap-1 text-xs">
                      {referralStats.totalRewardsEarned.usd > 0 && (
                        <span className="text-green-400 font-semibold">${referralStats.totalRewardsEarned.usd}</span>
                      )}
                      {referralStats.totalRewardsEarned.jamz > 0 && (
                        <span className="text-purple-400 font-semibold">{referralStats.totalRewardsEarned.jamz} JAMZ</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Sharing Buttons - Compact */}
          <div className="space-y-2">
            <button
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-[#1DA1F2] hover:bg-[#1a91da] text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              onClick={shareToX}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X (Twitter)
            </button>

            <button
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              onClick={shareToFacebook}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
              </svg>
              Share on Facebook
            </button>

            <button
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              onClick={() => {
                const baseUrl = `${window.location.origin}/track/${id}`;
                const shareUrl = referralUrl || baseUrl;
                navigator.clipboard.writeText(shareUrl);

                if (referralUrl) {
                  showNotification('success', 'Referral link copied to clipboard!');
                } else {
                  showNotification('success', 'Link copied to clipboard!');
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Link
            </button>
          </div>

          {!walletAddress && (
            <div className="mt-3 p-2.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-xs text-center">Connect wallet to earn rewards!</p>
            </div>
          )}

          {referralUrl && (
            <div className="mt-3 bg-black/20 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-2">Your referral link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white/80 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralUrl);
                    showNotification('success', 'Link copied to clipboard!');
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded text-xs font-medium transition-all hover:scale-105"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };


  const SuccessModal = () => {
    // Get the appropriate icon based on the platform
    const getPlatformIcon = () => {
      switch (submittedPlatform?.toLowerCase()) {
        case 'tiktok':
          return <Music2 className="w-8 h-8 text-white" />;
        case 'instagram':
          return <Instagram className="w-8 h-8 text-white" />;
        case 'youtube':
          return <Youtube className="w-8 h-8 text-white" />;
        default:
          return <Trophy className="w-8 h-8 text-white" />;
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
        onClick={() => setShowSuccessModal(false)}
      >
        <div
          className="bg-[#0F1221] backdrop-blur-xl rounded-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setShowSuccessModal(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Success content */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Challenge Submitted!</h3>
              <p className="text-white/60 mb-6">
                Your {submittedPlatform} challenge has been submitted successfully.
                Our team will review it shortly.
              </p>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Your reward</span>
                  <RewardBadge
                    usdt={campaign?.challengeRewardUsd ?? campaign?.challengeRewardUsdt ?? 0}
                    jamz={campaign?.challengeRewardJamz || 0}
                  />
                </div>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="glass-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!campaign && !track) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Track or campaign not found</p>
        </div>
      </div>
    );
  }

  // If it's a track, render track details
  if (track && !campaign) {
    return <TrackDetailsView track={track} />;
  }

  const videoId = getYouTubeVideoId(campaign?.youtubeUrl || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="glass-card overflow-hidden">
              {videoId ? (
                <YouTubePlayer
                  videoId={videoId}
                  onReady={() => {}}
                  onStateChange={() => {}}
                />
              ) : (
                <div className="aspect-video bg-black/50 flex items-center justify-center">
                  <p className="text-white/60">No video available</p>
                </div>
              )}
            </div>

            {/* Campaign Info */}
            <div className="glass-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={campaign.artistId?.imageUrl || '/default-artist.jpg'}
                  alt={campaign.artistId?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">{campaign.title}</h1>
                  <p className="text-white/60 mb-3">{campaign.artistId?.name}</p>

                  {/* Artist Social Media Links */}
                  {campaign.artistId?.socialMedia && (
                    <div className="flex items-center gap-3">
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
                          className="flex items-center justify-center w-8 h-8 bg-black rounded-full hover:scale-110 transition-transform"
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
                          className="flex items-center justify-center w-8 h-8 bg-black rounded-full hover:scale-110 transition-transform"
                          title="Follow on TikTok"
                        >
                          <Music className="w-4 h-4 text-white" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  className="glass-button-primary"
                  onClick={() => {
                    if (campaign?.showcaseId?._id) {
                      window.open(`/open-verse/${campaign.showcaseId._id}`, '_blank');
                    }
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                  Join Showcase
                </button>
                <button
                  className="glass-button"
                  onClick={() => setShowShare(true)}
                >
                  <Share2 className="w-5 h-5" />
                  <div className="flex flex-col items-start">
                    <span>Share & Earn</span>
                    {referralStats && (
                      <span className="text-xs text-green-400">
                        {referralStats.completedReferrals} referrals completed
                      </span>
                    )}
                  </div>
                </button>
                <button className="glass-button">
                  <Heart className="w-5 h-5" />
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Rewards Panel */}
          <div className="glass-card p-6 backdrop-blur-xl h-fit">
            <h2 className="text-xl font-bold mb-6">Rewards</h2>

            <div className="space-y-6">
              {/* Share & Earn Section */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-black/30 px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[#6600FF]" />
                    <h3 className="font-semibold">Share & Earn</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Per Share</span>
                    <RewardBadge
                      usdt={campaign.shareRewardUsd ?? campaign.shareRewardUsdt ?? 0}
                      jamz={campaign.shareRewardJamz}
                      ngn={campaign.shareRewardNgn}
                      aed={campaign.shareRewardAed}
                    />
                  </div>
                </div>
              </div>

              {/* External Links */}
              <div className="space-y-3">
                {campaign.appleUrl && (
                  <a
                    href={campaign.appleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full glass-button flex items-center justify-center gap-3 hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Listen on Apple Music
                  </a>
                )}

                {campaign.spotifyUrl && (
                  <a
                    href={campaign.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full glass-button flex items-center justify-center gap-3 hover:bg-green-500/20 transition-colors"
                  >
                    <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Listen on Spotify
                  </a>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showChallenge && <ChallengeModal key="challenge-modal" />}
        {showShare && (
          <SimpleShareEarn
            key="share-modal"
            trackId={id}
            title={campaign?.title || 'Unknown Track'}
            artist={campaign?.artistId}
            rewardAmount={campaign?.shareRewardUsd || campaign?.shareRewardUsdt || 0}
            rewardCurrency="USD"
            onClose={() => setShowShare(false)}
            onShareComplete={(platform) => {
              console.log(`Shared on ${platform}`);
              setShowShare(false);
            }}
          />
        )}
        {showSuccessModal && <SuccessModal key="success-modal" />}
        {notification && (
          <motion.div
            key="notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`notification-toast px-6 py-3 rounded-lg font-medium ${
              notification.type === 'success'
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            <span className="text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
