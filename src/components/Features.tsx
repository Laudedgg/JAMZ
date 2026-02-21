import React from 'react';
import { motion } from 'framer-motion';
import { Music, Camera, Upload, DollarSign, Sparkles, ArrowRight } from 'lucide-react';

export const Features = React.memo(function Features() {
  const steps = [
    {
      icon: <Music className="w-6 h-6 text-blue-400" />,
      title: 'Browse Campaigns',
      description: 'Discover trending tracks from artists looking for promotion.',
      color: 'blue',
      stepNumber: '01',
    },
    {
      icon: <Camera className="w-6 h-6 text-pink-400" />,
      title: 'Create Content',
      description: 'Use the artist\'s track to create engaging content on TikTok, Instagram, or YouTube Shorts.',
      color: 'pink',
      stepNumber: '02',
    },
    {
      icon: <Upload className="w-6 h-6 text-purple-400" />,
      title: 'Submit & Compete',
      description: 'Upload your content directly to the campaign and compete with other creators.',
      color: 'purple',
      stepNumber: '03',
    },
    {
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      title: 'Earn Rewards',
      description: 'Win prizes and get paid in USD, AED, NGN, and JAMZ tokens.',
      color: 'emerald',
      stepNumber: '04',
    },
  ];

  const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
    blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    pink: { border: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-400' },
    purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  };

  return (
    <section id="features" className="pt-0 pb-12 md:pb-32 relative overflow-hidden -mt-12 md:-mt-16">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-10 md:mt-12 mb-6 md:mb-12 px-4 sm:px-6"
        >
          <blockquote className="text-[11px] sm:text-sm md:text-lg lg:text-xl text-white/50 italic max-w-3xl mx-auto leading-snug sm:leading-relaxed text-center">
            "Music without fans is just sound waves in empty rooms. Fans transcend songs into movements, artists into legends, and melodies into memories. They're the ultimate stakeholders—emotionally, financially, and culturally—yet the industry treats them as just regular external customers rather than core partners in the value they help create."
          </blockquote>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-16 px-4"
        >
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-pink-900/20 border border-pink-500/30">
              <Sparkles className="w-4 h-4 mr-2 text-pink-400" />
              <span className="text-sm text-pink-400 font-medium">For Fans & Creators</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Join campaigns where music discovery meets content creation. Earn rewards for promoting artists you love.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {steps.map((step, index) => {
            const colors = colorClasses[step.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className={`bg-zinc-900/80 border ${colors.border} rounded-2xl overflow-hidden hover:border-opacity-60 transition-all duration-300 h-full p-4 md:p-6`}>
                  {/* Header with step number and icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center border ${colors.border}`}>
                      {step.icon}
                    </div>
                    <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center border ${colors.border}`}>
                      <span className={`text-xs font-bold ${colors.text}`}>{step.stepNumber}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Connecting arrow (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 transform -translate-y-1/2 translate-x-1/2 z-10">
                    <div className="w-8 h-8 bg-zinc-800/80 rounded-full flex items-center justify-center border border-zinc-700">
                      <ArrowRight className="w-4 h-4 text-white/40" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="/open-verse"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold text-sm hover:scale-105 transition-transform shadow-lg shadow-pink-500/25"
          >
            <span>Browse Active Campaigns</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </motion.div>
      </div>
    </section>
  );
});