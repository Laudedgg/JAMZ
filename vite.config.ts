import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 3000,
    // Use HTTP for localhost (Spotify OAuth requires HTTP for localhost)
    https: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Local backend (change to https://jamz.fun for production)
        changeOrigin: true,
        configure: (proxy, options) => {
          console.log('Proxy config:', options);
          // Add error handler to proxy
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
        // Add debug logging for proxy
        rewrite: (path) => {
          console.log('Proxying:', path);
          return path;
        }
      }
    }
  }
});
