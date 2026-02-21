import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { api, Track } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { getMediaUrl } from '../lib/mediaUtils';
import { useLocation } from 'react-router-dom';
import { getAppKitModalStatus } from '../lib/appkit';
import { MobileBottomPanel } from './MobileBottomPanel';
import { SpotifyIcon } from './SpotifyIcon';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

// Base64 encoded placeholder image (simple gradient)
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA2NkZGO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjAwRkY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmFkKSIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5KYW16LmZ1bjwvdGV4dD4KPC9zdmc+';

export const MusicPlayer = React.memo(function MusicPlayer() {
  const location = useLocation();
  const isOpenVersePage = location.pathname.startsWith('/open-verse');
  const isDiscoverPage = location.pathname === '/discover';

  // Use global music player state
  const {
    tracks,
    currentTrack,
    currentTrackIndex,
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
    seekTo,
    setPlayerVisibility,
    audioRef,
    youtubePlayerRef
  } = useMusicPlayer();

  // Local UI state
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeActive, setIsVolumeActive] = useState(false);
  const volumeTimerRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const { } = useAuthStore(); // We don't need isAuthenticated here

  // All track fetching and state management is now handled by the global MusicPlayerContext

  // All audio management is now handled by the global MusicPlayerContext

  // All audio playback management is now handled by the global MusicPlayerContext

  // Handle scroll-based visibility
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) {
        setPlayerVisibility(true);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if footer is significantly visible (at least 100px of footer is visible)
      const isFooterVisible = footerRect.top < (windowHeight - 100);

      console.log('Footer detection:', {
        footerTop: footerRect.top,
        windowHeight,
        isFooterVisible,
        isPlaying,
        currentVisibility: isVisible
      });

      if (isFooterVisible) {
        // Footer is visible - always hide player (but music continues playing in background)
        console.log('Footer visible = hide player (music continues in background)');
        setPlayerVisibility(false);
      } else {
        // Footer not visible, always show player
        console.log('Footer not visible = show player');
        setPlayerVisibility(true);
      }
    };

    // Add scroll listener with throttling for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Check initial state
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, []); // No dependencies needed since we always hide at footer regardless of play state

  // Handle document clicks to close volume control
  useEffect(() => {
    if (!isVolumeActive) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // Check if click is outside the volume control
      const volumeControl = document.querySelector('.volume-control-tooltip');
      const volumeButton = document.querySelector('.volume-button');

      if (volumeControl && volumeButton) {
        if (!volumeControl.contains(e.target as Node) && !volumeButton.contains(e.target as Node)) {
          setIsVolumeActive(false);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isVolumeActive]);

  // Add keyboard shortcuts for seeking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioRef.current) return;

      // Check if user is typing in an input field, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      const isTyping = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      );

      // Check if AppKit modal is open using our tracking system
      const isAppkitModalOpen = getAppKitModalStatus();

      // Also check DOM for AppKit modal elements as fallback
      const appkitModalElement = document.querySelector('w3m-modal, appkit-modal, [data-testid="w3m-modal-card"]');
      const isAppkitModalOpenDOM = appkitModalElement && (
        appkitModalElement.classList.contains('open') ||
        appkitModalElement.hasAttribute('open') ||
        window.getComputedStyle(appkitModalElement).display !== 'none'
      );

      // Check if any modal or overlay is currently active
      const hasActiveModal = document.querySelector('.modal, [role="dialog"], [aria-modal="true"]');

      // If user is typing, AppKit modal is open, or any modal is active, don't intercept keys
      if (isTyping || isAppkitModalOpen || isAppkitModalOpenDOM || hasActiveModal) {
        return;
      }

      // Arrow right: seek forward 5 seconds
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newProgress = Math.min(100, progress + (5 / duration) * 100);
        seekTo(newProgress);
      }

      // Arrow left: seek backward 5 seconds
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newProgress = Math.max(0, progress - (5 / duration) * 100);
        seekTo(newProgress);
      }

      // Space: toggle play/pause (only when not typing and target is document body)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault(); // Prevent page scroll
        togglePlayPause();
      }

      // M key: toggle mute (desktop only, only when not typing)
      if ((e.key === 'm' || e.key === 'M') && window.innerWidth > 768) {
        e.preventDefault();
        toggleMute();
      }

      // Volume controls only on desktop (only when not typing)
      if (window.innerWidth > 768) {
        // Up arrow: increase volume (desktop only)
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const newVolume = Math.min(1, volume + 0.1);
          setVolume(newVolume);
        }

        // Down arrow: decrease volume (desktop only)
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const newVolume = Math.max(0, volume - 0.1);
          setVolume(newVolume);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isMuted, volume, progress, duration, togglePlayPause, toggleMute, setVolume, seekTo]);

  // All playback control functions are now handled by the global MusicPlayerContext

  // Desktop volume toggle
  const handleVolumeToggle = useCallback((e: React.MouseEvent) => {
    // Prevent event propagation to avoid interfering with other buttons
    e.stopPropagation();

    // On desktop, first click shows volume control
    if (!isVolumeActive) {
      setIsVolumeActive(true);
      if (volumeTimerRef.current) {
        clearTimeout(volumeTimerRef.current);
      }
      volumeTimerRef.current = window.setTimeout(() => setIsVolumeActive(false), 3000);
      return;
    }

    // Second click on desktop toggles mute
    toggleMute();
    console.log('Desktop: Mute toggled');
  }, [isVolumeActive, toggleMute]);

  // No mobile volume toggle function needed

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    console.log('Volume slider changed to:', newVolume);
    setVolume(newVolume);
    // Only set muted if volume is 0
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      // Unmute if currently muted and volume > 0
      setIsMuted(false);
    }
  }, [setVolume, isMuted]);

  const getClientXFromEvent = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent): number => {
    if ('touches' in e) {
      // Touch event
      return e.touches[0].clientX;
    } else {
      // Mouse event
      return e.clientX;
    }
  };

  const calculatePositionFromEvent = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
    if (!progressBarRef.current) return 0;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = getClientXFromEvent(e);
    const clickPosition = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const progressBarWidth = rect.width;
    return (clickPosition / progressBarWidth) * 100;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    // Handle both mouse and touch events
    let clientX: number;
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
    } else {
      // Mouse event
      clientX = e.clientX;
    }

    // Get the bounds of the progress bar
    const rect = progressBarRef.current.getBoundingClientRect();

    // Calculate the click position as a percentage of the progress bar width
    const clickPosition = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const progressBarWidth = rect.width;
    const seekPercentage = (clickPosition / progressBarWidth) * 100;

    // Use the global seekTo function
    seekTo(seekPercentage);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setHoverPosition(calculatePositionFromEvent(e));
  };

  const handleProgressMouseEnter = () => {
    setIsHoveringProgress(true);
  };

  const handleProgressMouseLeave = () => {
    setIsHoveringProgress(false);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    // Prevent default browser behavior
    e.preventDefault();

    // For touch events, prevent scrolling
    if ('touches' in e) {
      document.body.style.overflow = 'hidden';
    }

    // Pause audio while dragging for smoother experience
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      togglePlayPause(); // Use global function to pause
    }

    setIsDragging(true);

    // Initial position update
    const seekPercentage = calculatePositionFromEvent(e);
    seekTo(seekPercentage);

    // Setup event listeners for drag and release
    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      // Prevent default to avoid any browser handling
      moveEvent.preventDefault();

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (!isDragging) return;

        const newSeekPercentage = calculatePositionFromEvent(moveEvent);

        // Update hover position for tooltip
        setHoverPosition(newSeekPercentage);
      });
    };

    const handleDragEnd = (endEvent: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      // Prevent any default browser behavior
      endEvent.preventDefault();

      // Use requestAnimationFrame for smoother final update
      requestAnimationFrame(() => {

        // Get final position
        const finalSeekPercentage = calculatePositionFromEvent(endEvent);

        // Apply the seek using global function
        seekTo(finalSeekPercentage);

        // Resume playback if it was playing before
        if (wasPlaying) {
          togglePlayPause(); // Use global function to resume
        }

        // Clean up
        setIsDragging(false);
        document.removeEventListener('mousemove', handleDragMove as EventListener);
        document.removeEventListener('touchmove', handleDragMove as EventListener);
        document.removeEventListener('mouseup', handleDragEnd as EventListener);
        document.removeEventListener('touchend', handleDragEnd as EventListener);

        // Re-enable scrolling
        document.body.style.overflow = '';
      });
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleDragMove as EventListener, { passive: false } as AddEventListenerOptions);
    document.addEventListener('touchmove', handleDragMove as EventListener, { passive: false } as AddEventListenerOptions);
    document.addEventListener('mouseup', handleDragEnd as EventListener);
    document.addEventListener('touchend', handleDragEnd as EventListener);
  };

  const openSpotify = useCallback(() => {
    if (tracks.length === 0) return;

    const currentTrack = tracks[currentTrackIndex];
    if (currentTrack.spotifyUrl) {
      window.open(currentTrack.spotifyUrl, '_blank');
    }
  }, [tracks, currentTrackIndex]);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // If no tracks are available, don't render the player
  if (loading || error || tracks.length === 0 || !currentTrack) {
    return null;
  }

  return (
    <>
      {/* YouTube Player is now rendered persistently in MusicPlayerContext */}

      {/* Mobile: Unified Bottom Panel (Spotify-style) */}
      <MobileBottomPanel
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onPrevious={previousTrack}
        onNext={nextTrack}
        progress={progress}
        duration={duration}
        onSeek={seekTo}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onSpotifyOpen={openSpotify}
        isVisible={isVisible}
        youtubePlayerRef={youtubePlayerRef}
      />

      {/* Desktop: Separate Music Player */}
      {isVisible && (
        <div className="hidden md:block fixed left-0 md:left-[240px] w-full md:w-[calc(100%-240px)] z-30 bottom-0 bg-black/90 backdrop-blur-xl py-1.5 border-t border-white/10">
          {/* Very subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0066FF]/5 to-[#6600FF]/5 pointer-events-none"></div>
          <div className="relative max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-between">
              {/* Track info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={currentTrack?.coverImage ? getMediaUrl(currentTrack.coverImage) : FALLBACK_IMAGE}
                  alt={`${currentTrack?.title} Cover`}
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white truncate text-base lg:text-lg">{currentTrack?.title}</h4>
                  <p className="text-xs lg:text-sm text-white/70 truncate">{currentTrack?.artist}</p>
                </div>
              </div>

              {/* Enhanced controls */}
              <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                  onClick={previousTrack}
                  className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  title="Previous track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Only show play button if there's playable content */}
                {(currentTrack?.youtubeUrl || currentTrack?.audioFile || currentTrack?.spotifyPreviewUrl || currentTrack?.appleMusicPreviewUrl) && (
                  <button
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0066FF] to-[#6600FF] flex items-center justify-center hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePlayPause();

                      // On mobile, if it's a YouTube track and we're trying to play, manually trigger playback
                      if (currentTrack?.youtubeUrl && !isPlaying && window.innerWidth < 768) {
                        setTimeout(() => {
                          if (youtubePlayerRef.current) {
                            try {
                              youtubePlayerRef.current.playVideo();
                              console.log('Mobile player: Manually triggered YouTube playback');
                            } catch (err) {
                              console.error('Mobile player: Error triggering YouTube playback:', err);
                            }
                          }
                        }, 300);
                      }
                    }}
                    onTouchEnd={(e) => {
                      // Ensure touch events work on mobile
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                )}

                {/* Next button */}
                <button
                  onClick={nextTrack}
                  className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  title="Next track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {currentTrack?.spotifyUrl && (
                  <button
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors p-2 rounded-full"
                    onClick={openSpotify}
                    title="Open on Spotify"
                  >
                    <SpotifyIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar - Desktop only */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-white/60 font-mono min-w-[40px]">
                {formatTime((progress / 100) * duration)}
              </span>
              <div
                ref={progressBarRef}
                className="flex-1 h-2 bg-white/15 rounded-full cursor-pointer group relative"
                onClick={handleSeek}
                onMouseMove={handleProgressMouseMove}
                onMouseEnter={handleProgressMouseEnter}
                onMouseLeave={handleProgressMouseLeave}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#0066FF] to-[#6600FF] rounded-full transition-all duration-150 group-hover:h-3"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-white/60 font-mono min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
