import { create } from 'zustand';

interface SpotifyState {
  player: Spotify.Player | null;
  deviceId: string | null;
  currentTrack: Spotify.Track | null;
  isPlaying: boolean;
  volume: number;
  position: number;
  duration: number;
  error: string | null;
  accessToken: string | null;
  initializePlayer: (token: string) => Promise<void>;
  setPlayer: (player: Spotify.Player) => void;
  setCurrentTrack: (track: Spotify.Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setError: (error: string | null) => void;
  playTrack: (trackUri: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  adjustVolume: (volume: number) => Promise<void>;
}

export const useSpotifyStore = create<SpotifyState>((set, get) => ({
  player: null,
  deviceId: null,
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  position: 0,
  duration: 0,
  error: null,
  accessToken: null,

  initializePlayer: async (token: string) => {
    try {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Jamz.fun Web Player',
          getOAuthToken: cb => { cb(token); },
          volume: get().volume
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          set({ deviceId: device_id });
        });

        player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
        });

        player.addListener('player_state_changed', (state) => {
          if (!state) return;

          set({
            currentTrack: state.track_window.current_track,
            isPlaying: !state.paused,
            position: state.position,
            duration: state.duration,
          });
        });

        player.connect();
        set({ player, accessToken: token });
      };
    } catch (error) {
      set({ error: 'Failed to initialize Spotify player' });
    }
  },

  setPlayer: (player) => set({ player }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setError: (error) => set({ error }),

  playTrack: async (trackUri: string) => {
    const { player, deviceId, accessToken } = get();
    if (!player || !deviceId || !accessToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      set({ error: 'Failed to play track' });
    }
  },

  togglePlay: async () => {
    const { player, isPlaying } = get();
    if (!player) return;

    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.resume();
      }
      set({ isPlaying: !isPlaying });
    } catch (error) {
      set({ error: 'Failed to toggle playback' });
    }
  },

  seekTo: async (position: number) => {
    const { player } = get();
    if (!player) return;

    try {
      await player.seek(position);
      set({ position });
    } catch (error) {
      set({ error: 'Failed to seek' });
    }
  },

  adjustVolume: async (volume: number) => {
    const { player } = get();
    if (!player) return;

    try {
      await player.setVolume(volume);
      set({ volume });
    } catch (error) {
      set({ error: 'Failed to adjust volume' });
    }
  },
}));