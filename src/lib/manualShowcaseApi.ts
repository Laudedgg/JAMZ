import { api } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export interface ManualShowcaseEntry {
  _id: string;
  campaignId: string | {
    _id: string;
    title: string;
    description?: string;
  };
  name: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'spotify' | 'soundcloud' | 'other';
  link: string;
  metadata: {
    description?: string;
    thumbnailUrl?: string;
    author?: {
      username?: string;
      displayName?: string;
    };
    extractedAt: string;
  };
  createdBy: {
    _id: string;
    email: string;
    username?: string;
  };
  order: number;
  status: 'active' | 'hidden' | 'featured';
  isFeatured: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManualShowcaseEntryRequest {
  campaignId: string;
  name: string;
  platform: string;
  link: string;
  description?: string;
  isFeatured?: boolean;
  adminNotes?: string;
}

export interface UpdateManualShowcaseEntryRequest {
  name?: string;
  platform?: string;
  link?: string;
  description?: string;
  isFeatured?: boolean;
  status?: string;
  adminNotes?: string;
  order?: number;
}

export interface CampaignOption {
  _id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

export const manualShowcaseApi = {
  // Get all campaigns for dropdown selection
  getCampaigns: async (): Promise<CampaignOption[]> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/campaigns`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    return response.json();
  },

  // Get manual showcase entries for a campaign
  getEntriesByCampaign: async (campaignId: string, status: string = 'all'): Promise<ManualShowcaseEntry[]> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/campaigns/${campaignId}/entries?status=${status}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch showcase entries');
    }

    return response.json();
  },

  // Create a new manual showcase entry
  createEntry: async (data: CreateManualShowcaseEntryRequest): Promise<{ message: string; entry: ManualShowcaseEntry }> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create showcase entry');
    }

    return response.json();
  },

  // Update a manual showcase entry
  updateEntry: async (id: string, data: UpdateManualShowcaseEntryRequest): Promise<{ message: string; entry: ManualShowcaseEntry }> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update showcase entry');
    }

    return response.json();
  },

  // Delete a manual showcase entry
  deleteEntry: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/entries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete showcase entry');
    }

    return response.json();
  },

  // Get a single manual showcase entry
  getEntry: async (id: string): Promise<ManualShowcaseEntry> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/entries/${id}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch showcase entry');
    }

    return response.json();
  },

  // Bulk update order of entries
  reorderEntries: async (entries: { id: string; order: number }[]): Promise<{ message: string }> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/entries/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ entries })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reorder entries');
    }

    return response.json();
  },

  // Get featured entries (public)
  getFeaturedEntries: async (limit: number = 10): Promise<ManualShowcaseEntry[]> => {
    const response = await fetch(`${api.baseURL}/manual-showcase/featured?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch featured entries');
    }

    return response.json();
  }
};

// Platform options for the form
export const platformOptions = [
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'spotify', label: 'Spotify', icon: '🎧' },
  { value: 'soundcloud', label: 'SoundCloud', icon: '🔊' },
  { value: 'other', label: 'Other', icon: '🔗' }
];

// Helper function to get platform icon
export const getPlatformIcon = (platform: string): string => {
  const option = platformOptions.find(opt => opt.value === platform);
  return option?.icon || '🔗';
};

// Helper function to validate URL format
export const validatePlatformUrl = (platform: string, url: string): boolean => {
  if (platform === 'other') return true;
  
  const urlPatterns: Record<string, RegExp> = {
    youtube: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)[A-Za-z0-9_-]+|^https:\/\/youtu\.be\/[A-Za-z0-9_-]+/,
    tiktok: /^https:\/\/(www\.)?(vm\.)?tiktok\.com\/[A-Za-z0-9_-]+\/?|^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+/,
    instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/,
    twitter: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+/,
    facebook: /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+\/(posts|videos)\/[A-Za-z0-9_.-]+/,
    spotify: /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[A-Za-z0-9]+/,
    soundcloud: /^https:\/\/(www\.)?soundcloud\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/
  };
  
  return urlPatterns[platform] ? urlPatterns[platform].test(url) : false;
};
