import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shuffle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth';

interface UsernameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UsernameSetupModal({ isOpen, onClose, onSuccess }: UsernameSetupModalProps) {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a suggested username based on wallet address
  const generateSuggestedUsername = (walletAddress: string): string => {
    const prefix = 'user';
    const suffix = walletAddress.slice(-6); // Last 6 characters
    return `${prefix}_${suffix}`;
  };

  // Generate random username suggestions
  const generateRandomUsername = (): string => {
    const adjectives = ['Cool', 'Epic', 'Awesome', 'Super', 'Mega', 'Ultra', 'Pro', 'Elite', 'Prime', 'Alpha'];
    const nouns = ['Creator', 'Artist', 'Producer', 'Mixer', 'Beat', 'Sound', 'Vibe', 'Flow', 'Wave', 'Tune'];
    const randomNum = Math.floor(Math.random() * 1000);
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${randomNum}`;
  };

  useEffect(() => {
    if (isOpen && user?.walletAddress) {
      // Set initial suggested username
      const suggested = generateSuggestedUsername(user.walletAddress);
      setUsername(suggested);
    }
  }, [isOpen, user?.walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    // Basic username validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await api.auth.setUsername(username.trim());
      
      // Update auth store
      useAuthStore.getState().setUsername(username.trim());
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to set username');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateRandom = () => {
    const randomUsername = generateRandomUsername();
    setUsername(randomUsername);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="relative w-full max-w-md glass-card p-8 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2 gradient-text">Choose Your Username</h2>
            <p className="text-white/60 text-sm">
              Set a username to identify yourself in the community
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-white">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your username"
                  className="w-full p-3 pr-12 bg-black/50 border border-white/20 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white"
                  required
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
                  title="Generate random username"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
              {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
              <p className="mt-1 text-white/40 text-xs">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 glass-button-secondary py-3 justify-center"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !username.trim()}
                className="flex-1 glass-button-primary py-3 justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting...
                  </span>
                ) : (
                  'Set Username'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
