import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

export function AdminLogin() {
  const [email, setEmail] = useState('admin@jamz.fun');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold mb-6 gradient-text text-center">Admin Login</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                required
                placeholder="admin@jamz.fun"
              />
              <p className="mt-1 text-xs text-white/40">Email: admin@jamz.fun</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                required
                placeholder="Enter your password"
              />
              <p className="mt-1 text-xs text-white/40">Password: admin123</p>
            </div>

            <button
              type="submit"
              className="w-full glass-button-primary justify-center mt-6"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}