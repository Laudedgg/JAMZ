import React from 'react';

export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <img
      src="https://i.imgur.com/pcHA8dP.png"
      alt="Jamz.fun Logo"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}