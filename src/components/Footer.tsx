import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Mail, Music, Play, Users } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-20 bg-gradient-to-b from-black/80 to-black/95 backdrop-blur-xl border-t border-white/5 py-6 md:py-10 pointer-events-auto md:ml-[240px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4 md:gap-6">
          {/* Logo and tagline */}
          <div className="flex flex-col items-start">
            <Link
              to="/"
              className="flex items-center group transition-transform duration-300 hover:scale-105"
            >
              <Logo className="w-20 h-20 md:w-24 md:h-24" />
            </Link>
            <p className="mt-2 text-sm text-white/60 max-w-xs">
              Music marketing platform where fans earn by promoting their favorite artists.
            </p>
          </div>

          {/* Navigation links */}
          <div className="flex flex-wrap gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
            <button
              className="footer-link flex items-center gap-1.5 text-sm bg-transparent border-0 hover:translate-x-1 transition-transform"
              onClick={() => {
                if (window.location.pathname === '/') {
                  const element = document.getElementById('features');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/#features');
                }
              }}
            >
              <Play className="w-3.5 h-3.5" />
              <span>How it Works</span>
            </button>

            <button
              className="footer-link flex items-center gap-1.5 text-sm bg-transparent border-0 hover:translate-x-1 transition-transform"
              onClick={() => {
                if (window.location.pathname === '/') {
                  const element = document.getElementById('trending-tracks');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/#trending-tracks');
                }
              }}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Campaigns</span>
            </button>

            <button
              className="footer-link flex items-center gap-1.5 text-sm bg-transparent border-0 hover:translate-x-1 transition-transform"
              onClick={() => {
                if (window.location.pathname === '/') {
                  const element = document.getElementById('ai');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/#ai');
                }
              }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>AI Models</span>
            </button>

            <Link
              to="/artist/login"
              className="footer-link flex items-center gap-1.5 text-sm hover:translate-x-1 transition-transform"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Artist Login</span>
            </Link>

            <a
              href="mailto:contact@jamz.fun"
              className="footer-link flex items-center gap-1.5 text-sm hover:translate-x-1 transition-transform"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact</span>
            </a>

            <a
              href="https://x.com/jamzdotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link flex items-center gap-1.5 text-sm hover:translate-x-1 transition-transform"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X (Twitter)</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 md:pt-6 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-3 md:gap-4 text-xs text-white/40">
          <p>&copy; {currentYear} Jamz.fun. All rights reserved.</p>
          <div className="text-center text-white/50">
            <strong>Disclaimer:</strong> Jamz.fun is only a Music promotion platform. Artists/Labels can request content removal at{' '}
            <a href="mailto:takedown@jamz.fun" className="text-purple-400 hover:text-purple-300 transition-colors">
              takedown@jamz.fun
            </a>
          </div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
