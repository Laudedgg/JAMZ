import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ParallaxWrapperProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // Negative values move slower, positive move faster
  direction?: 'up' | 'down';
}

export const ParallaxWrapper: React.FC<ParallaxWrapperProps> = ({
  children,
  className = '',
  speed = 0.5,
  direction = 'up'
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const multiplier = direction === 'up' ? -1 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed * multiplier, -100 * speed * multiplier]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y: smoothY }}>
        {children}
      </motion.div>
    </div>
  );
};

// Scale on scroll effect
interface ScaleOnScrollProps {
  children: React.ReactNode;
  className?: string;
  scaleRange?: [number, number];
}

export const ScaleOnScroll: React.FC<ScaleOnScrollProps> = ({
  children,
  className = '',
  scaleRange = [0.8, 1]
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} className={className} style={{ scale: smoothScale }}>
      {children}
    </motion.div>
  );
};

// Rotate on scroll effect
interface RotateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  rotateRange?: [number, number];
}

export const RotateOnScroll: React.FC<RotateOnScrollProps> = ({
  children,
  className = '',
  rotateRange = [-5, 5]
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotate = useTransform(scrollYProgress, [0, 1], rotateRange);
  const smoothRotate = useSpring(rotate, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} className={className} style={{ rotate: smoothRotate }}>
      {children}
    </motion.div>
  );
};

// Opacity fade on scroll
interface FadeOnScrollProps {
  children: React.ReactNode;
  className?: string;
  fadeIn?: boolean;
}

export const FadeOnScroll: React.FC<FadeOnScrollProps> = ({
  children,
  className = '',
  fadeIn = true
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], fadeIn ? [0, 1] : [1, 0]);
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} className={className} style={{ opacity: smoothOpacity }}>
      {children}
    </motion.div>
  );
};

// Horizontal scroll reveal
interface HorizontalRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right';
}

export const HorizontalReveal: React.FC<HorizontalRevealProps> = ({
  children,
  className = '',
  direction = 'left'
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const multiplier = direction === 'left' ? -1 : 1;
  const x = useTransform(scrollYProgress, [0, 1], [100 * multiplier, 0]);
  const smoothX = useSpring(x, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} className={className} style={{ x: smoothX }}>
      {children}
    </motion.div>
  );
};

