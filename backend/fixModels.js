// This script ensures all models are properly registered in the correct order
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Import models in correct order to ensure proper registration
import './models/artist.js';
import './models/campaign.js';
import './models/challenge.js';
import './models/share.js';
import './models/track.js';
import './models/user.js';
import './models/wallet.js';

console.log('All models registered correctly');
