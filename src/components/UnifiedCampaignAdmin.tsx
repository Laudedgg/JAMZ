import React, { useState, useEffect } from 'react';
import { UnifiedCampaign, CreateCampaignData, unifiedCampaignApi } from '../lib/unifiedCampaignApi';
import UnifiedCampaignForm from './UnifiedCampaignForm';

const UnifiedCampaignAdmin: React.FC = () => {
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<UnifiedCampaign | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await unifiedCampaignApi.admin.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      alert('Error fetching campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (data: CreateCampaignData) => {
    try {
      setFormLoading(true);
      await unifiedCampaignApi.admin.create(data);
      await fetchCampaigns();
      setShowForm(false);
      alert('Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCampaign = async (data: Partial<CreateCampaignData>) => {
    if (!editingCampaign) return;
    
    try {
      setFormLoading(true);
      await unifiedCampaignApi.admin.update(editingCampaign._id, data);
      await fetchCampaigns();
      setEditingCampaign(null);
      setShowForm(false);
      alert('Campaign updated successfully!');
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await unifiedCampaignApi.admin.delete(id);
      await fetchCampaigns();
      alert('Campaign deleted successfully!');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign');
    }
  };

  const handleEditCampaign = (campaign: UnifiedCampaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      ended: 'bg-yellow-100 text-yellow-800',
      winners_selected: 'bg-blue-100 text-blue-800',
      prizes_distributed: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (showForm) {
    return (
      <UnifiedCampaignForm
        campaign={editingCampaign || undefined}
        onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
        onCancel={handleCancelForm}
        isLoading={formLoading}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prize Pool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prerequisites
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={unifiedCampaignApi.getThumbnailUrl(campaign._id)}
                            alt={campaign.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.png';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.artistId.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(campaign.prizePool.amount, campaign.prizePool.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.maxWinners} winners
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.totalParticipants} / {campaign.maxParticipants}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.totalSubmissions} submissions
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {campaign.prerequisites.requireYouTubeWatch && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            YouTube Watch
                          </span>
                        )}
                        {campaign.prerequisites.requireShareAction && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Share Action
                          </span>
                        )}
                        {!campaign.prerequisites.requireYouTubeWatch && !campaign.prerequisites.requireShareAction && (
                          <span className="text-xs text-gray-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(campaign.status)}
                        {!campaign.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            INACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Start: {formatDate(campaign.startDate)}</div>
                      <div>End: {formatDate(campaign.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No campaigns found</div>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Your First Campaign
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedCampaignAdmin;
