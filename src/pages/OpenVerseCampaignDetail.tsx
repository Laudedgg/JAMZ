import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Users, Clock, DollarSign, Eye,
  AlertTriangle, Play, ExternalLink, Crown, Gift,
  RefreshCw, MessageSquare, Calendar, Target, XCircle,
  Plus, FileText
} from 'lucide-react';
import { AdminNav } from './AdminDashboard';
import { useAuthStore } from '../lib/auth';
import { openVerseApi, OpenVerseCampaign, OpenVerseSubmission } from '../lib/openVerseApi';
import { AdminSubmissionManager } from '../components/AdminSubmissionManager';
import { formatCurrency } from '../lib/currencyUtils';

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
}

// Helper function to generate embed URLs (moved outside component)
const getEmbedUrl = (platform: string, contentUrl: string): string | null => {
  try {
    switch (platform) {
      case 'instagram':
        // Extract post ID from Instagram URL
        const instagramMatch = contentUrl.match(/\/p\/([^\/\?]+)/);
        if (instagramMatch) {
          return `https://www.instagram.com/p/${instagramMatch[1]}/embed/`;
        }
        break;
      case 'tiktok':
        // Extract video ID from TikTok URL
        const tiktokMatch = contentUrl.match(/\/video\/(\d+)/);
        if (tiktokMatch) {
          return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
        }
        break;
      case 'youtube':
        // Extract video ID from YouTube URL
        const youtubeMatch = contentUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (youtubeMatch) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        break;
    }
    return null;
  } catch (error) {
    console.error('Error generating embed URL:', error);
    return null;
  }
};

export function OpenVerseCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  const [campaign, setCampaign] = useState<OpenVerseCampaign | null>(null);
  const [submissions, setSubmissions] = useState<OpenVerseSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  // Removed status tabs - showing all submissions
  // Removed selectedSubmissions - simplified workflow
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [distributingPrizes, setDistributingPrizes] = useState(false);
  const [showSubmissionManager, setShowSubmissionManager] = useState(false);

  useEffect(() => {
    if (id && isAuthenticated && isAdmin) {
      fetchCampaignData();
    }
  }, [id, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (campaign) {
      fetchSubmissions();
    }
  }, [campaign]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const campaignData = await openVerseApi.campaigns.get(id!);
      setCampaign(campaignData);
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!campaign) return;

    try {
      setSubmissionsLoading(true);
      const submissionsData = await openVerseApi.admin.submissions.getByCampaign(campaign._id);
      setSubmissions(submissionsData);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      showNotification('error', 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Removed approval/rejection functions - simplified workflow

  // Removed toggleSubmissionSelection - simplified workflow

  const handleDistributePrizes = async () => {
    if (!confirm('Are you sure you want to distribute prizes to all winners? This action cannot be undone.')) {
      return;
    }

    try {
      setDistributingPrizes(true);
      const result = await openVerseApi.admin.winners.distributePrizes(campaign._id);

      showNotification('success', 'Prizes distributed successfully!');

      // Show distribution results if available
      if (result.results) {
        const successCount = result.results.filter((r: any) => r.status === 'success').length;
        const failCount = result.results.filter((r: any) => r.status === 'failed').length;

        if (failCount > 0) {
          showNotification('warning', `${successCount} prizes distributed successfully, ${failCount} failed`);
        }
      }

      // Refresh campaign data
      fetchCampaignData();
      fetchSubmissions();
    } catch (err) {
      console.error('Error distributing prizes:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to distribute prizes');
    } finally {
      setDistributingPrizes(false);
    }
  };

  // Removed getStatusColor - no longer showing submission statuses

  const getPlatformInfo = (platform: string) => {
    return openVerseApi.utils.getPlatformInfo(platform);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // getEmbedUrl moved outside component scope

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

  if (error || !campaign) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h2>
            <p className="text-white/60 mb-6">{error || 'The campaign you are looking for does not exist.'}</p>
            <Link to="/admin/open-verse" className="glass-button-primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show all submissions - no filtering needed
  const filteredSubmissions = submissions;

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
            to="/admin/open-verse"
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
            <div className="text-2xl font-bold text-white">{campaign.totalParticipants}/{campaign.maxParticipants}</div>
            <div className="text-white/60 text-sm">Participants</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{campaign.maxWinners}</div>
            <div className="text-white/60 text-sm">Winners</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{openVerseApi.utils.formatTimeRemaining(campaign.endDate)}</div>
            <div className="text-white/60 text-sm">Time Left</div>
          </div>
        </div>

        {/* Prize Distribution Status */}
        {campaign.winnersSelected && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Prize Distribution</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${campaign.prizesDistributed ? 'text-green-400' : 'text-yellow-400'}`}>
                  {campaign.prizesDistributed ? 'Completed' : 'Pending'}
                </div>
                <div className="text-white/60 text-sm">Distribution Status</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {submissions.filter(s => s.isWinner).length}
                </div>
                <div className="text-white/60 text-sm">Winners Selected</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {submissions.filter(s => s.isWinner && s.prizeDistributed).length}
                </div>
                <div className="text-white/60 text-sm">Prizes Distributed</div>
              </div>
            </div>

            {campaign.prizesDistributed && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">All prizes have been distributed successfully!</span>
                </div>
                <div className="text-green-300 text-sm mt-1">
                  Distributed on: {campaign.prizesDistributedAt ? formatDate(campaign.prizesDistributedAt) : 'Unknown'}
                </div>
              </div>
            )}

            {/* Winners List */}
            {submissions.filter(s => s.isWinner).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Winners</h3>
                <div className="space-y-3">
                  {submissions
                    .filter(s => s.isWinner)
                    .sort((a, b) => (a.winnerRank || 0) - (b.winnerRank || 0))
                    .map((winner) => {
                      const platformInfo = getPlatformInfo(winner.platform);
                      return (
                        <div
                          key={winner._id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                              {winner.winnerRank}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                @{winner.userId?.username || winner.metadata?.author?.username || 'Anonymous'}
                              </div>
                              <div className="text-white/60 text-sm">
                                {platformInfo.name} • {formatDate(winner.createdAt)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-white font-medium">
                              {winner.prizeAmount} {winner.prizeCurrency}
                            </div>
                            <div className={`text-sm ${
                              winner.prizeDistributed ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {winner.prizeDistributed ? 'Distributed' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submissions Section */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Submissions Management</h2>
            <div className="flex gap-2">
              <button
                onClick={fetchSubmissions}
                className="glass-button"
                disabled={submissionsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${submissionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowSubmissionManager(true)}
                className="glass-button"
              >
                <Plus className="w-4 h-4" />
                Add Submission
              </button>
              <button
                onClick={() => setShowSubmissionManager(true)}
                className="glass-button"
              >
                <FileText className="w-4 h-4" />
                Manage All
              </button>
              {!campaign.winnersSelected && submissions.length > 0 && (
                <button
                  onClick={() => setShowWinnerSelection(true)}
                  className="glass-button-primary"
                >
                  <Crown className="w-4 h-4" />
                  Select Winners
                </button>
              )}
              {campaign.winnersSelected && !campaign.prizesDistributed && (
                <button
                  onClick={handleDistributePrizes}
                  className="glass-button-primary"
                  disabled={distributingPrizes}
                >
                  {distributingPrizes ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Distributing...
                    </div>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      Distribute Prizes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">All Submissions ({submissions.length})</h2>
          </div>

          {/* Removed bulk actions - simplified workflow */}

          {/* Submissions Grid */}
          {submissionsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((submission) => {
                const platformInfo = getPlatformInfo(submission.platform);

                return (
                  <motion.div
                    key={submission._id}
                    className="glass-card p-4 border-2 border-transparent transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Selection Checkbox */}
                    {/* Removed status display and selection checkbox - simplified workflow */}

                    {/* Content Preview */}
                    <div
                      className="submission-thumbnail aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3 relative overflow-hidden cursor-pointer group"
                      onClick={() => window.open(submission.contentUrl, '_blank')}
                    >
                      {(() => {
                        const embedUrl = getEmbedUrl(submission.platform, submission.contentUrl);

                        // Try to show iframe preview first (with pointer-events disabled)
                        if (embedUrl) {
                          // Platform-specific iframe attributes
                          const iframeProps = submission.platform === 'tiktok' ? {
                            sandbox: "allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin",
                            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          } : {};

                          return (
                            <>
                              <iframe
                                src={embedUrl}
                                className="w-full h-full rounded-lg border-0"
                                frameBorder="0"
                                loading="lazy"
                                style={{ pointerEvents: 'none' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                {...iframeProps}
                              />
                              {/* Fallback thumbnail if iframe fails */}
                              {submission.metadata?.thumbnailUrl && (
                                <img
                                  src={submission.metadata.thumbnailUrl}
                                  alt="Submission thumbnail"
                                  className="w-full h-full object-cover absolute inset-0"
                                  style={{ zIndex: -1 }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                            </>
                          );
                        }

                        // Fallback to thumbnail image
                        if (submission.metadata?.thumbnailUrl) {
                          return (
                            <img
                              src={submission.metadata.thumbnailUrl}
                              alt="Submission thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          );
                        }

                        // Final fallback to platform icon
                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-2xl">{platformInfo.icon}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Platform Badge */}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                        <span className="text-xs">{platformInfo.icon}</span>
                      </div>

                      {/* Winner Badge */}
                      {submission.isWinner && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-black" />
                        </div>
                      )}

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* Submission Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          @{submission.userId?.username || submission.metadata?.author?.username || 'Anonymous'}
                        </span>
                        <span className="text-white/60 text-sm">
                          {platformInfo.name}
                        </span>
                      </div>

                      {submission.metadata?.title && (
                        <p className="text-white/70 text-sm line-clamp-2">
                          {submission.metadata.title}
                        </p>
                      )}

                      <div className="text-white/50 text-xs">
                        Submitted: {formatDate(submission.createdAt)}
                      </div>

                      {submission.isWinner && (
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2">
                          <div className="flex items-center gap-2 text-yellow-400 text-sm">
                            <Crown className="w-4 h-4" />
                            <span>Winner - Rank #{submission.winnerRank}</span>
                          </div>
                          <div className="text-yellow-300 text-xs">
                            Prize: {submission.prizeAmount} {submission.prizeCurrency}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Removed action buttons - simplified workflow */}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No submissions yet
              </h3>
              <p className="text-white/60">
                No submissions have been received yet.
              </p>
            </div>
          )}
        </div>

        {/* Winner Selection Modal */}
        <AnimatePresence>
          {showWinnerSelection && (
            <WinnerSelectionModal
              campaign={campaign}
              submissions={submissions}
              onClose={() => setShowWinnerSelection(false)}
              onWinnersSelected={() => {
                setShowWinnerSelection(false);
                fetchCampaignData();
                fetchSubmissions();
                showNotification('success', 'Winners selected successfully!');
              }}
            />
          )}
        </AnimatePresence>

        {/* Submission Manager Modal */}
        <AnimatePresence>
          {showSubmissionManager && (
            <AdminSubmissionManager
              campaignId={campaign._id}
              campaignTitle={campaign.title}
              onClose={() => {
                setShowSubmissionManager(false);
                fetchSubmissions(); // Refresh submissions after changes
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Winner Selection Modal Component
interface WinnerSelectionModalProps {
  campaign: OpenVerseCampaign;
  submissions: OpenVerseSubmission[];
  onClose: () => void;
  onWinnersSelected: () => void;
}

function WinnerSelectionModal({ campaign, submissions, onClose, onWinnersSelected }: WinnerSelectionModalProps) {
  const [selectedWinners, setSelectedWinners] = useState<Array<{
    submissionId: string;
    rank: number;
    prizeAmount: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleWinnerToggle = (submissionId: string) => {
    const existingIndex = selectedWinners.findIndex(w => w.submissionId === submissionId);

    if (existingIndex >= 0) {
      // Remove winner
      const newWinners = selectedWinners.filter(w => w.submissionId !== submissionId);
      // Reorder ranks
      const reorderedWinners = newWinners.map((winner, index) => ({
        ...winner,
        rank: index + 1
      }));
      setSelectedWinners(reorderedWinners);
    } else {
      // Add winner
      if (selectedWinners.length >= campaign.maxWinners) {
        setError(`Maximum ${campaign.maxWinners} winners allowed`);
        return;
      }

      const newRank = selectedWinners.length + 1;
      const prizeAmount = campaign.prizeDistribution?.find(p => p.rank === newRank)?.amount || 0;

      setSelectedWinners([...selectedWinners, {
        submissionId,
        rank: newRank,
        prizeAmount
      }]);
    }
    setError('');
  };

  const handleSubmit = async () => {
    if (selectedWinners.length === 0) {
      setError('Please select at least one winner');
      return;
    }

    try {
      setLoading(true);
      await openVerseApi.admin.winners.select(campaign._id, selectedWinners);
      onWinnersSelected();
    } catch (err) {
      console.error('Error selecting winners:', err);
      setError(err instanceof Error ? err.message : 'Failed to select winners');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">Select Winners</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-white/70 mb-2">
            Select up to {Math.min(campaign.maxWinners, submissions.length)} winners from {submissions.length} submissions.
          </p>
          <div className="text-sm text-white/60">
            Selected: {selectedWinners.length}/{Math.min(campaign.maxWinners, submissions.length)}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {submissions.map((submission) => {
            const isSelected = selectedWinners.some(w => w.submissionId === submission._id);
            const winner = selectedWinners.find(w => w.submissionId === submission._id);
            const platformInfo = openVerseApi.utils.getPlatformInfo(submission.platform);

            return (
              <div
                key={submission._id}
                onClick={() => handleWinnerToggle(submission._id)}
                className={`glass-card p-4 cursor-pointer border-2 transition-all ${
                  isSelected ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent hover:border-white/20'
                }`}
              >
                <div className="submission-thumbnail aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3 relative overflow-hidden group">
                  {(() => {
                    const embedUrl = getEmbedUrl(submission.platform, submission.contentUrl);

                    // Try to show iframe preview first (with pointer-events disabled)
                    if (embedUrl) {
                      // Platform-specific iframe attributes
                      const iframeProps = submission.platform === 'tiktok' ? {
                        sandbox: "allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin",
                        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      } : {};

                      return (
                        <>
                          <iframe
                            src={embedUrl}
                            className="w-full h-full rounded-lg border-0"
                            frameBorder="0"
                            loading="lazy"
                            style={{ pointerEvents: 'none' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            {...iframeProps}
                          />
                          {/* Fallback thumbnail if iframe fails */}
                          {submission.metadata?.thumbnailUrl && (
                            <img
                              src={submission.metadata.thumbnailUrl}
                              alt="Submission thumbnail"
                              className="w-full h-full object-cover absolute inset-0"
                              style={{ zIndex: -1 }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </>
                      );
                    }

                    // Fallback to thumbnail image
                    if (submission.metadata?.thumbnailUrl) {
                      return (
                        <img
                          src={submission.metadata.thumbnailUrl}
                          alt="Submission thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      );
                    }

                    // Final fallback to platform icon
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-2xl">{platformInfo.icon}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                    <span className="text-xs">{platformInfo.icon}</span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">{winner?.rank}</span>
                    </div>
                  )}

                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-white font-medium">
                    @{submission.userId?.username || submission.metadata?.author?.username || 'Anonymous'}
                  </div>
                  {submission.metadata?.title && (
                    <div className="text-white/60 text-sm line-clamp-1">
                      {submission.metadata.title}
                    </div>
                  )}
                  {isSelected && (
                    <div className="text-yellow-400 text-sm mt-1">
                      Prize: {winner?.prizeAmount} {campaign.prizePool.currency}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="glass-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="glass-button-primary"
            disabled={loading || selectedWinners.length === 0}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Selecting Winners...
              </div>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Select {selectedWinners.length} Winners
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
