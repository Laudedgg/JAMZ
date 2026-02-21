import fetch from 'node-fetch';
import socialMediaService from './socialMediaService.js';

/**
 * Music Metadata Service
 * Enriches track data by fetching metadata from YouTube, Spotify, and Apple Music
 */
class MusicMetadataService {
  constructor() {
    this.spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    this.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.appleMusicToken = process.env.APPLE_MUSIC_TOKEN;
    this.spotifyAccessToken = null;
    this.spotifyTokenExpiry = null;
  }

  /**
   * Get Spotify access token using Client Credentials flow
   */
  async getSpotifyAccessToken() {
    // Return cached token if still valid
    if (this.spotifyAccessToken && this.spotifyTokenExpiry && Date.now() < this.spotifyTokenExpiry) {
      return this.spotifyAccessToken;
    }

    if (!this.spotifyClientId || !this.spotifyClientSecret) {
      console.warn('Spotify credentials not configured');
      return null;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.spotifyClientId}:${this.spotifyClientSecret}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.spotifyAccessToken = data.access_token;
      this.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.spotifyAccessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  /**
   * Search for a track on Spotify
   */
  async searchSpotify(title, artist) {
    const token = await this.getSpotifyAccessToken();
    if (!token) {
      return null;
    }

    try {
      const query = encodeURIComponent(`track:${title} artist:${artist}`);
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
        const track = data.tracks.items[0];
        return {
          spotifyUrl: track.external_urls.spotify,
          spotifyPreviewUrl: track.preview_url,
          spotifyId: track.id
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching Spotify:', error);
      return null;
    }
  }

  /**
   * Search for a track on Apple Music
   */
  async searchAppleMusic(title, artist) {
    if (!this.appleMusicToken) {
      console.warn('Apple Music token not configured');
      return null;
    }

    try {
      const query = encodeURIComponent(`${title} ${artist}`);
      const response = await fetch(
        `https://api.music.apple.com/v1/catalog/us/search?term=${query}&types=songs&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.appleMusicToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Apple Music search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.songs && data.results.songs.data && data.results.songs.data.length > 0) {
        const song = data.results.songs.data[0];
        return {
          appleMusicUrl: song.attributes.url,
          appleMusicPreviewUrl: song.attributes.previews?.[0]?.url || null,
          appleMusicId: song.id
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching Apple Music:', error);
      return null;
    }
  }

  /**
   * Parse artist name from YouTube video title
   * Common patterns: "Artist - Title", "Title by Artist", "Artist: Title"
   */
  parseArtistFromTitle(title) {
    // Pattern 1: "Artist - Title"
    const dashPattern = /^([^-]+)\s*-\s*(.+)$/;
    const dashMatch = title.match(dashPattern);
    if (dashMatch) {
      return {
        artist: dashMatch[1].trim(),
        title: dashMatch[2].trim()
      };
    }

    // Pattern 2: "Title by Artist"
    const byPattern = /^(.+)\s+by\s+(.+)$/i;
    const byMatch = title.match(byPattern);
    if (byMatch) {
      return {
        title: byMatch[1].trim(),
        artist: byMatch[2].trim()
      };
    }

    // Pattern 3: "Artist: Title"
    const colonPattern = /^([^:]+):\s*(.+)$/;
    const colonMatch = title.match(colonPattern);
    if (colonMatch) {
      return {
        artist: colonMatch[1].trim(),
        title: colonMatch[2].trim()
      };
    }

    // If no pattern matches, return the whole title as title with unknown artist
    return {
      title: title.trim(),
      artist: 'Unknown Artist'
    };
  }

  /**
   * Download image from URL and return as buffer
   */
  async downloadImage(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      return await response.buffer();
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  }

  /**
   * Enrich track data from YouTube URL
   * Fetches YouTube metadata and searches for Spotify/Apple Music links
   */
  async enrichFromYouTube(youtubeUrl) {
    try {
      console.log(`Enriching track from YouTube URL: ${youtubeUrl}`);

      // Extract video ID
      const videoId = socialMediaService.extractContentId('youtube', youtubeUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Fetch YouTube metadata
      const ytMetadata = await socialMediaService.fetchYouTubeMetadata(videoId);
      console.log('YouTube metadata:', ytMetadata);

      // Parse artist and title from YouTube title
      const parsed = this.parseArtistFromTitle(ytMetadata.title);
      console.log('Parsed artist and title:', parsed);

      // Search for Spotify match
      const spotifyData = await this.searchSpotify(parsed.title, parsed.artist);
      console.log('Spotify data:', spotifyData);

      // Search for Apple Music match
      const appleMusicData = await this.searchAppleMusic(parsed.title, parsed.artist);
      console.log('Apple Music data:', appleMusicData);

      // Combine all data
      const enrichedData = {
        title: parsed.title,
        artist: parsed.artist,
        youtubeUrl: youtubeUrl,
        duration: ytMetadata.duration || 0,
        coverImageUrl: ytMetadata.thumbnailUrl,
        ...spotifyData,
        ...appleMusicData
      };

      console.log('Enriched data:', enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Error enriching from YouTube:', error);
      throw error;
    }
  }

  /**
   * Bulk enrich multiple YouTube URLs
   */
  async bulkEnrichFromYouTube(youtubeUrls) {
    const results = [];

    for (const url of youtubeUrls) {
      try {
        const enrichedData = await this.enrichFromYouTube(url);
        results.push({
          success: true,
          data: enrichedData
        });
      } catch (error) {
        results.push({
          success: false,
          url: url,
          error: error.message
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }
}

// Export singleton instance
export default new MusicMetadataService();

