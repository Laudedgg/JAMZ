import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27018/jamz-dev';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  createDemoCampaigns();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Define schemas
const artistSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  socialMedia: Object
});

const openVerseCampaignSchema = new mongoose.Schema({
  title: String,
  description: String,
  artistId: mongoose.Schema.Types.ObjectId,
  youtubeUrl: String,
  spotifyUrl: String,
  appleUrl: String,
  otherDspUrls: Map,
  thumbnailImage: String,
  prizePool: {
    amount: Number,
    currency: String
  },
  maxParticipants: Number,
  maxWinners: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  status: String,
  allowedPlatforms: [String],
  submissionGuidelines: String,
  prizeDistribution: [{
    rank: Number,
    amount: Number
  }],
  requireYouTubeWatch: Boolean,
  requireShareAction: Boolean,
  shareRewardUsd: Number,
  shareRewardJamz: Number,
  shareRewardNgn: Number,
  shareRewardAed: Number,
  watchRewardUsd: Number,
  watchRewardJamz: Number,
  watchRewardNgn: Number,
  watchRewardAed: Number,
  maxReferralRewards: Number,
  maxReferralRewardsPerUser: Number,
  totalSubmissions: Number,
  totalParticipants: Number,
  createdAt: Date,
  updatedAt: Date
});

const Artist = mongoose.model('Artist', artistSchema);
const OpenVerseCampaign = mongoose.model('OpenVerseCampaign', openVerseCampaignSchema);

async function createDemoCampaigns() {
  try {
    // Get first artist
    const artist = await Artist.findOne();
    if (!artist) {
      console.error('❌ No artists found in database');
      process.exit(1);
    }

    console.log(`📝 Using artist: ${artist.name}`);

    // Create demo thumbnail image
    const thumbnailPath = path.join(process.cwd(), 'backend/public/media/campaigns/demo-thumb.png');
    const campaignDir = path.dirname(thumbnailPath);
    
    if (!fs.existsSync(campaignDir)) {
      fs.mkdirSync(campaignDir, { recursive: true });
    }

    // Create a simple purple PNG (1x1 pixel, expanded to 400x400)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x4B, 0x6E, 0x0B, 0x5B, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(thumbnailPath, pngData);
    console.log('✅ Created demo thumbnail image');

    // Create demo campaigns
    const campaigns = [
      {
        title: 'Demo Campaign - Neon Dreams',
        description: 'This is a demo campaign featuring the latest track from Neon Dreams. Share and earn rewards!',
        artistId: artist._id,
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        spotifyUrl: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb',
        appleUrl: 'https://music.apple.com/us/album/never-gonna-give-you-up/1440884369?i=1440884371',
        thumbnailImage: 'campaigns/demo-thumb.png',
        prizePool: { amount: 1000, currency: 'JAMZ' },
        maxParticipants: 100,
        maxWinners: 5,
        startDate: new Date('2025-11-16'),
        endDate: new Date('2025-12-16'),
        isActive: true,
        status: 'active',
        allowedPlatforms: ['instagram', 'tiktok', 'youtube'],
        submissionGuidelines: 'Share the track on your social media and tag @jamzfun',
        prizeDistribution: [
          { rank: 1, amount: 500 },
          { rank: 2, amount: 300 },
          { rank: 3, amount: 200 }
        ],
        requireYouTubeWatch: true,
        requireShareAction: true,
        shareRewardJamz: 10,
        watchRewardJamz: 5,
        maxReferralRewards: 100,
        maxReferralRewardsPerUser: 5,
        totalSubmissions: 0,
        totalParticipants: 0
      }
    ];

    // Delete existing demo campaigns
    await OpenVerseCampaign.deleteMany({ title: { $regex: 'Demo Campaign' } });
    console.log('🗑️  Cleared existing demo campaigns');

    // Insert new campaigns
    const created = await OpenVerseCampaign.insertMany(campaigns);
    console.log(`✅ Created ${created.length} demo campaign(s)`);

    created.forEach(campaign => {
      console.log(`   - ${campaign.title} (ID: ${campaign._id})`);
    });

    console.log('\n✨ Demo campaigns created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating campaigns:', error);
    process.exit(1);
  }
}

