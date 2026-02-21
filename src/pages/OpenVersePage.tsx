import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { openVerseApi, OpenVerseCampaign } from '../lib/openVerseApi';
import { unifiedCampaignApi, UnifiedCampaign } from '../lib/unifiedCampaignApi';
import { LoadingSpinner, SkeletonCard, PageLoader } from '../components/LoadingSpinner';
import { BottomNavigation } from '../components/BottomNavigation';
import { formatCurrency } from '../lib/currencyUtils';

// Combined campaign type for display
type CombinedCampaign = (OpenVerseCampaign | UnifiedCampaign) & {
  campaignType: 'openverse' | 'unified';
};

export function OpenVersePage() {
  const [campaigns, setCampaigns] = useState<CombinedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      // Fetch campaigns from both APIs in parallel
      const [openVerseCampaigns, unifiedCampaigns] = await Promise.allSettled([
        openVerseApi.campaigns.list(),
        unifiedCampaignApi.getAll()
      ]);

      const allCampaigns: CombinedCampaign[] = [];

      // Add OpenVerse campaigns
      if (openVerseCampaigns.status === 'fulfilled') {
        const openVerseData = openVerseCampaigns.value.map(campaign => ({
          ...campaign,
          campaignType: 'openverse' as const
        }));
        allCampaigns.push(...openVerseData);
      }

      // Add Unified campaigns
      if (unifiedCampaigns.status === 'fulfilled') {
        const unifiedData = unifiedCampaigns.value.map(campaign => ({
          ...campaign,
          campaignType: 'unified' as const
        }));
        allCampaigns.push(...unifiedData);
      }

      // Sort campaigns by creation date (newest first)
      allCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setCampaigns(allCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Use the PageLoader component for better UX
  return (
    <PageLoader loading={loading} error={error} onRetry={fetchCampaigns}>
      <OpenVerseContent campaigns={campaigns} />
    </PageLoader>
  );
}

function OpenVerseContent({ campaigns }: { campaigns: CombinedCampaign[] }) {

  return (
    <div className="min-h-screen pt-8 sm:pt-12 pb-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
            Campaigns
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-xl">
            Create content with artists' tracks on TikTok, Instagram, or YouTube Shorts and win real cash prizes.
          </p>
        </motion.div>

        {campaigns.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
            {campaigns.map((campaign, index) => (
              <Link to={`/open-verse/${campaign._id}`} key={campaign._id}>
                <motion.div
                  className="group relative h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-black/40 border border-white/5 overflow-hidden rounded-lg h-full shadow-sm shadow-purple-500/5 transition-all duration-300 group-hover:shadow-purple-500/20 group-hover:border-purple-500/30">
                    <div className="relative aspect-square">
                      {campaign.thumbnailImage ? (
                        <img
                          src={campaign.campaignType === 'openverse'
                            ? openVerseApi.campaigns.getThumbnailUrl(campaign._id)
                            : unifiedCampaignApi.getThumbnailUrl(campaign._id)
                          }
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                          // Fallback to trophy icon if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}

                      {/* Fallback content */}
                      {!campaign.thumbnailImage && (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white/30" />
                        </div>
                      )}

                      {/* Prize Pool Badge */}
                      {campaign.prizePool?.amount && campaign.prizePool?.currency && (
                        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-green-500/90 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded">
                          {formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency as any)}
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 bg-purple-500/90 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded">
                        {campaign.status === 'active' ? 'Active' :
                         campaign.status === 'ended' ? 'Ended' :
                         campaign.status === 'winners_selected' ? 'Winners' :
                         campaign.status === 'prizes_distributed' ? 'Complete' :
                         'Draft'}
                      </div>
                    </div>

                    <div className="p-1.5 sm:p-2">
                      <h3 className="text-[10px] sm:text-xs font-bold text-white truncate">{campaign.title}</h3>
                      <p className="text-white/60 text-[10px] sm:text-xs truncate hidden sm:block">{campaign.description}</p>

                      {/* Compact Stats */}
                      <div className="flex items-center justify-between mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-white/50">
                        <div className="flex items-center">
                          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          {campaign.submissions?.length || 0}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="glass-card p-12 max-w-2xl mx-auto">
              <Trophy className="w-16 h-16 text-white/30 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No Active Campaigns</h3>
              <p className="text-white/60">
                There are no Open Verse campaigns available right now. Check back soon for exciting new competitions!
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}
