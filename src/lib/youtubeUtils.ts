/**
 * YouTube URL utilities for extracting video IDs and generating embed URLs
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (raw ID)
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // If it's already just a video ID (11-12 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11,12}$/.test(url)) {
    return url;
  }

  // Try to match youtube.com/watch?v=VIDEO_ID
  const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11,12})/);
  if (match1) return match1[1];

  // Try to match youtu.be/VIDEO_ID
  const match2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11,12})/);
  if (match2) return match2[1];

  // Try to match youtube.com/embed/VIDEO_ID
  const match3 = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11,12})/);
  if (match3) return match3[1];

  return null;
}

/**
 * Generate an embeddable YouTube iframe URL
 * @param videoId - YouTube video ID
 * @param options - Optional parameters for the embed
 */
export function generateYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    controls?: boolean;
    modestbranding?: boolean;
    rel?: boolean;
  }
): string {
  const params = new URLSearchParams();

  // Set default options
  params.set('autoplay', options?.autoplay ? '1' : '0');
  params.set('controls', options?.controls !== false ? '1' : '0');
  params.set('modestbranding', options?.modestbranding ? '1' : '0');
  params.set('rel', options?.rel ? '1' : '0');

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Get YouTube thumbnail URL from video ID
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres'
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'
): string {
  const qualityMap: Record<string, string> = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg'
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Validate YouTube URL and return video ID if valid
 */
export function validateAndExtractYouTubeId(url: string): { valid: boolean; videoId: string | null } {
  const videoId = extractYouTubeVideoId(url);
  return {
    valid: videoId !== null,
    videoId
  };
}

