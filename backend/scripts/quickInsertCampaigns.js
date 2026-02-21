import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Artist from '../models/artist.js';
import OpenVerseCampaign from '../models/openVerseCampaign.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-dev';

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');
    
    // Get first artist
    console.log('📝 Fetching first artist...');
    const artist = await Artist.findOne();
    
    if (!artist) {
      console.error('❌ No artists found in database');
      process.exit(1);
    }
    
    console.log(`✅ Found artist: ${artist.name}`);
    
    // Delete existing demo campaigns
    console.log('🗑️  Clearing existing demo campaigns...');
    const deleteResult = await OpenVerseCampaign.deleteMany({ 
      title: { $regex: 'Demo Campaign' } 
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing campaigns`);
    
    // Create demo campaigns
    console.log('📝 Creating demo campaigns...');
    const campaigns = [
      {
        title: 'Demo Campaign - Neon Dreams',
        description: 'This is a demo campaign featuring the latest track from Neon Dreams. Share and earn rewards!',
        artistId: artist._id,
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        spotifyUrl: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb',
        appleMusicUrl: 'https://music.apple.com/us/album/never-gonna-give-you-up/1440884369?i=1440884371',
        thumbnailImage: 'backend/public/media/open-verse/demo-thumb.png',
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
        prerequisites: {
          requireShareAction: true
        },
        totalSubmissions: 0,
        totalParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Demo Campaign - Cosmic Beats',
        description: 'Join the cosmic journey with Cosmic Beats! Share this track and win amazing prizes.',
        artistId: artist._id,
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        appleMusicUrl: 'https://music.apple.com/us/album/test/1440884369?i=1440884371',
        thumbnailImage: 'backend/public/media/open-verse/demo-thumb.png',
        prizePool: { amount: 500, currency: 'JAMZ' },
        maxParticipants: 50,
        maxWinners: 3,
        startDate: new Date('2025-11-16'),
        endDate: new Date('2025-12-01'),
        isActive: true,
        status: 'active',
        allowedPlatforms: ['instagram', 'tiktok'],
        submissionGuidelines: 'Create a video with this track and share it!',
        prizeDistribution: [
          { rank: 1, amount: 250 },
          { rank: 2, amount: 150 },
          { rank: 3, amount: 100 }
        ],
        prerequisites: {
          requireShareAction: true
        },
        totalSubmissions: 0,
        totalParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await OpenVerseCampaign.insertMany(campaigns);
    console.log(`✅ Created ${result.length} demo campaigns`);
    
    // Verify
    const count = await OpenVerseCampaign.countDocuments();
    console.log(`📊 Total campaigns in DB: ${count}`);
    
    const allCampaigns = await OpenVerseCampaign.find();
    allCampaigns.forEach(c => {
      console.log(`   - ${c.title}`);
    });
    
    console.log('\n✨ Demo campaigns created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

