import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, ChevronRight, Music } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatedBackground } from './AnimatedBackground';
import { openVerseApi, OpenVerseCampaign } from '../lib/openVerseApi';

// Animated text component - words animate in with stagger and gradient
const AnimatedWord = ({
  text,
  className = '',
  delay = 0,
  gradient,
  staggered = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  gradient?: string;
  staggered?: boolean;
}) => {
  const words = text.split(' ');
  const bg = gradient || 'linear-gradient(90deg, #ec4899, #a855f7, #6366f1, #ec4899)';

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggered ? 0.12 : 0,
        delayChildren: delay,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', damping: 12, stiffness: 100 },
    },
  };

  if (staggered) {
    return (
      <motion.span
        className={`inline-block font-bold ${className}`}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={child}
            className="inline-block"
            style={{
              marginRight: i < words.length - 1 ? '0.25em' : '0',
              background: bg,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  return (
    <motion.span
      className={`inline-block font-bold ${className}`}
      style={{
        background: bg,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {text}
    </motion.span>
  );
};

// Blur reveal animation wrapper
const BlurReveal = ({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.span
    className={`inline-block ${className}`}
    initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.9 }}
    animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
    transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.span>
);

// Campaign card component
interface CampaignCardProps {
  campaign: OpenVerseCampaign;
  index: number;
  compact?: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, index, compact = false }) => {
  const isEnded = new Date(campaign.endDate) < new Date();

  const formatPrize = (prizePool?: any) => {
    if (prizePool && prizePool.amount) {
      const amount = prizePool.amount;
      const currency = prizePool.currency || 'JAMZ';
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M ${currency}`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K ${currency}`;
      return `${amount} ${currency}`;
    }
    return 'TBA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const imageSize = compact ? 'w-[72px] h-[72px]' : 'w-[80px] h-[80px]';
  const padding = compact ? 'p-2.5' : 'p-3';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.08 }}
    >
      <Link to={`/open-verse/${campaign._id}`} className="block group">
        <div className={`flex items-start gap-3 ${padding} rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors`}>
          <div className="relative flex-shrink-0">
            <img
              src={campaign.thumbnailImage ? openVerseApi.campaigns.getThumbnailUrl(campaign._id) : '/placeholder-campaign.jpg'}
              alt={campaign.title}
              className={`${imageSize} rounded-lg object-cover`}
            />
            {isEnded && (
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-red-600 rounded text-[10px] font-medium text-white">
                Ended
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-base leading-tight truncate">
              {campaign.title}
            </h4>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-sm font-bold text-white">
                {formatPrize(campaign.prizePool)}
              </span>
              <div className="flex items-center gap-1 text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">{formatDate(campaign.endDate)}</span>
              </div>
            </div>
            <div className="flex items-center justify-end mt-1.5">
              <span className="text-xs text-zinc-400 flex items-center gap-0.5 group-hover:text-white transition-colors">
                View details <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const HeroSection = React.memo(function HeroSection() {
  const navigate = useNavigate();

  const mockCampaigns: OpenVerseCampaign[] = [
    {
      _id: 'mock-1',
      title: 'Summer Vibes Challenge',
      description: 'Create summer-themed content',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prizePool: { amount: 5000000, currency: 'JAMZ' },
      isActive: true,
      totalParticipants: 128
    } as OpenVerseCampaign,
    {
      _id: 'mock-2',
      title: 'Remix Battle Vol. 3',
      description: 'Show off your remix skills',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prizePool: { amount: 2000000, currency: 'JAMZ' },
      isActive: true,
      totalParticipants: 64
    } as OpenVerseCampaign
  ];

  const [campaigns, setCampaigns] = useState<OpenVerseCampaign[]>(mockCampaigns);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    try {
      const data = await Promise.race([openVerseApi.campaigns.list(), timeoutPromise]);
      const sortedCampaigns = data
        .sort((a, b) => {
          const aActive = a.status === 'active' ? 1 : 0;
          const bActive = b.status === 'active' ? 1 : 0;
          if (bActive !== aActive) return bActive - aActive;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 2);
      setCampaigns(sortedCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns, using mock data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-black">
      <AnimatedBackground />

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden flex-1 w-full max-w-sm mx-auto px-4 pt-16 pb-8 flex flex-col justify-center relative z-10">
        <div className="text-center mb-4 w-full">
          <div>
            <h1 className="text-[20px] leading-[1.2] mb-1.5">
              <span className="block">
                <AnimatedWord text="GAMIFIED MUSIC VIRALITY ENGINE" delay={0.2} staggered />
              </span>
            </h1>

            <BlurReveal delay={1.2}>
              <p className="text-[11px] text-zinc-500 leading-tight mt-1">
                We and Artists fund campaigns. Fans earn by promoting.
              </p>
            </BlurReveal>

            <motion.div
              className="flex flex-col gap-1.5 mt-3 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <motion.button
                onClick={() => navigate('/open-verse')}
                className="w-full py-2.5 rounded-full font-semibold text-sm text-white shadow-lg shadow-purple-500/25"
                style={{
                  background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 50%, #8b5cf6 100%)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join a Campaign
              </motion.button>
              <button
                onClick={() => navigate('/artist/login')}
                className="flex items-center justify-center gap-1 text-zinc-400 hover:text-white transition-colors text-[12px] py-0.5"
              >
                <span>I'm an Artist / Label</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>

            <motion.div
              className="flex items-center justify-center mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.4 }}
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <svg width="12" height="12" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                  <path d="M55.5 22C37 22 22 37 22 55.5S37 89 55.5 89 89 74 89 55.5 74 22 55.5 22Zm0 49.5c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16Z" fill="white"/>
                </svg>
                <span className="text-[10px] font-semibold text-white/60">Built on</span>
                <span className="text-[10px] font-bold text-[#0052FF]">Base</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live Campaigns - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <h3 className="text-base font-semibold text-white">Live creator campaigns</h3>
          </div>

          <div className="space-y-2">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 animate-pulse">
                  <div className="w-[72px] h-[72px] rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign, index) => (
                <CampaignCard key={campaign._id} campaign={campaign} index={index} compact={true} />
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500">
                <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active campaigns right now</p>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3"
          >
            <Link
              to="/artist/login"
              className="block w-full py-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-white font-semibold text-sm text-center hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
            >
              Launch a Campaign
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:flex flex-col flex-1 w-full relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-12 pt-24 pb-12">
          <div className="text-center max-w-4xl">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl leading-[1.1] tracking-tight mb-6 whitespace-nowrap">
              <span className="block">
                <AnimatedWord
                  text="GAMIFIED MUSIC VIRALITY ENGINE"
                  delay={0.2}
                  gradient="linear-gradient(90deg, #ec4899, #a855f7, #6366f1, #ec4899)"
                  staggered
                />
              </span>
            </h1>

            <BlurReveal delay={1.5}>
              <p className="text-xl lg:text-2xl text-zinc-500 leading-relaxed mb-10 max-w-2xl mx-auto">
                We and Artists fund campaigns. Fans earn by promoting.
              </p>
            </BlurReveal>

            <motion.div
              className="flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                className="flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2, duration: 0.5 }}
              >
                <motion.button
                  onClick={() => navigate('/artist/login')}
                  className="px-6 py-3 rounded-full font-semibold text-sm text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #8b5cf6 100%)',
                  }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Launch a Campaign
                </motion.button>
                <motion.span
                  className="text-[11px] text-zinc-500 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                >
                  For Artists & Labels
                </motion.span>
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.1, duration: 0.5 }}
              >
                <motion.button
                  onClick={() => navigate('/open-verse')}
                  className="px-6 py-3 rounded-full font-semibold text-sm text-white bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join Campaign
                </motion.button>
                <motion.span
                  className="text-[11px] text-zinc-500 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.3 }}
                >
                  For Fans & Creators
                </motion.span>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex items-center justify-center mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.5 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                  <path d="M55.5 22C37 22 22 37 22 55.5S37 89 55.5 89 89 74 89 55.5 74 22 55.5 22Zm0 49.5c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16Z" fill="white"/>
                </svg>
                <span className="text-[12px] font-semibold text-white/70">Built on</span>
                <span className="text-[12px] font-bold text-[#0052FF]">Base</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live Campaigns Section - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.5 }}
          className="w-full max-w-4xl mx-auto px-8 pb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h3 className="text-lg font-semibold text-white">Live creator campaigns</h3>
            </div>
            <Link
              to="/open-verse"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700 hover:border-zinc-600 rounded-full transition-all group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 animate-pulse">
                  <div className="w-[80px] h-[80px] rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign, index) => (
                <CampaignCard key={campaign._id} campaign={campaign} index={index} />
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-zinc-500">
                <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active campaigns right now</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
});
