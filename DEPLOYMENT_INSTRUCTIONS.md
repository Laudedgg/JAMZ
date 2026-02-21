# Deployment Instructions for Mobile Hero Fix

## Current Status

✅ **Local Development**: Fix is working correctly on localhost:3000
❌ **Production (jamz.fun)**: Old version still deployed

## What Needs to Be Deployed

The following files have been updated and need to be deployed to production:

1. **src/App.tsx** (Line 403)
   - Changed mobile padding from `pt-[80px]` to `pt-0`

2. **src/index.css** (Lines 811-822)
   - Added `!important` rules to force `.h-screen` to use `100vh` on mobile

## Build Process

The changes have already been compiled into the `dist/` folder:

```bash
npm run build
```

This created the production-ready files in the `dist/` directory.

## Deployment Options

### Option 1: Manual Deployment (if you have FTP/SSH access)

1. Upload the entire `dist/` folder to your production server
2. Make sure to replace all files, especially:
   - `dist/index.html`
   - `dist/assets/*.css` (the CSS bundle)
   - `dist/assets/*.js` (the JavaScript bundles)

### Option 2: Using a Hosting Platform

#### If using **Vercel**:
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

#### If using **Netlify**:
```bash
# Install Netlify CLI if not already installed
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### If using **GitHub Pages**:
```bash
# Push the dist folder to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

### Option 3: Check Current Deployment Method

To find out how jamz.fun is currently deployed, check:

1. **DNS/Hosting Provider**: Log into your domain registrar or hosting provider
2. **Check for CI/CD**: Look for:
   - `.github/workflows/` folder (GitHub Actions)
   - `vercel.json` file (Vercel)
   - `netlify.toml` file (Netlify)
   - `.gitlab-ci.yml` (GitLab CI)

## Verification After Deployment

After deploying, verify the fix works on production:

1. Open https://jamz.fun/ in Chrome on desktop
2. Open Chrome DevTools (F12)
3. Click the device toolbar icon (Cmd+Shift+M)
4. Select "iPhone SE" or another mobile device
5. Refresh the page (Cmd+R)
6. **Expected Result**: Only the hero section should be visible, filling the entire viewport

### Quick Check

Run this in the browser console on https://jamz.fun/ (mobile view):

```javascript
const hero = document.querySelector('.relative.h-screen.flex.items-center.justify-center.overflow-hidden');
const rect = hero.getBoundingClientRect();
console.log('Hero height:', rect.height);
console.log('Viewport height:', window.innerHeight);
console.log('Fills viewport:', Math.abs(rect.height - window.innerHeight) < 10);
```

Expected output:
```
Hero height: 667
Viewport height: 667
Fills viewport: true
```

## Troubleshooting

### Issue: Changes not visible after deployment

**Possible causes:**

1. **Browser cache**: Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

2. **CDN cache**: If using a CDN (Cloudflare, etc.), purge the cache:
   - Log into your CDN provider
   - Find "Purge Cache" or "Clear Cache" option
   - Purge all files or specifically the CSS/JS files

3. **Service Worker**: If the site uses a service worker, it might be caching old files:
   - Open DevTools → Application → Service Workers
   - Click "Unregister" or "Update"
   - Hard refresh the page

4. **Wrong files deployed**: Make sure you deployed the files from the `dist/` folder, not the `src/` folder

### Issue: Build failed

If the build fails, check:
- Node.js version (should be 18 or higher)
- All dependencies installed: `npm install`
- No TypeScript errors: `npm run lint`

## Contact Information

If you need help with deployment, please provide:
1. Your hosting provider (Vercel, Netlify, custom server, etc.)
2. How you currently deploy updates
3. Any error messages you encounter

## Files to Deploy

The critical files that contain the fix:
- `dist/index.html`
- `dist/assets/index-Dm9et-KX.css` (or similar CSS bundle name)
- All files in `dist/assets/` folder

**Note**: The CSS bundle name may change with each build. Make sure to deploy ALL files from the `dist/` folder.

