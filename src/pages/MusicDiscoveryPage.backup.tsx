import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, Music, Shuffle, Repeat, Headphones, Zap, Youtube, Link as LinkIcon, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, Track } from '../lib/api';
import { getMediaUrl } from '../lib/mediaUtils';
import { SpotifyIcon } from '../components/SpotifyIcon';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { YouTubeTrackPlayer, YouTubePlayerHandle } from '../components/YouTubeTrackPlayer';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { getSessionId } from '../lib/sessionUtils';
import { useAuthStore } from '../lib/auth';

import { HorizontalTrackScroller } from '../components/HorizontalTrackScroller';
import { MobileCarouselPlayer } from '../components/MobileCarouselPlayer';

export function MusicDiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

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
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    seekTo,
    openExternalStream,
    youtubePlayerRef,
    reloadTracks
  } = useMusicPlayer();

  // YouTube progress tracking for UI
  const [youtubeProgress, setYoutubeProgress] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);

  // Detect screen size to conditionally render only ONE YouTube player
  // This prevents audio doubling from multiple YouTube player instances
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Voting state
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote' | null>>({});
  const sessionId = getSessionId();

  // Listen for window resize to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        console.log('🖥️ Screen size changed, isMobile:', newIsMobile);
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Load user votes for all tracks (only if authenticated)
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!isAuthenticated) {
        setUserVotes({});
        return;
      }

      const votes: Record<string, 'upvote' | 'downvote' | null> = {};
      for (const track of tracks) {
        try {
          const { userVote } = await api.tracks.getUserVote(track._id);
          votes[track._id] = userVote;
        } catch (error) {
          console.error('Error loading vote for track:', track._id, error);
        }
      }
      setUserVotes(votes);
    };

    if (tracks.length > 0) {
      loadUserVotes();
    }
  }, [tracks, isAuthenticated]);

  // Handle track query parameter for deep linking
  useEffect(() => {
    const trackId = searchParams.get('track');
    if (trackId && tracks.length > 0) {
      // Find the track with the matching ID
      const trackToPlay = tracks.find(t => t._id === trackId);
      if (trackToPlay) {
        console.log('Auto-playing track from URL:', trackToPlay.title);
        playTrack(trackToPlay);
      }
    }
  }, [searchParams, tracks, playTrack]);

  // Use ref to track isPlaying state to avoid stale closures
  const isPlayingRef = useRef(isPlaying);

  // Update ref when isPlaying changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle YouTube player state changes
  const handleYouTubeStateChange = useCallback((state: number) => {
    console.log('🎬 YouTube player state changed:', state, '(1=playing, 2=paused, 0=ended)');
    console.log('🎬 Current global isPlaying state:', isPlayingRef.current);

    // State: -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
    if (state === 1) {
      // Playing - sync global isPlaying state
      console.log('🎬 YouTube video started playing - checking if need to sync global state');
      if (!isPlayingRef.current) {
        console.log('✅ Syncing global state to PLAYING');
        togglePlayPause(); // This will set isPlaying to true
      } else {
        console.log('⏭️ Global state already PLAYING, no sync needed');
      }
    } else if (state === 2) {
      // Paused - sync global isPlaying state
      console.log('⏸️ YouTube video paused - checking if need to sync global state');
      if (isPlayingRef.current) {
        console.log('✅ Syncing global state to PAUSED');
        togglePlayPause(); // This will set isPlaying to false
      } else {
        console.log('⏭️ Global state already PAUSED, no sync needed');
      }
    } else if (state === 0) {
      // Ended - play next track
      console.log('🔚 YouTube video ended, playing next track');
      nextTrack();
    }
  }, [nextTrack, togglePlayPause]);

  // Handle YouTube time updates
  const handleYouTubeTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (duration > 0) {
      const newProgress = (currentTime / duration) * 100;
      setYoutubeProgress(newProgress);
      setYoutubeDuration(duration);
    }
  }, []);

  const handlePlayTrack = (track: Track, index: number) => {
    console.log('🎵 Discover page playing track:', track.title, 'Audio file:', track.audioFile, 'YouTube:', track.youtubeUrl);

    // CRITICAL MOBILE FIX: Pass fromUserGesture flag to preserve user interaction context
    // This allows YouTube playback to start immediately on mobile without requiring double-tap
    playTrack(track, { fromUserGesture: true });
  };

  const handleStreamTrack = (track: Track) => {
    console.log('Discover page opening stream for:', track.title);
    // Open external DSP link
    openExternalStream(track);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVote = async (trackId: string, voteType: 'upvote' | 'downvote') => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show login prompt
      if (window.confirm('You need to log in to vote on tracks. Would you like to log in now?')) {
        navigate('/login');
      }
      return;
    }

    try {
      const { userVote } = await api.tracks.vote(trackId, voteType);

      // Update the local userVotes state
      setUserVotes(prev => ({
        ...prev,
        [trackId]: userVote
      }));

      // Reload tracks to get updated vote counts and sorting
      await reloadTracks();
    } catch (error) {
      console.error('Error voting on track:', error);
      // If error is 401 Unauthorized, prompt to log in
      if (error instanceof Error && error.message.includes('401')) {
        if (window.confirm('Your session has expired. Would you like to log in again?')) {
          navigate('/login');
        }
      }
    }
  };

  const currentTime = (progress / 100) * duration;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading music...</p>
        </div>
      </div>
    );
  }

  // Only show full-page error if it's a critical loading error, not a playback error
  if (error && error.includes('Failed to load tracks')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-xl text-white/60 mb-4">Unable to load music</p>
          <p className="text-white/40">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background with Grid and Floating Icons */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedBackground />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-6 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Discover Music
            </span>
          </h1>
          <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto mb-4 md:mb-6">
            Explore the latest tracks from various artists globally. Stream directly on jamz.fun or click to stream on your favorite DSP platforms.
          </p>
        </motion.div>

        {/* Horizontal Track Scroller - Mobile Only */}
        <HorizontalTrackScroller
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          onTrackSelect={handlePlayTrack}
        />

        {/* Mobile Player - Only render on mobile screens to prevent audio doubling */}
        {(() => {
          console.log('🎬 Mobile player render check:', {
            isMobile,
            hasCurrentTrack: !!currentTrack,
            hasYoutubeUrl: !!currentTrack?.youtubeUrl,
            youtubeUrl: currentTrack?.youtubeUrl,
            trackTitle: currentTrack?.title,
            shouldRender: isMobile && currentTrack && currentTrack.youtubeUrl
          });
          return null;
        })()}
        {isMobile && currentTrack && currentTrack.youtubeUrl && (
          <div className="w-full mb-4 bg-gradient-to-br from-gray-900/40 to-black/60 rounded-xl p-3 border border-white/5 backdrop-blur-md">
            <div className="mb-4">
              {(() => {
                console.log('🎬 About to render YouTubeTrackPlayer component');
                return null;
              })()}
              <YouTubeTrackPlayer
                youtubeUrl={currentTrack.youtubeUrl}
                title={currentTrack.title}
                artist={currentTrack.artist}
                isPlaying={isPlaying}
                volume={volume}
                onStateChange={handleYouTubeStateChange}
                onTimeUpdate={handleYouTubeTimeUpdate}
                playerRef={youtubePlayerRef}
                aspectRatio="video"
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">
                {currentTrack.title}
              </h3>
              <p className="text-sm text-white/60">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}

        {/* Mobile Player - Track info only (no YouTube) when no YouTube URL */}
        {isMobile && currentTrack && !currentTrack.youtubeUrl && (
          <div className="w-full mb-4 bg-gradient-to-br from-gray-900/40 to-black/60 rounded-xl p-3 border border-white/5 backdrop-blur-md">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">
                {currentTrack.title}
              </h3>
              <p className="text-sm text-white/60">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Music Player Interface - Desktop Only */}
          <motion.div
            className="hidden lg:block lg:col-span-1 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl p-6 border border-white/10 backdrop-blur-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {currentTrack ? (
              <>
                {/* Error Notification */}
                {error && (
                  <motion.div
                    className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="font-semibold">⚠️ Playback Error</p>
                    <p className="text-xs mt-1">{error}</p>
                  </motion.div>
                )}

                {/* YouTube Player or Album Art - Only render on desktop to prevent audio doubling */}
                {currentTrack.youtubeUrl && !isMobile ? (
                  <div className="mb-6">
                    <YouTubeTrackPlayer
                      youtubeUrl={currentTrack.youtubeUrl}
                      title={currentTrack.title}
                      artist={currentTrack.artist}
                      isPlaying={isPlaying}
                      volume={volume}
                      onStateChange={handleYouTubeStateChange}
                      onTimeUpdate={handleYouTubeTimeUpdate}
                      playerRef={youtubePlayerRef}
                      aspectRatio="square"
                    />
                  </div>
                ) : !currentTrack.youtubeUrl ? (
                  <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-gray-800">
                    <img
                      src={currentTrack.coverImage ? getMediaUrl(currentTrack.coverImage) : '/placeholder-album.svg'}
                      alt={`${currentTrack.title} by ${currentTrack.artist}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-album.svg';
                      }}
                    />
                  </div>
                ) : null}

                {/* Track Info */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{currentTrack.title}</h3>
                  <p className="text-white/60">{currentTrack.artist}</p>
                </div>

                {/* Progress Bar - For audio files and YouTube videos */}
                {(currentTrack.audioFile || currentTrack.youtubeUrl) && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-white/60">
                        {currentTrack.youtubeUrl
                          ? formatTime((youtubeProgress / 100) * youtubeDuration)
                          : formatTime(currentTime)
                        }
                      </span>
                      <div
                        className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = ((e.clientX - rect.left) / rect.width) * 100;
                          seekTo(percent);
                        }}
                      >
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${currentTrack.youtubeUrl ? youtubeProgress : progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">
                        {currentTrack.youtubeUrl
                          ? formatTime(youtubeDuration)
                          : formatTime(duration)
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Preview Track Message */}
                {((currentTrack.spotifyPreviewUrl && !currentTrack.spotifyPreviewUrl.includes('/track/')) || (currentTrack.appleMusicPreviewUrl && !currentTrack.appleMusicPreviewUrl.includes('/album/'))) && !currentTrack.audioFile && !currentTrack.youtubeUrl && (
                  <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-300 text-center">
                      {currentTrack.spotifyUrl || currentTrack.appleMusicUrl
                        ? `Click the ${currentTrack.spotifyUrl ? 'Spotify' : 'Apple Music'} icon to listen to the full track or use the play button for preview`
                        : 'Use the play button to listen to the preview'}
                    </p>
                  </div>
                )}

                {/* DSP-Only Track Message */}
                {!currentTrack.audioFile && !currentTrack.youtubeUrl && !currentTrack.spotifyPreviewUrl && !currentTrack.appleMusicPreviewUrl && (currentTrack.spotifyUrl || currentTrack.appleMusicUrl) && (
                  <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300 text-center">
                      This track is available on Spotify and Apple Music. Click the button below to listen!
                    </p>
                  </div>
                )}

                {/* Player Controls - Only show if there's playable content */}
                {(currentTrack.youtubeUrl || currentTrack.audioFile || currentTrack.spotifyPreviewUrl || currentTrack.appleMusicPreviewUrl) && (
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {/* Previous Track Button */}
                    <button
                      onClick={previousTrack}
                      className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white/70 hover:text-white"
                      title="Previous track"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>

                    {currentTrack.youtubeUrl ? (
                      // YouTube video - play/pause button
                      <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" />
                        )}
                      </button>
                    ) : currentTrack.audioFile ? (
                      <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" />
                        )}
                      </button>
                    ) : currentTrack.spotifyPreviewUrl || currentTrack.appleMusicPreviewUrl ? (
                      <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" />
                        )}
                      </button>
                    ) : null}

                    {/* Next Track Button */}
                    <button
                      onClick={nextTrack}
                      className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white/70 hover:text-white"
                      title="Next track"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Volume Control - For audio files and YouTube videos */}
                {(currentTrack.audioFile || currentTrack.youtubeUrl) && (
                  <div className="flex items-center space-x-3">
                    <button onClick={toggleMute} className="text-white/60 hover:text-white">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* External Links - DSP Icons */}
                {(currentTrack.spotifyUrl || currentTrack.appleMusicUrl || currentTrack.youtubeUrl) && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-xs text-white/60 mb-3 text-center">Stream on:</p>
                    <div className="flex items-center justify-center space-x-4">
                      {currentTrack.spotifyUrl && (
                        <a
                          href={currentTrack.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                          title="Open on Spotify"
                        >
                          <SpotifyIcon className="w-6 h-6 text-white" />
                        </a>
                      )}
                      {currentTrack.appleMusicUrl && (
                        <a
                          href={currentTrack.appleMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                          title="Open on Apple Music"
                        >
                          <Music className="w-6 h-6 text-white" />
                        </a>
                      )}
                      {currentTrack.youtubeUrl && (
                        <a
                          href={currentTrack.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                          title="Open on YouTube"
                        >
                          <Youtube className="w-6 h-6 text-white" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No track selected</p>
              </div>
            )}
          </motion.div>

          {/* Track List */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Discovery Playlist</h2>
            
            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-xl text-white/60">No tracks available</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-0 px-3 md:px-0">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track._id}
                    className={`group relative ${
                      currentTrack?._id === track._id
                        ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/40 md:bg-white/10 md:border-white/5'
                        : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20 md:bg-transparent md:border-white/5 hover:bg-white/5'
                    } transition-all duration-200 border md:border-b rounded-2xl md:rounded-none shadow-xl md:shadow-none md:last:border-b-0 overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden p-4 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        {/* Album Art with Play Button Overlay */}
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 shadow-xl ring-2 ring-white/10">
                            <img
                              src={track.coverImage ? getMediaUrl(track.coverImage) : '/placeholder-album.svg'}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-album.svg';
                              }}
                            />
                          </div>
                          {/* Dedicated Play Button - ONLY way to play track */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayTrack(track, index);
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 active:bg-black/80 rounded-xl transition-all group/play backdrop-blur-sm"
                          >
                            {currentTrack?._id === track._id && isPlaying ? (
                              <div className="flex gap-1">
                                <div className="w-1 h-5 bg-green-400 animate-pulse rounded-full" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1 h-5 bg-green-400 animate-pulse rounded-full" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1 h-5 bg-green-400 animate-pulse rounded-full" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            ) : (
                              <Play className="w-8 h-8 text-white fill-white group-hover/play:scale-125 transition-transform drop-shadow-lg" />
                            )}
                          </button>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-base truncate ${
                            currentTrack?._id === track._id ? 'text-green-400' : 'text-white'
                          }`}>
                            {track.title}
                          </h4>
                          <p className="text-sm text-white/70 truncate mt-1">{track.artist}</p>

                          {/* Mobile: Duration and Type */}
                          <div className="flex items-center gap-2 mt-2">
                            {track.youtubeUrl && (
                              <span className="text-xs bg-red-500/25 text-red-300 px-2 py-1 rounded-full flex items-center gap-1 font-medium border border-red-500/30">
                                <Youtube className="w-3 h-3" />
                                Video
                              </span>
                            )}
                            {track.audioFile && (
                              <span className="text-xs bg-green-500/25 text-green-300 px-2 py-1 rounded-full flex items-center gap-1 font-medium border border-green-500/30">
                                <Headphones className="w-3 h-3" />
                                Full
                              </span>
                            )}
                            <span className="text-xs text-white/50 font-medium">{formatTime(track.duration)}</span>
                          </div>

                          {/* Separator Line */}
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>

                          {/* Mobile: DSP Links - Prominent and Always Visible */}
                          {(track.spotifyUrl || track.appleMusicUrl || track.youtubeUrl) && (
                            <div className="flex flex-wrap items-center gap-2">
                              {track.spotifyUrl && track.spotifyUrl.trim() && (
                                <a
                                  href={track.spotifyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 active:bg-green-500/30 rounded-full transition-colors border border-green-500/30"
                                >
                                  <SpotifyIcon className="w-4 h-4 text-green-400" />
                                  <span className="text-xs font-medium text-green-400">Spotify</span>
                                </a>
                              )}
                              {track.appleMusicUrl && track.appleMusicUrl.trim() && (
                                <a
                                  href={track.appleMusicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/25 active:bg-pink-500/30 rounded-full transition-colors border border-pink-500/30"
                                >
                                  <Music className="w-4 h-4 text-pink-400" />
                                  <span className="text-xs font-medium text-pink-400">Apple</span>
                                </a>
                              )}
                              {track.youtubeUrl && track.youtubeUrl.trim() && (
                                <a
                                  href={track.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/30 rounded-full transition-colors border border-red-500/30"
                                >
                                  <Youtube className="w-4 h-4 text-red-400" />
                                  <span className="text-xs font-medium text-red-400">YouTube</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mobile: Vote Buttons - Vertical Stack */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(track._id, 'upvote');
                            }}
                            disabled={!isAuthenticated}
                            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all ${
                              !isAuthenticated
                                ? 'bg-white/5 text-white/20'
                                : userVotes[track._id] === 'upvote'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-white/5 text-white/50 active:bg-white/10 border border-white/10'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-[10px] font-medium mt-0.5">{track.upvotes || 0}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(track._id, 'downvote');
                            }}
                            disabled={!isAuthenticated}
                            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all ${
                              !isAuthenticated
                                ? 'bg-white/5 text-white/20'
                                : userVotes[track._id] === 'downvote'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-white/5 text-white/50 active:bg-white/10 border border-white/10'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-[10px] font-medium mt-0.5">{track.downvotes || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-4 p-3 cursor-default">
                      {/* Track Number / Play Button */}
                      <div className="w-10 flex items-center justify-center flex-shrink-0">
                        {currentTrack?._id === track._id && isPlaying ? (
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-0.5 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-0.5 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-white/40 font-medium group-hover:hidden">{index + 1}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrack(track, index);
                              }}
                              className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                            >
                              <Play className="w-4 h-4 text-white fill-white" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Album Art */}
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-800 flex-shrink-0 shadow-md">
                        <img
                          src={track.coverImage ? getMediaUrl(track.coverImage) : '/placeholder-album.svg'}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-album.svg';
                          }}
                        />
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm truncate ${
                          currentTrack?._id === track._id ? 'text-green-400' : 'text-white'
                        }`}>
                          {track.title}
                        </h4>
                        <p className="text-xs text-white/60 truncate">{track.artist}</p>
                      </div>

                      {/* Vote Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(track._id, 'upvote');
                          }}
                          disabled={!isAuthenticated}
                          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full transition-all ${
                            !isAuthenticated
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : userVotes[track._id] === 'upvote'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-green-400'
                          }`}
                          title={!isAuthenticated ? 'Log in to vote' : 'Upvote'}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{track.upvotes || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(track._id, 'downvote');
                          }}
                          disabled={!isAuthenticated}
                          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full transition-all ${
                            !isAuthenticated
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : userVotes[track._id] === 'downvote'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-red-400'
                          }`}
                          title={!isAuthenticated ? 'Log in to vote' : 'Downvote'}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{track.downvotes || 0}</span>
                        </button>
                      </div>

                      {/* Track Type Badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {track.youtubeUrl ? (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full flex items-center gap-1">
                            <Youtube className="w-3 h-3" />
                            Video
                          </span>
                        ) : track.audioFile ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            Full Track
                          </span>
                        ) : null}
                      </div>

                      {/* Duration */}
                      <span className="text-xs text-white/40 w-12 text-right flex-shrink-0">{formatTime(track.duration)}</span>

                      {/* DSP Logo Badges - Always Visible */}
                      <div className="flex items-center gap-2.5 flex-shrink-0 min-w-[100px]">
                        {track.spotifyUrl && (
                          <a
                            href={track.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Open on Spotify"
                          >
                            <SpotifyIcon className="w-4 h-4" />
                          </a>
                        )}
                        {track.appleMusicUrl && (
                          <a
                            href={track.appleMusicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Open on Apple Music"
                          >
                            <Music className="w-4 h-4" />
                          </a>
                        )}
                        {track.youtubeUrl && (
                          <a
                            href={track.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            title="Open on YouTube"
                          >
                            <Youtube className="w-4 h-4" />
                          </a>
                        )}
                        {/* Track URL Link */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchParams({ track: track._id });
                          }}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title={`Share track: jamz.fun/discover?track=${track._id}`}
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
