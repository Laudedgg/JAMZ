import mongoose from 'mongoose';
import Track from '../models/track.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27018/jamz-dev');

async function listTracks() {
  try {
    console.log('Connecting to database...');
    
    // List all tracks to see what's in the database
    const allTracks = await Track.find({});
    console.log(`Found ${allTracks.length} tracks:`);
    
    allTracks.forEach((track, index) => {
      console.log(`\n${index + 1}. ${track.title} by ${track.artist}`);
      console.log(`   ID: ${track._id}`);
      console.log(`   Audio: ${track.audioFile || 'None'}`);
      console.log(`   Spotify: ${track.spotifyUrl || 'None'}`);
      console.log(`   Active: ${track.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

listTracks();
