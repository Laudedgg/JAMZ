import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Youtube, Instagram, Twitter, Music, Users, MessageCircle, ChevronRight, User, UsersRound, Sparkles, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

interface DiscoverySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const discoveryOptions = [
  {
    id: 'google-search',
    label: 'Google Search',
    icon: Search,
    description: 'Found us through search results'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    description: 'Discovered through YouTube videos or ads'
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    description: 'Found us on Instagram posts or stories'
  },
  {
    id: 'twitter-x',
    label: 'Twitter/X',
    icon: Twitter,
    description: 'Discovered through Twitter/X posts'
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: Music,
    description: 'Found us on TikTok videos'
  },
  {
    id: 'friend-word-of-mouth',
    label: 'Friend/Word of mouth',
    icon: Users,
    description: 'A friend or someone recommended us'
  },
  {
    id: 'other',
    label: 'Other',
    icon: MessageCircle,
    description: 'Tell us how you found us'
  }
];

export function DiscoverySurveyModal({ isOpen, onClose, onSuccess }: DiscoverySurveyModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'discovery' | 'userType'>(('discovery'));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [userType, setUserType] = useState<'artist' | 'fan' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscoveryNext = () => {
    if (!selectedOption) {
      setError('Please select how you discovered Jamz.fun');
      return;
    }

    if (selectedOption === 'other' && !otherText.trim()) {
      setError('Please tell us how you discovered Jamz.fun');
      return;
    }

    setError(null);
    setStep('userType');
  };

  const handleSubmit = async () => {
    if (!userType) {
      setError('Please select your user type');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await api.auth.updateDiscoverySource({
        discoverySource: selectedOption!,
        discoverySourceOther: selectedOption === 'other' ? otherText.trim() : null,
        userType
      });

      onSuccess();
      onClose();

      // Redirect based on user type
      if (userType === 'artist') {
        navigate('/artist/login');
      } else if (userType === 'fan') {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative w-full max-w-md bg-[#0a0a0a]/90 rounded-2xl p-6 overflow-hidden border border-white/10 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Close/Cancel Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200 group"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
          </button>
          {step === 'discovery' ? (
            <>
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-gradient-to-r from-primary via-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1.5 gradient-text">
                  How did you discover Jamz.fun?
                </h2>
                <p className="text-white/50 text-xs">
                  Help us understand how people find our platform
                </p>
              </div>

          {/* Options */}
          <div className="space-y-2 mb-4">
            {discoveryOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedOption === option.id;

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedOption(option.id);
                    setError(null);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-transparent hover:bg-white/5 text-white/70 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-white/50'}`} />
                    <div className="flex-1 font-medium text-sm">{option.label}</div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

              {/* Other text input */}
              {selectedOption === 'other' && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <textarea
                    id="other-text"
                    value={otherText}
                    onChange={(e) => {
                      setOtherText(e.target.value);
                      setError(null);
                    }}
                    placeholder="Please tell us how you discovered Jamz.fun..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white text-sm resize-none placeholder:text-white/30"
                    rows={2}
                    maxLength={200}
                  />
                  <p className="mt-1 text-white/30 text-xs">
                    {otherText.length}/200
                  </p>
                </motion.div>
              )}

              {error && (
                <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all duration-200 font-medium text-sm"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleDiscoveryNext}
                  disabled={!selectedOption}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/30"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              {/* User Type Selection */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-primary via-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1.5 gradient-text">
                  What brings you to Jamz.fun?
                </h2>
                <p className="text-white/50 text-xs">
                  Help us personalize your experience
                </p>
              </div>

              {/* User Type Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Artist Card */}
                <motion.button
                  type="button"
                  onClick={() => {
                    setUserType('artist');
                    setError(null);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                    userType === 'artist'
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-transparent hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      userType === 'artist' ? 'bg-primary/20' : 'bg-white/5'
                    }`}>
                      <Music className={`w-6 h-6 ${userType === 'artist' ? 'text-primary' : 'text-white/50'}`} />
                    </div>
                    <h3 className="font-semibold text-white mb-1">I'm an Artist</h3>
                    <p className="text-white/50 text-xs">Create campaigns and promote my music</p>
                  </div>
                </motion.button>

                {/* Fan Card */}
                <motion.button
                  type="button"
                  onClick={() => {
                    setUserType('fan');
                    setError(null);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                    userType === 'fan'
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-transparent hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      userType === 'fan' ? 'bg-primary/20' : 'bg-white/5'
                    }`}>
                      <UsersRound className={`w-6 h-6 ${userType === 'fan' ? 'text-primary' : 'text-white/50'}`} />
                    </div>
                    <h3 className="font-semibold text-white mb-1">I'm a Fan</h3>
                    <p className="text-white/50 text-xs">Discover music and explore campaigns</p>
                  </div>
                </motion.button>
              </div>

              {error && (
                <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setStep('discovery')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all duration-200 font-medium text-sm"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !userType}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/30"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
