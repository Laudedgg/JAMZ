/**
 * Spotify Service
 * Handles all Spotify API interactions including OAuth and liked songs fetching
 */

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com';

/**
 * Get Spotify authorization URL for OAuth flow
 */
export function getSpotifyAuthUrl(redirectUri) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error('SPOTIFY_CLIENT_ID not configured');
  }

  const scopes = [
    'user-library-read',      // Read liked songs
    'user-read-private',      // Read user profile
    'user-read-email',        // Read user email
    'user-read-playback-state', // Read playback state
    'user-modify-playback-state' // Control playback
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state: Math.random().toString(36).substring(7) // Random state for security
  });

  return `${SPOTIFY_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code, redirectUri) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Spotify token exchange failed: ${error.error_description}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description}`);
  }

  return response.json();
}

/**
 * Get user's profile from Spotify
 */
export async function getUserProfile(accessToken) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Spotify profile');
  }

  return response.json();
}

/**
 * Get user's liked songs from Spotify
 */
export async function getLikedSongs(accessToken, limit = 50, offset = 0) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/tracks?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch liked songs from Spotify');
  }

  const data = await response.json();

  // Transform Spotify data to our format
  return {
    total: data.total,
    songs: data.items.map(item => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      coverImage: item.track.album.images[0]?.url || null,
      spotifyUrl: item.track.external_urls.spotify,
      spotifyPreviewUrl: item.track.preview_url,
      duration: Math.floor(item.track.duration_ms / 1000),
      source: 'spotify-liked',
      addedAt: item.added_at
    }))
  };
}

/**
 * Get all user's liked songs (handles pagination)
 */
export async function getAllLikedSongs(accessToken) {
  const allSongs = [];
  let offset = 0;
  const limit = 50;
  let total = 0;

  try {
    // First request to get total count
    const firstBatch = await getLikedSongs(accessToken, limit, offset);
    total = firstBatch.total;
    allSongs.push(...firstBatch.songs);

    // Fetch remaining songs
    while (allSongs.length < total) {
      offset += limit;
      const batch = await getLikedSongs(accessToken, limit, offset);
      allSongs.push(...batch.songs);
    }

    return {
      total,
      songs: allSongs
    };
  } catch (error) {
    console.error('Error fetching all liked songs:', error);
    throw error;
  }
}

/**
 * Check if token needs refresh
 */
export function isTokenExpired(expiryDate) {
  if (!expiryDate) return true;
  return new Date() >= new Date(expiryDate);
}

/**
 * Validate Spotify access token
 */
export async function validateAccessToken(accessToken) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

