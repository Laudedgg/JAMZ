import mongoose from 'mongoose';
import Artist from '../models/artist.js';
import ArtistAuth from '../models/artistAuth.js';

const MONGODB_URI = 'mongodb://localhost:27017/jamz';

async function investigateArtistData() {
  try {
    console.log('🔍 Investigating Artist Data in Database');
    console.log('==========================================');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all artists
    const artists = await Artist.find({});
    console.log(`\n📊 Found ${artists.length} artists in database:`);
    artists.forEach((artist, index) => {
      console.log(`${index + 1}. Artist ID: ${artist._id}`);
      console.log(`   Name: ${artist.name}`);
      console.log(`   Image URL: ${artist.imageUrl || 'None'}`);
      console.log(`   Social Media: ${JSON.stringify(artist.socialMedia || {})}`);
      console.log('');
    });

    // Get all artist auth records
    const artistAuths = await ArtistAuth.find({});
    console.log(`\n🔐 Found ${artistAuths.length} artist auth records:`);
    artistAuths.forEach((auth, index) => {
      console.log(`${index + 1}. ArtistAuth ID: ${auth._id}`);
      console.log(`   Email: ${auth.email}`);
      console.log(`   Artist ID: ${auth.artistId}`);
      console.log(`   Is Verified: ${auth.isVerified}`);
      console.log('');
    });

    // Check for any mismatches
    console.log('\n🔍 Checking for data consistency...');
    for (const auth of artistAuths) {
      const artist = await Artist.findById(auth.artistId);
      if (!artist) {
        console.log(`❌ MISMATCH: ArtistAuth ${auth._id} (${auth.email}) points to non-existent Artist ${auth.artistId}`);
      } else {
        console.log(`✅ MATCH: ArtistAuth ${auth._id} (${auth.email}) -> Artist ${artist._id} (${artist.name})`);
      }
    }

    // Check for orphaned artists
    console.log('\n🔍 Checking for orphaned artists...');
    for (const artist of artists) {
      const auth = await ArtistAuth.findOne({ artistId: artist._id });
      if (!auth) {
        console.log(`⚠️  ORPHANED: Artist ${artist._id} (${artist.name}) has no corresponding ArtistAuth record`);
      }
    }

    // Look for specific names
    console.log('\n🔍 Looking for specific artist names...');
    const greatArtist = await Artist.findOne({ name: 'Great' });
    if (greatArtist) {
      console.log(`✅ Found "Great" artist: ${greatArtist._id}`);
      const greatAuth = await ArtistAuth.findOne({ artistId: greatArtist._id });
      if (greatAuth) {
        console.log(`   Associated email: ${greatAuth.email}`);
      }
    } else {
      console.log('❌ No "Great" artist found');
    }

    const llonaArtist = await Artist.findOne({ name: 'Llona' });
    if (llonaArtist) {
      console.log(`✅ Found "Llona" artist: ${llonaArtist._id}`);
      const llonaAuth = await ArtistAuth.findOne({ artistId: llonaArtist._id });
      if (llonaAuth) {
        console.log(`   Associated email: ${llonaAuth.email}`);
      }
    } else {
      console.log('❌ No "Llona" artist found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

investigateArtistData();
