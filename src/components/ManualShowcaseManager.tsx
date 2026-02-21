import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, ExternalLink, Star, Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  manualShowcaseApi,
  ManualShowcaseEntry,
  CampaignOption,
  CreateManualShowcaseEntryRequest,
  platformOptions,
  getPlatformIcon,
  validatePlatformUrl
} from '../lib/manualShowcaseApi';
import { useAuthStore } from '../lib/auth';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export function ManualShowcaseManager() {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [entries, setEntries] = useState<ManualShowcaseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ManualShowcaseEntry | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<CreateManualShowcaseEntryRequest>({
    campaignId: '',
    name: '',
    platform: 'youtube',
    link: '',
    description: '',
    isFeatured: false,
    adminNotes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only fetch campaigns if user is authenticated and is admin, and not loading
    if (!isLoading && isAuthenticated && isAdmin) {
      fetchCampaigns();
    }
  }, [isAuthenticated, isAdmin, isLoading]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchEntries();
    }
  }, [selectedCampaignId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchCampaigns = async () => {
    // Don't fetch if loading, not authenticated or not admin
    if (isLoading || !isAuthenticated || !isAdmin) {
      return;
    }

    try {
      const campaignData = await manualShowcaseApi.getCampaigns();
      setCampaigns(campaignData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      if (error instanceof Error && error.message.includes('401')) {
        showNotification('error', 'Authentication required. Please log in as an admin.');
      } else {
        showNotification('error', 'Failed to load campaigns');
      }
    }
  };

  const fetchEntries = async () => {
    if (!selectedCampaignId || isLoading || !isAuthenticated || !isAdmin) return;

    try {
      setLoading(true);
      const entriesData = await manualShowcaseApi.getEntriesByCampaign(selectedCampaignId);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error fetching entries:', error);
      if (error instanceof Error && error.message.includes('401')) {
        showNotification('error', 'Authentication required. Please log in as an admin.');
      } else {
        showNotification('error', 'Failed to load showcase entries');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.link.trim()) {
      errors.link = 'Link is required';
    } else {
      try {
        new URL(formData.link);
        if (!validatePlatformUrl(formData.platform, formData.link)) {
          errors.link = `Invalid ${formData.platform} URL format`;
        }
      } catch {
        errors.link = 'Please provide a valid URL';
      }
    }

    if (!formData.campaignId && !selectedCampaignId) {
      errors.campaignId = 'Please select a campaign';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        campaignId: formData.campaignId || selectedCampaignId
      };

      if (editingEntry) {
        await manualShowcaseApi.updateEntry(editingEntry._id, submitData);
        showNotification('success', 'Showcase entry updated successfully');
      } else {
        await manualShowcaseApi.createEntry(submitData);
        showNotification('success', 'Showcase entry created successfully');
      }

      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to save entry');
    }
  };

  const handleEdit = (entry: ManualShowcaseEntry) => {
    setEditingEntry(entry);
    setFormData({
      campaignId: typeof entry.campaignId === 'string' ? entry.campaignId : entry.campaignId._id,
      name: entry.name,
      platform: entry.platform,
      link: entry.link,
      description: entry.metadata.description || '',
      isFeatured: entry.isFeatured,
      adminNotes: entry.adminNotes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showcase entry?')) return;

    try {
      await manualShowcaseApi.deleteEntry(id);
      showNotification('success', 'Showcase entry deleted successfully');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      showNotification('error', 'Failed to delete entry');
    }
  };

  const handleToggleStatus = async (entry: ManualShowcaseEntry) => {
    try {
      const newStatus = entry.status === 'active' ? 'hidden' : 'active';
      await manualShowcaseApi.updateEntry(entry._id, { status: newStatus });
      showNotification('success', `Entry ${newStatus === 'active' ? 'activated' : 'hidden'} successfully`);
      fetchEntries();
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', 'Failed to update entry status');
    }
  };

  const handleToggleFeatured = async (entry: ManualShowcaseEntry) => {
    try {
      await manualShowcaseApi.updateEntry(entry._id, { isFeatured: !entry.isFeatured });
      showNotification('success', `Entry ${!entry.isFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchEntries();
    } catch (error) {
      console.error('Error updating featured status:', error);
      showNotification('error', 'Failed to update featured status');
    }
  };

  const resetForm = () => {
    setFormData({
      campaignId: '',
      name: '',
      platform: 'youtube',
      link: '',
      description: '',
      isFeatured: false,
      adminNotes: ''
    });
    setFormErrors({});
    setEditingEntry(null);
    setShowForm(false);
  };

  const selectedCampaign = campaigns.find(c => c._id === selectedCampaignId);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6600FF] mx-auto mb-4"></div>
        <p className="text-white/60">Checking authentication...</p>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-white/60">Please log in as an admin to manage showcase entries.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
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
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Manual Showcase Manager</h2>
          <p className="text-white/60 mt-1">Add and manage showcase entries for campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="glass-button-primary"
          disabled={!selectedCampaignId}
        >
          <Plus className="w-5 h-5" />
          Add Entry
        </button>
      </div>

      {/* Campaign Selection */}
      <div className="glass-card p-6">
        <label className="block text-sm font-medium text-white/60 mb-2">
          Select Campaign
        </label>
        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
        >
          <option value="">Choose a campaign...</option>
          {campaigns.map((campaign) => (
            <option key={campaign._id} value={campaign._id}>
              {campaign.title} ({campaign.status})
            </option>
          ))}
        </select>
        
        {selectedCampaign && (
          <div className="mt-3 p-3 rounded-lg bg-white/5">
            <p className="text-sm text-white/80">{selectedCampaign.description}</p>
            <div className="flex gap-4 mt-2 text-xs text-white/60">
              <span>Status: {selectedCampaign.status}</span>
              <span>Start: {new Date(selectedCampaign.startDate).toLocaleDateString()}</span>
              <span>End: {new Date(selectedCampaign.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Entries List */}
      {selectedCampaignId && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              Showcase Entries ({entries.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6600FF] mx-auto"></div>
              <p className="text-white/60 mt-2">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No showcase entries found for this campaign.</p>
              <button
                onClick={() => setShowForm(true)}
                className="glass-button-primary mt-4"
              >
                <Plus className="w-4 h-4" />
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <motion.div
                  key={entry._id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getPlatformIcon(entry.platform)}</span>
                        <div>
                          <h4 className="font-semibold text-white">{entry.name}</h4>
                          <p className="text-sm text-white/60 capitalize">{entry.platform}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.isFeatured && (
                            <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                              <Star className="w-3 h-3 inline mr-1" />
                              Featured
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : entry.status === 'featured'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>

                      {entry.metadata.description && (
                        <p className="text-sm text-white/70 mb-2">{entry.metadata.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>Added by: {entry.createdBy?.username || entry.createdBy?.email || 'Unknown'}</span>
                        <span>Created: {new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={entry.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="View content"
                      >
                        <ExternalLink className="w-4 h-4 text-white/70" />
                      </a>

                      <button
                        onClick={() => handleToggleFeatured(entry)}
                        className={`p-2 rounded-lg transition-colors ${
                          entry.isFeatured
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                        title={entry.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        <Star className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(entry)}
                        className={`p-2 rounded-lg transition-colors ${
                          entry.status === 'active'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                        title={entry.status === 'active' ? 'Hide entry' : 'Show entry'}
                      >
                        {entry.status === 'active' ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Edit entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Delete entry"
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

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingEntry ? 'Edit Showcase Entry' : 'Add Showcase Entry'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campaign Selection (if not pre-selected) */}
                {!selectedCampaignId && (
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Campaign *
                    </label>
                    <select
                      value={formData.campaignId}
                      onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                      required
                    >
                      <option value="">Choose a campaign...</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign._id} value={campaign._id}>
                          {campaign.title} ({campaign.status})
                        </option>
                      ))}
                    </select>
                    {formErrors.campaignId && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.campaignId}</p>
                    )}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    placeholder="Enter the title/name of the showcase entry"
                    required
                  />
                  {formErrors.name && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Platform *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    required
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Link *
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    placeholder="https://..."
                    required
                  />
                  {formErrors.link && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.link}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    rows={3}
                    placeholder="Optional description of the content"
                  />
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-black/30 text-[#6600FF]"
                  />
                  <label htmlFor="isFeatured" className="text-sm text-white/80">
                    Mark as featured (will appear prominently in showcase)
                  </label>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                    rows={2}
                    placeholder="Internal notes (not visible to users)"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="glass-button-primary flex-1"
                  >
                    {editingEntry ? 'Update Entry' : 'Create Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="glass-button flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
