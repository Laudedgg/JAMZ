import mongoose from 'mongoose';
import Track from '../models/track.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-dev';

async function addYouTubeTracks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Sample YouTube tracks with real YouTube URLs
    const youTubeTracks = [
      {
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        coverImage: 'uploads/covers/blinding-lights.jpg',
        duration: 200,
        youtubeUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
        isActive: true,
        order: 1
      },
      {
        title: 'As It Was',
        artist: 'Harry Styles',
        coverImage: 'uploads/covers/as-it-was.jpg',
        duration: 168,
        youtubeUrl: 'https://www.youtube.com/watch?v=H5v3kku4y5Q',
        isActive: true,
        order: 2
      },
      {
        title: 'Heat Waves',
        artist: 'Glass Animals',
        coverImage: 'uploads/covers/heat-waves.jpg',
        duration: 239,
        youtubeUrl: 'https://www.youtube.com/watch?v=mRD0O8Eit0w',
        isActive: true,
        order: 3
      }
    ];

    // Check if tracks already exist
    const existingCount = await Track.countDocuments({
      youtubeUrl: { $exists: true, $ne: '' }
    });

    if (existingCount > 0) {
      console.log(`✅ YouTube tracks already exist (${existingCount} found). Skipping creation.`);
      await mongoose.connection.close();
      return;
    }

    // Create tracks
    const createdTracks = await Track.insertMany(youTubeTracks);

    console.log(`✅ Created ${createdTracks.length} YouTube tracks`);
    console.log('\nYouTube tracks created:');
    createdTracks.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} by ${track.artist}`);
      console.log(`   Type: YouTube Video`);
      console.log(`   Duration: ${track.duration}s`);
      console.log(`   URL: ${track.youtubeUrl}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('Error adding YouTube tracks:', error);
    process.exit(1);
  }
}

addYouTubeTracks();

