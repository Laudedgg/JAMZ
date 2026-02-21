import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { CustomLoginButton } from './CustomLoginButton';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '../lib/auth';
import { navigateToSection } from '../lib/navigation';

export function HeaderNav() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center">
        <Link to="/">
          <Logo className="w-8 h-8" />
        </Link>
      </div>

      <div className="flex justify-center w-2/4">
        <div className="flex space-x-10 justify-center w-full">
          <Link
            to="/#features"
            onClick={navigateToSection('features', navigate)}
            className="text-white hover:text-white/80 transition-colors text-sm font-medium"
          >
            Features
          </Link>
          <Link
            to="/#ai"
            onClick={navigateToSection('ai', navigate)}
            className="text-white hover:text-white/80 transition-colors text-sm font-medium"
          >
            AI Models
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/profile"
                className="text-white hover:text-white/80 transition-colors text-sm font-medium"
              >
                Profile
              </Link>
              <Link
                to="/wallet"
                className="text-white hover:text-white/80 transition-colors text-sm font-medium"
              >
                Wallet
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated && <NotificationBell />}
        <CustomLoginButton />
      </div>
    </div>
  );
}
