import mongoose from 'mongoose';
import Track from '../models/track.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27018/jamz-dev', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixTrackAudioFile() {
  try {
    console.log('Connecting to database...');
    
    // Find the track with broken audio file
    const brokenTrack = await Track.findOne({ 
      title: 'GP Things',
      artist: 'Jamz.Fun'
    });
    
    if (brokenTrack) {
      console.log('Found broken track:', brokenTrack.title);
      console.log('Current audio file:', brokenTrack.audioFile);
      
      // Update with working audio file
      brokenTrack.audioFile = 'public/media/tracks/audioFile-1740923650415-351458222.mp3';
      brokenTrack.duration = 180; // Set a reasonable duration
      
      await brokenTrack.save();
      console.log('Updated track with working audio file:', brokenTrack.audioFile);
    } else {
      console.log('Track not found');
    }
    
    // List all tracks to verify
    const allTracks = await Track.find({});
    console.log('\nAll tracks:');
    allTracks.forEach(track => {
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

fixTrackAudioFile();
