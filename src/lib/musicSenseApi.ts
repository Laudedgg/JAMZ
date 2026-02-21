import { api } from './api';

export interface MusicSenseGame {
  _id: string;
  gameId: string;
  hostId: {
    _id: string;
    username: string;
    walletAddress?: string;
  };
  title: string;
  description: string;
  gameType: 'free' | 'msense' | 'premium';
  entryFee: number;
  msenseRequirement: number;
  msensePrizePool: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  players: Array<{
    userId: {
      _id: string;
      username: string;
      walletAddress?: string;
    };
    username: string;
    walletAddress?: string;
    joinedAt: string;
    isReady: boolean;
    hasPaid: boolean;
  }>;
  rounds: Array<{
    roundNumber: number;
    songs: Array<{
      submittedBy: {
        _id: string;
        username: string;
      };
      songTitle: string;
      artist: string;
      platform: 'youtube' | 'spotify';
      url: string;
      votes: Array<{
        userId: string;
        timestamp: string;
      }>;
      voteCount: number;
    }>;
    winner?: {
      userId: string;
      songIndex: number;
    };
    startTime?: string;
    endTime?: string;
    status: 'pending' | 'active' | 'voting' | 'completed';
  }>;
  prizePool: {
    totalAmount: number;
    currency: 'MSENSE' | 'USD';
    distribution: {
      winner: number;
      runnerUp: number;
      participation: number;
    };
  };
  settings: {
    roundDuration: number;
    votingDuration: number;
    songsPerRound: number;
    allowDuplicateArtists: boolean;
    chatEnabled: boolean;
  };
  chat: Array<{
    userId: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'message' | 'system' | 'vote' | 'song_submission';
  }>;
  gameResults?: {
    finalWinner?: {
      userId: string;
      username: string;
      prize: number;
    };
    leaderboard: Array<{
      userId: string;
      username: string;
      position: number;
      totalVotes: number;
      prize: number;
    }>;
    totalPrizeDistributed: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateGameData {
  title: string;
  description?: string;
  gameType: 'free' | 'msense' | 'premium';
  entryFee?: number;
  msensePrizePool?: number;
  maxPlayers?: number;
  allowedPlatforms?: string[]; // Music platforms that players can submit from
  settings?: {
    roundDuration?: number;
    votingDuration?: number;
    songsPerRound?: number;
    allowDuplicateArtists?: boolean;
    chatEnabled?: boolean;
  };
}

export interface SongSubmission {
  songTitle: string;
  artist: string;
  platform: 'youtube' | 'spotify';
  url: string;
}

export const musicSenseApi = {
  // Get all active games
  getGames: async (): Promise<MusicSenseGame[]> => {
    const response = await fetch(`${api.baseURL}/musicsense/games`);
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }
    return response.json();
  },

  // Check admin status (for debugging)
  checkAdminStatus: async (): Promise<any> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${api.baseURL}/musicsense/admin/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check admin status');
    }
    return response.json();
  },

  // Get all games for admin (including completed/cancelled)
  getAdminGames: async (): Promise<MusicSenseGame[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Admin access required');
    }

    const response = await fetch(`${api.baseURL}/musicsense/admin/games`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch admin games');
    }
    return response.json();
  },

  // Get specific game details
  getGame: async (gameId: string): Promise<MusicSenseGame> => {
    const response = await fetch(`${api.baseURL}/musicsense/games/${gameId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game');
    }
    return response.json();
  },

  // Create a new game
  createGame: async (gameData: CreateGameData): Promise<MusicSenseGame> => {
    const token = localStorage.getItem('auth_token');

    // Only require authentication for non-free games
    if (gameData.gameType !== 'free' && !token) {
      throw new Error('Please connect your wallet or sign in to create token/premium games');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${api.baseURL}/musicsense/games`, {
      method: 'POST',
      headers,
      body: JSON.stringify(gameData)
    });

    if (!response.ok) {
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create game');
      } else {
        // If not JSON, it might be an authentication error
        if (response.status === 401) {
          throw new Error('Authentication failed. Please connect your wallet or sign in again.');
        }
        throw new Error(`Failed to create game (${response.status})`);
      }
    }
    return response.json();
  },

  // Join a game
  joinGame: async (gameId: string): Promise<MusicSenseGame> => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${api.baseURL}/musicsense/games/${gameId}/join`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join game');
    }
    return response.json();
  },

  // Leave a game
  leaveGame: async (gameId: string): Promise<MusicSenseGame> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${api.baseURL}/musicsense/games/${gameId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to leave game');
    }
    return response.json();
  },

  // Toggle ready status
  toggleReady: async (gameId: string): Promise<MusicSenseGame> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${api.baseURL}/musicsense/games/${gameId}/ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle ready status');
    }
    return response.json();
  },

  // Delete/Cancel a game (Host or Admin only)
  deleteGame: async (gameId: string): Promise<{ message: string; game: any }> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Please connect your wallet to delete games');
    }

    const response = await fetch(`${api.baseURL}/musicsense/games/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete game');
    }
    return response.json();
  },

  // Submit a song for the game
  submitSong: async (gameId: string, songData: SongSubmission): Promise<{ message: string; game: any }> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Please connect your wallet to submit songs');
    }

    const response = await fetch(`${api.baseURL}/musicsense/games/${gameId}/submit-song`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(songData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit song');
    }
    return response.json();
  }
};
