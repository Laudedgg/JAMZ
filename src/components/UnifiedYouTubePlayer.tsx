import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, Video, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedYouTubePlayerProps {
  videoId: string;
  onWatchComplete?: (videoId: string) => void;
  campaignId?: string;
  title?: string;
  isPrerequisite?: boolean;
  prerequisiteCompleted?: boolean;
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

const UnifiedYouTubePlayer: React.FC<UnifiedYouTubePlayerProps> = ({
  videoId,
  onWatchComplete,
  campaignId,
  title = 'Video',
  isPrerequisite = false,
  prerequisiteCompleted = false
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchCompleted, setWatchCompleted] = useState(prerequisiteCompleted);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setWatchCompleted(prerequisiteCompleted);
  }, [prerequisiteCompleted]);

  useEffect(() => {
    if (!window.YT) {
      // Load YouTube API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.log('Error destroying player:', error);
        }
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!containerRef.current || !window.YT?.Player) return;

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
    }
  };

  const onPlayerReady = () => {
    setIsLoaded(true);
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTracking();
    } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
    }

    if (state === window.YT.PlayerState.ENDED) {
      handleVideoComplete();
    }
  };

  const onPlayerError = (event: any) => {
    console.error('YouTube player error:', event.data);
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          
          if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            setWatchProgress(Math.min(progress, 100));
            
            // Consider video "completed" at 90% to account for early endings
            if (progress >= 90 && !watchCompleted) {
              handleVideoComplete();
            }
          }
        } catch (error) {
          console.error('Error tracking progress:', error);
        }
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleVideoComplete = async () => {
    if (watchCompleted) return;

    console.log('Video completed, processing...');
    setWatchCompleted(true);
    setShowCompletionMessage(true);

    // Call the completion callback
    if (onWatchComplete) {
      try {
        await onWatchComplete(videoId);
      } catch (error) {
        console.error('Error in watch complete callback:', error);
      }
    }

    // Hide completion message after 5 seconds
    setTimeout(() => {
      setShowCompletionMessage(false);
    }, 5000);
  };

  const getCompletionMessage = () => {
    if (isPrerequisite) {
      return watchCompleted 
        ? "✅ Prerequisite completed! You're now eligible for prizes."
        : "Watch the full video to complete this prerequisite";
    }
    return watchCompleted 
      ? "✅ Video completed!"
      : "Watch the full video";
  };

  return (
    <div className="relative w-full">
      {/* Video Player Container */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400">Loading video...</p>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Progress Bar */}
        {isPlaying && !watchCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
              style={{ width: `${watchProgress}%` }}
            />
          </div>
        )}

        {/* Completion Overlay */}
        {watchCompleted && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-500/90 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {watchCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : isPrerequisite ? (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            ) : (
              <Play className="w-5 h-5 text-blue-400" />
            )}
            <span className={`text-sm ${watchCompleted ? 'text-green-400' : 'text-white/80'}`}>
              {getCompletionMessage()}
            </span>
          </div>
          
          {isPrerequisite && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              watchCompleted 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {watchCompleted ? 'Prerequisite Met' : 'Required'}
            </span>
          )}
        </div>

        {/* Progress Text */}
        {isPlaying && !watchCompleted && (
          <div className="mt-2">
            <div className="text-xs text-white/60">
              Progress: {Math.round(watchProgress)}%
            </div>
          </div>
        )}
      </div>

      {/* Completion Notification */}
      <AnimatePresence>
        {showCompletionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 bg-green-500/90 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <div className="font-semibold">
                  {isPrerequisite ? 'Prerequisite Completed!' : 'Video Completed!'}
                </div>
                <div className="text-sm opacity-90">
                  {isPrerequisite 
                    ? 'You can now submit entries for prizes' 
                    : 'Thanks for watching!'
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentication Required Message */}
      {!isAuthenticated && isPrerequisite && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Sign in to track your progress and complete prerequisites</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedYouTubePlayer;
