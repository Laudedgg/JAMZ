import React from 'react';
import { useAuthStore } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import UnifiedCampaignAdmin from '../components/UnifiedCampaignAdmin';

const UnifiedCampaignAdminPage: React.FC = () => {
  const { user } = useAuthStore();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <UnifiedCampaignAdmin />
      </div>
    </div>
  );
};

export default UnifiedCampaignAdminPage;
