import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Trophy, Calendar, DollarSign,
  Eye, Settings, UserCheck, Award, RefreshCw, Plus, CheckCircle2, XCircle, AlertTriangle, Clock
} from 'lucide-react';
import { useArtistAuthStore } from '../lib/artistAuth';
import { unifiedCampaignApi, UnifiedCampaign } from '../lib/unifiedCampaignApi';
import { CampaignParticipants } from '../components/CampaignParticipants';
import { WinnerSelectionModal } from '../components/WinnerSelectionModal';
import { AdminSubmissionManager } from '../components/AdminSubmissionManager';
import { formatCurrency } from '../lib/currencyUtils';

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export function ArtistCampaignManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useArtistAuthStore();

  const [campaign, setCampaign] = useState<UnifiedCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [showSubmissionManager, setShowSubmissionManager] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/artist/login');
      return;
    }
    
    if (id) {
      fetchCampaignData();
    }
  }, [id, isAuthenticated, navigate, refreshTrigger]);

  const fetchCampaignData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const campaignData = await unifiedCampaignApi.get(id);
      setCampaign(campaignData);
    } catch (err: any) {
      console.error('Error fetching campaign data:', err);
      setError(err.message || 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  // Notification helper
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCampaignData();
    setRefreshing(false);
  };

  const fetchSubmissions = async () => {
    if (!id) return;
    try {
      const submissionsData = await unifiedCampaignApi.getShowcase(id, 'approved', false);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h2>
            <p className="text-white/60 mb-6">{error || 'The campaign you are looking for does not exist.'}</p>
            <Link to="/artist/dashboard" className="glass-button-primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
                notification.type === 'success' ? 'bg-green-600' :
                notification.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : notification.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/artist/dashboard"
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold gradient-text">{campaign.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
            campaign.status === 'ended' ? 'bg-yellow-500/20 text-yellow-400' :
            campaign.status === 'winners_selected' ? 'bg-blue-500/20 text-blue-400' :
            campaign.status === 'prizes_distributed' ? 'bg-purple-500/20 text-purple-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {campaign.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Campaign Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 text-center">
            <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency as any)}</div>
            <div className="text-white/60 text-sm">Prize Pool</div>
          </div>

          <div className="glass-card p-6 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{campaign.totalParticipants || 0}/{campaign.maxParticipants}</div>
            <div className="text-white/60 text-sm">Participants</div>
          </div>

          <div className="glass-card p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{submissions.length}</div>
            <div className="text-white/60 text-sm">Submissions</div>
          </div>

          <div className="glass-card p-6 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {new Date(campaign.endDate) > new Date() ?
                Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + 'd' :
                'Ended'
              }
            </div>
            <div className="text-white/60 text-sm">Time Left</div>
          </div>
        </div>

        {/* Submissions Management */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Submissions Management</h2>
            <div className="flex gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowSubmissionManager(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Submission
              </button>
              <button
                onClick={() => setShowParticipants(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Manage All
              </button>
              <button
                onClick={() => setShowWinnerSelection(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <Trophy className="w-4 h-4" />
                Select Winners
              </button>
            </div>
          </div>

          <div className="text-center py-8 text-white/60">
            <h3 className="text-lg font-semibold mb-2">All Submissions ({submissions.length})</h3>
            <p>Use the management buttons above to view participants, manage submissions, and select winners.</p>
            <p className="mt-2">This interface provides the same functionality as the admin campaign management.</p>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showParticipants && (
            <CampaignParticipants
              campaignId={campaign._id}
              onClose={() => setShowParticipants(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showWinnerSelection && (
            <WinnerSelectionModal
              campaign={campaign}
              submissions={submissions}
              onClose={() => setShowWinnerSelection(false)}
              onWinnersSelected={() => {
                setShowWinnerSelection(false);
                refreshData();
                showNotification('success', 'Winners selected successfully!');
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSubmissionManager && (
            <AdminSubmissionManager
              campaignId={campaign._id}
              campaignTitle={campaign.title}
              onClose={() => {
                setShowSubmissionManager(false);
                fetchSubmissions();
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
