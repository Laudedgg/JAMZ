#!/usr/bin/env node

/**
 * PWA Verification Script
 * Checks if all PWA requirements are met
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function check(name, condition, message = '') {
  if (condition) {
    checks.passed.push(`✅ ${name}`);
  } else {
    checks.failed.push(`❌ ${name}${message ? ': ' + message : ''}`);
  }
}

function warn(name, message = '') {
  checks.warnings.push(`⚠️  ${name}${message ? ': ' + message : ''}`);
}

console.log('🔍 Verifying PWA Setup...\n');

// Check manifest.json
const manifestPath = path.join(rootDir, 'public', 'manifest.json');
let manifest = null;
try {
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  manifest = JSON.parse(manifestContent);
  check('Manifest exists and is valid JSON', true);
} catch (e) {
  check('Manifest exists and is valid JSON', false, e.message);
}

if (manifest) {
  check('Manifest has name', !!manifest.name);
  check('Manifest has short_name', !!manifest.short_name);
  check('Manifest has description', !!manifest.description);
  check('Manifest has start_url', !!manifest.start_url);
  check('Manifest has display mode', manifest.display === 'standalone');
  check('Manifest has theme_color', !!manifest.theme_color);
  check('Manifest has background_color', !!manifest.background_color);
  check('Manifest has icons', Array.isArray(manifest.icons) && manifest.icons.length > 0);
  
  if (manifest.icons) {
    const has192 = manifest.icons.some(i => i.sizes === '192x192');
    const has512 = manifest.icons.some(i => i.sizes === '512x512');
    const hasMaskable = manifest.icons.some(i => i.purpose === 'maskable');
    
    check('Manifest has 192x192 icon', has192);
    check('Manifest has 512x512 icon', has512);
    check('Manifest has maskable icon', hasMaskable);
  }
}

// Check service worker
const swPath = path.join(rootDir, 'public', 'sw.js');
try {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  check('Service worker exists', true);
  check('Service worker has install event', swContent.includes('addEventListener(\'install\''));
  check('Service worker has activate event', swContent.includes('addEventListener(\'activate\''));
  check('Service worker has fetch event', swContent.includes('addEventListener(\'fetch\''));
} catch (e) {
  check('Service worker exists', false, e.message);
}

// Check icon files
const iconFiles = [
  'jamzfunl-192.png',
  'jamzfunl-512.png',
  'jamzfunl-192-maskable.png'
];

iconFiles.forEach(icon => {
  const iconPath = path.join(rootDir, 'public', icon);
  const exists = fs.existsSync(iconPath);
  check(`Icon ${icon} exists`, exists);
  
  if (exists) {
    const stats = fs.statSync(iconPath);
    if (stats.size < 1000) {
      warn(`Icon ${icon} is very small`, `${stats.size} bytes`);
    }
  }
});

// Check index.html
const htmlPath = path.join(rootDir, 'index.html');
try {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  check('index.html exists', true);
  check('index.html has manifest link', htmlContent.includes('rel="manifest"'));
  check('index.html has viewport meta', htmlContent.includes('viewport'));
  check('index.html has theme-color meta', htmlContent.includes('theme-color'));
  check('index.html has apple-mobile-web-app-capable', htmlContent.includes('apple-mobile-web-app-capable'));
  check('index.html has apple-touch-icon', htmlContent.includes('apple-touch-icon'));
} catch (e) {
  check('index.html exists', false, e.message);
}

// Check src/main.tsx
const mainPath = path.join(rootDir, 'src', 'main.tsx');
try {
  const mainContent = fs.readFileSync(mainPath, 'utf-8');
  check('Service worker registration in main.tsx', mainContent.includes('serviceWorker'));
  check('Service worker registration has error handling', mainContent.includes('.catch'));
} catch (e) {
  check('Service worker registration in main.tsx', false, e.message);
}

// Check backend/server.js
const serverPath = path.join(rootDir, 'backend', 'server.js');
try {
  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  check('Backend has PWA headers middleware', serverContent.includes('manifest.json'));
  check('Backend sets service worker headers', serverContent.includes('Service-Worker-Allowed'));
} catch (e) {
  check('Backend PWA configuration', false, e.message);
}

// Check browserconfig.xml
const browserConfigPath = path.join(rootDir, 'public', 'browserconfig.xml');
const browserConfigExists = fs.existsSync(browserConfigPath);
check('browserconfig.xml exists', browserConfigExists);

// Print results
console.log('\n' + '='.repeat(50));
console.log('PWA VERIFICATION RESULTS');
console.log('='.repeat(50) + '\n');

if (checks.passed.length > 0) {
  console.log('PASSED:');
  checks.passed.forEach(p => console.log('  ' + p));
  console.log();
}

if (checks.warnings.length > 0) {
  console.log('WARNINGS:');
  checks.warnings.forEach(w => console.log('  ' + w));
  console.log();
}

if (checks.failed.length > 0) {
  console.log('FAILED:');
  checks.failed.forEach(f => console.log('  ' + f));
  console.log();
}

// Summary
const total = checks.passed.length + checks.failed.length;
const percentage = Math.round((checks.passed.length / total) * 100);

console.log('='.repeat(50));
console.log(`Summary: ${checks.passed.length}/${total} checks passed (${percentage}%)`);
console.log('='.repeat(50) + '\n');

if (checks.failed.length === 0) {
  console.log('✨ PWA is fully configured and ready for installation!\n');
  process.exit(0);
} else {
  console.log('⚠️  Please fix the failed checks above.\n');
  process.exit(1);
}

