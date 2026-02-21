import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Plus, Edit, Trash2, Play, Pause, Music, X, CheckCircle2, Upload, Clock, GripVertical, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, Track } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { AdminNav } from './AdminDashboard';
import { getMediaUrl } from '../lib/mediaUtils';
import { SpotifyIcon } from '../components/SpotifyIcon';
import { BulkYouTubeImport } from '../components/BulkYouTubeImport';

// Apple Music Icon Component
const AppleMusicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.14H5.864c-.525.005-1.046.047-1.563.14-.674.121-1.304.353-1.878.727-1.118.733-1.863 1.732-2.18 3.043-.175.72-.24 1.452-.24 2.19v11.751c0 .738.065 1.47.24 2.189.317 1.312 1.062 2.312 2.18 3.044.574.374 1.204.606 1.878.727.517.093 1.038.135 1.563.14h12.872c.526-.005 1.047-.047 1.564-.14.673-.121 1.303-.353 1.577-.727 1.118-.732 1.863-1.732 2.18-3.044.175-.719.24-1.451.24-2.189V6.124zM8.5 18.909c-3.22 0-5.836-2.616-5.836-5.836 0-3.22 2.616-5.836 5.836-5.836.711 0 1.388.127 2.016.36v8.062c0 .711-.578 1.289-1.289 1.289-.711 0-1.289-.578-1.289-1.289V9.545c-.711-.36-1.516-.578-2.374-.578-2.374 0-4.297 1.923-4.297 4.297s1.923 4.297 4.297 4.297c.578 0 1.127-.116 1.627-.324.5-.208.962-.516 1.35-.904.388-.388.696-.85.904-1.35.208-.5.324-1.049.324-1.627V5.273c0-.711.578-1.289 1.289-1.289s1.289.578 1.289 1.289v8.8c0 3.22-2.616 5.836-5.836 5.836z"/>
  </svg>
);

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export function TracksManagement() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchTracks();
  }, [isAuthenticated, isAdmin, navigate]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuthError = async (error: any) => {
    if (error.message?.includes('JWT')) {
      await signOut();
      navigate('/admin/login');
    }
  };

  const fetchTracks = async () => {
    try {
      const data = await api.tracks.list();
      setTracks(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching tracks:', err);
      setError(err.message || 'Failed to load tracks');
      await handleAuthError(err);
    }
  };

  const handleReorderTracks = async (reorderedTracks: Track[]) => {
    setTracks(reorderedTracks);
  };

  const saveTrackOrder = async () => {
    try {
      setIsSavingOrder(true);
      const trackOrders = tracks.map((track, index) => ({
        _id: track._id,
        order: index
      }));

      const updatedTracks = await api.tracks.reorder(trackOrders);
      setTracks(updatedTracks);
      setIsReordering(false);
      showNotification('success', 'Track order saved successfully!');
    } catch (err: any) {
      console.error('Error saving track order:', err);
      setError(err.message || 'Failed to save track order');
      await handleAuthError(err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const togglePlay = (trackId: string, audioUrl: string) => {
    if (playingTrack === trackId) {
      // Pause the currently playing track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrack(null);
    } else {
      // Play the selected track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(getMediaUrl(audioUrl));
      audioRef.current.play();
      setPlayingTrack(trackId);

      // Add event listener to handle when audio ends
      audioRef.current.addEventListener('ended', () => {
        setPlayingTrack(null);
      });
    }
  };

  // Clean up audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  interface TrackFormProps {
    track: Track | null;
    onClose: () => void;
  }

  const TrackForm = ({ track = null, onClose }: TrackFormProps) => {
    const [title, setTitle] = useState(track?.title || '');
    const [artist, setArtist] = useState(track?.artist || '');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [duration, setDuration] = useState(track?.duration || 0);
    const [spotifyUrl, setSpotifyUrl] = useState(track?.spotifyUrl || '');
    const [spotifyPreviewUrl, setSpotifyPreviewUrl] = useState(track?.spotifyPreviewUrl || '');
    const [appleMusicUrl, setAppleMusicUrl] = useState(track?.appleMusicUrl || '');
    const [appleMusicPreviewUrl, setAppleMusicPreviewUrl] = useState(track?.appleMusicPreviewUrl || '');
    const [youtubeUrl, setYoutubeUrl] = useState(track?.youtubeUrl || '');
    const [isActive, setIsActive] = useState(track?.isActive !== false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(track ? getMediaUrl(track.coverImage) : null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setCoverImage(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (event) => {
          setCoverPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setAudioFile(file);

        // Get audio duration
        const audio = new Audio();
        audio.onloadedmetadata = () => {
          setDuration(Math.round(audio.duration));
        };
        audio.src = URL.createObjectURL(file);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFormError(null);

      try {
        // Validate that at least one media source is provided
        const hasAudioFile = !!audioFile;
        const hasSpotifyUrl = spotifyUrl.trim().length > 0;
        const hasSpotifyPreview = spotifyPreviewUrl.trim().length > 0;
        const hasAppleMusicUrl = appleMusicUrl.trim().length > 0;
        const hasAppleMusicPreview = appleMusicPreviewUrl.trim().length > 0;
        const hasYoutubeUrl = youtubeUrl.trim().length > 0;

        if (!hasAudioFile && !hasSpotifyUrl && !hasSpotifyPreview && !hasAppleMusicUrl && !hasAppleMusicPreview && !hasYoutubeUrl) {
          throw new Error('At least one media source is required: audio file, Spotify URL, Apple Music URL, or YouTube URL');
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('isActive', String(isActive));
        formData.append('duration', String(duration));
        formData.append('spotifyUrl', spotifyUrl);
        formData.append('spotifyPreviewUrl', spotifyPreviewUrl);
        formData.append('appleMusicUrl', appleMusicUrl);
        formData.append('appleMusicPreviewUrl', appleMusicPreviewUrl);
        formData.append('youtubeUrl', youtubeUrl);

        if (coverImage) {
          formData.append('coverImage', coverImage);
        }

        if (audioFile) {
          formData.append('audioFile', audioFile);
        }

        if (track) {
          // Update existing track
          await api.tracks.update(track._id, formData);
          showNotification('success', 'Track successfully updated!');
        } else {
          // Create new track
          await api.tracks.create(formData);
          showNotification('success', 'Track successfully created!');
        }

        await fetchTracks();
        onClose();
      } catch (err: any) {
        console.error('Error saving track:', err);
        setFormError(err.message || 'Failed to save track');
        await handleAuthError(err);
      } finally {
        setSubmitting(false);
      }
    };

    const formatDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-lg w-full p-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold gradient-text">
              {track ? 'Edit Track' : 'New Track'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Track Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Artist
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Spotify URL
                </label>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://open.spotify.com/track/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Spotify Preview URL
                </label>
                <input
                  type="url"
                  value={spotifyPreviewUrl}
                  onChange={(e) => setSpotifyPreviewUrl(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://p.scdn.co/mp3-preview/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Apple Music URL
                </label>
                <input
                  type="url"
                  value={appleMusicUrl}
                  onChange={(e) => setAppleMusicUrl(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://music.apple.com/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Apple Music Preview URL
                </label>
                <input
                  type="url"
                  value={appleMusicPreviewUrl}
                  onChange={(e) => setAppleMusicPreviewUrl(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://audio-ssl.itunes.apple.com/..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Cover Image <span className="text-white/40">(Optional)</span>
                </label>
                <div className="flex flex-col items-center">
                  {coverPreview ? (
                    <div className="relative mb-2">
                      <img
                        src={coverPreview}
                        alt="Cover Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview(null);
                          setCoverImage(null);
                          if (imageInputRef.current) {
                            imageInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-32 h-32 bg-black/30 border border-white/10 rounded-lg flex items-center justify-center mb-2"
                    >
                      <Upload className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 py-1 text-sm glass-button"
                    disabled={submitting}
                  >
                    {coverPreview ? 'Change Image' : 'Upload Image'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Audio File <span className="text-white/40">(Optional)</span>
                </label>
                <div className="flex flex-col items-center">
                  <div
                    className="w-32 h-32 bg-black/30 border border-white/10 rounded-lg flex flex-col items-center justify-center mb-2"
                  >
                    {audioFile || track?.audioFile ? (
                      <>
                        <Music className="w-8 h-8 text-[#6600FF]" />
                        <div className="mt-2 text-xs text-white/60 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(duration)}
                        </div>
                      </>
                    ) : (
                      <Upload className="w-8 h-8 text-white/40" />
                    )}
                  </div>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    className="hidden"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="px-3 py-1 text-sm glass-button"
                    disabled={submitting}
                  >
                    {audioFile || track?.audioFile ? 'Change Audio' : 'Upload Audio'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only"
                  disabled={submitting}
                />
                <div className={`w-8 h-5 rounded-full transition-colors ${
                  isActive ? 'bg-[#6600FF]' : 'bg-gray-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${
                    isActive ? 'translate-x-4' : 'translate-x-1'
                  }`} />
                </div>
                <span className="ml-2 text-xs text-white/60">Active Track</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 text-sm glass-button"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm glass-button-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : track ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
            <p className="text-white/60 mb-8">Please log in as an admin to manage tracks.</p>
            <button
              onClick={() => navigate('/admin/login')}
              className="glass-button-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminNav />

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Track Management</h1>
          <div className="flex space-x-3">
            {isReordering ? (
              <>
                <button
                  onClick={saveTrackOrder}
                  className="glass-button-success"
                  disabled={isSavingOrder}
                >
                  {isSavingOrder ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Save Order
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsReordering(false)}
                  className="glass-button-secondary"
                  disabled={isSavingOrder}
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsReordering(true)}
                  className="glass-button-secondary"
                >
                  <GripVertical className="w-5 h-5" />
                  Arrange Tracks
                </button>
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="glass-button-secondary"
                >
                  <Youtube className="w-5 h-5" />
                  Bulk Import
                </button>
                <button
                  onClick={() => {
                    setCurrentTrack(null);
                    setShowForm(true);
                  }}
                  className="glass-button-primary"
                >
                  <Plus className="w-5 h-5" />
                  New Track
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {isReordering ? (
          <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Drag and drop tracks to reorder them. Click "Save Order" when you're done.
            </p>
          </div>
        ) : null}

        {isReordering ? (
          <Reorder.Group axis="y" values={tracks} onReorder={handleReorderTracks} className="space-y-4">
            {tracks.map((track) => (
              <Reorder.Item
                key={track._id}
                value={track}
                className="glass-card overflow-hidden reorder-item"
              >
                <div className="flex items-center p-4">
                  <GripVertical className="h-6 w-6 mr-4 text-gray-400" />
                  <div className="w-16 h-16 rounded overflow-hidden mr-4 flex-shrink-0">
                    <img
                      src={getMediaUrl(track.coverImage)}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                    <p className="text-gray-400">{track.artist}</p>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white/60">
                No tracks available. Add your first track!
              </div>
            ) : (
              tracks.map((track) => (
                <motion.div
                  key={track._id}
                  className="glass-card overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                <div className="relative aspect-square">
                  <img
                    src={getMediaUrl(track.coverImage)}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        className="glass-button-primary w-12 h-12 rounded-full flex items-center justify-center"
                        onClick={() => togglePlay(track._id, track.audioFile)}
                      >
                        {playingTrack === track._id ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold">{track.title}</h3>
                      <p className="text-white/60 text-sm">{track.artist}</p>
                    </div>
                    {!track.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-600/20 text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-white/60 text-xs flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(track.duration)}
                    </div>
                    <div className="flex items-center gap-2">
                      {track.spotifyUrl && (
                        <button
                          onClick={() => window.open(track.spotifyUrl, '_blank')}
                          className="p-2 hover:bg-green-500/20 rounded-lg transition-colors text-green-400"
                          title="Open on Spotify"
                        >
                          <SpotifyIcon className="w-4 h-4" />
                        </button>
                      )}
                      {track.appleMusicUrl && (
                        <button
                          onClick={() => window.open(track.appleMusicUrl, '_blank')}
                          className="p-2 hover:bg-gray-500/20 rounded-lg transition-colors text-gray-400"
                          title="Open on Apple Music"
                        >
                          <AppleMusicIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCurrentTrack(track);
                          setShowForm(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this track?')) {
                            try {
                              await api.tracks.delete(track._id);
                              await fetchTracks();
                              showNotification('success', 'Track successfully deleted!');
                            } catch (err: any) {
                              console.error('Error deleting track:', err);
                              showNotification('error', err.message || 'Failed to delete track');
                              await handleAuthError(err);
                            }
                          }
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {showForm && (
        <TrackForm
          track={currentTrack}
          onClose={() => {
            setShowForm(false);
            setCurrentTrack(null);
          }}
        />
      )}

      {showBulkImport && (
        <BulkYouTubeImport
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            showNotification('success', 'Tracks successfully imported!');
            fetchTracks();
          }}
        />
      )}
    </div>
  );
}
