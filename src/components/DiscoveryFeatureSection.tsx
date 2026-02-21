import React from 'react';
import { Headphones, Zap, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DiscoveryFeatureSection = React.memo(function DiscoveryFeatureSection() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Headphones,
      title: 'Curated Music Library',
      description: 'Explore a diverse collection of tracks from emerging and established artists worldwide.'
    },
    {
      icon: Zap,
      title: 'Instant Streaming',
      description: 'Stream directly on jamz.fun or seamlessly connect to your favorite platforms like Spotify and Apple Music.'
    },
    {
      icon: Globe,
      title: 'Global Artists',
      description: 'Discover music from talented creators across the globe and support independent artists directly.'
    }
  ];

  return (
    <section className="py-12 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-900/20 border border-purple-500/30">
              <Headphones className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">Music Discovery</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Discover Amazing Music
            </span>
          </h2>
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-base md:text-lg text-white/60 leading-relaxed">
              Explore the latest tracks from various artists globally.
            </p>
            <p className="text-base md:text-lg text-white/70 leading-relaxed">
              Stream directly on jamz.fun or discover on your favorite DSP platforms.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 rounded-xl p-4 md:p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Content */}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-900/50 transition-colors">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Discover Button - After Feature Cards */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/discover')}
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
          >
            Start Discovering
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

      </div>
    </section>
  );
});

