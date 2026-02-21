import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Trophy, Zap, Music, DollarSign, Clock, Star, Trash2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import { musicSenseApi, MusicSenseGame as MusicSenseGameType, CreateGameData } from '../lib/musicSenseApi';
import { StaticGridBackground } from '../components/StaticGridBackground';
import { SplineScene } from '../components/SplineScene';

export function MusicSenseLanding() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [games, setGames] = useState<MusicSenseGameType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const activeGames = await musicSenseApi.getGames();
      setGames(activeGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (gameData: CreateGameData) => {
    console.log('Creating game with data:', gameData);
    console.log('User authenticated:', isAuthenticated);
    console.log('User data:', user);

    // Only require authentication for non-free games
    if (gameData.gameType !== 'free' && !isAuthenticated) {
      alert('Please connect your wallet or sign up to create token/premium games');
      return;
    }

    setCreateLoading(true);
    try {
      console.log('Calling musicSenseApi.createGame...');
      const newGame = await musicSenseApi.createGame(gameData);
      console.log('Game created successfully:', newGame);
      setShowCreateModal(false);
      navigate(`/musicsense/game/${newGame.gameId}`);
    } catch (error: any) {
      console.error('Game creation error:', error);
      alert(error.message || 'Failed to create game');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string, gameType?: string) => {
    // For non-free games, require authentication
    if (gameType !== 'free' && !isAuthenticated) {
      alert('Please connect your wallet or sign up to join this game');
      return;
    }

    try {
      await musicSenseApi.joinGame(gameId);
      navigate(`/musicsense/game/${gameId}`);
    } catch (error: any) {
      alert(error.message || 'Failed to join game');
    }
  };

  const handleDeleteGame = async (gameId: string, gameTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${gameTitle}"? All players will be removed and any fees will be refunded.`)) {
      return;
    }

    try {
      const result = await musicSenseApi.deleteGame(gameId);
      alert(result.message);
      loadGames(); // Refresh the games list
    } catch (error: any) {
      alert(error.message || 'Failed to delete game');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Elements - Same as main homepage */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-70">
          <SplineScene />
        </div>
        <StaticGridBackground />
        {/* Gradient fade overlay for sections below hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none"
             style={{ top: '100vh' }} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 tracking-tight">
              <motion.span
                className="animated-gradient-text inline-block relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.05, 1],
                  opacity: 1
                }}
                transition={{
                  duration: 1.2,
                  ease: "easeOut",
                  scale: {
                    times: [0, 0.7, 1],
                    duration: 1.2
                  }
                }}
              >
                {"Music Sense".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    initial={{
                      opacity: 0,
                      y: 50,
                      rotateX: -90,
                      scale: 0.5
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      scale: 1
                    }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }}
                    style={{
                      display: char === " " ? "inline" : "inline-block",
                      width: char === " " ? "0.5em" : "auto"
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.span>
            </h1>
            <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-yellow-300 mb-8 shadow-lg shadow-yellow-400/30">
              <Clock className="w-6 h-6 mr-3 text-black" />
              <span className="text-xl text-black font-bold">Coming Soon</span>
            </div>

            <p className="section-subtitle mb-12">
              The ultimate real-time music battle game. Submit songs, vote for winners, and earn prizes in epic musical showdowns.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <button
                className="glass-button-primary opacity-50 cursor-not-allowed"
                disabled
              >
                <Play className="w-5 h-5" />
                Create Game
              </button>

              <button
                className="glass-button-secondary opacity-50 cursor-not-allowed"
                disabled
              >
                <Users className="w-5 h-5" />
                Join Game
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Music className="w-8 h-8 text-purple-400" />,
                title: "Submit Songs",
                description: "Add your favorite tracks from YouTube or Spotify to compete"
              },
              {
                icon: <Users className="w-8 h-8 text-pink-400" />,
                title: "Real-time Battles",
                description: "Face off against other players in live music competitions"
              },
              {
                icon: <Trophy className="w-8 h-8 text-yellow-400" />,
                title: "Vote & Win",
                description: "Vote for the best songs and climb the leaderboard"
              },
              {
                icon: <DollarSign className="w-8 h-8 text-green-400" />,
                title: "Earn Prizes",
                description: "Win $MSENSE tokens or USD in paid tournaments"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Games Section */}
      <section id="active-games" className="relative py-20 px-4 z-10">
        {/* Background fade overlay for this section */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/90 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-4xl font-bold">Active Games</h2>
              {isAdmin && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">Admin Mode</span>
                </div>
              )}
            </div>
            <motion.button
              className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadGames}
            >
              Refresh
            </motion.button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-white/60">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <p className="text-xl text-white/60 mb-4">No active games found</p>
              <p className="text-white/40">Be the first to create a game!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <motion.div
                  key={game._id}
                  className="glass-card p-6 hover:border-purple-500/50 transition-all duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{game.title}</h3>
                      <p className="text-white/60 text-sm">by {game.hostId.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        game.gameType === 'premium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : game.gameType === 'msense'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {game.gameType === 'premium'
                          ? `$${game.entryFee}`
                          : game.gameType === 'msense'
                          ? 'MSENSE'
                          : 'FREE'
                        }
                      </div>

                      {/* Admin Delete Button */}
                      {isAdmin && (
                        <motion.button
                          className="p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGame(game.gameId, game.title);
                          }}
                          title="Delete Game (Admin)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {game.description && (
                    <p className="text-white/70 text-sm mb-4">{game.description}</p>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-sm text-white/60">
                      <Users className="w-4 h-4 mr-1" />
                      {game.currentPlayers}/{game.maxPlayers}
                    </div>
                    <div className="flex items-center text-sm text-white/60">
                      <Clock className="w-4 h-4 mr-1" />
                      {Math.floor(game.settings.roundDuration / 60)}min rounds
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-white/60">Prize: </span>
                      <span className={`font-semibold ${
                        game.gameType === 'premium'
                          ? 'text-yellow-400'
                          : game.gameType === 'msense'
                          ? 'text-purple-400'
                          : 'text-gray-400'
                      }`}>
                        {game.gameType === 'free'
                          ? 'No prizes'
                          : `${game.prizePool.totalAmount} ${game.prizePool.currency}`
                        }
                      </span>
                    </div>
                    
                    <motion.button
                      className="glass-button-small bg-purple-600 hover:bg-purple-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleJoinGame(game.gameId, game.gameType)}
                      disabled={game.currentPlayers >= game.maxPlayers}
                    >
                      {game.currentPlayers >= game.maxPlayers ? 'Full' : 'Join'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Game Modal */}
      {showCreateModal && (
        <CreateGameModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGame}
          loading={createLoading}
        />
      )}
    </div>
  );
}

// Create Game Modal Component
interface CreateGameModalProps {
  onClose: () => void;
  onCreate: (gameData: CreateGameData) => void;
  loading: boolean;
}

function CreateGameModal({ onClose, onCreate, loading }: CreateGameModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateGameData>(() => ({
    title: '',
    description: '',
    gameType: 'free',
    maxPlayers: 8,
    msensePrizePool: 100,
    allowedPlatforms: ['spotify', 'youtube', 'apple-music'],
    settings: {
      roundDuration: 120,
      votingDuration: 60,
      songsPerRound: 2,
      allowDuplicateArtists: false,
      chatEnabled: true
    }
  }));

  const totalSteps = 5;

  // Memoize form data updates to prevent unnecessary re-renders
  const updateFormData = useCallback((updates: Partial<CreateGameData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Validate based on game type
    if (formData.gameType === 'premium') {
      if (formData.maxPlayers !== 16) {
        alert('Premium games must have exactly 16 players');
        return;
      }
    } else if (formData.gameType === 'msense') {
      if (!formData.msensePrizePool || formData.msensePrizePool < 100) {
        alert('MSENSE games require at least 100 MSENSE prize pool');
        return;
      }
    }

    onCreate(formData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim().length > 0;
      case 2:
        return true; // Game type selection
      case 3:
        return true; // Settings
      case 4:
        return formData.allowedPlatforms && formData.allowedPlatforms.length > 0; // Platform selection
      case 5:
        return true; // Review
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderGameType();
      case 3:
        return renderGameSettings();
      case 4:
        return renderPlatformSelection();
      case 5:
        return renderReview();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          What's your game called?
        </h1>
        <p className="text-sm md:text-base text-white/70">
          Give your music battle a memorable name that players will recognize.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
        <div>
          <input
            type="text"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-base text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Enter your game title..."
            autoFocus
          />
        </div>

        <div>
          <textarea
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Optional: Add a description for your game..."
            rows={2}
          />
        </div>
      </div>

      {renderNavigationButtons()}
    </div>
  );

  const renderGameType = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Choose your game type
        </h1>
        <p className="text-sm md:text-base text-white/70">
          Select the type of music battle you want to create. Free games are open to everyone, while token and premium games require account signup.
        </p>
      </div>

      <div className="flex-1 space-y-3 w-full">
        {/* Free Games */}
        <div
          className={`game-type-card p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            formData.gameType === 'free'
              ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
              : 'border-white/20 bg-white/5 hover:border-green-400 hover:bg-green-400/5'
          }`}
          onClick={() => updateFormData({ gameType: 'free' })}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="text-lg">🎮</div>
              <h3 className="text-base font-bold text-white">Free Games</h3>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              formData.gameType === 'free'
                ? 'border-green-500 bg-green-500'
                : 'border-white/40'
            }`}>
              {formData.gameType === 'free' && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>
          <p className="text-white/70 text-xs">No signup required • Free to join • Just for fun</p>
        </div>

        {/* MSENSE Token Games */}
        <div
          className={`game-type-card p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            formData.gameType === 'msense'
              ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
              : 'border-white/20 bg-white/5 hover:border-purple-400 hover:bg-purple-400/5'
          }`}
          onClick={() => updateFormData({ gameType: 'msense' })}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="text-lg">🪙</div>
              <h3 className="text-base font-bold text-white">MSENSE Token Games</h3>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              formData.gameType === 'msense'
                ? 'border-purple-500 bg-purple-500'
                : 'border-white/40'
            }`}>
              {formData.gameType === 'msense' && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>
          <p className="text-white/70 text-xs">Account required • Must hold MSENSE • Token prizes</p>
        </div>

        {/* Premium Paid Games */}
        <div
          className={`game-type-card p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            formData.gameType === 'premium'
              ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20'
              : 'border-white/20 bg-white/5 hover:border-yellow-400 hover:bg-yellow-400/5'
          }`}
          onClick={() => updateFormData({
            gameType: 'premium',
            maxPlayers: 16,
            entryFee: 25
          })}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="text-lg">💎</div>
              <h3 className="text-base font-bold text-white">Premium Paid Games</h3>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              formData.gameType === 'premium'
                ? 'border-yellow-500 bg-yellow-500'
                : 'border-white/40'
            }`}>
              {formData.gameType === 'premium' && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>
          <p className="text-white/70 text-xs">Account required • $25 entry • $400 prize pool</p>
        </div>
      </div>

      {renderNavigationButtons()}
    </div>
  );

  const renderGameSettings = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          How many players should participate?
        </h1>
        <p className="text-sm md:text-base text-white/70">
          Set the maximum number of players for your music battle.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6 w-full">
        {/* Max Players Slider */}
        <div className="space-y-6">
          <div className="relative">
            <div className="flex justify-center gap-4">
              {[4, 8, 16].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateFormData({ maxPlayers: size })}
                  disabled={formData.gameType === 'premium' && size !== 16}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    formData.maxPlayers === size
                      ? 'bg-purple-600 text-white border-2 border-purple-400'
                      : 'bg-white/10 text-white/80 border-2 border-white/20 hover:bg-white/20'
                  } ${formData.gameType === 'premium' && size !== 16 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {size} Players
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-white/60 mt-2">
              Tournament brackets require powers of 2 for proper elimination rounds
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">{formData.maxPlayers} Players</div>
            {formData.gameType === 'premium' && (
              <p className="text-sm text-yellow-400">Premium games require exactly 16 players</p>
            )}
          </div>
        </div>

        {/* MSENSE Prize Pool for MSENSE games */}
        {formData.gameType === 'msense' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">
              How much MSENSE should the winner get?
            </h2>
            <p className="text-white/70">
              Set the prize pool that you'll fund from your MSENSE balance.
            </p>

            <div className="relative">
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={formData.msensePrizePool || 100}
                onChange={(e) => updateFormData({ msensePrizePool: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${Math.round(((formData.msensePrizePool || 100) - 100) / 900 * 100)}%, rgba(255,255,255,0.2) ${Math.round(((formData.msensePrizePool || 100) - 100) / 900 * 100)}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-white/60 mt-2">
                <span>100</span>
                <span>300</span>
                <span>500</span>
                <span>750</span>
                <span>1000</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{formData.msensePrizePool || 100} MSENSE</div>
              <p className="text-sm text-white/60">You will fund this from your MSENSE balance</p>
            </div>
          </div>
        )}
      </div>

      {renderNavigationButtons()}
    </div>
  );

  const renderPlatformSelection = () => {
    const platforms = [
      {
        id: 'spotify',
        name: 'Spotify',
        icon: '🎵',
        description: 'Stream from Spotify\'s vast music library',
        color: 'green'
      },
      {
        id: 'youtube',
        name: 'YouTube',
        icon: '📺',
        description: 'Access music videos and tracks on YouTube',
        color: 'red'
      },
      {
        id: 'apple-music',
        name: 'Apple Music',
        icon: '🍎',
        description: 'High-quality streaming from Apple Music',
        color: 'gray'
      },
      {
        id: 'soundcloud',
        name: 'SoundCloud',
        icon: '☁️',
        description: 'Discover independent artists and remixes',
        color: 'orange'
      },
      {
        id: 'suno',
        name: 'Suno',
        icon: '🎼',
        description: 'AI-generated music and original compositions',
        color: 'purple'
      }
    ];

    const togglePlatform = (platformId: string) => {
      const currentPlatforms = formData.allowedPlatforms || [];
      const isSelected = currentPlatforms.includes(platformId);

      if (isSelected) {
        // Don't allow removing if it's the last platform
        if (currentPlatforms.length === 1) return;
        updateFormData({
          allowedPlatforms: currentPlatforms.filter(p => p !== platformId)
        });
      } else {
        updateFormData({
          allowedPlatforms: [...currentPlatforms, platformId]
        });
      }
    };

    const getColorClasses = (color: string, isSelected: boolean) => {
      const colors = {
        green: isSelected
          ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
          : 'border-white/20 bg-white/5 hover:border-green-400 hover:bg-green-400/5',
        red: isSelected
          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
          : 'border-white/20 bg-white/5 hover:border-red-400 hover:bg-red-400/5',
        gray: isSelected
          ? 'border-gray-500 bg-gray-500/10 shadow-lg shadow-gray-500/20'
          : 'border-white/20 bg-white/5 hover:border-gray-400 hover:bg-gray-400/5',
        orange: isSelected
          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
          : 'border-white/20 bg-white/5 hover:border-orange-400 hover:bg-orange-400/5',
        purple: isSelected
          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
          : 'border-white/20 bg-white/5 hover:border-purple-400 hover:bg-purple-400/5'
      };
      return colors[color as keyof typeof colors] || colors.gray;
    };

    const getCheckboxColor = (color: string) => {
      const colors = {
        green: 'border-green-500 bg-green-500',
        red: 'border-red-500 bg-red-500',
        gray: 'border-gray-500 bg-gray-500',
        orange: 'border-orange-500 bg-orange-500',
        purple: 'border-purple-500 bg-purple-500'
      };
      return colors[color as keyof typeof colors] || colors.gray;
    };

    return (
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            From where can songs be submitted?
          </h1>
          <p className="text-sm md:text-base text-white/70">
            Your players can send in songs from the following music services.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {platforms.map((platform) => {
              const isSelected = formData.allowedPlatforms?.includes(platform.id) || false;

              return (
                <div
                  key={platform.id}
                  className={`platform-card p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${getColorClasses(platform.color, isSelected)}`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{platform.icon}</div>
                      <h3 className="text-lg font-bold text-white">{platform.name}</h3>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                      isSelected
                        ? getCheckboxColor(platform.color)
                        : 'border-white/40'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">{platform.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center text-sm text-white/60">
            Select at least one platform. Players will only be able to submit songs from the selected services.
          </div>
        </div>

        {renderNavigationButtons()}
      </div>
    );
  };

  const renderReview = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Ready to create your game?
        </h1>
        <p className="text-sm md:text-base text-white/70">
          Review your settings and create your music battle.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center w-full">
        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/70">Game Title</span>
            <span className="text-white font-medium">{formData.title}</span>
          </div>

          {formData.description && (
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/70">Description</span>
              <span className="text-white font-medium text-right max-w-xs truncate">{formData.description}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/70">Game Type</span>
            <span className={`font-medium ${
              formData.gameType === 'free' ? 'text-green-400' :
              formData.gameType === 'msense' ? 'text-purple-400' : 'text-yellow-400'
            }`}>
              {formData.gameType === 'free' ? '🎮 Free Game' :
               formData.gameType === 'msense' ? '🪙 MSENSE Token Game' : '💎 Premium Game'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/70">Max Players</span>
            <span className="text-white font-medium">{formData.maxPlayers} players</span>
          </div>

          <div className="flex justify-between items-start py-3 border-b border-white/10">
            <span className="text-white/70">Allowed Platforms</span>
            <div className="text-right">
              {formData.allowedPlatforms?.map((platform, index) => (
                <div key={platform} className="text-white font-medium text-sm">
                  {platform === 'spotify' && '🎵 Spotify'}
                  {platform === 'youtube' && '📺 YouTube'}
                  {platform === 'apple-music' && '🍎 Apple Music'}
                  {platform === 'soundcloud' && '☁️ SoundCloud'}
                  {platform === 'suno' && '🎼 Suno'}
                </div>
              ))}
            </div>
          </div>

          {formData.gameType === 'msense' && (
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/70">Prize Pool</span>
              <span className="text-purple-400 font-medium">{formData.msensePrizePool} MSENSE</span>
            </div>
          )}

          {formData.gameType === 'premium' && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/70">Entry Fee</span>
                <span className="text-yellow-400 font-medium">$25 USD</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-white/70">Total Prize Pool</span>
                <span className="text-yellow-400 font-medium">$400 USD</span>
              </div>
            </>
          )}
        </div>
      </div>

      {renderNavigationButtons()}
    </div>
  );

  const renderNavigationButtons = () => (
    <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10">
      <button
        onClick={handlePrevious}
        disabled={currentStep === 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentStep === 1
            ? 'text-white/40 cursor-not-allowed'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
      >
        ← Previous
      </button>

      <div className="flex space-x-3">
        {currentStep < totalSteps ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              canProceed()
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              canProceed() && !loading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Game'
            )}
          </button>
        )}
      </div>
    </div>
  );

  // Memoize step rendering to prevent unnecessary re-renders (after all functions are defined)
  const memoizedStepContent = useMemo(() => renderStep(), [currentStep, formData, loading]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <motion.div
        key="create-game-modal"
        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative modal-content"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        layout={false}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl z-10 -mx-6 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-white/60 font-medium">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    i + 1 <= currentStep
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-all duration-200 p-2 hover:bg-white/10 rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden step-content" style={{ minHeight: '400px' }}>
          <div key={`step-${currentStep}`} className="flex-1 flex flex-col">
            {memoizedStepContent}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
