#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Running OpenVerse submission index migration...');
console.log('');

try {
  execSync('node migrations/update-submission-index.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
