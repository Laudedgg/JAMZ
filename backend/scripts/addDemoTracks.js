import mongoose from 'mongoose';
import Track from '../models/track.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-dev';

async function addDemoTracks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing tracks first
    const deleteResult = await Track.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing tracks`);

    // Demo tracks with real YouTube URLs and DSP links
    const demoTracks = [
      {
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        duration: 200,
        youtubeUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
        spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi1k',
        appleMusicUrl: 'https://music.apple.com/us/album/blinding-lights/1499378108?i=1499378116',
        isActive: true,
        order: 1
      },
      {
        title: 'As It Was',
        artist: 'Harry Styles',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
        duration: 167,
        youtubeUrl: 'https://www.youtube.com/watch?v=H5v3kku4y6Q',
        spotifyUrl: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e',
        appleMusicUrl: 'https://music.apple.com/us/album/as-it-was/1615584999?i=1615585008',
        isActive: true,
        order: 2
      },
      {
        title: 'Heat Waves',
        artist: 'Glass Animals',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273e5c9c6e0e0e0e0e0e0e0e0e0',
        duration: 239,
        youtubeUrl: 'https://www.youtube.com/watch?v=mRD0-GxqHVo',
        spotifyUrl: 'https://open.spotify.com/track/02MWAaffLxlfxAUY7c5dvx',
        appleMusicUrl: 'https://music.apple.com/us/album/heat-waves/1503458080?i=1503458085',
        isActive: true,
        order: 3
      },
      {
        title: 'Anti-Hero',
        artist: 'Taylor Swift',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273e0b60c608586d1c5e9c5e9c5',
        duration: 200,
        youtubeUrl: 'https://www.youtube.com/watch?v=b1kbLwvqugk',
        spotifyUrl: 'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
        appleMusicUrl: 'https://music.apple.com/us/album/anti-hero/1645027015?i=1645027021',
        isActive: true,
        order: 4
      },
      {
        title: 'Flowers',
        artist: 'Miley Cyrus',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273f6b55ca93bd33211227b502b',
        duration: 200,
        youtubeUrl: 'https://www.youtube.com/watch?v=G7KNmW9a75Y',
        spotifyUrl: 'https://open.spotify.com/track/0yLdNVWF3Srea0uzk55zFn',
        appleMusicUrl: 'https://music.apple.com/us/album/flowers/1663973781?i=1663973786',
        isActive: true,
        order: 5
      },
      {
        title: 'Calm Down',
        artist: 'Rema & Selena Gomez',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273a3a7f38ea2033aa501afd4cf',
        duration: 239,
        youtubeUrl: 'https://www.youtube.com/watch?v=WcIcVapfqXw',
        spotifyUrl: 'https://open.spotify.com/track/1HU7ocv4jJxlFMf2qJqt1H',
        appleMusicUrl: 'https://music.apple.com/us/album/calm-down-with-selena-gomez/1640949062?i=1640949068',
        isActive: true,
        order: 6
      },
      {
        title: 'Unholy',
        artist: 'Sam Smith & Kim Petras',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856',
        duration: 156,
        youtubeUrl: 'https://www.youtube.com/watch?v=Uq9gPaIzbe8',
        spotifyUrl: 'https://open.spotify.com/track/3nqQXoyQOWXiESFLlDF1hG',
        appleMusicUrl: 'https://music.apple.com/us/album/unholy-feat-kim-petras/1643671695?i=1643671696',
        isActive: true,
        order: 7
      },
      {
        title: 'Vampire',
        artist: 'Olivia Rodrigo',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273e85259a1cae29a8d91f2093d',
        duration: 219,
        youtubeUrl: 'https://www.youtube.com/watch?v=RlPNh_PBZb4',
        spotifyUrl: 'https://open.spotify.com/track/1kuGVB7EU95pJObxwvfwKS',
        appleMusicUrl: 'https://music.apple.com/us/album/vampire/1688832303?i=1688832305',
        isActive: true,
        order: 8
      }
    ];

    // Create tracks
    const createdTracks = await Track.insertMany(demoTracks);

    console.log(`\n✅ Created ${createdTracks.length} demo tracks\n`);
    console.log('📋 Demo tracks created:');
    createdTracks.forEach((track, index) => {
      console.log(`\n${index + 1}. ${track.title} by ${track.artist}`);
      console.log(`   🎬 YouTube: ${track.youtubeUrl ? '✓' : '✗'}`);
      console.log(`   🎵 Spotify: ${track.spotifyUrl ? '✓' : '✗'}`);
      console.log(`   🍎 Apple Music: ${track.appleMusicUrl ? '✓' : '✗'}`);
      console.log(`   ⏱️  Duration: ${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 Demo tracks ready! Visit http://localhost:3000/discover to see them\n');
  } catch (error) {
    console.error('❌ Error adding demo tracks:', error);
    process.exit(1);
  }
}

addDemoTracks();

