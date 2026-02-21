import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, DollarSign, Users, Calendar, Target, AlertCircle, CheckCircle, Music, Zap, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';

interface ArtistCampaignFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface CampaignFormData {
  title: string;
  description: string;
  thumbnailImage: File | null;
  youtubeUrl: string;
  spotifyUrl: string;
  appleUrl: string;
  prizePoolAmount: number;
  prizePoolCurrency: 'USD' | 'NGN' | 'AED' | 'JAMZ';
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
  prerequisites: {
    requireYouTubeWatch: boolean;
    requireShareAction: boolean;
  };
  shareRewardUsd: number;
  shareRewardJamz: number;
  watchRewardUsd: number;
  watchRewardJamz: number;
}

export function ArtistCampaignForm({ onClose, onSuccess }: ArtistCampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    thumbnailImage: null,
    youtubeUrl: '',
    spotifyUrl: '',
    appleUrl: '',
    prizePoolAmount: 100,
    prizePoolCurrency: 'USD',
    maxParticipants: 100,
    maxWinners: 3,
    startDate: '',
    endDate: '',
    allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
    submissionGuidelines: '',
    prizeDistribution: [
      { rank: 1, amount: 50 },
      { rank: 2, amount: 30 },
      { rank: 3, amount: 20 }
    ],
    requireYouTubeWatch: false,
    requireShareAction: false,
    shareRewardUsd: 0,
    shareRewardJamz: 5,
    shareRewardNgn: 0,
    shareRewardAed: 0,
    watchRewardUsd: 0,
    watchRewardJamz: 5,
    watchRewardNgn: 0,
    watchRewardAed: 0,
    maxReferralRewards: 100,
    maxReferralRewardsPerUser: 5,
    isActive: true
  });

  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Dynamic prize distribution based on maxWinners
  useEffect(() => {
    const currentLength = formData.prizeDistribution.length;
    const targetLength = formData.maxWinners;

    if (currentLength !== targetLength) {
      setFormData(prev => {
        let newPrizeDistribution = [...prev.prizeDistribution];

        if (targetLength > currentLength) {
          // Add new prize ranks
          for (let i = currentLength; i < targetLength; i++) {
            newPrizeDistribution.push({ rank: i + 1, amount: 0 });
          }
        } else {
          // Remove excess prize ranks
          newPrizeDistribution = newPrizeDistribution.slice(0, targetLength);
        }

        // Update ranks to be sequential
        newPrizeDistribution = newPrizeDistribution.map((prize, index) => ({
          ...prize,
          rank: index + 1
        }));

        return {
          ...prev,
          prizeDistribution: newPrizeDistribution
        };
      });
    }
  }, [formData.maxWinners]);

  const fetchWalletData = async () => {
    try {
      const wallet = await api.artistWallet.getWallet();
      setWalletData(wallet);
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      setError('Failed to load wallet data');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnailImage: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowedPlatforms: checked
        ? [...prev.allowedPlatforms, platform]
        : prev.allowedPlatforms.filter(p => p !== platform)
    }));
  };

  const handlePrizeDistributionChange = (index: number, field: 'rank' | 'amount', value: number) => {
    setFormData(prev => ({
      ...prev,
      prizeDistribution: prev.prizeDistribution.map((prize, i) =>
        i === index ? { ...prize, [field]: value } : prize
      )
    }));
  };

  const addPrizeRank = () => {
    setFormData(prev => ({
      ...prev,
      prizeDistribution: [
        ...prev.prizeDistribution,
        { rank: prev.prizeDistribution.length + 1, amount: 0 }
      ]
    }));
  };

  const removePrizeRank = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prizeDistribution: prev.prizeDistribution.filter((_, i) => i !== index)
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

    let percentages: number[] = [];

    if (numWinners === 1) {
      percentages = [100];
    } else if (numWinners === 2) {
      percentages = [60, 40];
    } else if (numWinners === 3) {
      percentages = [50, 30, 20];
    } else if (numWinners === 4) {
      percentages = [40, 30, 20, 10];
    } else {
      // For more than 4 winners, use a weighted distribution
      const weights = Array.from({ length: numWinners }, (_, i) => numWinners - i);

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

  // Helper function to round to nice numbers
  const roundToNiceNumber = (amount: number): number => {
    if (amount >= 100000) {
      return Math.round(amount / 10000) * 10000; // Round to nearest 10,000
    } else if (amount >= 10000) {
      return Math.round(amount / 5000) * 5000; // Round to nearest 5,000
    } else if (amount >= 1000) {
      return Math.round(amount / 1000) * 1000; // Round to nearest 1,000
    } else if (amount >= 100) {
      return Math.round(amount / 100) * 100; // Round to nearest 100
    } else if (amount >= 10) {
      return Math.round(amount / 10) * 10; // Round to nearest 10
    }
    return Math.round(amount);
  };

  const handleRankBasedFixedDistribution = () => {
    const totalAmount = formData.prizePoolAmount;
    const numWinners = formData.prizeDistribution.length;

    let percentages: number[] = [];

    if (numWinners === 1) {
      percentages = [100];
    } else if (numWinners === 2) {
      percentages = [60, 40];
    } else if (numWinners === 3) {
      percentages = [50, 30, 20];
    } else if (numWinners === 4) {
      percentages = [40, 30, 20, 10];
    } else {
      // For more than 4 winners, use a weighted distribution
      const weights = Array.from({ length: numWinners }, (_, i) => numWinners - i);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      percentages = weights.map(weight => (weight / totalWeight) * 100);
    }

    // Calculate amounts and round to nice numbers
    let amounts = percentages.map(p => roundToNiceNumber((totalAmount * p) / 100));

    // Calculate the difference and adjust the first place to compensate
    const totalDistributed = amounts.reduce((a, b) => a + b, 0);
    const difference = totalAmount - totalDistributed;

    // Add the difference to 1st place (could be positive or negative)
    amounts[0] = roundToNiceNumber(amounts[0] + difference);

    // If still not exact, just adjust first place exactly
    const finalTotal = amounts.reduce((a, b) => a + b, 0);
    if (finalTotal !== totalAmount) {
      amounts[0] += (totalAmount - finalTotal);
    }

    setFormData(prev => ({
      ...prev,
      prizeDistribution: prev.prizeDistribution.map((prize, index) => ({
        ...prize,
        amount: amounts[index] || 0
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Campaign title is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Campaign description is required');
      }

      if (formData.prizePoolAmount <= 0) {
        throw new Error('Prize pool must be greater than 0');
      }

      if (formData.maxParticipants <= 0) {
        throw new Error('Max participants must be greater than 0');
      }

      if (!formData.startDate || !formData.endDate) {
        throw new Error('Start and end dates are required');
      }

      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        throw new Error('End date must be after start date');
      }

      // Validate prize distribution
      const totalDistributed = formData.prizeDistribution.reduce((sum, prize) => sum + prize.amount, 0);
      if (Math.abs(totalDistributed - formData.prizePoolAmount) > 0.01) {
        throw new Error(`Total prize distribution (${totalDistributed} ${formData.prizePoolCurrency}) must equal the prize pool amount (${formData.prizePoolAmount} ${formData.prizePoolCurrency})`);
      }

      // Validate at least one platform is selected
      if (formData.allowedPlatforms.length === 0) {
        throw new Error('At least one platform must be selected');
      }

      // Calculate total cost with 5% platform fee
      const platformFee = formData.prizePoolAmount * 0.05;
      const totalCost = formData.prizePoolAmount + platformFee;

      // Check wallet balance
      if (walletData?.balances) {
        const balanceMap: any = {
          USD: walletData.balances.usdt || 0,
          NGN: walletData.balances.ngn || 0,
          AED: walletData.balances.aed || 0,
          JAMZ: walletData.balances.jamz || 0
        };
        const walletBalance = balanceMap[formData.prizePoolCurrency] || 0;

        if (totalCost > walletBalance) {
          throw new Error(`Insufficient ${formData.prizePoolCurrency} balance. You need ${totalCost.toFixed(2)} ${formData.prizePoolCurrency} (including 5% platform fee) but only have ${walletBalance.toFixed(2)} ${formData.prizePoolCurrency}.`);
        }
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('youtubeUrl', formData.youtubeUrl);
      submitData.append('spotifyUrl', formData.spotifyUrl);
      submitData.append('appleUrl', formData.appleUrl);
      submitData.append('prizePoolAmount', formData.prizePoolAmount.toString());
      submitData.append('prizePoolCurrency', formData.prizePoolCurrency);
      submitData.append('maxParticipants', formData.maxParticipants.toString());
      submitData.append('maxWinners', formData.maxWinners.toString());
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('allowedPlatforms', JSON.stringify(formData.allowedPlatforms));
      submitData.append('submissionGuidelines', formData.submissionGuidelines);
      submitData.append('prizeDistribution', JSON.stringify(formData.prizeDistribution));
      submitData.append('requireYouTubeWatch', formData.requireYouTubeWatch.toString());
      submitData.append('requireShareAction', formData.requireShareAction.toString());
      submitData.append('shareRewardUsd', formData.shareRewardUsd.toString());
      submitData.append('shareRewardJamz', formData.shareRewardJamz.toString());
      submitData.append('shareRewardNgn', formData.shareRewardNgn.toString());
      submitData.append('shareRewardAed', formData.shareRewardAed.toString());
      submitData.append('watchRewardUsd', formData.watchRewardUsd.toString());
      submitData.append('watchRewardJamz', formData.watchRewardJamz.toString());
      submitData.append('watchRewardNgn', formData.watchRewardNgn.toString());
      submitData.append('watchRewardAed', formData.watchRewardAed.toString());
      submitData.append('maxReferralRewards', formData.maxReferralRewards.toString());
      submitData.append('maxReferralRewardsPerUser', formData.maxReferralRewardsPerUser.toString());
      submitData.append('isActive', formData.isActive.toString());

      // Add platform fee information
      submitData.append('platformFee', platformFee.toString());
      submitData.append('totalCost', totalCost.toString());

      if (formData.thumbnailImage) {
        submitData.append('thumbnailImage', formData.thumbnailImage);
      }

      const response = await api.artistCampaigns.create(submitData);

      setSuccess('Campaign created successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create New Campaign</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-200">{success}</span>
            </div>
          )}

          {/* Wallet Balance Display */}
          {walletData && (
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Wallet Balance
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-white/60">USDT</div>
                  <div className="font-bold text-green-400">${(walletData.balances.usdt || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-white/60">NGN</div>
                  <div className="font-bold text-blue-400">₦{(walletData.balances.ngn || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-white/60">AED</div>
                  <div className="font-bold text-yellow-400">{(walletData.balances.aed || 0).toFixed(2)} AED</div>
                </div>
                <div>
                  <div className="text-white/60">INR</div>
                  <div className="font-bold text-indigo-400">₹{walletData.balances.inr?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="Enter campaign title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Thumbnail Image *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors"
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white/40 mb-2" />
                        <span className="text-white/60 text-sm">Click to upload thumbnail</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none"
                placeholder="Describe your campaign..."
                required
              />
            </div>

            {/* Media & Artist Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Music className="w-5 h-5 mr-2" />
                Media & Artist Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    YouTube URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Spotify URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="spotifyUrl"
                    value={formData.spotifyUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="https://open.spotify.com/track/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Apple Music URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="appleUrl"
                    value={formData.appleUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    placeholder="https://music.apple.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Campaign Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Campaign Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Prize Pool Amount *
                  </label>
                  <input
                    type="number"
                    name="prizePoolAmount"
                    value={formData.prizePoolAmount}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Currency
                  </label>
                  <select
                    name="prizePoolCurrency"
                    value={formData.prizePoolCurrency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="USD">USD</option>
                    <option value="NGN">NGN</option>
                    <option value="AED">AED</option>
                    <option value="JAMZ">JAMZ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Max Winners *
                  </label>
                  <input
                    type="number"
                    name="maxWinners"
                    value={formData.maxWinners}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Allowed Platforms */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Allowed Platforms *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                    { id: 'tiktok', name: 'TikTok', color: 'bg-gradient-to-r from-red-500 to-black' },
                    { id: 'youtube', name: 'YouTube Shorts', color: 'bg-gradient-to-r from-red-600 to-red-500' }
                  ].map(platform => (
                    <label key={platform.id} className="relative">
                      <input
                        type="checkbox"
                        checked={formData.allowedPlatforms.includes(platform.id)}
                        onChange={(e) => handlePlatformChange(platform.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.allowedPlatforms.includes(platform.id)
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}>
                        <div className={`w-8 h-8 rounded-lg ${platform.color} mb-2`}></div>
                        <div className="text-white font-medium">{platform.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prize Distribution */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-white/80 text-sm font-medium">
                    Prize Distribution ({formData.prizeDistribution.length} of {formData.maxWinners} winners)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleEqualDistribution}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-[10px] hover:bg-blue-500/30 transition-colors"
                      title="Distribute prize pool equally among all winners"
                    >
                      <Zap className="w-3 h-3" />
                      Equal
                    </button>
                    <button
                      type="button"
                      onClick={handleRankBasedDistribution}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-[10px] hover:bg-purple-500/30 transition-colors"
                      title="Distribute prizes with higher amounts for better ranks (calculated amounts)"
                    >
                      <TrendingDown className="w-3 h-3" />
                      Rank-Based
                    </button>
                    <button
                      type="button"
                      onClick={handleRankBasedFixedDistribution}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 text-[10px] hover:bg-emerald-500/30 transition-colors"
                      title="Rank-based distribution with clean rounded numbers (e.g. 10,000, 5,000, 2,500)"
                    >
                      <TrendingDown className="w-3 h-3" />
                      Ranked Fixed
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {formData.prizeDistribution.map((prize, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-white/60 mb-1">Rank</label>
                        <input
                          type="number"
                          value={prize.rank}
                          onChange={(e) => handlePrizeDistributionChange(index, 'rank', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div className="flex-2">
                        <label className="block text-xs text-white/60 mb-1">Amount</label>
                        <input
                          type="number"
                          value={prize.amount}
                          onChange={(e) => handlePrizeDistributionChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div className="text-white/60 text-sm">{formData.prizePoolCurrency}</div>
                      {formData.prizeDistribution.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrizeRank(index)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPrizeRank}
                    className="w-full py-2 border border-dashed border-white/30 rounded-lg text-white/60 hover:text-white hover:border-white/50 transition-colors"
                  >
                    + Add Prize Rank
                  </button>

                  {/* Prize Pool Summary */}
                  {(() => {
                    const totalDistributed = formData.prizeDistribution.reduce((sum, prize) => sum + prize.amount, 0);
                    const remaining = formData.prizePoolAmount - totalDistributed;
                    const isValid = Math.abs(remaining) < 0.01;

                    return (
                      <div className={`p-3 rounded-lg border ${
                        isValid
                          ? 'bg-green-500/10 border-green-500/30'
                          : remaining > 0
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white/60">Prize Pool Total:</span>
                            <span className="font-semibold text-white">{formData.prizePoolAmount} {formData.prizePoolCurrency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Total Distributed:</span>
                            <span className="font-semibold text-white">{totalDistributed} {formData.prizePoolCurrency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Remaining:</span>
                            <span className={`font-semibold ${
                              isValid ? 'text-green-400' : remaining > 0 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {remaining.toFixed(2)} {formData.prizePoolCurrency}
                            </span>
                          </div>
                          {!isValid && (
                            <div className={`text-xs mt-2 ${remaining > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {remaining > 0
                                ? `You need to distribute ${remaining.toFixed(2)} more ${formData.prizePoolCurrency}`
                                : `You have over-distributed by ${Math.abs(remaining).toFixed(2)} ${formData.prizePoolCurrency}`
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Submission Guidelines
                </label>
                <textarea
                  name="submissionGuidelines"
                  value={formData.submissionGuidelines}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none"
                  placeholder="Optional guidelines for participants..."
                />
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prerequisites</h3>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireYouTubeWatch"
                    checked={formData.requireYouTubeWatch}
                    onChange={handleInputChange}
                    className="mr-3 w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white/80">Require YouTube video watch</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireShareAction"
                    checked={formData.requireShareAction}
                    onChange={handleInputChange}
                    className="mr-3 w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white/80">Require social media share</span>
                </label>

              </div>
              <p className="text-sm text-white/60 mt-2">
                When enabled, users must complete these actions before their submissions can be considered for winning prizes.
              </p>
            </div>



            {/* Campaign Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-3 w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <span className="text-white/80 font-medium">Campaign is active</span>
              </label>
            </div>

            {/* Campaign Cost Summary with 5% Fee */}
            {(() => {
              const prizePool = formData.prizePoolAmount;
              const platformFee = prizePool * 0.05; // 5% fee
              const totalCost = prizePool + platformFee;
              const currency = formData.prizePoolCurrency;

              // Get wallet balance for selected currency
              const getWalletBalance = () => {
                if (!walletData?.balances) return 0;
                const balanceMap: any = {
                  USD: walletData.balances.usdt || 0,
                  NGN: walletData.balances.ngn || 0,
                  AED: walletData.balances.aed || 0,
                  JAMZ: walletData.balances.jamz || 0
                };
                return balanceMap[currency] || 0;
              };

              const walletBalance = getWalletBalance();
              const hasInsufficientBalance = totalCost > walletBalance;

              return (
                <div className={`p-4 rounded-lg border ${
                  hasInsufficientBalance
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-purple-500/10 border-purple-500/30'
                }`}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-purple-400" />
                    Campaign Cost Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Prize Pool:</span>
                      <span className="text-white font-medium">{prizePool.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Platform Fee (5%):</span>
                      <span className="text-yellow-400 font-medium">+{platformFee.toFixed(2)} {currency}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total Cost:</span>
                        <span className="text-white font-bold text-lg">{totalCost.toFixed(2)} {currency}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Your {currency} Balance:</span>
                        <span className={`font-medium ${hasInsufficientBalance ? 'text-red-400' : 'text-green-400'}`}>
                          {walletBalance.toFixed(2)} {currency}
                        </span>
                      </div>
                      {hasInsufficientBalance && (
                        <div className="mt-2 flex items-center text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Insufficient balance. You need {(totalCost - walletBalance).toFixed(2)} more {currency}.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
