import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, Track } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { StaticGridBackground } from '../components/StaticGridBackground';
import { DiscoverHeader } from '../components/discover/DiscoverHeader';
import { NowPlayingCard } from '../components/discover/NowPlayingCard';
import { TrackList } from '../components/discover/TrackList';

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
    loading,
    error,
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    reloadTracks,
    youtubePlayerRef,
    handleYouTubeStateChange,
    handleYouTubeTimeUpdate
  } = useMusicPlayer();

  // Detect screen size for responsive behavior
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Voting state
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote' | null>>({});

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const trackIndex = tracks.findIndex(t => t._id === trackId);
      if (trackIndex !== -1) {
        handlePlayTrack(tracks[trackIndex], trackIndex);
      }
    }
  }, [searchParams, tracks]);

  const handlePlayTrack = (track: Track, index: number) => {
    console.log('🎵 Discover page playing track:', track.title);
    playTrack(track);
  };

  const handleVote = async (trackId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      if (window.confirm('You need to log in to vote on tracks. Would you like to log in now?')) {
        navigate('/login');
      }
      return;
    }

    try {
      const { userVote } = await api.tracks.vote(trackId, voteType);
      setUserVotes(prev => ({
        ...prev,
        [trackId]: userVote
      }));
      await reloadTracks();
    } catch (error) {
      console.error('Error voting on track:', error);
      if (error instanceof Error && error.message.includes('401')) {
        if (window.confirm('Your session has expired. Would you like to log in again?')) {
          navigate('/login');
        }
      }
    }
  };

  const handleShare = () => {
    if (!currentTrack) return;

    const shareUrl = `${window.location.origin}/discover?track=${currentTrack._id}`;

    if (navigator.share) {
      navigator.share({
        title: currentTrack.title,
        text: `Check out ${currentTrack.title} by ${currentTrack.artist} on Jamz.fun!`,
        url: shareUrl
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const currentTime = (progress / 100) * duration;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading music...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('Failed to load tracks')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-xl text-white/70 mb-4">Unable to load music</p>
          <p className="text-white/50">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <StaticGridBackground />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto md:px-4 md:py-8">
        {/* Mobile Layout - Fixed player with scrollable track list */}
        {/* Use isMobile to conditionally render to prevent duplicate YouTube players */}
        {isMobile && (
        <div className="md:hidden" style={{ minHeight: 'calc(100vh + 1px)', touchAction: 'pan-y' }}>
          {/* Fixed Header - Below WebsiteNav (80px) */}
          <div className="fixed top-[80px] left-0 right-0 z-30">
            <div className="mx-3 pt-2">
              <DiscoverHeader compact />
            </div>
          </div>

          {/* Fixed Now Playing Card - Below header (80px nav + 8px pt + ~60px compact header) = ~148px */}
          {/* z-25 ensures YouTube player appears above the track list (z-10) */}
          <div className="fixed top-[148px] left-0 right-0 z-[25]">
            <div className="mx-3">
              <NowPlayingCard
                track={currentTrack}
                isPlaying={isPlaying}
                progress={progress}
                duration={duration}
                currentTime={currentTime}
                volume={volume}
                isAuthenticated={isAuthenticated}
                userVote={currentTrack ? userVotes[currentTrack._id] : null}
                onPlayPause={togglePlayPause}
                onPrevious={previousTrack}
                onNext={nextTrack}
                onSeek={seekTo}
                onVote={(voteType) => currentTrack && handleVote(currentTrack._id, voteType)}
                onShare={handleShare}
                youtubePlayerRef={youtubePlayerRef}
                onYouTubeStateChange={handleYouTubeStateChange}
                onYouTubeTimeUpdate={handleYouTubeTimeUpdate}
                renderYouTubeInMobile={true}
              />
            </div>
          </div>

          {/* Fixed Track List Container - Below YouTube player with internal scrolling */}
          {/* Position: 148px (header) + (100vw - 24px margins) * 0.5625 (16:9 ratio) + 4px gap */}
          <div className="fixed left-0 right-0 bottom-[144px] z-10" style={{ top: 'calc(152px + 56.25vw)' }}>
            <div className="h-full mx-3 bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-md rounded-xl border border-white/10 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              <div className="px-2 py-2 pb-4">
                <TrackList
                  tracks={tracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onTrackSelect={handlePlayTrack}
                  userVotes={userVotes}
                  onVote={handleVote}
                  hideHeader={true}
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Desktop Layout */}
        {!isMobile && (
          <div className="hidden md:grid md:grid-cols-3 md:gap-8">
            {/* Left Column - Now Playing Card */}
            <div className="md:col-span-1">
              <div className="sticky top-8">
                <NowPlayingCard
                  track={currentTrack}
                  isPlaying={isPlaying}
                  progress={progress}
                  duration={duration}
                  currentTime={currentTime}
                  volume={volume}
                  isAuthenticated={isAuthenticated}
                  userVote={currentTrack ? userVotes[currentTrack._id] : null}
                  onPlayPause={togglePlayPause}
                  onPrevious={previousTrack}
                  onNext={nextTrack}
                  onSeek={seekTo}
                  onVote={(voteType) => currentTrack && handleVote(currentTrack._id, voteType)}
                  onShare={handleShare}
                  youtubePlayerRef={youtubePlayerRef}
                  onYouTubeStateChange={handleYouTubeStateChange}
                  onYouTubeTimeUpdate={handleYouTubeTimeUpdate}
                  renderYouTubeInMobile={false}
                />
              </div>
            </div>

            {/* Right Column - Track List */}
            <div className="md:col-span-2">
              <DiscoverHeader />
              <div className="bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <div className="overflow-y-auto h-full pb-4" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                  <TrackList
                    tracks={tracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTrackSelect={handlePlayTrack}
                    userVotes={userVotes}
                    onVote={handleVote}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

