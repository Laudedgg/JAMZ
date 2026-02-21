import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { Track } from '../lib/api';
import { getMediaUrl } from '../lib/mediaUtils';

interface HorizontalTrackScrollerProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackSelect: (track: Track, index: number) => void;
}

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23666" text-anchor="middle" dy=".3em"%3E♪%3C/text%3E%3C/svg%3E';

export function HorizontalTrackScroller({
  tracks,
  currentTrackIndex,
  onTrackSelect,
}: HorizontalTrackScrollerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get top 8 tracks
  const displayTracks = tracks.slice(0, 8);

  if (displayTracks.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-4 md:hidden">
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {displayTracks.map((track, index) => {
          const isActive = index === currentTrackIndex;
          
          return (
            <motion.div
              key={track._id || index}
              className="flex-shrink-0 snap-start"
              whileTap={{ scale: 0.95 }}
              onClick={() => onTrackSelect(track, index)}
            >
              <div
                className={`relative w-[120px] cursor-pointer transition-all duration-300 ${
                  isActive ? 'transform scale-105' : ''
                }`}
              >
                {/* Album Cover */}
                <div
                  className={`relative w-[120px] h-[120px] rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                    isActive ? 'ring-2 ring-purple-500 shadow-purple-500/50' : 'ring-1 ring-white/10'
                  }`}
                >
                  <img
                    src={track.coverImage ? getMediaUrl(track.coverImage) : FALLBACK_IMAGE}
                    alt={`${track.title} by ${track.artist}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = FALLBACK_IMAGE;
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
                      isActive ? 'opacity-60' : 'opacity-40'
                    }`}
                  />
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-10 h-10 bg-purple-600/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Track Info */}
                <div className="mt-2 px-1">
                  <h4
                    className={`text-xs font-semibold line-clamp-1 transition-colors duration-300 ${
                      isActive ? 'text-purple-400' : 'text-white/80'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hide scrollbar with CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

