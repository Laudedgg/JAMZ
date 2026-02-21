import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SocialMedia {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
}

interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  email?: string;
  socialMedia?: SocialMedia;
}

interface ArtistAuthState {
  isAuthenticated: boolean;
  token: string | null;
  artist: Artist | null;
  login: (token: string, artist: Artist) => void;
  logout: () => void;
  updateArtist: (updates: Partial<Artist>) => void;
}

export const useArtistAuthStore = create<ArtistAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      artist: null,

      login: (token, artist) => set({
        isAuthenticated: true,
        token,
        artist
      }),

      logout: () => set({
        isAuthenticated: false,
        token: null,
        artist: null
      }),

      updateArtist: (updates) => set((state) => ({
        artist: state.artist ? { ...state.artist, ...updates } : null
      })),
    }),
    {
      name: 'artist-auth-storage',
    }
  )
);
