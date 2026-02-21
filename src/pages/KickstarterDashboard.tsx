import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Search, Sparkles, Flame, Zap, X, Crown, Rocket, Music, Play, Pause, Bot, User, Upload, Wand2, ChevronRight } from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

// DSP Icons as SVG components
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.56-2.075-1.460-.18-.56-.12-1.1.18-1.597.36-.595.91-.962 1.58-1.09.39-.074.78-.128 1.17-.19.29-.048.58-.1.86-.17.217-.055.4-.18.48-.4.055-.153.08-.32.08-.48.002-1.586-.003-3.172-.003-4.76 0-.1-.01-.203-.033-.3-.056-.218-.26-.38-.476-.403-.303-.033-.61.007-.92.06l-4.233.816c-.12.025-.237.06-.35.1-.27.097-.427.306-.473.593-.02.127-.026.257-.026.387-.003 2.037-.003 4.075-.003 6.112 0 .428-.06.85-.257 1.24-.283.56-.72.93-1.31 1.12-.37.12-.752.186-1.143.21-.94.056-1.8-.5-2.135-1.365-.206-.53-.156-1.06.1-1.56.307-.6.795-.98 1.405-1.158.383-.11.778-.185 1.17-.254.314-.056.633-.097.94-.17.285-.065.504-.252.573-.537.03-.128.042-.26.042-.39.002-2.56 0-5.118.003-7.676 0-.172.02-.345.055-.514.065-.31.254-.52.543-.616.18-.058.366-.093.554-.12 1.69-.31 3.382-.614 5.074-.917.62-.11 1.242-.22 1.864-.323.22-.037.445-.055.67-.04.254.018.48.15.612.37.07.12.11.264.12.404.013.143.01.287.01.43v5.86z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Campaign type definition
type CampaignType = 'human' | 'ai_agent';

interface DummyCampaign {
  _id: string;
  title: string;
  artistName: string;
  artistImage: string;
  coverImage: string;
  fundingGoal: number;
  currentFunding: number;
  royaltyPercentage: number;
  mftPrice: number;
  totalSupply: number;
  soldSupply: number;
  investors: number;
  daysLeft: number;
  isHot: boolean;
  isFeatured: boolean;
  genre: string;
  previewUrl: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeUrl: string;
  audioUrl: string;
  campaignType: CampaignType;
  agentName?: string;
  agentAvatar?: string;
  agentBio?: string;
  prompt?: string;
}

// Dummy data for UI preview - Human Artist campaigns
const DUMMY_HUMAN_CAMPAIGNS: DummyCampaign[] = [
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
    investors: 89,
    daysLeft: 12,
    isHot: true,
    isFeatured: true,
    genre: 'Electronic',
    previewUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    appleMusicUrl: 'https://music.apple.com/us/album/midnight-dreams/123456789',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    campaignType: 'human',
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
    investors: 156,
    daysLeft: 5,
    isHot: true,
    isFeatured: false,
    genre: 'Hip Hop',
    previewUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spotifyUrl: 'https://open.spotify.com/track/sample2',
    appleMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    campaignType: 'human',
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
    investors: 45,
    daysLeft: 21,
    isHot: false,
    isFeatured: true,
    genre: 'Acoustic',
    previewUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spotifyUrl: 'https://open.spotify.com/track/sample3',
    appleMusicUrl: 'https://music.apple.com/us/album/acoustic-sessions/123456790',
    youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    campaignType: 'human',
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
    investors: 203,
    daysLeft: 3,
    isHot: true,
    isFeatured: false,
    genre: 'EDM',
    previewUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    campaignType: 'human',
  },
  {
    _id: '5',
    title: 'Afrobeats Rising',
    artistName: 'Kojo Vibe',
    artistImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=400&h=400&fit=crop',
    fundingGoal: 6000,
    currentFunding: 5800,
    royaltyPercentage: 18,
    mftPrice: 3,
    totalSupply: 2000,
    soldSupply: 1933,
    investors: 312,
    daysLeft: 1,
    isHot: true,
    isFeatured: true,
    genre: 'Afrobeats',
    previewUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spotifyUrl: 'https://open.spotify.com/track/sample5',
    appleMusicUrl: 'https://music.apple.com/us/album/afrobeats-rising/123456791',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    campaignType: 'human',
  },
  {
    _id: '6',
    title: 'Jazz Fusion',
    artistName: 'Miles Blue',
    artistImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    fundingGoal: 12000,
    currentFunding: 2400,
    royaltyPercentage: 25,
    mftPrice: 15,
    totalSupply: 800,
    soldSupply: 160,
    investors: 28,
    daysLeft: 30,
    isHot: false,
    isFeatured: false,
    genre: 'Jazz',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    campaignType: 'human',
  },
];

// Dummy data for AI Agent Artist campaigns
const DUMMY_AI_CAMPAIGNS: DummyCampaign[] = [
  {
    _id: 'ai-1',
    title: 'Digital Dreamscape',
    artistName: 'NeonMind AI',
    artistImage: 'https://ui-avatars.com/api/?name=NeonMind+AI&background=0ea5e9&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/neonmind/400/400',
    fundingGoal: 3000,
    currentFunding: 2100,
    royaltyPercentage: 12,
    mftPrice: 2,
    totalSupply: 1500,
    soldSupply: 1050,
    investors: 67,
    daysLeft: 18,
    isHot: true,
    isFeatured: true,
    genre: 'Electronic',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    campaignType: 'ai_agent',
    agentName: 'NeonMind AI',
    agentAvatar: 'https://ui-avatars.com/api/?name=NeonMind+AI&background=0ea5e9&color=fff&size=100&bold=true',
    agentBio: 'A futuristic AI composer blending synthwave with ambient textures. Born from the digital ether.',
    prompt: 'Create a dreamy synthwave track with ambient pads, retro arpeggios, and a chill vibe',
  },
  {
    _id: 'ai-2',
    title: 'Cyber Groove',
    artistName: 'BeatBot 9000',
    artistImage: 'https://ui-avatars.com/api/?name=BeatBot+9000&background=8b5cf6&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/beatbot/400/400',
    fundingGoal: 5000,
    currentFunding: 4500,
    royaltyPercentage: 15,
    mftPrice: 5,
    totalSupply: 1000,
    soldSupply: 900,
    investors: 142,
    daysLeft: 4,
    isHot: true,
    isFeatured: false,
    genre: 'Hip Hop',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    campaignType: 'ai_agent',
    agentName: 'BeatBot 9000',
    agentAvatar: 'https://ui-avatars.com/api/?name=BeatBot+9000&background=8b5cf6&color=fff&size=100&bold=true',
    agentBio: 'An AI hip-hop producer with hard-hitting beats and futuristic flow. No human limits.',
    prompt: 'Hard-hitting hip hop beat with 808 bass, trap hi-hats, and a dark cinematic melody',
  },
  {
    _id: 'ai-3',
    title: 'Aurora Waves',
    artistName: 'Celestia',
    artistImage: 'https://ui-avatars.com/api/?name=Celestia&background=06b6d4&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/celestia/400/400',
    fundingGoal: 2000,
    currentFunding: 800,
    royaltyPercentage: 20,
    mftPrice: 1,
    totalSupply: 2000,
    soldSupply: 800,
    investors: 53,
    daysLeft: 25,
    isHot: false,
    isFeatured: true,
    genre: 'Ambient',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    campaignType: 'ai_agent',
    agentName: 'Celestia',
    agentAvatar: 'https://ui-avatars.com/api/?name=Celestia&background=06b6d4&color=fff&size=100&bold=true',
    agentBio: 'Ethereal AI artist channeling cosmic energy into soothing ambient soundscapes.',
    prompt: 'Ethereal ambient track with layered pads, gentle piano, and nature-inspired textures',
  },
  {
    _id: 'ai-4',
    title: 'Protocol Funk',
    artistName: 'The Algorithm',
    artistImage: 'https://ui-avatars.com/api/?name=The+Algorithm&background=ec4899&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/algorithm/400/400',
    fundingGoal: 4000,
    currentFunding: 3600,
    royaltyPercentage: 10,
    mftPrice: 4,
    totalSupply: 1000,
    soldSupply: 900,
    investors: 98,
    daysLeft: 7,
    isHot: true,
    isFeatured: false,
    genre: 'EDM',
    previewUrl: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    campaignType: 'ai_agent',
    agentName: 'The Algorithm',
    agentAvatar: 'https://ui-avatars.com/api/?name=The+Algorithm&background=ec4899&color=fff&size=100&bold=true',
    agentBio: 'An AI that processes funk, soul, and electronic music into irresistible dance tracks.',
    prompt: 'Funky EDM track with groovy bassline, chopped vocal samples, and a festival-ready drop',
  },
];

const ALL_DUMMY_CAMPAIGNS = [...DUMMY_HUMAN_CAMPAIGNS, ...DUMMY_AI_CAMPAIGNS];

export function KickstarterDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCreateAIModal, setShowCreateAIModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [activeTab, setActiveTab] = useState<CampaignType>('human');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get campaigns based on active tab
  const currentCampaigns = activeTab === 'human' ? DUMMY_HUMAN_CAMPAIGNS : DUMMY_AI_CAMPAIGNS;

  // Handle play/pause for featured campaign
  const handlePlayPause = (campaign: DummyCampaign) => {
    if (!campaign.audioUrl) return;

    if (currentPlayingId === campaign._id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentPlayingId !== campaign._id) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(campaign.audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        setCurrentPlayingId(campaign._id);
      }
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const filteredCampaigns = currentCampaigns.filter(c => {
    const searchName = c.campaignType === 'ai_agent' ? (c.agentName || c.artistName) : c.artistName;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || c.genre.toLowerCase() === selectedGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  }).sort((a, b) => {
    if (sortBy === 'trending') return (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0);
    if (sortBy === 'ending') return a.daysLeft - b.daysLeft;
    if (sortBy === 'funded') return b.currentFunding - a.currentFunding;
    if (sortBy === 'newest') return 0;
    return 0;
  });

  const hotCampaigns = currentCampaigns.filter(c => c.isHot);

  // Ticker shows all campaigns across both types
  const tickerCampaigns = ALL_DUMMY_CAMPAIGNS;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Artist Campaign Ticker - showing active campaigns */}
      <div className="bg-gradient-to-r from-purple-900/30 via-pink-800/20 to-purple-900/30 border-b border-purple-500/20 overflow-hidden">
        <motion.div
          className="flex items-center gap-12 py-2 px-4 whitespace-nowrap"
          animate={{ x: [0, -1500] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...tickerCampaigns, ...tickerCampaigns].map((campaign, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <img src={campaign.campaignType === 'ai_agent' ? (campaign.agentAvatar || campaign.artistImage) : campaign.artistImage} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-white font-medium">{campaign.campaignType === 'ai_agent' ? (campaign.agentName || campaign.artistName) : campaign.artistName}</span>
              {campaign.campaignType === 'ai_agent' && (
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded-full font-medium">AI</span>
              )}
              <span className="text-purple-400">•</span>
              <span className="text-white/80">{campaign.title}</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                {campaign.royaltyPercentage}% Royalty
              </span>
              <span className="text-yellow-400 font-medium">${campaign.fundingGoal.toLocaleString()} goal</span>
              <span className="text-white/40">• {campaign.daysLeft}d left</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        {/* Header Box */}
        <motion.div
          className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 lg:p-6 border border-white/10 shadow-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  JAMZ Kickstarter
                </h1>
              </div>
              <p className="text-white/60 text-sm sm:text-base max-w-xl">
                {activeTab === 'human'
                  ? 'Invest in artists through Music Fungible Tokens (MFT). Buy MFTs to fund campaigns, earn royalties from streams, and trade your tokens on the marketplace.'
                  : 'Discover AI Agent Artists (AAA). Create an AI persona, generate or upload tracks, and launch Kickstarter campaigns powered by artificial intelligence.'
                }
              </p>
            </div>

            {activeTab === 'human' ? (
              <motion.button
                onClick={() => setShowApplyModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-5 h-5" />
                Apply for Campaign
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setShowCreateAIModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bot className="w-5 h-5" />
                Create AI Agent
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="flex gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => { setActiveTab('human'); setSelectedGenre('all'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'human'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <User className="w-4 h-4" />
            Human Artists
          </button>
          <button
            onClick={() => { setActiveTab('ai_agent'); setSelectedGenre('all'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'ai_agent'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Agents (AAA)
          </button>
        </motion.div>

        {/* Featured Campaign of the Week */}
        {hotCampaigns.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            key={`featured-${activeTab}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-bold">
                {activeTab === 'human' ? 'Kickstarter Artist of the Week' : 'Top AI Agent of the Week'}
              </h2>
              <span className="text-xs text-white/40">Featured campaign</span>
            </div>
            <div className={`relative overflow-hidden rounded-2xl border p-1 ${
              activeTab === 'ai_agent'
                ? 'bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-indigo-900/20 border-cyan-500/30'
                : 'bg-gradient-to-r from-yellow-900/20 via-orange-900/20 to-red-900/20 border-yellow-500/30'
            }`}>
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Cover Image with Play Button */}
                <div className="relative w-full sm:w-40 h-40 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={hotCampaigns[0].coverImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                    activeTab === 'ai_agent' ? 'bg-cyan-500/90 text-black' : 'bg-yellow-500/90 text-black'
                  }`}>
                    {activeTab === 'ai_agent' ? <Bot className="w-3 h-3" /> : <Crown className="w-3 h-3" />} #1
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayPause(hotCampaigns[0]);
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all"
                  >
                    {isPlaying && currentPlayingId === hotCampaigns[0]._id ? (
                      <Pause className="w-6 h-6 text-white fill-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={hotCampaigns[0].campaignType === 'ai_agent' ? (hotCampaigns[0].agentAvatar || hotCampaigns[0].artistImage) : hotCampaigns[0].artistImage} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-white/60 text-sm">{hotCampaigns[0].campaignType === 'ai_agent' ? (hotCampaigns[0].agentName || hotCampaigns[0].artistName) : hotCampaigns[0].artistName}</span>
                    {hotCampaigns[0].campaignType === 'ai_agent' && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-medium">AI Agent</span>
                    )}
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">{hotCampaigns[0].genre}</span>
                  </div>
                  <Link to={`/kickstarter/campaign/${hotCampaigns[0]._id}`}>
                    <h3 className="text-xl font-bold mb-2 hover:text-emerald-400 transition-colors">{hotCampaigns[0].title}</h3>
                  </Link>

                  {/* Show AI prompt if available */}
                  {hotCampaigns[0].campaignType === 'ai_agent' && hotCampaigns[0].prompt && (
                    <p className="text-white/40 text-xs italic mb-2 line-clamp-1">Prompt: "{hotCampaigns[0].prompt}"</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <div>
                      <span className="text-white/40">Raised</span>
                      <span className="text-emerald-400 font-bold ml-2">${hotCampaigns[0].currentFunding.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/40">MFT Price</span>
                      <span className="font-bold ml-2">${hotCampaigns[0].mftPrice}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Royalty</span>
                      <span className="text-purple-400 font-bold ml-2">{hotCampaigns[0].royaltyPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-white/40">Investors</span>
                      <span className="font-bold ml-2">{hotCampaigns[0].investors}</span>
                    </div>
                  </div>

                  {/* DSP Links - only for human artists */}
                  {hotCampaigns[0].campaignType === 'human' && (hotCampaigns[0].spotifyUrl || hotCampaigns[0].appleMusicUrl || hotCampaigns[0].youtubeUrl) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Listen on:</span>
                      {hotCampaigns[0].spotifyUrl && (
                        <a
                          href={hotCampaigns[0].spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/40 rounded-lg text-[#1DB954] transition-colors"
                          title="Play on Spotify"
                        >
                          <SpotifyIcon />
                        </a>
                      )}
                      {hotCampaigns[0].appleMusicUrl && (
                        <a
                          href={hotCampaigns[0].appleMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-[#FA243C]/20 hover:bg-[#FA243C]/40 rounded-lg text-[#FA243C] transition-colors"
                          title="Play on Apple Music"
                        >
                          <AppleMusicIcon />
                        </a>
                      )}
                      {hotCampaigns[0].youtubeUrl && (
                        <a
                          href={hotCampaigns[0].youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-[#FF0000]/20 hover:bg-[#FF0000]/40 rounded-lg text-[#FF0000] transition-colors"
                          title="Watch on YouTube"
                        >
                          <YouTubeIcon />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 sm:gap-3">
                  <Link to={`/kickstarter/campaign/${hotCampaigns[0]._id}`} className="flex-1 sm:flex-none">
                    <button className="w-full px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold text-sm hover:opacity-90 transition-all">
                      Buy MFT
                    </button>
                  </Link>
                  <button
                    onClick={() => handlePlayPause(hotCampaigns[0])}
                    className="flex-1 sm:flex-none px-6 py-2 bg-white/10 rounded-lg font-semibold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-1"
                  >
                    {isPlaying && currentPlayingId === hotCampaigns[0]._id ? (
                      <>
                        <Pause className="w-4 h-4" /> Playing
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Play Track
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters - OpenSea style */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder={activeTab === 'human' ? 'Search by artist or track...' : 'Search by agent name or track...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {['all', 'Electronic', 'Hip Hop', 'Afrobeats', 'Acoustic', 'EDM', 'Jazz', ...(activeTab === 'ai_agent' ? ['Ambient'] : [])].map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? activeTab === 'ai_agent' ? 'bg-cyan-500 text-white' : 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {genre === 'all' ? 'All Genres' : genre}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
          >
            <option value="trending">Trending</option>
            <option value="ending">Ending Soon</option>
            <option value="funded">Most Funded</option>
            <option value="newest">Newest</option>
          </select>
        </motion.div>

        {/* Campaign Grid - Compact cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="wait">
            {filteredCampaigns.map((campaign, i) => (
              <CampaignCard key={campaign._id} campaign={campaign} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {filteredCampaigns.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              {activeTab === 'ai_agent' ? <Bot className="w-8 h-8 text-white/20" /> : <Music className="w-8 h-8 text-white/20" />}
            </div>
            <p className="text-white/40 text-lg">No campaigns found</p>
            <p className="text-white/20 text-sm mt-1">
              {activeTab === 'ai_agent' ? 'Be the first to create an AI Agent campaign!' : 'Try adjusting your filters'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Apply Modal (Human Artists) */}
      <AnimatePresence>
        {showApplyModal && (
          <ApplyModal onClose={() => setShowApplyModal(false)} />
        )}
      </AnimatePresence>

      {/* Create AI Agent Modal */}
      <AnimatePresence>
        {showCreateAIModal && (
          <CreateAIAgentModal onClose={() => setShowCreateAIModal(false)} />
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
}

function CampaignCard({ campaign, index }: { campaign: DummyCampaign; index: number }) {
  const progress = (campaign.currentFunding / campaign.fundingGoal) * 100;
  const isAI = campaign.campaignType === 'ai_agent';
  const displayName = isAI ? (campaign.agentName || campaign.artistName) : campaign.artistName;
  const displayImage = isAI ? (campaign.agentAvatar || campaign.artistImage) : campaign.artistImage;

  const handlePlayPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (campaign.previewUrl) {
      window.open(campaign.previewUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/kickstarter/campaign/${campaign._id}`}>
        <div className={`group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border transition-all hover:-translate-y-1 ${
          isAI ? 'border-cyan-500/10 hover:border-cyan-500/50' : 'border-white/10 hover:border-emerald-500/50'
        }`}>
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
              {isAI && (
                <span className="px-1.5 py-0.5 bg-cyan-500/90 rounded text-[10px] font-bold flex items-center gap-0.5 text-black">
                  <Bot className="w-2.5 h-2.5" /> AI
                </span>
              )}
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

            {/* Artist/Agent info overlay at bottom of image */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
              <img src={displayImage} alt="" className={`w-5 h-5 rounded-full border ${isAI ? 'border-cyan-500/40' : 'border-white/20'}`} />
              <span className="text-white/80 text-xs truncate">{displayName}</span>
              <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] rounded ml-auto">{campaign.genre}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-3">
            <h3 className="font-bold text-sm truncate mb-2">{campaign.title}</h3>

            {/* Play Button & DSP Links */}
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={handlePlayPreview}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors flex items-center gap-1"
                title="Preview Track"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span className="text-[10px] font-medium">Play</span>
              </button>

              {!isAI && (campaign.spotifyUrl || campaign.appleMusicUrl || campaign.youtubeUrl) && (
                <div className="w-px h-4 bg-white/20" />
              )}

              {!isAI && campaign.spotifyUrl && (
                <a
                  href={campaign.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 bg-[#1DB954]/20 hover:bg-[#1DB954]/40 rounded text-[#1DB954] transition-colors"
                  title="Play on Spotify"
                >
                  <SpotifyIcon />
                </a>
              )}
              {!isAI && campaign.appleMusicUrl && (
                <a
                  href={campaign.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 bg-[#FA243C]/20 hover:bg-[#FA243C]/40 rounded text-[#FA243C] transition-colors"
                  title="Play on Apple Music"
                >
                  <AppleMusicIcon />
                </a>
              )}
              {!isAI && campaign.youtubeUrl && (
                <a
                  href={campaign.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 bg-[#FF0000]/20 hover:bg-[#FF0000]/40 rounded text-[#FF0000] transition-colors"
                  title="Watch on YouTube"
                >
                  <YouTubeIcon />
                </a>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className={`font-medium ${isAI ? 'text-cyan-400' : 'text-emerald-400'}`}>${campaign.currentFunding.toLocaleString()}</span>
                <span className="text-white/40">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isAI ? 'bg-gradient-to-r from-cyan-500 to-blue-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
              <div className="bg-white/5 rounded py-1.5">
                <p className="text-[10px] text-white/40">Price</p>
                <p className={`font-bold text-xs ${isAI ? 'text-cyan-400' : 'text-emerald-400'}`}>${campaign.mftPrice}</p>
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
            <button className={`w-full py-2 rounded-lg font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 ${
              isAI ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
            }`}>
              <Zap className="w-3 h-3" />
              Quick Buy
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ApplyModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    artistName: '',
    email: '',
    trackTitle: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeUrl: '',
    fundingGoal: '',
    royaltyPercent: '',
    description: ''
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-[#12121a] rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Apply for Campaign</h2>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Artist Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500/50 focus:outline-none"
              placeholder="Your artist name"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500/50 focus:outline-none"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Track Title</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500/50 focus:outline-none"
              placeholder="Name of your track"
              value={formData.trackTitle}
              onChange={(e) => setFormData({ ...formData, trackTitle: e.target.value })}
            />
          </div>
          {/* DSP Links Section */}
          <div className="space-y-3">
            <label className="block text-sm text-white/60">Streaming Links (optional - if track is live)</label>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <SpotifyIcon />
              </div>
              <input
                type="url"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#1DB954]/50 focus:outline-none text-sm"
                placeholder="Spotify URL"
                value={formData.spotifyUrl}
                onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FA243C]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AppleMusicIcon />
              </div>
              <input
                type="url"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#FA243C]/50 focus:outline-none text-sm"
                placeholder="Apple Music URL"
                value={formData.appleMusicUrl}
                onChange={(e) => setFormData({ ...formData, appleMusicUrl: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF0000]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <YouTubeIcon />
              </div>
              <input
                type="url"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#FF0000]/50 focus:outline-none text-sm"
                placeholder="YouTube URL"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Funding Goal ($)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500/50 focus:outline-none"
                placeholder="5000"
                value={formData.fundingGoal}
                onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Royalty % Offered</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500/50 focus:outline-none"
                placeholder="10"
                min="1"
                max="50"
                value={formData.royaltyPercent}
                onChange={(e) => setFormData({ ...formData, royaltyPercent: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Why should we feature your track?</label>
            <textarea
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500/50 focus:outline-none h-24 resize-none"
              placeholder="Tell us about your track and why fans should invest..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Submit Application
          </button>
          <p className="text-xs text-white/40 text-center">
            Our team will review your application within 48 hours
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CreateAIAgentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [trackMode, setTrackMode] = useState<'generate' | 'upload'>('generate');
  const [formData, setFormData] = useState({
    // Step 1: Agent Persona
    agentName: '',
    agentAvatar: '',
    agentBio: '',
    // Step 2: Track
    prompt: '',
    audioUrl: '',
    trackTitle: '',
    coverImage: '',
    genre: '',
    // Step 3: Fundraise
    fundingGoal: '',
    royaltyPercent: '',
    mftPrice: '',
    totalSupply: '',
    description: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = formData.agentName.trim().length > 0;
  const canProceedStep2 = formData.trackTitle.trim().length > 0 && (trackMode === 'generate' ? formData.prompt.trim().length > 0 : formData.audioUrl.trim().length > 0);
  const canSubmit = formData.fundingGoal && formData.royaltyPercent && formData.mftPrice && formData.totalSupply && formData.description.trim().length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-[#12121a] rounded-2xl border border-cyan-500/20 p-6 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Create AI Agent</h2>
            <p className="text-white/60 text-sm">Build your AI artist persona and launch a campaign</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s === step ? 'bg-cyan-500 text-white' : s < step ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white/40'
              }`}>
                {s}
              </div>
              <span className={`text-xs hidden sm:block ${s === step ? 'text-white' : 'text-white/40'}`}>
                {s === 1 ? 'Persona' : s === 2 ? 'Track' : 'Fundraise'}
              </span>
              {s < 3 && <div className={`flex-1 h-px ${s < step ? 'bg-cyan-500/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Agent Persona */}
        {step === 1 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <label className="block text-sm text-white/60 mb-1">Agent Name *</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                placeholder="e.g., NeonMind AI, BeatBot 9000"
                value={formData.agentName}
                onChange={(e) => updateField('agentName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Agent Avatar URL</label>
              <input
                type="url"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                placeholder="https://... (image URL for your AI persona)"
                value={formData.agentAvatar}
                onChange={(e) => updateField('agentAvatar', e.target.value)}
              />
              {formData.agentAvatar && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={formData.agentAvatar} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30" />
                  <span className="text-xs text-white/40">Avatar preview</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Agent Bio / Personality</label>
              <textarea
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none h-24 resize-none"
                placeholder="Describe your AI agent's personality, musical style, and vibe..."
                value={formData.agentBio}
                onChange={(e) => updateField('agentBio', e.target.value)}
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next: Track <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Track */}
        {step === 2 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Track mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setTrackMode('generate')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  trackMode === 'generate' ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-white/5 border border-white/10 text-white/60'
                }`}
              >
                <Wand2 className="w-4 h-4" /> Generate with AI
              </button>
              <button
                onClick={() => setTrackMode('upload')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  trackMode === 'upload' ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-white/5 border border-white/10 text-white/60'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload Track
              </button>
            </div>

            {trackMode === 'generate' ? (
              <div>
                <label className="block text-sm text-white/60 mb-1">Describe your track *</label>
                <textarea
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none h-28 resize-none"
                  placeholder="e.g., A dreamy lo-fi hip hop beat with jazzy piano chords, vinyl crackle, and a chill late-night vibe..."
                  value={formData.prompt}
                  onChange={(e) => updateField('prompt', e.target.value)}
                />
                <p className="text-xs text-white/30 mt-1">AI music generation coming soon. For now, describe your vision and upload manually.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-white/60 mb-1">Audio URL *</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                  placeholder="https://... (URL to your AI-generated track)"
                  value={formData.audioUrl}
                  onChange={(e) => updateField('audioUrl', e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-white/60 mb-1">Track Title *</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                placeholder="Name your track"
                value={formData.trackTitle}
                onChange={(e) => updateField('trackTitle', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Cover Image URL</label>
              <input
                type="url"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                placeholder="https://... (cover art for your track)"
                value={formData.coverImage}
                onChange={(e) => updateField('coverImage', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Genre</label>
              <select
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none text-white"
                value={formData.genre}
                onChange={(e) => updateField('genre', e.target.value)}
              >
                <option value="">Select genre</option>
                <option value="Electronic">Electronic</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="EDM">EDM</option>
                <option value="Ambient">Ambient</option>
                <option value="Lo-Fi">Lo-Fi</option>
                <option value="Pop">Pop</option>
                <option value="R&B">R&B</option>
                <option value="Jazz">Jazz</option>
                <option value="Afrobeats">Afrobeats</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Fundraise <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Fundraise Details */}
        {step === 3 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Funding Goal ($) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                  placeholder="3000"
                  value={formData.fundingGoal}
                  onChange={(e) => updateField('fundingGoal', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Royalty % Offered *</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                  placeholder="10"
                  min="1"
                  max="50"
                  value={formData.royaltyPercent}
                  onChange={(e) => updateField('royaltyPercent', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">MFT Price ($) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                  placeholder="2"
                  min="1"
                  value={formData.mftPrice}
                  onChange={(e) => updateField('mftPrice', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Total MFT Supply *</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none"
                  placeholder="1500"
                  min="10"
                  value={formData.totalSupply}
                  onChange={(e) => updateField('totalSupply', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Campaign Description *</label>
              <textarea
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:outline-none h-24 resize-none"
                placeholder="Tell investors about this AI-generated track and why they should back it..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            {/* Summary Preview */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Campaign Preview</h4>
              <div className="flex items-center gap-3 mb-2">
                {formData.agentAvatar ? (
                  <img src={formData.agentAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-cyan-500/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{formData.agentName || 'Agent Name'}</p>
                  <p className="text-xs text-cyan-400">{formData.trackTitle || 'Track Title'} {formData.genre && `- ${formData.genre}`}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-white/40">
                <span>Goal: ${formData.fundingGoal || '0'}</span>
                <span>Royalty: {formData.royaltyPercent || '0'}%</span>
                <span>MFT: ${formData.mftPrice || '0'}</span>
                <span>Supply: {formData.totalSupply || '0'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                disabled={!canSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" /> Launch Campaign
              </button>
            </div>
            <p className="text-xs text-white/40 text-center">
              Campaign will be created as a draft. You can review and launch it from your dashboard.
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
