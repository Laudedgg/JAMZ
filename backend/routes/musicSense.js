import express from 'express';
import MusicSenseGame from '../models/musicSenseGame.js';
import Wallet from '../models/wallet.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all active games (lobby list)
router.get('/games', async (req, res) => {
  try {
    const games = await MusicSenseGame.find({
      status: { $in: ['waiting', 'in_progress'] }
    })
    .populate('hostId', 'username walletAddress')
    .populate('players.userId', 'username walletAddress')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check admin status (for debugging)
router.get('/admin/status', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        username: req.user.username
      },
      message: req.user.isAdmin ? 'User has admin access' : 'User does not have admin access'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all games for admin (including completed/cancelled)
router.get('/admin/games', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: 'Admin access required',
        userInfo: {
          id: req.user._id,
          email: req.user.email,
          isAdmin: req.user.isAdmin
        }
      });
    }

    const games = await MusicSenseGame.find({})
    .populate('hostId', 'username walletAddress')
    .populate('players.userId', 'username walletAddress')
    .sort({ createdAt: -1 })
    .limit(50); // Show more games for admin

    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific game details (no auth required for viewing)
router.get('/games/:gameId', async (req, res) => {
  try {
    const game = await MusicSenseGame.findOne({ gameId: req.params.gameId })
      .populate('hostId', 'username walletAddress')
      .populate('players.userId', 'username walletAddress')
      .populate('rounds.songs.submittedBy', 'username')
      .populate('chat.userId', 'username');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new game
router.post('/games', optionalAuth, async (req, res) => {
  try {
    console.log('Creating game with data:', req.body);
    const { title, description, gameType, entryFee, maxPlayers, settings, msensePrizePool, allowedPlatforms } = req.body;

    // For non-free games, require authentication
    if (gameType !== 'free' && !req.user) {
      return res.status(401).json({ message: 'Please sign up or connect your wallet to create token/premium games' });
    }

    // Validate tournament bracket requirements
    const validTournamentSizes = [2, 4, 8, 16];
    if (!validTournamentSizes.includes(maxPlayers)) {
      return res.status(400).json({ message: 'Tournament brackets require powers of 2 (2, 4, 8, or 16 players)' });
    }

    // Validate game type specific requirements
    if (gameType === 'premium') {
      // Premium games must have exactly 16 players and $25 entry fee
      if (maxPlayers !== 16) {
        return res.status(400).json({ message: 'Premium games must have exactly 16 players' });
      }
      if (!entryFee || entryFee !== 25) {
        return res.status(400).json({ message: 'Premium games must have exactly $25 entry fee' });
      }
    } else if (gameType === 'msense') {
      // MSENSE games require host to fund prize pool
      if (!msensePrizePool || msensePrizePool < 100) {
        return res.status(400).json({ message: 'MSENSE games require at least 100 MSENSE prize pool' });
      }
    }

    // Check user's wallet balance for premium games
    if (gameType === 'premium' && req.user) {
      const wallet = await Wallet.findOne({ userId: req.user._id });
      if (!wallet || wallet.usdtBalance < entryFee) {
        return res.status(400).json({ message: 'Insufficient USD balance to create premium game' });
      }
    }

    // Check user's MSENSE balance for MSENSE games
    if (gameType === 'msense' && req.user) {
      const wallet = await Wallet.findOne({ userId: req.user._id });
      if (!wallet || wallet.msenseBalance < msensePrizePool) {
        return res.status(400).json({ message: 'Insufficient MSENSE balance to fund prize pool' });
      }
    }

    const gameId = uuidv4().substring(0, 8).toUpperCase();

    // Set default values based on game type
    let defaultMaxPlayers = 8;
    let defaultPrizeAmount = 0;
    let defaultCurrency = 'MSENSE';

    if (gameType === 'premium') {
      defaultMaxPlayers = 16;
      defaultPrizeAmount = entryFee * 16; // Total prize pool from all entries
      defaultCurrency = 'USD';
    } else if (gameType === 'msense') {
      defaultPrizeAmount = msensePrizePool;
      defaultCurrency = 'MSENSE';
    } else if (gameType === 'free') {
      defaultPrizeAmount = 0; // No prizes for free games
      defaultCurrency = 'MSENSE';
    }

    // Handle host creation for free games without authentication
    let hostId, hostUsername, hostWalletAddress;

    if (gameType === 'free' && !req.user) {
      // Generate anonymous host data for free games
      hostId = uuidv4();
      hostUsername = `Host_${Math.random().toString(36).substr(2, 6)}`;
      hostWalletAddress = null;
    } else {
      // Use authenticated user data
      hostId = req.user._id;
      hostUsername = req.user.username || 'Anonymous';
      hostWalletAddress = req.user.walletAddress;
    }

    const game = new MusicSenseGame({
      gameId,
      hostId: hostId,
      title,
      description,
      gameType,
      entryFee: gameType === 'premium' ? entryFee : 0,
      msenseRequirement: gameType === 'msense' ? 100 : 0, // Require 100 MSENSE to join
      msensePrizePool: gameType === 'msense' ? msensePrizePool : 0,
      maxPlayers: maxPlayers || defaultMaxPlayers,
      allowedPlatforms: allowedPlatforms || ['spotify', 'youtube', 'apple-music'],
      settings: {
        roundDuration: settings?.roundDuration || 120,
        votingDuration: settings?.votingDuration || 60,
        songsPerRound: settings?.songsPerRound || 2,
        allowDuplicateArtists: settings?.allowDuplicateArtists || false,
        chatEnabled: settings?.chatEnabled !== false
      },
      prizePool: {
        totalAmount: defaultPrizeAmount,
        currency: defaultCurrency
      }
    });

    await game.save();

    // Add host as first player
    game.players.push({
      userId: hostId,
      username: hostUsername,
      walletAddress: hostWalletAddress,
      isReady: true,
      hasPaid: true,
      isAnonymous: gameType === 'free' && !req.user
    });
    game.currentPlayers = 1;

    // Deduct entry fee for premium games or MSENSE for MSENSE games (only for authenticated users)
    if (gameType === 'premium' && req.user) {
      await Wallet.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { usdtBalance: -entryFee } }
      );
    } else if (gameType === 'msense' && req.user) {
      await Wallet.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { msenseBalance: -msensePrizePool } }
      );
    }

    await game.save();

    // For free games with anonymous hosts, we need to handle population differently
    let populatedGame;
    if (gameType === 'free' && !req.user) {
      // Don't populate hostId for anonymous hosts
      populatedGame = await MusicSenseGame.findOne({ gameId });
      // Add host info manually
      populatedGame = populatedGame.toObject();
      populatedGame.hostId = {
        _id: hostId,
        username: hostUsername,
        walletAddress: hostWalletAddress
      };
    } else {
      populatedGame = await MusicSenseGame.findOne({ gameId })
        .populate('hostId', 'username walletAddress')
        .populate('players.userId', 'username walletAddress');
    }

    res.status(201).json(populatedGame);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ message: error.message });
  }
});

// Join a game
router.post('/games/:gameId/join', optionalAuth, async (req, res) => {
  try {
    const game = await MusicSenseGame.findOne({ gameId: req.params.gameId });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ message: 'Game is not accepting new players' });
    }

    if (game.currentPlayers >= game.maxPlayers) {
      return res.status(400).json({ message: 'Game is full' });
    }

    // For non-free games, require authentication
    if (game.gameType !== 'free' && !req.user) {
      return res.status(401).json({ message: 'Please sign up or connect your wallet to join this game' });
    }

    // For free games, allow anonymous players
    let playerId, playerUsername, playerWalletAddress;

    if (game.gameType === 'free' && !req.user) {
      // Generate anonymous player data
      playerId = uuidv4();
      playerUsername = `Guest_${Math.random().toString(36).substr(2, 6)}`;
      playerWalletAddress = null;
    } else {
      // Use authenticated user data
      playerId = req.user._id;
      playerUsername = req.user.username || 'Anonymous';
      playerWalletAddress = req.user.walletAddress;

      // Check if user is already in the game
      const existingPlayer = game.players.find(p =>
        p.userId && p.userId.toString() === req.user._id.toString()
      );
      if (existingPlayer) {
        // If already in game, just return the game data instead of error
        const populatedGame = await MusicSenseGame.findOne({ gameId: req.params.gameId })
          .populate('hostId', 'username walletAddress')
          .populate('players.userId', 'username walletAddress');
        return res.json(populatedGame);
      }
    }

    // Handle payment and wallet checks for non-free games
    if (game.gameType !== 'free' && req.user) {
      const wallet = await Wallet.findOne({ userId: req.user._id });

      if (game.gameType === 'premium') {
        // Check USD balance for premium games
        if (!wallet || wallet.usdtBalance < game.entryFee) {
          return res.status(400).json({ message: 'Insufficient USD balance to join this premium game' });
        }

        // Deduct entry fee
        await Wallet.findOneAndUpdate(
          { userId: req.user._id },
          { $inc: { usdtBalance: -game.entryFee } }
        );

        // Add to prize pool
        game.prizePool.totalAmount += game.entryFee;
      } else if (game.gameType === 'msense') {
        // Check MSENSE balance requirement (must hold minimum amount)
        if (!wallet || wallet.msenseBalance < game.msenseRequirement) {
          return res.status(400).json({
            message: `You need at least ${game.msenseRequirement} MSENSE tokens to join this game`
          });
        }
        // No deduction for MSENSE games - just need to hold the tokens
      }
    }

    // Add player to game
    game.players.push({
      userId: game.gameType === 'free' && !req.user ? playerId : req.user._id,
      username: playerUsername,
      walletAddress: playerWalletAddress,
      isReady: false,
      hasPaid: game.gameType === 'premium' || game.gameType === 'free',
      isAnonymous: game.gameType === 'free' && !req.user
    });
    game.currentPlayers += 1;

    // Add system message to chat
    game.chat.push({
      userId: game.gameType === 'free' && !req.user ? playerId : req.user._id,
      username: playerUsername,
      message: `${playerUsername} joined the game`,
      type: 'system'
    });

    await game.save();

    const populatedGame = await MusicSenseGame.findOne({ gameId: req.params.gameId })
      .populate('hostId', 'username walletAddress')
      .populate('players.userId', 'username walletAddress');

    res.json(populatedGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave a game
router.post('/games/:gameId/leave', authenticateToken, async (req, res) => {
  try {
    const game = await MusicSenseGame.findOne({ gameId: req.params.gameId });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status === 'in_progress') {
      return res.status(400).json({ message: 'Cannot leave game in progress' });
    }

    const playerIndex = game.players.findIndex(p => p.userId.toString() === req.user._id.toString());
    if (playerIndex === -1) {
      return res.status(400).json({ message: 'You are not in this game' });
    }

    // Refund entry fee for premium games if game hasn't started
    if (game.gameType === 'premium' && game.status === 'waiting') {
      await Wallet.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { usdtBalance: game.entryFee } }
      );
      game.prizePool.totalAmount -= game.entryFee;
    }

    // Remove player
    game.players.splice(playerIndex, 1);
    game.currentPlayers -= 1;

    // Add system message to chat
    game.chat.push({
      userId: req.user._id,
      username: req.user.username || 'Anonymous',
      message: `${req.user.username || 'Anonymous'} left the game`,
      type: 'system'
    });

    // If host leaves, transfer host to another player or cancel game
    if (game.hostId.toString() === req.user._id.toString()) {
      if (game.players.length > 0) {
        game.hostId = game.players[0].userId;
        game.chat.push({
          userId: game.players[0].userId,
          username: game.players[0].username,
          message: `${game.players[0].username} is now the host`,
          type: 'system'
        });
      } else {
        game.status = 'cancelled';
      }
    }

    await game.save();

    const populatedGame = await MusicSenseGame.findOne({ gameId: req.params.gameId })
      .populate('hostId', 'username walletAddress')
      .populate('players.userId', 'username walletAddress');

    res.json(populatedGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle player ready status
router.post('/games/:gameId/ready', authenticateToken, async (req, res) => {
  try {
    const game = await MusicSenseGame.findOne({ gameId: req.params.gameId });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const player = game.players.find(p => p.userId.toString() === req.user._id.toString());
    if (!player) {
      return res.status(400).json({ message: 'You are not in this game' });
    }

    player.isReady = !player.isReady;

    // Add system message to chat
    game.chat.push({
      userId: req.user._id,
      username: req.user.username || 'Anonymous',
      message: `${req.user.username || 'Anonymous'} is ${player.isReady ? 'ready' : 'not ready'}`,
      type: 'system'
    });

    await game.save();

    const populatedGame = await MusicSenseGame.findOne({ gameId: req.params.gameId })
      .populate('hostId', 'username walletAddress')
      .populate('players.userId', 'username walletAddress');

    res.json(populatedGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete/Cancel a game (Host or Admin only)
router.delete('/games/:gameId', authenticateToken, async (req, res) => {
  try {
    console.log('Delete game request:', {
      gameId: req.params.gameId,
      userId: req.user._id,
      userEmail: req.user.email,
      isAdmin: req.user.isAdmin
    });

    const game = await MusicSenseGame.findOne({ gameId: req.params.gameId });

    if (!game) {
      console.log('Game not found:', req.params.gameId);
      return res.status(404).json({ message: 'Game not found' });
    }

    console.log('Game found:', {
      gameId: game.gameId,
      title: game.title,
      status: game.status,
      hostId: game.hostId,
      playerCount: game.players.length
    });

    // Check permissions: Host can delete waiting games, Admin can delete any game
    const isHost = game.hostId.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    console.log('Permission check:', { isHost, isAdmin });

    if (!isHost && !isAdmin) {
      console.log('Permission denied: not host or admin');
      return res.status(403).json({ message: 'Only the host or admin can delete this game' });
    }

    // Host can only delete games in waiting status
    if (isHost && !isAdmin && game.status !== 'waiting') {
      console.log('Permission denied: host can only delete waiting games');
      return res.status(400).json({ message: 'You can only delete games that haven\'t started yet' });
    }

    // Process refunds for all players
    const refundPromises = [];

    for (const player of game.players) {
      if (player.hasPaid) {
        if (game.gameType === 'premium') {
          // Refund USDT entry fee
          refundPromises.push(
            Wallet.findOneAndUpdate(
              { userId: player.userId },
              { $inc: { usdtBalance: game.entryFee } }
            )
          );
        } else if (game.gameType === 'msense') {
          // Refund MSENSE tokens (host's contribution gets refunded to host)
          if (player.userId.toString() === game.hostId.toString()) {
            refundPromises.push(
              Wallet.findOneAndUpdate(
                { userId: player.userId },
                { $inc: { msenseBalance: game.msensePrizePool } }
              )
            );
          }
        }
      }
    }

    // Process all refunds
    console.log('Processing refunds for', refundPromises.length, 'players');
    await Promise.all(refundPromises);
    console.log('Refunds completed');

    // Store game info before deletion
    const gameInfo = {
      gameId: game.gameId,
      title: game.title,
      playerCount: game.players.length,
      gameType: game.gameType
    };

    console.log('Deleting game from database:', gameInfo);

    // Actually delete the game from database
    const deleteResult = await MusicSenseGame.findOneAndDelete({ gameId: req.params.gameId });

    if (!deleteResult) {
      console.error('Failed to delete game from database');
      return res.status(500).json({ message: 'Failed to delete game from database' });
    }

    console.log('Game successfully deleted from database');

    const refundMessage = gameInfo.playerCount > 0 && (gameInfo.gameType === 'premium' || gameInfo.gameType === 'msense')
      ? ` ${gameInfo.playerCount} player${gameInfo.playerCount !== 1 ? 's' : ''} have been refunded.`
      : '';

    const response = {
      message: `Game "${gameInfo.title}" has been deleted successfully.${refundMessage}`,
      game: {
        gameId: gameInfo.gameId,
        status: 'deleted',
        refundedPlayers: gameInfo.playerCount
      }
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ message: error.message });
  }
});

// Submit a song for the game
router.post('/games/:gameId/submit-song', authenticateToken, async (req, res) => {
  try {
    const { songTitle, artist, platform, url } = req.body;

    if (!songTitle || !artist || !platform || !url) {
      return res.status(400).json({ message: 'All song details are required' });
    }

    const game = await MusicSenseGame.findOne({ gameId: req.params.gameId });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ message: 'Can only submit songs for games in waiting status' });
    }

    // Check if platform is allowed
    if (!game.allowedPlatforms.includes(platform)) {
      return res.status(400).json({
        message: `Platform ${platform} is not allowed for this game. Allowed platforms: ${game.allowedPlatforms.join(', ')}`
      });
    }

    // Check if user is in the game
    const player = game.players.find(p => p.userId.toString() === req.user._id.toString());
    if (!player) {
      return res.status(400).json({ message: 'You must join the game first before submitting a song' });
    }

    // Check if user already submitted a song
    if (player.submittedSong) {
      return res.status(400).json({ message: 'You have already submitted a song for this game' });
    }

    // Add song to player's submission
    player.submittedSong = {
      songTitle,
      artist,
      platform,
      url,
      submittedAt: new Date()
    };

    // Add system message to chat
    game.chat.push({
      userId: req.user._id,
      username: req.user.username || 'Anonymous',
      message: `${req.user.username || 'Anonymous'} submitted "${songTitle}" by ${artist}`,
      type: 'song_submission'
    });

    await game.save();

    const populatedGame = await MusicSenseGame.findOne({ gameId: req.params.gameId })
      .populate('hostId', 'username walletAddress')
      .populate('players.userId', 'username walletAddress');

    res.json({
      message: 'Song submitted successfully',
      game: populatedGame
    });
  } catch (error) {
    console.error('Error submitting song:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
