import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Loader, CheckCircle2, AlertCircle, Music, ExternalLink, Edit2, Save } from 'lucide-react';
import { SpotifyIcon } from './SpotifyIcon';

const API_URL = '/api';

interface EnrichedTrack {
  title: string;
  artist: string;
  youtubeUrl: string;
  duration: number;
  coverImageUrl?: string;
  spotifyUrl?: string;
  spotifyPreviewUrl?: string;
  appleMusicUrl?: string;
  appleMusicPreviewUrl?: string;
}

interface EnrichResult {
  success: boolean;
  data?: EnrichedTrack;
  url?: string;
  error?: string;
}

interface BulkYouTubeImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkYouTubeImport({ onClose, onSuccess }: BulkYouTubeImportProps) {
  const [youtubeUrls, setYoutubeUrls] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [enrichedTracks, setEnrichedTracks] = useState<EnrichResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleEnrich = async () => {
    setError(null);
    setIsEnriching(true);

    try {
      // Parse URLs from textarea (one per line)
      const urls = youtubeUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      if (urls.length === 0) {
        throw new Error('Please enter at least one YouTube URL');
      }

      console.log('Enriching URLs:', urls);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch(`${API_URL}/tracks/bulk-enrich-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ youtubeUrls: urls })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enrich YouTube URLs');
      }

      const data = await response.json();
      console.log('Enrichment results:', data);

      setEnrichedTracks(data.results);
    } catch (err: any) {
      console.error('Error enriching URLs:', err);
      setError(err.message || 'Failed to enrich YouTube URLs');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    try {
      // Filter only successful enrichments
      const successfulTracks = enrichedTracks
        .filter(result => result.success && result.data)
        .map(result => result.data);

      if (successfulTracks.length === 0) {
        throw new Error('No tracks to create');
      }

      console.log('Creating tracks:', successfulTracks);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch(`${API_URL}/tracks/bulk-create-from-enriched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tracks: successfulTracks })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tracks');
      }

      const data = await response.json();
      console.log('Creation results:', data);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating tracks:', err);
      setError(err.message || 'Failed to create tracks');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (index: number, field: keyof EnrichedTrack, value: string) => {
    const newTracks = [...enrichedTracks];
    if (newTracks[index].data) {
      newTracks[index].data = {
        ...newTracks[index].data!,
        [field]: value
      };
      setEnrichedTracks(newTracks);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Youtube className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold gradient-text">Bulk Import from YouTube</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {enrichedTracks.length === 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  YouTube URLs (one per line)
                </label>
                <textarea
                  value={youtubeUrls}
                  onChange={(e) => setYoutubeUrls(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full h-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                  disabled={isEnriching}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-white/60">
                <Youtube className="w-4 h-4" />
                <span>Paste YouTube URLs to automatically extract metadata and find DSP links</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Enriched Tracks ({enrichedTracks.filter(r => r.success).length}/{enrichedTracks.length})
                </h3>
                <button
                  onClick={() => {
                    setEnrichedTracks([]);
                    setYoutubeUrls('');
                  }}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Start Over
                </button>
              </div>

              {enrichedTracks.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {result.success && result.data ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        {/* Cover Image */}
                        {result.data.coverImageUrl && (
                          <img
                            src={result.data.coverImageUrl}
                            alt={result.data.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          {editingIndex === index ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={result.data.title}
                                onChange={(e) => handleEdit(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                placeholder="Track Title"
                              />
                              <input
                                type="text"
                                value={result.data.artist}
                                onChange={(e) => handleEdit(index, 'artist', e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                placeholder="Artist Name"
                              />
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold text-white truncate">{result.data.title}</h4>
                              <p className="text-sm text-white/60 truncate">{result.data.artist}</p>
                            </>
                          )}

                          {/* DSP Links */}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-white/40">Duration: {formatDuration(result.data.duration)}</span>
                            {result.data.spotifyUrl && (
                              <a
                                href={result.data.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300"
                                title="Spotify"
                              >
                                <SpotifyIcon className="w-4 h-4" />
                              </a>
                            )}
                            {result.data.appleMusicUrl && (
                              <a
                                href={result.data.appleMusicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-400 hover:text-red-300"
                                title="Apple Music"
                              >
                                <Music className="w-4 h-4" />
                              </a>
                            )}
                            {result.data.youtubeUrl && (
                              <a
                                href={result.data.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-500 hover:text-red-400"
                                title="YouTube"
                              >
                                <Youtube className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          {editingIndex === index ? (
                            <Save className="w-5 h-5" />
                          ) : (
                            <Edit2 className="w-5 h-5" />
                          )}
                        </button>

                        {/* Success Icon */}
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{result.url}</p>
                        <p className="text-xs text-red-400 mt-1">{result.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            disabled={isEnriching || isCreating}
          >
            Cancel
          </button>

          {enrichedTracks.length === 0 ? (
            <button
              onClick={handleEnrich}
              disabled={isEnriching || !youtubeUrls.trim()}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isEnriching ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <Youtube className="w-5 h-5" />
                  <span>Enrich Tracks</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating || enrichedTracks.filter(r => r.success).length === 0}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Create {enrichedTracks.filter(r => r.success).length} Tracks</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

