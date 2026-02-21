import { create } from 'zustand';
import { api } from './api';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
  token: string | null;
  walletAddress: string | null;
  username: string | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => void;
  syncWallet: (address: string) => Promise<void>;
  setUsername: (username: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  token: localStorage.getItem('auth_token'),
  walletAddress: localStorage.getItem('wallet_address'),
  username: null,
  isLoading: true, // Start with loading true

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({
        isAuthenticated: false,
        user: null,
        isAdmin: false,
        token: null,
        username: null,
        isLoading: false
      });
      return;
    }

    try {
      const { user } = await api.auth.verify(token);

      // Get wallet address from localStorage
      const walletAddress = localStorage.getItem('wallet_address');

      set({
        isAuthenticated: true,
        user,
        isAdmin: user.isAdmin,
        token,
        walletAddress: walletAddress,
        username: user.username || null,
        isLoading: false
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({
        isAuthenticated: false,
        user: null,
        isAdmin: false,
        token: null,
        walletAddress: null,
        username: null,
        isLoading: false
      });
    }
  },

  signIn: async (email: string, password: string) => {
    const { token, user } = await api.auth.login(email, password);
    localStorage.setItem('auth_token', token);

    // Get wallet address from localStorage
    const walletAddress = localStorage.getItem('wallet_address');

    console.log('signIn - User state:', {
      hasWallet: !!walletAddress,
      hasUsername: !!user.username,
      walletAddress,
      username: user.username
    });

    set({
      isAuthenticated: true,
      user,
      isAdmin: user.isAdmin,
      token,
      walletAddress: walletAddress,
      username: user.username || null
    });
  },

  signOut: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    set({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      token: null,
      walletAddress: null,
      username: null
    });
  },

  connectWallet: async (address: string) => {
    try {
      // Create or get user with wallet address
      const { token, user } = await api.auth.connectWallet(address);
      console.log('Wallet connected - API response:', { token: !!token, user });

      localStorage.setItem('auth_token', token);
      localStorage.setItem('wallet_address', address);

      const newState = {
        isAuthenticated: true,
        user,
        walletAddress: address,
        token,
        username: user.username || null
      };

      console.log('Setting auth state:', newState);
      set(newState);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  },

  disconnectWallet: () => {
    console.log('🔴 Disconnecting wallet - clearing all auth state');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_token');
    set({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      token: null,
      walletAddress: null,
      username: null,
      isLoading: false
    });
    console.log('🔴 Wallet disconnected - auth state cleared');
  },

  syncWallet: async (address: string) => {
    try {
      const result = await api.auth.syncWallet(address);
      localStorage.setItem('wallet_address', address);

      set((state) => ({
        ...state,
        walletAddress: address,
        user: result.user
      }));

      console.log('Wallet synced successfully:', address);
    } catch (error) {
      console.error('Failed to sync wallet:', error);
      throw error;
    }
  },

  setUsername: (username: string) => {
    set((state) => ({
      ...state,
      username,
      user: state.user ? { ...state.user, username, needsUsername: false } : null
    }));
  }
}));
