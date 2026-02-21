import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/user.js';

dotenv.config();

// Admin user details
const adminEmail = 'admin@jamz.fun';
const adminPassword = 'admin123';
const adminUsername = 'admin';

// Connect to MongoDB (development database)
mongoose.connect('mongodb://localhost:27017/jamz-dev', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB (jamz-dev)');
  createAdminUser();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      console.log('Admin user already exists in jamz-dev');
      
      // Update the user to be an admin if they're not already
      if (!existingUser.isAdmin) {
        existingUser.isAdmin = true;
        await existingUser.save();
        console.log('User updated to admin');
      }
      
      console.log('Admin credentials:');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      username: adminUsername,
      isAdmin: true
    });

    await adminUser.save();

    console.log('Admin user created successfully in jamz-dev');
    console.log('Admin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}
