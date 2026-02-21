import fetch from 'node-fetch';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAdminLogin() {
  console.log('Testing admin login...');

  // Admin credentials
  const email = 'admin@jamz.fun';
  const password = 'admin123';

  try {
    // First, ensure admin user exists in database
    console.log('\n=== Ensuring Admin User Exists ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz');
    console.log('Connected to MongoDB');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update or create admin user
    await User.findOneAndUpdate(
      { email: email },
      {
        password: hashedPassword,
        isAdmin: true,
        username: 'Admin'
      },
      { upsert: true }
    );

    console.log(`✅ Admin user ensured: ${email} / ${password}`);

    // Verify the user was created correctly
    const user = await User.findOne({ email: email });
    if (user) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`Database verification - Password match: ${isValidPassword ? '✅' : '❌'}`);
      console.log(`Database verification - Is admin: ${user.isAdmin ? '✅' : '❌'}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    // Now test the login endpoint - server is running on 5002
    console.log('\n=== Testing Login Endpoint ===');
    const response = await fetch('http://localhost:5002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Response status:', response.status);

    // Get the response text
    const responseText = await response.text();

    try {
      // Try to parse as JSON
      const data = JSON.parse(responseText);
      console.log('Admin login response:');
      console.log('- Success:', response.ok);
      console.log('- Token received:', !!data.token);
      console.log('- User details:', {
        id: data.user?.id,
        email: data.user?.email,
        isAdmin: data.user?.isAdmin,
      });

      if (response.ok && data.token && data.user?.isAdmin) {
        console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
        console.log(`Use these credentials: ${email} / ${password}`);
      } else {
        console.log('❌ Admin login failed');
      }
    } catch (parseError) {
      console.log('Could not parse response as JSON. Raw response:');
      console.log(responseText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testAdminLogin();
