import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Spotify authorization failed: ${error}`);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Spotify');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Get auth token from localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setStatus('error');
          setMessage('You must be logged in to connect Spotify');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        // Exchange code for token
        const response = await fetch('/api/spotify/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to connect Spotify');
        }

        const data = await response.json();
        setStatus('success');
        setMessage('✓ Spotify connected successfully!');
        
        // Redirect to discovery page after 2 seconds
        setTimeout(() => {
          navigate('/discover');
        }, 2000);
      } catch (error: any) {
        console.error('Spotify callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Spotify');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-8 border border-green-500/20 text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-bold text-white mb-2">Connecting Spotify</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to Discovery...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

