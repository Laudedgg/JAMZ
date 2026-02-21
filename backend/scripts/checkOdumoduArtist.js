import mongoose from 'mongoose';
import Artist from '../models/artist.js';
import ArtistAuth from '../models/artistAuth.js';
import Campaign from '../models/campaign.js';
import UnifiedCampaign from '../models/unifiedCampaign.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jamz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  checkOdumoduArtist();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function checkOdumoduArtist() {
  try {
    console.log('\n=== Checking for Artist "odumodu" ===\n');
    
    // 1. Find artist by name
    const artist = await Artist.findOne({ name: { $regex: /odumodu/i } });
    
    if (!artist) {
      console.log('❌ No artist found with name containing "odumodu"');
      
      // Check all artists to see what we have
      const allArtists = await Artist.find({}).select('name _id');
      console.log('\n📋 All artists in database:');
      allArtists.forEach((a, index) => {
        console.log(`${index + 1}. ${a.name} (ID: ${a._id})`);
      });
      
      process.exit(0);
    }
    
    console.log('✅ Found artist:', {
      id: artist._id,
      name: artist.name,
      imageUrl: artist.imageUrl,
      socialMedia: artist.socialMedia,
      createdAt: artist.createdAt
    });
    
    // 2. Check if artist has authentication account
    const artistAuth = await ArtistAuth.findOne({ artistId: artist._id });
    
    if (!artistAuth) {
      console.log('\n❌ No authentication account found for this artist');
      console.log('   This means the artist cannot log in');
    } else {
      console.log('\n✅ Found authentication account:', {
        email: artistAuth.email,
        isVerified: artistAuth.isVerified,
        createdAt: artistAuth.createdAt
      });
    }
    
    // 3. Check for campaigns assigned to this artist
    const campaigns = await Campaign.find({ artistId: artist._id });
    console.log(`\n📊 Found ${campaigns.length} campaigns assigned to this artist:`);
    
    if (campaigns.length > 0) {
      campaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ${campaign.title}`);
        console.log(`   - ID: ${campaign._id}`);
        console.log(`   - Active: ${campaign.isActive}`);
        console.log(`   - YouTube URL: ${campaign.youtubeUrl}`);
        console.log(`   - Challenge Reward: $${campaign.challengeRewardUsdt} + ${campaign.challengeRewardJamz} JAMZ`);
        console.log(`   - Share Reward: $${campaign.shareRewardUsdt} + ${campaign.shareRewardJamz} JAMZ`);
        console.log(`   - Created: ${campaign.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   No campaigns found for this artist');
    }
    
    // 4. Check for unified campaigns created by this artist
    const unifiedCampaigns = await UnifiedCampaign.find({ 
      createdBy: artist._id,
      createdByArtist: true 
    });
    
    console.log(`\n📊 Found ${unifiedCampaigns.length} unified campaigns created by this artist:`);
    
    if (unifiedCampaigns.length > 0) {
      unifiedCampaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ${campaign.title}`);
        console.log(`   - ID: ${campaign._id}`);
        console.log(`   - Status: ${campaign.status}`);
        console.log(`   - Active: ${campaign.isActive}`);
        console.log(`   - Prize Pool: $${campaign.prizePool}`);
        console.log(`   - Max Participants: ${campaign.maxParticipants}`);
        console.log(`   - Created: ${campaign.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   No unified campaigns created by this artist');
    }
    
    // 5. Check all campaigns to see if there are any active ones
    const allActiveCampaigns = await Campaign.find({ isActive: true });
    console.log(`\n📊 Total active campaigns in system: ${allActiveCampaigns.length}`);
    
    if (allActiveCampaigns.length > 0) {
      console.log('\nActive campaigns:');
      allActiveCampaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ${campaign.title} (Artist ID: ${campaign.artistId})`);
      });
    }
    
    // 6. Summary and recommendations
    console.log('\n=== SUMMARY ===');
    
    if (!artistAuth) {
      console.log('🔧 ISSUE: Artist exists but has no authentication account');
      console.log('   SOLUTION: Create an authentication account for this artist');
      console.log(`   Command: Use admin panel to create auth account for artist ID: ${artist._id}`);
    }
    
    if (campaigns.length === 0) {
      console.log('🔧 ISSUE: Artist has no campaigns assigned');
      console.log('   SOLUTION: Create campaigns for this artist or assign existing campaigns');
    }
    
    if (campaigns.length > 0 && campaigns.every(c => !c.isActive)) {
      console.log('🔧 ISSUE: Artist has campaigns but none are active');
      console.log('   SOLUTION: Activate at least one campaign for this artist');
    }
    
    if (artistAuth && campaigns.length > 0 && campaigns.some(c => c.isActive)) {
      console.log('✅ Artist setup looks correct - they should be able to see campaigns');
      console.log('   If they still can\'t see campaigns, check:');
      console.log('   1. Are they logging in with the correct email?');
      console.log('   2. Is the frontend making the correct API calls?');
      console.log('   3. Are there any authentication issues?');
    }
    
  } catch (error) {
    console.error('Error checking artist:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}
