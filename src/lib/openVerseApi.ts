import { api } from './api';

export interface OpenVerseCampaign {
  _id: string;
  title: string;
  description: string;
  thumbnailImage: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  artistId?: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  prerequisites?: {
    requireShareAction: boolean;
  };
  prizePool: {
    amount: number;
    currency: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
  };
  maxParticipants: number;
  maxWinners: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'ended' | 'winners_selected' | 'prizes_distributed';
  allowedPlatforms: string[];
  submissionGuidelines?: string;
  totalSubmissions: number;
  totalParticipants: number;
  winnersSelected: boolean;
  prizesDistributed: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtual properties
  isCurrentlyActive?: boolean;
  hasEnded?: boolean;
  timeRemaining?: number;
}

export interface OpenVerseSubmission {
  _id: string;
  campaignId: string;
  userId: {
    _id: string;
    username?: string;
    email: string;
  };
  platform: 'instagram' | 'tiktok' | 'youtube';
  contentUrl: string;
  metadata?: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
    viewCount?: number;
    likeCount?: number;
    author?: {
      username?: string;
      displayName?: string;
      profilePicture?: string;
    };
    extractedAt: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'disqualified';
  isWinner: boolean;
  winnerRank?: number;
  prizeAmount?: number;
  prizeCurrency?: 'JAMZ' | 'USDT';
  prizeDistributed: boolean;
  engagementMetrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRequest {
  platform: 'instagram' | 'tiktok' | 'youtube';
  contentUrl: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Enhanced error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = response.status.toString();
    let errorDetails = null;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
      errorDetails = errorData.details || null;
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  return response.json();
};

// Fetch with timeout wrapper
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

const makeRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, 5000); // 5 second timeout

    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Timeout error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.');
    }

    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection and try again.');
    }

    throw new ApiError(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
};

export const openVerseApi = {
  // Public endpoints
  campaigns: {
    // Get all active campaigns
    list: async (): Promise<OpenVerseCampaign[]> => {
      // Add cache busting parameter
      const timestamp = Date.now();
      return makeRequest(`${api.baseURL}/open-verse/campaigns?t=${timestamp}`);
    },

    // Get single campaign
    get: async (id: string): Promise<OpenVerseCampaign> => {
      return makeRequest(`${api.baseURL}/open-verse/campaigns/${id}`);
    },

    // Get campaign submissions (public view - only approved)
    getSubmissions: async (id: string, status: string = 'approved', includeOwn: boolean = false): Promise<OpenVerseSubmission[]> => {
      const params = new URLSearchParams({ status });
      if (includeOwn) {
        params.append('includeOwn', 'true');
      }
      // Add cache busting
      params.append('t', Date.now().toString());

      const response = await fetch(`${api.baseURL}/open-verse/campaigns/${id}/submissions?${params}`, {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    },

    // Get campaign submissions including user's own (for authenticated users)
    getSubmissionsWithOwn: async (id: string, status: string = 'approved'): Promise<OpenVerseSubmission[]> => {
      const params = new URLSearchParams({ status, includeOwn: 'true' });
      // Add cache busting
      params.append('t', Date.now().toString());

      const response = await fetch(`${api.baseURL}/open-verse/campaigns/${id}/submissions?${params}`, {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    },

    // Get campaign showcase (combines submissions and manual entries) (public)
    getShowcase: async (id: string, status: string = 'approved', includeOwn: boolean = false): Promise<OpenVerseSubmission[]> => {
      const params = new URLSearchParams({ status });
      if (includeOwn) {
        params.append('includeOwn', 'true');
      }
      // Add cache busting
      params.append('t', Date.now().toString());

      const response = await fetch(`${api.baseURL}/open-verse/campaigns/${id}/showcase?${params}`, {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch showcase');
      }
      return response.json();
    },

    // Get campaign winners
    getWinners: async (id: string): Promise<OpenVerseSubmission[]> => {
      const response = await fetch(`${api.baseURL}/open-verse/campaigns/${id}/winners`);
      if (!response.ok) {
        throw new Error('Failed to fetch winners');
      }
      return response.json();
    },

    // Get campaign thumbnail
    getThumbnailUrl: (id: string): string => {
      return `${api.baseURL}/open-verse/campaigns/${id}/thumbnail`;
    }
  },

  // User endpoints (require authentication)
  submissions: {
    // Submit to campaign
    create: async (campaignId: string, submission: SubmissionRequest): Promise<OpenVerseSubmission> => {
      const response = await fetch(`${api.baseURL}/open-verse/campaigns/${campaignId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit');
      }

      return response.json();
    },

    // Get user's submissions
    getUserSubmissions: async (): Promise<OpenVerseSubmission[]> => {
      const response = await fetch(`${api.baseURL}/open-verse/my-submissions`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user submissions');
      }

      return response.json();
    }
  },

  // Admin endpoints (require admin authentication)
  admin: {
    campaigns: {
      // Get all campaigns for admin
      list: async (): Promise<OpenVerseCampaign[]> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin campaigns');
        }

        return response.json();
      },

      // Create campaign
      create: async (formData: FormData): Promise<OpenVerseCampaign> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns`, {
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

      // Update campaign
      update: async (id: string, formData: FormData): Promise<OpenVerseCampaign> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns/${id}`, {
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

      // Delete campaign
      delete: async (id: string): Promise<void> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete campaign');
        }
      },

      // Update campaign status
      updateStatus: async (id: string, status: string, isActive: boolean): Promise<OpenVerseCampaign> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ status, isActive })
        });

        if (!response.ok) {
          throw new Error('Failed to update campaign status');
        }

        return response.json();
      }
    },

    submissions: {
      // Get submissions for admin review
      getByCampaign: async (campaignId: string, status?: string): Promise<OpenVerseSubmission[]> => {
        const url = status 
          ? `${api.baseURL}/open-verse/admin/campaigns/${campaignId}/submissions?status=${status}`
          : `${api.baseURL}/open-verse/admin/campaigns/${campaignId}/submissions`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        return response.json();
      },

      // Review submission
      review: async (submissionId: string, status: string, reviewNotes?: string): Promise<OpenVerseSubmission> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/submissions/${submissionId}/review`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ status, reviewNotes })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to review submission');
        }

        return response.json();
      },

      // Create manual submission
      createManual: async (campaignId: string, submissionData: {
        platform: 'instagram' | 'tiktok' | 'youtube';
        contentUrl: string;
        title: string;
        description?: string;
        authorName: string;
        authorUsername?: string;
        thumbnailUrl?: string;
        isWinner?: boolean;
        winnerRank?: number;
        prizeAmount?: number;
        prizeCurrency?: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
      }): Promise<{ message: string; submission: OpenVerseSubmission }> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns/${campaignId}/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create manual submission');
        }

        return response.json();
      },

      // Update submission
      update: async (submissionId: string, submissionData: {
        platform?: 'instagram' | 'tiktok' | 'youtube';
        contentUrl?: string;
        title?: string;
        description?: string;
        authorName?: string;
        authorUsername?: string;
        thumbnailUrl?: string;
        isWinner?: boolean;
        winnerRank?: number;
        prizeAmount?: number;
        prizeCurrency?: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
        status?: 'pending' | 'approved' | 'rejected' | 'disqualified';
      }): Promise<{ message: string; submission: OpenVerseSubmission }> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/submissions/${submissionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update submission');
        }

        return response.json();
      },

      // Delete submission
      delete: async (submissionId: string): Promise<{ message: string }> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/submissions/${submissionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete submission');
        }

        return response.json();
      }
    },

    winners: {
      // Select winners
      select: async (campaignId: string, winners: Array<{ submissionId: string; rank: number; prizeAmount: number }>): Promise<any> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns/${campaignId}/select-winners`, {
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
      },

      // Distribute prizes
      distributePrizes: async (campaignId: string): Promise<any> => {
        const response = await fetch(`${api.baseURL}/open-verse/admin/campaigns/${campaignId}/distribute-prizes`, {
          method: 'POST',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to distribute prizes');
        }

        return response.json();
      }
    }
  },

  // Content validation and preview
  content: {
    // Validate URL on server
    validateUrl: async (platform: string, url: string): Promise<{
      isValid: boolean;
      contentId: string | null;
      thumbnailUrl: string | null;
      platform: string;
    }> => {
      const response = await fetch(`${api.baseURL}/open-verse/validate-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform, url })
      });

      if (!response.ok) {
        throw new Error('Failed to validate URL');
      }

      return response.json();
    },

    // Get content preview/metadata
    getPreview: async (platform: string, url: string): Promise<any> => {
      const response = await fetch(`${api.baseURL}/open-verse/preview-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform, url })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content preview');
      }

      return response.json();
    }
  },

  // Utility functions
  utils: {
    // Validate platform URL (client-side)
    validatePlatformUrl: (platform: string, url: string): boolean => {
      const patterns = {
        instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/,
        tiktok: /^https:\/\/(www\.)?(vm\.)?tiktok\.com\/[A-Za-z0-9_-]+\/?|^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+/,
        youtube: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)[A-Za-z0-9_-]+|^https:\/\/youtu\.be\/[A-Za-z0-9_-]+/
      };

      return patterns[platform as keyof typeof patterns]?.test(url) || false;
    },

    // Format time remaining
    formatTimeRemaining: (endDate: string): string => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) return 'Ended';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h remaining`;
      if (hours > 0) return `${hours}h ${minutes}m remaining`;
      return `${minutes}m remaining`;
    },

    // Get platform icon/color
    getPlatformInfo: (platform: string) => {
      const platformInfo = {
        instagram: { name: 'Instagram', color: 'from-pink-500 to-purple-500', icon: '📷' },
        tiktok: { name: 'TikTok', color: 'from-black to-red-500', icon: '🎵' },
        youtube: { name: 'YouTube Shorts', color: 'from-red-500 to-red-600', icon: '📺' }
      };

      return platformInfo[platform as keyof typeof platformInfo] || { name: platform, color: 'from-gray-500 to-gray-600', icon: '🔗' };
    }
  }
};
