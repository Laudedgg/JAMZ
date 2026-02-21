import React, { useState } from 'react';
import { Music, AlertCircle, CheckCircle } from 'lucide-react';

export function SpotifyTestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const handleGetAuthUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setAuthUrl(null);

      console.log('📡 Testing Spotify auth-url endpoint...');

      const response = await fetch('/api/spotify/auth-url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get auth URL');
      }

      const data = await response.json();
      console.log('✅ Got auth URL:', data.authUrl);

      setAuthUrl(data.authUrl);
      setSuccess('✅ Successfully retrieved Spotify auth URL!');
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to get auth URL');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToSpotify = () => {
    if (authUrl) {
      console.log('🔄 Redirecting to Spotify...');
      window.location.href = authUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Music className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold text-white">Spotify OAuth Test</h1>
          </div>

          <p className="text-gray-300 mb-6">
            This page tests the Spotify OAuth flow without requiring jamz.fun authentication.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-semibold">Error</p>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-semibold">Success</p>
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Auth URL Display */}
          {authUrl && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-300 font-semibold mb-2">Generated Auth URL:</p>
              <p className="text-blue-200 text-xs break-all font-mono">{authUrl}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleGetAuthUrl}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {loading ? 'Loading...' : 'Get Spotify Auth URL'}
            </button>

            {authUrl && (
              <button
                onClick={handleRedirectToSpotify}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Redirect to Spotify
              </button>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
            <p className="text-gray-300 font-semibold mb-2">Debug Info:</p>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Frontend URL: {window.location.origin}</li>
              <li>• API Base: /api/spotify</li>
              <li>• Endpoint: /api/spotify/auth-url</li>
              <li>• Method: GET</li>
              <li>• Auth Required: No</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

