import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { extractYouTubeVideoId } from '../lib/youtubeUtils';
import { AlertCircle } from 'lucide-react';

interface YouTubeTrackPlayerProps {
  youtubeUrl: string;
  title: string;
  artist: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  autoplay?: boolean;
  isPlaying?: boolean;
  volume?: number;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  playerRef?: React.MutableRefObject<YouTubePlayerHandle | null>;
  aspectRatio?: 'square' | 'video'; // New prop to control aspect ratio
}

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  getPlayerState: () => number;
  // CRITICAL FOR MOBILE: Load and play a video in one call, synchronously within user gesture
  loadVideoById: (videoId: string) => void;
}

declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function YouTubeTrackPlayer({
  youtubeUrl,
  title,
  artist,
  onReady,
  onError,
  autoplay = false,
  isPlaying = false,
  volume = 0.7,
  onStateChange,
  onTimeUpdate,
  playerRef: externalPlayerRef,
  aspectRatio = 'square' // Default to square for backward compatibility
}: YouTubeTrackPlayerProps) {
  console.log('🎬🎬🎬 YouTubeTrackPlayer COMPONENT RENDERED', {
    youtubeUrl,
    title,
    artist,
    isPlaying,
    hasExternalRef: !!externalPlayerRef,
    aspectRatio
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const internalPlayerRef = useRef<any>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);
  const onStateChangeRef = useRef(onStateChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingPlayRef = useRef<boolean>(false); // Track if play was requested before player was ready

  const videoId = extractYouTubeVideoId(youtubeUrl);

  console.log('🎬 YouTubeTrackPlayer videoId extracted:', videoId);

  // Update refs when callbacks change
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onStateChange, onTimeUpdate]);

  // CRITICAL MOBILE FIX: Expose player methods through ref using useLayoutEffect
  // This runs synchronously after render but before browser paint, ensuring the ref
  // is available immediately when the component mounts (critical for mobile user gestures)
  useLayoutEffect(() => {
    console.log('Ref exposure effect running:', { hasExternalRef: !!externalPlayerRef, hasInternalPlayer: !!internalPlayerRef.current, isLoaded });

    if (externalPlayerRef) {
      console.log('Exposing YouTube player methods through ref');
      externalPlayerRef.current = {
        play: () => {
          console.log('🎬 Ref method: play() called');
          const playerState = internalPlayerRef.current?.getPlayerState?.();
          console.log('Player state:', playerState, '(1=playing, 2=paused, 5=cued, -1=unstarted)');

          try {
            if (internalPlayerRef.current?.playVideo) {
              console.log('Calling playVideo()...');
              internalPlayerRef.current.playVideo();
              console.log('✅ playVideo() executed successfully');
              pendingPlayRef.current = false;
            } else {
              console.warn('⚠️ playVideo method not available yet, queuing play request');
              pendingPlayRef.current = true;
            }
          } catch (err) {
            console.error('❌ Error calling playVideo():', err);
          }
        },
        pause: () => {
          console.log('⏸️ Ref method: pause() called');
          try {
            if (internalPlayerRef.current?.pauseVideo) {
              internalPlayerRef.current.pauseVideo();
              console.log('✅ pauseVideo() executed successfully');
            } else {
              console.error('❌ pauseVideo method not available');
            }
          } catch (err) {
            console.error('❌ Error calling pauseVideo():', err);
          }
        },
        setVolume: (vol: number) => {
          console.log('🔊 Ref method: setVolume() called with:', vol);
          try {
            internalPlayerRef.current?.setVolume?.(Math.round(vol * 100));
          } catch (err) {
            console.error('❌ Error calling setVolume():', err);
          }
        },
        getVolume: () => (internalPlayerRef.current?.getVolume?.() || 0) / 100,
        getCurrentTime: () => internalPlayerRef.current?.getCurrentTime?.() || 0,
        getDuration: () => internalPlayerRef.current?.getDuration?.() || 0,
        seekTo: (seconds: number) => internalPlayerRef.current?.seekTo?.(seconds),
        getPlayerState: () => internalPlayerRef.current?.getPlayerState?.() || -1,
        // CRITICAL FOR MOBILE: Load and immediately play a video
        // This must be called synchronously within a user gesture handler
        loadVideoById: (newVideoId: string) => {
          console.log('🎬📱 loadVideoById() called with:', newVideoId);
          try {
            if (internalPlayerRef.current?.loadVideoById) {
              // loadVideoById automatically starts playing the video
              internalPlayerRef.current.loadVideoById(newVideoId);
              console.log('✅ loadVideoById() executed successfully');
            } else {
              console.warn('⚠️ loadVideoById method not available');
            }
          } catch (err) {
            console.error('❌ Error calling loadVideoById():', err);
          }
        }
      };
    }
  }, [externalPlayerRef, isLoaded]);

  useEffect(() => {
    console.log('🎬 YouTubeTrackPlayer useEffect triggered', {
      videoId,
      hasContainer: !!containerRef.current,
      hasYT: !!window.YT,
      hasYTPlayer: !!window.YT?.Player,
      isMobile: window.innerWidth < 768
    });

    if (!videoId || !containerRef.current) {
      console.log('⚠️ YouTube player setup skipped:', { hasVideoId: !!videoId, hasContainer: !!containerRef.current });
      return;
    }

    console.log('✅ YouTube player setup starting for video:', videoId);

    const initializePlayer = () => {
      console.log('🎬 initializePlayer() called for video:', videoId);

      if (!containerRef.current) {
        console.error('❌ Container ref lost during initialization');
        return;
      }

      try {
        // Create unique player ID
        const playerId = `yt-track-player-${Date.now()}`;

        // Clear container
        containerRef.current.innerHTML = '';

        // Create player div with proper styling
        const playerDiv = document.createElement('div');
        playerDiv.id = playerId;
        playerDiv.style.width = '100%';
        playerDiv.style.height = '100%';

        containerRef.current.appendChild(playerDiv);

        console.log('🎬 Creating YouTube player', {
          playerId,
          videoId,
          hasYT: !!window.YT,
          hasYTPlayer: !!window.YT?.Player,
          containerExists: !!document.getElementById(playerId)
        });

        // Create YouTube player with simple configuration (same as desktop)
        internalPlayerRef.current = new window.YT.Player(playerId, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 1,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
            playsinline: 1 // Enable inline playback on iOS
          },
          events: {
            onReady: (event: any) => {
              console.log('✅✅✅ YouTube track player READY event fired!', videoId);
              setIsLoaded(true);
              setError(null);

              // Set initial volume
              internalPlayerRef.current?.setVolume?.(Math.round(volume * 100));

              // Auto-play if requested
              if (pendingPlayRef.current || isPlaying) {
                console.log('🎬 YouTube player ready and play was requested, auto-playing NOW');
                try {
                  internalPlayerRef.current?.playVideo?.();
                  console.log('✅ Auto-play on ready executed successfully');
                  pendingPlayRef.current = false;
                } catch (err) {
                  console.error('❌ Error auto-playing on ready:', err);
                }
              }

              // Start time update interval - update every 50ms for smooth progress bar
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
              }
              timeUpdateIntervalRef.current = window.setInterval(() => {
                if (internalPlayerRef.current && onTimeUpdateRef.current) {
                  const currentTime = internalPlayerRef.current.getCurrentTime?.() || 0;
                  const duration = internalPlayerRef.current.getDuration?.() || 0;
                  onTimeUpdateRef.current(currentTime, duration);
                }
              }, 50);

              onReady?.();
            },
            onStateChange: (event: any) => {
              console.log('YouTube player state changed:', event.data, '(1=playing, 2=paused, 0=ended)');
              onStateChangeRef.current?.(event.data);
            },
            onError: (event: any) => {
              const errorMessages: Record<number, string> = {
                2: 'Invalid parameter',
                5: 'HTML5 player error',
                100: 'Video not found',
                101: 'Video not allowed to be played embedded',
                150: 'Video not allowed to be played embedded'
              };
              const errorMsg = errorMessages[event.data] || 'Unknown error';
              console.error('❌ YouTube track player error:', errorMsg, 'Code:', event.data);
              setError(errorMsg);
              onError?.(errorMsg);
            }
          }
        });
      } catch (err) {
        const errorMsg = 'Failed to initialize YouTube player';
        console.error(errorMsg, err);
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    // Load YouTube API if not already loaded
    if (window.YT && window.YT.Player) {
      console.log('✅ YouTube API already loaded, initializing player immediately');
      initializePlayer();
    } else {
      console.log('📥 YouTube API not loaded yet, loading script...');
      console.log('Current window.YT:', window.YT);

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.defer = true;
      // Add attributes to bypass CSP restrictions
      tag.setAttribute('data-csp-nonce', 'youtube-api');

      tag.onload = () => {
        console.log('📥 YouTube API script loaded (onload event)');
        console.log('window.YT after script load:', window.YT);
      };

      tag.onerror = (err) => {
        console.error('❌ Failed to load YouTube API script:', err);
      };

      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API ready (onYouTubeIframeAPIReady callback)');
        console.log('window.YT:', window.YT);
        console.log('window.YT.Player:', window.YT?.Player);
        initializePlayer();
      };

      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        console.log('📥 YouTube API script tag inserted into DOM');
      } else {
        console.error('❌ Could not find script tag to insert YouTube API');
      }
    }

    // Cleanup
    return () => {
      console.log('Cleaning up YouTube player for video:', videoId);
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (internalPlayerRef.current && typeof internalPlayerRef.current.destroy === 'function') {
        try {
          internalPlayerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying YouTube player:', e);
        }
      }
    };
  }, [videoId, autoplay, volume]);

  // Handle isPlaying prop changes - auto-play/pause when isPlaying state changes
  useEffect(() => {
    if (!internalPlayerRef.current) {
      console.log('YouTube player not ready for play/pause:', { hasPlayer: !!internalPlayerRef.current, isLoaded });
      if (isPlaying) {
        console.log('⏳ Player not ready yet, queuing play request');
        pendingPlayRef.current = true;
      }
      return;
    }

    if (!isLoaded) {
      console.log('YouTube player not loaded yet, waiting...');
      if (isPlaying) {
        console.log('⏳ Player not loaded yet, queuing play request');
        pendingPlayRef.current = true;
      }
      return;
    }

    const playerState = internalPlayerRef.current.getPlayerState?.();
    console.log('🎬 isPlaying effect: isPlaying =', isPlaying, ', playerState =', playerState, '(1=playing, 2=paused, 5=cued)');

    if (isPlaying) {
      // Only call playVideo if not already playing (state !== 1)
      if (playerState !== 1) {
        console.log('🎬 isPlaying effect: Calling playVideo()');
        try {
          internalPlayerRef.current.playVideo();
          console.log('✅ isPlaying effect: playVideo() executed successfully');
          pendingPlayRef.current = false;
        } catch (err) {
          console.error('❌ isPlaying effect: Error calling playVideo():', err);
        }
      } else {
        console.log('🎬 isPlaying effect: Already playing, skipping playVideo()');
        pendingPlayRef.current = false;
      }
    } else {
      // Only call pauseVideo if not already paused (state !== 2)
      if (playerState !== 2) {
        console.log('⏸️ isPlaying effect: Calling pauseVideo()');
        try {
          internalPlayerRef.current.pauseVideo();
          console.log('✅ isPlaying effect: pauseVideo() executed successfully');
        } catch (err) {
          console.error('❌ isPlaying effect: Error calling pauseVideo():', err);
        }
      } else {
        console.log('⏸️ isPlaying effect: Already paused, skipping pauseVideo()');
      }
    }
  }, [isPlaying, isLoaded]);

  if (!videoId) {
    return (
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-white/60">Invalid YouTube URL</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full h-full bg-black relative rounded-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-3"></div>
            <p className="text-white/60 text-sm">Loading YouTube video...</p>
            <p className="text-xs text-white/40 mt-2">Video ID: {videoId}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 rounded-lg">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-white/60 mb-2">{error}</p>
            <p className="text-xs text-white/40">Video ID: {videoId}</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full bg-black rounded-lg overflow-hidden" />
    </motion.div>
  );
}

