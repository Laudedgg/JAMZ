import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, Users, Clock, Trophy, Crown, Shield, 
  RefreshCw, Eye, AlertTriangle, DollarSign, Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import { musicSenseApi, MusicSenseGame } from '../lib/musicSenseApi';
import { AdminNav } from './AdminDashboard';

export function MusicSenseGamesAdmin() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [games, setGames] = useState<MusicSenseGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
      return;
    }
    checkAdminStatus();
    loadGames();
  }, [isAuthenticated, isAdmin, navigate]);

  const checkAdminStatus = async () => {
    try {
      const status = await musicSenseApi.checkAdminStatus();
      setAdminStatus(status);
      console.log('Admin status:', status);
    } catch (error: any) {
      console.error('Admin status check failed:', error);
      setAdminStatus({ error: error.message });
    }
  };

  const loadGames = async () => {
    try {
      setLoading(true);
      console.log('Loading admin games...');

      // Try admin endpoint first
      try {
        const allGames = await musicSenseApi.getAdminGames();
        console.log('Admin games loaded:', allGames);
        setGames(allGames);
        setError(null);
        return;
      } catch (adminError: any) {
        console.error('Admin endpoint failed:', adminError);

        // Fallback to regular games endpoint
        console.log('Falling back to regular games endpoint...');
        const regularGames = await musicSenseApi.getGames();
        console.log('Regular games loaded:', regularGames);
        setGames(regularGames);
        setError(`Admin endpoint failed, showing active games only: ${adminError.message}`);
      }
    } catch (error: any) {
      console.error('All endpoints failed:', error);
      setError(error.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string, gameTitle: string) => {
    const game = games.find(g => g.gameId === gameId);
    if (!game) return;

    const playerCount = game.players.length;
    const hasEntryFees = game.gameType === 'premium' || game.gameType === 'msense';
    
    const confirmMessage = `⚠️ ADMIN DELETE CONFIRMATION ⚠️\n\n` +
      `Game: "${gameTitle}"\n` +
      `Status: ${game.status.toUpperCase()}\n` +
      `Players: ${playerCount}\n` +
      `Type: ${game.gameType.toUpperCase()}\n` +
      `${hasEntryFees ? `Entry Fee: ${game.gameType === 'premium' ? '$' + game.entryFee : game.msensePrizePool + ' MSENSE'}\n` : ''}` +
      `\n` +
      `This will:\n` +
      `• Remove ${playerCount} player${playerCount !== 1 ? 's' : ''}\n` +
      `${hasEntryFees ? '• Refund all entry fees automatically\n' : ''}` +
      `• Permanently delete the game\n` +
      `\n` +
      `Type "DELETE" to confirm:`;

    const userInput = prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      return;
    }

    try {
      setDeleteLoading(gameId);
      console.log('🗑️ Deleting game:', gameId);

      const result = await musicSenseApi.deleteGame(gameId);
      console.log('✅ Delete successful:', result);

      alert(`✅ Game deleted successfully!\n\n${result.message}`);
      loadGames(); // Refresh the list
    } catch (error: any) {
      console.error('❌ Delete failed:', error);
      alert(`❌ Failed to delete game:\n\n${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getGameTypeColor = (gameType: string) => {
    switch (gameType) {
      case 'premium': return 'text-yellow-400 bg-yellow-500/20';
      case 'msense': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-green-400 bg-green-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400 bg-yellow-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
            <p className="text-white/60 mb-8">Please log in as an admin to manage MusicSense games.</p>
            <button
              onClick={() => navigate('/admin/login')}
              className="glass-button-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminNav />

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold gradient-text">MusicSense Games Management</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Admin Mode</span>
            </div>
          </div>
          
          <motion.button
            className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadGames}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Error: {error}</span>
            </div>
          </div>
        )}



        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-white/60">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-xl text-white/60 mb-4">No games found</p>
            <p className="text-white/40">All MusicSense games will appear here for management</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game, index) => {
              // Add safety checks for required fields
              if (!game || !game._id || !game.gameId) {
                console.warn('Invalid game data at index', index, game);
                return null;
              }

              return (
                <motion.div
                  key={game._id}
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{game.title || 'Untitled Game'}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getGameTypeColor(game.gameType)}`}>
                          {game.gameType === 'premium' ? `$${game.entryFee || 0}` :
                           game.gameType === 'msense' ? 'MSENSE' : 'FREE'}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                          {(game.status || 'unknown').replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span>Host: {game.hostId?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span>{game.currentPlayers || 0}/{game.maxPlayers || 0} players</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Clock className="w-4 h-4 text-green-400" />
                          <span>{Math.floor((game.settings?.roundDuration || 120) / 60)}min rounds</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          {game.gameType === 'premium' ? <DollarSign className="w-4 h-4 text-yellow-400" /> : <Coins className="w-4 h-4 text-purple-400" />}
                          <span>
                            {game.gameType === 'free' ? 'No prizes' :
                             `${game.prizePool?.totalAmount || 0} ${game.prizePool?.currency || 'MSENSE'}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-white/50">
                        <span>Game ID: {game.gameId}</span>
                        <span className="mx-2">•</span>
                        <span>Created: {new Date(game.createdAt).toLocaleDateString()}</span>
                        {game.description && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{game.description}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <motion.button
                        className="glass-button-small bg-blue-600 hover:bg-blue-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/musicsense/game/${game.gameId}`)}
                        title="View Game"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        className="glass-button-small bg-red-600 hover:bg-red-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteGame(game.gameId, game.title || 'Untitled Game')}
                        disabled={deleteLoading === game.gameId}
                        title="Delete Game"
                      >
                        {deleteLoading === game.gameId ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            }).filter(Boolean)}
          </div>
        )}
      </div>
    </div>
  );
}
