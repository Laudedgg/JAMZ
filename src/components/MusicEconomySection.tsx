import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Heart, ArrowRight, Sparkles, Music } from 'lucide-react';

// High-quality images for human imagery
const IMAGES = {
  artistStudio: '/images/artist-studio.jpg', // Custom artist portrait
  fanConcert: '/images/fans-culture.jpg', // Fans drive the culture
  artistPerforming: '/images/for-fans.png', // Support Artists. Earn Rewards card
  creatorPhone: '/images/creator-content.png', // Creators spread the sound
  musicProducer: '/images/for-artists.png', // Fund Campaigns. Reach Real Fans card
};

export const MusicEconomySection = React.memo(function MusicEconomySection() {
  return (
    <section id="music-economy" className="py-12 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Hero Statement with Human Imagery */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-12 md:mb-24">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 md:mb-6 leading-tight">
              Music Marketing Today is{' '}
              <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Broken</span>
            </h2>

            <div className="space-y-3 md:space-y-4 text-base md:text-lg text-white/70 leading-relaxed">
              <p>
                Artists & Record Labels pour their budgets into playlisting, radio stations, TV placements, influencer deals, etc trying to reach fans via channels that are often untrackable and deliver uncertain results.
              </p>
              <p>
                On the other hand, fans are buying concert tickets, streaming tracks on repeat, sharing music on social media, and creating content that drives real discovery.
              </p>
              <p className="text-white font-medium text-lg md:text-xl">
                The system rewards neither fairly.
              </p>
            </div>
          </motion.div>

          {/* Right: Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Main large image */}
              <div className="col-span-2 relative rounded-2xl overflow-hidden aspect-[16/9]">
                <img
                  src={IMAGES.artistStudio}
                  alt="Artist in studio"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/90 text-sm font-medium">Artists invest in their craft</p>
                </div>
              </div>

              {/* Two smaller images */}
              <div className="relative rounded-xl overflow-hidden aspect-square">
                <img
                  src={IMAGES.fanConcert}
                  alt="Fans at concert"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white/90 text-xs font-medium">Fans drive the culture</p>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-square">
                <img
                  src={IMAGES.creatorPhone}
                  alt="Creator making content"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white/90 text-xs font-medium">Creators spread the sound</p>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>

        {/* Solution Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12 px-4"
        >
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            A Fairer Music Economy
          </h3>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
            Jamz.fun connects what already exists—so both sides finally get rewarded.
          </p>
        </motion.div>

        {/* Two Cards Grid - For Artists & For Fans */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-10 md:mb-20">
          {/* Card 1: For Artists */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 h-full">
              {/* Image Header */}
              <div className="relative h-36 md:h-48 overflow-hidden">
                <img
                  src={IMAGES.musicProducer}
                  alt="Artist creating music"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="inline-flex items-center px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-full">
                    <Music className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
                    <span className="text-purple-400 font-semibold text-xs uppercase tracking-wider">For Artists</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Fund Campaigns. Reach Real Fans.</h3>
                <p className="text-white/70 leading-relaxed mb-4">
                  <span className="text-white font-medium">Artists already run campaigns with prize pools</span> to promote their music. Jamz.fun gives you a platform to do this with trackable results—reaching fans who actually promote your sound.
                </p>
                <ul className="space-y-2">
                  {['Campaigns you already run—now trackable', 'Direct fan engagement', 'Pay for real promotion'].map((item, i) => (
                    <li key={i} className="flex items-center text-white/60 text-sm">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Card 2: For Fans */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-orange-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 h-full">
              {/* Image Header */}
              <div className="relative h-36 md:h-48 overflow-hidden">
                <img
                  src={IMAGES.artistPerforming}
                  alt="Fans enjoying music"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="inline-flex items-center px-3 py-1.5 bg-pink-500/20 border border-pink-500/50 rounded-full">
                    <Heart className="w-3.5 h-3.5 text-pink-400 mr-1.5" />
                    <span className="text-pink-400 font-semibold text-xs uppercase tracking-wider">For Fans</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Support Artists. Earn Rewards.</h3>
                <p className="text-white/70 leading-relaxed mb-4">
                  <span className="text-white font-medium">Fans already create content on TikTok, Instagram, and YouTube Shorts</span> featuring tracks they love. Jamz.fun rewards you for the promotion you're already doing.
                </p>
                <ul className="space-y-2">
                  {['Content you already create—now rewarded', 'Win campaign prizes', 'Get paid in multiple currencies'].map((item, i) => (
                    <li key={i} className="flex items-center text-white/60 text-sm">
                      <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {[
            { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', title: 'Fans Deserve to Earn', desc: 'Your passion drives the industry. Your streams, shares, and support create value. You should be included in the ecosystem reward loop.' },
            { icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Smart Marketing', desc: "Artists get their marketing budget channelled to their real listeners instead of marketing routes they can't track. Everyone wins." },
            { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Fair Economy', desc: "We're aiming for a music economy where fans are valued stakeholders, not just perceived as mere consumers." }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6 hover:border-zinc-700 transition-colors"
              >
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <button
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full text-white font-semibold text-sm cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-purple-500/25"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span>See How It Works</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </motion.div>

      </div>
    </section>
  );
});
