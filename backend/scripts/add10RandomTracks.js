import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Track model
import Track from '../models/track.js';

async function add10RandomTracks() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-dev';
    console.log('🔄 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 10 Random tracks with real YouTube URLs and DSP links
    const randomTracks = [
      {
        title: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
        duration: 230,
        youtubeUrl: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
        spotifyUrl: 'https://open.spotify.com/track/7MXVkk9YMctZqd1Srtv4MB',
        appleMusicUrl: 'https://music.apple.com/us/album/starboy/1440873069?i=1440873489',
        isActive: true,
        order: 1
      },
      {
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
        duration: 234,
        youtubeUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
        spotifyUrl: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI',
        appleMusicUrl: 'https://music.apple.com/us/album/shape-of-you/1193701079?i=1193701392',
        isActive: true,
        order: 2
      },
      {
        title: 'Levitating',
        artist: 'Dua Lipa',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
        duration: 203,
        youtubeUrl: 'https://www.youtube.com/watch?v=TUVcZfQe-Kw',
        spotifyUrl: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP',
        appleMusicUrl: 'https://music.apple.com/us/album/levitating/1590035691?i=1590035845',
        isActive: true,
        order: 3
      },
      {
        title: 'Bad Guy',
        artist: 'Billie Eilish',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce',
        duration: 194,
        youtubeUrl: 'https://www.youtube.com/watch?v=DyDfgMOUjCI',
        spotifyUrl: 'https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m',
        appleMusicUrl: 'https://music.apple.com/us/album/bad-guy/1450695723?i=1450695739',
        isActive: true,
        order: 4
      },
      {
        title: 'Sunflower',
        artist: 'Post Malone & Swae Lee',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f',
        duration: 158,
        youtubeUrl: 'https://www.youtube.com/watch?v=ApXoWvfEYVU',
        spotifyUrl: 'https://open.spotify.com/track/0RiRZpuVRbi7oqRdSMwhQY',
        appleMusicUrl: 'https://music.apple.com/us/album/sunflower-spider-man-into-the-spider-verse/1445623357?i=1445623359',
        isActive: true,
        order: 5
      },
      {
        title: 'Circles',
        artist: 'Post Malone',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2739478c87599550dd73bfa7e02',
        duration: 215,
        youtubeUrl: 'https://www.youtube.com/watch?v=wXhTHyIgQ_U',
        spotifyUrl: 'https://open.spotify.com/track/21jGcNKet2qwijlDFuPiPb',
        appleMusicUrl: 'https://music.apple.com/us/album/circles/1477880265?i=1477880483',
        isActive: true,
        order: 6
      },
      {
        title: 'Watermelon Sugar',
        artist: 'Harry Styles',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273e5a25ed08d1e7e0fbb440cef',
        duration: 174,
        youtubeUrl: 'https://www.youtube.com/watch?v=E07s5ZYygMg',
        spotifyUrl: 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY',
        appleMusicUrl: 'https://music.apple.com/us/album/watermelon-sugar/1485802965?i=1485803130',
        isActive: true,
        order: 7
      },
      {
        title: 'Peaches',
        artist: 'Justin Bieber ft. Daniel Caesar & Giveon',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2732c0252c4e4a988f024e4bba8',
        duration: 198,
        youtubeUrl: 'https://www.youtube.com/watch?v=tQ0yjYUFKAE',
        spotifyUrl: 'https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI',
        appleMusicUrl: 'https://music.apple.com/us/album/peaches-feat-daniel-caesar-giveon/1558287974?i=1558288278',
        isActive: true,
        order: 8
      },
      {
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        duration: 215,
        youtubeUrl: 'https://www.youtube.com/watch?v=XXYlFuWEuKI',
        spotifyUrl: 'https://open.spotify.com/track/5QO79kh1waicV47BqGRL3g',
        appleMusicUrl: 'https://music.apple.com/us/album/save-your-tears/1499378108?i=1499378613',
        isActive: true,
        order: 9
      },
      {
        title: 'Good 4 U',
        artist: 'Olivia Rodrigo',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
        duration: 178,
        youtubeUrl: 'https://www.youtube.com/watch?v=gNi_6U5Pm_o',
        spotifyUrl: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG',
        appleMusicUrl: 'https://music.apple.com/us/album/good-4-u/1560735414?i=1560735425',
        isActive: true,
        order: 10
      }
    ];

    // Delete existing tracks first
    await Track.deleteMany({});
    console.log('🗑️  Cleared existing tracks');

    // Create tracks
    const createdTracks = await Track.insertMany(randomTracks);

    console.log(`\n✅ Created ${createdTracks.length} random tracks\n`);
    console.log('📋 Tracks created:');
    createdTracks.forEach((track, index) => {
      console.log(`\n${index + 1}. ${track.title} by ${track.artist}`);
      console.log(`   🎬 YouTube: ${track.youtubeUrl ? '✓' : '✗'}`);
      console.log(`   🎵 Spotify: ${track.spotifyUrl ? '✓' : '✗'}`);
      console.log(`   🍎 Apple Music: ${track.appleMusicUrl ? '✓' : '✗'}`);
      console.log(`   ⏱️  Duration: ${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`);
    });

    console.log('\n✨ All done! Visit http://localhost:3000/discover to see the tracks\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding tracks:', error);
    process.exit(1);
  }
}

add10RandomTracks();

