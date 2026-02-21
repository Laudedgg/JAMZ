import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  duration: number;
  currentTime: number;
  onSeek: (position: number) => void;
  className?: string;
}

export function ProgressBar({
  progress,
  duration,
  currentTime,
  onSeek,
  className = ''
}: ProgressBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    onSeek(clampedPercentage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const time = (percentage / 100) * duration;
    
    setHoverTime(time);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const calculateProgress = (clientX: number) => {
    if (!progressBarRef.current) return null;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const newProgress = calculateProgress(touch.clientX);
    if (newProgress !== null) {
      setDragProgress(newProgress);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    const newProgress = calculateProgress(touch.clientX);
    if (newProgress !== null) {
      setDragProgress(newProgress);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && dragProgress !== null) {
      onSeek(dragProgress);
    }
    setIsDragging(false);
    setDragProgress(null);
  };

  const displayProgress = dragProgress !== null ? dragProgress : progress;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div
        ref={progressBarRef}
        className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group touch-none"
        onClick={handleSeek}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayProgress}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            onSeek(Math.max(0, progress - 5));
          } else if (e.key === 'ArrowRight') {
            onSeek(Math.min(100, progress + 5));
          }
        }}
      >
        {/* Background Track */}
        <div className="absolute inset-0 bg-white/10 rounded-full" />
        
        {/* Progress Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          style={{ width: `${displayProgress}%` }}
          initial={false}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: isDragging ? 0 : 0.1 }}
        />
        
        {/* Hover Indicator */}
        {hoverTime !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 pointer-events-none"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          />
        )}
        
        {/* Playhead */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-opacity ${
            isDragging ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{ left: `${displayProgress}%`, marginLeft: '-6px' }}
          whileHover={{ scale: 1.2 }}
        />
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

