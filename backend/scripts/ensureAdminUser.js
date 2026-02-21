import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/user.js';

dotenv.config();

async function ensureAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz';
    console.log('MongoDB URI:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Define admin credentials
    const adminEmail = 'admin@jamz.fun';
    const adminPassword = 'admin123';

    console.log('Checking if admin user exists...');
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Update admin user with new password
      await User.findOneAndUpdate(
        { email: adminEmail },
        { 
          password: hashedPassword,
          isAdmin: true
        }
      );
      
      console.log('Admin user password updated!');
    } else {
      console.log('Creating new admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create new admin user
      const adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        username: 'Admin'
      });
      
      await adminUser.save();
      console.log('Admin user created!');
    }

    // Verify admin exists and has admin role
    const admin = await User.findOne({ email: adminEmail });
    console.log('Admin user verification:');
    console.log('- Email:', admin.email);
    console.log('- Admin role:', admin.isAdmin ? 'Yes' : 'No');
    console.log('- Username:', admin.username);

    console.log('Done!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
ensureAdminUser();
