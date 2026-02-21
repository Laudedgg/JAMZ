import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.js';

dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jamz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  updateUsers();
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function updateUsers() {
  try {
    // Find all users with a wallet address but no username
    const users = await User.find({
      walletAddress: { $exists: true, $ne: null },
      username: { $exists: false }
    });

    console.log(`Found ${users.length} users with wallet address but no username`);

    // Update each user
    for (const user of users) {
      console.log(`Updating user with wallet address ${user.walletAddress}`);
      
      // We don't need to set a needsUsername field in the database
      // because it's calculated on the fly in the API response
      // based on whether the user has a username or not
      
      // Just log the user for verification
      console.log(`User ${user._id} with wallet ${user.walletAddress} will be prompted to set a username`);
    }

    console.log('Update complete');
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}
