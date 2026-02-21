import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, DollarSign, Music2, Percent, Flame, Zap, Play, Crown } from 'lucide-react';
import { KickstarterWaitlistModal } from './KickstarterWaitlistModal';

// DSP Icons
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.56-2.075-1.460-.18-.56-.12-1.1.18-1.597.36-.595.91-.962 1.58-1.09.39-.074.78-.128 1.17-.19.29-.048.58-.1.86-.17.217-.055.4-.18.48-.4.055-.153.08-.32.08-.48.002-1.586-.003-3.172-.003-4.76 0-.1-.01-.203-.033-.3-.056-.218-.26-.38-.476-.403-.303-.033-.61.007-.92.06l-4.233.816c-.12.025-.237.06-.35.1-.27.097-.427.306-.473.593-.02.127-.026.257-.026.387-.003 2.037-.003 4.075-.003 6.112 0 .428-.06.85-.257 1.24-.283.56-.72.93-1.31 1.12-.37.12-.752.186-1.143.21-.94.056-1.8-.5-2.135-1.365-.206-.53-.156-1.06.1-1.56.307-.6.795-.98 1.405-1.158.383-.11.778-.185 1.17-.254.314-.056.633-.097.94-.17.285-.065.504-.252.573-.537.03-.128.042-.26.042-.39.002-2.56 0-5.118.003-7.676 0-.172.02-.345.055-.514.065-.31.254-.52.543-.616.18-.058.366-.093.554-.12 1.69-.31 3.382-.614 5.074-.917.62-.11 1.242-.22 1.864-.323.22-.037.445-.055.67-.04.254.018.48.15.612.37.07.12.11.264.12.404.013.143.01.287.01.43v5.86z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Preview campaign data
const PREVIEW_CAMPAIGNS = [
  {
    _id: '1',
    title: 'Midnight Dreams EP',
    artistName: 'Luna Wave',
    artistImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    fundingGoal: 10000,
    currentFunding: 7500,
    royaltyPercentage: 15,
    mftPrice: 5,
    totalSupply: 2000,
    soldSupply: 1500,
    daysLeft: 12,
    isHot: true,
    isFeatured: true,
    genre: 'Electronic',
    spotifyUrl: '#',
    appleMusicUrl: '#',
    youtubeUrl: '#',
  },
  {
    _id: '2',
    title: 'Street Anthem',
    artistName: 'King Blaze',
    artistImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    fundingGoal: 5000,
    currentFunding: 4200,
    royaltyPercentage: 10,
    mftPrice: 2,
    totalSupply: 2500,
    soldSupply: 2100,
    daysLeft: 5,
    isHot: true,
    isFeatured: false,
    genre: 'Hip Hop',
    spotifyUrl: '#',
    appleMusicUrl: '',
    youtubeUrl: '#',
  },
  {
    _id: '3',
    title: 'Acoustic Sessions',
    artistName: 'Sarah Keys',
    artistImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
    fundingGoal: 8000,
    currentFunding: 3200,
    royaltyPercentage: 20,
    mftPrice: 8,
    totalSupply: 1000,
    soldSupply: 400,
    daysLeft: 21,
    isHot: false,
    isFeatured: true,
    genre: 'Acoustic',
    spotifyUrl: '#',
    appleMusicUrl: '#',
    youtubeUrl: '',
  },
  {
    _id: '4',
    title: 'Neon Nights',
    artistName: 'DJ Pulse',
    artistImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    fundingGoal: 15000,
    currentFunding: 12000,
    royaltyPercentage: 12,
    mftPrice: 10,
    totalSupply: 1500,
    soldSupply: 1200,
    daysLeft: 8,
    isHot: true,
    isFeatured: false,
    genre: 'EDM',
    spotifyUrl: '#',
    appleMusicUrl: '#',
    youtubeUrl: '#',
  },
];

// Preview Campaign Card Component
function PreviewCampaignCard({ campaign, index }: { campaign: typeof PREVIEW_CAMPAIGNS[0]; index: number }) {
  const progress = (campaign.currentFunding / campaign.fundingGoal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all hover:-translate-y-1 cursor-pointer">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {campaign.isHot && (
              <span className="px-1.5 py-0.5 bg-orange-500/90 rounded text-[10px] font-bold flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" /> HOT
              </span>
            )}
            {campaign.isFeatured && (
              <span className="px-1.5 py-0.5 bg-purple-500/90 rounded text-[10px] font-bold">
                FEATURED
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px]">
              {campaign.royaltyPercentage}% Royalty
            </span>
          </div>

          {/* Artist info overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
            <img src={campaign.artistImage} alt="" className="w-5 h-5 rounded-full border border-white/20" />
            <span className="text-white/80 text-xs truncate">{campaign.artistName}</span>
            <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded ml-auto">{campaign.genre}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-bold text-sm truncate mb-2">{campaign.title}</h3>

          {/* Play Button & DSP Links */}
          <div className="flex items-center gap-1.5 mb-2">
            <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors flex items-center gap-1">
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="text-[10px] font-medium">Play</span>
            </button>
            <div className="w-px h-4 bg-white/20" />
            {campaign.spotifyUrl && (
              <span className="p-1 bg-[#1DB954]/20 rounded text-[#1DB954]">
                <SpotifyIcon />
              </span>
            )}
            {campaign.appleMusicUrl && (
              <span className="p-1 bg-[#FA243C]/20 rounded text-[#FA243C]">
                <AppleMusicIcon />
              </span>
            )}
            {campaign.youtubeUrl && (
              <span className="p-1 bg-[#FF0000]/20 rounded text-[#FF0000]">
                <YouTubeIcon />
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-emerald-400 font-medium">${campaign.currentFunding.toLocaleString()}</span>
              <span className="text-white/40">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(100, progress)}%` }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
            <div className="bg-white/5 rounded py-1.5">
              <p className="text-[10px] text-white/40">Price</p>
              <p className="font-bold text-xs text-emerald-400">${campaign.mftPrice}</p>
            </div>
            <div className="bg-white/5 rounded py-1.5">
              <p className="text-[10px] text-white/40">Sold</p>
              <p className="font-bold text-xs">{campaign.soldSupply}/{campaign.totalSupply}</p>
            </div>
            <div className="bg-white/5 rounded py-1.5">
              <p className="text-[10px] text-white/40">Left</p>
              <p className={`font-bold text-xs ${campaign.daysLeft <= 3 ? 'text-red-400' : ''}`}>{campaign.daysLeft}d</p>
            </div>
          </div>

          {/* Quick Buy Button */}
          <button className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3" />
            Quick Buy
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const KickstarterSection = React.memo(function KickstarterSection() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const handleOpenWaitlist = useCallback(() => {
    setShowWaitlistModal(true);
  }, []);

  const handleCloseWaitlist = useCallback(() => {
    setShowWaitlistModal(false);
  }, []);

  const featuredCampaign = PREVIEW_CAMPAIGNS[0];

  return (
    <section id="kickstarter" className="py-12 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-900/20 via-black to-black" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 md:mb-12 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-900/20 border border-emerald-500/30">
              <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Coming Soon</span>
            </div>
          </div>
          <h2 className="pixel-text text-3xl md:text-4xl font-bold mb-4 md:mb-6 gradient-text">
            Kickstarter
          </h2>
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-base md:text-lg text-white/60 leading-relaxed">
              Invest in artists you believe in and earn a share of their future royalties.
            </p>
            <p className="text-base md:text-lg text-white/70 leading-relaxed">
              Support music, earn returns.
            </p>
          </div>
        </div>

        {/* Featured Campaign Preview */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold">Featured Campaign Preview</h3>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-900/20 via-orange-900/20 to-red-900/20 border border-yellow-500/30 p-1">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Cover Image */}
              <div className="relative w-full sm:w-40 h-40 rounded-xl overflow-hidden flex-shrink-0">
                <img src={featuredCampaign.coverImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-yellow-500/90 rounded text-xs font-bold text-black">
                  <Crown className="w-3 h-3" /> #1
                </div>
                <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <img src={featuredCampaign.artistImage} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-white/60 text-sm">{featuredCampaign.artistName}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">{featuredCampaign.genre}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{featuredCampaign.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm mb-3">
                  <div>
                    <span className="text-white/40">Raised</span>
                    <span className="text-emerald-400 font-bold ml-2">${featuredCampaign.currentFunding.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Goal</span>
                    <span className="text-white font-bold ml-2">${featuredCampaign.fundingGoal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Royalty</span>
                    <span className="text-purple-400 font-bold ml-2">{featuredCampaign.royaltyPercentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(featuredCampaign.currentFunding / featuredCampaign.fundingGoal) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Campaign Cards Grid Preview */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Active Campaigns Preview
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PREVIEW_CAMPAIGNS.map((campaign, index) => (
              <PreviewCampaignCard key={campaign._id} campaign={campaign} index={index} />
            ))}
          </div>
        </div>

        {/* How It Works - Combined Section */}
        <div className="glass-card p-4 sm:p-8 overflow-hidden relative mb-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-600/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-600/20 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 text-center">
              How It Works
            </h3>
            <p className="text-white/50 text-sm text-center mb-6 max-w-2xl mx-auto">
              A royalty-sharing platform for human artists and AI Agent Artists (AAAs)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For Artists */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-semibold">For Artists</h4>
                </div>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Set your funding goal and royalty percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Raise capital from fans who believe in your music</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Share your success as your catalogue grows</span>
                  </li>
                </ul>
              </div>

              {/* For Fans */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold">For Fans</h4>
                </div>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>Browse and invest in artists you believe in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>Receive royalty payments as their music earns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>Build a portfolio of music you helped fund</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card p-6 md:p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-600/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-600/20 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col justify-center text-center">
            <h3 className="text-2xl font-bold mb-4">
              Be the First to Invest in Music's Future
            </h3>
            <p className="text-white/60 mb-6 max-w-3xl mx-auto">
              Join our waitlist to be notified when Kickstarter launches. Be among the first to invest in artists and earn royalty returns.
            </p>
            <button
              className="glass-button-primary px-6 py-3 mx-auto group hover:scale-105 transition-transform"
              onClick={handleOpenWaitlist}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Join the Waitlist
            </button>
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      <KickstarterWaitlistModal
        isOpen={showWaitlistModal}
        onClose={handleCloseWaitlist}
      />
    </section>
  );
});

