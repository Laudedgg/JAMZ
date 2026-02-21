import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useArtistAuthStore } from '../lib/artistAuth';
import { User, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Upload, X } from 'lucide-react';
import { StaticGridBackground } from '../components/StaticGridBackground';
import { SplineScene } from '../components/SplineScene';
import { Logo } from '../components/Logo';

export function ArtistRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    imageUrl: '',
    socialMedia: {
      instagram: '',
      twitter: '',
      tiktok: '',
      facebook: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Ref to prevent double submission when changing steps
  const isChangingStep = useRef(false);

  const navigate = useNavigate();
  const { login } = useArtistAuthStore();
  const totalSteps = 2;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('social.')) {
      const socialPlatform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialPlatform]: value
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

  const validateStep = (stepNumber: number): boolean => {
    setError(null);

    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        setError('Please enter your artist name');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      if (!formData.password) {
        setError('Please enter a password');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      // Set flag to prevent immediate form submission after step change
      isChangingStep.current = true;
      setStep(step + 1);
      // Reset flag after a short delay to allow the new step to render
      setTimeout(() => {
        isChangingStep.current = false;
      }, 300);
    }
  };

  const prevStep = () => {
    setError(null);
    isChangingStep.current = true;
    setStep(step - 1);
    setTimeout(() => {
      isChangingStep.current = false;
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if we just changed steps
    if (isChangingStep.current) {
      return;
    }

    // If we're on step 1, go to step 2 instead of submitting
    if (step === 1) {
      nextStep();
      return;
    }

    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let imageUrl = formData.imageUrl;

      // If user selected a file to upload, upload it first (using public endpoint)
      if (selectedFile) {
        try {
          const uploadResponse = await api.artistAuth.uploadRegistrationImage(selectedFile);
          imageUrl = uploadResponse.imageUrl;
        } catch (uploadError: any) {
          setError(`Image upload failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }
      }

      const response = await api.artistAuth.selfRegister(
        formData.email,
        formData.password,
        formData.name,
        imageUrl,
        formData.socialMedia
      );

      // Auto-login with the returned token
      if (response.token && response.artist) {
        login(response.token, response.artist);
        setSuccess('Welcome to JAMZ! Redirecting to your dashboard...');

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/artist/dashboard');
        }, 1500);
      } else {
        // Fallback to login page if no token returned
        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => {
          navigate('/artist/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-70">
          <SplineScene />
        </div>
        <StaticGridBackground />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo above card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-4"
        >
          <Link to="/">
            <Logo className="w-28 h-28" />
          </Link>
        </motion.div>

        {/* Success State */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
              <p className="text-white/60">{success}</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/90 backdrop-blur-xl rounded-3xl overflow-hidden relative"
            >
              {/* Close button */}
              <Link to="/" className="absolute top-4 right-4 text-white/40 hover:text-white p-1 z-10">
                <X className="w-5 h-5" />
              </Link>

              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold text-white">
                    {step === 1 ? 'Create Account' : 'Almost Done'}
                  </h1>
                  {step === 2 && (
                    <p className="text-white/50 text-sm mt-1">
                      Add your profile details (optional)
                    </p>
                  )}
                </div>

                {/* Step Indicator */}
                <div className="flex gap-2 mt-4">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        s <= step
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6"
                  >
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 pt-4">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Artist Name */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Artist / Stage Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your artist name"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="you@example.com"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Min 8 characters"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Re-enter password"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Profile Photo Upload */}
                      <div className="flex flex-col items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer group"
                        >
                          <div className={`w-32 h-32 rounded-full border-2 border-dashed transition-all flex items-center justify-center overflow-hidden ${
                            filePreview
                              ? 'border-purple-500'
                              : 'border-white/20 group-hover:border-purple-500/50'
                          }`}>
                            {filePreview ? (
                              <img
                                src={filePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
                                <span className="text-xs text-white/40">Upload photo</span>
                              </div>
                            )}
                          </div>
                          {filePreview && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                clearFile();
                              }}
                              className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </label>
                        <p className="text-white/40 text-xs mt-3">
                          PNG, JPG up to 5MB • You can skip this
                        </p>
                      </div>

                      {/* Social Media Links */}
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        <label className="block text-sm font-medium text-white/70">
                          Social Media (optional)
                        </label>
                        <input
                          type="text"
                          name="social.instagram"
                          value={formData.socialMedia.instagram}
                          onChange={handleInputChange}
                          placeholder="Instagram @username"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                          disabled={loading}
                        />
                        <input
                          type="text"
                          name="social.twitter"
                          value={formData.socialMedia.twitter}
                          onChange={handleInputChange}
                          placeholder="Twitter/X @username"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                          disabled={loading}
                        />
                        <input
                          type="text"
                          name="social.tiktok"
                          value={formData.socialMedia.tiktok}
                          onChange={handleInputChange}
                          placeholder="TikTok @username"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                          disabled={loading}
                        />
                        <input
                          type="text"
                          name="social.facebook"
                          value={formData.socialMedia.facebook}
                          onChange={handleInputChange}
                          placeholder="Facebook page URL"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
                      disabled={loading}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}

                  {step < totalSteps ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Create Account
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Skip step 2 option */}
                {step === 2 && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </form>

              {/* Footer */}
              <div className="px-6 pb-6 text-center">
                <p className="text-white/40 text-sm">
                  Already have an account?{' '}
                  <Link to="/artist/login" className="text-purple-400 hover:text-purple-300">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ArtistRegister;
