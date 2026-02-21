import React, { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { appKit } from '../lib/appkit';
import { useAuthStore } from '../lib/auth';

/**
 * CustomConnectButton - A custom button that replaces the native Appkit button
 * Shows "Login" when disconnected and "Disconnect" when connected
 */
export function CustomConnectButton() {
  const { address, isConnected } = useAccount();
  const { walletAddress } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const appkitButtonRef = useRef<HTMLElement | null>(null);

  // Determine if the user is connected (either through Wagmi or our auth store)
  const isUserConnected = isConnected || !!walletAddress;

  // Create a hidden appkit-button element to use its functionality
  useEffect(() => {
    // Create the appkit-button element if it doesn't exist
    if (!appkitButtonRef.current) {
      const button = document.createElement('appkit-button');
      button.style.display = 'none'; // Hide the button
      document.body.appendChild(button);
      appkitButtonRef.current = button;
    }

    // Clean up when component unmounts
    return () => {
      if (appkitButtonRef.current) {
        document.body.removeChild(appkitButtonRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // Use the hidden appkit-button to trigger the connect flow
      if (appkitButtonRef.current) {
        appkitButtonRef.current.click();
      } else {
        // Fallback to using the appKit object directly
        await appKit.connect();
      }
    } catch (error) {
      console.error('Error connecting with Appkit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="px-4 py-2 bg-[#111111] text-white font-medium text-sm rounded-full border border-[#222222] hover:bg-[#222222] transition-colors disabled:opacity-50"
    >
      {isLoading ? 'Loading...' : isUserConnected ? 'Disconnect' : 'Login'}
    </button>
  );
}
