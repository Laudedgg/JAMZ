import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getAppKitModalStatus } from '../lib/appkit';
import { MobileBottomPanel } from './MobileBottomPanel';
import { SpotifyIcon } from './SpotifyIcon';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getMediaUrl } from '../lib/mediaUtils';

// Base64 encoded placeholder image (simple gradient)
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA2NkZGO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjAwRkY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmFkKSIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5KYW16LmZ1bjwvdGV4dD4KPC9zdmc+';

export function MusicPlayerUI() {
  const location = useLocation();
  const isOpenVersePage = location.pathname.startsWith('/open-verse');

  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    loading,
    error,
    isVisible,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    seekTo
  } = useMusicPlayer();

  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeActive, setIsVolumeActive] = useState(false);
  const volumeTimerRef = useRef<number | null>(null);

  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Don't render if no current track or if loading
  if (loading || error || !currentTrack) {
    return null;
  }

  // Hide player on certain pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/artist')) {
    return null;
  }

  // Check if AppKit modal is open
  const isAppKitModalOpen = getAppKitModalStatus();
  if (isAppKitModalOpen) {
    return null;
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPosition = ((e.clientX - rect.left) / rect.width) * 100;
      seekTo(clickPosition);
    }
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const hoverPos = ((e.clientX - rect.left) / rect.width) * 100;
      setHoverPosition(Math.max(0, Math.min(100, hoverPos)));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleVolumeMouseEnter = () => {
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
    }
    setIsVolumeActive(true);
  };

  const handleVolumeMouseLeave = () => {
    volumeTimerRef.current = window.setTimeout(() => {
      setIsVolumeActive(false);
    }, 1000);
  };

  const currentTime = (progress / 100) * duration;

  // Get cover image URL
  const coverImageUrl = currentTrack.coverImage 
    ? getMediaUrl(currentTrack.coverImage) 
    : FALLBACK_IMAGE;

  return (
    <>
      {/* Desktop Player */}
      <motion.div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } transition-transform duration-300 hidden md:block`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Track Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                <img
                  src={coverImageUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-white font-medium text-sm truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-white/60 text-xs truncate">
                  {currentTrack.artist}
                </p>
              </div>
              {currentTrack.spotifyUrl && (
                <button
                  onClick={() => window.open(currentTrack.spotifyUrl, '_blank')}
                  className="text-white/60 hover:text-white transition-colors"
                  title="Open on Spotify"
                >
                  <SpotifyIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Player Controls */}
            <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
              <div className="flex items-center space-x-4">
                <button
                  onClick={previousTrack}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-black" />
                  ) : (
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  )}
                </button>
                <button
                  onClick={nextTrack}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center space-x-2 w-full">
                <span className="text-xs text-white/60 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <div
                  ref={progressBarRef}
                  className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative group"
                  onClick={handleProgressClick}
                  onMouseMove={handleProgressMouseMove}
                  onMouseEnter={() => setIsHoveringProgress(true)}
                  onMouseLeave={() => setIsHoveringProgress(false)}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                  {isHoveringProgress && (
                    <div
                      className="absolute top-0 h-full bg-white/50 rounded-full pointer-events-none"
                      style={{ width: `${hoverPosition}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-white/60 w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <div
                className="relative"
                onMouseEnter={handleVolumeMouseEnter}
                onMouseLeave={handleVolumeMouseLeave}
              >
                <button
                  onClick={toggleMute}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                {isVolumeActive && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-xl rounded-lg p-2 border border-white/10">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Player */}
      <MobileBottomPanel
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onNext={nextTrack}
        onPrevious={previousTrack}
        progress={progress}
        duration={duration}
        onSeek={seekTo}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        isVisible={isVisible}
      />
    </>
  );
}
