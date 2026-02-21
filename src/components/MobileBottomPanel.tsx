import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Trophy, User, Wallet, Play, Pause, SkipBack, SkipForward, Music, Volume2 } from 'lucide-react';
import { getMediaUrl } from '../lib/mediaUtils';
import { SpotifyIcon } from './SpotifyIcon';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

// Base64 encoded placeholder image
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA2NkZGO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjAwRkY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmFkKSIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5KYW16LmZ1bjwvdGV4dD4KPC9zdmc+';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/'
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: Trophy,
    path: '/open-verse'
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: Music,
    path: '/discover'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile'
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    path: '/wallet'
  }
];

interface Track {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioFile: string;
  spotifyUrl?: string;
}

interface MobileBottomPanelProps {
  // Music player props
  currentTrack?: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  progress: number;
  duration: number;
  onSeek: (position: number) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onSpotifyOpen?: () => void;
  // Visibility
  isVisible?: boolean;
  // YouTube player ref for mobile playback
  youtubePlayerRef?: React.MutableRefObject<any>;
}

export function MobileBottomPanel({
  currentTrack,
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  progress,
  duration,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onSpotifyOpen,
  isVisible = true,
  youtubePlayerRef
}: MobileBottomPanelProps) {
  const location = useLocation();
  const { pendingYouTubePlay, confirmYouTubePlay } = useMusicPlayer();

  // Determine which nav item is active based on current path
  const getActiveItem = (path: string) => {
    if (path === '/') return 'home';
    if (path.startsWith('/discover')) return 'discover';
    if (path.startsWith('/open-verse')) return 'campaigns';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/wallet')) return 'wallet';
    return '';
  };

  const activeItem = getActiveItem(location.pathname);

  // Always show the bottom navigation, even if music player is not visible
  // Only hide completely if isVisible is false (footer is showing)
  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Unified Spotify-style bottom panel with subtle gradient */}
      <div className="bg-black/95 backdrop-blur-xl border-t border-white/10">
        {/* Mini Music Player Section - Only show when track is available */}
        {currentTrack && (
          <div className="px-3 py-1.5 border-b border-white/5 bg-gradient-to-r from-[#0066FF]/5 to-[#6600FF]/5">
            <div className="flex items-center gap-2">
              {/* Album Art */}
              <img
                src={currentTrack.coverImage ? getMediaUrl(currentTrack.coverImage) : FALLBACK_IMAGE}
                alt={`${currentTrack.title} Cover`}
                className="w-12 h-12 rounded-lg object-cover"
              />

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-white/70 truncate">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Compact Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onPrevious}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                {/* Play/Pause Button - Shows pulsing animation when YouTube track needs tap */}
                {pendingYouTubePlay ? (
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🎵📱 Mobile: User confirmed YouTube play');
                      confirmYouTubePlay();
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center"
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(147, 51, 234, 0.4)',
                        '0 0 0 8px rgba(147, 51, 234, 0)',
                        '0 0 0 0 rgba(147, 51, 234, 0)'
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </motion.button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🎵 Mobile bottom panel: Play/Pause clicked', {
                        isPlaying,
                        hasYouTubeUrl: !!(currentTrack as any)?.youtubeUrl,
                        hasYouTubeRef: !!youtubePlayerRef?.current,
                        trackTitle: currentTrack?.title
                      });
                      onPlayPause();
                    }}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                {currentTrack?.spotifyUrl && onSpotifyOpen && (
                  <button
                    onClick={onSpotifyOpen}
                    className="p-2 text-green-400 hover:text-green-300 transition-colors"
                    title="Open on Spotify"
                  >
                    <SpotifyIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Section */}
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-2 relative rounded-xl transition-all duration-200"
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-white/10"
                    layoutId="activeTab"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative z-10 mb-1">
                  <Icon
                    className={`w-6 h-6 transition-all duration-200 ${
                      isActive
                        ? 'text-[#0066FF] scale-110'
                        : 'text-white/70 hover:text-white/90'
                    }`}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-semibold transition-all duration-200 relative z-10 ${
                    isActive
                      ? 'text-[#0066FF]'
                      : 'text-white/70'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
