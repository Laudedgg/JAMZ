import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Users, TrendingUp, DollarSign, ArrowRight, Sparkles } from 'lucide-react';

export const ArtistSignupSection = React.memo(function ArtistSignupSection() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Music className="w-8 h-8 text-purple-400" />,
      title: 'Create Campaigns',
      description: 'Launch your own music promotion campaigns with custom prize pools and submission guidelines.',
      color: 'purple'
    },
    {
      icon: <Users className="w-8 h-8 text-pink-400" />,
      title: 'Reach New Fans',
      description: 'Connect with content creators who will use your music to reach millions of potential fans.',
      color: 'pink'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-400" />,
      title: 'Track Performance',
      description: 'Monitor campaign metrics, submissions, and engagement to optimize your music promotion strategy.',
      color: 'blue'
    },
    {
      icon: <DollarSign className="w-8 h-8 text-green-400" />,
      title: 'Control Your Budget',
      description: 'Set your own prize pools and reward structures. Pay only for the promotion that works.',
      color: 'green'
    }
  ];

  return (
    <section id="artist-signup" className="py-16 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-16 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-900/20 border border-purple-500/30">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">For Artists</span>
            </div>
          </div>
          <h2 className="section-title">
            Ready to Promote Your Music?
          </h2>
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-base md:text-lg text-white/60 leading-relaxed">
              Join smart artists & labels using Jamz.fun to create viral campaigns.
            </p>
            <p className="text-base md:text-lg text-white/70 leading-relaxed">
              Reach new audiences and grow your fanbase through the Jamz ecosystem.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-16">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="feature-card feature-card-purple relative group hover:-translate-y-2 transition-transform duration-300"
            >
              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${benefit.color}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />

              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 md:mb-6 relative z-10">
                {benefit.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 relative z-10">{benefit.title}</h3>
              <p className="text-white/60 relative z-10">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section - Buttons Only */}
        <div className="text-center">
          {/* Enhanced Buttons - Centered */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => navigate('/artist/register')}
              className="glass-button-primary px-5 py-2.5 text-sm font-semibold rounded-full shadow-lg relative overflow-hidden group inline-flex items-center justify-center hover:scale-105 transition-transform"
            >
              <span className="relative z-10 flex items-center justify-center">
                Sign Up as Artist
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            </button>

            <button
              onClick={() => navigate('/artist/login')}
              className="px-5 py-2.5 text-sm font-semibold bg-transparent border border-white/20 text-white rounded-full hover:bg-white/10 transition-all duration-300"
            >
              Artist Login
            </button>
          </div>

          <p className="text-xs text-white/50 mt-4">
            Already have an account? <span className="text-primary cursor-pointer hover:text-primary/80 transition-colors" onClick={() => navigate('/artist/login')}>Sign in here</span>
          </p>
        </div>
      </div>
    </section>
  );
});
