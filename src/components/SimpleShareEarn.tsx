import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Facebook, Copy, CheckCircle, X } from 'lucide-react';
import { useAuthStore } from '../lib/auth';

interface Artist {
  _id: string;
  name: string;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface SimpleShareEarnProps {
  trackId?: string;
  campaignId?: string;
  title: string;
  artist?: Artist;
  rewardAmount: number;
  rewardCurrency: string;
  onClose: () => void;
  onShareComplete?: (platform: string) => void;
}

const SimpleShareEarn: React.FC<SimpleShareEarnProps> = ({
  trackId,
  campaignId,
  title,
  artist,
  rewardAmount,
  rewardCurrency,
  onClose,
  onShareComplete
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate share URL based on whether it's a track or campaign
  const shareUrl = trackId
    ? `${window.location.origin}/track/${trackId}`
    : `${window.location.origin}/unified-campaigns/${campaignId}`;

  // Create share text with artist tagging
  const createShareText = (platform: 'twitter' | 'facebook') => {
    let baseText = `Check out this amazing track: ${title}`;

    if (artist) {
      baseText += ` by ${artist.name}`;

      // Add artist social media tag if available
      if (platform === 'twitter' && artist.socialMedia?.twitter) {
        const twitterHandle = artist.socialMedia.twitter.startsWith('@')
          ? artist.socialMedia.twitter
          : `@${artist.socialMedia.twitter}`;
        baseText += ` ${twitterHandle}`;
      } else if (platform === 'facebook' && artist.socialMedia?.facebook) {
        baseText += ` (${artist.socialMedia.facebook})`;
      }
    }

    baseText += '! 🎵';
    return baseText;
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy') => {
    setIsSharing(true);

    try {
      let shareText: string;
      let shareActionUrl: string;

      switch (platform) {
        case 'twitter':
          shareText = createShareText('twitter');
          shareActionUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          window.open(shareActionUrl, '_blank', 'width=600,height=400');
          break;

        case 'facebook':
          shareText = createShareText('facebook');
          shareActionUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
          window.open(shareActionUrl, '_blank', 'width=600,height=400');
          break;

        case 'copy':
          shareText = createShareText('twitter');
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;
      }

      // Simulate reward earning
      setTimeout(() => {
        onShareComplete?.(platform);
        setIsSharing(false);
      }, 1000);

    } catch (error) {
      console.error('Error sharing:', error);
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 border border-purple-500/20 shadow-2xl shadow-purple-500/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Share & Earn
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6">
          Share this track on social media to earn rewards
        </p>

        {/* Share Buttons */}
        <div className="space-y-3">
          {/* Twitter Share */}
          <button
            onClick={() => handleShare('twitter')}
            disabled={isSharing || !isAuthenticated}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/25"
          >
            <Twitter className="w-5 h-5" />
            Share on X (Twitter)
          </button>

          {/* Facebook Share */}
          <button
            onClick={() => handleShare('facebook')}
            disabled={isSharing || !isAuthenticated}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-600/25"
          >
            <Facebook className="w-5 h-5" />
            Share on Facebook
          </button>

          {/* Copy Link */}
          <button
            onClick={() => handleShare('copy')}
            disabled={isSharing}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-600/25"
          >
            {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Wallet Connection Notice */}
        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-amber-300 text-sm text-center font-medium">
              Connect wallet to earn rewards!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SimpleShareEarn;