import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import MusicSenseGame from '../models/musicSenseGame.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost, ngrok domains, and jamz.fun
        if (
          origin.startsWith('http://localhost') ||
          origin.startsWith('https://localhost') ||
          origin.includes('.ngrok.io') ||
          origin.includes('.ngrok-free.app') ||
          origin === 'https://jamz.fun'
        ) {
          return callback(null, true);
        }

        console.log('Socket CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Optional authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const gameId = socket.handshake.auth.gameId;

      if (!token) {
        // Check if this is a free game that allows anonymous users
        if (gameId) {
          const game = await MusicSenseGame.findOne({ gameId });
          if (game && game.gameType === 'free') {
            // Allow anonymous connection for free games
            socket.userId = `anonymous_${Math.random().toString(36).substr(2, 9)}`;
            socket.username = `Guest_${Math.random().toString(36).substr(2, 6)}`;
            socket.isAnonymous = true;
            return next();
          }
        }
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username || 'Anonymous';
      socket.isAnonymous = false;
      next();
    } catch (error) {
      // For free games, allow anonymous access
      const gameId = socket.handshake.auth.gameId;
      if (gameId) {
        const game = await MusicSenseGame.findOne({ gameId });
        if (game && game.gameType === 'free') {
          socket.userId = `anonymous_${Math.random().toString(36).substr(2, 9)}`;
          socket.username = `Guest_${Math.random().toString(36).substr(2, 6)}`;
          socket.isAnonymous = true;
          return next();
        }
      }
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected to MusicSense`);

    // Join a game room
    socket.on('join_game', async (gameId) => {
      try {
        const game = await MusicSenseGame.findOne({ gameId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Allow anyone to join the socket room to spectate/view the game
        // Players can participate, non-players can spectate

        socket.join(gameId);
        socket.currentGame = gameId;
        
        // Notify other players
        socket.to(gameId).emit('player_connected', {
          userId: socket.userId,
          username: socket.username
        });

        console.log(`${socket.username} joined game ${gameId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Leave game room
    socket.on('leave_game', (gameId) => {
      socket.leave(gameId);
      socket.to(gameId).emit('player_disconnected', {
        userId: socket.userId,
        username: socket.username
      });
      socket.currentGame = null;
    });

    // Send chat message
    socket.on('send_message', async (data) => {
      try {
        const { gameId, message } = data;
        
        if (!socket.currentGame || socket.currentGame !== gameId) {
          socket.emit('error', { message: 'Not in game room' });
          return;
        }

        const game = await MusicSenseGame.findOne({ gameId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Add message to game chat
        const chatMessage = {
          userId: socket.userId,
          username: socket.username,
          message: message.trim(),
          timestamp: new Date(),
          type: 'message'
        };

        game.chat.push(chatMessage);
        await game.save();

        // Broadcast to all players in the game
        io.to(gameId).emit('new_message', chatMessage);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Submit song for current round
    socket.on('submit_song', async (data) => {
      try {
        const { gameId, songTitle, artist, platform, url } = data;
        
        const game = await MusicSenseGame.findOne({ gameId });
        if (!game || game.status !== 'in_progress') {
          socket.emit('error', { message: 'Game not found or not in progress' });
          return;
        }

        // Find current round
        const currentRound = game.rounds[game.rounds.length - 1];
        if (!currentRound || currentRound.status !== 'active') {
          socket.emit('error', { message: 'No active round for song submission' });
          return;
        }

        // Check if user already submitted a song this round
        const existingSong = currentRound.songs.find(s => s.submittedBy.toString() === socket.userId);
        if (existingSong) {
          socket.emit('error', { message: 'You already submitted a song for this round' });
          return;
        }

        // Add song to current round
        const song = {
          submittedBy: socket.userId,
          songTitle,
          artist,
          platform,
          url,
          votes: [],
          voteCount: 0
        };

        currentRound.songs.push(song);
        await game.save();

        // Add system message
        const systemMessage = {
          userId: socket.userId,
          username: socket.username,
          message: `${socket.username} submitted "${songTitle}" by ${artist}`,
          timestamp: new Date(),
          type: 'song_submission'
        };

        game.chat.push(systemMessage);
        await game.save();

        // Broadcast to all players
        io.to(gameId).emit('song_submitted', {
          song,
          submittedBy: socket.username
        });

        io.to(gameId).emit('new_message', systemMessage);
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit song' });
      }
    });

    // Vote for a song
    socket.on('vote_song', async (data) => {
      try {
        const { gameId, songIndex } = data;
        
        const game = await MusicSenseGame.findOne({ gameId });
        if (!game || game.status !== 'in_progress') {
          socket.emit('error', { message: 'Game not found or not in progress' });
          return;
        }

        // Find current round
        const currentRound = game.rounds[game.rounds.length - 1];
        if (!currentRound || currentRound.status !== 'voting') {
          socket.emit('error', { message: 'Voting is not active' });
          return;
        }

        const song = currentRound.songs[songIndex];
        if (!song) {
          socket.emit('error', { message: 'Song not found' });
          return;
        }

        // Check if user already voted
        const existingVote = song.votes.find(v => v.userId.toString() === socket.userId);
        if (existingVote) {
          socket.emit('error', { message: 'You already voted for this song' });
          return;
        }

        // Check if user is voting for their own song
        if (song.submittedBy.toString() === socket.userId) {
          socket.emit('error', { message: 'You cannot vote for your own song' });
          return;
        }

        // Add vote
        song.votes.push({
          userId: socket.userId,
          timestamp: new Date()
        });
        song.voteCount += 1;

        await game.save();

        // Broadcast vote update
        io.to(gameId).emit('vote_updated', {
          songIndex,
          voteCount: song.voteCount,
          voter: socket.username
        });

        // Add system message
        const systemMessage = {
          userId: socket.userId,
          username: socket.username,
          message: `${socket.username} voted for "${song.songTitle}"`,
          timestamp: new Date(),
          type: 'vote'
        };

        game.chat.push(systemMessage);
        await game.save();

        io.to(gameId).emit('new_message', systemMessage);
      } catch (error) {
        socket.emit('error', { message: 'Failed to vote' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected from MusicSense`);
      
      if (socket.currentGame) {
        socket.to(socket.currentGame).emit('player_disconnected', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });
  });

  return io;
};

export const getSocketInstance = () => io;

// Helper function to broadcast game updates
export const broadcastGameUpdate = (gameId, event, data) => {
  if (io) {
    io.to(gameId).emit(event, data);
  }
};
