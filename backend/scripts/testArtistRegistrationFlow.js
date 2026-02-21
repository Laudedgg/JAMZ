import fetch from 'node-fetch';
import mongoose from 'mongoose';
import ArtistAuth from '../models/artistAuth.js';
import Artist from '../models/artist.js';
import dotenv from 'dotenv';

dotenv.config();

async function testArtistRegistrationFlow() {
  console.log('🎵 Testing Complete Artist Registration & Profile Flow');
  console.log('====================================================');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz');
    console.log('✅ Connected to MongoDB');
    
    // Test data
    const testArtist = {
      email: 'great@yopmail.com',
      password: 'testpass123',
      artistName: 'Great',
      imageUrl: 'https://ui-avatars.com/api/?name=Great&size=200&background=8b5cf6&color=fff',
      socialLinks: {
        instagram: 'great_music',
        tiktok: 'great_tiktok',
        twitter: 'great_twitter',
        facebook: 'great_facebook'
      }
    };
    
    console.log('\n🧹 Cleaning up existing test data...');
    // Clean up any existing test data
    await ArtistAuth.deleteOne({ email: testArtist.email });
    const existingArtist = await Artist.findOne({ name: testArtist.artistName });
    if (existingArtist) {
      await Artist.deleteOne({ _id: existingArtist._id });
    }
    console.log('✅ Cleanup complete');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    // Step 1: Test Artist Registration
    console.log('\n📝 Step 1: Testing Artist Registration...');
    const registerResponse = await fetch('http://localhost:5002/api/artist-auth/self-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testArtist.email,
        password: testArtist.password,
        artistName: testArtist.artistName,
        imageUrl: testArtist.imageUrl,
        socialLinks: testArtist.socialLinks
      }),
    });
    
    console.log(`📡 Registration response status: ${registerResponse.status}`);
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('🎉 REGISTRATION SUCCESSFUL!');
      console.log(`   - Message: ${registerData.message}`);
      console.log(`   - Artist ID: ${registerData.artistId}`);
      console.log(`   - Artist Name: ${registerData.artistName}`);
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ REGISTRATION FAILED!');
      console.log(`   - Error: ${errorData.message}`);
      return;
    }
    
    // Step 2: Test Artist Login
    console.log('\n🔐 Step 2: Testing Artist Login...');
    const loginResponse = await fetch('http://localhost:5002/api/artist-auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testArtist.email,
        password: testArtist.password
      }),
    });
    
    console.log(`📡 Login response status: ${loginResponse.status}`);
    
    let authToken = null;
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      console.log('🎉 LOGIN SUCCESSFUL!');
      console.log(`   - Token received: ${!!authToken}`);
      console.log(`   - Artist ID: ${loginData.artist?.id}`);
      console.log(`   - Artist Name: ${loginData.artist?.name}`);
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ LOGIN FAILED!');
      console.log(`   - Error: ${errorData.message}`);
      return;
    }
    
    // Step 3: Test Profile Retrieval
    console.log('\n👤 Step 3: Testing Profile Retrieval...');
    const profileResponse = await fetch('http://localhost:5002/api/artist-auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📡 Profile response status: ${profileResponse.status}`);
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('🎉 PROFILE RETRIEVAL SUCCESSFUL!');
      console.log(`   - Name: ${profileData.name}`);
      console.log(`   - Email: ${profileData.email}`);
      console.log(`   - Image URL: ${profileData.imageUrl}`);
      console.log(`   - Social Media: ${JSON.stringify(profileData.socialMedia)}`);
      
      // Verify the data matches what was registered
      const dataMatches = {
        name: profileData.name === testArtist.artistName,
        email: profileData.email === testArtist.email,
        imageUrl: profileData.imageUrl === testArtist.imageUrl,
        socialMedia: JSON.stringify(profileData.socialMedia) === JSON.stringify(testArtist.socialLinks)
      };
      
      console.log('\n🔍 Data Verification:');
      Object.entries(dataMatches).forEach(([field, matches]) => {
        console.log(`   - ${field}: ${matches ? '✅ MATCH' : '❌ MISMATCH'}`);
      });
      
      const allMatch = Object.values(dataMatches).every(match => match);
      console.log(`\n🎯 Overall Result: ${allMatch ? '✅ ALL DATA MATCHES' : '❌ DATA MISMATCH DETECTED'}`);
      
    } else {
      const errorData = await profileResponse.json();
      console.log('❌ PROFILE RETRIEVAL FAILED!');
      console.log(`   - Error: ${errorData.message}`);
    }
    
    // Step 4: Test Profile Update
    console.log('\n✏️  Step 4: Testing Profile Update...');
    const updatedData = {
      name: 'Great Updated',
      imageUrl: 'https://ui-avatars.com/api/?name=Great+Updated&size=200&background=ec4899&color=fff',
      socialMedia: {
        instagram: 'great_music_updated',
        tiktok: 'great_tiktok_updated',
        twitter: 'great_twitter_updated',
        facebook: 'great_facebook_updated'
      }
    };
    
    const updateResponse = await fetch('http://localhost:5002/api/artist-auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
    
    console.log(`📡 Update response status: ${updateResponse.status}`);
    
    if (updateResponse.ok) {
      const updateResponseData = await updateResponse.json();
      console.log('🎉 PROFILE UPDATE SUCCESSFUL!');
      console.log(`   - Updated Name: ${updateResponseData.name}`);
      console.log(`   - Updated Image: ${updateResponseData.imageUrl}`);
      console.log(`   - Updated Social Media: ${JSON.stringify(updateResponseData.socialMedia)}`);
    } else {
      const errorData = await updateResponse.json();
      console.log('❌ PROFILE UPDATE FAILED!');
      console.log(`   - Error: ${errorData.message}`);
    }
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('================');
    console.log('✅ Artist registration flow tested');
    console.log('✅ Artist login flow tested');
    console.log('✅ Profile retrieval tested');
    console.log('✅ Profile update tested');
    console.log('');
    console.log('If all steps were successful, the artist registration and profile system is working correctly!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run the test
testArtistRegistrationFlow();
