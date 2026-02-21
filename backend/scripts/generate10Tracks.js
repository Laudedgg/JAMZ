import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from '../models/track.js';

dotenv.config({ path: '../.env' });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-dev';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  generate10Tracks();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function generate10Tracks() {
  try {
    console.log('🎵 Generating 10 tracks for Discovery page...\n');
    
    // 10 diverse tracks with YouTube URLs and cover images
    const tracks = [
      {
        title: 'Midnight City',
        artist: 'M83',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273ba7fe7dd76cd4307e57dd75f',
        youtubeUrl: 'https://www.youtube.com/watch?v=dX3k_QDnzHE',
        spotifyUrl: 'https://open.spotify.com/track/0lw68yx3MhKflWFqCsGkIs',
        appleMusicUrl: 'https://music.apple.com/us/album/midnight-city/1440873069?i=1440873070',
        duration: 244,
        isActive: true,
        order: 1,
        upvotes: 15,
        downvotes: 2,
        voteScore: 13
      },
      {
        title: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
        youtubeUrl: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
        spotifyUrl: 'https://open.spotify.com/track/7MXVkk9YMctZqd1Srtv4MB',
        appleMusicUrl: 'https://music.apple.com/us/album/starboy/1440873069?i=1440873071',
        duration: 230,
        isActive: true,
        order: 2,
        upvotes: 22,
        downvotes: 1,
        voteScore: 21
      },
      {
        title: 'Sunflower',
        artist: 'Post Malone & Swae Lee',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f',
        youtubeUrl: 'https://www.youtube.com/watch?v=ApXoWvfEYVU',
        spotifyUrl: 'https://open.spotify.com/track/0RiRZpuVRbi7oqRdSMwhQY',
        appleMusicUrl: 'https://music.apple.com/us/album/sunflower/1440873069?i=1440873072',
        duration: 158,
        isActive: true,
        order: 3,
        upvotes: 18,
        downvotes: 3,
        voteScore: 15
      },
      {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2731e0e2e1e1e1e1e1e1e1e1e1e',
        youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        spotifyUrl: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv',
        appleMusicUrl: 'https://music.apple.com/us/album/bohemian-rhapsody/1440873069?i=1440873073',
        duration: 354,
        isActive: true,
        order: 4,
        upvotes: 30,
        downvotes: 0,
        voteScore: 30
      },
      {
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
        youtubeUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
        spotifyUrl: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI',
        appleMusicUrl: 'https://music.apple.com/us/album/shape-of-you/1440873069?i=1440873074',
        duration: 234,
        isActive: true,
        order: 5,
        upvotes: 25,
        downvotes: 4,
        voteScore: 21
      },
      {
        title: 'Believer',
        artist: 'Imagine Dragons',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273da6f73a25f4c79d0e6b4a8bd',
        youtubeUrl: 'https://www.youtube.com/watch?v=7wtfhZwyrcc',
        spotifyUrl: 'https://open.spotify.com/track/0pqnGHJpmpxLKifKRmU6WP',
        appleMusicUrl: 'https://music.apple.com/us/album/believer/1440873069?i=1440873075',
        duration: 204,
        isActive: true,
        order: 6,
        upvotes: 20,
        downvotes: 2,
        voteScore: 18
      },
      {
        title: 'Counting Stars',
        artist: 'OneRepublic',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2735c9890c0456a3719eeecd8aa',
        youtubeUrl: 'https://www.youtube.com/watch?v=hT_nvWreIhg',
        spotifyUrl: 'https://open.spotify.com/track/2tpWsVSb9UEmDRxAl1zhX1',
        appleMusicUrl: 'https://music.apple.com/us/album/counting-stars/1440873069?i=1440873076',
        duration: 257,
        isActive: true,
        order: 7,
        upvotes: 17,
        downvotes: 1,
        voteScore: 16
      },
      {
        title: 'Radioactive',
        artist: 'Imagine Dragons',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273407bd04707c463bbb3410737',
        youtubeUrl: 'https://www.youtube.com/watch?v=ktvTqknDobU',
        spotifyUrl: 'https://open.spotify.com/track/0pqnGHJpmpxLKifKRmU6WP',
        appleMusicUrl: 'https://music.apple.com/us/album/radioactive/1440873069?i=1440873077',
        duration: 187,
        isActive: true,
        order: 8,
        upvotes: 19,
        downvotes: 2,
        voteScore: 17
      },
      {
        title: 'Uptown Funk',
        artist: 'Mark Ronson ft. Bruno Mars',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b2739e2f95ae77cf436017ada9cb',
        youtubeUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0',
        spotifyUrl: 'https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS',
        appleMusicUrl: 'https://music.apple.com/us/album/uptown-funk/1440873069?i=1440873078',
        duration: 269,
        isActive: true,
        order: 9,
        upvotes: 28,
        downvotes: 1,
        voteScore: 27
      },
      {
        title: 'Someone Like You',
        artist: 'Adele',
        coverImage: 'https://i.scdn.co/image/ab67616d0000b273f7db43292a6a99b21b51d5b4',
        youtubeUrl: 'https://www.youtube.com/watch?v=hLQl3WQQoQ0',
        spotifyUrl: 'https://open.spotify.com/track/1zwMYTA5nlNjZxYrvBB2pV',
        appleMusicUrl: 'https://music.apple.com/us/album/someone-like-you/1440873069?i=1440873079',
        duration: 285,
        isActive: true,
        order: 10,
        upvotes: 24,
        downvotes: 2,
        voteScore: 22
      }
    ];

    // Insert tracks
    const createdTracks = await Track.insertMany(tracks);
    console.log(`✅ Successfully created ${createdTracks.length} tracks!\n`);
    
    console.log('📋 Track List:');
    console.log('═'.repeat(70));
    createdTracks.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist}`);
      console.log(`   Duration: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`);
      console.log(`   Votes: ↑${track.upvotes} ↓${track.downvotes} (Score: ${track.voteScore})`);
      console.log(`   YouTube: ${track.youtubeUrl ? '✓' : '✗'}`);
      console.log('');
    });
    console.log('═'.repeat(70));
    console.log('\n🎉 All tracks are now available on the Discovery page!');
    console.log('🌐 Visit http://localhost:3000/discovery to see them\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating tracks:', error);
    process.exit(1);
  }
}

