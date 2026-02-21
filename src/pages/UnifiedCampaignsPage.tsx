import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { UnifiedCampaign, unifiedCampaignApi } from '../lib/unifiedCampaignApi';
import { useAuthStore } from '../lib/auth';

const UnifiedCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await unifiedCampaignApi.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getStatusBadge = (campaign: UnifiedCampaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    if (!campaign.isActive) {
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Inactive</span>;
    }
    
    if (now < start) {
      return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Upcoming</span>;
    }
    
    if (now > end) {
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Ended</span>;
    }
    
    return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>;
  };

  const getPrerequisiteBadges = (campaign: UnifiedCampaign) => {
    const badges = [];
    
    if (campaign.prerequisites.requireYouTubeWatch) {
      badges.push(
        <span key="youtube" className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
          YouTube Required
        </span>
      );
    }
    
    if (campaign.prerequisites.requireShareAction) {
      badges.push(
        <span key="share" className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
          Share Required
        </span>
      );
    }
    
    return badges;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Music Campaigns
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Discover amazing music, complete challenges, and win prizes in our unified campaign system
          </p>
        </motion.div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 group"
            >
              {/* Campaign Image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={unifiedCampaignApi.getThumbnailUrl(campaign._id)}
                  alt={campaign.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
                <div className="absolute top-4 left-4">
                  {getStatusBadge(campaign)}
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-black/50 text-white rounded-full text-xs">
                    {formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency)}
                  </span>
                </div>
              </div>

              {/* Campaign Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={campaign.artistId.imageUrl}
                    alt={campaign.artistId.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                    }}
                  />
                  <span className="text-white/80 text-sm">{campaign.artistId.name}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {campaign.title}
                </h3>
                
                <p className="text-white/70 text-sm mb-4 line-clamp-3">
                  {campaign.description}
                </p>

                {/* Prerequisites */}
                {(campaign.prerequisites.requireYouTubeWatch || campaign.prerequisites.requireShareAction) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getPrerequisiteBadges(campaign)}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{campaign.totalParticipants}/{campaign.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{campaign.maxWinners} winners</span>
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeRemaining(campaign.endDate)}</span>
                </div>

                {/* Action Button */}
                <Link
                  to={`/unified-campaigns/${campaign._id}`}
                  className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
                >
                  {campaign.status === 'ended' ? 'View Results' : 'Join Campaign'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {campaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Campaigns Available</h2>
            <p className="text-white/70 max-w-md mx-auto">
              Check back soon for exciting new music campaigns with amazing prizes!
            </p>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-white/10 backdrop-blur-md rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Complete Prerequisites</h3>
              <p className="text-white/70 text-sm">
                Watch videos, share content, and complete required actions to become eligible for prizes
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Submit Your Entry</h3>
              <p className="text-white/70 text-sm">
                Create and submit your content on supported platforms to participate in the campaign
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Win Prizes</h3>
              <p className="text-white/70 text-sm">
                Get selected as a winner and receive your share of the prize pool in JAMZ tokens or other currencies
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UnifiedCampaignsPage;
