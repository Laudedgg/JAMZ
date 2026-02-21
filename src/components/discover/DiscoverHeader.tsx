import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Play, Music, Heart, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

interface DiscoverHeaderProps {
  className?: string;
  compact?: boolean; // For mobile fixed header - show minimal version
}

export function DiscoverHeader({ className = '', compact = false }: DiscoverHeaderProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Compact version for mobile fixed header - collapsible dropdown
  if (compact) {
    return (
      <motion.div
        className={`${className}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg overflow-hidden">
          {/* Always visible header row */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 active:bg-white/5"
          >
            <h1 className="text-sm font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              The JAMZ 100 Playlist
            </h1>
            <span className="flex items-center gap-1 text-[10px] text-purple-400 font-medium">
              {isExpanded ? 'Show less' : 'Learn more'}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </span>
          </button>

          {/* Expandable content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-0 border-t border-white/10">
                  {/* Subtitle */}
                  <p className="text-[11px] text-white/60 mt-2">
                    The only discovery playlist in the world with no bad song
                  </p>

                  {/* Description */}
                  <p className="text-[11px] text-white/70 leading-relaxed mt-2">
                    <span className="text-white font-medium">~100 tracks of pure heat.</span> Mostly newly released bangers with a few OG tracks to keep the vibes right. Watch videos, vote on tracks, and stream directly on your favorite DSPs.
                  </p>

                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                      <RefreshCw className="w-2.5 h-2.5 text-purple-400" />
                      <span className="text-[9px] text-white/60">Updated Daily</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                      <Play className="w-2.5 h-2.5 text-pink-400" />
                      <span className="text-[9px] text-white/60">Video Player</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                      <ThumbsUp className="w-2.5 h-2.5 text-blue-400" />
                      <span className="text-[9px] text-white/60">Voting System</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                      <Music className="w-2.5 h-2.5 text-green-400" />
                      <span className="text-[9px] text-white/60">DSP Links</span>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-500/10 rounded-full px-2 py-0.5">
                      <Heart className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400">100% Organic</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Full version for desktop
  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Main header container box */}
      <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 lg:p-6 border border-white/10 shadow-xl mb-5">
        {/* Top row with title and user badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              The JAMZ 100 Playlist
            </h1>
            <p className="text-sm text-white/60 mt-1">
              The only discovery playlist in the world with no bad song
            </p>
          </div>

          {/* User Profile Badge - Only show if authenticated */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-full border border-white/10 ml-4">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-white/80">
                {user.username}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-4"></div>

        {/* Description */}
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          <span className="text-white font-medium">~100 tracks of pure heat.</span> Mostly newly released bangers with a few OG tracks to keep the vibes right. Watch videos, vote on tracks, and stream directly on your favorite DSPs.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full">
            <RefreshCw className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-white/60">Updated Daily</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full">
            <Play className="w-3 h-3 text-pink-400" />
            <span className="text-xs text-white/60">Video Player</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full">
            <ThumbsUp className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-white/60">Voting System</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full">
            <Music className="w-3 h-3 text-green-400" />
            <span className="text-xs text-white/60">DSP Links</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
            <Heart className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400">100% Organic</span>
          </div>
        </div>
      </div>

      {/* Queue label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white/50">Queue</span>
      </div>
    </motion.div>
  );
}


