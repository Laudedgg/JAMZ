import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink, Clock, Award } from 'lucide-react';
import { api } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

// Import the Share and Challenge interfaces from the API
import { Share, Challenge } from '../lib/api';

// Extend the Share interface with our component-specific needs
interface ParticipantShare extends Omit<Share, 'userId'> {
  userId: {
    _id: string;
    username?: string;
    email?: string;
  };
  type: 'share';
}

// Extend the Challenge interface with our component-specific needs
interface ParticipantChallenge extends Omit<Challenge, 'userId'> {
  userId: {
    _id: string;
    username?: string;
    email?: string;
  };
  type: 'challenge';
}

// Unified type for our participants data
type Participant = ParticipantShare | ParticipantChallenge;

interface CampaignParticipantsProps {
  campaignId: string;
  onClose: () => void;
}

export function CampaignParticipants({ campaignId, onClose }: CampaignParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const [sortMethod, setSortMethod] = useState<'earliest' | 'latest'>('earliest');
  const [activeTab, setActiveTab] = useState<'all' | 'shares' | 'challenges'>('all');

  // Debug function to check auth and campaign ID
  const debugCampaign = async () => {
    try {
      console.log("Debugging campaign ID:", campaignId);
      
      // Check if token exists
      const token = localStorage.getItem('auth_token');
      console.log("Auth token exists:", !!token);
      if (token) {
        console.log("Token first 10 chars:", token.substring(0, 10) + "...");
      }
      
      // Test the URL directly with each version
      console.log("TESTING DIFFERENT URL FORMATS:");
      
      // Test 1: Direct URL
      try {
        const cacheBuster = new Date().getTime();
        const directUrl = `/api/shares/campaign/${campaignId}/participants?_=${cacheBuster}`;
        console.log("Testing direct URL:", directUrl);
        
        const directResponse = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log("Direct response status:", directResponse.status);
        const textContent = await directResponse.text();
        console.log("Response text (first 100 chars):", 
          textContent.substring(0, 100) + (textContent.length > 100 ? '...' : ''));
      } catch (directErr) {
        console.error("Direct URL test error:", directErr);
      }
      
      // Test 2: Debug endpoint
      try {
        const debugUrl = `/api/shares/campaign/debug/${campaignId}`;
        console.log("Testing debug URL:", debugUrl);
        
        const debugResponse = await fetch(debugUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log("Debug endpoint status:", debugResponse.status);
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log("Debug response data:", debugData);
          return debugData;
        } else {
          const debugText = await debugResponse.text();
          console.log("Debug error text:", debugText.substring(0, 100));
        }
      } catch (debugErr) {
        console.error("Debug URL test error:", debugErr);
      }
      
      return { error: "URL tests completed - see console" };
    } catch (err: any) {
      console.error("Debug function error:", err);
      return { error: err.message || "Unknown error" };
    }
  };

  // Add a simpler version that doesn't use the API abstraction
  const testDirectFetch = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = `/api/shares/campaign/${campaignId}/participants`;
      console.log("🔍 Testing direct fetch to:", url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log("👉 Direct fetch status:", response.status);
      const responseText = await response.text();
      console.log("👉 Response first 100 chars:", responseText.substring(0, 100));
      
      return responseText;
    } catch (err) {
      console.error("⚠️ Direct fetch error:", err);
      return null;
    }
  };

  // Add a super simple test function that calls a basic endpoint
  const testAPIConnectivity = async () => {
    try {
      console.log("TESTING BASIC API CONNECTIVITY");
      const testResponse = await fetch('/api/shares/test');
      console.log("Test response status:", testResponse.status);
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log("💯 API TEST SUCCESS:", data);
        return true;
      } else {
        console.error("❌ API TEST FAILED - Status:", testResponse.status);
        const text = await testResponse.text();
        console.error("Response text:", text);
        return false;
      }
    } catch (err) {
      console.error("❌ API TEST ERROR:", err);
      return false;
    }
  };

  useEffect(() => {
    // First test basic API connectivity
    testAPIConnectivity().then(success => {
      console.log("API Test result:", success ? "SUCCESS" : "FAILED");
      
      // Then debug the campaign and fetch participants
      debugCampaign().then(debugInfo => {
        console.log("Debug complete, now fetching participants");
        fetchParticipants();
      });
    });
  }, [campaignId]);

  const fetchParticipants = async () => {
    console.log('Attempting to fetch participants for campaign:', campaignId);
    
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Verify the auth token before making the request
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.error('No auth token found in localStorage');
        setError('You need to be logged in as an admin to view participants');
        setLoading(false);
        return;
      }

      // Ensure we have a valid campaign ID
      if (!campaignId || typeof campaignId !== 'string' || campaignId.trim() === '') {
        console.error('Invalid campaign ID:', campaignId);
        setError('Invalid campaign ID');
        setLoading(false);
        return;
      }
      
      // Fetch both shares and challenges
      console.log('Making API calls to fetch participants for campaign:', campaignId);
      
      try {
        // Fetch shares
        const sharesData = await api.shares.getCampaignParticipants(campaignId);
        console.log('Received shares data from API:', sharesData);
        
        // Fetch challenges
        const challengesData = await api.challenges.getCampaignParticipants(campaignId);
        console.log('Received challenges data from API:', challengesData);
        
        // Transform shares data
        const transformedShares: ParticipantShare[] = Array.isArray(sharesData) 
          ? sharesData.map(share => {
              // Make sure share.userId is treated as an object with proper type assertion
              const userId = typeof share.userId === 'object' && share.userId !== null 
                ? share.userId as Record<string, any>
                : {} as Record<string, any>;
              
              return {
                ...share,
                type: 'share',
                userId: {
                  _id: userId.id || userId._id || 'unknown',
                  username: userId.username || 'Unknown User',
                  email: userId.email || ''
                }
              };
            })
          : [];
        
        // Transform challenges data
        const transformedChallenges: ParticipantChallenge[] = Array.isArray(challengesData)
          ? challengesData.map(challenge => {
              // Make sure challenge.userId is treated as an object with proper type assertion
              const userId = typeof challenge.userId === 'object' && challenge.userId !== null
                ? challenge.userId as Record<string, any>
                : {} as Record<string, any>;
              
              return {
                ...challenge,
                type: 'challenge',
                userId: {
                  _id: userId.id || userId._id || 'unknown',
                  username: userId.username || 'Unknown User',
                  email: userId.email || ''
                }
              };
            })
          : [];
        
        // Combine both types of data
        const allParticipants = [...transformedShares, ...transformedChallenges];
        console.log('Combined participant data:', allParticipants);
        setParticipants(allParticipants);
      } catch (fetchErr: any) {
        console.error('Error in one of the fetch operations:', fetchErr);
        setError(fetchErr.message || 'Failed to load all participant data');
        setParticipants([]);
      }
    } catch (err: any) {
      console.error('Error fetching participants:', err);
      
      // Provide more specific error messages based on error type
      if (err.message?.includes('404')) {
        setError('Campaign not found or you do not have permission to view participants');
      } else if (err.message?.includes('403')) {
        setError('Access denied: Only admins or the campaign artist can view participants');
      } else if (err.message?.includes('Authentication required') || err.message?.includes('JWT')) {
        setError('Authentication error: Please log in again');
        // You might want to trigger a logout here
        localStorage.removeItem('auth_token');
      } else {
        setError(err.message || 'Failed to load participants. Please try again later.');
      }
      
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const approveShare = async (shareId: string) => {
    try {
      setApproving(prev => ({ ...prev, [shareId]: true }));
      await api.shares.approveShare(shareId);
      
      // Update local participants data
      setParticipants(prev => 
        prev.map(item => {
          if (item.type === 'share' && item._id === shareId) {
            return { 
              ...item, 
              approved: true, 
              approvedAt: new Date().toISOString() 
            };
          }
          return item;
        })
      );
    } catch (err: any) {
      console.error('Error approving share:', err);
      setError(err.message || 'Failed to approve share');
    } finally {
      setApproving(prev => ({ ...prev, [shareId]: false }));
    }
  };
  
  const approveChallenge = async (challengeId: string) => {
    try {
      setApproving(prev => ({ ...prev, [challengeId]: true }));
      await api.challenges.updateStatus(challengeId, 'approved');
      
      // Update local participants data
      setParticipants(prev => 
        prev.map(item => {
          if (item.type === 'challenge' && item._id === challengeId) {
            return { 
              ...item, 
              status: 'approved'
            };
          }
          return item;
        })
      );
    } catch (err: any) {
      console.error('Error approving challenge:', err);
      setError(err.message || 'Failed to approve challenge');
    } finally {
      setApproving(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <span className="text-blue-400">𝕏</span>;
      case 'facebook':
        return <span className="text-blue-600">fb</span>;
      case 'tiktok':
        return <span className="text-pink-500">TT</span>;
      case 'instagram':
        return <span className="text-pink-600">IG</span>;
      case 'youtube':
        return <span className="text-red-500">YT</span>;
      default:
        return <span>🔗</span>;
    }
  };

  const formatTimestamp = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Filter and sort participants based on activeTab
  const filteredParticipants = participants.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'shares') return item.type === 'share';
    if (activeTab === 'challenges') return item.type === 'challenge';
    return true;
  });
  
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (sortMethod === 'earliest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-4xl w-full p-4 max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold gradient-text">Campaign Participants</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <div className="font-bold mb-1">Error:</div>
            <div>{error}</div>
            <button 
              onClick={fetchParticipants} 
              className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tab navigation */}
        <div className="mb-4 flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-[#6600FF] text-white' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            All ({participants.length})
          </button>
          <button 
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'challenges' 
                ? 'border-[#6600FF] text-white' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Challenges ({participants.filter(p => p.type === 'challenge').length})
          </button>
          <button 
            onClick={() => setActiveTab('shares')}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'shares' 
                ? 'border-[#6600FF] text-white' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Shares ({participants.filter(p => p.type === 'share').length})
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-white/60">
            {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} found
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/60">Sort by:</label>
            <select
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value as 'earliest' | 'latest')}
              className="bg-black/30 border border-white/10 rounded-lg text-sm px-2 py-1"
            >
              <option value="earliest">Earliest First (FCFS)</option>
              <option value="latest">Latest First</option>
            </select>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-10 text-white/60">
              No participants found for this campaign yet.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">User</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">Platform</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">Link</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">Submitted</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-white/60 border-b border-white/10">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5">
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      {item.userId.username || item.userId.email || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      {item.type === 'challenge' ? (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">Challenge</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Share</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      {getPlatformIcon(item.platform)} {item.platform}
                    </td>
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      {item.type === 'share' ? (
                        item.linkUrl ? (
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-white/40">No link provided</span>
                        )
                      ) : item.type === 'challenge' ? (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-white/40">No link available</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      <div className="flex items-center gap-1 text-white/60">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      {item.type === 'share' ? (
                        (item as ParticipantShare).approved ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            Approved
                            {(item as ParticipantShare).approvedAt && (
                              <span className="text-xs text-white/40">
                                ({formatTimestamp((item as ParticipantShare).approvedAt || '')})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-yellow-500">Pending</span>
                        )
                      ) : (
                        <span className={`
                          ${(item as ParticipantChallenge).status === 'approved' ? 'text-green-500' : ''}
                          ${(item as ParticipantChallenge).status === 'pending' ? 'text-yellow-500' : ''}
                          ${(item as ParticipantChallenge).status === 'rejected' ? 'text-red-500' : ''}
                        `}>
                          {(item as ParticipantChallenge).status.charAt(0).toUpperCase() + 
                            (item as ParticipantChallenge).status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-white/5 text-sm">
                      {item.type === 'share' && !(item as ParticipantShare).approved && (
                        <button
                          onClick={() => approveShare(item._id)}
                          disabled={approving[item._id]}
                          className="px-2 py-1 text-xs rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {approving[item._id] ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                      {item.type === 'challenge' && (item as ParticipantChallenge).status === 'pending' && (
                        <button
                          onClick={() => approveChallenge(item._id)}
                          disabled={approving[item._id]}
                          className="px-2 py-1 text-xs rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {approving[item._id] ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
