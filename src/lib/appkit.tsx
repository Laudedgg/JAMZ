import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider, useAccount } from 'wagmi'
import { mainnet, arbitrum, bsc } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { useAuthStore } from './auth'
import type { Chain } from 'viem'
import { useEffect } from 'react'
import { api } from './api'

// Setup queryClient
const queryClient = new QueryClient()

// Project ID from Reown Cloud
const projectId = '9f0f92c6eda50521e65a6b55c58345a9'

// Create metadata object
const metadata = {
  name: 'Jamz',
  description: 'Music creation and monetization platform',
  url: window.location.origin,
  icons: ['/jamzfunl.png']
}

// Set networks
const networks = [mainnet, arbitrum, bsc] as [Chain, Chain, Chain]

// Create Wagmi Adapter with enhanced configuration for persistence
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  walletConnectProjectId: projectId,
  showBalance: true,
  showAddress: true,
  autoConnect: true,
  persistence: {
    enabled: true,
    storage: 'localStorage'
  }
})

// Create AppKit instance with all required functionality
export const appKitInstance = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, bsc],
  metadata,
  features: {
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
    emailShowWallets: true,
    analytics: true,
    persistence: {
      enabled: true,
      storage: 'localStorage'
    },
    signatureCache: true,
    connection: {
      autoConnect: true,
      reconnect: true,
      persistentSessions: true,
      sessionExpiry: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      reconnectOnRefresh: true
    }
  },
  sessionPersistence: {
    enabled: true,
    persistSignatures: true,
    expiry: 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
  },
  allWallets: 'SHOW' // default to SHOW
})

// Global state to track AppKit modal status
let isAppKitModalOpen = false;

// Create enhanced appKit object
export const appKit = {
  ...appKitInstance,
  connect: async () => {
    const connection = await appKitInstance.connect();
    // Wait for provider to be ready
    if (!appKitInstance.provider) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return connection;
  },
  isModalOpen: () => isAppKitModalOpen
}

// Function to check if AppKit modal is open
export const getAppKitModalStatus = () => isAppKitModalOpen;

// Set up AppKit modal state tracking
if (typeof window !== 'undefined') {
  // Watch for AppKit modal changes using MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check for AppKit modal elements
        const appkitModal = document.querySelector('w3m-modal, appkit-modal');
        if (appkitModal) {
          const wasOpen = isAppKitModalOpen;
          const isOpen = appkitModal.classList.contains('open') ||
                        appkitModal.hasAttribute('open') ||
                        window.getComputedStyle(appkitModal).display !== 'none';

          if (isOpen !== wasOpen) {
            isAppKitModalOpen = isOpen;
            console.log('AppKit modal state changed:', isOpen ? 'opened' : 'closed');
          }
        }
      }

      // Also check for class changes on existing modals
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement;
        if (target.tagName === 'W3M-MODAL' || target.tagName === 'APPKIT-MODAL') {
          const wasOpen = isAppKitModalOpen;
          const isOpen = target.classList.contains('open') ||
                        target.hasAttribute('open') ||
                        window.getComputedStyle(target).display !== 'none';

          if (isOpen !== wasOpen) {
            isAppKitModalOpen = isOpen;
            console.log('AppKit modal state changed:', isOpen ? 'opened' : 'closed');
          }
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'open', 'style']
  });
}

// Auth connection handler component
function AuthHandler() {
  const { address, isConnected } = useAccount()
  const { connectWallet, disconnectWallet, signIn, walletAddress } = useAuthStore()

  useEffect(() => {
    // On mount, check if we have a stored wallet address and restore it
    const storedWalletAddress = localStorage.getItem('wallet_address');
    if (storedWalletAddress && !walletAddress && !isConnected) {
      console.log('Restoring wallet connection from localStorage:', storedWalletAddress);
      // Restore the wallet address in auth store
      connectWallet(storedWalletAddress).catch((error) => {
        console.error('Failed to restore wallet connection:', error);
      });
    }
  }, []); // Run only once on mount

  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected:', address)
      // First try to sync wallet for existing authenticated users
      const token = localStorage.getItem('auth_token');
      if (token) {
        // User is already authenticated, sync wallet address
        api.auth.syncWallet(address).then(() => {
          console.log('Wallet address synced for authenticated user');
          connectWallet(address);
        }).catch((error) => {
          console.error('Failed to sync wallet, falling back to connect:', error);
          connectWallet(address);
        });
      } else {
        // User not authenticated, use normal connect flow
        connectWallet(address);
      }
    } else if (!isConnected && walletAddress) {
      console.log('Wallet disconnected but we have a stored address, keeping it')
      // Don't disconnect if we have a stored wallet address
    } else if (!isConnected && !walletAddress) {
      console.log('Wallet disconnected')
      disconnectWallet()
    }

    // Listen for Appkit auth events
    const handleAppkitAuth = async (event: any) => {
      console.log('🔔 Appkit event received:', event.detail?.type, event);

      // Handle all types of Appkit events
      if (event.detail?.type) {
        // Log all event types for debugging
        console.log(`🔔 Appkit ${event.detail.type} event:`, event.detail);

        // Handle auth events
        if (event.detail.type === 'auth' && event.detail?.data) {
          // Extract all possible data from the event
          const { email, provider, address, wallet } = event.detail.data;
          console.log('Appkit auth data:', {
            email,
            provider,
            address,
            wallet,
            fullData: JSON.stringify(event.detail.data)
          });

          // Close any open Appkit modal
          try {
            // @ts-ignore - appKit might not have closeModal method
            if (appKit.closeModal) {
              appKit.closeModal();
            }
          } catch (e) {
            console.log('Could not close modal:', e);
          }

          // If we have an email, proceed with email-based auth
          if (email) {
            console.log('✅ Appkit login successful with email:', email, 'Provider:', provider);

            try {
              // Call our backend to authenticate the user
              console.log('📤 Sending authentication request to backend...');
              const response = await fetch('/api/auth/appkit-auth', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email,
                  provider,
                  address: address || null, // Include address if available
                  wallet: wallet || null     // Include wallet if available
                })
              });

              console.log('📥 Backend response status:', response.status);

              if (!response.ok) {
                let errorMessage = 'Authentication failed';
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorMessage;
                  console.error('❌ Backend error response:', errorData);
                } catch (e) {
                  const errorText = await response.text();
                  errorMessage = errorText || errorMessage;
                  console.error('❌ Backend error text:', errorText);
                }
                console.error('❌ Authentication failed:', errorMessage);
                throw new Error(errorMessage);
              }

              const data = await response.json();
              console.log('✅ Authentication successful, received data:', {
                token: data.token ? '✓ Present' : '✗ Missing',
                user: data.user ? {
                  id: data.user.id,
                  email: data.user.email,
                  username: data.user.username,
                  needsUsername: data.user.needsUsername,
                  onboardingCompleted: data.user.onboardingCompleted
                } : '✗ Missing'
              });

              // Store the token and update auth state directly
              localStorage.setItem('auth_token', data.token);

              // Store wallet address if provided
              if (data.user.walletAddress) {
                localStorage.setItem('wallet_address', data.user.walletAddress);
              }

              // Update auth store state directly instead of calling signIn
              useAuthStore.setState({
                isAuthenticated: true,
                user: data.user,
                isAdmin: data.user.isAdmin || false,
                token: data.token,
                walletAddress: data.user.walletAddress || null,
                username: data.user.username || null,
                isLoading: false
              });

              console.log('✅ User signed in successfully via Google/Social login');
              console.log('Auth state updated:', {
                isAuthenticated: true,
                hasUser: !!data.user,
                username: data.user.username,
                walletAddress: data.user.walletAddress
              });

              // Reload the page to ensure all components recognize the authenticated state
              console.log('🔄 Reloading page to refresh auth state...');
              window.location.reload();
            } catch (error) {
              console.error('❌ Failed to authenticate with backend:', error);
              // Show error to user
              alert(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else if (address) {
            // If we have an address but no email, handle wallet connection
            console.log('Appkit login with wallet address:', address);
            try {
              connectWallet(address);
            } catch (error) {
              console.error('Failed to connect wallet:', error);
            }
          } else {
            console.warn('Appkit auth event received but no email or address found');
          }
        }

        // Handle connection events
        if (event.detail.type === 'connect' && event.detail?.data?.address) {
          const { address } = event.detail.data;
          console.log('Appkit connect event with address:', address);
          try {
            connectWallet(address);
          } catch (error) {
            console.error('Failed to connect wallet from connect event:', error);
          }
        }

        // Handle success events (for email signup completion)
        if (event.detail.type === 'success' && event.detail?.data) {
          console.log('Appkit success event:', event.detail.data);
          // This might contain email data after email signup
          const { email, provider } = event.detail.data;
          if (email) {
            console.log('Email signup success detected:', email);
            // Trigger auth flow
            try {
              const response = await fetch('/api/auth/appkit-auth', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email,
                  provider: provider || 'email'
                })
              });

              if (response.ok) {
                const data = await response.json();
                localStorage.setItem('auth_token', data.token);

                // Store wallet address if provided
                if (data.user.walletAddress) {
                  localStorage.setItem('wallet_address', data.user.walletAddress);
                }

                // Update auth store state directly
                useAuthStore.setState({
                  isAuthenticated: true,
                  user: data.user,
                  isAdmin: data.user.isAdmin || false,
                  token: data.token,
                  walletAddress: data.user.walletAddress || null,
                  username: data.user.username || null,
                  isLoading: false
                });

                console.log('✅ Email signup success - auth state updated');
                window.location.reload();
              }
            } catch (error) {
              console.error('Failed to process email signup success:', error);
            }
          }
        }
      }
    };

    console.log('👂 Adding Appkit event listener');

    // Listen for both old and new event formats
    window.addEventListener('appkit:event', handleAppkitAuth);
    window.addEventListener('w3m:event', handleAppkitAuth); // Legacy WalletConnect event

    // Also subscribe to AppKit modal events directly
    const unsubscribe = appKitInstance.subscribeEvents((event: any) => {
      console.log('🔔 AppKit subscribed event:', event);
      handleAppkitAuth({ detail: event });
    });

    return () => {
      console.log('🔇 Removing Appkit event listeners');
      window.removeEventListener('appkit:event', handleAppkitAuth);
      window.removeEventListener('w3m:event', handleAppkitAuth);
      if (unsubscribe) unsubscribe();
    };
  }, [isConnected, address, connectWallet, disconnectWallet, signIn])

  return null
}

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthHandler />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Connect Button Component
export function ConnectButton() {
  return <appkit-button />
}
