import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ExternalLink, Music, Headphones } from 'lucide-react';
import { Track } from '../lib/api';
import { getMediaUrl } from '../lib/mediaUtils';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export function MusicDiscoverySection() {
  const {
    tracks,
    currentTrack,
    isPlaying,
    loading,
    error,
    playTrack
  } = useMusicPlayer();

  // Get the latest 8 tracks for the discovery grid
  const discoveryTracks = tracks.slice(0, 8);

  const handlePlayClick = (track: Track) => {
    // Check if track has playable content (audio file or YouTube)
    if (track.audioFile || track.youtubeUrl) {
      // Play using native Jamz.fun player
      playTrack(track);
    } else if (track.spotifyUrl) {
      // Open external DSP link
      window.open(track.spotifyUrl, '_blank');
    } else if (track.appleMusicUrl) {
      // Open Apple Music link
      window.open(track.appleMusicUrl, '_blank');
    }
  };

  const isCurrentTrackPlaying = (track: Track) => {
    return currentTrack?._id === track._id && isPlaying;
  };

  if (loading) {
    return (
      <section id="music-discovery" className="relative py-20 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-white/60">Loading music...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="music-discovery" className="relative py-20 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-xl text-white/60 mb-4">Unable to load music</p>
            <p className="text-white/40">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="music-discovery" className="relative py-20 bg-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center mb-6">
            <Headphones className="w-8 h-8 text-purple-400 mr-3" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Discover Music
            </h2>
          </div>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Explore the latest tracks from emerging artists on Jamz.fun. 
            Stream directly or discover on your favorite platforms.
          </p>
        </motion.div>

        {/* Discovery Playlist Grid */}
        {discoveryTracks.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-xl text-white/60 mb-4">No tracks available</p>
            <p className="text-white/40">Check back soon for new music!</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {discoveryTracks.map((track, index) => (
              <motion.div
                key={track._id}
                className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                {/* Track Artwork */}
                <div className="relative aspect-square">
                  <img
                    src={track.coverImage ? getMediaUrl(track.coverImage) : '/placeholder-album.svg'}
                    alt={`${track.title} by ${track.artist}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-album.svg';
                    }}
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <motion.button
                      onClick={() => handlePlayClick(track)}
                      className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isCurrentTrackPlaying(track) ? (
                        <Pause className="w-6 h-6 text-black ml-0" />
                      ) : (track.audioFile || track.youtubeUrl) ? (
                        <Play className="w-6 h-6 text-black ml-1" />
                      ) : (
                        <ExternalLink className="w-6 h-6 text-black" />
                      )}
                    </motion.button>
                  </div>

                  {/* Track Type Indicator */}
                  <div className="absolute top-2 right-2">
                    {track.audioFile ? (
                      <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        Stream
                      </div>
                    ) : track.youtubeUrl ? (
                      <div className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        YouTube
                      </div>
                    ) : (
                      <div className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        External
                      </div>
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm mb-1 truncate">
                    {track.title}
                  </h3>
                  <p className="text-white/60 text-xs truncate">
                    {track.artist}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}


      </div>
    </section>
  );
}
