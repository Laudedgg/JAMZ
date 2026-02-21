import fetch from 'node-fetch';

class SocialMediaService {
  constructor() {
    // API keys would be stored in environment variables
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.tiktokApiKey = process.env.TIKTOK_API_KEY;
  }

  // Extract video/content ID from URL
  extractContentId(platform, url) {
    try {
      switch (platform) {
        case 'instagram':
          const igMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
          return igMatch ? igMatch[2] : null;
        
        case 'tiktok':
          // Handle both short URLs and full URLs
          if (url.includes('vm.tiktok.com')) {
            const shortMatch = url.match(/vm\.tiktok\.com\/([A-Za-z0-9_-]+)/);
            return shortMatch ? shortMatch[1] : null;
          } else {
            const fullMatch = url.match(/video\/(\d+)/);
            return fullMatch ? fullMatch[1] : null;
          }
        
        case 'youtube':
          if (url.includes('youtube.com/watch')) {
            const watchMatch = url.match(/watch\?v=([A-Za-z0-9_-]+)/);
            return watchMatch ? watchMatch[1] : null;
          } else if (url.includes('youtube.com/shorts')) {
            const shortsMatch = url.match(/shorts\/([A-Za-z0-9_-]+)/);
            return shortsMatch ? shortsMatch[1] : null;
          } else if (url.includes('youtu.be')) {
            const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
            return shortMatch ? shortMatch[1] : null;
          }
          return null;
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Error extracting content ID:', error);
      return null;
    }
  }

  // Validate URL format for each platform
  validateUrl(platform, url) {
    const patterns = {
      instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/,
      tiktok: /^https:\/\/(www\.)?(vm\.)?tiktok\.com\/[A-Za-z0-9_-]+\/?|^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+/,
      youtube: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)[A-Za-z0-9_-]+|^https:\/\/youtu\.be\/[A-Za-z0-9_-]+/
    };

    return patterns[platform] && patterns[platform].test(url);
  }

  // Fetch YouTube video metadata
  async fetchYouTubeMetadata(videoId) {
    if (!this.youtubeApiKey) {
      console.warn('YouTube API key not configured');
      return this.createFallbackMetadata('youtube', videoId);
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.youtubeApiKey}&part=snippet,statistics,contentDetails`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const statistics = video.statistics;

      return {
        title: snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(statistics.viewCount) || 0,
        likeCount: parseInt(statistics.likeCount) || 0,
        author: {
          username: snippet.channelTitle,
          displayName: snippet.channelTitle
        },
        extractedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      return this.createFallbackMetadata('youtube', videoId);
    }
  }

  // Fetch Instagram post metadata (using public methods)
  async fetchInstagramMetadata(postId) {
    // Instagram doesn't provide public API access for content metadata
    // We'll extract basic info from the URL and provide fallback data
    return this.createFallbackMetadata('instagram', postId);
  }

  // Fetch TikTok video metadata (using public methods)
  async fetchTikTokMetadata(videoId) {
    // TikTok's API requires approval for most use cases
    // We'll provide fallback data for now
    return this.createFallbackMetadata('tiktok', videoId);
  }

  // Create fallback metadata when API is not available
  createFallbackMetadata(platform, contentId) {
    // Generate a basic thumbnail URL for some platforms
    let thumbnailUrl = null;

    switch (platform) {
      case 'youtube':
        // YouTube provides public thumbnail URLs
        thumbnailUrl = `https://img.youtube.com/vi/${contentId}/hqdefault.jpg`;
        break;
      case 'instagram':
      case 'tiktok':
        // For Instagram and TikTok, we can't get thumbnails without API access
        // We'll use a placeholder or let the frontend handle it
        thumbnailUrl = null;
        break;
    }

    return {
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Content`,
      description: 'User-submitted content for Open Verse competition',
      thumbnailUrl,
      duration: 0,
      viewCount: 0,
      likeCount: 0,
      author: {
        username: 'Creator',
        displayName: 'Content Creator'
      },
      extractedAt: new Date()
    };
  }

  // Parse YouTube duration format (PT1M30S -> 90 seconds)
  parseDuration(duration) {
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;

      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;

      return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      return 0;
    }
  }

  // Main method to fetch metadata for any platform
  async fetchMetadata(platform, url) {
    try {
      // Validate URL first
      if (!this.validateUrl(platform, url)) {
        throw new Error(`Invalid ${platform} URL format`);
      }

      // Extract content ID
      const contentId = this.extractContentId(platform, url);
      if (!contentId) {
        throw new Error(`Could not extract content ID from ${platform} URL`);
      }

      // Fetch metadata based on platform
      switch (platform) {
        case 'youtube':
          return await this.fetchYouTubeMetadata(contentId);
        case 'instagram':
          return await this.fetchInstagramMetadata(contentId);
        case 'tiktok':
          return await this.fetchTikTokMetadata(contentId);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error fetching ${platform} metadata:`, error);
      // Return fallback metadata instead of throwing
      const contentId = this.extractContentId(platform, url) || 'unknown';
      return this.createFallbackMetadata(platform, contentId);
    }
  }

  // Check if content is accessible (basic URL validation)
  async validateContentAccess(platform, url) {
    try {
      // For now, just validate URL format
      // In production, you might want to make a HEAD request to check if content exists
      return this.validateUrl(platform, url);
    } catch (error) {
      console.error('Error validating content access:', error);
      return false;
    }
  }

  // Get platform-specific embed URL (for future use)
  getEmbedUrl(platform, url) {
    const contentId = this.extractContentId(platform, url);
    if (!contentId) return null;

    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${contentId}`;
      case 'instagram':
        // Instagram doesn't provide direct embed URLs for all content
        return null;
      case 'tiktok':
        // TikTok embed URLs require specific format
        return null;
      default:
        return null;
    }
  }

  // Generate thumbnail URL for platforms that support it
  getThumbnailUrl(platform, url) {
    const contentId = this.extractContentId(platform, url);
    if (!contentId) return null;

    switch (platform) {
      case 'youtube':
        return `https://img.youtube.com/vi/${contentId}/hqdefault.jpg`;
      case 'instagram':
        // Instagram thumbnails require API access
        return null;
      case 'tiktok':
        // TikTok thumbnails require API access
        return null;
      default:
        return null;
    }
  }
}

// Export singleton instance
export default new SocialMediaService();
