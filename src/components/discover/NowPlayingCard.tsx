import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Share2, ExternalLink, Lock, Play } from 'lucide-react';
import { Track } from '../../lib/api';
import { getMediaUrl } from '../../lib/mediaUtils';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { DspSheet } from './DspSheet';
import { SpotifyIcon } from '../SpotifyIcon';
import { YouTubeTrackPlayer, YouTubePlayerHandle } from '../YouTubeTrackPlayer';

interface NowPlayingCardProps {
  track: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  volume: number;
  isAuthenticated: boolean;
  userVote: 'upvote' | 'downvote' | null;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (position: number) => void;
  onVote: (voteType: 'upvote' | 'downvote') => void;
  onShare: () => void;
  youtubePlayerRef?: React.MutableRefObject<YouTubePlayerHandle | null>;
  onYouTubeStateChange?: (state: number) => void;
  onYouTubeTimeUpdate?: (currentTime: number, duration: number) => void;
  renderYouTubeInMobile?: boolean; // If true, only render YouTube in mobile layout; if false, only in desktop layout
  className?: string;
}

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23666" text-anchor="middle" dy=".3em"%3E♪%3C/text%3E%3C/svg%3E';

export function NowPlayingCard({
  track,
  isPlaying,
  progress,
  duration,
  currentTime,
  volume,
  isAuthenticated,
  userVote,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVote,
  onShare,
  youtubePlayerRef,
  onYouTubeStateChange,
  onYouTubeTimeUpdate,
  renderYouTubeInMobile = false,
  className = ''
}: NowPlayingCardProps) {
  const [isDspSheetOpen, setIsDspSheetOpen] = useState(false);

  if (!track) {
    return (
      <div className={`bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}>
        <div className="text-center text-white/70">
          <p>No track selected</p>
          <p className="text-sm mt-2 text-white/60">Select a track to start playing</p>
        </div>
      </div>
    );
  }

  const primaryDsp = track.spotifyUrl ? 'spotify' : track.appleMusicUrl ? 'apple' : track.youtubeUrl ? 'youtube' : null;

  return (
    <>
      <motion.div
        className={`overflow-hidden ${className} md:bg-gradient-to-br md:from-gray-900/80 md:to-black/80 md:backdrop-blur-xl md:rounded-2xl md:border md:border-white/10`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* MOBILE: Layout with YouTube player or cover art */}
        <div className="md:hidden">
          {/* Album artwork or YouTube player - use aspect-video (16:9) for YouTube, fixed height for cover art */}
          <div className="w-full p-3">
            {/* Show YouTube player if track has YouTube URL and props are provided */}
            {track.youtubeUrl && youtubePlayerRef && onYouTubeStateChange && onYouTubeTimeUpdate && renderYouTubeInMobile ? (
              /* YouTube player container - uses 16:9 aspect ratio to prevent clipping */
              <div className="w-full aspect-video rounded-lg bg-gray-900 border border-white/10 shadow-lg relative overflow-hidden">
                <YouTubeTrackPlayer
                  youtubeUrl={track.youtubeUrl}
                  title={track.title}
                  artist={track.artist}
                  isPlaying={isPlaying}
                  volume={volume}
                  onStateChange={onYouTubeStateChange}
                  onTimeUpdate={onYouTubeTimeUpdate}
                  playerRef={youtubePlayerRef}
                  aspectRatio="video"
                />
              </div>
            ) : (
              /* Cover art container - fixed height for non-YouTube tracks */
              <div className="w-full h-[220px] rounded-lg bg-gray-900 border border-white/10 shadow-lg relative overflow-hidden">
                <img
                  src={track.coverImage ? getMediaUrl(track.coverImage) : FALLBACK_IMAGE}
                  alt={`${track.title} by ${track.artist}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
                {/* YouTube indicator if track is from YouTube */}
                {track.youtubeUrl && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-medium shadow-lg">
                    <Play className="w-3 h-3 fill-current" />
                    <span>YouTube</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP: Original vertical layout */}
        <div className="hidden md:block">
          {/* Album Artwork or YouTube Player */}
          <div className="relative aspect-square w-full bg-gray-800">
            {/* Show YouTube player if track has YouTube URL and props are provided (desktop = !renderYouTubeInMobile) */}
            {track.youtubeUrl && youtubePlayerRef && onYouTubeStateChange && onYouTubeTimeUpdate && !renderYouTubeInMobile ? (
              <YouTubeTrackPlayer
                youtubeUrl={track.youtubeUrl}
                title={track.title}
                artist={track.artist}
                isPlaying={isPlaying}
                volume={volume}
                onStateChange={onYouTubeStateChange}
                onTimeUpdate={onYouTubeTimeUpdate}
                playerRef={youtubePlayerRef}
                aspectRatio="square"
              />
            ) : (
              <>
                <img
                  src={track.coverImage ? getMediaUrl(track.coverImage) : FALLBACK_IMAGE}
                  alt={`${track.title} by ${track.artist}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
                {/* YouTube indicator if track is from YouTube */}
                {track.youtubeUrl && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-medium shadow-lg">
                    <Play className="w-3 h-3 fill-current" />
                    <span>YouTube</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Track Info and Controls */}
          <div className="p-6 space-y-4">
            {/* Track Title and Artist */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white truncate">
                {track.title}
              </h2>
              <p className="text-sm text-white/70 truncate mt-0.5">
                {track.artist}
              </p>
            </div>

            {/* Primary Controls */}
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={onPlayPause}
              onPrevious={onPrevious}
              onNext={onNext}
            />

            {/* Progress Bar */}
            <ProgressBar
              progress={progress}
              duration={duration}
              currentTime={currentTime}
              onSeek={onSeek}
            />

            {/* Secondary Actions - Desktop only */}
            <div className="flex items-center justify-between gap-2 pt-2">
            {/* Vote Buttons */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <motion.button
                onClick={() => onVote('upvote')}
                disabled={!isAuthenticated}
                className={`touch-target flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all focus-ring ${
                  !isAuthenticated
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : userVote === 'upvote'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                whileTap={isAuthenticated ? { scale: 0.95 } : undefined}
                aria-label={isAuthenticated ? 'Upvote track' : 'Log in to vote'}
                title={isAuthenticated ? 'Upvote' : 'Log in to vote'}
              >
                {!isAuthenticated ? <Lock className="w-3 md:w-4 h-3 md:h-4" /> : <ThumbsUp className="w-3 md:w-4 h-3 md:h-4" />}
                <span className="text-xs font-medium">{track.upvotes || 0}</span>
              </motion.button>

              <motion.button
                onClick={() => onVote('downvote')}
                disabled={!isAuthenticated}
                className={`touch-target flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all focus-ring ${
                  !isAuthenticated
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : userVote === 'downvote'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                whileTap={isAuthenticated ? { scale: 0.95 } : undefined}
                aria-label={isAuthenticated ? 'Downvote track' : 'Log in to vote'}
                title={isAuthenticated ? 'Downvote' : 'Log in to vote'}
              >
                {!isAuthenticated ? <Lock className="w-3 md:w-4 h-3 md:h-4" /> : <ThumbsDown className="w-3 md:w-4 h-3 md:h-4" />}
                <span className="text-xs font-medium">{track.downvotes || 0}</span>
              </motion.button>
            </div>

            {/* Share and DSP Buttons - Compact on mobile */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <motion.button
                onClick={onShare}
                className="touch-target flex items-center justify-center w-9 md:w-10 h-9 md:h-10 bg-white/10 hover:bg-white/20 rounded-xl transition-colors focus-ring"
                whileTap={{ scale: 0.95 }}
                aria-label="Share track"
              >
                <Share2 className="w-3.5 md:w-4 h-3.5 md:h-4 text-white/70" />
              </motion.button>

              {primaryDsp && (
                <motion.button
                  onClick={() => setIsDspSheetOpen(true)}
                  className="touch-target flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all shadow-lg focus-ring"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Open streaming options"
                >
                  {primaryDsp === 'spotify' && <SpotifyIcon className="w-3.5 md:w-4 h-3.5 md:h-4" />}
                  {primaryDsp === 'apple' && <ExternalLink className="w-3.5 md:w-4 h-3.5 md:h-4" />}
                  {primaryDsp === 'youtube' && <ExternalLink className="w-3.5 md:w-4 h-3.5 md:h-4" />}
                  <span className="text-xs md:text-sm font-medium text-white">
                    Stream
                  </span>
                </motion.button>
              )}
            </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* DSP Bottom Sheet */}
      <DspSheet
        isOpen={isDspSheetOpen}
        onClose={() => setIsDspSheetOpen(false)}
        track={track}
      />
    </>
  );
}

