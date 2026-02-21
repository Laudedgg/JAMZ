import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from '../models/track.js';

dotenv.config();

// Map of track titles/artists to their Spotify URLs
const spotifyUrlMap = {
  'Fola|Gokada': 'https://open.spotify.com/track/2aQcVp8NHhCOhgZh76k1Ui',
  'Alone|Fola': 'https://open.spotify.com/track/3qm84nBvXcWhTqLcV4YCFQ',
  'Don Corleone|Adekunle Gold': 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMwbk',
  'Great|grat': 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMwbk',
  'Level|Lauded': 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMwbk'
};

async function updateAllSpotifyUrls() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz');
    
    const tracks = await Track.find({});
    console.log(`Found ${tracks.length} tracks\n`);
    
    let updated = 0;
    
    for (const track of tracks) {
      const key = `${track.title.trim()}|${track.artist.trim()}`;
      const spotifyUrl = spotifyUrlMap[key];
      
      if (spotifyUrl && !track.spotifyUrl) {
        console.log(`Updating: ${track.title} by ${track.artist}`);
        console.log(`  Setting Spotify URL: ${spotifyUrl}`);
        track.spotifyUrl = spotifyUrl;
        await track.save();
        updated++;
      } else if (!spotifyUrl && track.spotifyPreviewUrl) {
        console.log(`⚠️  No Spotify URL mapping for: ${track.title} by ${track.artist}`);
        console.log(`   Has preview URL: ${track.spotifyPreviewUrl}`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} tracks with Spotify URLs`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAllSpotifyUrls();

