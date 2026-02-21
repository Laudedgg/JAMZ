import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'vote' | 'song_submission';
}

interface SongSubmission {
  songTitle: string;
  artist: string;
  platform: 'youtube' | 'spotify';
  url: string;
}

interface VoteUpdate {
  songIndex: number;
  voteCount: number;
  voter: string;
}

interface PlayerConnection {
  userId: string;
  username: string;
}

export class MusicSenseSocket {
  private socket: Socket | null = null;
  private currentGameId: string | null = null;

  // Event listeners
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private onSongSubmittedCallback: ((data: any) => void) | null = null;
  private onVoteUpdatedCallback: ((data: VoteUpdate) => void) | null = null;
  private onPlayerConnectedCallback: ((data: PlayerConnection) => void) | null = null;
  private onPlayerDisconnectedCallback: ((data: PlayerConnection) => void) | null = null;
  private onErrorCallback: ((error: { message: string }) => void) | null = null;
  private onGameUpdateCallback: ((data: any) => void) | null = null;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Determine the socket URL based on current environment
        const socketUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5001' 
          : window.location.origin;

        this.socket = io(socketUrl, {
          auth: {
            token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('Connected to MusicSense WebSocket');
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('new_message', (message: ChatMessage) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    });

    this.socket.on('song_submitted', (data: any) => {
      if (this.onSongSubmittedCallback) {
        this.onSongSubmittedCallback(data);
      }
    });

    this.socket.on('vote_updated', (data: VoteUpdate) => {
      if (this.onVoteUpdatedCallback) {
        this.onVoteUpdatedCallback(data);
      }
    });

    this.socket.on('player_connected', (data: PlayerConnection) => {
      if (this.onPlayerConnectedCallback) {
        this.onPlayerConnectedCallback(data);
      }
    });

    this.socket.on('player_disconnected', (data: PlayerConnection) => {
      if (this.onPlayerDisconnectedCallback) {
        this.onPlayerDisconnectedCallback(data);
      }
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    });

    this.socket.on('game_update', (data: any) => {
      if (this.onGameUpdateCallback) {
        this.onGameUpdateCallback(data);
      }
    });
  }

  joinGame(gameId: string) {
    if (this.socket) {
      this.currentGameId = gameId;
      this.socket.emit('join_game', gameId);
    }
  }

  leaveGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('leave_game', gameId);
      this.currentGameId = null;
    }
  }

  sendMessage(gameId: string, message: string) {
    if (this.socket && message.trim()) {
      this.socket.emit('send_message', {
        gameId,
        message: message.trim()
      });
    }
  }

  submitSong(gameId: string, song: SongSubmission) {
    if (this.socket) {
      this.socket.emit('submit_song', {
        gameId,
        ...song
      });
    }
  }

  voteSong(gameId: string, songIndex: number) {
    if (this.socket) {
      this.socket.emit('vote_song', {
        gameId,
        songIndex
      });
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.currentGameId) {
        this.leaveGame(this.currentGameId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentGameId = null;
    }
  }

  // Event listener setters
  onMessage(callback: (message: ChatMessage) => void) {
    this.onMessageCallback = callback;
  }

  onSongSubmitted(callback: (data: any) => void) {
    this.onSongSubmittedCallback = callback;
  }

  onVoteUpdated(callback: (data: VoteUpdate) => void) {
    this.onVoteUpdatedCallback = callback;
  }

  onPlayerConnected(callback: (data: PlayerConnection) => void) {
    this.onPlayerConnectedCallback = callback;
  }

  onPlayerDisconnected(callback: (data: PlayerConnection) => void) {
    this.onPlayerDisconnectedCallback = callback;
  }

  onError(callback: (error: { message: string }) => void) {
    this.onErrorCallback = callback;
  }

  onGameUpdate(callback: (data: any) => void) {
    this.onGameUpdateCallback = callback;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }
}

// Create a singleton instance
export const musicSenseSocket = new MusicSenseSocket();
