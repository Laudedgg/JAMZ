// Unified Campaign API Client
// Combines functionality from both Campaign and Showcase systems

const API_BASE = '/api/unified-campaigns';

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Types for the unified campaign system
export interface UnifiedCampaign {
  _id: string;
  title: string;
  description: string;
  artistId: {
    _id: string;
    name: string;
    imageUrl: string;
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      facebook?: string;
      tiktok?: string;
    };
  };
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  otherDspUrls: Record<string, string>;
  thumbnailImage: string;
  prizePool: {
    amount: number;
    currency: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
  };
  maxWinners: number;
  prizeDistribution: Array<{
    rank: number;
    amount: number;
  }>;
  maxParticipants: number;
  allowedPlatforms: string[];
  submissionGuidelines: string;
  prerequisites: {
    requireYouTubeWatch: boolean;
    requireShareAction: boolean;
  };
  shareRewardUsd: number;
  shareRewardJamz: number;
  shareRewardNgn: number;
  shareRewardAed: number;
  watchRewardUsd: number;
  watchRewardJamz: number;
  watchRewardNgn: number;
  watchRewardAed: number;
  challengeRewardUsd: number;
  challengeRewardJamz: number;
  challengeRewardNgn: number;
  challengeRewardAed: number;
  maxReferralRewards: number;
  maxReferralRewardsPerUser: number;
  totalReferralRewardsGiven: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'ended' | 'winners_selected' | 'prizes_distributed';
  totalSubmissions: number;
  totalParticipants: number;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  order: number;
  winnersSelected: boolean;
  winnersSelectedAt?: string;
  winnersSelectedBy?: string;
  prizesDistributed: boolean;
  prizesDistributedAt?: string;
  prizesDistributedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignEligibility {
  isEligible: boolean;
  prerequisites: {
    youtubeWatchCompleted: boolean;
    youtubeWatchCompletedAt?: string;
    youtubeVideoId?: string;
    shareActionCompleted: boolean;
    shareActionCompletedAt?: string;
    shareActionPlatform?: string;
    shareActionUrl?: string;
  };
  hasSubmitted: boolean;
  submissionId?: string;
}

export interface CampaignSubmission {
  _id: string;
  campaignId: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    walletAddress?: string;
  };
  platform: string;
  contentUrl: string;
  metadata?: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    author?: {
      username?: string;
      displayName?: string;
    };
  };
  status: 'pending' | 'approved' | 'rejected' | 'disqualified';
  isWinner: boolean;
  winnerRank?: number;
  prizeAmount?: number;
  prizeCurrency?: string;
  isManualEntry?: boolean;
  isFeatured?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  artistId: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  otherDspUrls?: Record<string, string>;
  thumbnailImage: File;
  prizePoolAmount: number;
  prizePoolCurrency: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
  maxParticipants: number;
  maxWinners: number;
  startDate: string;
  endDate: string;
  allowedPlatforms: string[];
  submissionGuidelines?: string;
  prizeDistribution: Array<{
    rank: number;
    amount: number;
  }>;
  requireYouTubeWatch: boolean;
  requireShareAction: boolean;
  shareRewardUsd?: number;
  shareRewardJamz?: number;
  shareRewardNgn?: number;
  shareRewardAed?: number;
  watchRewardUsd?: number;
  watchRewardJamz?: number;
  watchRewardNgn?: number;
  watchRewardAed?: number;
  maxReferralRewards?: number;
  maxReferralRewardsPerUser?: number;
  isActive: boolean;
}

// API functions
export const unifiedCampaignApi = {
  // Public endpoints
  getAll: async (): Promise<UnifiedCampaign[]> => {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to fetch campaigns');
    return response.json();
  },

  get: async (id: string): Promise<UnifiedCampaign> => {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch campaign');
    return response.json();
  },

  getThumbnailUrl: (id: string): string => {
    return `${API_BASE}/${id}/thumbnail`;
  },

  getShowcase: async (id: string, status: string = 'approved', includeOwn: boolean = false): Promise<CampaignSubmission[]> => {
    const params = new URLSearchParams({ status });
    if (includeOwn) {
      params.append('includeOwn', 'true');
    }
    params.append('t', Date.now().toString()); // Cache busting

    const response = await fetch(`${API_BASE}/${id}/showcase?${params}`, {
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch showcase');
    return response.json();
  },

  getWinners: async (id: string): Promise<CampaignSubmission[]> => {
    const response = await fetch(`${API_BASE}/${id}/winners`);
    if (!response.ok) throw new Error('Failed to fetch winners');
    return response.json();
  },

  // Authenticated user endpoints
  checkEligibility: async (id: string): Promise<CampaignEligibility> => {
    const response = await fetch(`${API_BASE}/${id}/eligibility`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to check eligibility');
    return response.json();
  },

  completeYouTubeWatch: async (id: string, videoId: string): Promise<{ message: string; isEligible: boolean; prerequisites: any }> => {
    const response = await fetch(`${API_BASE}/${id}/complete-youtube-watch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ videoId })
    });
    if (!response.ok) throw new Error('Failed to complete YouTube watch');
    return response.json();
  },

  completeShareAction: async (id: string, platform: string, url?: string): Promise<{ message: string; isEligible: boolean; prerequisites: any }> => {
    const response = await fetch(`${API_BASE}/${id}/complete-share-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ platform, url })
    });
    if (!response.ok) throw new Error('Failed to complete share action');
    return response.json();
  },

  submit: async (id: string, platform: string, contentUrl: string): Promise<{ message: string; submission: CampaignSubmission }> => {
    const response = await fetch(`${API_BASE}/${id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ platform, contentUrl })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit');
    }
    return response.json();
  },

  // Admin endpoints
  admin: {
    getAll: async (): Promise<UnifiedCampaign[]> => {
      const response = await fetch(`${API_BASE}/admin/campaigns`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch admin campaigns');
      return response.json();
    },

    create: async (data: CreateCampaignData): Promise<UnifiedCampaign> => {
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'thumbnailImage') {
          formData.append(key, value as File);
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE}/admin/campaigns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create campaign');
      }
      return response.json();
    },

    update: async (id: string, data: Partial<CreateCampaignData>): Promise<UnifiedCampaign> => {
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'thumbnailImage' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE}/admin/campaigns/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update campaign');
      }
      return response.json();
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const response = await fetch(`${API_BASE}/admin/campaigns/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete campaign');
      }
      return response.json();
    }
  },

  // Winner selection (available to both admin and artists)
  selectWinners: async (id: string, winners: Array<{
    submissionId: string;
    rank: number;
    prizeAmount: number;
  }>): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/${id}/select-winners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ winners })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to select winners');
    }
    return response.json();
  }
};
