import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Music, Users, Crown, Trophy, ArrowLeft, Send,
  ExternalLink, CheckCircle, Play, Link as LinkIcon,
  Mic, Radio, Headphones
} from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';

interface Game {
  _id: string;
  gameId: string;
  title: string;
  description: string;
  gameType: 'free' | 'msense_token' | 'premium';
  maxPlayers: number;
  entryFee: number;
  prizePool: { totalAmount: number; currency: string };
  allowedPlatforms: string[];
  status: 'waiting' | 'in_progress' | 'completed';
  hostId: {
    _id: string;
    username: string;
  };
  players: Array<{
    _id: string;
    userId: { _id: string; username: string };
    username: string;
    isReady: boolean;
  }>;
  createdAt: string;
}

interface SongSubmission {
  songTitle: string;
  artist: string;
  platform: string;
  url: string;
}

export default function MusicSenseSubmission() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [songSubmission, setSongSubmission] = useState<SongSubmission>({
    songTitle: '',
    artist: '',
    platform: '',
    url: ''
  });

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await api.musicSense.getGame(gameId!);
      setGame(response);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Game not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSong = async () => {
    if (!isAuthenticated) {
      navigate(`/auth?return=/musicsense/submit/${gameId}`);
      return;
    }

    if (!songSubmission.songTitle || !songSubmission.artist || !songSubmission.platform || !songSubmission.url) {
      setError('Please fill in all song details');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Submit song via API (you'll need to implement this endpoint)
      await api.musicSense.submitSong(gameId!, songSubmission);
      setSubmitted(true);
      
      // Redirect to game lobby after successful submission
      setTimeout(() => {
        navigate(`/musicsense/game/${gameId}`);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error submitting song:', error);
      setError(error.message || 'Failed to submit song. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'spotify': return <Music className="w-5 h-5" />;
      case 'youtube': return <Play className="w-5 h-5" />;
      case 'apple-music': return <Headphones className="w-5 h-5" />;
      case 'soundcloud': return <Radio className="w-5 h-5" />;
      case 'suno': return <Mic className="w-5 h-5" />;
      default: return <Music className="w-5 h-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'spotify': return 'text-green-400 border-green-400 hover:bg-green-400/10';
      case 'youtube': return 'text-red-400 border-red-400 hover:bg-red-400/10';
      case 'apple-music': return 'text-gray-400 border-gray-400 hover:bg-gray-400/10';
      case 'soundcloud': return 'text-orange-400 border-orange-400 hover:bg-orange-400/10';
      case 'suno': return 'text-purple-400 border-purple-400 hover:bg-purple-400/10';
      default: return 'text-blue-400 border-blue-400 hover:bg-blue-400/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Game Not Found</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate('/musicsense')}
            className="glass-button-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to MusicSense
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Song Submitted!</h2>
          <p className="text-white/60 mb-6">
            Your song has been submitted successfully. Redirecting to game lobby...
          </p>
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const gameTypeInfo = {
    free: { label: 'Free Game', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    msense_token: { label: 'MSENSE Token Game', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    premium: { label: 'Premium Game', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
  }[game?.gameType || 'free'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/musicsense')}
            className="glass-button-small"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold">Submit Your Song</h1>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Song Submission */}
          <div className="space-y-6">
            {/* Game Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{game?.title}</h2>
                  <p className="text-white/60 text-sm">{game?.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-white/60">
                    {game?.hostId.username}
                  </span>
                </div>
              </div>

              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${gameTypeInfo.bgColor} ${gameTypeInfo.color}`}>
                {gameTypeInfo.label}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Players:</span>
                  <span className="ml-2 font-medium">{game?.players.length}/{game?.maxPlayers}</span>
                </div>
                <div>
                  <span className="text-white/60">Prize Pool:</span>
                  <span className="ml-2 font-medium text-purple-400">
                    {game?.prizePool.totalAmount} {game?.prizePool.currency}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Song Submission Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-bold mb-4">Submit Your Song</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <div className="grid grid-cols-2 gap-2">
                    {game?.allowedPlatforms.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setSongSubmission(prev => ({ ...prev, platform }))}
                        className={`p-3 border rounded-lg transition-all duration-200 flex items-center gap-2 ${
                          songSubmission.platform === platform
                            ? `${getPlatformColor(platform)} bg-opacity-20`
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        {getPlatformIcon(platform)}
                        <span className="text-sm font-medium capitalize">
                          {platform.replace('-', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Song Details */}
                <div>
                  <label className="block text-sm font-medium mb-2">Song Title</label>
                  <input
                    type="text"
                    value={songSubmission.songTitle}
                    onChange={(e) => setSongSubmission(prev => ({ ...prev, songTitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter song title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artist</label>
                  <input
                    type="text"
                    value={songSubmission.artist}
                    onChange={(e) => setSongSubmission(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter artist name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Song URL</label>
                  <input
                    type="url"
                    value={songSubmission.url}
                    onChange={(e) => setSongSubmission(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Paste song link here"
                  />
                  <p className="text-xs text-white/50 mt-1">
                    Paste a link from {songSubmission.platform || 'your selected platform'}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitSong}
                  disabled={submitting || !songSubmission.songTitle || !songSubmission.artist || !songSubmission.platform || !songSubmission.url}
                  className="w-full glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Song & Join Game
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300 text-center">
                      You'll need to connect your wallet to submit a song
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Tournament Tree Preview */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-bold mb-4">Tournament Bracket</h3>
              <div className="text-center">
                <div className="w-full min-h-64 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-white/10">
                  {game && <TournamentTreePreview game={game} />}
                </div>
              </div>
            </motion.div>

            {/* Current Players */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-bold mb-4">Current Players</h3>
              <div className="space-y-2">
                {game?.players.map((player, index) => (
                  <div key={player._id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      {player.userId._id === game.hostId._id && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-sm">{player.username}</span>
                    </div>
                    {player.isReady && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: (game?.maxPlayers || 0) - (game?.players.length || 0) }).map((_, index) => (
                  <div key={`empty-${index}`} className="flex items-center p-2 bg-white/5 rounded border border-dashed border-white/20">
                    <span className="text-sm text-white/40">Waiting for player...</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tournament Tree Preview Component
interface TournamentTreePreviewProps {
  game: Game;
}

function TournamentTreePreview({ game }: TournamentTreePreviewProps) {
  const maxPlayers = game.maxPlayers;
  const players = game.players;

  // Calculate tournament structure
  const getTreeStructure = () => {
    const validTournamentSizes = [2, 4, 8, 16, 32];
    const tournamentSize = validTournamentSizes.find(size => size >= maxPlayers) || 16;
    const rounds = Math.ceil(Math.log2(tournamentSize));
    const structure = [];

    for (let i = 0; i < rounds; i++) {
      const slotsInRound = Math.pow(2, i);
      let label = "";

      if (i === 0) label = "Final";
      else if (i === 1) label = "Semi-Final";
      else if (i === 2) label = "Quarter-Final";
      else if (i === 3) label = "Round of 8";
      else if (i === 4) label = "Round of 16";
      else if (i === 5) label = "Round of 32";
      else label = `Round of ${Math.pow(2, i + 1)}`;

      structure.push({ slots: slotsInRound, label });
    }

    structure.push({ slots: tournamentSize, label: "Participants" });

    return { rows: structure.length, structure, tournamentSize };
  };

  const treeStructure = getTreeStructure();

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h4 className="text-lg font-bold text-white mb-2">Tournament Tree</h4>
        <p className="text-white/60 text-sm">
          {players.length}/{treeStructure.tournamentSize} players joined • Tournament bracket for {treeStructure.tournamentSize} players
        </p>
      </div>

      <div className="space-y-4">
        {/* Render tournament rounds */}
        {treeStructure.structure.map((round, roundIndex) => (
          <div key={roundIndex} className="text-center">
            <div className="text-xs font-medium text-white/80 mb-2">
              {round.label}
            </div>
            <div className={`flex justify-center items-center ${
              round.slots <= 2 ? 'gap-8' :
              round.slots <= 4 ? 'gap-4' :
              round.slots <= 8 ? 'gap-2' : 'gap-1'
            }`}>
              {Array.from({ length: round.slots }).map((_, slotIndex) => {
                // For participants row, show actual players
                if (roundIndex === treeStructure.structure.length - 1) {
                  const player = players[slotIndex];
                  return (
                    <div
                      key={slotIndex}
                      className={`${
                        round.slots <= 2 ? 'w-20 h-8' :
                        round.slots <= 4 ? 'w-16 h-7' :
                        round.slots <= 8 ? 'w-14 h-6' : 'w-12 h-5'
                      } border rounded flex items-center justify-center text-xs font-medium ${
                        player
                          ? player.userId._id === game.hostId._id
                            ? 'border-yellow-400 bg-yellow-500/20 text-yellow-200'
                            : player.isReady
                            ? 'border-green-400 bg-green-500/20 text-green-200'
                            : 'border-white/40 bg-gray-800/40 text-white/90'
                          : 'border-white/20 bg-gray-800/30 text-white/40'
                      }`}
                    >
                      {player ? (
                        <span className="truncate px-1">
                          {player.username.length > 6 ? player.username.substring(0, 6) + '...' : player.username}
                        </span>
                      ) : (
                        'Open'
                      )}
                      {player?.userId._id === game.hostId._id && (
                        <Crown className="w-2 h-2 ml-1 text-yellow-400" />
                      )}
                    </div>
                  );
                } else {
                  // For tournament rounds, show TBD
                  return (
                    <div
                      key={slotIndex}
                      className={`${
                        round.slots <= 2 ? 'w-20 h-8' :
                        round.slots <= 4 ? 'w-16 h-7' :
                        round.slots <= 8 ? 'w-14 h-6' : 'w-12 h-5'
                      } border border-white/20 bg-gray-800/30 rounded flex items-center justify-center text-xs font-medium text-white/40`}
                    >
                      TBD
                    </div>
                  );
                }
              })}
            </div>
            {/* Connection line */}
            {roundIndex < treeStructure.structure.length - 1 && (
              <div className="flex justify-center mt-2">
                <div className="w-6 h-0.5 bg-white/30"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-white/50">
          All participants will be randomly sorted into slots once the game starts.
        </p>
      </div>
    </div>
  );
}
