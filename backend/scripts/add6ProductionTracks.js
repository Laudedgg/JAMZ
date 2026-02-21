import mongoose from 'mongoose';
import Track from '../models/track.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-dev';

async function add6ProductionTracks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    // 6 diverse tracks with different genres and real YouTube URLs
    const productionTracks = [
      {
        title: 'Levitating',
        artist: 'Dua Lipa',
        coverImage: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/maxresdefault.jpg',
        duration: 203,
        youtubeUrl: 'https://www.youtube.com/watch?v=TUVcZfQe-Kw',
        isActive: true,
        order: 1,
        upvotes: 0,
        downvotes: 0,
        voteScore: 0
      },
      {
        title: 'Shivers',
        artist: 'Ed Sheeran',
        coverImage: 'https://i.ytimg.com/vi/Il0S8BoucSA/maxresdefault.jpg',
        duration: 207,
        youtubeUrl: 'https://www.youtube.com/watch?v=Il0S8BoucSA',
        isActive: true,
        order: 2,
        upvotes: 0,
        downvotes: 0,
        voteScore: 0
      },
      {
        title: 'Stay',
        artist: 'The Kid LAROI & Justin Bieber',
        coverImage: 'https://i.ytimg.com/vi/kTJczUoc26U/maxresdefault.jpg',
        duration: 141,
        youtubeUrl: 'https://www.youtube.com/watch?v=kTJczUoc26U',
        isActive: true,
        order: 3,
        upvotes: 0,
        downvotes: 0,
        voteScore: 0
      },
      {
        title: 'Good 4 U',
        artist: 'Olivia Rodrigo',
        coverImage: 'https://i.ytimg.com/vi/gNi_6U5Pm_o/maxresdefault.jpg',
        duration: 178,
        youtubeUrl: 'https://www.youtube.com/watch?v=gNi_6U5Pm_o',
        isActive: true,
        order: 4,
        upvotes: 0,
        downvotes: 0,
        voteScore: 0
      },
      {
        title: 'Peaches',
        artist: 'Justin Bieber ft. Daniel Caesar & Giveon',
        coverImage: 'https://i.ytimg.com/vi/tQ0yjYUFKAE/maxresdefault.jpg',
        duration: 198,
        youtubeUrl: 'https://www.youtube.com/watch?v=tQ0yjYUFKAE',
        isActive: true,
        order: 5,
        upvotes: 0,
        downvotes: 0,
        voteScore: 0
      },
      {
        title: 'Montero (Call Me By Your Name)',
        artist: 'Lil Nas X',
        coverImage: 'https://i.ytimg.com/vi/6swmTBVI83k/maxresdefault.jpg',
        duration: 137,
        youtubeUrl: 'https://www.youtube.com/watch?v=6swmTBVI83k',
        isActive: true,
        order: 6,
        upvotes: 0,
        downvotes: 0,
        voteScore: 0
      }
    ];

    console.log('\n📝 Adding 6 production tracks...\n');

    // Create tracks
    const createdTracks = await Track.insertMany(productionTracks);

    console.log(`✅ Successfully created ${createdTracks.length} tracks!\n`);
    console.log('Tracks added:');
    createdTracks.forEach((track, index) => {
      console.log(`\n${index + 1}. "${track.title}" by ${track.artist}`);
      console.log(`   Duration: ${track.duration}s`);
      console.log(`   YouTube: ${track.youtubeUrl}`);
      console.log(`   Cover: ${track.coverImage}`);
    });

    // Verify tracks were added
    const totalTracks = await Track.countDocuments();
    console.log(`\n📊 Total tracks in database: ${totalTracks}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 All done! Visit https://jamz.fun/discover to see the tracks.');
  } catch (error) {
    console.error('❌ Error adding production tracks:', error);
    process.exit(1);
  }
}

add6ProductionTracks();

