import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music as MusicIcon, Headphones, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Track } from '../../lib/api';
import { getMediaUrl } from '../../lib/mediaUtils';

// Custom DSP icons as SVG components for better quality
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81.84-.553 1.472-1.287 1.88-2.208.186-.42.293-.865.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.455-2.1-1.407-.26-.786.07-1.63.797-2.143.47-.33.99-.478 1.54-.56.5-.073 1-.097 1.448-.363.267-.158.385-.408.385-.72V9.89c0-.448-.177-.617-.61-.55-.503.075-1.006.156-1.51.238L9.22 10.3c-.32.053-.58.17-.74.476a1.99 1.99 0 00-.18.858v7.053c0 .462-.07.912-.278 1.333-.31.625-.793 1.013-1.442 1.2-.365.104-.734.157-1.115.17-.94.034-1.78-.482-2.107-1.437-.262-.776.064-1.628.79-2.146.454-.324.96-.476 1.488-.552.617-.088 1.2-.115 1.66-.445.275-.198.388-.466.388-.79V8.353c0-.228.03-.46.103-.674.106-.32.324-.52.635-.602.268-.07.543-.114.816-.155l6.6-1.018c.226-.037.456-.06.687-.065.617-.015.854.204.854.82v4.455z"/>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track, index: number) => void;
  userVotes?: Record<string, 'upvote' | 'downvote' | null>;
  onVote?: (trackId: string, voteType: 'upvote' | 'downvote') => void;
  className?: string;
  hideHeader?: boolean; // Hide the Queue header (used when header is rendered separately)
}

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23666" text-anchor="middle" dy=".3em"%3E♪%3C/text%3E%3C/svg%3E';

export function TrackList({
  tracks,
  currentTrack,
  isPlaying,
  onTrackSelect,
  userVotes = {},
  onVote,
  className = '',
  hideHeader = false
}: TrackListProps) {
  const activeTrackRef = useRef<HTMLDivElement>(null);

  // Scroll active track into view when it changes
  useEffect(() => {
    if (activeTrackRef.current) {
      activeTrackRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentTrack?._id]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header - Styled consistently for mobile and desktop (hidden when rendered separately) */}
      {!hideHeader && (
        <div className="discover-tracklist-header flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-purple-900/30 to-pink-900/20 rounded-lg border border-white/10 mb-2">
          <span className="text-sm font-semibold text-white">Queue</span>
          <span className="text-xs font-medium text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">{tracks.length} tracks</span>
        </div>
      )}

      {/* Track List - Added pb-6 for mobile bottom padding to ensure last track is fully visible */}
      <div className="space-y-1 px-2 pt-1 pb-6">
        {tracks.map((track, index) => {
          const isActive = currentTrack?._id === track._id;
          const isCurrentlyPlaying = isActive && isPlaying;

          return (
            <motion.div
              key={track._id}
              ref={isActive ? activeTrackRef : null}
              className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-l-2 border-purple-500'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
              onClick={() => onTrackSelect(track, index)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Track Number / Play Indicator */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {isCurrentlyPlaying ? (
                  <div className="flex gap-0.5">
                    <div className="w-1 h-4 bg-purple-500 animate-pulse rounded-full" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-4 bg-purple-500 animate-pulse rounded-full" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-4 bg-purple-500 animate-pulse rounded-full" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : isActive ? (
                  <Pause className="w-5 h-5 text-purple-400" />
                ) : (
                  <span className="text-sm text-white/40 group-hover:hidden">
                    {index + 1}
                  </span>
                )}
                {!isActive && (
                  <Play className="w-5 h-5 text-white/70 hidden group-hover:block" />
                )}
              </div>

              {/* Album Artwork */}
              <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-800">
                <img
                  src={track.coverImage ? getMediaUrl(track.coverImage) : FALLBACK_IMAGE}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-xs truncate ${
                  isActive ? 'text-purple-400' : 'text-white'
                }`}>
                  {track.title}
                </h4>
                <p className="text-[10px] text-white/60 truncate">
                  {track.artist}
                </p>
              </div>

              {/* DSP Icons & Voting */}
              <div className="flex-shrink-0 flex items-center gap-2 ml-auto mr-2">
                {/* DSP Icons - always show, disabled if no URL */}
                <div className="flex items-center gap-1">
                  {track.spotifyUrl ? (
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="Listen on Spotify"
                    >
                      <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                    </a>
                  ) : (
                    <div className="p-1 opacity-30 cursor-not-allowed" title="Spotify link not available">
                      <SpotifyIcon className="w-4 h-4 text-white/40" />
                    </div>
                  )}
                  {track.appleMusicUrl ? (
                    <a
                      href={track.appleMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="Listen on Apple Music"
                    >
                      <AppleMusicIcon className="w-4 h-4 text-[#FA243C]" />
                    </a>
                  ) : (
                    <div className="p-1 opacity-30 cursor-not-allowed" title="Apple Music link not available">
                      <AppleMusicIcon className="w-4 h-4 text-white/40" />
                    </div>
                  )}
                  {track.youtubeUrl ? (
                    <a
                      href={track.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="Watch on YouTube"
                    >
                      <YoutubeIcon className="w-4 h-4 text-[#FF0000]" />
                    </a>
                  ) : (
                    <div className="p-1 opacity-30 cursor-not-allowed" title="YouTube link not available">
                      <YoutubeIcon className="w-4 h-4 text-white/40" />
                    </div>
                  )}
                </div>

                {/* Voting Buttons */}
                <div className="flex items-center gap-0.5 border-l border-white/10 pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote?.(track._id, 'upvote');
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      userVotes[track._id] === 'upvote'
                        ? 'bg-green-500/20 text-green-400'
                        : 'hover:bg-white/10 text-white/50 hover:text-green-400'
                    }`}
                    title="Upvote"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-white/60 min-w-[16px] text-center">
                    {(track.upvotes || 0) - (track.downvotes || 0)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote?.(track._id, 'downvote');
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      userVotes[track._id] === 'downvote'
                        ? 'bg-red-500/20 text-red-400'
                        : 'hover:bg-white/10 text-white/50 hover:text-red-400'
                    }`}
                    title="Downvote"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div className="flex-shrink-0 text-[10px] text-white/40 w-10 text-right">
                {formatTime(track.duration)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

