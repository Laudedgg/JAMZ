import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Music, ArrowLeft, ExternalLink,
  Youtube, Instagram, AlertTriangle, MessageSquare, Twitter, Facebook
} from 'lucide-react';
import { api } from '../lib/api';
import { useArtistAuthStore } from '../lib/artistAuth';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  artistId: {
    _id: string;
    name: string;
    imageUrl: string;
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      facebook?: string;
      tiktok?: string;
    };
  };
  youtubeUrl: string;
  spotifyUrl: string;
  isActive: boolean;
  challengeRewardUsdt: number;
  challengeRewardJamz: number;
  shareRewardUsdt: number;
  shareRewardJamz: number;
}

interface Challenge {
  _id: string;
  campaignId: string;
  userId: {
    _id: string;
    email: string;
    username: string;
  };
  platform: 'youtube' | 'tiktok' | 'instagram';
  videoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  rewardUsdt: number;
  rewardJamz: number;
  createdAt: string;
}

export function ArtistCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useArtistAuthStore();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/artist/login');
      return;
    }
    
    if (id) {
      fetchCampaignData(id);
    }
  }, [id, isAuthenticated, navigate]);
  

  
  const fetchCampaignData = async (campaignId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch campaign details
      const campaignData = await api.artistCampaigns.get(campaignId);
      setCampaign(campaignData);
      
      // Fetch challenges
      const challengesData = await api.artistCampaigns.getChallenges(campaignId);
      setChallenges(challengesData);
    } catch (err: any) {
      console.error('Error fetching campaign data:', err);
      setError(err.message || 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };
  

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'tiktok':
        return <Music className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };
  

  
  // Challenge Review Modal
  const ChallengeModal = () => {
    if (!selectedChallenge) return null;
    
    return (
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowModal(false)}
      >
        <motion.div
          className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Review Challenge</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Submission Details</h3>
                <div className="glass-card p-4 bg-black/30">
                  <div className="flex items-center gap-2 mb-4">
                    {getPlatformIcon(selectedChallenge.platform)}
                    <span className="capitalize">{selectedChallenge.platform}</span>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Submitted By
                    </label>
                    <p className="text-white">{selectedChallenge.userId.username || selectedChallenge.userId.email}</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Submission Date
                    </label>
                    <p className="text-white">{formatDate(selectedChallenge.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">
                      Video URL
                    </label>
                    <div className="flex items-center gap-2">
                      <a 
                        href={selectedChallenge.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 break-all"
                      >
                        {selectedChallenge.videoUrl}
                      </a>
                      <ExternalLink className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Reward Amount</h3>
                <div className="glass-card p-4 bg-black/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-yellow-400 font-bold">${selectedChallenge.rewardUsdt.toFixed(2)}</span>
                      <span className="text-white/60 mx-2">+</span>
                      <span className="text-purple-400 font-bold">{selectedChallenge.rewardJamz.toFixed(2)} JAMZ</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Feedback (Optional)</h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add feedback for the user..."
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  disabled={submitting}
                />
              </div>
              

              
              {selectedChallenge.feedback && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">Previous Feedback</h3>
                  <div className="glass-card p-4 bg-black/30">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 text-white/60 mt-0.5" />
                      <p className="text-white">{selectedChallenge.feedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center mb-2">Error</h1>
          <p className="text-white/60 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/artist/dashboard')}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full glass-card p-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center mb-2">Campaign Not Found</h1>
          <p className="text-white/60 text-center mb-6">The campaign you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/artist/dashboard')}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
      
      <div className="pt-8 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => navigate('/artist/dashboard')}
              className="flex items-center text-white/60 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <img
                  src={campaign.artistId?.imageUrl || 'https://via.placeholder.com/64?text=A'}
                  alt={campaign.artistId?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h1 className="text-2xl font-bold">{campaign.title}</h1>
                  <p className="text-white/60">{campaign.artistId?.name}</p>
                  {/* Artist Social Media Links */}
                  {campaign.artistId?.socialMedia && (
                    <div className="flex items-center gap-2 mt-2">
                      {campaign.artistId.socialMedia.instagram && (
                        <a
                          href={campaign.artistId.socialMedia.instagram.startsWith('http')
                            ? campaign.artistId.socialMedia.instagram
                            : `https://instagram.com/${campaign.artistId.socialMedia.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-7 h-7 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full hover:scale-110 transition-transform"
                          title="Instagram"
                        >
                          <Instagram className="w-3.5 h-3.5 text-white" />
                        </a>
                      )}
                      {campaign.artistId.socialMedia.twitter && (
                        <a
                          href={campaign.artistId.socialMedia.twitter.startsWith('http')
                            ? campaign.artistId.socialMedia.twitter
                            : `https://twitter.com/${campaign.artistId.socialMedia.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-7 h-7 bg-black rounded-full hover:scale-110 transition-transform border border-white/20"
                          title="X (Twitter)"
                        >
                          <Twitter className="w-3.5 h-3.5 text-white" />
                        </a>
                      )}
                      {campaign.artistId.socialMedia.facebook && (
                        <a
                          href={campaign.artistId.socialMedia.facebook.startsWith('http')
                            ? campaign.artistId.socialMedia.facebook
                            : `https://facebook.com/${campaign.artistId.socialMedia.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-7 h-7 bg-blue-600 rounded-full hover:scale-110 transition-transform"
                          title="Facebook"
                        >
                          <Facebook className="w-3.5 h-3.5 text-white" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                {campaign.isActive ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                    Inactive
                  </span>
                )}
                
                <a 
                  href={campaign.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-4 glass-button"
                >
                  <Youtube className="w-5 h-5 text-red-500" />
                  View on YouTube
                </a>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-4">Campaign Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">Description</h3>
                    <p className="text-white">{campaign.description || 'No description provided.'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">Challenge Reward</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold">${campaign.challengeRewardUsdt.toFixed(2)}</span>
                      <span className="text-white/60">+</span>
                      <span className="text-purple-400 font-bold">{campaign.challengeRewardJamz.toFixed(2)} JAMZ</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">Share Reward</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold">${campaign.shareRewardUsdt.toFixed(2)}</span>
                      <span className="text-white/60">+</span>
                      <span className="text-purple-400 font-bold">{campaign.shareRewardJamz.toFixed(2)} JAMZ</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-4">Challenge Stats</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Total Challenges</span>
                    <span className="text-white font-bold">{challenges.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <div className="glass-card p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold">Challenge Submissions</h2>
                </div>
                
                {challenges.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">No Challenges Found</h3>
                    <p className="text-white/60">
                      There are no challenge submissions for this campaign yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {challenges.map((challenge) => (
                      <div 
                        key={challenge._id} 
                        className="glass-card p-4 bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setFeedback(challenge.feedback || '');
                          setShowModal(true);
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                              {getPlatformIcon(challenge.platform)}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">
                                {challenge.userId.username || challenge.userId.email}
                              </h3>
                              <p className="text-sm text-white/60">
                                Submitted {formatDate(challenge.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={challenge.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-sm flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Submission
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        </div>
                        
                        {challenge.feedback && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-white/60 mt-0.5" />
                              <p className="text-sm text-white/80">{challenge.feedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showModal && <ChallengeModal />}
        
        {notification && (
          <motion.div
            key="notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg flex items-center gap-2 ${
              notification.type === 'success' 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ArtistCampaignDetail;
