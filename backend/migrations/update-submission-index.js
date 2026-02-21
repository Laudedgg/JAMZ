import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jamz';

async function updateSubmissionIndex() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('openversesubmissions');

    console.log('🔄 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the old unique index if it exists
    try {
      console.log('🔄 Dropping old unique index...');
      await collection.dropIndex({ campaignId: 1, userId: 1 });
      console.log('✅ Old index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old index does not exist, skipping drop');
      } else {
        console.log('⚠️  Error dropping old index:', error.message);
      }
    }

    // Create the new unique index
    console.log('🔄 Creating new unique index...');
    await collection.createIndex(
      { campaignId: 1, userId: 1, platform: 1 }, 
      { unique: true, name: 'campaignId_1_userId_1_platform_1' }
    );
    console.log('✅ New unique index created successfully');

    console.log('🔄 Verifying new indexes...');
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:', newIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    console.log('✅ Migration completed successfully!');
    console.log('📝 Users can now submit once per platform per campaign');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
updateSubmissionIndex();
