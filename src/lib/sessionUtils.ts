/**
 * Generate or retrieve a unique session ID for anonymous users
 * This is used to track votes from users who aren't logged in
 */
export function getSessionId(): string {
  const SESSION_KEY = 'jamz_session_id';
  
  // Check if session ID already exists in localStorage
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate a new session ID
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Generate a unique session ID based on browser fingerprint and random data
 */
function generateSessionId(): string {
  // Combine various browser properties for uniqueness
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Date.now(),
    Math.random().toString(36).substring(2, 15)
  ].join('|');
  
  // Create a simple hash
  return btoa(fingerprint).substring(0, 32);
}

