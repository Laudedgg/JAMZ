import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from '../models/track.js';

dotenv.config();

async function updateFolaSpotifyUrl() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz');
    
    // Find the Fola track (using regex to handle extra spaces)
    const folaTrack = await Track.findOne({
      title: /Fola/i,
      artist: /Gokada/i
    });
    
    if (!folaTrack) {
      console.error('Fola track not found');
      process.exit(1);
    }
    
    console.log('Found Fola track:', folaTrack.title, 'by', folaTrack.artist);
    console.log('Current Spotify URL:', folaTrack.spotifyUrl || 'None');
    console.log('Current Spotify Preview URL:', folaTrack.spotifyPreviewUrl || 'None');
    
    // Update with the Spotify URL
    folaTrack.spotifyUrl = 'https://open.spotify.com/track/2aQcVp8NHhCOhgZh76k1Ui';
    
    await folaTrack.save();
    
    console.log('✅ Successfully updated Fola track with Spotify URL');
    console.log('New Spotify URL:', folaTrack.spotifyUrl);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateFolaSpotifyUrl();

