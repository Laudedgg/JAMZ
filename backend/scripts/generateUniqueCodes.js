import mongoose from 'mongoose';
import User from '../models/user.js';

// Helper function to generate unique 4-digit code
async function generateUniqueCode(existingCodes) {
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate random 4-digit code (1000-9999)
    code = String(Math.floor(1000 + Math.random() * 9000));
    
    // Check if code already exists in database or in our set
    if (!existingCodes.has(code)) {
      const existing = await User.findOne({ uniqueCode: code });
      if (!existing) {
        existingCodes.add(code);
        return code;
      }
    }
    attempts++;
  }
  
  throw new Error('Unable to generate unique code after maximum attempts');
}

async function migrateUniqueCodes() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz-production';
    console.log(`Connecting to ${dbUrl}...`);
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');

    // Find all users without unique codes
    const usersWithoutCodes = await User.find({
      $or: [
        { uniqueCode: { $exists: false } },
        { uniqueCode: null },
        { uniqueCode: '' }
      ]
    });

    console.log(`\nFound ${usersWithoutCodes.length} users without unique codes`);

    if (usersWithoutCodes.length === 0) {
      console.log('All users already have unique codes!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all existing codes
    const existingCodes = new Set();
    const usersWithCodes = await User.find({ uniqueCode: { $exists: true, $ne: null, $ne: '' } });
    usersWithCodes.forEach(user => {
      if (user.uniqueCode) {
        existingCodes.add(user.uniqueCode);
      }
    });

    console.log(`Existing codes in database: ${existingCodes.size}`);
    console.log('\nGenerating unique codes...\n');

    // Generate and assign codes
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutCodes) {
      try {
        const code = await generateUniqueCode(existingCodes);
        user.uniqueCode = code;
        await user.save();
        
        console.log(`✅ ${user.email || user.username || user._id} -> ${code}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to generate code for ${user.email || user._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`Total: ${usersWithoutCodes.length}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateUniqueCodes();

