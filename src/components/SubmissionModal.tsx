import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, ExternalLink } from 'lucide-react';
import { UnifiedCampaign, unifiedCampaignApi } from '../lib/unifiedCampaignApi';

interface SubmissionModalProps {
  campaign: UnifiedCampaign;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  campaign,
  onClose,
  onSuccess
}) => {
  const [platform, setPlatform] = useState<string>('');
  const [contentUrl, setContentUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!platform || !contentUrl) {
      setError('Please select a platform and provide a content URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(contentUrl);
    } catch {
      setError('Please provide a valid URL');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await unifiedCampaignApi.submit(campaign._id, platform, contentUrl);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to submit entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case 'instagram':
        return '📷';
      case 'tiktok':
        return '🎵';
      case 'youtube':
        return '📺';
      default:
        return '🎬';
    }
  };

  const getPlatformInstructions = (platformName: string) => {
    switch (platformName) {
      case 'instagram':
        return 'Share the link to your Instagram post or reel';
      case 'tiktok':
        return 'Share the link to your TikTok video';
      case 'youtube':
        return 'Share the link to your YouTube video';
      default:
        return 'Share the link to your content';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Submit Your Entry</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
              <p className="text-gray-600 text-sm">{campaign.description}</p>
            </div>

            {/* Submission Guidelines */}
            {campaign.submissionGuidelines && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Submission Guidelines</h4>
                <p className="text-blue-800 text-sm whitespace-pre-wrap">
                  {campaign.submissionGuidelines}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Platform *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {campaign.allowedPlatforms.map((platformOption) => (
                    <label
                      key={platformOption}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        platform === platformOption
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="platform"
                        value={platformOption}
                        checked={platform === platformOption}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlatformIcon(platformOption)}</span>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {platformOption}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getPlatformInstructions(platformOption)}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder={platform ? getPlatformInstructions(platform) : 'Select a platform first'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Make sure your content is public and accessible via this link
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Prize Pool Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Prize Pool</h4>
                <p className="text-purple-800 text-sm mb-2">
                  {campaign.prizePool.amount.toLocaleString()} {campaign.prizePool.currency}
                </p>
                <div className="space-y-1">
                  {campaign.prizeDistribution.map((prize, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-purple-700">#{prize.rank} Place:</span>
                      <span className="text-purple-900 font-medium">
                        {prize.amount.toLocaleString()} {campaign.prizePool.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !platform || !contentUrl}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit Entry
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Terms */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                By submitting your entry, you agree to the campaign terms and conditions. 
                Make sure your content follows the platform's community guidelines and 
                respects copyright laws.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubmissionModal;
