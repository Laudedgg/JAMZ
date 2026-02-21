import mongoose from 'mongoose';
import ArtistAuth from '../models/artistAuth.js';
import Artist from '../models/artist.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugArtistData() {
  console.log('🔍 Debugging Artist Data Mismatch');
  console.log('==================================');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz');
    console.log('✅ Connected to MongoDB');
    
    // Get all artist auth records
    console.log('\n📋 All Artist Auth Records:');
    const artistAuths = await ArtistAuth.find({}).select('email artistId');
    artistAuths.forEach((auth, index) => {
      console.log(`${index + 1}. Email: ${auth.email}, ArtistID: ${auth.artistId}, AuthID: ${auth._id}`);
    });
    
    // Get all artist records
    console.log('\n🎨 All Artist Records:');
    const artists = await Artist.find({}).select('name _id');
    artists.forEach((artist, index) => {
      console.log(`${index + 1}. Name: ${artist.name}, ID: ${artist._id}`);
    });
    
    // Check for specific emails
    const testEmails = ['great@yopmail.com', 'llona@jamz.fun', 'test.artist@jamz.fun'];
    
    console.log('\n🔍 Checking Specific Artist Accounts:');
    for (const email of testEmails) {
      console.log(`\n--- Checking ${email} ---`);
      
      const artistAuth = await ArtistAuth.findOne({ email });
      if (artistAuth) {
        console.log(`✅ ArtistAuth found: ID=${artistAuth._id}, ArtistID=${artistAuth.artistId}`);
        
        const artist = await Artist.findById(artistAuth.artistId);
        if (artist) {
          console.log(`✅ Artist found: Name="${artist.name}", ID=${artist._id}`);
        } else {
          console.log(`❌ Artist NOT found for ArtistID=${artistAuth.artistId}`);
        }
      } else {
        console.log(`❌ ArtistAuth NOT found for email ${email}`);
      }
    }
    
    // Check for orphaned artists (artists without auth records)
    console.log('\n🔍 Checking for Orphaned Artists:');
    const allArtistIds = artistAuths.map(auth => auth.artistId.toString());
    const orphanedArtists = artists.filter(artist => !allArtistIds.includes(artist._id.toString()));
    
    if (orphanedArtists.length > 0) {
      console.log('⚠️  Found orphaned artists (no auth record):');
      orphanedArtists.forEach(artist => {
        console.log(`   - ${artist.name} (ID: ${artist._id})`);
      });
    } else {
      console.log('✅ No orphaned artists found');
    }
    
    // Check for broken links (auth records pointing to non-existent artists)
    console.log('\n🔍 Checking for Broken Links:');
    const allArtistDbIds = artists.map(artist => artist._id.toString());
    const brokenLinks = artistAuths.filter(auth => !allArtistDbIds.includes(auth.artistId.toString()));
    
    if (brokenLinks.length > 0) {
      console.log('⚠️  Found broken links (auth pointing to non-existent artist):');
      brokenLinks.forEach(auth => {
        console.log(`   - ${auth.email} points to non-existent artist ID: ${auth.artistId}`);
      });
    } else {
      console.log('✅ No broken links found');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the debug
debugArtistData();
