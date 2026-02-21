import React from 'react';

/**
 * Lightweight static grid background for sections outside HeroSection.
 * Uses pure CSS with no animations for optimal scroll performance.
 */
export const StaticGridBackground = React.memo(function StaticGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
      
      {/* Static grid pattern - no animations */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        }}
      />
    </div>
  );
});

