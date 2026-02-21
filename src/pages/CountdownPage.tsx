import React from 'react';
import { motion } from 'framer-motion';
import { Music, Users, Trophy, DollarSign } from 'lucide-react';
import { StaticGridBackground } from '../components/StaticGridBackground';
import { SplineScene } from '../components/SplineScene';

export function CountdownPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Elements - Same as main homepage */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-70">
          <SplineScene />
        </div>
        <StaticGridBackground />
        {/* Gradient fade overlay for sections below hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none"
             style={{ top: '100vh' }} />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-start justify-center overflow-hidden pt-24">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-6 tracking-tight">
              <motion.span
                className="animated-gradient-text inline-block relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.05, 1],
                  opacity: 1
                }}
                transition={{
                  duration: 1.2,
                  ease: "easeOut",
                  scale: {
                    times: [0, 0.7, 1],
                    duration: 1.2
                  }
                }}
              >
                {"Music Sense".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    initial={{
                      opacity: 0,
                      y: 50,
                      rotateX: -90,
                      scale: 0.5
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      scale: 1
                    }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }}
                    style={{
                      display: char === " " ? "inline" : "inline-block",
                      width: char === " " ? "0.5em" : "auto"
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.span>
            </h1>
            <p className="section-subtitle mb-8">
              The ultimate real-time music battle game. Submit songs, vote for winners, and earn prizes in epic musical showdowns.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">What's Coming</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Music className="w-8 h-8 text-purple-400" />,
                title: "Submit Songs",
                description: "Add your favorite tracks from YouTube, Spotify, and more to compete"
              },
              {
                icon: <Users className="w-8 h-8 text-pink-400" />,
                title: "Real-time Battles",
                description: "Face off against other players in live music competitions"
              },
              {
                icon: <Trophy className="w-8 h-8 text-yellow-400" />,
                title: "Vote & Win",
                description: "Vote for the best songs and climb the leaderboard"
              },
              {
                icon: <DollarSign className="w-8 h-8 text-green-400" />,
                title: "Earn Prizes",
                description: "Win $JAMZ tokens or USD in paid tournaments"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Preview Section */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">Get a Sneak Peek</h2>
            <p className="text-white/70 text-lg mb-12">
              See what the music battle experience will look like
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Live Battles</h3>
                <p className="text-white/60">Real-time music competitions with instant voting</p>
              </motion.div>

              <motion.div
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tournaments</h3>
                <p className="text-white/60">Compete in brackets for amazing prizes</p>
              </motion.div>

              <motion.div
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-white/60">Connect with music lovers worldwide</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="relative py-20 px-4 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/90 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">Stay in the Loop</h2>
            <p className="text-white/70 text-lg mb-8">
              Be the first to know when MusicSense launches and get exclusive early access
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
              <motion.button
                className="glass-button-primary whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => alert('Thank you for your interest! We\'ll notify you when MusicSense launches.')}
              >
                <Music className="w-5 h-5" />
                Notify Me
              </motion.button>
            </div>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <p className="text-white/50 text-sm">
                Join thousands of music lovers waiting for the ultimate battle experience
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
