import { api } from './api';

export interface MFTCampaign {
  _id: string;
  artistId: {
    _id: string;
    name: string;
    imageUrl: string;
    bio?: string;
    socialMedia?: any;
  };
  trackId?: {
    _id: string;
    title: string;
    coverImage: string;
    audioUrl?: string;
  };
  title: string;
  description: string;
  coverImage: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  appleMusicUrl?: string;
  fundingGoal: number;
  currentFunding: number;
  currency: string;
  royaltyPercentage: number;
  mftPrice: number;
  totalSupply: number;
  soldSupply: number;
  status: 'draft' | 'active' | 'funded' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  investorCount: number;
  totalRoyaltiesDistributed: number;
  tradingEnabled: boolean;
  tradingFeePercent: number;
  isFeatured: boolean;
  tags: string[];
  genre: string;
  createdAt: string;
  updatedAt: string;
  fundingProgress: number;
  remainingSupply: number;
  isActive: boolean;
  campaignType: 'human' | 'ai_agent';
  aiAgent?: {
    creatorUserId: string;
    agentName: string;
    agentAvatar: string;
    agentBio: string;
    prompt: string;
    audioUrl: string;
    generationStatus: 'none' | 'pending' | 'completed' | 'failed';
  };
}

export interface MFTHolding {
  _id: string;
  campaignId: MFTCampaign;
  userId: string;
  quantity: number;
  averagePurchasePrice: number;
  totalInvested: number;
  totalRoyaltiesEarned: number;
  firstPurchaseDate: string;
  lastTransactionDate: string;
}

export interface MFTTransaction {
  _id: string;
  type: 'buy' | 'sell' | 'transfer';
  campaignId: { _id: string; title: string; coverImage: string };
  fromUserId?: { username: string };
  toUserId: { username: string };
  quantity: number;
  pricePerMFT: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface CampaignListResponse {
  campaigns: MFTCampaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CampaignDetailResponse {
  campaign: MFTCampaign;
  recentTransactions: MFTTransaction[];
  holderCount: number;
  userHolding: MFTHolding | null;
}

export interface CampaignComment {
  _id: string;
  campaignId: string;
  userId: { _id: string; username: string; walletAddress?: string };
  text: string;
  createdAt: string;
}

export interface PortfolioResponse {
  holdings: MFTHolding[];
  summary: {
    totalHoldings: number;
    totalInvested: number;
    totalRoyaltiesEarned: number;
  };
}

const BASE_URL = '/api/kickstarter';

export const kickstarterApi = {
  // Public endpoints
  getCampaigns: async (params?: {
    status?: string;
    sort?: string;
    genre?: string;
    featured?: boolean;
    limit?: number;
    page?: number;
    campaignType?: 'human' | 'ai_agent';
  }): Promise<CampaignListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.genre) queryParams.append('genre', params.genre);
    if (params?.featured) queryParams.append('featured', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.campaignType) queryParams.append('campaignType', params.campaignType);
    
    const response = await fetch(`${BASE_URL}/campaigns?${queryParams}`);
    if (!response.ok) {
      // Return empty campaigns for 404 (routes not deployed yet)
      if (response.status === 404) {
        return { campaigns: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
      }
      throw new Error('Failed to fetch campaigns');
    }
    return response.json();
  },

  getFeaturedCampaigns: async (): Promise<MFTCampaign[]> => {
    const response = await fetch(`${BASE_URL}/campaigns/featured`);
    if (!response.ok) throw new Error('Failed to fetch featured campaigns');
    return response.json();
  },

  getCampaign: async (id: string): Promise<CampaignDetailResponse> => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${BASE_URL}/campaigns/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch campaign');
    return response.json();
  },

  getCampaignTransactions: async (id: string, limit = 50): Promise<MFTTransaction[]> => {
    const response = await fetch(`${BASE_URL}/campaigns/${id}/transactions?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  getCampaignHolders: async (id: string): Promise<MFTHolding[]> => {
    const response = await fetch(`${BASE_URL}/campaigns/${id}/holders`);
    if (!response.ok) throw new Error('Failed to fetch holders');
    return response.json();
  },

  // Authenticated user endpoints
  buyMFTs: async (campaignId: string, quantity: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to buy MFTs');
    }
    return response.json();
  },

  getCampaignComments: async (id: string, limit = 50): Promise<CampaignComment[]> => {
    const response = await fetch(`${BASE_URL}/campaigns/${id}/comments?limit=${limit}`);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error('Failed to fetch comments');
    }
    return response.json();
  },

  postComment: async (campaignId: string, text: string): Promise<CampaignComment> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to post comment');
    }
    return response.json();
  },

  getPortfolio: async (): Promise<PortfolioResponse> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/portfolio`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    return response.json();
  },

  // AI Agent Artist (AAA) endpoints
  getMyAIAgentCampaigns: async (): Promise<MFTCampaign[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/ai-agent/campaigns`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch AI agent campaigns');
    return response.json();
  },

  createAIAgentCampaign: async (data: {
    agentName: string;
    agentAvatar?: string;
    agentBio?: string;
    prompt?: string;
    audioUrl?: string;
    title: string;
    description: string;
    coverImage: string;
    fundingGoal: number;
    royaltyPercentage: number;
    mftPrice: number;
    totalSupply: number;
    genre?: string;
  }): Promise<MFTCampaign> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/ai-agent/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create AI agent campaign');
    }
    return response.json();
  },

  generateAITrack: async (campaignId: string, prompt: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/ai-agent/campaigns/${campaignId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate track');
    }
    return response.json();
  }
};

