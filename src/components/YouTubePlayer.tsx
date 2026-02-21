import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, Video } from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface YouTubePlayerProps {
  campaignId?: string;
  rewardJamz?: number;
  videoId: string;
  title: string;
}

// Add YouTube Player API type
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
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ videoId, title, campaignId }: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRewarded, setIsRewarded] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [watchCount, setWatchCount] = useState(0);
  const [maxWatches] = useState(3);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { walletAddress } = useAuthStore();

  // Load the YouTube API to ensure event handling works properly
  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    // Setup player variables
    let ytPlayer: any = null;
    let playerIframe: HTMLIFrameElement;

    // Function to handle when YouTube API is ready
    const onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready, initializing player for video:', videoId);

      try {
        // Player ID must be unique
        const playerId = `youtube-player-${Date.now()}`;

        // Create a div with unique ID for the player
        const playerDiv = document.createElement('div');
        playerDiv.id = playerId;

        // Clear container and add player div
        containerRef.current!.innerHTML = '';
        containerRef.current!.appendChild(playerDiv);

        // Create the YouTube player
        ytPlayer = new window.YT.Player(playerId, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            modestbranding: 1
          },
          events: {
            onReady: (event: any) => {
              console.log('Player ready');
              setIsLoaded(true);

              // Get the iframe element for debugging
              playerIframe = event.target.getIframe();
              console.log('Player iframe loaded:', playerIframe.id);

              // Check watch count after player is ready
              if (walletAddress && campaignId) {
                checkWatchCount();
              }
            },
            onStateChange: (event: any) => {
              console.log('Player state changed:', event.data);
              // 0 = VIDEO_ENDED
              if (event.data === 0) {
                console.log('Video ended, triggering reward...');
                handleVideoCompletion();
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              setError('Error playing video');
              setIsLoaded(false);
            }
          }
        });

        // Store player ref for later use
        playerRef.current = ytPlayer;

      } catch (err) {
        console.error('Error initializing YouTube player:', err);
        setError('Failed to initialize video player');
      }
    };

    // Function to load YouTube API if not already loaded
    const loadYouTubeAPI = () => {
      // Check if API already loaded
      if (window.YT && window.YT.Player) {
        console.log('YouTube API already loaded');
        onYouTubeIframeAPIReady();
        return;
      }

      console.log('Loading YouTube API...');
      // Create script tag
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';

      // Set callback for when API is loaded
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

      // Insert script
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    };

    // Load the API
    loadYouTubeAPI();

    // Cleanup function
    return () => {
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        try {
          console.log('Destroying YouTube player');
          ytPlayer.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
      }
    };
  }, [videoId]);

  // Check watch count function
  const checkWatchCount = async () => {
    if (!walletAddress || !campaignId) return;

    try {
      const response = await api.wallets.getWatchCount({
        campaignId,
        videoId
      });

      if (response.watchCount) {
        setWatchCount(response.watchCount);
        setIsRewarded(response.watchCount >= maxWatches);
      }
    } catch (err) {
      console.error('Error checking watch count:', err);
    }
  };

  const handleVideoCompletion = async () => {
    // Only reward if user is logged in and campaign ID is available
    if (!walletAddress || !campaignId) return;

    // Check if already maxed out watches
    if (watchCount >= maxWatches) {
      console.log(`Already reached maximum of ${maxWatches} watches for this video`);
      return;
    }

    console.log('Video completed, processing reward...');

    try {
      const response = await api.wallets.watchReward({
        campaignId,
        videoId
      });

      console.log('Reward success:', response);
      setRewardAmount(response.reward.jamz);
      setShowReward(true);

      // Increment watch count
      setWatchCount(prev => prev + 1);

      // Check if this was the last allowed watch
      if (watchCount + 1 >= maxWatches) {
        setIsRewarded(true);
      }

      // Hide reward notification after 5 seconds
      setTimeout(() => {
        setShowReward(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error claiming video reward:', err);

      // If error contains watch count info, update state
      if (err.watchCount) {
        setWatchCount(err.watchCount);
        setIsRewarded(err.watchCount >= maxWatches);
      }
    }
  };

  // Reset rewarded state when video starts playing to allow multiple rewards
  useEffect(() => {
    if (!playerRef.current) return;

    const onPlayerPlaying = (event: any) => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        // Only reset if we haven't reached max watches
        if (watchCount < maxWatches) {
          setIsRewarded(false);
        }
      }
    };

    try {
      playerRef.current.addEventListener('onStateChange', onPlayerPlaying);
    } catch (e) {
      console.error('Error adding player event listener:', e);
    }

    return () => {
      try {
        playerRef.current?.removeEventListener('onStateChange', onPlayerPlaying);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [watchCount, maxWatches]);

  if (!videoId) {
    return (
      <div className="aspect-video w-full bg-black/50 rounded-lg flex items-center justify-center">
        <div className="text-white/60">No video ID provided</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video w-full bg-black/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-white/60 text-sm mb-4">Video ID: {videoId}</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button-primary inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full relative bg-black/50 rounded-lg overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* This div will be replaced by the YouTube player */}
      <div ref={containerRef} className="absolute inset-0"></div>

      {/* Watch count indicator */}
      {walletAddress && campaignId && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5">
          <div className="flex items-center">
            {Array.from({ length: maxWatches }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full mx-0.5 ${
                  i < watchCount
                    ? 'bg-[#6600FF]'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <span className="text-white/80 text-xs">
            {watchCount < maxWatches ?
              `${maxWatches - watchCount} rewards left` :
              'Max rewards earned'}
          </span>
        </div>
      )}

      {/* Reward notification */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 right-4 bg-[#6600FF] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Congrats! You earned {rewardAmount} JAMZ tokens!</span>
            {watchCount < maxWatches && (
              <span className="text-xs opacity-80 ml-1">
                ({maxWatches - watchCount} rewards remaining)
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
