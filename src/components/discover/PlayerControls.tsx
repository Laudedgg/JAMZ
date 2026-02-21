import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  disabled = false,
  className = ''
}: PlayerControlsProps) {
  return (
    <div className={`flex items-center justify-center gap-3 md:gap-4 ${className}`}>
      {/* Previous Button - Compact on mobile */}
      <motion.button
        onClick={onPrevious}
        disabled={disabled}
        className="touch-target flex items-center justify-center w-11 h-11 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        whileTap={{ scale: 0.95 }}
        aria-label="Previous track"
      >
        <SkipBack className="w-4 md:w-5 h-4 md:h-5 text-white" />
      </motion.button>

      {/* Play/Pause Button - Slightly smaller on mobile */}
      <motion.button
        onClick={onPlayPause}
        disabled={disabled}
        className="touch-target flex items-center justify-center w-12 md:w-14 h-12 md:h-14 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 rounded-full transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-5 md:w-6 h-5 md:h-6 text-white" />
        ) : (
          <Play className="w-5 md:w-6 h-5 md:h-6 text-white ml-0.5" />
        )}
      </motion.button>

      {/* Next Button - Compact on mobile */}
      <motion.button
        onClick={onNext}
        disabled={disabled}
        className="touch-target flex items-center justify-center w-11 h-11 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        whileTap={{ scale: 0.95 }}
        aria-label="Next track"
      >
        <SkipForward className="w-4 md:w-5 h-4 md:h-5 text-white" />
      </motion.button>
    </div>
  );
}

