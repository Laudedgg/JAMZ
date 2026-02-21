import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Users, Percent, Clock, Music, Play, Pause,
  Minus, Plus, Loader2, MessageCircle, Send, Trophy, Gift, Share2,
  Copy, CheckCircle, X, ExternalLink, Volume2, VolumeX, Bot
} from 'lucide-react';
import { kickstarterApi, MFTCampaign, MFTTransaction, MFTHolding, CampaignComment } from '../lib/kickstarterApi';
import { PageLoader } from '../components/LoadingSpinner';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuthStore } from '../lib/auth';

// DSP Icons
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.56-2.075-1.46-.18-.56-.12-1.1.18-1.597.36-.595.91-.962 1.58-1.09.39-.074.78-.128 1.17-.19.29-.048.58-.1.86-.17.217-.055.4-.18.48-.4.055-.153.08-.32.08-.48.002-1.586-.003-3.172-.003-4.76 0-.1-.01-.203-.033-.3-.056-.218-.26-.38-.476-.403-.303-.033-.61.007-.92.06l-4.233.816c-.12.025-.237.06-.35.1-.27.097-.427.306-.473.593-.02.127-.026.257-.026.387-.003 2.037-.003 4.075-.003 6.112 0 .428-.06.85-.257 1.24-.283.56-.72.93-1.31 1.12-.37.12-.752.186-1.143.21-.94.056-1.8-.5-2.135-1.365-.206-.53-.156-1.06.1-1.56.307-.6.795-.98 1.405-1.158.383-.11.778-.185 1.17-.254.314-.056.633-.097.94-.17.285-.065.504-.252.573-.537.03-.128.042-.26.042-.39.002-2.56 0-5.118.003-7.676 0-.172.02-.345.055-.514.065-.31.254-.52.543-.616.18-.058.366-.093.554-.12 1.69-.31 3.382-.614 5.074-.917.62-.11 1.242-.22 1.864-.323.22-.037.445-.055.67-.04.254.018.48.15.612.37.07.12.11.264.12.404.013.143.01.287.01.43v5.86z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Dummy campaigns for fallback when API campaigns don't exist
const DUMMY_CAMPAIGNS = [
  {
    _id: '1', title: 'Midnight Dreams EP', artistName: 'Luna Wave', genre: 'Electronic',
    artistImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    fundingGoal: 10000, currentFunding: 7500, royaltyPercentage: 15, mftPrice: 5,
    totalSupply: 2000, soldSupply: 1500, investors: 89, daysLeft: 12,
    description: 'Support Luna Wave\'s debut EP "Midnight Dreams" — a sonic journey through ambient electronic landscapes. Your MFT gives you a share of streaming royalties forever.',
    spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    appleMusicUrl: 'https://music.apple.com/us/album/midnight-dreams/123456789',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    _id: '2', title: 'Street Anthem', artistName: 'King Blaze', genre: 'Hip Hop',
    artistImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    fundingGoal: 5000, currentFunding: 4200, royaltyPercentage: 10, mftPrice: 2,
    totalSupply: 2500, soldSupply: 2100, investors: 156, daysLeft: 5,
    description: 'King Blaze is dropping the hardest anthem of the year. Get your MFTs early and earn royalties from every stream.',
    spotifyUrl: 'https://open.spotify.com/track/sample2', appleMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    _id: '3', title: 'Acoustic Sessions', artistName: 'Sarah Keys', genre: 'Acoustic',
    artistImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
    fundingGoal: 8000, currentFunding: 3200, royaltyPercentage: 20, mftPrice: 8,
    totalSupply: 1000, soldSupply: 400, investors: 45, daysLeft: 21,
    description: 'Raw, intimate acoustic recordings from Sarah Keys. This project is fully independent — your support goes directly to the artist.',
    spotifyUrl: 'https://open.spotify.com/track/sample3',
    appleMusicUrl: 'https://music.apple.com/us/album/acoustic-sessions/123456790',
    youtubeUrl: '', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    _id: '4', title: 'Neon Nights', artistName: 'DJ Pulse', genre: 'EDM',
    artistImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    fundingGoal: 15000, currentFunding: 12000, royaltyPercentage: 12, mftPrice: 10,
    totalSupply: 1500, soldSupply: 1200, investors: 203, daysLeft: 3,
    description: 'DJ Pulse brings you into the neon-lit world of underground EDM. Own a piece of this track and earn as it blows up.',
    spotifyUrl: '', appleMusicUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    _id: '5', title: 'Afrobeats Rising', artistName: 'Kojo Vibe', genre: 'Afrobeats',
    artistImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=400&h=400&fit=crop',
    fundingGoal: 6000, currentFunding: 5800, royaltyPercentage: 18, mftPrice: 3,
    totalSupply: 2000, soldSupply: 1933, investors: 312, daysLeft: 1,
    description: 'Afrobeats is taking over the world. Kojo Vibe is leading the charge — invest in this track before it goes global.',
    spotifyUrl: 'https://open.spotify.com/track/sample5',
    appleMusicUrl: 'https://music.apple.com/us/album/afrobeats-rising/123456791',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    _id: '6', title: 'Jazz Fusion', artistName: 'Miles Blue', genre: 'Jazz',
    artistImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    fundingGoal: 12000, currentFunding: 2400, royaltyPercentage: 25, mftPrice: 15,
    totalSupply: 800, soldSupply: 160, investors: 28, daysLeft: 30,
    description: 'A bold fusion of jazz tradition and modern production. Miles Blue pushes boundaries — be part of the journey.',
    spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  // AI Agent campaigns
  {
    _id: 'ai-1', title: 'Digital Dreamscape', artistName: 'NeonMind AI', genre: 'Electronic',
    artistImage: 'https://ui-avatars.com/api/?name=NeonMind+AI&background=0ea5e9&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/neonmind/400/400',
    fundingGoal: 3000, currentFunding: 2100, royaltyPercentage: 12, mftPrice: 2,
    totalSupply: 1500, soldSupply: 1050, investors: 67, daysLeft: 18,
    description: 'A futuristic AI-generated synthwave journey. NeonMind AI blends ambient pads with retro arpeggios to create a dreamy digital soundscape. Invest in the future of AI music.',
    spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    campaignType: 'ai_agent', agentName: 'NeonMind AI',
    agentAvatar: 'https://ui-avatars.com/api/?name=NeonMind+AI&background=0ea5e9&color=fff&size=100&bold=true',
    agentBio: 'A futuristic AI composer blending synthwave with ambient textures. Born from the digital ether.',
    prompt: 'Create a dreamy synthwave track with ambient pads, retro arpeggios, and a chill vibe',
  },
  {
    _id: 'ai-2', title: 'Cyber Groove', artistName: 'BeatBot 9000', genre: 'Hip Hop',
    artistImage: 'https://ui-avatars.com/api/?name=BeatBot+9000&background=8b5cf6&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/beatbot/400/400',
    fundingGoal: 5000, currentFunding: 4500, royaltyPercentage: 15, mftPrice: 5,
    totalSupply: 1000, soldSupply: 900, investors: 142, daysLeft: 4,
    description: 'BeatBot 9000 drops the hardest AI-generated hip-hop beat. 808 bass, trap hi-hats, and a dark cinematic melody. The algorithm doesn\'t miss.',
    spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    campaignType: 'ai_agent', agentName: 'BeatBot 9000',
    agentAvatar: 'https://ui-avatars.com/api/?name=BeatBot+9000&background=8b5cf6&color=fff&size=100&bold=true',
    agentBio: 'An AI hip-hop producer with hard-hitting beats and futuristic flow. No human limits.',
    prompt: 'Hard-hitting hip hop beat with 808 bass, trap hi-hats, and a dark cinematic melody',
  },
  {
    _id: 'ai-3', title: 'Aurora Waves', artistName: 'Celestia', genre: 'Ambient',
    artistImage: 'https://ui-avatars.com/api/?name=Celestia&background=06b6d4&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/celestia/400/400',
    fundingGoal: 2000, currentFunding: 800, royaltyPercentage: 20, mftPrice: 1,
    totalSupply: 2000, soldSupply: 800, investors: 53, daysLeft: 25,
    description: 'Celestia channels cosmic energy into soothing ambient soundscapes. Layered pads, gentle piano, and nature-inspired textures for the soul.',
    spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    campaignType: 'ai_agent', agentName: 'Celestia',
    agentAvatar: 'https://ui-avatars.com/api/?name=Celestia&background=06b6d4&color=fff&size=100&bold=true',
    agentBio: 'Ethereal AI artist channeling cosmic energy into soothing ambient soundscapes.',
    prompt: 'Ethereal ambient track with layered pads, gentle piano, and nature-inspired textures',
  },
  {
    _id: 'ai-4', title: 'Protocol Funk', artistName: 'The Algorithm', genre: 'EDM',
    artistImage: 'https://ui-avatars.com/api/?name=The+Algorithm&background=ec4899&color=fff&size=100&bold=true',
    coverImage: 'https://picsum.photos/seed/algorithm/400/400',
    fundingGoal: 4000, currentFunding: 3600, royaltyPercentage: 10, mftPrice: 4,
    totalSupply: 1000, soldSupply: 900, investors: 98, daysLeft: 7,
    description: 'The Algorithm processes funk, soul, and electronic music into irresistible dance tracks. Festival-ready drops powered by AI.',
    spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    campaignType: 'ai_agent', agentName: 'The Algorithm',
    agentAvatar: 'https://ui-avatars.com/api/?name=The+Algorithm&background=ec4899&color=fff&size=100&bold=true',
    agentBio: 'An AI that processes funk, soul, and electronic music into irresistible dance tracks.',
    prompt: 'Funky EDM track with groovy bassline, chopped vocal samples, and a festival-ready drop',
  },
];

// Helper to extract YouTube video ID
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  return match ? match[1] : null;
}

// Relative time helper
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Unified campaign data shape used internally
interface CampaignData {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  artistName: string;
  artistImage: string;
  genre: string;
  fundingGoal: number;
  currentFunding: number;
  royaltyPercentage: number;
  mftPrice: number;
  totalSupply: number;
  soldSupply: number;
  remainingSupply: number;
  investors: number;
  daysLeft: number;
  status: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  campaignType: 'human' | 'ai_agent';
  agentName?: string;
  agentAvatar?: string;
  agentBio?: string;
  prompt?: string;
}

function normalizeCampaign(campaign: MFTCampaign, holderCount: number): CampaignData {
  const isAI = campaign.campaignType === 'ai_agent';
  return {
    _id: campaign._id,
    title: campaign.title,
    description: campaign.description,
    coverImage: campaign.coverImage,
    artistName: isAI ? (campaign.aiAgent?.agentName || 'AI Agent') : (campaign.artistId?.name || 'Unknown Artist'),
    artistImage: isAI ? (campaign.aiAgent?.agentAvatar || '') : (campaign.artistId?.imageUrl || ''),
    genre: campaign.genre || '',
    fundingGoal: campaign.fundingGoal,
    currentFunding: campaign.currentFunding,
    royaltyPercentage: campaign.royaltyPercentage,
    mftPrice: campaign.mftPrice,
    totalSupply: campaign.totalSupply,
    soldSupply: campaign.soldSupply,
    remainingSupply: campaign.remainingSupply ?? (campaign.totalSupply - campaign.soldSupply),
    investors: holderCount || campaign.investorCount,
    daysLeft: Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000)),
    status: campaign.status,
    spotifyUrl: campaign.spotifyUrl,
    appleMusicUrl: campaign.appleMusicUrl,
    youtubeUrl: campaign.youtubeUrl,
    audioUrl: isAI ? campaign.aiAgent?.audioUrl : campaign.trackId?.audioUrl,
    campaignType: campaign.campaignType || 'human',
    agentName: campaign.aiAgent?.agentName,
    agentAvatar: campaign.aiAgent?.agentAvatar,
    agentBio: campaign.aiAgent?.agentBio,
    prompt: campaign.aiAgent?.prompt,
  };
}

function normalizeDummy(d: typeof DUMMY_CAMPAIGNS[0]): CampaignData {
  return {
    _id: d._id,
    title: d.title,
    description: d.description,
    coverImage: d.coverImage,
    artistName: d.artistName,
    artistImage: d.artistImage,
    genre: d.genre,
    fundingGoal: d.fundingGoal,
    currentFunding: d.currentFunding,
    royaltyPercentage: d.royaltyPercentage,
    mftPrice: d.mftPrice,
    totalSupply: d.totalSupply,
    soldSupply: d.soldSupply,
    remainingSupply: d.totalSupply - d.soldSupply,
    investors: d.investors,
    daysLeft: d.daysLeft,
    status: 'active',
    spotifyUrl: d.spotifyUrl || undefined,
    appleMusicUrl: d.appleMusicUrl || undefined,
    youtubeUrl: d.youtubeUrl || undefined,
    audioUrl: d.audioUrl || undefined,
    campaignType: (d as any).campaignType || 'human',
    agentName: (d as any).agentName,
    agentAvatar: (d as any).agentAvatar,
    agentBio: (d as any).agentBio,
    prompt: (d as any).prompt,
  };
}

export function KickstarterCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();

  // Data state
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [rawCampaign, setRawCampaign] = useState<MFTCampaign | null>(null);
  const [transactions, setTransactions] = useState<MFTTransaction[]>([]);
  const [userHolding, setUserHolding] = useState<MFTHolding | null>(null);
  const [holders, setHolders] = useState<any[]>([]);
  const [comments, setComments] = useState<CampaignComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDummy, setIsDummy] = useState(false);

  // Buy state
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Modal state
  const [showReferModal, setShowReferModal] = useState(false);

  useEffect(() => {
    if (id) fetchData();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await kickstarterApi.getCampaign(id!);
      const normalized = normalizeCampaign(response.campaign, response.holderCount);
      setCampaign(normalized);
      setRawCampaign(response.campaign);
      setTransactions(response.recentTransactions);
      setUserHolding(response.userHolding);
      setIsDummy(false);

      // Fetch holders and comments in parallel
      const [holdersData, commentsData] = await Promise.all([
        kickstarterApi.getCampaignHolders(id!).catch(() => []),
        kickstarterApi.getCampaignComments(id!).catch(() => []),
      ]);
      setHolders(holdersData);
      setComments(commentsData);
    } catch {
      // Fallback to dummy data
      const dummy = DUMMY_CAMPAIGNS.find(c => c._id === id);
      if (dummy) {
        setCampaign(normalizeDummy(dummy));
        setIsDummy(true);
      } else {
        setError('Campaign not found');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      setBuyError('Please sign in to buy MFTs');
      return;
    }
    if (isDummy) {
      setBuyError('This is a preview campaign — buying is not available yet');
      return;
    }
    try {
      setBuying(true);
      setBuyError(null);
      await kickstarterApi.buyMFTs(id!, buyQuantity);
      await fetchData();
      setBuyQuantity(1);
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !isAuthenticated || isDummy) return;
    try {
      setPostingComment(true);
      const newComment = await kickstarterApi.postComment(id!, commentText.trim());
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  // Audio controls
  const toggleAudio = () => {
    if (!campaign?.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(campaign.audioUrl);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setAudioCurrentTime(audioRef.current.currentTime);
          setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) setAudioDuration(audioRef.current.duration);
      });
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioDuration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!campaign) return <PageLoader loading={loading} error={error} onRetry={fetchData}><div /></PageLoader>;

  const progress = Math.min(100, (campaign.currentFunding / campaign.fundingGoal) * 100);
  const totalCost = buyQuantity * campaign.mftPrice;
  const hasDsp = campaign.spotifyUrl || campaign.appleMusicUrl || campaign.youtubeUrl;
  const ytId = campaign.youtubeUrl ? getYouTubeId(campaign.youtubeUrl) : null;

  return (
    <PageLoader loading={loading} error={error} onRetry={fetchData}>
      <div className="min-h-screen pt-4 pb-32 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/kickstarter" className="inline-flex items-center text-white/60 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Campaigns
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ======== LEFT COLUMN ======== */}
            <div className="lg:col-span-2 space-y-6">

              {/* Media Player */}
              <motion.div
                className="glass-card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {ytId ? (
                  /* YouTube Embed */
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                      title={campaign.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : campaign.audioUrl ? (
                  /* Audio Player with Cover Art */
                  <div className="relative">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={campaign.coverImage}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <button
                          onClick={toggleAudio}
                          className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-10 h-10 text-white" />
                          ) : (
                            <Play className="w-10 h-10 text-white ml-1" />
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Audio Progress Bar */}
                    <div className="px-4 py-3 bg-black/60">
                      <div
                        className="h-1.5 bg-white/20 rounded-full cursor-pointer mb-2"
                        onClick={seekAudio}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/50">
                        <span>{formatTime(audioCurrentTime)}</span>
                        <span>{formatTime(audioDuration)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Cover Image Only */
                  <div className="relative aspect-video">
                    <img
                      src={campaign.coverImage}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Track Info */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {campaign.artistImage ? (
                      <img src={campaign.artistImage} alt="" className={`w-12 h-12 rounded-full border ${campaign.campaignType === 'ai_agent' ? 'border-cyan-500/40' : 'border-white/20'}`} />
                    ) : campaign.campaignType === 'ai_agent' ? (
                      <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-cyan-400" />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-white/60 text-sm">{campaign.campaignType === 'ai_agent' ? 'AI Agent' : 'By'}</p>
                      <p className="font-semibold">{campaign.artistName}</p>
                    </div>
                    {campaign.campaignType === 'ai_agent' && (
                      <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-medium flex items-center gap-1">
                        <Bot className="w-3 h-3" /> AI Agent
                      </span>
                    )}
                    {campaign.genre && (
                      <span className="ml-auto px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
                        {campaign.genre}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3">{campaign.title}</h1>

                  {/* AI Agent Bio & Prompt */}
                  {campaign.campaignType === 'ai_agent' && (campaign.agentBio || campaign.prompt) && (
                    <div className="mb-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      {campaign.agentBio && (
                        <p className="text-white/70 text-sm mb-2">{campaign.agentBio}</p>
                      )}
                      {campaign.prompt && (
                        <p className="text-white/40 text-xs italic">Prompt: "{campaign.prompt}"</p>
                      )}
                    </div>
                  )}

                  <p className="text-white/70 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>

                  {/* DSP Links */}
                  {hasDsp && (
                    <div className="flex flex-wrap gap-3 mt-5">
                      {campaign.spotifyUrl && (
                        <a href={campaign.spotifyUrl} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DB954]/20 text-[#1DB954] rounded-full text-sm hover:bg-[#1DB954]/30 transition-colors">
                          <SpotifyIcon /> Spotify
                        </a>
                      )}
                      {campaign.appleMusicUrl && (
                        <a href={campaign.appleMusicUrl} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-4 py-2 bg-[#FA243C]/20 text-[#FA243C] rounded-full text-sm hover:bg-[#FA243C]/30 transition-colors">
                          <AppleMusicIcon /> Apple Music
                        </a>
                      )}
                      {campaign.youtubeUrl && (
                        <a href={campaign.youtubeUrl} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF0000]/20 text-[#FF0000] rounded-full text-sm hover:bg-[#FF0000]/30 transition-colors">
                          <YouTubeIcon /> YouTube
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Comments Section */}
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold">Comments</h2>
                  {comments.length > 0 && (
                    <span className="text-sm text-white/40">({comments.length})</span>
                  )}
                </div>

                {/* Comment Input */}
                {isAuthenticated ? (
                  <div className="flex gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                        placeholder={isDummy ? 'Comments disabled for preview campaigns' : 'Write a comment...'}
                        disabled={isDummy}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-500/50 placeholder-white/30 disabled:opacity-50"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostComment();
                          }
                        }}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-white/30">{commentText.length}/500</span>
                        <button
                          onClick={handlePostComment}
                          disabled={!commentText.trim() || postingComment || isDummy}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                          {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40 text-sm mb-6 text-center py-3 bg-white/5 rounded-lg">
                    Sign in to leave a comment
                  </p>
                )}

                {/* Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {comment.userId?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {comment.userId?.username || 'Anonymous'}
                            </span>
                            <span className="text-xs text-white/30 flex-shrink-0">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-white/70 mt-0.5 break-words">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-center py-8 text-sm">
                    No comments yet — be the first to share your thoughts
                  </p>
                )}
              </motion.div>

              {/* Recent Activity */}
              {transactions.length > 0 && (
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx._id} className="flex items-center justify-between py-2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.type === 'buy' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm">{tx.toUserId?.username || 'Anonymous'}</p>
                            <p className="text-xs text-white/40">
                              {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.quantity} MFT
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">${tx.totalAmount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ======== RIGHT COLUMN ======== */}
            <div className="space-y-6">
              {/* Buy Box */}
              <motion.div
                className="glass-card p-6 lg:sticky lg:top-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Funding Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-emerald-400 font-medium">${campaign.currentFunding.toLocaleString()} raised</span>
                    <span className="text-white/40">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-white/40 text-sm mt-2">of ${campaign.fundingGoal.toLocaleString()} goal</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <Users className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-lg font-bold">{campaign.investors}</p>
                    <p className="text-xs text-white/40">Investors</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <Percent className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                    <p className="text-lg font-bold">{campaign.royaltyPercentage}%</p>
                    <p className="text-xs text-white/40">Royalty Share</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <Music className="w-5 h-5 mx-auto text-pink-400 mb-1" />
                    <p className="text-lg font-bold">{campaign.remainingSupply}</p>
                    <p className="text-xs text-white/40">MFTs Left</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
                    <p className="text-lg font-bold">{campaign.daysLeft}</p>
                    <p className="text-xs text-white/40">Days Left</p>
                  </div>
                </div>

                {/* MFT Price */}
                <div className="text-center mb-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-white/60 text-sm">MFT Price</p>
                  <p className="text-3xl font-bold text-emerald-400">${campaign.mftPrice}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-4">
                  <label className="text-sm text-white/60 mb-2 block">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center py-2 bg-white/5 border border-white/10 rounded-lg"
                      min={1}
                      max={campaign.remainingSupply}
                    />
                    <button
                      onClick={() => setBuyQuantity(Math.min(campaign.remainingSupply, buyQuantity + 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-4 text-lg">
                  <span className="text-white/60">Total</span>
                  <span className="font-bold">${totalCost.toFixed(2)}</span>
                </div>

                {/* Buy Button */}
                <button
                  onClick={handleBuy}
                  disabled={buying || campaign.remainingSupply === 0 || campaign.status !== 'active'}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold
                           hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {buying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : campaign.remainingSupply === 0 ? (
                    'Sold Out'
                  ) : campaign.status !== 'active' ? (
                    'Campaign Ended'
                  ) : (
                    <>Buy {buyQuantity} MFT{buyQuantity > 1 ? 's' : ''}</>
                  )}
                </button>

                {buyError && (
                  <p className="text-red-400 text-sm mt-2 text-center">{buyError}</p>
                )}

                {/* User Holdings */}
                {userHolding && userHolding.quantity > 0 && (
                  <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-400 mb-1">Your Holdings</p>
                    <p className="text-xl font-bold">{userHolding.quantity} MFTs</p>
                    <p className="text-sm text-white/40">
                      Royalties earned: ${userHolding.totalRoyaltiesEarned.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Refer & Earn Button */}
                <button
                  onClick={() => setShowReferModal(true)}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold
                           hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Refer & Earn
                </button>
              </motion.div>

              {/* Top Holders */}
              {holders.length > 0 && (
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-bold">Top Holders</h2>
                  </div>
                  <div className="space-y-3">
                    {holders.slice(0, 10).map((holder: any, i: number) => (
                      <div key={holder._id} className="flex items-center gap-3">
                        <span className={`w-6 text-center text-sm font-bold ${
                          i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] font-bold">
                          {holder.userId?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm truncate flex-1">
                          {holder.userId?.username || `${holder.userId?.walletAddress?.slice(0, 6)}...${holder.userId?.walletAddress?.slice(-4)}` || 'Anonymous'}
                        </span>
                        <span className="text-sm font-medium text-emerald-400">{holder.quantity} MFT</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Refer & Earn Modal */}
        <AnimatePresence>
          {showReferModal && (
            <ReferEarnModal
              campaignId={campaign._id}
              campaignTitle={campaign.title}
              artistName={campaign.artistName}
              onClose={() => setShowReferModal(false)}
            />
          )}
        </AnimatePresence>

        <BottomNavigation />
      </div>
    </PageLoader>
  );
}

// ==================== Refer & Earn Modal ====================
function ReferEarnModal({
  campaignId,
  campaignTitle,
  artistName,
  onClose,
}: {
  campaignId: string;
  campaignTitle: string;
  artistName: string;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/kickstarter/campaign/${campaignId}${user ? `?ref=${user._id || user.username}` : ''}`;
  const shareText = `Check out "${campaignTitle}" by ${artistName} on JAMZ Kickstarter! Invest in music and earn royalties.`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md glass-card p-6 z-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold">Refer & Earn</h3>
          <p className="text-white/50 text-sm mt-1">Share this campaign and earn rewards when friends invest</p>
        </div>

        {/* Referral Link */}
        <div className="mb-5">
          <label className="text-xs text-white/50 mb-1 block">Your Referral Link</label>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-sm text-white/70 truncate flex-1">{referralLink}</p>
            <button
              onClick={copyLink}
              className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <button
            onClick={shareTwitter}
            className="w-full py-3 bg-black border border-white/20 rounded-lg font-medium text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <TwitterIcon /> Share on X (Twitter)
          </button>
          <button
            onClick={shareFacebook}
            className="w-full py-3 bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-lg font-medium text-sm hover:bg-[#1877F2]/30 transition-colors flex items-center justify-center gap-2 text-[#1877F2]"
          >
            Share on Facebook
          </button>
          <button
            onClick={copyLink}
            className="w-full py-3 bg-purple-600/20 border border-purple-600/30 rounded-lg font-medium text-sm hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2 text-purple-400"
          >
            {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
