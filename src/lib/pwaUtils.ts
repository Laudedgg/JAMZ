/**
 * PWA Detection Utilities
 * 
 * Detects if the app is running as an installed PWA (Progressive Web App)
 * vs being accessed as a regular website in a browser.
 */

/**
 * Check if the app is running in standalone/PWA mode
 * This returns true when:
 * - iOS: App is launched from home screen (standalone mode)
 * - Android: App is installed as PWA (standalone or fullscreen)
 * - Desktop: App is installed as PWA
 */
export function isPWA(): boolean {
  // Check for iOS standalone mode
  const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  
  // Check for display-mode: standalone (works on most browsers)
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for display-mode: fullscreen (some Android PWAs use this)
  const isFullscreenMode = window.matchMedia('(display-mode: fullscreen)').matches;
  
  // Check for minimal-ui mode (some PWAs use this)
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  
  // Check if launched from TWA (Trusted Web Activity) on Android
  const referrer = document.referrer;
  const isTWA = referrer.includes('android-app://');
  
  return isIOSStandalone || isStandaloneMode || isFullscreenMode || isMinimalUI || isTWA;
}

/**
 * Check if the app is running as a regular website (not PWA)
 */
export function isWebsite(): boolean {
  return !isPWA();
}

