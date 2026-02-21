import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Users, Trophy, DollarSign, Calendar, Image, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { AdminNav } from './AdminDashboard';
import { useAuthStore } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { OpenVerseCampaignForm } from '../components/OpenVerseCampaignForm';
import { AdminSubmissionManager } from '../components/AdminSubmissionManager';
import { unifiedCampaignApi, UnifiedCampaign } from '../lib/unifiedCampaignApi';
import { formatCurrency } from '../lib/currencyUtils';

interface OpenVerseCampaign {
  _id: string;
  title: string;
  description: string;
  thumbnailImage: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  artistId?: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  prerequisites?: {
    requireShareAction: boolean;
  };
  prizePool: {
    amount: number;
    currency: 'JAMZ' | 'USDT';
  };
  maxParticipants: number;
  maxWinners: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'draft' | 'active' | 'ended' | 'winners_selected' | 'prizes_distributed';
  allowedPlatforms: string[];
  totalSubmissions: number;
  totalParticipants: number;
  winnersSelected: boolean;
  prizesDistributed: boolean;
  createdAt: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

// Combined campaign type for admin display
type AdminCombinedCampaign = (OpenVerseCampaign | UnifiedCampaign) & {
  campaignType: 'openverse' | 'unified';
};

export function OpenVerseAdmin() {
  const [campaigns, setCampaigns] = useState<AdminCombinedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<OpenVerseCampaign | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showSubmissionManager, setShowSubmissionManager] = useState(false);
  const [selectedCampaignForSubmissions, setSelectedCampaignForSubmissions] = useState<OpenVerseCampaign | null>(null);
  const { isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchCampaigns();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Fetching campaigns with token:', token ? 'Token present' : 'No token');

      // Fetch campaigns from both APIs in parallel
      const [openVerseResponse, unifiedCampaignsResponse] = await Promise.allSettled([
        fetch('/api/open-verse/admin/campaigns', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        unifiedCampaignApi.admin.getAll()
      ]);

      const allCampaigns: AdminCombinedCampaign[] = [];

      // Add OpenVerse campaigns
      if (openVerseResponse.status === 'fulfilled' && openVerseResponse.value.ok) {
        const openVerseData = await openVerseResponse.value.json();
        const openVerseCampaigns = openVerseData.map((campaign: OpenVerseCampaign) => ({
          ...campaign,
          campaignType: 'openverse' as const
        }));
        allCampaigns.push(...openVerseCampaigns);
      }

      // Add Unified campaigns
      console.log('Unified campaigns response status:', unifiedCampaignsResponse.status);
      if (unifiedCampaignsResponse.status === 'fulfilled') {
        console.log('Unified campaigns data:', unifiedCampaignsResponse.value);
        const unifiedCampaigns = unifiedCampaignsResponse.value.map((campaign: UnifiedCampaign) => ({
          ...campaign,
          campaignType: 'unified' as const
        }));
        console.log('Processed unified campaigns:', unifiedCampaigns.length);
        allCampaigns.push(...unifiedCampaigns);
      } else {
        console.error('Unified campaigns failed:', unifiedCampaignsResponse.reason);
      }

      // Sort campaigns by creation date (newest first)
      allCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      showNotification('error', 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/open-verse/admin/campaigns/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete campaign');
      }

      setCampaigns(campaigns.filter(c => c._id !== id));
      showNotification('success', 'Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete campaign');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');

      // Determine new status based on current state
      let newStatus = 'active';
      let newActive = true;

      if (currentActive && currentStatus === 'active') {
        // Currently active, so deactivate
        newStatus = 'draft';
        newActive = false;
      }

      const response = await fetch(`/api/open-verse/admin/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: newActive,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign status');
      }

      const updatedCampaign = await response.json();
      setCampaigns(campaigns.map(c => c._id === id ? updatedCampaign : c));
      showNotification('success', `Campaign ${newActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      showNotification('error', 'Failed to update campaign status');
    }
  };

  const handleSaveCampaign = (savedCampaign: OpenVerseCampaign) => {
    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(campaigns.map(c => c._id === savedCampaign._id ? savedCampaign : c));
      showNotification('success', 'Campaign updated successfully');
    } else {
      // Add new campaign
      setCampaigns([savedCampaign, ...campaigns]);
      showNotification('success', 'Campaign created successfully');
    }
    setEditingCampaign(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleManageSubmissions = (campaign: OpenVerseCampaign) => {
    setSelectedCampaignForSubmissions(campaign);
    setShowSubmissionManager(true);
  };

  const handleCloseSubmissionManager = () => {
    setShowSubmissionManager(false);
    setSelectedCampaignForSubmissions(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400';
      case 'active': return 'text-green-400';
      case 'ended': return 'text-yellow-400';
      case 'winners_selected': return 'text-blue-400';
      case 'prizes_distributed': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
            <p className="text-white/60 mb-8">Please log in as an admin to manage campaigns.</p>
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

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6600FF]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminNav />

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              } text-white`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Campaign Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="glass-button-primary"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign._id}
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Campaign Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-4 overflow-hidden">
                {campaign.thumbnailImage ? (
                  <img
                    src={campaign.campaignType === 'openverse'
                      ? `/api/open-verse/campaigns/${campaign._id}/thumbnail`
                      : `/api/unified-campaigns/${campaign._id}/thumbnail`
                    }
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-12 h-12 text-white/30" />
                  </div>
                )}
              </div>

              {/* Campaign Info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.campaignType === 'openverse'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {campaign.campaignType === 'openverse' ? 'Admin' : 'Artist'}
                  </span>
                </div>
                <p className="text-white/60 text-sm line-clamp-2 mb-3">{campaign.description}</p>
                
                <div className="flex items-center justify-between text-sm text-white/50 mb-2">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>{formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency as any)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{campaign.totalParticipants}/{campaign.maxParticipants}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-white/50 mb-3">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>{campaign.maxWinners} Winners</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(campaign.endDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    campaign.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={campaign.campaignType === 'openverse'
                    ? `/admin/open-verse/${campaign._id}`
                    : `/artist/campaign-management/${campaign._id}`
                  }
                  className="flex-1 glass-button text-sm flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
                <button
                  onClick={() => {
                    setEditingCampaign(campaign);
                    setShowForm(true);
                  }}
                  className="flex-1 glass-button text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleManageSubmissions(campaign)}
                  className="flex-1 glass-button text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Submissions
                </button>
                <button
                  onClick={() => handleStatusToggle(campaign._id, campaign.status, campaign.isActive)}
                  className={`flex-1 text-sm px-3 py-2 rounded-lg transition-colors ${
                    campaign.isActive && campaign.status === 'active'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {campaign.isActive && campaign.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(campaign._id)}
                  className="glass-button text-sm text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Campaigns</h3>
            <p className="text-white/60 mb-6">Create your first campaign to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="glass-button-primary"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </button>
          </div>
        )}

        {/* Campaign Form Modal */}
        <AnimatePresence>
          {showForm && (
            <OpenVerseCampaignForm
              campaign={editingCampaign}
              onClose={handleCloseForm}
              onSave={handleSaveCampaign}
            />
          )}
        </AnimatePresence>

        {/* Submission Manager Modal */}
        <AnimatePresence>
          {showSubmissionManager && selectedCampaignForSubmissions && (
            <AdminSubmissionManager
              campaignId={selectedCampaignForSubmissions._id}
              campaignTitle={selectedCampaignForSubmissions.title}
              onClose={handleCloseSubmissionManager}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
