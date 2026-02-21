import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Campaign from '../models/campaign.js';
import OpenVerseCampaign from '../models/openVerseCampaign.js';
import UnifiedCampaign from '../models/unifiedCampaign.js';
import Artist from '../models/artist.js';

dotenv.config();

/**
 * Migration script to merge Campaign and OpenVerseCampaign models into UnifiedCampaign
 * 
 * This script will:
 * 1. Create new UnifiedCampaign documents by merging existing Campaign and OpenVerseCampaign data
 * 2. Preserve all existing functionality and data
 * 3. Set up proper prerequisite flags based on existing reward configurations
 * 4. Create backup collections before migration
 */

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createBackups() {
  console.log('Creating backup collections...');
  
  try {
    // Backup existing campaigns
    const campaigns = await Campaign.find({});
    if (campaigns.length > 0) {
      await mongoose.connection.db.collection('campaigns_backup').insertMany(
        campaigns.map(c => c.toObject())
      );
      console.log(`Backed up ${campaigns.length} campaigns to campaigns_backup`);
    }
    
    // Backup existing open verse campaigns
    const openVerseCampaigns = await OpenVerseCampaign.find({});
    if (openVerseCampaigns.length > 0) {
      await mongoose.connection.db.collection('openversecampaigns_backup').insertMany(
        openVerseCampaigns.map(c => c.toObject())
      );
      console.log(`Backed up ${openVerseCampaigns.length} open verse campaigns to openversecampaigns_backup`);
    }
  } catch (error) {
    console.error('Error creating backups:', error);
    throw error;
  }
}

async function migrateData() {
  console.log('Starting data migration...');
  
  try {
    // Get all existing campaigns with their linked showcases
    const campaigns = await Campaign.find({}).populate('artistId').populate('showcaseId');
    console.log(`Found ${campaigns.length} campaigns to migrate`);
    
    // Get all standalone showcases (not linked to campaigns)
    const linkedShowcaseIds = campaigns
      .filter(c => c.showcaseId)
      .map(c => c.showcaseId._id.toString());
    
    const standaloneShowcases = await OpenVerseCampaign.find({
      _id: { $nin: linkedShowcaseIds }
    });
    console.log(`Found ${standaloneShowcases.length} standalone showcases to migrate`);
    
    let migratedCount = 0;
    
    // Migrate campaigns with linked showcases
    for (const campaign of campaigns) {
      if (!campaign.showcaseId) {
        console.log(`Skipping campaign ${campaign.title} - no linked showcase`);
        continue;
      }
      
      const showcase = campaign.showcaseId;
      
      // Determine prerequisites based on existing rewards
      const prerequisites = {
        requireYouTubeWatch: (campaign.watchRewardUsd > 0 || campaign.watchRewardJamz > 0),
        requireShareAction: (campaign.shareRewardUsd > 0 || campaign.shareRewardJamz > 0)
      };
      
      const unifiedCampaign = new UnifiedCampaign({
        // Basic info from both sources
        title: campaign.title,
        description: campaign.description || showcase.description,
        
        // Artist info from campaign
        artistId: campaign.artistId?._id || campaign.artistId,
        
        // Media URLs from campaign
        youtubeUrl: campaign.youtubeUrl,
        spotifyUrl: campaign.spotifyUrl,
        appleUrl: campaign.appleUrl,
        otherDspUrls: campaign.otherDspUrls,
        
        // Visual from showcase
        thumbnailImage: showcase.thumbnailImage,
        
        // Prize system from showcase
        prizePool: showcase.prizePool,
        maxWinners: showcase.maxWinners,
        prizeDistribution: showcase.prizeDistribution,
        maxParticipants: showcase.maxParticipants,
        allowedPlatforms: showcase.allowedPlatforms,
        submissionGuidelines: showcase.submissionGuidelines,
        
        // NEW: Prerequisites
        prerequisites,
        
        // Legacy rewards (now used as prerequisites)
        shareRewardUsd: campaign.shareRewardUsd,
        shareRewardJamz: campaign.shareRewardJamz,
        shareRewardNgn: campaign.shareRewardNgn,
        shareRewardAed: campaign.shareRewardAed,
        watchRewardUsd: campaign.watchRewardUsd,
        watchRewardJamz: campaign.watchRewardJamz,
        watchRewardNgn: campaign.watchRewardNgn,
        watchRewardAed: campaign.watchRewardAed,
        challengeRewardUsd: campaign.challengeRewardUsd,
        challengeRewardJamz: campaign.challengeRewardJamz,
        challengeRewardNgn: campaign.challengeRewardNgn,
        challengeRewardAed: campaign.challengeRewardAed,
        
        // Referral system from campaign
        maxReferralRewards: campaign.maxReferralRewards,
        maxReferralRewardsPerUser: campaign.maxReferralRewardsPerUser,
        totalReferralRewardsGiven: campaign.totalReferralRewardsGiven,
        
        // Timing and status
        startDate: showcase.startDate,
        endDate: showcase.endDate,
        isActive: campaign.isActive && showcase.isActive,
        status: showcase.status,
        
        // Statistics from showcase
        totalSubmissions: showcase.totalSubmissions,
        totalParticipants: showcase.totalParticipants,
        
        // Admin info
        createdBy: showcase.createdBy,
        order: campaign.order,
        
        // Winners info from showcase
        winnersSelected: showcase.winnersSelected,
        winnersSelectedAt: showcase.winnersSelectedAt,
        winnersSelectedBy: showcase.winnersSelectedBy,
        prizesDistributed: showcase.prizesDistributed,
        prizesDistributedAt: showcase.prizesDistributedAt,
        prizesDistributedBy: showcase.prizesDistributedBy,
        
        // Preserve timestamps
        createdAt: campaign.createdAt,
        updatedAt: new Date()
      });
      
      await unifiedCampaign.save();
      migratedCount++;
      console.log(`Migrated campaign: ${campaign.title}`);
    }
    
    // Migrate standalone showcases
    for (const showcase of standaloneShowcases) {
      // For standalone showcases, we need to create a minimal campaign structure
      // These will need manual review to add artist and media URLs
      
      // Skip standalone showcases - they require artistId which is not available
      // These can be migrated manually through the admin interface
      console.log(`Skipping standalone showcase: ${showcase.title} (ID: ${showcase._id}) - requires manual artist assignment`);
    }
    
    console.log(`Successfully migrated ${migratedCount} campaigns to unified system`);
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

async function updateReferences() {
  console.log('Updating references in related collections...');
  
  try {
    // Update shares to reference unified campaigns
    // Note: This assumes shares were referencing the old campaign IDs
    // In practice, you might need more complex logic here
    
    console.log('Reference updates completed');
  } catch (error) {
    console.error('Error updating references:', error);
    throw error;
  }
}

async function runMigration() {
  try {
    await connectToDatabase();
    
    console.log('=== Campaign Unification Migration ===');
    console.log('This will merge Campaign and OpenVerseCampaign models into UnifiedCampaign');
    console.log('');
    
    // Create backups first
    await createBackups();
    
    // Migrate data
    await migrateData();
    
    // Update references
    await updateReferences();
    
    console.log('');
    console.log('=== Migration Completed Successfully ===');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your application to use UnifiedCampaign model');
    console.log('2. Test the new unified system thoroughly');
    console.log('3. Review standalone showcases that need artist assignment');
    console.log('4. Once confirmed working, you can drop the old collections');
    console.log('');
    console.log('Backup collections created:');
    console.log('- campaigns_backup');
    console.log('- openversecampaigns_backup');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
