import React from 'react';
import { Track } from '../lib/api';
import { YouTubeTrackPlayer, YouTubePlayerHandle } from './YouTubeTrackPlayer';

interface MobileCarouselPlayerProps {
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  youtubePlayerRef?: React.RefObject<YouTubePlayerHandle>;
  onYouTubeStateChange?: (state: number) => void;
  onYouTubeTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function MobileCarouselPlayer({
  tracks,
  currentTrack,
  currentTrackIndex,
  isPlaying,
  volume,
  youtubePlayerRef,
  onYouTubeStateChange,
  onYouTubeTimeUpdate,
}: MobileCarouselPlayerProps) {
  if (!currentTrack || tracks.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-900/40 to-black/60 rounded-xl p-4 border border-white/5 backdrop-blur-md md:hidden">
      {/* YouTube Player for YouTube Tracks - Rectangular for Mobile */}
      {currentTrack.youtubeUrl && (
        <div className="mb-4">
          <YouTubeTrackPlayer
            youtubeUrl={currentTrack.youtubeUrl}
            title={currentTrack.title}
            artist={currentTrack.artist}
            isPlaying={isPlaying}
            volume={volume}
            onStateChange={onYouTubeStateChange}
            onTimeUpdate={onYouTubeTimeUpdate}
            playerRef={youtubePlayerRef}
            aspectRatio="video"
          />
        </div>
      )}

      {/* Current Track Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">
          {currentTrack.title}
        </h3>
        <p className="text-sm text-white/60">
          {currentTrack.artist}
        </p>
      </div>
    </div>
  );
}

