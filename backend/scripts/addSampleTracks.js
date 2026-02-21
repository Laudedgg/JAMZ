import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from '../models/track.js';

dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27018/jamz-dev', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  addSampleTracks();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function addSampleTracks() {
  try {
    console.log('Starting to add sample tracks...');
    
    // Check if tracks already exist
    const existingTracks = await Track.countDocuments();
    if (existingTracks > 0) {
      console.log(`${existingTracks} tracks already exist. Skipping track creation.`);
      process.exit(0);
    }

    // Sample tracks with Spotify preview URLs
    const sampleTracks = [
      {
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b27330559b1e3a2c7b385c50b490',
        spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMwbk',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/7f2da6e9e1e8e8e8e8e8e8e8e8e8e8e8e8e8e8e',
        appleMusicUrl: 'https://music.apple.com/us/album/blinding-lights/1454949144?i=1454949151',
        duration: 200,
        isActive: true,
        order: 1
      },
      {
        title: 'As It Was',
        artist: 'Harry Styles',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2735c8c61e14878668e3f92e27e',
        spotifyUrl: 'https://open.spotify.com/track/20OjkDAxtlndGvAqoLanQV',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/8f2da6e9e1e8e8e8e8e8e8e8e8e8e8e8e8e8e8e',
        appleMusicUrl: 'https://music.apple.com/us/album/as-it-was/1619039327?i=1619039328',
        duration: 168,
        isActive: true,
        order: 2
      },
      {
        title: 'Heat Waves',
        artist: 'Glass Animals',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3ff3e277e924',
        spotifyUrl: 'https://open.spotify.com/track/0DiWxABD2yoz4THqq7RVSY',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/9f2da6e9e1e8e8e8e8e8e8e8e8e8e8e8e8e8e8e',
        appleMusicUrl: 'https://music.apple.com/us/album/heat-waves/1549348867?i=1549348868',
        duration: 239,
        isActive: true,
        order: 3
      },
      {
        title: 'Levitating',
        artist: 'Dua Lipa',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3ff3e277e924',
        spotifyUrl: 'https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/af2da6e9e1e8e8e8e8e8e8e8e8e8e8e8e8e8e8e',
        appleMusicUrl: 'https://music.apple.com/us/album/levitating/1556912542?i=1556912543',
        duration: 203,
        isActive: true,
        order: 4
      },
      {
        title: 'Anti-Hero',
        artist: 'Taylor Swift',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3ff3e277e924',
        spotifyUrl: 'https://open.spotify.com/track/0gS03V1zcEqiS41XakrAP6',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/bf2da6e9e1e8e8e8e8e8e8e8e8e8e8e8e8e8e8e',
        appleMusicUrl: 'https://music.apple.com/us/album/anti-hero/1645027057?i=1645027058',
        duration: 229,
        isActive: true,
        order: 5
      },
      {
        title: 'Neon Dreams',
        artist: 'Neon Dreams',
        coverImage: 'https://placehold.co/400x400/purple/white?text=Neon+Dreams',
        audioFile: 'public/media/tracks/sample-neon-dreams.mp3',
        spotifyUrl: 'https://open.spotify.com/track/sample1',
        appleMusicUrl: 'https://music.apple.com/us/album/sample1',
        duration: 240,
        isActive: true,
        order: 6
      },
      {
        title: 'Cosmic Beats',
        artist: 'Cosmic Beats',
        coverImage: 'https://placehold.co/400x400/blue/white?text=Cosmic+Beats',
        audioFile: 'public/media/tracks/sample-cosmic-beats.mp3',
        spotifyUrl: 'https://open.spotify.com/track/sample2',
        appleMusicUrl: 'https://music.apple.com/us/album/sample2',
        duration: 210,
        isActive: true,
        order: 7
      },
      {
        title: 'Digital Harmony',
        artist: 'Digital Harmony',
        coverImage: 'https://placehold.co/400x400/red/white?text=Digital+Harmony',
        audioFile: 'public/media/tracks/sample-digital-harmony.mp3',
        spotifyUrl: 'https://open.spotify.com/track/sample3',
        appleMusicUrl: 'https://music.apple.com/us/album/sample3',
        duration: 195,
        isActive: true,
        order: 8
      }
    ];

    const createdTracks = await Track.insertMany(sampleTracks);
    console.log(`✅ Created ${createdTracks.length} sample tracks`);
    
    console.log('\nSample tracks created:');
    createdTracks.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} by ${track.artist}`);
      console.log(`   Type: ${track.audioFile ? 'Full Upload' : 'Spotify Preview'}`);
      console.log(`   Duration: ${track.duration}s`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error adding sample tracks:', error);
    process.exit(1);
  }
}

