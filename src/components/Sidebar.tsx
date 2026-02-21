import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Compass,
  Music2,
  User,
  Wallet,
  LogIn,
  Shield,
  Zap,
  LogOut,
  Rocket,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../lib/auth';
import { Logo } from './Logo';
import { CustomLoginButton } from './CustomLoginButton';

interface SidebarProps {
  className?: string;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ className = '', onCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuthStore();

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const mainNavItems = [
    { icon: Music2, label: 'Campaigns', path: '/open-verse', show: true },
    { icon: Compass, label: 'Discover', path: '/discover', show: true },
    { icon: Rocket, label: 'Kickstarter', path: '/#kickstarter', show: true }
  ];

  const userNavItems = [
    { icon: User, label: 'Profile', path: '/profile', show: isAuthenticated },
    { icon: Wallet, label: 'Wallet', path: '/wallet', show: isAuthenticated }
  ];

  const otherNavItems = [
    { icon: LogIn, label: 'Artist Login', path: '/artist/login', show: !isAuthenticated },
    { icon: Shield, label: 'Admin', path: '/admin', show: isAuthenticated && isAdmin }
  ];

  const renderNavItem = (item: { icon: any; label: string; path: string; show: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    if (collapsed) {
      // Collapsed: Canva/Whop style — centered icon with small label below
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`
            group flex flex-col items-center justify-center py-2.5 px-1 rounded-xl
            transition-all duration-200 relative
            ${active
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
            }
          `}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
          )}
          <Icon className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'text-purple-400' : 'group-hover:text-purple-400'
          }`} />
          <span className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
            active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
          }`}>
            {item.label.length > 10 ? item.label.split(' ')[0] : item.label}
          </span>
        </Link>
      );
    }

    // Expanded: full label
    return (
      <motion.div
        key={item.path}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          to={item.path}
          className={`
            group flex items-center gap-3 px-4 py-3 rounded-xl
            transition-all duration-300 relative overflow-hidden
            ${active
              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white shadow-lg shadow-purple-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
            }
          `}
        >
          {active && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
            active ? 'text-purple-400' : 'text-white/60 group-hover:text-purple-400'
          }`} />
          <span className={`text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
            active ? 'text-white' : 'group-hover:text-white'
          }`}>
            {item.label}
          </span>
        </Link>
      </motion.div>
    );
  };

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-screen bg-black border-r border-white/10 z-40 ${className}`}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Toggle button — top-right corner on the border line */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-[14px] top-[50px] z-50 w-7 h-7 bg-zinc-900 border border-white/15 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-purple-600 hover:border-purple-500 transition-all duration-200 shadow-lg shadow-black/50"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo */}
        <div className={`flex items-center justify-center h-[64px] border-b border-white/10 px-2`}>
          <Link to="/" className="flex items-center transition-transform hover:scale-105 duration-200">
            {collapsed ? (
              <Logo className="w-8 h-8" />
            ) : (
              <Logo className="w-24 h-24" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
          <div className={`${collapsed ? 'space-y-0.5' : 'space-y-1'} mb-4`}>
            {mainNavItems.filter(item => item.show).map(renderNavItem)}
          </div>

          {isAuthenticated && userNavItems.filter(item => item.show).length > 0 && (
            <>
              <div className={`h-px bg-white/5 ${collapsed ? 'mx-2' : 'mx-3'} mb-4`} />
              <div className={`${collapsed ? 'space-y-0.5' : 'space-y-1'} mb-4`}>
                {!collapsed && (
                  <div className="px-4 mb-2">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Account</p>
                  </div>
                )}
                {userNavItems.filter(item => item.show).map(renderNavItem)}
              </div>
            </>
          )}

          {otherNavItems.filter(item => item.show).length > 0 && (
            <>
              <div className={`h-px bg-white/5 ${collapsed ? 'mx-2' : 'mx-3'} mb-4`} />
              <div className={`${collapsed ? 'space-y-0.5' : 'space-y-1'}`}>
                {otherNavItems.filter(item => item.show).map(renderNavItem)}
              </div>
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-3">
          {collapsed ? (
            // Collapsed: circular button with label like other nav items
            <div className="flex flex-col items-center gap-0.5">
              <CustomLoginButton className="!px-0 !py-0 !rounded-full w-10 h-10 flex items-center justify-center !text-[0px] !shadow-none" />
              <span className="text-[9px] font-medium text-white/40">Login</span>
            </div>
          ) : (
            <div className="space-y-3">
              <CustomLoginButton className="w-full justify-center" />
              <div className="flex items-center justify-center gap-1.5 text-white/30 text-[10px]">
                <Zap className="w-3 h-3" />
                <span className="font-medium">Powered by Jamz</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
