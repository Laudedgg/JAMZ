import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import { AdminNav } from './AdminDashboard';
import { ManualShowcaseManager } from '../components/ManualShowcaseManager';

export function ShowcaseManagerPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
            <p className="text-white/60 mb-8">Please log in as an admin to manage showcase entries.</p>
            <button
              onClick={() => navigate('/admin/login')}
              className="glass-button-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminNav />
        <ManualShowcaseManager />
      </div>
    </div>
  );
}
