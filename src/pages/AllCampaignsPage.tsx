import React, { useEffect, useState } from 'react';
import { Play, Heart, Share, Search, Music2, Filter, ArrowDown, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

interface Campaign {
  _id: string;
  title: string;
  youtubeUrl: string;
  spotifyUrl: string;
  challengeRewardUsd: number;
  challengeRewardJamz: number;
  shareRewardUsd: number;
  shareRewardJamz: number;
  artistId: {
    name: string;
    imageUrl: string;
  };
}

export function AllCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.campaigns.list();
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
    const totalUsd = campaign.challengeRewardUsd + campaign.shareRewardUsd;
    const totalJamz = campaign.challengeRewardJamz + campaign.shareRewardJamz;
    return `${totalUsd} USD + ${totalJamz} JAMZ`;
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.artistId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort campaigns - if filter is active, show highest rewards first
  const sortedCampaigns = filterActive
    ? [...filteredCampaigns].sort((a, b) =>
        (b.challengeRewardUsd + b.shareRewardUsd) -
        (a.challengeRewardUsd + a.shareRewardUsd)
      )
    : filteredCampaigns;

  return (
    <div className="py-20 min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="pixel-text text-5xl font-bold mb-4 gradient-text">All Artist Campaigns</h1>
          <p className="text-xl text-white/70">Discover and create content with these tracks to earn rewards</p>
        </motion.div>

        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by artist or track title..."
                className="pl-10 pr-4 py-3 w-full rounded-lg border border-purple-500/30 bg-black/60 backdrop-blur-sm text-white shadow-lg shadow-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-10">
                <Search className="text-purple-400 w-5 h-5" />
              </div>
            </div>

            <motion.button
              className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all ${filterActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-black/60 border border-purple-500/30 text-white/80'}`}
              onClick={() => setFilterActive(!filterActive)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {filterActive ? <Sparkles className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              <span>{filterActive ? 'Highest Rewards' : 'Filter by Reward'}</span>
            </motion.button>
          </div>

          {/* Results count */}
          <div className="mt-4 text-white/60 text-sm flex items-center justify-between">
            <div>
              {!loading && (
                <>
                  {sortedCampaigns.length} {sortedCampaigns.length === 1 ? 'campaign' : 'campaigns'} found
                  {searchTerm && <span> for "{searchTerm}"</span>}
                </>
              )}
            </div>
            {filterActive && (
              <div className="flex items-center gap-1 text-purple-400">
                <ArrowDown className="w-3 h-3" /> Sorted by highest rewards
              </div>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="text-center text-red-500 mb-8 p-4 glass-card">
            Failed to load campaigns: {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="aspect-[3/4] bg-gray-800/30" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-800/30 rounded w-3/4" />
                  <div className="h-3 bg-gray-800/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedCampaigns.length === 0 ? (
          <motion.div
            className="text-center bg-black/40 border border-purple-500/20 rounded-xl p-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-white/70 mb-4 text-lg">
              {searchTerm ? 'No matching campaigns found' : 'No campaigns available yet'}
            </div>
            {searchTerm && (
              <motion.button
                className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow-lg shadow-purple-500/20"
                onClick={() => setSearchTerm('')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Search
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {sortedCampaigns.map((campaign, index) => (
              <Link to={`/track/${campaign._id}`} key={campaign._id}>
                <motion.div
                  className="group relative h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="bg-black/40 border border-white/5 overflow-hidden rounded-lg h-full shadow-sm shadow-purple-500/5 transition-all duration-300 group-hover:shadow-purple-500/20 group-hover:border-purple-500/30">
                    <div className="relative aspect-square">
                      <img
                        src={campaign.artistId?.imageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.button
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600/90 text-white"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-5 h-5 ml-1" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Reward badge */}
                      {(campaign.challengeRewardUsd + campaign.shareRewardUsd > 0 || campaign.challengeRewardJamz + campaign.shareRewardJamz > 0) && (
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-1 text-xs text-white flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          <span>
                            {campaign.challengeRewardUsd + campaign.shareRewardUsd > 0 && `${campaign.challengeRewardUsd + campaign.shareRewardUsd} USD`}
                            {campaign.challengeRewardUsd + campaign.shareRewardUsd > 0 && campaign.challengeRewardJamz + campaign.shareRewardJamz > 0 && ' + '}
                            {campaign.challengeRewardJamz + campaign.shareRewardJamz > 0 && `${campaign.challengeRewardJamz + campaign.shareRewardJamz} JAMZ`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2">
                      <h3 className="text-xs font-bold text-white truncate">{campaign.title}</h3>
                      <p className="text-white/60 text-xs truncate">{campaign.artistId?.name}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && sortedCampaigns.length > 0 && (
          <div className="flex justify-center mt-12">
            <Link to="/">
              <motion.button
                className="px-8 py-3 bg-black/40 text-white/80 border border-white/10 rounded-lg hover:bg-black/60 hover:border-purple-500/30 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Home
              </motion.button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
