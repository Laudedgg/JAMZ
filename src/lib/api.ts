const API_URL = '/api';  // Changed from 'http://localhost:5001/api' to use the relative path

interface Wallet {
  usdBalance: number;
  jamzBalance: number;
  ngnBalance: number;
  aedBalance: number;
  usdcAddress: string | null;
  jamzAddress: string | null;
  paypalEmail: string | null;
  ngnBankDetails: {
    accountNumber: string | null;
    bankName: string | null;
    accountName: string | null;
    bankCode: string | null;
  } | null;
  aedBankDetails: {
    accountNumber: string | null;
    bankName: string | null;
    accountName: string | null;
    iban: string | null;
    swiftCode: string | null;
  } | null;
}

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'claim';
  token: 'USD' | 'JAMZ' | 'NGN' | 'AED';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  txHash: string | null;
  method: 'crypto' | 'paypal' | 'bank' | 'reward' | null;
  createdAt: string;
  updatedAt: string;
}

interface SpotifySong {
  id: string;
  title: string;
  artist: string;
  coverImage: string | null;
  spotifyUrl: string;
  spotifyPreviewUrl: string | null;
  duration: number;
  source: 'spotify-liked';
  addedAt: string;
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

interface ArtistAuthResponse {
  token: string;
  artist: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  _id: string;
  artistId: Artist;
  showcaseId: {
    _id: string;
    title: string;
    description: string;
    status: string;
    isActive: boolean;
  };
  title: string;
  description: string;
  youtubeUrl: string;
  spotifyUrl: string;
  otherDspUrls: Record<string, string>;
  challengeRewardUsd: number;
  challengeRewardJamz: number;
  shareRewardUsd: number;
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
  rewardUsd: number;
  rewardJamz: number;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  _id: string;
  campaignId: Campaign;
  userId: AuthResponse['user'];
  platform: 'twitter' | 'facebook' | 'copy' | 'tiktok' | 'instagram' | 'youtube';
  linkUrl: string;
  rewardUsd: number;
  rewardJamz: number;
  approved: boolean;
  approvedAt: string | null;
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
  spotifyUrl?: string;
  spotifyPreviewUrl?: string;
  appleMusicUrl?: string;
  appleMusicPreviewUrl?: string;
  youtubeUrl?: string;
  isActive: boolean;
  order?: number;
  upvotes: number;
  downvotes: number;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
}

const getAuthHeaders = (): Record<string, string> => {
  // Check for artist token first (if we're in the artist section)
  if (window.location.pathname.startsWith('/artist')) {
    const artistToken = localStorage.getItem('artist-auth-storage');
    if (artistToken) {
      try {
        const parsedStorage = JSON.parse(artistToken);
        if (parsedStorage.state && parsedStorage.state.token) {
          return { 'Authorization': `Bearer ${parsedStorage.state.token}` };
        }
      } catch (e) {
        console.error('Error parsing artist token:', e);
      }
    }
  }

  // Fall back to regular user token
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getHeaders = (includeAuth = false, includeContentType = true): Record<string, string> => ({
  ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
  ...(includeAuth ? getAuthHeaders() : {})
});

interface User {
  _id: string;
  email: string;
  username?: string;
  walletAddress?: string;
  authProvider?: string;
  isAdmin: boolean;
  discoverySource?: string;
  discoverySourceOther?: string;
  userType?: 'artist' | 'fan';
  onboardingCompleted?: boolean;
  uniqueCode?: string;
  createdAt: string;
  updatedAt: string;
  wallet: {
    usdcBalance: number;
    jamzBalance: number;
    usdcAddress: string | null;
    jamzAddress: string | null;
    paypalEmail: string | null;
    transactions: Transaction[];
  };
}

// Fetch with timeout wrapper to prevent hanging requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const api = {
  baseURL: API_URL,
  tracks: {
    list: async (): Promise<Track[]> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      return response.json();
    },

    get: async (id: string): Promise<Track> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch track');
      }
      return response.json();
    },

    create: async (formData: FormData): Promise<Track> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks`, {
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
      const response = await fetchWithTimeout(`${API_URL}/tracks/${id}`, {
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
      const response = await fetchWithTimeout(`${API_URL}/tracks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete track');
      }
    },

    reorder: async (trackOrders: { _id: string; order: number }[]): Promise<Track[]> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks/reorder`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackOrders })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reorder tracks');
      }
      return response.json();
    },

    like: async (id: string): Promise<Track> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks/${id}/like`, {
        method: 'POST',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to like track');
      }
      return response.json();
    },

    vote: async (id: string, voteType: 'upvote' | 'downvote'): Promise<{ track: Track; userVote: 'upvote' | 'downvote' | null }> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks/${id}/vote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ voteType })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vote on track');
      }
      return response.json();
    },

    getUserVote: async (id: string): Promise<{ userVote: 'upvote' | 'downvote' | null }> => {
      const response = await fetchWithTimeout(`${API_URL}/tracks/${id}/vote`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get user vote');
      }
      return response.json();
    }
  },
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      console.log('Attempting login with:', { email });

      try {
        const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password }),
        });

        console.log('Login response status:', response.status);

        if (!response.ok) {
          // Try to get a detailed error message
          try {
            const errorData = await response.json();
            console.error('Login error details:', errorData);
            throw new Error(errorData.message || 'Failed to login');
          } catch (parseError) {
            console.error('Error parsing login response:', parseError);
            // If we can't parse the error, get the response text
            const responseText = await response.text();
            console.error('Login response text:', responseText);
            throw new Error(`Login failed (${response.status}): ${responseText || 'Unknown error'}`);
          }
        }

        const data = await response.json();
        console.log('Login successful, user data:', {
          id: data.user.id,
          email: data.user.email,
          isAdmin: data.user.isAdmin,
          hasToken: !!data.token
        });
        return data;
      } catch (error) {
        console.error('Login failed with exception:', error);
        throw error;
      }
    },

    register: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
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
      const response = await fetchWithTimeout(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to verify token');
      }
      return response.json();
    },

    connectWallet: async (address: string): Promise<AuthResponse> => {
      const response = await fetchWithTimeout(`${API_URL}/auth/connect-wallet`, {
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

    syncWallet: async (address: string): Promise<{ message: string; user: any }> => {
      const response = await fetchWithTimeout(`${API_URL}/auth/sync-wallet`, {
        method: 'POST',
        headers: getHeaders(true), // Include auth token
        body: JSON.stringify({ address }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync wallet');
      }
      return response.json();
    },

    getWalletStatus: async (): Promise<{ userId: string; email: string; walletAddress: string | null; hasWalletAddress: boolean; authProvider: string; username: string }> => {
      const response = await fetchWithTimeout(`${API_URL}/auth/wallet-status`, {
        headers: getHeaders(true), // Include auth token
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get wallet status');
      }
      return response.json();
    },

    setUsername: async (username: string): Promise<{ user: AuthResponse['user'] }> => {
      const response = await fetchWithTimeout(`${API_URL}/auth/set-username`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set username');
      }
      return response.json();
    },

    updateDiscoverySource: async (data: { discoverySource: string; discoverySourceOther?: string | null; userType?: 'artist' | 'fan' }): Promise<{ user: AuthResponse['user'] }> => {
      const response = await fetchWithTimeout(`${API_URL}/auth/discovery-source`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update discovery source');
      }
      return response.json();
    }
  },

  artists: {
    list: async (): Promise<Artist[]> => {
      const response = await fetchWithTimeout(`${API_URL}/artists`);
      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }
      return response.json();
    },

    get: async (id: string): Promise<Artist> => {
      const response = await fetchWithTimeout(`${API_URL}/artists/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artist');
      }
      return response.json();
    },

    create: async (data: Partial<Artist>): Promise<Artist> => {
      const response = await fetchWithTimeout(`${API_URL}/artists`, {
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
      const response = await fetchWithTimeout(`${API_URL}/artists/${id}`, {
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
      const response = await fetchWithTimeout(`${API_URL}/artists/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete artist');
      }
    },


  },

  campaigns: {
    list: async (): Promise<Campaign[]> => {
      const response = await fetchWithTimeout(`${API_URL}/campaigns`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return response.json();
    },

    get: async (id: string): Promise<Campaign> => {
      const response = await fetchWithTimeout(`${API_URL}/campaigns/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }
      return response.json();
    },

    create: async (data: Partial<Campaign>): Promise<Campaign> => {
      const response = await fetchWithTimeout(`${API_URL}/campaigns`, {
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
      const response = await fetchWithTimeout(`${API_URL}/campaigns/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }
      return response.json();
    },

    reorder: async (campaignOrders: { _id: string; order: number }[]): Promise<Campaign[]> => {
      const response = await fetchWithTimeout(`${API_URL}/campaigns/reorder`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ campaignOrders }),
      });
      if (!response.ok) {
        throw new Error('Failed to reorder campaigns');
      }
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetchWithTimeout(`${API_URL}/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
    },
  },

  challenges: {
    list: async (): Promise<Challenge[]> => {
      const response = await fetchWithTimeout(`${API_URL}/challenges/user`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      return response.json();
    },

    listForCampaign: async (campaignId: string): Promise<Challenge[]> => {
      const response = await fetchWithTimeout(`${API_URL}/challenges/campaign/${campaignId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campaign challenges');
      }
      return response.json();
    },

    getCampaignParticipants: async (campaignId: string): Promise<Challenge[]> => {
      console.log('🔍 Fetching campaign challenges for participants view');

      try {
        // Make the API call to get challenges for this campaign using the participants endpoint
        const response = await fetchWithTimeout(`${API_URL}/challenges/campaign/${campaignId}/participants`, {
          headers: getAuthHeaders()
        });

        console.log("Challenges participants response status:", response.status);

        if (!response.ok) {
          // If there's an error, handle it safely
          try {
            const errorJSON = await response.json();
            throw new Error(errorJSON.message || `Error ${response.status}`);
          } catch (parseError) {
            // If we can't parse JSON, show a better error
            throw new Error(`Server returned status ${response.status}`);
          }
        }

        // Try to parse the response as JSON safely
        let text = "";
        try {
          text = await response.text();
          console.log("Challenges response text (first 100 chars):",
            text.substring(0, 100) + (text.length > 100 ? '...' : ''));

          // If it's empty, return an empty array
          if (!text.trim()) {
            return [];
          }

          // Try to parse it as JSON
          const data = JSON.parse(text);

          // Return the array or an empty array if it's not an array
          if (Array.isArray(data)) {
            return data;
          } else if (data.challenges && Array.isArray(data.challenges)) {
            return data.challenges;
          } else {
            console.log("Challenges response was not an array:", data);
            return [];
          }
        } catch (parseError) {
          console.error("Error parsing challenges response:", parseError);
          console.log("Raw challenges response:", text);
          return [];
        }
      } catch (error) {
        console.error("Challenges participant fetch error:", error);
        throw error;
      }
    },

    submit: async (data: { campaignId: string; platform: Challenge['platform']; videoUrl: string }): Promise<Challenge> => {
      const response = await fetchWithTimeout(`${API_URL}/challenges`, {
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
      console.log(`🔍 Updating challenge ${id} status to ${status}`);

      try {
        const response = await fetchWithTimeout(`${API_URL}/challenges/${id}/status`, {
          method: 'PATCH',
          headers: getHeaders(true),
          body: JSON.stringify({ status }),
        });

        console.log(`Status update response status code: ${response.status}`);

        if (!response.ok) {
          // Try to get a more helpful error message
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: Failed to update challenge status`);
          } catch (parseError) {
            throw new Error(`Failed to update challenge status (${response.status})`);
          }
        }

        const data = await response.json();
        console.log('Challenge status successfully updated');
        return data;
      } catch (error: any) {
        console.error('Error updating challenge status:', error);
        throw error;
      }
    },
  },

  shares: {
    list: async (): Promise<Share[]> => {
      const response = await fetchWithTimeout(`${API_URL}/shares/user`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch shares');
      }
      return response.json();
    },

    listForCampaign: async (campaignId: string): Promise<Share[]> => {
      const response = await fetchWithTimeout(`${API_URL}/shares/campaign/${campaignId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campaign shares');
      }
      return response.json();
    },

    getCampaignParticipants: async (campaignId: string): Promise<Share[]> => {
      console.log('🔍 USING SIMPLIFIED PARTICIPANT FETCH');

      // Just use the super simple implementation directly
      try {
        // First try the test endpoint to see if API is working
        try {
          const testResponse = await fetchWithTimeout(`${API_URL}/shares/test`);
          console.log("API Test Response:", testResponse.status);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("API Test Data:", testData);
          }
        } catch (testErr) {
          console.warn("API test failed:", testErr);
        }

        // Now try the actual participants endpoint
        const response = await fetchWithTimeout(`${API_URL}/shares/campaign/${campaignId}/participants`, {
          headers: getAuthHeaders()
        });

        console.log("Participants response status:", response.status);

        if (!response.ok) {
          // If there's an error, handle it safely
          try {
            const errorJSON = await response.json();
            throw new Error(errorJSON.message || `Error ${response.status}`);
          } catch (parseError) {
            // If we can't parse JSON, show a better error
            throw new Error(`Server returned status ${response.status}`);
          }
        }

        // Try to parse the response as JSON safely
        let text = "";
        try {
          text = await response.text();
          console.log("Response text (first 100 chars):",
            text.substring(0, 100) + (text.length > 100 ? '...' : ''));

          // If it's empty, return an empty array
          if (!text.trim()) {
            return [];
          }

          // Try to parse it as JSON
          const data = JSON.parse(text);

          // Return the array or an empty array if it's not an array
          if (Array.isArray(data)) {
            return data;
          } else if (data.shares && Array.isArray(data.shares)) {
            return data.shares;
          } else {
            console.log("Response was not an array:", data);
            return [];
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          console.log("Raw response:", text);
          return [];
        }
      } catch (error) {
        console.error("Participant fetch error:", error);
        throw error;
      }
    },

    approveShare: async (shareId: string): Promise<Share> => {
      const response = await fetchWithTimeout(`${API_URL}/shares/${shareId}/approve`, {
        method: 'PATCH',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve share');
      }
      return response.json();
    },

    submit: async (data: { campaignId: string; platform: Share['platform']; linkUrl?: string }): Promise<Share> => {
      const response = await fetchWithTimeout(`${API_URL}/shares`, {
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
      const response = await fetchWithTimeout(`${API_URL}/wallets/me`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }
      return response.json();
    },

    getTransactions: async (): Promise<{ transactions: Transaction[] }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/transactions`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },

    setAddresses: async (data: {
      usdcAddress?: string;
      jamzAddress?: string;
      paypalEmail?: string;
      ngnBankDetails?: {
        accountNumber?: string;
        bankName?: string;
        accountName?: string;
        bankCode?: string;
      };
      aedBankDetails?: {
        accountNumber?: string;
        bankName?: string;
        accountName?: string;
        iban?: string;
        swiftCode?: string;
      };
    }): Promise<{ wallet: Wallet }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/addresses`, {
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

    claimUsdToCrypto: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/claim/usd/crypto`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to withdraw USD to USDC');
      }
      return response.json();
    },

    claimUsdToPaypal: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/claim/usd/paypal`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to withdraw USD to PayPal');
      }
      return response.json();
    },

    claimJamzOnchain: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/claim/jamz/onchain`, {
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

    claimNgnToBank: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/claim/ngn/bank`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to withdraw NGN to bank');
      }
      return response.json();
    },

    claimAedToBank: async (amount: number): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/claim/aed/bank`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to withdraw AED to bank');
      }
      return response.json();
    },

    // Admin only
    addReward: async (data: { userId: string; token: 'USD' | 'JAMZ' | 'NGN' | 'AED'; amount: number }): Promise<{ message: string; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/admin/reward`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add reward');
      }
      return response.json();
    },

    watchReward: async (data: { campaignId: string; videoId: string }): Promise<{ message: string; reward: { jamz: number }; wallet: Wallet; watchCount?: number }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/watch-reward`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      return response.json();
    },

    // Exchange rates and swap
    getExchangeRates: async (): Promise<{ rates: any[]; swapFeePercentage: number; minimumSwapAmounts: any }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/exchange-rates`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      return response.json();
    },

    executeSwap: async (data: { fromCurrency: string; toCurrency: string; fromAmount: number }): Promise<{ message: string; swap: any; wallet: Wallet; transaction: Transaction }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/swap`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute swap');
      }
      return response.json();
    },

    getWatchCount: async (data: { campaignId: string; videoId: string }): Promise<{ watchCount: number; maxWatches: number }> => {
      const response = await fetchWithTimeout(`${API_URL}/wallets/watch-count`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      return response.json();
    }
  },

  // Artist Authentication
  artistAuth: {
    selfRegister: async (email: string, password: string, artistName: string, imageUrl?: string, socialLinks?: any): Promise<{ message: string; token?: string; artist?: { id: string; name: string; imageUrl?: string; email: string; socialMedia?: any } }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/self-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, artistName, imageUrl, socialLinks }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register artist account');
      }
      return response.json();
    },
    register: async (email: string, password: string, artistId: string): Promise<{ message: string; artistId: string }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/register`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ email, password, artistId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register artist account');
      }
      return response.json();
    },
    login: async (email: string, password: string): Promise<ArtistAuthResponse> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to login');
      }
      return response.json();
    },

    getProfile: async (): Promise<{ id: string; name: string; imageUrl?: string; email: string; socialMedia?: any }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/profile`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get profile');
      }
      return response.json();
    },

    updateProfile: async (profileData: { name: string; imageUrl?: string; socialMedia?: any }): Promise<{ id: string; name: string; imageUrl?: string; email: string; socialMedia?: any }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/profile`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },

    uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetchWithTimeout(`${API_URL}/artist-auth/upload-image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      return response.json();
    },

    // Upload image during registration (no auth required)
    uploadRegistrationImage: async (file: File): Promise<{ imageUrl: string }> => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetchWithTimeout(`${API_URL}/artist-auth/upload-registration-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      return response.json();
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/change-password`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return response.json();
    },

    resetPassword: async (artistId: string, newPassword: string): Promise<{ message: string; artistId: string }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist-auth/reset-password`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ artistId, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      return response.json();
    },
  },

  // Artist Campaign Management
  artistCampaigns: {
    list: async (): Promise<Campaign[]> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch campaigns');
      }
      return response.json();
    },

    get: async (id: string): Promise<Campaign> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/${id}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch campaign');
      }
      return response.json();
    },

    getChallenges: async (id: string): Promise<Challenge[]> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/${id}/challenges`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch challenges');
      }
      return response.json();
    },

    updateChallengeStatus: async (campaignId: string, challengeId: string, status: 'approved' | 'rejected', feedback?: string): Promise<{ message: string; challenge: Challenge }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/${campaignId}/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status, feedback }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update challenge status');
      }
      return response.json();
    },

    getStats: async (id: string): Promise<{
      totalChallenges: number;
      pendingChallenges: number;
      approvedChallenges: number;
      rejectedChallenges: number;
      rewardsDistributed: {
        usdc: number;
        jamz: number;
      };
    }> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/${id}/stats`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch campaign stats');
      }
      return response.json();
    },

    // Artist campaign creation
    create: async (campaignData: FormData | any): Promise<any> => {
      const isFormData = campaignData instanceof FormData;
      const headers = isFormData ? getHeaders(true, false) : getHeaders(true); // No Content-Type for FormData

      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/create`, {
        method: 'POST',
        headers,
        body: isFormData ? campaignData : JSON.stringify(campaignData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create campaign');
      }
      return response.json();
    },

    getMyCampaigns: async (): Promise<any[]> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/my-campaigns`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch campaigns');
      }
      return response.json();
    },

    updateStatus: async (campaignId: string, status: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update campaign status');
      }
      return response.json();
    }
  },

  // Artist Wallet Management
  artistWallet: {
    getWallet: async (): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch wallet');
      }
      return response.json();
    },

    getTransactions: async (page = 1, limit = 20, filters?: any): Promise<any> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/transactions?${queryParams}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch transactions');
      }
      return response.json();
    },

    getFundingMethods: async (): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/funding-methods`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch funding methods');
      }
      return response.json();
    },

    calculateCampaignCost: async (campaignOptions: any): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/calculate-campaign-cost`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(campaignOptions),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate campaign cost');
      }
      return response.json();
    },

    executeSwap: async (swapData: { fromCurrency: string; toCurrency: string; fromAmount: number }): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/swap`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(swapData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute swap');
      }
      return response.json();
    },

    // Admin functions
    adminGetAllWallets: async (): Promise<any[]> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/admin/all`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch wallets');
      }
      return response.json();
    },

    adminGetWallet: async (artistId: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/admin/${artistId}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch wallet');
      }
      return response.json();
    },

    adminAddDeposit: async (data: { artistId: string; currency: string; amount: number; reference?: string }): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/artist/wallet/admin/add-deposit`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add deposit');
      }
      return response.json();
    }
  },

  // User Management (Admin only)
  users: {
    list: async (): Promise<User[]> => {
      const response = await fetchWithTimeout(`${API_URL}/users`, {
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
      }
      return response.json();
    },

    get: async (id: string): Promise<User> => {
      const response = await fetchWithTimeout(`${API_URL}/users/${id}`, {
        headers: getHeaders(true),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user');
      }
      return response.json();
    },
  },

  referrals: {
    generate: async (campaignId: string): Promise<{
      referralCode: string;
      referralUrl: string;
      campaign: { title: string; showcase: string };
      rewards: { usd: number; jamz: number; ngn: number; aed: number };
    }> => {
      console.log('🔗 Generating referral link for campaign:', campaignId);
      console.log('🔑 Auth headers:', getHeaders(true));

      const response = await fetchWithTimeout(`${API_URL}/referrals/generate`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ campaignId })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Referral generation failed:', errorData);
        throw new Error(`Failed to generate referral link: ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Referral generated successfully:', result);
      return result;
    },
    trackJoin: async (referralCode: string, userId: string): Promise<void> => {
      const response = await fetchWithTimeout(`${API_URL}/referrals/track-join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ referralCode, userId })
      });
      if (!response.ok) {
        throw new Error('Failed to track referral join');
      }
    },
    trackCompletion: async (showcaseId: string): Promise<void> => {
      const response = await fetchWithTimeout(`${API_URL}/referrals/track-completion`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ showcaseId })
      });
      if (!response.ok) {
        throw new Error('Failed to track referral completion');
      }
    },
    getStats: async (): Promise<{
      totalReferrals: number;
      completedReferrals: number;
      totalRewardsEarned: { usd: number; jamz: number; ngn: number; aed: number };
      referrals: Array<{
        _id: string;
        campaign: string;
        showcase: string;
        status: string;
        sharedAt: string;
        joinedAt?: string;
        completedAt?: string;
        rewards: { usd: number; jamz: number; ngn: number; aed: number };
        rewardsDistributed: boolean;
      }>;
    }> => {
      const response = await fetchWithTimeout(`${API_URL}/referrals/stats`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      return response.json();
    }
  },

  notifications: {
    // Get user notifications
    getNotifications: async (options: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}): Promise<{
      notifications: Array<{
        _id: string;
        type: string;
        title: string;
        message: string;
        campaignId?: {
          _id: string;
          title: string;
          thumbnailImage?: string;
        };
        data?: any;
        isRead: boolean;
        priority: string;
        createdAt: string;
      }>;
      hasMore: boolean;
    }> => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.skip) params.append('skip', options.skip.toString());
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.type) params.append('type', options.type);

      const response = await fetchWithTimeout(`${API_URL}/notifications?${params}`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },

    // Get unread notification count
    getUnreadCount: async (): Promise<{ count: number }> => {
      const response = await fetchWithTimeout(`${API_URL}/notifications/unread-count`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      return response.json();
    },

    // Mark notifications as read
    markAsRead: async (notificationIds: string[]): Promise<void> => {
      const response = await fetchWithTimeout(`${API_URL}/notifications/mark-read`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ notificationIds })
      });
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
    },

    // Mark all notifications as read
    markAllAsRead: async (): Promise<void> => {
      const response = await fetchWithTimeout(`${API_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    },

    // Get notification by ID
    getNotification: async (id: string): Promise<{
      _id: string;
      type: string;
      title: string;
      message: string;
      campaignId?: {
        _id: string;
        title: string;
        thumbnailImage?: string;
      };
      data?: any;
      isRead: boolean;
      priority: string;
      createdAt: string;
    }> => {
      const response = await fetchWithTimeout(`${API_URL}/notifications/${id}`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notification');
      }
      return response.json();
    },

    // Delete notification
    deleteNotification: async (id: string): Promise<void> => {
      const response = await fetchWithTimeout(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
    }
  },

  // Admin Settings API
  adminSettings: {
    // Get admin settings
    getSettings: async (): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch admin settings');
      }
      return response.json();
    },

    // Update admin settings
    updateSettings: async (settings: any): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        throw new Error('Failed to update admin settings');
      }
      return response.json();
    },

    // Get payment methods (public)
    getPaymentMethods: async (): Promise<any[]> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/payment-methods`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      return response.json();
    },

    // Add payment method
    addPaymentMethod: async (method: any): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/payment-methods`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(method)
      });
      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }
      return response.json();
    },

    // Update payment method
    updatePaymentMethod: async (id: string, method: any): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/payment-methods/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(method)
      });
      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }
      return response.json();
    },

    // Delete payment method
    deletePaymentMethod: async (id: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/payment-methods/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }
      return response.json();
    },

    // Toggle payment method
    togglePaymentMethod: async (id: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/payment-methods/${id}/toggle`, {
        method: 'PATCH',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to toggle payment method');
      }
      return response.json();
    },

    // Exchange rate management
    getExchangeRates: async (): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/exchange-rates`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      return response.json();
    },

    updateExchangeRate: async (fromCurrency: string, toCurrency: string, rate: number): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/exchange-rates/${fromCurrency}/${toCurrency}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ rate })
      });
      if (!response.ok) {
        throw new Error('Failed to update exchange rate');
      }
      return response.json();
    },

    updateSwapFee: async (swapFeePercentage: number): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/exchange-rates/fee`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ swapFeePercentage })
      });
      if (!response.ok) {
        throw new Error('Failed to update swap fee');
      }
      return response.json();
    },

    updateMinimumSwapAmounts: async (minimumSwapAmounts: any): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/exchange-rates/minimums`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ minimumSwapAmounts })
      });
      if (!response.ok) {
        throw new Error('Failed to update minimum swap amounts');
      }
      return response.json();
    },

    getExchangeRateHistory: async (): Promise<any[]> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/settings/exchange-rates/history`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate history');
      }
      return response.json();
    }
  },

  // Admin Withdrawals API
  adminWithdrawals: {
    // Get all withdrawal requests
    getWithdrawals: async (filters?: { status?: string; currency?: string; page?: number; limit?: number }): Promise<any> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.currency) params.append('currency', filters.currency);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals?${params.toString()}`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }
      return response.json();
    },

    // Get single withdrawal request
    getWithdrawal: async (id: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals/${id}`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawal');
      }
      return response.json();
    },

    // Approve withdrawal
    approveWithdrawal: async (id: string, adminNotes?: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals/${id}/approve`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ adminNotes })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve withdrawal');
      }
      return response.json();
    },

    // Mark as processing
    processWithdrawal: async (id: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals/${id}/process`, {
        method: 'PATCH',
        headers: getHeaders(true)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process withdrawal');
      }
      return response.json();
    },

    // Complete withdrawal
    completeWithdrawal: async (id: string, txReference?: string, adminNotes?: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals/${id}/complete`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ txReference, adminNotes })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete withdrawal');
      }
      return response.json();
    },

    // Reject withdrawal
    rejectWithdrawal: async (id: string, rejectionReason: string): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals/${id}/reject`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ rejectionReason })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject withdrawal');
      }
      return response.json();
    },

    // Get withdrawal statistics
    getStats: async (): Promise<any> => {
      const response = await fetchWithTimeout(`${API_URL}/admin/withdrawals/stats/summary`, {
        headers: getHeaders(true)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawal stats');
      }
      return response.json();
    }
  }
};
