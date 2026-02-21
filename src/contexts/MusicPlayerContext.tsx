import React, { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Track, api } from '../lib/api';
import { getMediaUrl } from '../lib/mediaUtils';
import { YouTubeTrackPlayer, YouTubePlayerHandle } from '../components/YouTubeTrackPlayer';
import { logger } from '../lib/logger';

interface MusicPlayerContextType {
  // Track state
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  loading: boolean;
  error: string | null;

  // Player visibility (for mobile/desktop)
  isVisible: boolean;

  // Mobile audio unlock state
  audioUnlocked: boolean;
  unlockAudio: () => void;

  // Mobile YouTube track pending (needs tap to play)
  pendingYouTubePlay: boolean;
  confirmYouTubePlay: () => void;

  // Player controls
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (position: number) => void;
  setPlayerVisibility: (visible: boolean) => void;
  openExternalStream: (track: Track) => void;
  reloadTracks: () => Promise<void>;

  // Audio element ref for advanced controls
  audioRef: React.RefObject<HTMLAudioElement>;

  // YouTube player ref for advanced controls
  youtubePlayerRef: React.MutableRefObject<YouTubePlayerHandle | null>;

  // YouTube state change handler for auto-advance
  handleYouTubeStateChange: (state: number) => void;

  // YouTube time update handler
  handleYouTubeTimeUpdate: (currentTime: number, duration: number) => void;

  // Audio element access for external control
  getAudioElement: () => HTMLAudioElement | null;

  // Current YouTube video ID for the persistent player
  currentYouTubeVideoId: string | null;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}

interface MusicPlayerProviderProps {
  children: React.ReactNode;
}

// Check if we're on a mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Get current location to determine if we're on the discover page
  // Note: MusicPlayerProvider must be inside the Router for this to work
  const location = useLocation();
  const isOnDiscoverPage = location.pathname === '/discover';

  // Mobile audio unlock state - check sessionStorage on init
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    if (typeof window === 'undefined') return true; // SSR
    // On desktop, always unlocked
    if (!isMobileDevice()) return true;
    // On mobile, check sessionStorage
    return sessionStorage.getItem('audioUnlocked') === 'true';
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayerHandle | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const errorListenerRef = useRef<((e: Event) => void) | null>(null);

  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : null;

  // Unlock audio function - must be called from a user gesture
  const unlockAudio = useCallback(() => {
    console.log('🔓 Unlocking audio...');

    // Play and immediately pause a silent audio to unlock audio context
    if (audioRef.current) {
      // Create a short silent audio data URL
      const silentAudio = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      const originalSrc = audioRef.current.src;

      audioRef.current.src = silentAudio;
      audioRef.current.play().then(() => {
        console.log('✅ Audio context unlocked via silent audio');
        audioRef.current?.pause();
        // Restore original source if there was one
        if (originalSrc && originalSrc !== silentAudio) {
          audioRef.current!.src = originalSrc;
        }
      }).catch(err => {
        console.log('⚠️ Silent audio play failed (expected on some browsers):', err);
      });
    }

    // Also try to trigger YouTube player if it exists
    if (youtubePlayerRef.current?.play) {
      console.log('🎬 Triggering YouTube player play to unlock');
      youtubePlayerRef.current.play();
      // Immediately pause if not supposed to be playing
      setTimeout(() => {
        if (!isPlaying && youtubePlayerRef.current?.pause) {
          youtubePlayerRef.current.pause();
        }
      }, 100);
    }

    // Mark as unlocked
    setAudioUnlocked(true);
    sessionStorage.setItem('audioUnlocked', 'true');
    console.log('✅ Audio unlocked and saved to session');
  }, [isPlaying]);

  // State for pending YouTube play (mobile needs tap for each new video)
  const [pendingYouTubePlay, setPendingYouTubePlay] = useState(false);
  const pendingVideoIdRef = useRef<string | null>(null);

  // Confirm YouTube play - called when user taps the "Tap to play" prompt
  const confirmYouTubePlay = useCallback(() => {
    console.log('🎬📱 User confirmed YouTube play');
    if (pendingVideoIdRef.current && youtubePlayerRef.current?.loadVideoById) {
      console.log('🎬📱 Loading video with user gesture:', pendingVideoIdRef.current);
      youtubePlayerRef.current.loadVideoById(pendingVideoIdRef.current);
      setIsPlaying(true);
    }
    setPendingYouTubePlay(false);
    pendingVideoIdRef.current = null;
  }, []);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.crossOrigin = 'anonymous';

      // Enable background playback on mobile devices
      audioRef.current.setAttribute('playsinline', 'true');
      audioRef.current.setAttribute('webkit-playsinline', 'true');

      // Prevent audio from being paused when page loses focus
      audioRef.current.setAttribute('preload', 'auto');

      // Set duration once metadata is loaded
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });

      // Handle track end
      audioRef.current.addEventListener('ended', () => {
        nextTrack();
      });

      console.log('🎵 Audio element initialized with background playback support');
    }

    return () => {
      // Cleanup on unmount
      if (audioRef.current && errorListenerRef.current) {
        audioRef.current.removeEventListener('error', errorListenerRef.current);
      }
    };
  }, []);

  // Fetch tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const data = await api.tracks.list();
        console.log('Fetched tracks:', data.length);
        console.log('Tracks with YouTube URLs:', data.filter(t => t.youtubeUrl).length);
        data.forEach((track, index) => {
          if (track.youtubeUrl) {
            console.log(`Track ${index}: ${track.title} - YouTube URL: ${track.youtubeUrl}`);
          }
        });
        setTracks(data);
      } catch (err: any) {
        console.error('Error fetching tracks:', err);
        setError(err.message || 'Failed to load tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Update Media Session API metadata when track changes
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      const coverImageUrl = currentTrack.coverImage
        ? getMediaUrl(currentTrack.coverImage)
        : '/placeholder-album.jpg';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'Jamz.fun',
        artwork: [
          { src: coverImageUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: coverImageUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: coverImageUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: coverImageUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverImageUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: coverImageUrl, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      console.log('📱 Media Session metadata updated:', currentTrack.title);
    }
  }, [currentTrack]);

  // Update audio source when current track changes (SEPARATE from play/pause)
  useEffect(() => {
    console.log('🎵 Audio loading effect triggered:', {
      currentTrackTitle: currentTrack?.title,
      hasAudioFile: !!currentTrack?.audioFile,
      hasSpotifyPreview: !!currentTrack?.spotifyPreviewUrl,
      hasApplePreview: !!currentTrack?.appleMusicPreviewUrl,
      hasSpotifyUrl: !!currentTrack?.spotifyUrl,
      isPlaying: isPlaying
    });

    if (tracks.length > 0 && audioRef.current && currentTrack) {
      let audioPath = '';
      let isPreviewTrack = false;

      // Priority: 1. Local audio file, 2. Preview URLs (only actual preview URLs, not DSP links)
      // Note: YouTube tracks are handled separately by the YouTube player component
      if (currentTrack.audioFile) {
        audioPath = getMediaUrl(currentTrack.audioFile);
        console.log('Global player loading local track:', currentTrack.title, 'from:', audioPath);
      } else if (currentTrack.spotifyPreviewUrl && !currentTrack.spotifyPreviewUrl.includes('/track/') && !currentTrack.spotifyPreviewUrl.includes('open.spotify.com')) {
        // Only use spotifyPreviewUrl if it's an actual preview URL (not a track URL or Spotify link)
        // Use backend proxy to bypass CORS restrictions
        audioPath = `/api/tracks/preview/${currentTrack._id}`;
        isPreviewTrack = true;
        console.log('Global player loading Spotify preview:', currentTrack.title, 'from proxy:', audioPath);
      } else if (currentTrack.appleMusicPreviewUrl && !currentTrack.appleMusicPreviewUrl.includes('/album/') && !currentTrack.appleMusicPreviewUrl.includes('/song/') && !currentTrack.appleMusicPreviewUrl.includes('music.apple.com')) {
        // Only use appleMusicPreviewUrl if it's an actual preview URL (not an album/song URL or Apple Music link)
        audioPath = currentTrack.appleMusicPreviewUrl;
        isPreviewTrack = true;
        console.log('Global player loading Apple Music preview:', currentTrack.title, 'from:', audioPath);
      } else if (currentTrack.youtubeUrl) {
        // YouTube tracks are handled by the YouTube player component, not the audio element
        console.log('Track uses YouTube player:', currentTrack.title, 'URL:', currentTrack.youtubeUrl);
      } else {
        console.log('⚠️ No playable audio source found for track:', currentTrack.title);
        console.log('Track data:', {
          audioFile: currentTrack.audioFile,
          spotifyPreviewUrl: currentTrack.spotifyPreviewUrl,
          appleMusicPreviewUrl: currentTrack.appleMusicPreviewUrl,
          spotifyUrl: currentTrack.spotifyUrl,
          appleMusicUrl: currentTrack.appleMusicUrl,
          youtubeUrl: currentTrack.youtubeUrl
        });
      }

      if (audioPath) {
        // Remove old error listener before adding new one
        if (errorListenerRef.current && audioRef.current) {
          audioRef.current.removeEventListener('error', errorListenerRef.current);
        }

        console.log('Setting audio source:', audioPath);
        audioRef.current.src = audioPath;
        audioRef.current.load();

        // Create and store error handler
        const handleAudioError = (e: Event) => {
          const audioElement = e.target as HTMLAudioElement;
          const errorCode = audioElement.error?.code;
          const errorMessage = audioElement.error?.message;
          console.error('Global player audio loading error:', {
            code: errorCode,
            message: errorMessage,
            track: currentTrack.title,
            audioPath: audioPath,
            isPreviewTrack: isPreviewTrack
          });

          // For preview tracks with CORS/format errors, don't show error - just pause
          if (isPreviewTrack && (errorCode === 4 || errorCode === 2)) {
            console.log('Preview track failed to load due to CORS/format restrictions');
            setIsPlaying(false);
            setError(null); // Don't show error message
            return;
          }

          // Provide more specific error messages for other errors
          let userMessage = 'Failed to play audio';
          if (errorCode === 4) {
            userMessage = 'Audio format not supported';
          } else if (errorCode === 3) {
            userMessage = 'Audio loading aborted';
          } else if (errorCode === 2) {
            userMessage = 'Network error loading audio';
          } else if (errorCode === 1) {
            userMessage = 'Audio loading aborted by user';
          }

          setError(`${userMessage}: ${currentTrack.title}`);
          setIsPlaying(false);
        };
        errorListenerRef.current = handleAudioError;
        audioRef.current.addEventListener('error', handleAudioError);

        // Reset progress
        setProgress(0);
        setError(null);
      }
    }
  }, [currentTrackIndex, tracks]);

  // Handle play/pause
  useEffect(() => {
    // Check if track has actual playable preview URLs (not just DSP links)
    const hasActualSpotifyPreview = currentTrack?.spotifyPreviewUrl &&
      !currentTrack.spotifyPreviewUrl.includes('/track/') &&
      !currentTrack.spotifyPreviewUrl.includes('open.spotify.com');
    const hasActualApplePreview = currentTrack?.appleMusicPreviewUrl &&
      !currentTrack.appleMusicPreviewUrl.includes('/album/') &&
      !currentTrack.appleMusicPreviewUrl.includes('/song/') &&
      !currentTrack.appleMusicPreviewUrl.includes('music.apple.com');

    // A track is YouTube-only if it has a YouTube URL but no audio file and no actual preview URLs
    const isYouTubeTrack = currentTrack?.youtubeUrl && !currentTrack?.audioFile && !hasActualSpotifyPreview && !hasActualApplePreview;

    console.log('Play/pause effect running:', { isPlaying, isYouTubeTrack, hasAudioSrc: !!audioRef.current?.src, hasYouTubeRef: !!youtubePlayerRef.current?.play });

    if (isPlaying) {
      console.log('Global player starting playback');

      // Update Media Session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }

      // Handle audio element playback (only if not a YouTube track)
      if (!isYouTubeTrack && audioRef.current && audioRef.current.src) {
        console.log('Playing audio element');
        audioRef.current.play().catch(err => {
          console.error('Global player error playing audio:', err);
          setIsPlaying(false);
          // Only set error if it's not a user interaction abort
          if (err.name !== 'AbortError') {
            setError('Failed to play audio');
          }
        });
      }

      // Handle YouTube player playback
      if (isYouTubeTrack) {
        console.log('🎬 Global player: YouTube track detected');
        console.log('YouTube player ref status:', {
          hasRef: !!youtubePlayerRef.current,
          hasPlay: !!youtubePlayerRef.current?.play,
          refMethods: youtubePlayerRef.current ? Object.keys(youtubePlayerRef.current) : [],
          refObject: youtubePlayerRef.current
        });

        if (youtubePlayerRef.current?.play) {
          console.log('🎬 Global player: Calling YouTube player play()');
          try {
            youtubePlayerRef.current.play();
            console.log('✅ Global player: YouTube play() called successfully');
          } catch (err) {
            console.error('❌ Global player: Error calling YouTube play():', err);
          }
        } else {
          console.warn('⚠️ Global player: YouTube player ref not ready yet, retrying...');
          // Retry after a short delay to allow YouTube player to initialize
          const retryTimeout = setTimeout(() => {
            if (youtubePlayerRef.current?.play) {
              console.log('🎬 Global player: Retrying YouTube player play()');
              try {
                youtubePlayerRef.current.play();
                console.log('✅ Global player: YouTube play() called successfully on retry');
              } catch (err) {
                console.error('❌ Global player: Error calling YouTube play() on retry:', err);
              }
            }
          }, 500);

          return () => clearTimeout(retryTimeout);
        }
      }

      // Start progress tracking for both audio and YouTube
      progressIntervalRef.current = window.setInterval(() => {
        // Track audio progress
        if (audioRef.current && !audioRef.current.paused && audioRef.current.duration > 0) {
          const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(Math.min(currentProgress, 100)); // Cap at 100%
          setDuration(audioRef.current.duration);
        }
        // Track YouTube progress
        else if (isYouTubeTrack && youtubePlayerRef.current) {
          const currentTime = youtubePlayerRef.current.getCurrentTime?.() || 0;
          const videoDuration = youtubePlayerRef.current.getDuration?.() || 0;
          if (videoDuration > 0) {
            const currentProgress = (currentTime / videoDuration) * 100;
            setProgress(Math.min(currentProgress, 100)); // Cap at 100%
            setDuration(videoDuration);
          }
        }
      }, 100); // Update more frequently for smoother progress
    } else {
      console.log('Global player pausing playback');

      // Update Media Session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }

      // Handle audio element pause
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Handle YouTube player pause
      if (youtubePlayerRef.current?.pause) {
        console.log('Global player: Calling YouTube player pause()');
        youtubePlayerRef.current.pause();
      }

      // Stop progress tracking
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playTrack = (track: Track) => {
    console.log('Global player playTrack called:', track.title, 'Has audio:', !!track.audioFile, 'Has Spotify preview:', !!track.spotifyPreviewUrl, 'Has Apple preview:', !!track.appleMusicPreviewUrl, 'Has YouTube:', !!track.youtubeUrl, 'Has Spotify URL:', !!track.spotifyUrl);

    // Check if URLs are actual preview URLs or DSP links
    const hasSpotifyPreview = track.spotifyPreviewUrl && !track.spotifyPreviewUrl.includes('/track/') && !track.spotifyPreviewUrl.includes('open.spotify.com');
    const hasApplePreview = track.appleMusicPreviewUrl && !track.appleMusicPreviewUrl.includes('/album/') && !track.appleMusicPreviewUrl.includes('/song/') && !track.appleMusicPreviewUrl.includes('music.apple.com');

    // Priority: 1. Local audio file, 2. YouTube URL, 3. Preview URLs (Spotify/Apple Music), 4. DSP links
    // Note: Preview URLs may fail due to CORS, so we handle them gracefully
    if (track.audioFile || track.youtubeUrl || hasSpotifyPreview || hasApplePreview) {
      // Clear any previous errors
      setError(null);

      // Find track index
      const trackIndex = tracks.findIndex(t => t._id === track._id);
      console.log('Track index:', trackIndex, 'Total tracks:', tracks.length);

      if (trackIndex !== -1) {
        setCurrentTrackIndex(trackIndex);
      } else {
        // If track is not in the current tracks list, add it
        console.log('Track not found in list, adding it');
        setTracks(prev => [...prev, track]);
        setCurrentTrackIndex(tracks.length);
      }

      // Pause any currently playing audio before switching tracks
      if (audioRef.current && !audioRef.current.paused) {
        console.log('Pausing current audio before switching tracks');
        audioRef.current.pause();
      }

      // Pause any currently playing YouTube video before switching tracks
      if (youtubePlayerRef.current?.pause) {
        console.log('Pausing current YouTube video before switching tracks');
        youtubePlayerRef.current.pause();
      }

      // Reset progress and duration for new track
      setProgress(0);
      setDuration(0);

      // A track is YouTube-only if it has YouTube URL but no audio file and no actual preview URLs
      const isYouTubeOnlyTrack = !!track.youtubeUrl && !track.audioFile && !hasSpotifyPreview && !hasApplePreview;

      // For YouTube-only tracks, delay play state to allow player initialization
      if (isYouTubeOnlyTrack) {
        console.log('🎬 YouTube-only track detected, delaying play state to allow player initialization');
        // First set to false to ensure clean state
        setIsPlaying(false);
        // Then set to true after a delay to allow YouTube player to initialize
        setTimeout(() => {
          console.log('🎬 Setting isPlaying to true for YouTube track after delay');
          setIsPlaying(true);
        }, 300);
      } else {
        // For audio files or preview tracks, set playing state immediately
        setIsPlaying(true);
      }

      setIsVisible(true); // Show player when track is played
    } else if (track.spotifyUrl || track.appleMusicUrl) {
      // No playable content, but has DSP link - show player with DSP button
      console.log('Global player showing DSP-only track:', track.title);
      setError(null);
      setIsPlaying(false); // Don't set playing state for DSP-only tracks

      // Find track index
      const trackIndex = tracks.findIndex(t => t._id === track._id);
      console.log('Track index:', trackIndex, 'Total tracks:', tracks.length);

      if (trackIndex !== -1) {
        setCurrentTrackIndex(trackIndex);
      } else {
        // If track is not in the current tracks list, add it
        console.log('Track not found in list, adding it');
        setTracks(prev => [...prev, track]);
        setCurrentTrackIndex(tracks.length);
      }

      setIsVisible(true); // Show player with DSP button
    } else {
      console.warn('Track has no playable content:', track.title);
      setError('This track has no playable content');
    }
  };

  const togglePlayPause = () => {
    console.log('Global player togglePlayPause called, current state:', isPlaying, 'current track:', currentTrack?.title);

    // Check if URLs are actual preview URLs or DSP links
    const hasSpotifyPreview = currentTrack?.spotifyPreviewUrl && !currentTrack.spotifyPreviewUrl.includes('/track/') && !currentTrack.spotifyPreviewUrl.includes('open.spotify.com');
    const hasApplePreview = currentTrack?.appleMusicPreviewUrl && !currentTrack.appleMusicPreviewUrl.includes('/album/') && !currentTrack.appleMusicPreviewUrl.includes('/song/') && !currentTrack.appleMusicPreviewUrl.includes('music.apple.com');

    // Can play/pause if track has local audio file, actual preview URL, or YouTube URL
    if (currentTrack?.audioFile || hasSpotifyPreview || hasApplePreview || currentTrack?.youtubeUrl) {
      console.log('Toggling play/pause from', isPlaying, 'to', !isPlaying);
      setIsPlaying(!isPlaying);
    } else {
      console.warn('Cannot toggle play/pause - no playable content in current track');
    }
  };

  const nextTrack = () => {
    if (tracks.length > 0) {
      let nextIndex = (currentTrackIndex + 1) % tracks.length;
      let nextTrackData = tracks[nextIndex];

      // Check if track has actual preview URLs (not DSP links)
      const hasSpotifyPreview = (t: Track) => t.spotifyPreviewUrl && !t.spotifyPreviewUrl.includes('/track/') && !t.spotifyPreviewUrl.includes('open.spotify.com');
      const hasApplePreview = (t: Track) => t.appleMusicPreviewUrl && !t.appleMusicPreviewUrl.includes('/album/') && !t.appleMusicPreviewUrl.includes('/song/') && !t.appleMusicPreviewUrl.includes('music.apple.com');

      // Find next track with audio file, actual preview URL, or YouTube URL
      let attempts = 0;
      while (!nextTrackData.audioFile && !hasSpotifyPreview(nextTrackData) && !hasApplePreview(nextTrackData) && !nextTrackData.youtubeUrl && attempts < tracks.length) {
        nextIndex = (nextIndex + 1) % tracks.length;
        nextTrackData = tracks[nextIndex];
        attempts++;
      }

      if (nextTrackData.audioFile || hasSpotifyPreview(nextTrackData) || hasApplePreview(nextTrackData) || nextTrackData.youtubeUrl) {
        console.log('Global player playing next track:', nextTrackData.title, '(was playing:', isPlaying, ')');
        const wasPlaying = isPlaying;
        const isNextTrackYouTube = !!nextTrackData.youtubeUrl && !nextTrackData.audioFile;
        const isMobile = isMobileDevice();

        // Change to next track - updates React state
        setCurrentTrackIndex(nextIndex);

        // For YouTube tracks on mobile, set pending state instead of trying to play directly
        // Mobile browsers require a fresh user gesture for each new video
        if (isNextTrackYouTube && isMobile) {
          const match = nextTrackData.youtubeUrl!.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
          const nextVideoId = match ? match[1] : null;

          if (nextVideoId) {
            console.log('🎬📱 MOBILE: Setting pending YouTube play for:', nextVideoId);
            pendingVideoIdRef.current = nextVideoId;
            setPendingYouTubePlay(true);
            setIsPlaying(false); // Show as paused until user taps
          }
        } else {
          // For non-YouTube tracks or desktop, play normally
          if (wasPlaying) {
            setIsPlaying(true);
          }
        }
      }
    }
  };

  const previousTrack = () => {
    if (tracks.length > 0) {
      let prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
      let prevTrackData = tracks[prevIndex];

      // Check if track has actual preview URLs (not DSP links)
      const hasSpotifyPreview = (t: Track) => t.spotifyPreviewUrl && !t.spotifyPreviewUrl.includes('/track/') && !t.spotifyPreviewUrl.includes('open.spotify.com');
      const hasApplePreview = (t: Track) => t.appleMusicPreviewUrl && !t.appleMusicPreviewUrl.includes('/album/') && !t.appleMusicPreviewUrl.includes('/song/') && !t.appleMusicPreviewUrl.includes('music.apple.com');

      // Find previous track with audio file, actual preview URL, or YouTube URL
      let attempts = 0;
      while (!prevTrackData.audioFile && !hasSpotifyPreview(prevTrackData) && !hasApplePreview(prevTrackData) && !prevTrackData.youtubeUrl && attempts < tracks.length) {
        prevIndex = prevIndex === 0 ? tracks.length - 1 : prevIndex - 1;
        prevTrackData = tracks[prevIndex];
        attempts++;
      }

      if (prevTrackData.audioFile || hasSpotifyPreview(prevTrackData) || hasApplePreview(prevTrackData) || prevTrackData.youtubeUrl) {
        console.log('Global player playing previous track:', prevTrackData.title, '(was playing:', isPlaying, ')');
        const wasPlaying = isPlaying;
        const isPrevTrackYouTube = !!prevTrackData.youtubeUrl && !prevTrackData.audioFile;
        const isMobile = isMobileDevice();

        // Change to previous track - updates React state
        setCurrentTrackIndex(prevIndex);

        // For YouTube tracks on mobile, set pending state instead of trying to play directly
        // Mobile browsers require a fresh user gesture for each new video
        if (isPrevTrackYouTube && isMobile) {
          const match = prevTrackData.youtubeUrl!.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
          const prevVideoId = match ? match[1] : null;

          if (prevVideoId) {
            console.log('🎬📱 MOBILE: Setting pending YouTube play for:', prevVideoId);
            pendingVideoIdRef.current = prevVideoId;
            setPendingYouTubePlay(true);
            setIsPlaying(false); // Show as paused until user taps
          }
        } else {
          // For non-YouTube tracks or desktop, play normally
          if (wasPlaying) {
            setIsPlaying(true);
          }
        }
      }
    }
  };

  const handleSetVolume = useCallback((newVolume: number) => {
    console.log('Global player volume changed to:', newVolume);
    setVolume(newVolume);

    // Update YouTube player volume if playing YouTube
    if (currentTrack?.youtubeUrl && youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume?.(newVolume);
    }

    // Update audio element volume if playing audio
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  }, [currentTrack?.youtubeUrl, isMuted]);

  const toggleMute = useCallback(() => {
    console.log('Global player mute toggled');
    setIsMuted(!isMuted);

    // Update YouTube player mute if playing YouTube
    if (currentTrack?.youtubeUrl && youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume?.(!isMuted ? 0 : volume);
    }

    // Update audio element mute if playing audio
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? volume : 0;
    }
  }, [isMuted, volume, currentTrack?.youtubeUrl]);

  const seekTo = useCallback((position: number) => {
    // Handle YouTube player
    if (currentTrack?.youtubeUrl && youtubePlayerRef.current) {
      const duration = youtubePlayerRef.current.getDuration?.() || 0;
      const newTime = (position / 100) * duration;
      youtubePlayerRef.current.seekTo?.(newTime);
      setProgress(position);
      console.log('Global player seeked YouTube to:', position + '%');
    }
    // Handle audio file
    else if (audioRef.current) {
      const newTime = (position / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(position);
      console.log('Global player seeked to:', position + '%');
    }
  }, [currentTrack?.youtubeUrl]);

  const openExternalStream = useCallback((track: Track) => {
    // Open external DSP link (Spotify, Apple Music, etc.)
    const dspUrl = track.spotifyUrl || track.appleMusicUrl;
    if (dspUrl) {
      console.log('Opening external stream:', dspUrl);
      window.open(dspUrl, '_blank');
    }
  }, []);

  const setPlayerVisibility = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const getAudioElement = useCallback(() => {
    return audioRef.current;
  }, []);

  // Handle YouTube state changes for auto-advance when track ends
  const handleYouTubeStateChange = useCallback((state: number) => {
    console.log('🎬 YouTube state change in context:', state, '(0=ended, 1=playing, 2=paused)');

    // YouTube PlayerState.ENDED = 0
    if (state === 0) {
      console.log('🎬 YouTube track ended, auto-advancing to next track');
      // Small delay to ensure clean transition
      setTimeout(() => {
        nextTrack();
      }, 100);
    }
  }, [nextTrack]);

  // Handle YouTube time updates for progress tracking
  const handleYouTubeTimeUpdate = useCallback((currentTime: number, videoDuration: number) => {
    if (videoDuration > 0) {
      const newProgress = (currentTime / videoDuration) * 100;
      setProgress(Math.min(newProgress, 100));
      setDuration(videoDuration);
    }
  }, []);

  // Get the current YouTube video ID for the persistent player
  const currentYouTubeVideoId = useMemo(() => {
    if (!currentTrack?.youtubeUrl) return null;
    // Extract video ID from YouTube URL
    const match = currentTrack.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  }, [currentTrack?.youtubeUrl]);

  const reloadTracks = async () => {
    try {
      const data = await api.tracks.list();
      console.log('Reloaded tracks:', data.length);
      setTracks(data);

      // Update current track if it's in the new list
      if (currentTrack) {
        const updatedTrack = data.find(t => t._id === currentTrack._id);
        if (updatedTrack) {
          const newIndex = data.findIndex(t => t._id === currentTrack._id);
          setCurrentTrackIndex(newIndex);
        }
      }
    } catch (err: any) {
      console.error('Error reloading tracks:', err);
    }
  };

  // Setup Media Session API action handlers for background playback and lock screen controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      console.log('📱 Setting up Media Session action handlers');

      navigator.mediaSession.setActionHandler('play', () => {
        console.log('📱 Media Session: play action');
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('📱 Media Session: pause action');
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('📱 Media Session: previous track action');
        previousTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('📱 Media Session: next track action');
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        console.log('📱 Media Session: seek backward action');
        const skipTime = details.seekOffset || 10;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skipTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        console.log('📱 Media Session: seek forward action');
        const skipTime = details.seekOffset || 10;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(
            audioRef.current.duration,
            audioRef.current.currentTime + skipTime
          );
        }
      });

      // Cleanup on unmount
      return () => {
        console.log('📱 Cleaning up Media Session action handlers');
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      };
    }
  }, [nextTrack, previousTrack]);

  // Handle page visibility changes to maintain playback in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden - maintaining audio playback');
        // Don't pause audio when page goes to background
        // The audio element will continue playing
      } else {
        console.log('📱 Page visible - resuming normal operation');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const value: MusicPlayerContextType = useMemo(() => ({
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
    audioUnlocked,
    unlockAudio,
    pendingYouTubePlay,
    confirmYouTubePlay,
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume: handleSetVolume,
    toggleMute,
    seekTo,
    setPlayerVisibility,
    openExternalStream,
    reloadTracks,
    audioRef,
    youtubePlayerRef,
    handleYouTubeStateChange,
    handleYouTubeTimeUpdate,
    getAudioElement,
    currentYouTubeVideoId,
  }), [
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
    audioUnlocked,
    unlockAudio,
    pendingYouTubePlay,
    confirmYouTubePlay,
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    handleSetVolume,
    toggleMute,
    seekTo,
    setPlayerVisibility,
    openExternalStream,
    reloadTracks,
    handleYouTubeStateChange,
    handleYouTubeTimeUpdate,
    getAudioElement,
    currentYouTubeVideoId,
  ]);

  // Check if current track is a YouTube-only track (no audio file)
  const isYouTubeOnlyTrack = currentTrack?.youtubeUrl && !currentTrack?.audioFile;

  return (
    <MusicPlayerContext.Provider value={value}>
      {/* Persistent YouTube player - renders when:
          1. Current track is a YouTube-only track
          2. We're NOT on the discover page (discover page has its own visible player in NowPlayingCard)
          This ensures YouTube playback continues when navigating away from discover page */}
      {isYouTubeOnlyTrack && !isOnDiscoverPage && currentTrack && (
        <div
          className="fixed -bottom-[500px] -left-[500px] w-[300px] h-[200px] overflow-hidden pointer-events-none"
          aria-hidden="true"
          style={{ opacity: 0.01 }}
        >
          <YouTubeTrackPlayer
            youtubeUrl={currentTrack.youtubeUrl!}
            title={currentTrack.title}
            artist={currentTrack.artist}
            isPlaying={isPlaying}
            volume={isMuted ? 0 : volume}
            onStateChange={handleYouTubeStateChange}
            onTimeUpdate={handleYouTubeTimeUpdate}
            playerRef={youtubePlayerRef}
            aspectRatio="square"
          />
        </div>
      )}
      {children}
    </MusicPlayerContext.Provider>
  );
}
