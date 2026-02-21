#!/usr/bin/env node

/**
 * Generate PWA icons from source image
 * Requires: npm install sharp
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, '../jamzfunl.png');
const publicDir = path.join(__dirname, '../public');

// Icon sizes needed for PWA
const sizes = [
  { size: 192, name: 'jamzfunl-192.png', purpose: 'any' },
  { size: 512, name: 'jamzfunl-512.png', purpose: 'any' },
  { size: 192, name: 'jamzfunl-192-maskable.png', purpose: 'maskable' }
];

async function generateIcons() {
  try {
    console.log('🎨 Generating PWA icons...');
    
    if (!fs.existsSync(sourceIcon)) {
      console.error(`❌ Source icon not found: ${sourceIcon}`);
      process.exit(1);
    }

    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      console.log(`📦 Creating ${size}x${size} icon: ${name}`);
      
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Created: ${outputPath}`);
    }

    console.log('\n✨ All PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

