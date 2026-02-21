import React, { useEffect, useState } from 'react';
import { Play, Heart, Share, Clock, Music2, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { formatMultipleCurrencies } from '../lib/currencyUtils';

interface Campaign {
  _id: string;
  title: string;
  youtubeUrl: string;
  spotifyUrl: string;
  challengeRewardUsd: number;
  challengeRewardUsdt?: number; // For backward compatibility
  challengeRewardJamz: number;
  challengeRewardNgn: number;
  challengeRewardAed: number;
  shareRewardUsd: number;
  shareRewardUsdt?: number; // For backward compatibility
  shareRewardJamz: number;
  shareRewardNgn: number;
  shareRewardAed: number;
  artistId: {
    name: string;
    imageUrl: string;
  };
}

export function TrendingTracks() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      console.log('Fetching campaigns...');

      // Make a direct fetch request to see the raw response
      const response = await fetch('/api/campaigns');
      const rawData = await response.json();
      console.log('Raw API response:', rawData);

      // Continue with the normal API call
      const data = await api.campaigns.list();
      console.log('Processed campaigns from api.campaigns.list():', data);

      // Log reward values for debugging
      console.log('Raw campaign data:', JSON.stringify(data, null, 2));

      data.forEach(campaign => {
        console.log(`Campaign ${campaign.title} rewards:`, {
          challengeRewardUsd: campaign.challengeRewardUsd,
          challengeRewardUsdt: campaign.challengeRewardUsdt,
          shareRewardUsd: campaign.shareRewardUsd,
          shareRewardUsdt: campaign.shareRewardUsdt,
          // Log all properties to see what's actually there
          allProps: Object.keys(campaign),
          // Try different ways to access the values
          directAccess: {
            challengeRewardUsd: campaign.challengeRewardUsd,
            challengeRewardUsdt: campaign.challengeRewardUsdt,
            shareRewardUsd: campaign.shareRewardUsd,
            shareRewardUsdt: campaign.shareRewardUsdt
          },
          bracketAccess: {
            challengeRewardUsd: campaign['challengeRewardUsd'],
            challengeRewardUsdt: campaign['challengeRewardUsdt'],
            shareRewardUsd: campaign['shareRewardUsd'],
            shareRewardUsdt: campaign['shareRewardUsdt']
          },
          total: (campaign.challengeRewardUsd ?? campaign.challengeRewardUsdt ?? 0) +
                 (campaign.shareRewardUsd ?? campaign.shareRewardUsdt ?? 0)
        });
      });

      setCampaigns(data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get total rewards for a campaign
  const getTotalRewards = (campaign: Campaign) => {
    // Use the new field names (Usd) with fallback to old field names (Usdt)
    const challengeReward = campaign.challengeRewardUsd ?? campaign.challengeRewardUsdt ?? 0;
    const shareReward = campaign.shareRewardUsd ?? campaign.shareRewardUsdt ?? 0;
    const totalUsd = challengeReward + shareReward;
    const totalJamz = campaign.challengeRewardJamz + campaign.shareRewardJamz;
    const totalNgn = campaign.challengeRewardNgn + campaign.shareRewardNgn;
    const totalAed = campaign.challengeRewardAed + campaign.shareRewardAed;

    return formatMultipleCurrencies({
      USD: totalUsd,
      JAMZ: totalJamz,
      NGN: totalNgn,
      AED: totalAed
    });
  };

  return (
    <section id="trending-tracks" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="pixel-text text-4xl font-bold mb-4 gradient-text">Trending Campaigns</h2>
          <p className="text-xl text-white/60">Create content with these tracks to earn rewards</p>
        </motion.div>

        {error && (
          <div className="text-center text-red-500 mb-8">
            Failed to load campaigns: {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="aspect-square bg-gray-800" />
                <div className="p-6 space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {campaigns.slice(0, 3).map((campaign, index) => (
              <Link to={`/track/${campaign._id}`} key={campaign._id}>
                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="glass-card overflow-hidden transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(102,0,255,0.3)]">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={campaign.artistId?.imageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.button
                            className="glass-button-primary"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-8 h-8" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-b from-transparent via-black/50 to-black/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1 gradient-text">{campaign.title}</h3>
                          <p className="text-white/60 flex items-center">
                            <Music2 className="w-4 h-4 mr-1" /> {campaign.artistId?.name}
                          </p>
                        </div>
                        <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm">
                          Active
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-white/60 text-sm">
                          Rewards: {getTotalRewards(campaign)}
                        </div>
                        <div className="flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="hover:text-secondary transition-colors"
                          >
                            <Heart className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="hover:text-primary transition-colors"
                          >
                            <Share className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {campaigns.length > 3 && (
          <motion.div
            className="flex justify-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link to="/campaigns">
              <motion.button
                className="glass-button-primary px-12 py-4 text-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore All Campaigns
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
