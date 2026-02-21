import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Track from '../models/track.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/jamz-fun';

async function deleteAllTracks() {
  try {
    console.log('🗑️  Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📊 Fetching all tracks...');
    const tracks = await Track.find({});
    console.log(`Found ${tracks.length} tracks to delete`);

    if (tracks.length === 0) {
      console.log('ℹ️  No tracks to delete');
      await mongoose.disconnect();
      return;
    }

    // Delete associated files
    console.log('🗑️  Deleting associated files...');
    let filesDeleted = 0;
    for (const track of tracks) {
      if (track.coverImage && fs.existsSync(track.coverImage)) {
        try {
          fs.unlinkSync(track.coverImage);
          filesDeleted++;
          console.log(`  ✓ Deleted cover image: ${track.coverImage}`);
        } catch (err) {
          console.error(`  ✗ Failed to delete cover image: ${track.coverImage}`, err.message);
        }
      }

      if (track.audioFile && fs.existsSync(track.audioFile)) {
        try {
          fs.unlinkSync(track.audioFile);
          filesDeleted++;
          console.log(`  ✓ Deleted audio file: ${track.audioFile}`);
        } catch (err) {
          console.error(`  ✗ Failed to delete audio file: ${track.audioFile}`, err.message);
        }
      }
    }
    console.log(`✅ Deleted ${filesDeleted} files`);

    // Delete all tracks from database
    console.log('🗑️  Deleting all tracks from database...');
    const result = await Track.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} tracks from database`);

    console.log('\n✨ All tracks have been successfully deleted!');
    console.log(`   - Files deleted: ${filesDeleted}`);
    console.log(`   - Database records deleted: ${result.deletedCount}`);

  } catch (error) {
    console.error('❌ Error deleting tracks:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

deleteAllTracks();

