/**
 * Utility functions for handling media URLs
 */

// Define the backend URL for media files
const BACKEND_URL = '/api';

/**
 * Converts a relative media path to a full URL
 * This ensures media URLs work both in development and production
 *
 * @param path The relative path to the media file (e.g., 'public/media/tracks/image.png')
 * @returns The full URL to the media file
 */
export const getMediaUrl = (path: string): string => {
  if (!path) {
    console.warn('Empty path provided to getMediaUrl');
    return '';
  }

  // If the path already includes the domain or is an absolute URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }

  // Handle localhost URLs that might be stored in the database
  if (path.includes('localhost:5001')) {
    const pathParts = path.split('localhost:5001/');
    if (pathParts.length > 1) {
      path = pathParts[1]; // Extract the path after localhost:5001/
    }
  }

  // The key fix: If the path starts with 'public/', we need to remove it
  // because the files in the public directory are served at the root path
  if (path.startsWith('public/')) {
    // For media files, use the backend API to serve them
    const mediaPath = path.replace(/^public\//, '');
    // If the path already starts with 'media/', don't add it again
    if (mediaPath.startsWith('media/')) {
      return `/api/${mediaPath}`;
    } else {
      return `/api/media/${mediaPath}`;
    }
  }

  // If the path starts with a slash, remove it to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // For all other paths, use the backend API
  return `/api/media/${cleanPath}`;
};
