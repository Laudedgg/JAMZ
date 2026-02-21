import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageCircle, Music, Send, Crown, Trophy,
  Clock, Play, Pause, Volume2, VolumeX, ArrowLeft,
  CheckCircle, Circle, Star, Zap, Trash2, Share2,
  Copy, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { musicSenseApi, MusicSenseGame as MusicSenseGameType } from '../lib/musicSenseApi';
import { musicSenseSocket } from '../lib/musicSenseSocket';

export function MusicSenseGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuthStore();
  const [game, setGame] = useState<MusicSenseGameType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'lobby' | 'game' | 'chat'>('lobby');
  const [socketConnected, setSocketConnected] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) {
      navigate('/musicsense');
      return;
    }

    if (!isAuthenticated) {
      alert('Please connect your wallet to join the game');
      navigate('/musicsense');
      return;
    }

    loadGame();
    connectSocket();

    return () => {
      musicSenseSocket.disconnect();
    };
  }, [gameId, isAuthenticated]);

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [game?.chat]);

  const loadGame = async () => {
    if (!gameId) return;

    try {
      const gameData = await musicSenseApi.getGame(gameId);
      setGame(gameData);
      
      // Allow anyone to view any game - no player validation needed
    } catch (error: any) {
      setError(error.message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = async () => {
    if (!token) return;

    try {
      await musicSenseSocket.connect(token);
      setSocketConnected(true);

      if (gameId) {
        musicSenseSocket.joinGame(gameId);
      }

      // Set up event listeners
      musicSenseSocket.onMessage((message) => {
        setGame(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            chat: [...prev.chat, message]
          };
        });
      });

      musicSenseSocket.onError((error) => {
        console.error('Socket error:', error);
        setError(error.message);
      });

      musicSenseSocket.onGameUpdate((data) => {
        setGame(prev => prev ? { ...prev, ...data } : null);
      });

    } catch (error) {
      console.error('Failed to connect to socket:', error);
      setError('Failed to connect to real-time features');
    }
  };

  const handleSendMessage = () => {
    if (!gameId || !chatMessage.trim()) return;

    musicSenseSocket.sendMessage(gameId, chatMessage);
    setChatMessage('');
  };

  const handleToggleReady = async () => {
    if (!gameId) return;

    try {
      const updatedGame = await musicSenseApi.toggleReady(gameId);
      setGame(updatedGame);
    } catch (error: any) {
      setError(error.message || 'Failed to toggle ready status');
    }
  };

  const handleLeaveGame = async () => {
    if (!gameId) return;

    if (confirm('Are you sure you want to leave this game?')) {
      try {
        await musicSenseApi.leaveGame(gameId);
        navigate('/musicsense');
      } catch (error: any) {
        setError(error.message || 'Failed to leave game');
      }
    }
  };

  const handleDeleteGame = async () => {
    if (!gameId || !game) return;

    const playerCount = game.players.length;
    const hasEntryFees = game.gameType === 'premium' || game.gameType === 'msense';

    const confirmMessage = isHost()
      ? `Are you sure you want to END this game?\n\n` +
        `• ${playerCount} player${playerCount !== 1 ? 's' : ''} will be removed\n` +
        `${hasEntryFees ? '• All entry fees will be automatically refunded\n' : ''}` +
        `• This action cannot be undone\n\n` +
        `Click OK to permanently delete "${game.title}"`
      : `Are you sure you want to delete this game as admin?\n\n` +
        `• ${playerCount} player${playerCount !== 1 ? 's' : ''} will be removed\n` +
        `${hasEntryFees ? '• All entry fees will be automatically refunded\n' : ''}` +
        `• This action cannot be undone`;

    if (confirm(confirmMessage)) {
      try {
        const result = await musicSenseApi.deleteGame(gameId);
        alert(`✅ Game ended successfully!\n\n${result.message}`);
        navigate('/musicsense');
      } catch (error: any) {
        setError(error.message || 'Failed to delete game');
      }
    }
  };

  const getCurrentPlayer = () => {
    if (!game || !user) return null;
    return game.players.find(p => p.userId._id === user.id);
  };

  const isHost = () => {
    const result = game?.hostId._id === user?.id;
    console.log('Host check:', {
      gameHostId: game?.hostId._id,
      userId: user?.id,
      isHost: result,
      gameStatus: game?.status
    });
    return result;
  };

  const handleCopyGameLink = async () => {
    try {
      const submitUrl = `${window.location.origin}/musicsense/submit/${game.gameId || game._id}`;
      await navigator.clipboard.writeText(submitUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/musicsense/submit/${game.gameId || game._id}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Game Error</h2>
          <p className="text-white/60 mb-6">{error || 'Game not found'}</p>
          <button
            className="glass-button bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/musicsense')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              className="glass-button-small"
              onClick={() => navigate('/musicsense')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{game.title}</h1>
                {isHost() && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Host</span>
                  </div>
                )}
              </div>
              <p className="text-white/60">Game ID: {game.gameId}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Share Button for Host */}
            {isHost() && game.status === 'waiting' && (
              <button
                className="glass-button-small bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share Game
              </button>
            )}

            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              socketConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {socketConnected ? 'Connected' : 'Disconnected'}
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
              game.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {game.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 mb-6">
              {[
                { id: 'lobby', label: 'Lobby', icon: Users },
                { id: 'game', label: 'Game', icon: Music },
                { id: 'chat', label: 'Chat', icon: MessageCircle }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-purple-500 text-purple-400' 
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'lobby' && (
                <LobbyTab
                  game={game}
                  currentPlayer={currentPlayer}
                  isHost={isHost()}
                  onToggleReady={handleToggleReady}
                  onLeaveGame={handleLeaveGame}
                  onDeleteGame={handleDeleteGame}
                />
              )}
              
              {activeTab === 'game' && (
                <GameTab game={game} />
              )}
              
              {activeTab === 'chat' && (
                <ChatTab 
                  game={game}
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                  onSendMessage={handleSendMessage}
                  chatContainerRef={chatContainerRef}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Info */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold mb-4">Game Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Type:</span>
                  <span className={game.gameType === 'paid' ? 'text-yellow-400' : 'text-green-400'}>
                    {game.gameType === 'paid' ? `$${game.entryFee}` : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Players:</span>
                  <span>{game.currentPlayers}/{game.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Prize Pool:</span>
                  <span className="text-purple-400 font-semibold">
                    {game.prizePool.totalAmount} {game.prizePool.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Round Duration:</span>
                  <span>{Math.floor(game.settings.roundDuration / 60)}min</span>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold mb-4">Players</h3>
              <div className="space-y-2">
                {game.players.map((player, index) => (
                  <div key={player.userId._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {game.hostId._id === player.userId._id && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className={player.userId._id === user?.id ? 'text-purple-400 font-semibold' : ''}>
                        {player.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {player.isReady ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareGameModal
          gameUrl={`${window.location.origin}/musicsense/submit/${game.gameId || game._id}`}
          joinUrl={`${window.location.origin}/musicsense/join/${game.gameId || game._id}`}
          gameTitle={game.title}
          onClose={() => setShowShareModal(false)}
          onCopyLink={handleCopyGameLink}
          copySuccess={copySuccess}
        />
      )}
    </div>
  );
}

// Lobby Tab Component
interface LobbyTabProps {
  game: MusicSenseGameType;
  currentPlayer: any;
  isHost: boolean;
  onToggleReady: () => void;
  onLeaveGame: () => void;
  onDeleteGame: () => void;
}

function LobbyTab({ game, currentPlayer, isHost, onToggleReady, onLeaveGame, onDeleteGame }: LobbyTabProps) {
  const allPlayersReady = game.players.every(p => p.isReady);
  const canStartGame = game.players.length >= 2 && allPlayersReady;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Tree Lobby Visualization */}
      <TreeLobby
        game={game}
        currentPlayer={currentPlayer}
        isHost={isHost}
      />

      {/* Control Panel */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Players Ready</span>
            </div>
            <div className="text-2xl font-bold">
              {game.players.filter(p => p.isReady).length}/{game.players.length}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-medium">Prize Pool</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {game.prizePool.totalAmount} {game.prizePool.currency}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Main Action Buttons */}
          <div className="flex gap-4">
            <button
              className={`flex-1 glass-button ${
                currentPlayer?.isReady
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              onClick={onToggleReady}
            >
              {currentPlayer?.isReady ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ready!
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2" />
                  Ready Up
                </>
              )}
            </button>

            <button
              className="glass-button border border-red-500 hover:bg-red-500/20 text-red-400"
              onClick={onLeaveGame}
            >
              Leave Game
            </button>
          </div>

          {/* Host Controls */}
          {isHost && game.status === 'waiting' && (
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Host Controls</span>
              </div>

              {/* Share Game Section */}
              <div className="glass-card p-3 bg-purple-500/10 border border-purple-500/20 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Share Game</span>
                </div>

                {/* Song Submission Link */}
                <div className="mb-3">
                  <label className="text-xs text-white/60 mb-1 block">Song Submission Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/musicsense/submit/${game.gameId || game._id}`}
                      readOnly
                      className="flex-1 bg-black/30 border border-white/20 rounded px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => {
                        const submitUrl = `${window.location.origin}/musicsense/submit/${game.gameId || game._id}`;
                        navigator.clipboard.writeText(submitUrl);
                      }}
                      className="glass-button-small bg-green-600 hover:bg-green-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-1">Players can submit songs and view tournament tree</p>
                </div>

                {/* Join Game Link */}
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Join Game Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/musicsense/join/${game.gameId || game._id}`}
                      readOnly
                      className="flex-1 bg-black/30 border border-white/20 rounded px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => {
                        const joinUrl = `${window.location.origin}/musicsense/join/${game.gameId || game._id}`;
                        navigator.clipboard.writeText(joinUrl);
                      }}
                      className="glass-button-small bg-purple-600 hover:bg-purple-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-1">Direct join link for quick access</p>
                </div>
              </div>

              <button
                className="w-full glass-button border border-red-600 hover:bg-red-600/20 text-red-500 font-medium"
                onClick={onDeleteGame}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Game & Refund All Players
              </button>
              <p className="text-xs text-white/50 mt-2 text-center">
                This will permanently delete the game and refund all entry fees
              </p>
            </div>
          )}
        </div>

        {isHost && canStartGame && (
          <motion.button
            className="w-full mt-4 glass-button bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Game
          </motion.button>
        )}

        {!canStartGame && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              {game.players.length < 2
                ? 'Waiting for more players to join...'
                : 'Waiting for all players to ready up...'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Game Tab Component
function GameTab({ game }: { game: MusicSenseGameType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="glass-card p-6 text-center">
        <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Game Starting Soon</h3>
        <p className="text-white/60">
          The battle interface will appear here once the game begins!
        </p>
      </div>
    </motion.div>
  );
}

// Chat Tab Component
interface ChatTabProps {
  game: MusicSenseGameType;
  chatMessage: string;
  setChatMessage: (message: string) => void;
  onSendMessage: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

function ChatTab({ game, chatMessage, setChatMessage, onSendMessage, chatContainerRef }: ChatTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-4 h-96 flex flex-col"
    >
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-2 mb-4">
        {game.chat.map((message, index) => (
          <div key={index} className={`text-sm ${
            message.type === 'system' ? 'text-yellow-400 italic' :
            message.type === 'vote' ? 'text-blue-400' :
            message.type === 'song_submission' ? 'text-purple-400' :
            'text-white'
          }`}>
            <span className="font-medium">{message.username}:</span> {message.message}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-purple-500 focus:outline-none"
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
        />
        <button
          className="glass-button-small bg-purple-600 hover:bg-purple-700"
          onClick={onSendMessage}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Tree Lobby Component
interface TreeLobbyProps {
  game: MusicSenseGameType;
  currentPlayer: any;
  isHost: boolean;
}

function TreeLobby({ game, currentPlayer, isHost }: TreeLobbyProps) {
  const maxPlayers = game.maxPlayers;
  const players = game.players;

  // Calculate dynamic tournament structure based on max players configured for the game
  const getTreeStructure = () => {
    // Ensure maxPlayers is a power of 2 for proper tournament brackets
    const validTournamentSizes = [2, 4, 8, 16, 32];
    const tournamentSize = validTournamentSizes.find(size => size >= maxPlayers) || 16;

    // Calculate the number of rounds needed
    const rounds = Math.ceil(Math.log2(tournamentSize));
    const structure = [];

    // Build structure from final to participants
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

    // Add participants row with tournament size (power of 2)
    structure.push({ slots: tournamentSize, label: "Participants" });

    return {
      rows: structure.length,
      structure,
      tournamentSize
    };
  };

  const treeStructure = getTreeStructure();

  // Debug logging
  console.log('Tournament Bracket Debug:', {
    maxPlayers,
    tournamentSize: treeStructure.tournamentSize,
    currentPlayers: players.length,
    treeStructure,
    gameType: game.gameType
  });

  // Arrange players in tournament tree structure
  const arrangePlayersInTree = () => {
    const arranged: (typeof players[0] | null)[][] = [];

    // For tournament rounds (all except the last row which is participants)
    for (let row = 0; row < treeStructure.rows - 1; row++) {
      const rowPlayers: (typeof players[0] | null)[] = [];
      const slotsInRow = treeStructure.structure[row].slots;

      // Fill with TBD slots for tournament rounds
      for (let col = 0; col < slotsInRow; col++) {
        rowPlayers.push(null);
      }
      arranged.push(rowPlayers);
    }

    // Last row is participants - show all tournament slots (power of 2)
    const participantRow: (typeof players[0] | null)[] = [];
    const participantSlots = treeStructure.tournamentSize; // Use tournament size (power of 2)

    // Add current players and empty slots up to tournament size
    for (let i = 0; i < participantSlots; i++) {
      if (i < players.length) {
        participantRow.push(players[i]);
      } else {
        participantRow.push(null); // Empty slot waiting for player
      }
    }
    arranged.push(participantRow);

    return arranged;
  };

  const arrangedPlayers = arrangePlayersInTree();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 bg-gradient-to-br from-gray-900/40 to-gray-800/40 w-full"
    >
      <div className="text-center mb-8">
        <motion.h3
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Tournament Tree
        </motion.h3>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60"
        >
          {players.length}/{treeStructure.tournamentSize} players joined • Tournament bracket for {treeStructure.tournamentSize} players
        </motion.p>
      </div>

      <div className="w-full">
        <div className="compact-tournament-bracket">
          {/* Render from top to bottom: Final -> Semi-Final -> Quarter-Final -> Participants */}
          {arrangedPlayers.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.2 }}
              className="bracket-row"
            >
              {/* Row Label */}
              <div className="text-center mb-3">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: rowIndex * 0.2 + 0.1, type: "spring" }}
                  className="text-sm font-medium text-white/80"
                >
                  {treeStructure.structure[rowIndex].label}
                </motion.span>
              </div>

              {/* Bracket Row */}
              <div className="flex justify-center items-center mb-4 w-full">
                <div className={`flex items-center justify-center flex-wrap ${
                  row.length <= 2 ? 'gap-8' :
                  row.length <= 4 ? 'gap-4' :
                  row.length <= 8 ? 'gap-2' : 'gap-1'
                } max-w-full`}>
                  {row.map((player, colIndex) => (
                    <CompactBracketSlot
                      key={`${rowIndex}-${colIndex}`}
                      player={player}
                      isHost={player?.userId._id === game.hostId._id}
                      isCurrentPlayer={player?.userId._id === currentPlayer?.userId._id}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      totalInRow={row.length}
                      treeStructure={treeStructure}
                    />
                  ))}
                </div>
              </div>

              {/* Simple Connection Indicator */}
              {rowIndex < arrangedPlayers.length - 1 && (
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-0.5 bg-white/30"></div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Bottom message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-4"
          >
            <p className="text-xs text-white/50">
              All participants will be randomly sorted into slots once the game starts.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact Bracket Slot Component
interface CompactBracketSlotProps {
  player: any;
  isHost: boolean;
  isCurrentPlayer: boolean;
  rowIndex: number;
  colIndex: number;
  totalInRow: number;
  treeStructure: any;
}

function CompactBracketSlot({ player, isHost, isCurrentPlayer, rowIndex, colIndex, totalInRow, treeStructure }: CompactBracketSlotProps) {
  // Calculate responsive width based on total players in row
  const getSlotWidth = () => {
    if (totalInRow <= 2) return 'w-24'; // 96px
    if (totalInRow <= 4) return 'w-20'; // 80px
    if (totalInRow <= 8) return 'w-16'; // 64px
    return 'w-14'; // 56px for many players
  };

  const getSlotHeight = () => {
    if (totalInRow <= 2) return 'h-10'; // 40px
    if (totalInRow <= 4) return 'h-8';  // 32px
    if (totalInRow <= 8) return 'h-7';  // 28px
    return 'h-6'; // 24px for many players
  };

  const getFontSize = () => {
    if (totalInRow <= 2) return 'text-sm';
    if (totalInRow <= 4) return 'text-xs';
    if (totalInRow <= 8) return 'text-xs';
    return 'text-xs';
  };
  if (!player) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: (rowIndex * 0.2) + (colIndex * 0.05) }}
        className="compact-bracket-slot"
      >
        <div className={`${getSlotWidth()} ${getSlotHeight()} border border-white/20 bg-gray-800/30 flex items-center justify-center rounded ${getFontSize()} text-white/40 font-medium`}>
          {rowIndex === treeStructure.rows - 1 ? 'Open' : 'TBD'}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: (rowIndex * 0.2) + (colIndex * 0.05),
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      className="compact-bracket-slot relative group"
    >
      {/* Compact Bracket Box */}
      <div className={`${getSlotWidth()} ${getSlotHeight()} border transition-all duration-200 flex items-center justify-center relative rounded ${getFontSize()} font-medium ${
        isCurrentPlayer ? 'border-purple-400 bg-purple-500/20 text-purple-200' :
        isHost ? 'border-yellow-400 bg-yellow-500/20 text-yellow-200' :
        player.isReady ? 'border-green-400 bg-green-500/20 text-green-200' :
        'border-white/40 bg-gray-800/40 text-white/90'
      } group-hover:scale-105 group-hover:border-white/60`}>

        {/* Host Crown - smaller */}
        {isHost && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-1 -right-1 z-10"
          >
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
              <Crown className="w-2 h-2 text-white" />
            </div>
          </motion.div>
        )}

        {/* Ready Status - smaller */}
        {player.isReady && !isHost && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="absolute -bottom-1 -right-1 z-10"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-2 h-2 text-white" />
            </div>
          </motion.div>
        )}

        {/* Player Name - truncated based on slot size */}
        <span className="truncate px-1 max-w-full">
          {(() => {
            const maxLength = totalInRow <= 2 ? 10 : totalInRow <= 4 ? 8 : totalInRow <= 8 ? 6 : 4;
            return player.username.length > maxLength ?
              player.username.substring(0, maxLength) + '...' :
              player.username;
          })()}
        </span>
      </div>

      {/* Current Player Glow */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute inset-0 border border-purple-400 rounded"
          animate={{ opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// Share Game Modal Component
interface ShareGameModalProps {
  gameUrl: string;
  joinUrl: string;
  gameTitle: string;
  onClose: () => void;
  onCopyLink: () => void;
  copySuccess: boolean;
}

function ShareGameModal({ gameUrl, joinUrl, gameTitle, onClose, onCopyLink, copySuccess }: ShareGameModalProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Share Game</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{gameTitle}</h4>
            <p className="text-white/60 text-sm">
              Share these links with friends to let them join your music battle!
            </p>
          </div>

          {/* Song Submission URL */}
          <div className="glass-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Song Submission Link</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={() => handleCopy(gameUrl, 'submit')}
                className={`glass-button-small ${
                  copiedUrl === 'submit' ? 'bg-green-600' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {copiedUrl === 'submit' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1">Players can submit songs and view tournament tree</p>
          </div>

          {/* Join Game URL */}
          <div className="glass-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Join Game Link</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinUrl}
                readOnly
                className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={() => handleCopy(joinUrl, 'join')}
                className={`glass-button-small ${
                  copiedUrl === 'join' ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {copiedUrl === 'join' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1">Direct join link for quick access</p>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const text = `Join my music battle "${gameTitle}" on MusicSense! Submit your song: ${gameUrl}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="glass-button bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Twitter
            </button>
            <button
              onClick={() => {
                const text = `Join my music battle "${gameTitle}" on MusicSense! Submit your song: ${gameUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="glass-button bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              WhatsApp
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


