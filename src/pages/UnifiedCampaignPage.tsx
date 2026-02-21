import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Trophy, Users, Calendar, CheckCircle, AlertCircle, Share2, Play, Instagram, Twitter, Facebook } from 'lucide-react';
import { UnifiedCampaign, CampaignEligibility, CampaignSubmission, unifiedCampaignApi } from '../lib/unifiedCampaignApi';
import { useAuthStore } from '../lib/auth';
import UnifiedYouTubePlayer from '../components/UnifiedYouTubePlayer';
import ShareButton from '../components/ShareButton';
import SubmissionModal from '../components/SubmissionModal';
import SimpleShareEarn from '../components/SimpleShareEarn';

const UnifiedCampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [campaign, setCampaign] = useState<UnifiedCampaign | null>(null);
  const [eligibility, setEligibility] = useState<CampaignEligibility | null>(null);
  const [submissions, setSubmissions] = useState<CampaignSubmission[]>([]);
  const [winners, setWinners] = useState<CampaignSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id, refreshTrigger]);

  useEffect(() => {
    if (id && isAuthenticated) {
      checkEligibility();
    }
  }, [id, isAuthenticated, refreshTrigger]);

  const fetchCampaignData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [campaignData, submissionsData, winnersData] = await Promise.all([
        unifiedCampaignApi.get(id),
        unifiedCampaignApi.getShowcase(id, 'approved', true),
        unifiedCampaignApi.getWinners(id)
      ]);
      
      setCampaign(campaignData);
      setSubmissions(submissionsData);
      setWinners(winnersData);
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      const eligibilityData = await unifiedCampaignApi.checkEligibility(id);
      setEligibility(eligibilityData);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const handleYouTubeWatchComplete = async (videoId: string) => {
    if (!id) return;
    
    try {
      await unifiedCampaignApi.completeYouTubeWatch(id, videoId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error completing YouTube watch:', error);
    }
  };

  const handleShareComplete = async (platform: string, url?: string) => {
    if (!id) return;
    
    try {
      await unifiedCampaignApi.completeShareAction(id, platform, url);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error completing share action:', error);
    }
  };

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const isEligibleToSubmit = () => {
    if (!campaign || !eligibility) return false;
    
    // Check if campaign requires prerequisites
    if (campaign.prerequisites.requireYouTubeWatch && !eligibility.prerequisites.youtubeWatchCompleted) {
      return false;
    }
    
    if (campaign.prerequisites.requireShareAction && !eligibility.prerequisites.shareActionCompleted) {
      return false;
    }
    
    return eligibility.isEligible && !eligibility.hasSubmitted;
  };

  const getPrerequisiteStatus = () => {
    if (!campaign || !eligibility) return [];
    
    const prerequisites = [];
    
    if (campaign.prerequisites.requireYouTubeWatch) {
      prerequisites.push({
        name: 'Watch YouTube Video',
        completed: eligibility.prerequisites.youtubeWatchCompleted,
        required: true
      });
    }
    
    if (campaign.prerequisites.requireShareAction) {
      prerequisites.push({
        name: 'Share Campaign',
        completed: eligibility.prerequisites.shareActionCompleted,
        required: true
      });
    }
    
    return prerequisites;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <button
            onClick={() => navigate('/campaigns')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center text-white/80 hover:text-white mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Campaigns
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8"
            >
              <div className="flex items-start gap-6">
                <img
                  src={unifiedCampaignApi.getThumbnailUrl(campaign._id)}
                  alt={campaign.title}
                  className="w-32 h-32 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
                  <p className="text-white/80 mb-4">{campaign.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{campaign.artistId.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span>{formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency)} Prize Pool</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Ends {formatDate(campaign.endDate)}</span>
                    </div>
                  </div>

                  {/* Artist Social Media Links */}
                  {campaign.artistId?.socialMedia && (
                    <div className="flex items-center gap-2 mt-3">
                      {campaign.artistId.socialMedia.instagram && (
                        <a
                          href={campaign.artistId.socialMedia.instagram.startsWith('http')
                            ? campaign.artistId.socialMedia.instagram
                            : `https://instagram.com/${campaign.artistId.socialMedia.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full hover:scale-110 transition-transform"
                          title="Follow on Instagram"
                        >
                          <Instagram className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {campaign.artistId.socialMedia.twitter && (
                        <a
                          href={campaign.artistId.socialMedia.twitter.startsWith('http')
                            ? campaign.artistId.socialMedia.twitter
                            : `https://twitter.com/${campaign.artistId.socialMedia.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 bg-black rounded-full hover:scale-110 transition-transform border border-white/20"
                          title="Follow on X (Twitter)"
                        >
                          <Twitter className="w-4 h-4 text-white" />
                        </a>
                      )}
                      {campaign.artistId.socialMedia.facebook && (
                        <a
                          href={campaign.artistId.socialMedia.facebook.startsWith('http')
                            ? campaign.artistId.socialMedia.facebook
                            : `https://facebook.com/${campaign.artistId.socialMedia.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full hover:scale-110 transition-transform"
                          title="Follow on Facebook"
                        >
                          <Facebook className="w-4 h-4 text-white" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* YouTube Player */}
            {campaign.youtubeUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch & Earn
                </h2>
                <UnifiedYouTubePlayer
                  videoId={getYouTubeVideoId(campaign.youtubeUrl) || ''}
                  onWatchComplete={handleYouTubeWatchComplete}
                  campaignId={campaign._id}
                  title={campaign.title}
                  isPrerequisite={campaign.prerequisites.requireYouTubeWatch}
                  prerequisiteCompleted={eligibility?.prerequisites.youtubeWatchCompleted || false}
                />
              </motion.div>
            )}

            {/* Share & Earn */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share & Earn
              </h2>
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  Share this track on social media to earn rewards and help spread the music!
                </p>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-[#6600FF] via-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share & Earn Rewards
                </button>
                {campaign.prerequisites.requireShareAction && (
                  <div className="flex items-center gap-2 text-sm">
                    {eligibility?.prerequisites.shareActionCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Share requirement completed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400">Share required to participate</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Prerequisites Status */}
            {isAuthenticated && getPrerequisiteStatus().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Prize Eligibility Requirements</h2>
                <div className="space-y-3">
                  {getPrerequisiteStatus().map((prerequisite, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {prerequisite.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className={`${prerequisite.completed ? 'text-green-400' : 'text-white/80'}`}>
                        {prerequisite.name}
                      </span>
                      {prerequisite.completed && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                {!eligibility?.isEligible && (
                  <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      Complete all requirements above to be eligible for prizes when you submit your entry.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Submission Button */}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Submit Your Entry</h2>
                
                {eligibility?.hasSubmitted ? (
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400">
                      ✅ You have already submitted your entry to this campaign!
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSubmissionModal(true)}
                    disabled={!isEligibleToSubmit()}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      isEligibleToSubmit()
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isEligibleToSubmit() ? 'Submit Your Entry' : 'Complete Prerequisites First'}
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Campaign Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Participants</span>
                  <span className="text-white">{campaign.totalParticipants} / {campaign.maxParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Submissions</span>
                  <span className="text-white">{campaign.totalSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Winners</span>
                  <span className="text-white">{winners.length} / {campaign.maxWinners}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className="text-white capitalize">{campaign.status.replace('_', ' ')}</span>
                </div>
              </div>
            </motion.div>

            {/* Prize Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Prize Distribution</h3>
              <div className="space-y-2">
                {campaign.prizeDistribution.map((prize, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-white/60">#{prize.rank}</span>
                    <span className="text-white">{formatCurrency(prize.amount, campaign.prizePool.currency)}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* External Links */}
            {(campaign.spotifyUrl || campaign.appleUrl) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">Listen On</h3>
                <div className="space-y-3">
                  {campaign.spotifyUrl && (
                    <a
                      href={campaign.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Spotify
                    </a>
                  )}
                  {campaign.appleUrl && (
                    <a
                      href={campaign.appleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Apple Music
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Submissions Grid */}
        {submissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Submissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <div key={submission._id} className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                  <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                    {submission.metadata?.thumbnailUrl ? (
                      <img
                        src={submission.metadata.thumbnailUrl}
                        alt={submission.metadata.title || 'Submission'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60">
                        <Play className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-white font-medium mb-1">
                    {submission.metadata?.title || 'Untitled Submission'}
                  </h3>
                  
                  <p className="text-white/60 text-sm mb-2">
                    by {submission.userId.username}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                      {submission.platform}
                    </span>
                    
                    {submission.isWinner && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                        🏆 Winner #{submission.winnerRank}
                      </span>
                    )}
                  </div>
                  
                  <a
                    href={submission.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Submission
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && campaign && (
        <SubmissionModal
          campaign={campaign}
          onClose={() => setShowSubmissionModal(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )}

      {/* Share & Earn Modal */}
      {showShareModal && campaign && (
        <SimpleShareEarn
          trackId={campaign._id}
          title={campaign.title}
          artist={campaign.artistId}
          rewardAmount={campaign.shareRewardUsd || 0}
          rewardCurrency="USD"
          onClose={() => setShowShareModal(false)}
          onShareComplete={(platform) => {
            console.log(`Shared on ${platform}`);
            setShowShareModal(false);
            handleShareComplete();
          }}
        />
      )}
    </div>
  );
};

export default UnifiedCampaignPage;
