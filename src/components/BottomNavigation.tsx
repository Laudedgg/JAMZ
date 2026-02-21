import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Trophy, User, Wallet, Music } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

// Same order as MobileBottomPanel: Home, Campaigns, Discover, Profile, Wallet
const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/'
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: Trophy,
    path: '/open-verse'
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: Music,
    path: '/discover'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile'
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    path: '/wallet'
  }
];

export function BottomNavigation() {
  const location = useLocation();

  // Determine which nav item is active based on current path
  const getActiveItem = (path: string) => {
    if (path === '/') return 'home';
    if (path.startsWith('/discover')) return 'discover';
    if (path.startsWith('/open-verse')) return 'campaigns';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/wallet')) return 'wallet';
    return '';
  };

  const activeItem = getActiveItem(location.pathname);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Matching the exact styling from MobileBottomPanel */}
      <div className="bg-black/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-2 relative rounded-xl transition-all duration-200"
              >
                {/* Active indicator background - matching MobileBottomPanel */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-white/10"
                    layoutId="activeTabNav"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10 mb-1">
                  <Icon
                    className={`w-6 h-6 transition-all duration-200 ${
                      isActive
                        ? 'text-[#0066FF] scale-110'
                        : 'text-white/70 hover:text-white/90'
                    }`}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-semibold transition-all duration-200 relative z-10 ${
                    isActive
                      ? 'text-[#0066FF]'
                      : 'text-white/70'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
