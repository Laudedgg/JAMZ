import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Music, Crown, Clock, ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { musicSenseApi } from '../lib/musicSenseApi';

interface Game {
  _id: string;
  title: string;
  description: string;
  gameType: 'free' | 'msense_token' | 'premium';
  maxPlayers: number;
  entryFee: number;
  prizePool: { totalAmount: number; currency: string };
  platforms: string[];
  status: 'waiting' | 'in_progress' | 'completed';
  hostId: {
    _id: string;
    username: string;
  };
  players: Array<{
    _id: string;
    username: string;
    isReady: boolean;
  }>;
  createdAt: string;
}

export default function JoinMusicSenseGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await musicSenseApi.getGame(gameId!);
      setGame(response);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Game not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!isAuthenticated) {
      // Redirect to login/signup with return URL
      navigate(`/auth?return=/musicsense/join/${gameId}`);
      return;
    }

    if (!game) return;

    try {
      setJoining(true);
      await musicSenseApi.joinGame(gameId!);
      // Redirect to the game lobby
      navigate(`/musicsense/game/${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const getGameTypeInfo = (gameType: string) => {
    switch (gameType) {
      case 'free':
        return {
          label: 'Free Game',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          description: 'No entry fee required'
        };
      case 'msense_token':
        return {
          label: 'MSENSE Token Game',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          description: 'Requires MSENSE tokens in wallet'
        };
      case 'premium':
        return {
          label: 'Premium Game',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          description: `$${game?.entryFee} entry fee`
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          description: ''
        };
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

  if (error || !game) {
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

  const gameTypeInfo = getGameTypeInfo(game.gameType);
  const isGameFull = game.players.length >= game.maxPlayers;
  const isAlreadyJoined = game.players.some(player => player._id === user?.id);

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
          <h1 className="text-2xl font-bold">Join Music Battle</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Game Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{game.title}</h2>
                <p className="text-white/60">{game.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-white/60">
                  Hosted by {game.hostId.username}
                </span>
              </div>
            </div>

            {/* Game Type Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${gameTypeInfo.bgColor} ${gameTypeInfo.color}`}>
              {gameTypeInfo.label}
            </div>

            {/* Game Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Players</span>
                </div>
                <p className="text-lg font-bold">
                  {game.players.length}/{game.maxPlayers}
                </p>
              </div>

              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Music className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Platforms</span>
                </div>
                <p className="text-sm text-white/60">
                  {game.platforms?.join(', ') || 'Multiple platforms'}
                </p>
              </div>
            </div>

            {/* Prize Pool (if applicable) */}
            {game.gameType !== 'free' && (
              <div className="glass-card p-3 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">Prize Pool</span>
                </div>
                <p className="text-lg font-bold text-yellow-400">
                  {game.gameType === 'premium' ? `$${game.prizePool.totalAmount}` : 'MSENSE Tokens'}
                </p>
              </div>
            )}

            {/* Join Button */}
            <div className="text-center">
              {isAlreadyJoined ? (
                <button
                  onClick={() => navigate(`/musicsense/game/${gameId}`)}
                  className="glass-button-primary w-full"
                >
                  Enter Game Lobby
                </button>
              ) : isGameFull ? (
                <div className="glass-card p-4 text-center">
                  <p className="text-white/60">This game is full</p>
                </div>
              ) : (
                <button
                  onClick={handleJoinGame}
                  disabled={joining}
                  className="glass-button-primary w-full"
                >
                  {joining ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Joining...
                    </div>
                  ) : (
                    `Join ${gameTypeInfo.label}`
                  )}
                </button>
              )}
            </div>

            {/* Authentication Notice */}
            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300 text-center">
                  You'll need to connect your wallet to join this game
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
