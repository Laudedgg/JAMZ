import mongoose from 'mongoose';
import Track from '../models/track.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27018/jamz-dev');

async function addTestTracks() {
  try {
    console.log('Connecting to database...');
    
    // Clear existing tracks
    await Track.deleteMany({});
    console.log('Cleared existing tracks');
    
    // Add test tracks with working audio files
    const testTracks = [
      {
        title: 'Test Track 1',
        artist: 'Jamz.Fun',
        coverImage: 'public/media/tracks/coverImage-1745132996820-173852365.png',
        audioFile: 'public/media/tracks/audioFile-1740923650415-351458222.mp3',
        duration: 180,
        spotifyUrl: 'https://open.spotify.com/track/4PTqNk7HbUaLAU2KRyvGKg?si=89d4d55e55ab45f7',
        isActive: true,
        order: 1
      },
      {
        title: 'Test Track 2',
        artist: 'Artist Two',
        coverImage: 'public/media/tracks/coverImage-1760008224112-304811595.png',
        audioFile: 'public/media/tracks/audioFile-1740924280830-284270004.mp3',
        duration: 200,
        spotifyUrl: 'https://open.spotify.com/track/48fNM8TUHTZbndUYoWnEUy?si=ea1aeca5ac39417d',
        isActive: true,
        order: 2
      },
      {
        title: 'External Only Track',
        artist: 'External Artist',
        coverImage: 'public/media/tracks/coverImage-1760008224112-304811595.png',
        audioFile: null,
        duration: 30,
        spotifyUrl: 'https://open.spotify.com/track/48fNM8TUHTZbndUYoWnEUy?si=ea1aeca5ac39417d',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/9a9c8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b',
        appleMusicUrl: 'https://music.apple.com/us/album/example-track/1234567890?i=1234567890',
        appleMusicPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/example.m4a',
        isActive: true,
        order: 3
      },
      {
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        coverImage: 'public/media/tracks/coverImage-1760008224112-304811595.png',
        audioFile: null,
        duration: 30,
        spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlULA4LGwqf2iGU',
        spotifyPreviewUrl: 'https://p.scdn.co/mp3-preview/6b00afb1c5b8c3b7e2e2e2e2e2e2e2e2e2e2e2e2?cid=774b29d4f13844c495f206cafdad9c86',
        isActive: true,
        order: 4
      }
    ];
    
    // Insert test tracks
    const insertedTracks = await Track.insertMany(testTracks);
    console.log(`Added ${insertedTracks.length} test tracks:`);
    
    insertedTracks.forEach(track => {
      console.log(`- ${track.title} by ${track.artist}`);
      console.log(`  Audio: ${track.audioFile || 'None'}`);
      console.log(`  Spotify: ${track.spotifyUrl || 'None'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

addTestTracks();
