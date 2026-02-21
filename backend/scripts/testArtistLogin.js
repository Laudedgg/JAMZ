import fetch from 'node-fetch';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import ArtistAuth from '../models/artistAuth.js';
import Artist from '../models/artist.js';
import dotenv from 'dotenv';

dotenv.config();

async function testArtistLogin() {
  console.log('🎵 Testing Artist Authentication System');
  console.log('=====================================');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz');
    console.log('✅ Connected to MongoDB');
    
    // Test credentials - create a test artist if needed
    const testEmail = 'test.artist@jamz.fun';
    const testPassword = 'testpass123';
    const testArtistName = 'Test Artist';
    
    console.log('\n🔍 Checking for existing test artist...');
    let artistAuth = await ArtistAuth.findOne({ email: testEmail });
    
    if (!artistAuth) {
      console.log('📝 Creating test artist account...');
      
      // Create artist profile
      const artist = new Artist({
        name: testArtistName,
        imageUrl: '',
        socialMedia: {},
        isVerified: false
      });
      await artist.save();
      
      // Create artist auth
      artistAuth = new ArtistAuth({
        email: testEmail,
        password: testPassword,
        artistId: artist._id,
        isVerified: true
      });
      await artistAuth.save();
      
      console.log(`✅ Test artist created: ${testEmail}`);
    } else {
      console.log(`✅ Test artist exists: ${testEmail}`);
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    // Test the login endpoint
    console.log('\n🔐 Testing artist login endpoint...');
    const response = await fetch('http://localhost:5002/api/artist-auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: testEmail, 
        password: testPassword 
      }),
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🎉 ARTIST LOGIN SUCCESSFUL!');
      console.log('📋 Response data:');
      console.log(`   - Token received: ${!!data.token}`);
      console.log(`   - Artist ID: ${data.artist?.id}`);
      console.log(`   - Artist name: ${data.artist?.name}`);
      
      // Test the token by making an authenticated request
      console.log('\n🔒 Testing authenticated request...');
      const profileResponse = await fetch('http://localhost:5002/api/artist-auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📡 Profile response status: ${profileResponse.status}`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ AUTHENTICATED REQUEST SUCCESSFUL!');
        console.log('📋 Profile data:');
        console.log(`   - Artist name: ${profileData.name}`);
        console.log(`   - Email: ${profileData.email}`);
      } else {
        const errorData = await profileResponse.json();
        console.log('❌ AUTHENTICATED REQUEST FAILED!');
        console.log(`   - Error: ${errorData.message}`);
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ ARTIST LOGIN FAILED!');
      console.log(`   - Error: ${errorData.message}`);
    }
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('================');
    console.log('If login was successful, the artist authentication system is working correctly.');
    console.log('If there were errors, check:');
    console.log('1. Server is running on port 5002');
    console.log('2. JWT_SECRET environment variable is set');
    console.log('3. MongoDB connection is working');
    console.log('4. Browser localStorage has been cleared of old tokens');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run the test
testArtistLogin();
