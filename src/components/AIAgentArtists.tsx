import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, Music, Star, Bot } from 'lucide-react';
import { AAAWaitlistModal } from './AAAWaitlistModal';

export function AIAgentArtists() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  return (
    <section id="ai" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/20 via-black to-black" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-900/20 border border-indigo-500/30 mb-4">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">Coming Soon</span>
          </div>
          <h2 className="pixel-text text-4xl font-bold mb-4 gradient-text">AI Agent Artists (AAAs)</h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Create your own AI musician that can compose, produce, and release tracks from just a prompt.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            className="feature-card feature-card-purple"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-14 h-14 bg-indigo-900/30 rounded-lg flex items-center justify-center mb-6">
              <BrainCircuit className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Powered by LLMs</h3>
            <p className="text-white/60">
              AI agents connected to powerful language models that understand music theory, composition, and current trends.
            </p>
          </motion.div>

          <motion.div
            className="feature-card feature-card-blue"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-14 h-14 bg-indigo-900/30 rounded-lg flex items-center justify-center mb-6">
              <Music className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Create From Text</h3>
            <p className="text-white/60">
              Generate beats, lyrics, and full tracks with simple text prompts. Control style, mood, and themes with natural language.
            </p>
          </motion.div>

          <motion.div
            className="feature-card feature-card-pink"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-14 h-14 bg-indigo-900/30 rounded-lg flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Personalized Artists</h3>
            <p className="text-white/60">
              Customize your AI artist's style, voice, and musical preferences to create a unique artistic identity.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="glass-card p-10 overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/20 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col justify-center text-center">
            <h3 className="text-2xl font-bold mb-4">Be the First to Create Your AI Agent Artist</h3>
            <p className="text-white/60 mb-6 max-w-3xl mx-auto">
              Join our waitlist to be notified when our revolutionary AI Agent Artists DApp launches. Turn your creative vision into music without technical skills.
            </p>
            <motion.button
              className="glass-button-primary px-6 py-3 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWaitlistModal(true)}
            >
              <Star className="w-4 h-4 mr-2" />
              Join the Waitlist
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Waitlist Modal */}
      <AAAWaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
      />
    </section>
  );
}
