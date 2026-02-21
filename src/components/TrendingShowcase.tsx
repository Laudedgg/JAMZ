import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, DollarSign, Eye, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { openVerseApi, OpenVerseCampaign } from '../lib/openVerseApi';
import { formatCurrency } from '../lib/currencyUtils';

export const TrendingShowcase = React.memo(function TrendingShowcase() {
  // Start with empty campaigns - no mock data
  const [campaigns, setCampaigns] = useState<OpenVerseCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const data = await openVerseApi.campaigns.list();

      // Filter for campaigns that should be displayed in showcase
      const now = new Date();
      const showcaseCampaigns = data.filter(campaign => {
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);

        // Show campaigns that are:
        // 1. Active status, OR
        // 2. Should be active (current time is between start and end dates) and isActive is true
        const shouldBeActive = campaign.isActive && startDate <= now && endDate >= now;
        const isActiveStatus = campaign.status === 'active';

        return isActiveStatus || shouldBeActive;
      }).slice(0, 3);

      if (showcaseCampaigns.length > 0) {
        setCampaigns(showcaseCampaigns);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching showcase campaigns, using mock data:', err);
      // Keep mock data on error - don't set error state to avoid showing error UI
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleRefresh = useCallback(() => {
    fetchCampaigns(true);
  }, [fetchCampaigns]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const formatPrize = useCallback((prize: any, prizePool?: any) => {
    // Handle OpenVerse campaign prizePool structure
    if (prizePool && prizePool.amount && prizePool.currency) {
      return formatCurrency(prizePool.amount, prizePool.currency);
    }

    // Handle legacy prize structure for other campaign types
    if (typeof prize === 'object' && prize !== null) {
      const parts = [];
      if (prize.usd && prize.usd > 0) parts.push(formatCurrency(prize.usd, 'USD'));
      if (prize.jamz && prize.jamz > 0) parts.push(formatCurrency(prize.jamz, 'JAMZ'));
      if (prize.ngn && prize.ngn > 0) parts.push(formatCurrency(prize.ngn, 'NGN'));
      if (prize.aed && prize.aed > 0) parts.push(formatCurrency(prize.aed, 'AED'));
      return parts.length > 0 ? parts.join(' + ') : 'TBA';
    }
    return prize || 'TBA';
  }, []);

  return (
    <section id="trending-campaigns" className="py-12 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-pink-900/20 via-black to-black" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-16 px-4">
          <h2 className="pixel-text text-2xl md:text-4xl font-bold gradient-text mb-4 md:mb-6">
            Trending Campaigns
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Join creative competitions and win amazing prizes
          </p>
        </div>

        {error && (
          <div className="text-center text-red-500 mb-8">
            Failed to load campaigns: {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="aspect-video bg-gray-800" />
                <div className="p-4 md:p-6 space-y-4">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center text-white/60">
            No campaigns available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {campaigns.map((campaign) => (
              <Link to={`/open-verse/${campaign._id}`} key={campaign._id}>
                <div className="group relative hover:-translate-y-2 transition-transform duration-300">
                  <div className="glass-card overflow-hidden transform-gpu transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,51,102,0.3)]">
                    <div className="relative aspect-video">
                      {campaign.thumbnailImage ? (
                        <img
                          src={openVerseApi.campaigns.getThumbnailUrl(campaign._id)}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Trophy className="w-16 h-16 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button className="glass-button-primary">
                            <Eye className="w-8 h-8" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 bg-gradient-to-b from-transparent via-black/50 to-black/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1 gradient-text">{campaign.title}</h3>
                          <p className="text-white/60 flex items-center">
                            <Trophy className="w-4 h-4 mr-1" /> Campaign Competition
                          </p>
                        </div>
                        <span className="bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-sm">
                          Active
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Prize Pool
                          </span>
                          <span className="text-green-400 font-semibold">
                            {formatPrize(campaign.prize, campaign.prizePool)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Ends
                          </span>
                          <span className="text-orange-400 font-semibold">
                            {formatDate(campaign.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">Status</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-400 text-sm font-medium">Live</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-10">
          <Link to="/open-verse">
            <button className="glass-button-primary px-5 py-2.5 text-sm font-semibold group hover:scale-105 transition-transform">
              <span className="flex items-center">
                View All Campaigns
                <span className="ml-1.5">→</span>
              </span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
});
