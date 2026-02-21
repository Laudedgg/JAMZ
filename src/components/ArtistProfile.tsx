import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Image, Save, AlertCircle, CheckCircle, Lock, Upload, Link as LinkIcon, X } from 'lucide-react';
import { api } from '../lib/api';
import { useArtistAuthStore } from '../lib/artistAuth';
import { ArtistPasswordChange } from './ArtistPasswordChange';

interface ArtistProfileData {
  id: string;
  name: string;
  imageUrl?: string;
  email: string;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
}

export function ArtistProfile() {
  const [profileData, setProfileData] = useState<ArtistProfileData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    socialMedia: {
      instagram: '',
      tiktok: '',
      twitter: '',
      facebook: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const { artist, updateArtist } = useArtistAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await api.artistAuth.getProfile();
      setProfileData(profile);
      setFormData({
        name: profile.name,
        imageUrl: profile.imageUrl || '',
        socialMedia: profile.socialMedia || {
          instagram: '',
          tiktok: '',
          twitter: '',
          facebook: ''
        }
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setError(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Artist name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let imageUrl = formData.imageUrl;

      // If user selected a file to upload, upload it first
      if (selectedFile && imageUploadMode === 'upload') {
        try {
          const uploadResponse = await api.artistAuth.uploadImage(selectedFile);
          imageUrl = uploadResponse.imageUrl;
        } catch (uploadError: any) {
          setError(`Image upload failed: ${uploadError.message}`);
          setSaving(false);
          return;
        }
      }

      const updatedProfile = await api.artistAuth.updateProfile({
        name: formData.name,
        imageUrl: imageUrl,
        socialMedia: formData.socialMedia
      });

      // Update the global store with new profile data
      updateArtist({
        name: updatedProfile.name,
        imageUrl: updatedProfile.imageUrl,
        email: updatedProfile.email,
        socialMedia: updatedProfile.socialMedia
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Clear file selection after successful upload
      if (selectedFile) {
        clearFile();
      }

      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Artist Profile</h2>
          <button
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors text-purple-400"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Artist Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profileData?.email || ''}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/60"
              disabled
            />
            <p className="text-xs text-white/40 mt-1">Contact admin for email changes</p>
          </div>

          {/* Profile Image Section */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-3">
              Profile Image
            </label>

            {/* Upload Mode Toggle */}
            <div className="flex space-x-2 mb-3">
              <button
                type="button"
                onClick={() => setImageUploadMode('url')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageUploadMode === 'url'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:bg-white/5'
                }`}
                disabled={saving}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setImageUploadMode('upload')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageUploadMode === 'upload'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:bg-white/5'
                }`}
                disabled={saving}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
            </div>

            {/* URL Input */}
            {imageUploadMode === 'url' && (
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                placeholder="https://example.com/image.jpg"
                disabled={saving}
              />
            )}

            {/* File Upload */}
            {imageUploadMode === 'upload' && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="profile-image-upload"
                  disabled={saving}
                />
                <label
                  htmlFor="profile-image-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  {filePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          clearFile();
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        disabled={saving}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-white/40 mb-2" />
                      <span className="text-sm text-white/60">Click to upload image</span>
                      <span className="text-xs text-white/40">PNG, JPG, GIF up to 5MB</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Social Media Section */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-lg font-semibold text-white mb-3">Social Media Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Instagram Username
                </label>
                <input
                  type="text"
                  name="social.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                  placeholder="@username"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  TikTok Username
                </label>
                <input
                  type="text"
                  name="social.tiktok"
                  value={formData.socialMedia.tiktok}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                  placeholder="@username"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  X (Twitter) Username
                </label>
                <input
                  type="text"
                  name="social.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                  placeholder="@username"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Facebook Page/Username
                </label>
                <input
                  type="text"
                  name="social.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                  placeholder="username or page name"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showPasswordChange && (
          <ArtistPasswordChange onClose={() => setShowPasswordChange(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
