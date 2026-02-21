import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, ExternalLink, X, CheckCircle2, AlertCircle, Eye, User } from 'lucide-react';
import { openVerseApi } from '../lib/openVerseApi';

interface AdminSubmission {
  _id: string;
  campaignId: string;
  userId?: {
    _id: string;
    username?: string;
    email: string;
  };
  platform: 'instagram' | 'tiktok' | 'youtube';
  contentUrl: string;
  metadata?: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    author?: {
      username?: string;
      displayName?: string;
    };
  };
  status: 'pending' | 'approved' | 'rejected' | 'disqualified';
  isWinner: boolean;
  winnerRank?: number;
  prizeAmount?: number;
  prizeCurrency?: string;
  createdAt: string;
  isManualEntry?: boolean; // Flag to distinguish manual admin entries
}

interface AddSubmissionFormData {
  platform: 'instagram' | 'tiktok' | 'youtube';
  contentUrl: string;
  authorName: string;
  // Optional fields for advanced users
  title?: string;
  description?: string;
  authorUsername?: string;
  thumbnailUrl?: string;
  isWinner: boolean;
  winnerRank?: number;
  prizeAmount?: number;
  prizeCurrency?: 'JAMZ' | 'USDT' | 'NGN' | 'AED';
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface AdminSubmissionManagerProps {
  campaignId: string;
  campaignTitle: string;
  onClose?: () => void;
}

export function AdminSubmissionManager({ campaignId, campaignTitle, onClose }: AdminSubmissionManagerProps) {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<AdminSubmission | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<AddSubmissionFormData>({
    platform: 'youtube',
    contentUrl: '',
    authorName: '',
    title: '',
    description: '',
    authorUsername: '',
    thumbnailUrl: '',
    isWinner: false,
    winnerRank: undefined,
    prizeAmount: undefined,
    prizeCurrency: 'JAMZ'
  });

  useEffect(() => {
    fetchSubmissions();
  }, [campaignId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await openVerseApi.admin.submissions.getByCampaign(campaignId);
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      showNotification('error', 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const resetForm = () => {
    setFormData({
      platform: 'youtube',
      contentUrl: '',
      authorName: '',
      title: '',
      description: '',
      authorUsername: '',
      thumbnailUrl: '',
      isWinner: false,
      winnerRank: undefined,
      prizeAmount: undefined,
      prizeCurrency: 'JAMZ'
    });
    setEditingSubmission(null);
    setShowForm(false);
  };

  const validateForm = (): boolean => {
    if (!formData.contentUrl.trim()) {
      showNotification('error', 'Content URL is required');
      return false;
    }
    if (!formData.authorName.trim()) {
      showNotification('error', 'Creator name is required');
      return false;
    }
    if (formData.isWinner && (!formData.winnerRank || formData.winnerRank < 1)) {
      showNotification('error', 'Winner rank must be specified for winners');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingSubmission) {
        // Update existing submission
        await openVerseApi.admin.submissions.update(editingSubmission._id, {
          platform: formData.platform,
          contentUrl: formData.contentUrl,
          title: formData.title,
          description: formData.description,
          authorName: formData.authorName,
          authorUsername: formData.authorUsername,
          thumbnailUrl: formData.thumbnailUrl,
          isWinner: formData.isWinner,
          winnerRank: formData.winnerRank,
          prizeAmount: formData.prizeAmount,
          prizeCurrency: formData.prizeCurrency
        });
        showNotification('success', 'Submission updated successfully');
      } else {
        // Create new manual submission
        await openVerseApi.admin.submissions.createManual(campaignId, {
          platform: formData.platform,
          contentUrl: formData.contentUrl,
          title: formData.title || `${formData.authorName}'s ${formData.platform} post`, // Auto-generate title if not provided
          description: formData.description || '',
          authorName: formData.authorName,
          authorUsername: formData.authorUsername || '',
          thumbnailUrl: formData.thumbnailUrl || '',
          isWinner: formData.isWinner,
          winnerRank: formData.winnerRank,
          prizeAmount: formData.prizeAmount,
          prizeCurrency: formData.prizeCurrency
        });
        showNotification('success', 'Manual submission created successfully');
      }

      resetForm();
      fetchSubmissions();
    } catch (error) {
      console.error('Error saving submission:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to save submission');
    }
  };

  const handleEdit = (submission: AdminSubmission) => {
    setEditingSubmission(submission);
    setFormData({
      platform: submission.platform,
      contentUrl: submission.contentUrl,
      title: submission.metadata?.title || '',
      description: submission.metadata?.description || '',
      authorName: submission.metadata?.author?.displayName || '',
      authorUsername: submission.metadata?.author?.username || '',
      thumbnailUrl: submission.metadata?.thumbnailUrl || '',
      isWinner: submission.isWinner,
      winnerRank: submission.winnerRank,
      prizeAmount: submission.prizeAmount,
      prizeCurrency: (submission.prizeCurrency as any) || 'JAMZ'
    });
    setShowForm(true);
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      await openVerseApi.admin.submissions.delete(submissionId);
      showNotification('success', 'Submission deleted successfully');
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      showNotification('error', 'Failed to delete submission');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'instagram': return '📷';
      case 'tiktok': return '🎵';
      default: return '🔗';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'text-red-400';
      case 'instagram': return 'text-pink-400';
      case 'tiktok': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Manage Submissions</h2>
              <p className="text-white/60 mt-1">{campaignTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="glass-button-primary"
              >
                <Plus className="w-5 h-5" />
                Add Manual Submission
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="glass-button"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mx-6 mt-4 p-4 rounded-lg border ${
                notification.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm">{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {editingSubmission ? 'Edit Submission' : 'Add Manual Submission'}
                </h3>
                <button
                  onClick={resetForm}
                  className="glass-button"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Essential Fields */}
                <div className="space-y-4">
                  {/* Platform */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Platform *
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    >
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>

                  {/* Content URL */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Content URL *
                    </label>
                    <input
                      type="url"
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  {/* Creator Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Creator Name *
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Creator's name"
                      required
                    />
                  </div>
                </div>

                {/* Winner Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isWinner"
                      checked={formData.isWinner}
                      onChange={(e) => setFormData({ ...formData, isWinner: e.target.checked })}
                      className="w-4 h-4 text-primary bg-white/5 border-white/20 rounded focus:ring-primary/50"
                    />
                    <label htmlFor="isWinner" className="text-sm font-medium text-white/80">
                      Mark as Winner
                    </label>
                  </div>

                  {formData.isWinner && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Winner Rank *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.winnerRank || ''}
                          onChange={(e) => setFormData({ ...formData, winnerRank: parseInt(e.target.value) || undefined })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Prize Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.prizeAmount || ''}
                          onChange={(e) => setFormData({ ...formData, prizeAmount: parseFloat(e.target.value) || undefined })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Prize Currency
                        </label>
                        <select
                          value={formData.prizeCurrency}
                          onChange={(e) => setFormData({ ...formData, prizeCurrency: e.target.value as any })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="JAMZ">JAMZ</option>
                          <option value="USDT">USDT</option>
                          <option value="NGN">NGN</option>
                          <option value="AED">AED</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="glass-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button-primary"
                  >
                    {editingSubmission ? 'Update Submission' : 'Add Submission'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Submissions List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-white/60 mt-2">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Submissions</h3>
                  <p className="text-white/60 mb-6">This campaign doesn't have any submissions yet.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="glass-button-primary"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Submission
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <motion.div
                      key={submission._id}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getPlatformIcon(submission.platform)}</span>
                            <div>
                              <h4 className="font-semibold text-white">
                                {submission.metadata?.title || 'Untitled'}
                              </h4>
                              <p className="text-sm text-white/60">
                                by {submission.metadata?.author?.displayName || submission.metadata?.author?.username || 'Unknown'}
                              </p>
                            </div>
                            {submission.isWinner && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                                <span className="text-yellow-400 text-xs">🏆 Winner #{submission.winnerRank}</span>
                              </div>
                            )}
                          </div>
                          
                          {submission.metadata?.description && (
                            <p className="text-white/70 text-sm mb-2 line-clamp-2">
                              {submission.metadata.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-white/50">
                            <span className={getPlatformColor(submission.platform)}>
                              {submission.platform.toUpperCase()}
                            </span>
                            <span>
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </span>
                            {submission.userId ? (
                              <span>User: {submission.userId.username || submission.userId.email}</span>
                            ) : (
                              <span className="text-purple-400">Manual Entry</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <a
                            href={submission.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-button text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleEdit(submission)}
                            className="glass-button text-sm"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(submission._id)}
                            className="glass-button text-sm hover:bg-red-500/20 hover:border-red-500/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
