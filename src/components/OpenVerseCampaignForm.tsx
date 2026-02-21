import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Plus, Trash2, DollarSign, Zap, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface OpenVerseCampaign {
  _id: string;
  title: string;
  description: string;
  thumbnailImage: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  artistId?: string;
  prerequisites?: {
    requireShareAction: boolean;
  };
  prizePool: {
    amount: number;
    currency: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
  };
  maxParticipants: number;
  maxWinners: number;
  startDate: string;
  endDate: string;
  allowedPlatforms: string[];
  submissionGuidelines: string;
  prizeDistribution: Array<{
    rank: number;
    amount: number;
  }>;
}

interface CampaignFormProps {
  campaign?: OpenVerseCampaign | null;
  onClose: () => void;
  onSave: (campaign: OpenVerseCampaign) => void;
}

export function OpenVerseCampaignForm({ campaign, onClose, onSave }: CampaignFormProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    artistId: '',
    requireShareAction: false,
    prizePoolAmount: 0,
    prizePoolCurrency: 'JAMZ' as 'JAMZ' | 'USDT' | 'NGN' | 'AED',
    maxParticipants: 100,
    maxWinners: 3,
    startDate: '',
    endDate: '',
    allowedPlatforms: [] as string[],
    submissionGuidelines: '',
    prizeDistribution: [
      { rank: 1, amount: 0 },
      { rank: 2, amount: 0 },
      { rank: 3, amount: 0 }
    ]
  });
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'from-pink-500 to-purple-500' },
    { id: 'tiktok', name: 'TikTok', color: 'from-black to-red-500' },
    { id: 'youtube', name: 'YouTube Shorts', color: 'from-red-500 to-red-600' }
  ];

  const fetchArtists = async () => {
    try {
      const artistsData = await api.artists.list();
      setArtists(artistsData);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  useEffect(() => {
    fetchArtists();
    if (campaign) {
      setFormData({
        title: campaign.title,
        description: campaign.description,
        youtubeUrl: campaign.youtubeUrl || '',
        spotifyUrl: campaign.spotifyUrl || '',
        appleMusicUrl: campaign.appleMusicUrl || '',
        artistId: campaign.artistId || '',
        requireShareAction: campaign.prerequisites?.requireShareAction || false,
        prizePoolAmount: campaign.prizePool.amount,
        prizePoolCurrency: campaign.prizePool.currency,
        maxParticipants: campaign.maxParticipants,
        maxWinners: campaign.maxWinners,
        startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0],
        allowedPlatforms: campaign.allowedPlatforms,
        submissionGuidelines: campaign.submissionGuidelines || '',
        prizeDistribution: campaign.prizeDistribution || []
      });
      
      if (campaign.thumbnailImage) {
        setThumbnailPreview(`/api/open-verse/campaigns/${campaign._id}/thumbnail`);
      }
    }
  }, [campaign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name.includes('Amount') || name.includes('Participants') || name.includes('Winners')
          ? parseFloat(value) || 0
          : value
      };

      // Auto-adjust prize distribution when maxWinners changes
      if (name === 'maxWinners') {
        const currentLength = prev.prizeDistribution.length;
        const newMaxWinners = parseFloat(value) || 0;

        if (newMaxWinners > currentLength) {
          // Add more prize distribution entries
          const additionalEntries = Array.from(
            { length: newMaxWinners - currentLength },
            (_, i) => ({ rank: currentLength + i + 1, amount: 0 })
          );
          newData.prizeDistribution = [...prev.prizeDistribution, ...additionalEntries];
        } else if (newMaxWinners < currentLength && newMaxWinners > 0) {
          // Remove excess prize distribution entries
          newData.prizeDistribution = prev.prizeDistribution.slice(0, newMaxWinners);
        }
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedPlatforms: prev.allowedPlatforms.includes(platformId)
        ? prev.allowedPlatforms.filter(p => p !== platformId)
        : [...prev.allowedPlatforms, platformId]
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrizeDistributionChange = (index: number, amount: number) => {
    setFormData(prev => ({
      ...prev,
      prizeDistribution: prev.prizeDistribution.map((prize, i) =>
        i === index ? { ...prize, amount } : prize
      )
    }));
  };

  const handleEqualDistribution = () => {
    const totalAmount = formData.prizePoolAmount;
    const numWinners = formData.prizeDistribution.length;
    const equalAmount = Math.floor(totalAmount / numWinners); // Round down to whole numbers
    const remainder = totalAmount - (equalAmount * numWinners);

    setFormData(prev => ({
      ...prev,
      prizeDistribution: prev.prizeDistribution.map((prize, index) => ({
        ...prize,
        amount: index === 0 ? equalAmount + remainder : equalAmount // Give remainder to 1st place
      }))
    }));
  };

  const handleRankBasedDistribution = () => {
    const totalAmount = formData.prizePoolAmount;
    const numWinners = formData.prizeDistribution.length;

    // Define percentage distribution based on number of winners
    let percentages: number[] = [];

    if (numWinners === 1) {
      percentages = [100];
    } else if (numWinners === 2) {
      percentages = [60, 40];
    } else if (numWinners === 3) {
      percentages = [50, 30, 20];
    } else if (numWinners === 4) {
      percentages = [40, 30, 20, 10];
    } else if (numWinners === 5) {
      percentages = [35, 25, 20, 15, 5];
    } else {
      // For more than 5 winners, use a proper decreasing distribution
      // Create a weighted distribution where 1st place gets significantly more
      const weights: number[] = [];

      for (let i = 0; i < numWinners; i++) {
        // Use exponential decay: higher ranks get exponentially less
        // Formula: weight = (numWinners - rank) ^ 1.5
        const rank = i + 1;
        const weight = Math.pow(numWinners - i, 1.5);
        weights.push(weight);
      }

      // Convert weights to percentages
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      percentages = weights.map(weight => (weight / totalWeight) * 100);
    }

    // Calculate amounts as whole numbers only
    let amounts = percentages.map(p => Math.floor((totalAmount * p) / 100));
    const totalDistributed = amounts.reduce((a, b) => a + b, 0);
    const remainder = totalAmount - totalDistributed;

    // Add remainder to 1st place
    amounts[0] += remainder;

    setFormData(prev => ({
      ...prev,
      prizeDistribution: prev.prizeDistribution.map((prize, index) => ({
        ...prize,
        amount: amounts[index] || 0
      }))
    }));
  };



  const removePrizeRank = (index: number) => {
    if (formData.prizeDistribution.length > 1) {
      setFormData(prev => ({
        ...prev,
        prizeDistribution: prev.prizeDistribution
          .filter((_, i) => i !== index)
          .map((prize, i) => ({ ...prize, rank: i + 1 }))
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.artistId) newErrors.artistId = 'Artist is required';
    if (formData.prizePoolAmount <= 0) newErrors.prizePoolAmount = 'Prize pool must be greater than 0';
    if (formData.maxParticipants <= 0) newErrors.maxParticipants = 'Max participants must be greater than 0';
    if (formData.maxWinners <= 0) newErrors.maxWinners = 'Max winners must be greater than 0';
    if (formData.maxWinners > formData.maxParticipants) newErrors.maxWinners = 'Max winners cannot exceed max participants';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.allowedPlatforms.length === 0) newErrors.allowedPlatforms = 'At least one platform must be selected';
    if (!campaign && !thumbnailFile) newErrors.thumbnail = 'Thumbnail image is required';

    // Validate prize distribution
    const totalDistributed = formData.prizeDistribution.reduce((sum, prize) => sum + prize.amount, 0);
    if (totalDistributed !== formData.prizePoolAmount) {
      // Use proper currency formatting - only USD/USDT get $ prefix
      const formatAmount = (amount: number) => {
        if (['USDT', 'USD'].includes(formData.prizePoolCurrency)) {
          return `$${amount}`;
        } else {
          return `${amount} ${formData.prizePoolCurrency}`;
        }
      };
      newErrors.prizeDistribution = `Total prize distribution (${formatAmount(totalDistributed)}) must equal prize pool (${formatAmount(formData.prizePoolAmount)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      if (formData.youtubeUrl) formDataToSend.append('youtubeUrl', formData.youtubeUrl);
      if (formData.spotifyUrl) formDataToSend.append('spotifyUrl', formData.spotifyUrl);
      if (formData.appleMusicUrl) formDataToSend.append('appleMusicUrl', formData.appleMusicUrl);
      if (formData.artistId) formDataToSend.append('artistId', formData.artistId);
      formDataToSend.append('requireShareAction', formData.requireShareAction.toString());
      formDataToSend.append('prizePoolAmount', formData.prizePoolAmount.toString());
      formDataToSend.append('prizePoolCurrency', formData.prizePoolCurrency);
      formDataToSend.append('maxParticipants', formData.maxParticipants.toString());
      formDataToSend.append('maxWinners', formData.maxWinners.toString());
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('allowedPlatforms', JSON.stringify(formData.allowedPlatforms));
      formDataToSend.append('submissionGuidelines', formData.submissionGuidelines);
      formDataToSend.append('prizeDistribution', JSON.stringify(formData.prizeDistribution));
      
      if (thumbnailFile) {
        formDataToSend.append('thumbnailImage', thumbnailFile);
      }

      const url = campaign 
        ? `/api/open-verse/admin/campaigns/${campaign._id}`
        : '/api/open-verse/admin/campaigns';
      
      const method = campaign ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save campaign');
      }

      const savedCampaign = await response.json();
      onSave(savedCampaign);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save campaign' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Enter campaign title"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Thumbnail Image *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="flex items-center justify-center w-full h-32 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                >
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-white/50 mx-auto mb-2" />
                      <p className="text-white/50 text-sm">Click to upload thumbnail</p>
                    </div>
                  )}
                </label>
              </div>
              {errors.thumbnail && <p className="text-red-400 text-sm mt-1">{errors.thumbnail}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="Describe your Open Verse campaign..."
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Media URLs and Artist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Media & Artist Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  YouTube URL (Optional)
                </label>
                <input
                  type="url"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.youtubeUrl && <p className="text-red-400 text-sm mt-1">{errors.youtubeUrl}</p>}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Spotify URL (Optional)
                </label>
                <input
                  type="url"
                  name="spotifyUrl"
                  value={formData.spotifyUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="https://open.spotify.com/track/..."
                />
                {errors.spotifyUrl && <p className="text-red-400 text-sm mt-1">{errors.spotifyUrl}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Apple Music URL (Optional)
                </label>
                <input
                  type="url"
                  name="appleMusicUrl"
                  value={formData.appleMusicUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="https://music.apple.com/..."
                />
                {errors.appleMusicUrl && <p className="text-red-400 text-sm mt-1">{errors.appleMusicUrl}</p>}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Artist *
                </label>
                <select
                  name="artistId"
                  value={formData.artistId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                >
                  <option value="" className="bg-gray-800 text-white">Select an artist</option>
                  {artists.map(artist => (
                    <option key={artist._id} value={artist._id} className="bg-gray-800 text-white">
                      {artist.name}
                    </option>
                  ))}
                </select>
                {errors.artistId && <p className="text-red-400 text-sm mt-1">{errors.artistId}</p>}
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Prerequisites</h3>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requireShareAction"
                name="requireShareAction"
                checked={formData.requireShareAction}
                onChange={(e) => setFormData(prev => ({ ...prev, requireShareAction: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="requireShareAction" className="text-white/80 text-sm font-medium">
                Require users to share campaign before participating
              </label>
            </div>
          </div>

          {/* Prize Pool and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Prize Pool Amount *
              </label>
              <input
                type="number"
                name="prizePoolAmount"
                value={formData.prizePoolAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {errors.prizePoolAmount && <p className="text-red-400 text-sm mt-1">{errors.prizePoolAmount}</p>}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Currency *
              </label>
              <select
                name="prizePoolCurrency"
                value={formData.prizePoolCurrency}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="JAMZ">JAMZ</option>
                <option value="USDT">USDT</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Max Participants *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {errors.maxParticipants && <p className="text-red-400 text-sm mt-1">{errors.maxParticipants}</p>}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Max Winners *
              </label>
              <input
                type="number"
                name="maxWinners"
                value={formData.maxWinners}
                onChange={handleInputChange}
                min="1"
                max={formData.maxParticipants}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {errors.maxWinners && <p className="text-red-400 text-sm mt-1">{errors.maxWinners}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {errors.endDate && <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Allowed Platforms */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">
              Allowed Platforms *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.allowedPlatforms.includes(platform.id)
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${platform.color} mb-2`}></div>
                  <h3 className="text-white font-medium">{platform.name}</h3>
                </div>
              ))}
            </div>
            {errors.allowedPlatforms && <p className="text-red-400 text-sm mt-1">{errors.allowedPlatforms}</p>}
          </div>

          {/* Prize Distribution */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-white/80 text-sm font-medium">
                Prize Distribution ({formData.prizeDistribution.length} of {formData.maxWinners} winners)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEqualDistribution}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-xs hover:bg-blue-500/30 transition-colors"
                  title="Distribute prize pool equally among all winners"
                >
                  <Zap className="w-3 h-3" />
                  Equal Distribution
                </button>
                <button
                  type="button"
                  onClick={handleRankBasedDistribution}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-xs hover:bg-purple-500/30 transition-colors"
                  title="Distribute prizes with higher amounts for better ranks"
                >
                  <TrendingDown className="w-3 h-3" />
                  Rank-Based Distribution
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {formData.prizeDistribution.map((prize, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/60 text-sm">#{prize.rank}</span>
                    <div className="flex items-center">
                      {['USDT', 'USD'].includes(formData.prizePoolCurrency) && (
                        <DollarSign className="w-4 h-4 text-white/40" />
                      )}
                      <input
                        type="number"
                        value={prize.amount}
                        onChange={(e) => handlePrizeDistributionChange(index, parseInt(e.target.value) || 0)}
                        min="0"
                        step="1"
                        className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                        placeholder="0"
                      />
                      <span className="text-white/60 text-sm ml-1">{formData.prizePoolCurrency}</span>
                    </div>
                  </div>
                  {formData.prizeDistribution.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrizeRank(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Prize Distribution Summary */}
            {(() => {
              const totalDistributed = formData.prizeDistribution.reduce((sum, prize) => sum + prize.amount, 0);
              const remaining = formData.prizePoolAmount - totalDistributed;
              const isValid = remaining === 0;

              // Use proper currency formatting - only USD/USDT get $ prefix
              const formatAmount = (amount: number) => {
                if (['USDT', 'USD'].includes(formData.prizePoolCurrency)) {
                  return `$${amount}`;
                } else {
                  return `${amount} ${formData.prizePoolCurrency}`;
                }
              };

              return (
                <div className={`mt-4 p-3 rounded-lg border ${isValid ? 'bg-green-500/20 border-green-500/50' : remaining > 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                  <div className="text-sm text-white">
                    <div className="flex justify-between items-center">
                      <span>Prize Pool Total:</span>
                      <span className="font-semibold">{formatAmount(formData.prizePoolAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Distributed:</span>
                      <span className="font-semibold">{formatAmount(totalDistributed)}</span>
                    </div>
                    <div className={`flex justify-between items-center font-semibold ${isValid ? 'text-green-300' : remaining > 0 ? 'text-yellow-300' : 'text-red-300'}`}>
                      <span>Remaining:</span>
                      <span>{formatAmount(Math.round(remaining))}</span>
                    </div>
                    {!isValid && (
                      <div className={`mt-2 text-xs ${remaining > 0 ? 'text-yellow-300' : 'text-red-300'}`}>
                        {remaining > 0 ? '⚠️ You need to distribute the remaining amount' : '❌ Total distribution exceeds prize pool'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {errors.prizeDistribution && <p className="text-red-400 text-sm mt-1">{errors.prizeDistribution}</p>}
          </div>

          {/* Submission Guidelines */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Submission Guidelines
            </label>
            <textarea
              name="submissionGuidelines"
              value={formData.submissionGuidelines}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="Optional guidelines for participants..."
            />
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="glass-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-button-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {campaign ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                campaign ? 'Update Campaign' : 'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
