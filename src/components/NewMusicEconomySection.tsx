import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const NewMusicEconomySection = React.memo(function NewMusicEconomySection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-black to-purple-900/20" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Call to Action */}
        <motion.div
          className="relative bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 rounded-2xl p-4 sm:p-6 border border-white/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
          <div className="absolute top-0 left-1/4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />

          <div className="relative z-10 text-center">
            {/* Main Heading with Enhanced Typography */}
            <div className="mb-4">
              <motion.h3
                className="text-xl sm:text-2xl lg:text-3xl font-black mb-2 leading-tight"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <span className="text-white/90">Ready to Join the</span>
                <br />
                <span className="gradient-text text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  New Music Economy
                </span>
              </motion.h3>

              {/* Decorative Line */}
              <motion.div
                className="w-16 h-0.5 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: 64 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 1.0 }}
              />
            </div>

            {/* Description with Better Spacing */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed font-medium">
                Start earning rewards for what you already love doing
              </p>
              <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mt-1 font-light">
                <span className="text-primary font-semibold">Discovering</span> •
                <span className="text-secondary font-semibold"> Sharing</span> •
                <span className="text-accent font-semibold"> Supporting</span> amazing music
              </p>
            </motion.div>

            {/* Enhanced Button - Centered */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <motion.button
                className="glass-button-primary px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-bold rounded-full shadow-lg relative overflow-hidden group inline-flex items-center justify-center"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 15px 30px rgba(102, 0, 255, 0.3)",
                  y: -1
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('trending-showcase')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Start Earning Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                {/* Button Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
