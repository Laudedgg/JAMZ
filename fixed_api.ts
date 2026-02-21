const API_URL = '/api';  // Changed from 'http://localhost:5001/api' to use the relative path

interface Wallet {
  usdtBalance: number;
  jamzBalance: number;
  usdtAddress: string | null;
  jamzAddress: string | null;
}

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'claim';
  token: 'USDT' | 'JAMZ';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  txHash: string | null;
  method: 'onchain' | 'stripe' | 'reward' | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
    walletAddress?: string;
    username?: string;
    needsUsername?: boolean;
  };
}

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  _id: string;
  artistId: Artist;
  title: string;
  description: string;
  youtubeUrl: string;
  spotifyUrl: string;
  otherDspUrls: Record<string, string>;
  challengeRewardUsdt: number;
  challengeRewardJamz: number;
  shareRewardUsdt: number;
  shareRewardJamz: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  _id: string;
  campaignId: Campaign;
  userId: AuthResponse['user'];
  platform: 'tiktok' | 'instagram' | 'youtube';
  videoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rewardUsdt: number;
  rewardJamz: number;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  _id: string;
  campaignId: Campaign;
  userId: AuthResponse['user'];
  platform: 'twitter' | 'facebook' | 'copy';
  rewardUsdt: number;
  rewardJamz: number;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioFile: string;
  duration: number;
  likes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getHeaders = (includeAuth = false): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(includeAuth ? getAuthHeaders() : {})
});

export const api = {
  tracks: {
    list: async (): Promise<Track[]> => {
      const response = await fetch(`${API_URL}/tracks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      return response.json();
    },

    get: async (id: string): Promise<Track> => {
      const response = await fetch(`${API_URL}/tracks/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch track');
      }
      return response.json();
    },

    create: async (formData: FormData): Promise<Track> => {
      const response = await fetch(`${API_URL}/tracks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create track');
      }
      return response.json();
    },

    update: async (id: string, formData: FormData): Promise<Track> => {
      const response = await fetch(`${API_URL}/tracks/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update track');
      }
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/tracks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete track');
      }
    },

    like: async (id: string): Promise<Track> => {
      const response = await fetch(`${API_URL}/tracks/${id}/like`, {
        method: 'POST',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to like track');
      }
      return response.json();
    }
  },
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error('Failed to login');
      }
      return response.json();
    },

    register: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error('Failed to register');
      }
      return response.json();
    },

    verify: async (token: string): Promise<{ user: AuthResponse['user'] }> => {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to verify token');
      }
      return response.json();
    },

    connectWallet: async (address: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_URL}/auth/connect-wallet`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ address }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect wallet');
      }
      return response.json();
    },

    setUsername: async (username: string): Promise<{ user: AuthResponse['user'] }> => {
      const response = await fetch(`${API_URL}/auth/set-username`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set username');
      }
      return response.json();
    }
  },

  artists: {
    list: async (): Promise<Artist[]> => {
      const response = await fetch(`${API_URL}/artists`);
      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }
      return response.json();
    },

    get: async (id: string): Promise<Artist> => {
      const response = await fetch(`${API_URL}/artists/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artist');
      }
      return response.json();
    },

    create: async (data: Partial<Artist>): Promise<Artist> => {
      const response = await fetch(`${API_URL}/artists`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create artist');
      }
      return response.json();
    },

    update: async (id: string, data: Partial<Artist>): Promise<Artist> => {
      const response = await fetch(`${API_URL}/artists/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update artist');
      }
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/artists/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete artist');
      }
    },
  },

  campaigns: {
    list: async (): Promise<Campaign[]> => {
      const response = await fetch(`${API_URL}/campaigns`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return response.json();
    },

    get: async (id: string): Promise<Campaign> => {
      const response = await fetch(`${API_URL}/campaigns/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }
      return response.json();
    },

    create: async (data: Partial<Campaign>): Promise<Campaign> => {
      const response = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }
      return response.json();
    },

    update: async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
    },
  },

  challenges: {
    list: async (): Promise<Challenge[]> => {
      const response = await fetch(`${API_URL}/challenges/user`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      return response.json();
    },

    listForCampaign: async (campaignId: string): Promise<Challenge[]> => {
      const response = await fetch(`${API_URL}/challenges/campaign/${campaignId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campaign challenges');
      }
      return response.json();
    },

    submit: async (data: { campaignId: string; platform: Challenge['platform']; videoUrl: string }): Promise<Challenge> => {
      const response = await fetch(`${API_URL}/challenges`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit challenge');
      }
      return response.json();
    },

    updateStatus: async (id: string, status: Challenge['status']): Promise<Challenge> => {
      const response = await fetch(`${API_URL}/challenges/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update challenge status');
      }
      return response.json();
    },
  },
  
  shares: {
    list: async (): Promise<Share[]> => {
      const response = await fetch(`${API_URL}/shares/user`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch shares');
      }
      return response.json();
    },

    listForCampaign: async (campaignId: string): Promise<Share[]> => {
      const response = await fetch(`${API_URL}/shares/campaign/${campaignId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campaign shares');
      }
      return response.json();
    },

    submit: async (data: { campaignId: string; platform: Share['platform'] }): Promise<Share> => {
      const response = await fetch(`${API_URL}/shares`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit share');
      }
      return response.json();
    }
  },
  
  wallets: {
    getWallet: async (): Promise<{ wallet: Wallet }> => {
      const response = await fetch(`${API_URL}/wallets/me`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }
      return response.json();
    },
    
    getTransactions: async (): Promise<{ transactions: Transaction[] }> => {
      const response = await fetch(`${API_URL}/wallets/transactions`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    
    setAddresses: async (data: { usdtAddress?: string; jamzAddress?: string }): Promise<{ wallet: Wallet }> => {
      const response = await fetch(`${API_URL}/wallets/addresses`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set addresses');
      }
      return response.json();
    },
    
    claimUsdtOnchain: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetch(`${API_URL}/wallets/claim/usdt/onchain`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim USDT');
      }
      return response.json();
    },
    
    claimUsdtStripe: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetch(`${API_URL}/wallets/claim/usdt/stripe`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim USDT via Stripe');
      }
      return response.json();
    },
    
    claimJamzOnchain: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetch(`${API_URL}/wallets/claim/jamz/onchain`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim JAMZ');
      }
      return response.json();
    },
    
    // Admin only
    addReward: async (data: { userId: string; token: 'USDT' | 'JAMZ'; amount: number }): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetch(`${API_URL}/wallets/admin/reward`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add reward');
      }
      return response.json();
    }
  },
};
