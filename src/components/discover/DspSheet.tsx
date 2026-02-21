import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Search } from 'lucide-react';
import { SpotifyIcon } from '../SpotifyIcon';
import { AppleMusicIcon, YouTubeMusicIcon, DeezerIcon, TidalIcon, SoundCloudIcon, AmazonMusicIcon } from '../icons';
import { Track } from '../../lib/api';

interface DspSheetProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

// Generate search URLs for platforms that don't have direct links
function generateSearchUrl(platform: string, artist: string, title: string): string {
  const query = encodeURIComponent(`${artist} ${title}`);
  switch (platform) {
    case 'spotify':
      return `https://open.spotify.com/search/${query}`;
    case 'apple':
      return `https://music.apple.com/search?term=${query}`;
    case 'youtube':
      return `https://music.youtube.com/search?q=${query}`;
    case 'deezer':
      return `https://www.deezer.com/search/${query}`;
    case 'tidal':
      return `https://tidal.com/search?q=${query}`;
    case 'soundcloud':
      return `https://soundcloud.com/search?q=${query}`;
    case 'amazon':
      return `https://music.amazon.com/search/${query}`;
    default:
      return '#';
  }
}

export function DspSheet({ isOpen, onClose, track }: DspSheetProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Build DSP options with both direct links and search fallbacks
  const dspOptions = useMemo(() => {
    if (!track) return [];

    const options = [
      {
        id: 'spotify',
        name: 'Spotify',
        url: track.spotifyUrl || generateSearchUrl('spotify', track.artist, track.title),
        hasDirectLink: !!track.spotifyUrl,
        icon: <SpotifyIcon className="w-6 h-6" />,
        color: 'bg-[#1DB954] hover:bg-[#1ed760]',
        description: track.spotifyUrl ? 'Open in Spotify' : 'Search on Spotify'
      },
      {
        id: 'apple',
        name: 'Apple Music',
        url: track.appleMusicUrl || generateSearchUrl('apple', track.artist, track.title),
        hasDirectLink: !!track.appleMusicUrl,
        icon: <AppleMusicIcon className="w-6 h-6" />,
        color: 'bg-gradient-to-r from-[#FA2D48] to-[#FA233B] hover:from-[#FB3D58] hover:to-[#FB334B]',
        description: track.appleMusicUrl ? 'Open in Apple Music' : 'Search on Apple Music'
      },
      {
        id: 'youtube',
        name: 'YouTube Music',
        url: track.youtubeUrl || generateSearchUrl('youtube', track.artist, track.title),
        hasDirectLink: !!track.youtubeUrl,
        icon: <YouTubeMusicIcon className="w-6 h-6" />,
        color: 'bg-[#FF0000] hover:bg-[#CC0000]',
        description: track.youtubeUrl ? 'Open in YouTube Music' : 'Search on YouTube Music'
      },
      {
        id: 'amazon',
        name: 'Amazon Music',
        url: generateSearchUrl('amazon', track.artist, track.title),
        hasDirectLink: false,
        icon: <AmazonMusicIcon className="w-6 h-6" />,
        color: 'bg-gradient-to-r from-[#25D1DA] to-[#232F3E] hover:from-[#35E1EA] hover:to-[#333F4E]',
        description: 'Search on Amazon Music'
      },
      {
        id: 'deezer',
        name: 'Deezer',
        url: generateSearchUrl('deezer', track.artist, track.title),
        hasDirectLink: false,
        icon: <DeezerIcon className="w-6 h-6" />,
        color: 'bg-[#FEAA2D] hover:bg-[#FFBA4D] text-black',
        description: 'Search on Deezer'
      },
      {
        id: 'tidal',
        name: 'Tidal',
        url: generateSearchUrl('tidal', track.artist, track.title),
        hasDirectLink: false,
        icon: <TidalIcon className="w-6 h-6" />,
        color: 'bg-[#000000] hover:bg-[#1A1A1A] border border-white/20',
        description: 'Search on Tidal'
      },
      {
        id: 'soundcloud',
        name: 'SoundCloud',
        url: generateSearchUrl('soundcloud', track.artist, track.title),
        hasDirectLink: false,
        icon: <SoundCloudIcon className="w-6 h-6" />,
        color: 'bg-[#FF5500] hover:bg-[#FF6A1A]',
        description: 'Search on SoundCloud'
      }
    ];

    // Sort: direct links first, then search links
    return options.sort((a, b) => {
      if (a.hasDirectLink && !b.hasDirectLink) return -1;
      if (!a.hasDirectLink && b.hasDirectLink) return 1;
      return 0;
    });
  }, [track]);

  if (!track) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 to-black rounded-t-3xl border-t border-white/10 shadow-2xl max-h-[80vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dsp-sheet-title"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 id="dsp-sheet-title" className="text-lg font-bold text-white">
                  Stream On
                </h2>
                <p className="text-sm text-white/70 mt-0.5 truncate max-w-[200px]">
                  {track.title} • {track.artist}
                </p>
              </div>
              <button
                onClick={onClose}
                className="touch-target flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-colors focus-ring"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* DSP Options */}
            <div className="px-6 py-4 space-y-2.5 overflow-y-auto max-h-[60vh]">
              {dspOptions.length > 0 ? (
                <>
                  {/* Section: Direct Links */}
                  {dspOptions.some(o => o.hasDirectLink) && (
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2 px-1">
                      Direct Links
                    </div>
                  )}
                  {dspOptions.filter(o => o.hasDirectLink).map((option) => (
                    <motion.a
                      key={option.id}
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`touch-target flex items-center gap-3 p-3.5 ${option.color} rounded-xl transition-all shadow-lg hover:shadow-xl focus-ring`}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg">
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm">
                          {option.name}
                        </div>
                        <div className="text-white/70 text-xs">
                          {option.description}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/60 flex-shrink-0" />
                    </motion.a>
                  ))}

                  {/* Section: Search Links */}
                  {dspOptions.some(o => !o.hasDirectLink) && (
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2 mt-4 px-1 flex items-center gap-1.5">
                      <Search className="w-3 h-3" />
                      Search on other platforms
                    </div>
                  )}
                  {dspOptions.filter(o => !o.hasDirectLink).map((option) => (
                    <motion.a
                      key={option.id}
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`touch-target flex items-center gap-3 p-3 ${option.color} rounded-xl transition-all shadow-md hover:shadow-lg focus-ring opacity-90 hover:opacity-100`}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                    >
                      <div className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg">
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">
                          {option.name}
                        </div>
                        <div className="text-white/60 text-xs">
                          {option.description}
                        </div>
                      </div>
                      <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
                    </motion.a>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-white/70">
                  No streaming platforms available for this track
                </div>
              )}
            </div>

            {/* Safe area padding for mobile devices */}
            <div className="h-safe-area-inset-bottom pb-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

