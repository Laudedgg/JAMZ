import React, { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuthStore } from '../lib/auth';
import { useAppKit } from '@reown/appkit/react';


interface CustomLoginButtonProps {
  className?: string;
}

/**
 * CustomLoginButton - A custom button that replaces the native Appkit button
 * Shows "Login" when disconnected and "Disconnect" when connected
 * Uses a gradient design that matches the site theme
 */
export function CustomLoginButton({ className = '' }: CustomLoginButtonProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { walletAddress, isAuthenticated, user, disconnectWallet } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Determine if the user is connected (check authentication state first, then wallet connection)
  const isUserConnected = isAuthenticated || isConnected || !!walletAddress;

  // Get the open function from useAppKit hook
  const { open } = useAppKit();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isUserConnected) {
        // If connected, disconnect the wallet
        console.log('🔴 [CustomLoginButton] Disconnecting wallet...');
        console.log('🔴 Current state:', { isConnected, walletAddress, isAuthenticated });

        // Disconnect from Wagmi first
        if (isConnected) {
          console.log('🔴 Calling Wagmi disconnect()...');
          disconnect();
        }

        // Disconnect from auth store (this clears everything)
        console.log('🔴 Calling disconnectWallet()...');
        disconnectWallet();

        console.log('🔴 Wallet disconnected successfully');
        setIsLoading(false);
      } else {
        // If not connected, open the connection modal
        console.log('🔵 [CustomLoginButton] Opening connection modal...');
        open();

        // Reset loading state after a short delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error with wallet action:', error);
      setIsLoading(false);
    }
  };

  // Base button classes
  const baseClasses = "px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-lg";

  // Gradient classes for connected/disconnected states
  const gradientClasses = isUserConnected
    ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white";

  // Loading state classes
  const loadingClasses = isLoading ? "opacity-80 cursor-wait" : "cursor-pointer";

  // Determine button text based on state
  const getButtonText = () => {
    if (isLoading) {
      return isUserConnected ? 'Disconnecting...' : 'Connecting...';
    }
    return isUserConnected ? 'Disconnect' : 'Login';
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClasses} ${gradientClasses} ${loadingClasses} ${className}`}
    >
      {getButtonText()}
    </button>
  );
}
