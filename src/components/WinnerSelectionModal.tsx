import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XCircle, Trophy, CheckCircle, AlertTriangle } from 'lucide-react';
import { unifiedCampaignApi, UnifiedCampaign, CampaignSubmission } from '../lib/unifiedCampaignApi';

interface WinnerSelectionModalProps {
  campaign: UnifiedCampaign;
  submissions: CampaignSubmission[];
  onClose: () => void;
  onWinnersSelected: () => void;
}

export function WinnerSelectionModal({ campaign, submissions, onClose, onWinnersSelected }: WinnerSelectionModalProps) {
  const [selectedWinners, setSelectedWinners] = useState<Array<{
    submissionId: string;
    rank: number;
    prizeAmount: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [campaignSubmissions, setCampaignSubmissions] = useState<CampaignSubmission[]>(submissions);

  // Fetch submissions if not provided
  useEffect(() => {
    if (submissions.length === 0) {
      fetchSubmissions();
    }
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await unifiedCampaignApi.getShowcase(campaign._id, 'approved', false);
      setCampaignSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions');
    }
  };

  const handleWinnerToggle = (submissionId: string) => {
    const existingIndex = selectedWinners.findIndex(w => w.submissionId === submissionId);
    
    if (existingIndex >= 0) {
      // Remove from winners
      setSelectedWinners(prev => prev.filter(w => w.submissionId !== submissionId));
    } else {
      // Add as winner
      if (selectedWinners.length >= campaign.maxWinners) {
        setError(`Maximum ${campaign.maxWinners} winners allowed`);
        return;
      }
      
      const nextRank = selectedWinners.length + 1;
      const prizeForRank = campaign.prizeDistribution.find(p => p.rank === nextRank);
      
      if (!prizeForRank) {
        setError('No prize defined for this rank');
        return;
      }
      
      setSelectedWinners(prev => [...prev, {
        submissionId,
        rank: nextRank,
        prizeAmount: prizeForRank.amount
      }]);
    }
    setError('');
  };

  const handleSubmitWinners = async () => {
    if (selectedWinners.length === 0) {
      setError('Please select at least one winner');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await unifiedCampaignApi.selectWinners(campaign._id, selectedWinners);
      onWinnersSelected();
    } catch (error: any) {
      console.error('Error selecting winners:', error);
      setError(error.message || 'Failed to select winners');
    } finally {
      setLoading(false);
    }
  };

  const isWinner = (submissionId: string) => {
    return selectedWinners.some(w => w.submissionId === submissionId);
  };

  const getWinnerRank = (submissionId: string) => {
    const winner = selectedWinners.find(w => w.submissionId === submissionId);
    return winner?.rank;
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
          <h2 className="text-2xl font-bold text-white">Select Winners</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Campaign: {campaign.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-white/60">Max Winners:</span>
              <span className="text-white ml-2">{campaign.maxWinners}</span>
            </div>
            <div>
              <span className="text-white/60">Selected:</span>
              <span className="text-white ml-2">{selectedWinners.length}</span>
            </div>
            <div>
              <span className="text-white/60">Total Prize:</span>
              <span className="text-white ml-2">{campaign.prizePool.amount} {campaign.prizePool.currency}</span>
            </div>
            <div>
              <span className="text-white/60">Submissions:</span>
              <span className="text-white ml-2">{campaignSubmissions.length}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-semibold text-white mb-3">Prize Distribution</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {campaign.prizeDistribution.map((prize, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-white/60">#{prize.rank}</span>
                <span className="text-white font-medium">{prize.amount} {campaign.prizePool.currency}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="text-md font-semibold text-white">Submissions</h4>
          {campaignSubmissions.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No approved submissions found for this campaign.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaignSubmissions.map((submission) => (
                <div
                  key={submission._id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isWinner(submission._id)
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                  onClick={() => handleWinnerToggle(submission._id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-white">
                        {submission.metadata?.title || 'Untitled Submission'}
                      </h5>
                      <p className="text-sm text-white/60">
                        by {submission.userId.username || submission.userId.email}
                      </p>
                      <p className="text-xs text-white/40 capitalize">
                        {submission.platform}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isWinner(submission._id) && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-400">#{getWinnerRank(submission._id)}</span>
                        </div>
                      )}
                      <CheckCircle 
                        className={`w-5 h-5 ${
                          isWinner(submission._id) ? 'text-yellow-400' : 'text-white/20'
                        }`} 
                      />
                    </div>
                  </div>
                  
                  {submission.metadata?.thumbnailUrl && (
                    <img
                      src={submission.metadata.thumbnailUrl}
                      alt="Submission thumbnail"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  
                  <a
                    href={submission.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Original →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitWinners}
            disabled={loading || selectedWinners.length === 0}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Selecting Winners...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Select Winners ({selectedWinners.length})
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
