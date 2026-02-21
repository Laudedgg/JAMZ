import React, { useState, useEffect } from 'react';
import { UnifiedCampaign, CreateCampaignData, unifiedCampaignApi } from '../lib/unifiedCampaignApi';
import { api } from '../lib/api';

interface Artist {
  _id: string;
  name: string;
  imageUrl: string;
}

interface UnifiedCampaignFormProps {
  campaign?: UnifiedCampaign;
  onSubmit: (data: CreateCampaignData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const UnifiedCampaignForm: React.FC<UnifiedCampaignFormProps> = ({
  campaign,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [formData, setFormData] = useState<CreateCampaignData>({
    title: '',
    description: '',
    artistId: '',
    youtubeUrl: '',
    spotifyUrl: '',
    appleUrl: '',
    otherDspUrls: {},
    thumbnailImage: null as any,
    prizePoolAmount: 0,
    prizePoolCurrency: 'JAMZ',
    maxParticipants: 100,
    maxWinners: 3,
    startDate: '',
    endDate: '',
    allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
    submissionGuidelines: '',
    prizeDistribution: [
      { rank: 1, amount: 0 },
      { rank: 2, amount: 0 },
      { rank: 3, amount: 0 }
    ],
    requireYouTubeWatch: false,
    requireShareAction: false,
    shareRewardUsd: 0,
    shareRewardJamz: 0,
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

  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  useEffect(() => {
    fetchArtists();
    if (campaign) {
      populateFormWithCampaign(campaign);
    }
  }, [campaign]);

  const fetchArtists = async () => {
    try {
      const artistsData = await api.artists.list();
      setArtists(artistsData);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const populateFormWithCampaign = (campaign: UnifiedCampaign) => {
    setFormData({
      title: campaign.title,
      description: campaign.description,
      artistId: campaign.artistId._id,
      youtubeUrl: campaign.youtubeUrl || '',
      spotifyUrl: campaign.spotifyUrl || '',
      appleUrl: campaign.appleUrl || '',
      otherDspUrls: campaign.otherDspUrls || {},
      thumbnailImage: null as any, // Will be handled separately
      prizePoolAmount: campaign.prizePool.amount,
      prizePoolCurrency: campaign.prizePool.currency,
      maxParticipants: campaign.maxParticipants,
      maxWinners: campaign.maxWinners,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      allowedPlatforms: campaign.allowedPlatforms,
      submissionGuidelines: campaign.submissionGuidelines || '',
      prizeDistribution: campaign.prizeDistribution,
      requireYouTubeWatch: campaign.prerequisites.requireYouTubeWatch,
      requireShareAction: campaign.prerequisites.requireShareAction,
      shareRewardUsd: campaign.shareRewardUsd,
      shareRewardJamz: campaign.shareRewardJamz,
      shareRewardNgn: campaign.shareRewardNgn,
      shareRewardAed: campaign.shareRewardAed,
      watchRewardUsd: campaign.watchRewardUsd,
      watchRewardJamz: campaign.watchRewardJamz,
      watchRewardNgn: campaign.watchRewardNgn,
      watchRewardAed: campaign.watchRewardAed,
      maxReferralRewards: campaign.maxReferralRewards,
      maxReferralRewardsPerUser: campaign.maxReferralRewardsPerUser,
      isActive: campaign.isActive
    });

    // Set thumbnail preview if editing
    if (campaign.thumbnailImage) {
      setThumbnailPreview(unifiedCampaignApi.getThumbnailUrl(campaign._id));
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

    // Validation
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!formData.artistId) {
      alert('Artist is required');
      return;
    }
    
    if (!formData.thumbnailImage && !campaign) {
      alert('Thumbnail image is required');
      return;
    }
    
    if (formData.prizePoolAmount <= 0) {
      alert('Prize pool amount must be greater than 0');
      return;
    }
    
    if (formData.allowedPlatforms.length === 0) {
      alert('At least one platform must be selected');
      return;
    }
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date');
      return;
    }

    // Validate prize distribution
    const totalDistributed = formData.prizeDistribution.reduce((sum, prize) => sum + prize.amount, 0);
    if (totalDistributed !== formData.prizePoolAmount) {
      alert(`Total prize distribution ($${totalDistributed}) must equal the prize pool amount ($${formData.prizePoolAmount})`);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">
        {campaign ? 'Edit Campaign' : 'Create New Campaign'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artist *
            </label>
            <select
              name="artistId"
              value={formData.artistId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an artist</option>
              {artists.map(artist => (
                <option key={artist._id} value={artist._id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Media URLs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <input
              type="url"
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spotify URL
            </label>
            <input
              type="url"
              name="spotifyUrl"
              value={formData.spotifyUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apple Music URL
            </label>
            <input
              type="url"
              name="appleUrl"
              value={formData.appleUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail Image {!campaign && '*'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...(!campaign && { required: true })}
          />
          {thumbnailPreview && (
            <div className="mt-2">
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Prize Pool */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prize Pool Amount *
            </label>
            <input
              type="number"
              name="prizePoolAmount"
              value={formData.prizePoolAmount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prize Pool Currency *
            </label>
            <select
              name="prizePoolCurrency"
              value={formData.prizePoolCurrency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="JAMZ">JAMZ</option>
              <option value="USDT">USDT</option>
              <option value="NGN">NGN</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>

        {/* Participation Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Participants *
            </label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Winners *
            </label>
            <input
              type="number"
              name="maxWinners"
              value={formData.maxWinners}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Campaign Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Allowed Platforms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allowed Platforms *
          </label>
          <div className="flex flex-wrap gap-4">
            {['instagram', 'tiktok', 'youtube'].map(platform => (
              <label key={platform} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowedPlatforms.includes(platform)}
                  onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                  className="mr-2"
                />
                <span className="capitalize">{platform}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submission Guidelines */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Submission Guidelines
          </label>
          <textarea
            name="submissionGuidelines"
            value={formData.submissionGuidelines}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter guidelines for participants..."
          />
        </div>

        {/* Prize Distribution */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Prize Distribution
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleEqualDistribution}
                className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600 transition-colors"
                title="Distribute prize pool equally among all winners"
              >
                Equal
              </button>
              <button
                type="button"
                onClick={handleRankBasedDistribution}
                className="px-2 py-1 bg-purple-500 text-white rounded text-[10px] hover:bg-purple-600 transition-colors"
                title="Distribute prizes with higher amounts for better ranks"
              >
                Rank-Based
              </button>
              <button
                type="button"
                onClick={handleRankBasedFixedDistribution}
                className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600 transition-colors"
                title="Rank-based distribution with clean rounded numbers (e.g. 10,000, 5,000, 2,500)"
              >
                Ranked Fixed
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {formData.prizeDistribution.map((prize, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500">Rank</label>
                  <input
                    type="number"
                    value={prize.rank}
                    onChange={(e) => handlePrizeDistributionChange(index, 'rank', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex-2">
                  <label className="block text-xs text-gray-500">Amount</label>
                  <input
                    type="number"
                    value={prize.amount}
                    onChange={(e) => handlePrizeDistributionChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                {formData.prizeDistribution.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrizeRank(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPrizeRank}
              className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Add Prize Rank
            </button>

            {/* Prize Distribution Summary */}
            {(() => {
              const totalDistributed = formData.prizeDistribution.reduce((sum, prize) => sum + prize.amount, 0);
              const remaining = formData.prizePoolAmount - totalDistributed;
              const isValid = Math.abs(remaining) < 0.01;

              return (
                <div className={`mt-4 p-3 rounded-lg border ${isValid ? 'bg-green-50 border-green-200' : remaining > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span>Prize Pool Total:</span>
                      <span className="font-semibold">${formData.prizePoolAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Distributed:</span>
                      <span className="font-semibold">${totalDistributed}</span>
                    </div>
                    <div className={`flex justify-between items-center font-semibold ${isValid ? 'text-green-700' : remaining > 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                      <span>Remaining:</span>
                      <span>${remaining.toFixed(2)}</span>
                    </div>
                    {!isValid && (
                      <div className={`mt-2 text-xs ${remaining > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {remaining > 0 ? '⚠️ You need to distribute the remaining amount' : '❌ Total distribution exceeds prize pool'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* NEW: Prerequisites Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Prerequisites for Prize Eligibility</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="requireYouTubeWatch"
                checked={formData.requireYouTubeWatch}
                onChange={handleInputChange}
                className="mr-3"
              />
              <span className="font-medium">Require YouTube video watch to be eligible for prizes</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="requireShareAction"
                checked={formData.requireShareAction}
                onChange={handleInputChange}
                className="mr-3"
              />
              <span className="font-medium">Require Share & Earn action to be eligible for prizes</span>
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            When enabled, users must complete these actions before their submissions can be considered for winning prizes.
          </p>
        </div>

        {/* Legacy Reward Settings (for backward compatibility) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Legacy Reward Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Watch Reward (JAMZ)</label>
              <input
                type="number"
                name="watchRewardJamz"
                value={formData.watchRewardJamz}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Share Reward (JAMZ)</label>
              <input
                type="number"
                name="shareRewardJamz"
                value={formData.shareRewardJamz}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Referral Rewards</label>
              <input
                type="number"
                name="maxReferralRewards"
                value={formData.maxReferralRewards}
                onChange={handleInputChange}
                min="0"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Per User</label>
              <input
                type="number"
                name="maxReferralRewardsPerUser"
                value={formData.maxReferralRewardsPerUser}
                onChange={handleInputChange}
                min="0"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Campaign Status */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="mr-3"
            />
            <span className="font-medium">Campaign is active</span>
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (campaign ? 'Update Campaign' : 'Create Campaign')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnifiedCampaignForm;
