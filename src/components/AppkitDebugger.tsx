import { useEffect, useState } from 'react';
import { appKit } from '../lib/appkit';
import { useAuthStore } from '../lib/auth';

/**
 * AppkitDebugger - A component to help debug Appkit authentication issues
 *
 * This component displays the current state of Appkit authentication and
 * provides buttons to test various Appkit features.
 */
export function AppkitDebugger() {
  const [events, setEvents] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{isAuthenticated: boolean, email?: string, username?: string}>({ isAuthenticated: false });
  const [localStorageItems, setLocalStorageItems] = useState<{key: string, value: string}[]>([]);

  // Get auth state
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  // Log an event
  const logEvent = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setEvents(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Check connection status and auth status
  useEffect(() => {
    // Check auth status
    checkAuth();

    // Update auth status when it changes
    setAuthStatus({
      isAuthenticated,
      email: user?.email,
      username: user?.username
    });

    // Check connection status
    const checkConnection = async () => {
      try {
        // @ts-ignore - appKit might not have these properties
        const connected = appKit.isConnected?.() || false;
        setIsConnected(connected);

        // @ts-ignore - appKit might not have these properties
        const addr = appKit.getAddress?.() || null;
        setAddress(addr);

        logEvent(`Connection status checked: ${connected ? 'Connected' : 'Disconnected'}${addr ? ` to ${addr}` : ''}`);
      } catch (error) {
        console.error('Error checking connection:', error);
        logEvent(`Error checking connection: ${error}`);
      }
    };

    checkConnection();

    // Set up event listener for Appkit events
    const handleAppkitEvent = (event: any) => {
      const eventType = event.detail?.type || 'unknown';
      const eventData = JSON.stringify(event.detail?.data || {}).substring(0, 100);
      logEvent(`Appkit event: ${eventType} - ${eventData}`);
    };

    window.addEventListener('appkit:event', handleAppkitEvent);

    // Check localStorage items
    refreshLocalStorage();

    return () => {
      window.removeEventListener('appkit:event', handleAppkitEvent);
    };
  }, [isAuthenticated, user, checkAuth]);

  // Refresh localStorage items
  const refreshLocalStorage = () => {
    const items: {key: string, value: string}[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        // Only show relevant items
        if (key.includes('auth') || key.includes('wallet') || key.includes('appkit') || key.includes('wagmi')) {
          items.push({ key, value: value.length > 50 ? value.substring(0, 50) + '...' : value });
        }
      }
    }
    setLocalStorageItems(items);
  };

  // Connect wallet
  const handleConnect = async () => {
    try {
      logEvent('Attempting to connect wallet...');
      await appKit.connect();
      logEvent('Connect method called successfully');

      // Update connection status
      // @ts-ignore - appKit might not have these properties
      const connected = appKit.isConnected?.() || false;
      setIsConnected(connected);

      // @ts-ignore - appKit might not have these properties
      const addr = appKit.getAddress?.() || null;
      setAddress(addr);

      logEvent(`Connection status: ${connected ? 'Connected' : 'Disconnected'}${addr ? ` to ${addr}` : ''}`);
      refreshLocalStorage();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      logEvent(`Error connecting wallet: ${error}`);
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      logEvent('Attempting to disconnect wallet...');
      // @ts-ignore - appKit might not have disconnect method
      await appKit.disconnect?.();
      logEvent('Disconnect method called successfully');

      // Update connection status
      setIsConnected(false);
      setAddress(null);
      refreshLocalStorage();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      logEvent(`Error disconnecting wallet: ${error}`);
    }
  };

  // Clear local storage
  const handleClearStorage = () => {
    try {
      logEvent('Clearing Appkit-related localStorage items...');

      // Clear auth token
      localStorage.removeItem('auth_token');

      // Clear wallet address
      localStorage.removeItem('wallet_address');

      // Clear other potential Appkit storage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('appkit') || key.includes('wagmi') || key.includes('wallet'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      logEvent(`Cleared ${keysToRemove.length + 2} localStorage items`);
      refreshLocalStorage();

      // Force reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      logEvent(`Error clearing localStorage: ${error}`);
    }
  };

  // Force reload the page
  const handleForceReload = () => {
    logEvent('Forcing page reload...');
    window.location.reload();
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
      <h2 className="text-lg font-semibold mb-2">Appkit Debugger</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Wallet Connection Status */}
        <div className="p-3 border rounded bg-gray-100 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">Wallet Connection</h3>

          <div className="flex items-center mb-2">
            <span className="mr-2">Status:</span>
            <span className={`px-2 py-1 rounded text-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {address && (
            <div className="mb-2 text-xs font-mono break-all">
              Address: {address}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleConnect}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Connect
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="p-3 border rounded bg-gray-100 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">Authentication Status</h3>

          <div className="flex items-center mb-2">
            <span className="mr-2">Status:</span>
            <span className={`px-2 py-1 rounded text-white ${authStatus.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}>
              {authStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>

          {authStatus.email && (
            <div className="mb-1 text-xs">
              <span className="font-semibold">Email:</span> {authStatus.email}
            </div>
          )}

          {authStatus.username && (
            <div className="mb-2 text-xs">
              <span className="font-semibold">Username:</span> {authStatus.username}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => {
                checkAuth();
                logEvent('Checking authentication status...');
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Auth
            </button>
            <button
              onClick={handleForceReload}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>

      {/* LocalStorage Items */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">LocalStorage Items:</h3>
          <div className="flex space-x-2">
            <button
              onClick={refreshLocalStorage}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={handleClearStorage}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Storage
            </button>
          </div>
        </div>

        <div className="h-32 overflow-y-auto border rounded p-2 bg-gray-100 dark:bg-gray-900 font-mono text-xs">
          {localStorageItems.length === 0 ? (
            <div className="text-gray-500 italic">No relevant items found</div>
          ) : (
            localStorageItems.map((item, index) => (
              <div key={index} className="mb-1">
                <span className="font-semibold">{item.key}:</span> {item.value}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Log */}
      <div>
        <h3 className="font-semibold mb-1">Event Log:</h3>
        <div className="h-48 overflow-y-auto border rounded p-2 bg-gray-100 dark:bg-gray-900 font-mono text-xs">
          {events.length === 0 ? (
            <div className="text-gray-500 italic">No events logged yet</div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="mb-1">{event}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
