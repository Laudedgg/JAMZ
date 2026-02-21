import React from 'react';

interface PlatformIframeProps {
  src: string;
  platform: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  allowFullScreen?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLIFrameElement>) => void;
}

/**
 * Platform-specific iframe component that handles different embed requirements
 * Specifically addresses TikTok embed issues on Windows browsers
 */
export function PlatformIframe({
  src,
  platform,
  className = '',
  style = {},
  loading = 'lazy',
  allowFullScreen = false,
  onError
}: PlatformIframeProps) {
  // Platform-specific iframe attributes
  const getPlatformProps = () => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return {
          sandbox: "allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        };
      case 'youtube':
        return {
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        };
      case 'instagram':
        return {
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        };
      default:
        return {};
    }
  };

  const platformProps = getPlatformProps();

  return (
    <iframe
      src={src}
      className={className}
      style={style}
      frameBorder="0"
      loading={loading}
      allowFullScreen={allowFullScreen}
      onError={onError}
      {...platformProps}
    />
  );
}
