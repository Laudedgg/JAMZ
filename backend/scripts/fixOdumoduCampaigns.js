import mongoose from 'mongoose';
import Artist from '../models/artist.js';
import Campaign from '../models/campaign.js';
import OpenVerseCampaign from '../models/openVerseCampaign.js';
import User from '../models/user.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jamz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  fixOdumoduCampaigns();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function fixOdumoduCampaigns() {
  try {
    console.log('\n=== Fixing Campaigns for Artist "Odumodu" ===\n');
    
    // 1. Find the Odumodu artist
    const odumoduArtist = await Artist.findOne({ name: { $regex: /odumodu/i } });
    
    if (!odumoduArtist) {
      console.log('❌ Artist "Odumodu" not found');
      process.exit(1);
    }
    
    console.log('✅ Found Odumodu artist:', odumoduArtist.name, '(ID:', odumoduArtist._id, ')');
    
    // 2. Check existing campaigns
    const existingCampaigns = await Campaign.find({ artistId: odumoduArtist._id });
    console.log(`📊 Current campaigns for Odumodu: ${existingCampaigns.length}`);
    
    // 3. Find active campaigns that could be assigned to Odumodu
    const activeCampaigns = await Campaign.find({ isActive: true });
    console.log(`📊 Total active campaigns in system: ${activeCampaigns.length}`);
    
    if (activeCampaigns.length > 0) {
      console.log('\nActive campaigns:');
      for (let i = 0; i < activeCampaigns.length; i++) {
        const campaign = activeCampaigns[i];
        const artist = await Artist.findById(campaign.artistId);
        console.log(`${i + 1}. ${campaign.title} (Currently assigned to: ${artist?.name || 'Unknown'})`);
      }
    }
    
    // 4. Find an admin user to create the showcase
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('❌ No admin user found. Cannot create OpenVerse campaign.');
      process.exit(1);
    }
    console.log('✅ Found admin user:', adminUser.email);

    // 5. Create a new campaign specifically for Odumodu
    console.log('\n🔧 Creating a new campaign for Odumodu...');

    // First, create an OpenVerse campaign (showcase) with all required fields
    const openVerseShowcase = new OpenVerseCampaign({
      title: 'Odumodu Music Challenge',
      description: 'Show your talent with Odumodu\'s latest track! Create your own version and win amazing prizes.',
      thumbnailImage: 'https://via.placeholder.com/400x300/purple/white?text=Odumodu+Challenge', // Placeholder image
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder URL - update this to actual track
      artistId: odumoduArtist._id,
      prizePool: {
        amount: 500,
        currency: 'USDT'
      },
      maxParticipants: 100,
      maxWinners: 3,
      prizeDistribution: [
        { rank: 1, amount: 250 },
        { rank: 2, amount: 150 },
        { rank: 3, amount: 100 }
      ],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      status: 'active',
      allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
      submissionGuidelines: 'Create a 30-60 second video showcasing your musical talent with Odumodu\'s track.',
      createdBy: adminUser._id
    });

    await openVerseShowcase.save();
    console.log('✅ Created OpenVerse showcase:', openVerseShowcase.title);

    // Now create the main campaign linked to this showcase
    const newCampaign = new Campaign({
      title: 'Odumodu Music Challenge',
      artistId: odumoduArtist._id,
      showcaseId: openVerseShowcase._id,
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder URL - update this to actual track
      isActive: true,
      challengeRewardUsdt: 10.0,
      challengeRewardJamz: 50.0,
      shareRewardUsdt: 5.0,
      shareRewardJamz: 25.0,
      watchRewardUsdt: 2.0,
      watchRewardJamz: 10.0
    });

    await newCampaign.save();
    console.log('✅ Created campaign:', newCampaign.title);
    
    // 6. Verify the fix
    const updatedCampaigns = await Campaign.find({ artistId: odumoduArtist._id });
    console.log(`\n✅ Odumodu now has ${updatedCampaigns.length} campaign(s):`);
    
    updatedCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.title}`);
      console.log(`   - ID: ${campaign._id}`);
      console.log(`   - Active: ${campaign.isActive}`);
      console.log(`   - YouTube URL: ${campaign.youtubeUrl}`);
      console.log(`   - Challenge Reward: $${campaign.challengeRewardUsdt} + ${campaign.challengeRewardJamz} JAMZ`);
      console.log(`   - Share Reward: $${campaign.shareRewardUsdt} + ${campaign.shareRewardJamz} JAMZ`);
      console.log('');
    });
    
    console.log('🎉 SUCCESS! Odumodu should now be able to see campaigns on their dashboard.');
    console.log('\n📝 Next steps:');
    console.log('1. Ask Odumodu to log in again at: http://localhost:5174/artist/login');
    console.log('2. They should use email: odu@yopmail.com');
    console.log('3. They should now see the "Odumodu Music Challenge" campaign');
    console.log('4. Update the YouTube URL in the admin panel to the actual track URL');
    
  } catch (error) {
    console.error('Error fixing campaigns:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}
