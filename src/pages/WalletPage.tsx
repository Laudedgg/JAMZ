import React from 'react';
import WalletSection from '../components/WalletSection';
import { useAuthStore } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BottomNavigation } from '../components/BottomNavigation';

export const WalletPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen pt-20 pb-32 md:pb-16 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
          <p className="text-white/60">Manage your balances and withdrawal methods</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <WalletSection />
        </motion.div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
};

export default WalletPage;
