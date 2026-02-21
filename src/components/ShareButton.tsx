import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Twitter, Facebook, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../lib/auth';

interface ShareButtonProps {
  campaignId: string;
  campaignTitle: string;
  onShareComplete?: (platform: string, url?: string) => void;
  isPrerequisite?: boolean;
  prerequisiteCompleted?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  campaignId,
  campaignTitle,
  onShareComplete,
  isPrerequisite = false,
  prerequisiteCompleted = false
}) => {
  const { isAuthenticated } = useAuthStore();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCompleted, setShareCompleted] = useState(prerequisiteCompleted);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  React.useEffect(() => {
    setShareCompleted(prerequisiteCompleted);
  }, [prerequisiteCompleted]);

  const shareUrl = `${window.location.origin}/unified-campaigns/${campaignId}`;
  const shareText = `Check out this amazing music campaign: ${campaignTitle}`;

  const handleShare = async (platform: string) => {
    if (shareCompleted) return;

    setIsSharing(true);
    let shareActionUrl = '';

    try {
      switch (platform) {
        case 'twitter':
          shareActionUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          window.open(shareActionUrl, '_blank', 'width=600,height=400');
          break;
        
        case 'facebook':
          shareActionUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          window.open(shareActionUrl, '_blank', 'width=600,height=400');
          break;
        
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          shareActionUrl = shareUrl;
          break;
        
        default:
          console.warn('Unknown share platform:', platform);
          return;
      }

      // Mark as completed
      setShareCompleted(true);
      setShowCompletionMessage(true);
      setShowShareMenu(false);

      // Call completion callback
      if (onShareComplete) {
        await onShareComplete(platform, shareActionUrl);
      }

      // Hide completion message after 5 seconds
      setTimeout(() => {
        setShowCompletionMessage(false);
      }, 5000);

    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getSharePlatforms = () => [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Share on Twitter'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Share on Facebook'
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: <Copy className="w-5 h-5" />,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'Copy link to clipboard'
    }
  ];

  const getButtonText = () => {
    if (shareCompleted) {
      return isPrerequisite ? 'Prerequisite Completed' : 'Shared Successfully';
    }
    return isPrerequisite ? 'Complete Share Prerequisite' : 'Share & Earn';
  };

  const getButtonIcon = () => {
    if (shareCompleted) {
      return <CheckCircle className="w-5 h-5" />;
    }
    return <Share2 className="w-5 h-5" />;
  };

  const getButtonColor = () => {
    if (shareCompleted) {
      return 'bg-green-600 hover:bg-green-700';
    }
    return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700';
  };

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={() => !shareCompleted && setShowShareMenu(!showShareMenu)}
        disabled={shareCompleted || isSharing}
        className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 ${getButtonColor()} ${
          shareCompleted ? 'cursor-default' : 'hover:scale-105'
        }`}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
        {isPrerequisite && !shareCompleted && (
          <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
            Required
          </span>
        )}
      </button>

      {/* Share Menu */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {isPrerequisite ? 'Complete Share Prerequisite' : 'Share This Campaign'}
              </h3>
              
              {isPrerequisite && (
                <p className="text-sm text-gray-600 mb-4">
                  Share this campaign on social media to become eligible for prizes
                </p>
              )}

              <div className="space-y-2">
                {getSharePlatforms().map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handleShare(platform.id)}
                    disabled={isSharing}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-colors ${platform.color} disabled:opacity-50`}
                  >
                    {platform.icon}
                    <div className="text-left">
                      <div className="font-medium">{platform.name}</div>
                      <div className="text-sm opacity-90">{platform.description}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {isPrerequisite 
                    ? 'After sharing, you\'ll be eligible to submit entries for prizes'
                    : 'Help spread the word about this amazing campaign!'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Notification */}
      <AnimatePresence>
        {showCompletionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 mt-2 bg-green-500/90 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <div className="font-semibold">
                  {isPrerequisite ? 'Share Prerequisite Completed!' : 'Thanks for Sharing!'}
                </div>
                <div className="text-sm opacity-90">
                  {isPrerequisite 
                    ? 'You can now submit entries for prizes' 
                    : 'Help us reach more music lovers!'
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentication Required Message */}
      {!isAuthenticated && isPrerequisite && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Share2 className="w-4 h-4" />
            <span>Sign in to complete share prerequisites and earn rewards</span>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
};

export default ShareButton;
