import React, { Suspense } from 'react';
import Spline from '@splinetool/react-spline';
import { ErrorBoundary } from './ErrorBoundary';

const LoadingFallback = () => (
  <div className="w-full h-full bg-gradient-to-r from-purple-900/50 via-black/50 to-purple-900/50 animate-pulse" />
);

export function SplineScene() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Spline
          scene="https://prod.spline.design/oPMzGkIgVFR5lW2O/scene.splinecode"
          onLoad={() => {
            console.log('Spline scene loaded successfully');
          }}
          onError={(error) => {
            console.error('Spline scene failed to load:', error);
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
}