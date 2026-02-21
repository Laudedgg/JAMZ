# YouTube API Setup Guide

This guide will help you set up a YouTube Data API v3 key for the bulk track import feature.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Jamz.fun YouTube API")
5. Click "Create"

## Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on "YouTube Data API v3"
4. Click the **Enable** button

## Step 3: Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Your API key will be created and displayed
4. **IMPORTANT:** Click "Restrict Key" to secure it:
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3" from the dropdown
   - Click "Save"

## Step 4: Add API Key to Environment Variables

### For Development (Local):

1. Open `backend/.env`
2. Find the line `YOUTUBE_API_KEY=`
3. Add your API key: `YOUTUBE_API_KEY=YOUR_API_KEY_HERE`

### For Production (Server):

1. SSH into your server:
   ```bash
   ssh -i ~/Downloads/vibenow.pem ubuntu@54.164.143.46
   ```

2. Edit the production environment file:
   ```bash
   cd jamz.fun/backend
   nano .env
   ```

3. Add your YouTube API key:
   ```
   YOUTUBE_API_KEY=YOUR_API_KEY_HERE
   ```

4. Save and exit (Ctrl+X, then Y, then Enter)

5. Restart the backend:
   ```bash
   pm2 restart jamz-backend
   ```

## Step 5: Test the Feature

1. Log in to the admin panel at `https://jamz.fun/admin/login`
2. Navigate to **Tracks** management
3. Click the **Bulk Import** button
4. Paste YouTube URLs (one per line), for example:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   https://www.youtube.com/watch?v=9bZkp7q19f0
   ```
5. Click **Enrich Tracks**
6. Review the extracted metadata
7. Edit any fields if needed
8. Click **Create Tracks**

## API Quota Information

- **Free Quota:** 10,000 units per day
- **Cost per video metadata request:** ~3 units
- **Estimated tracks per day:** ~3,000 tracks

This should be more than enough for normal usage!

## Troubleshooting

### "YouTube API key not configured"
- Make sure you added the API key to the `.env` file
- Restart the backend server after adding the key

### "YouTube API error: 403"
- Your API key might not have the YouTube Data API v3 enabled
- Check that you enabled the API in Step 2

### "Video not found"
- The YouTube URL might be invalid
- The video might be private or deleted
- Try a different video URL

## Optional: Apple Music API

For even better metadata enrichment, you can also set up Apple Music API:

1. Go to [Apple Developer](https://developer.apple.com/account/resources/authkeys/list)
2. Create a MusicKit key
3. Add it to `.env` as `APPLE_MUSIC_TOKEN=YOUR_TOKEN_HERE`

Note: Apple Music API setup is more complex and requires an Apple Developer account ($99/year).

## How It Works

1. **YouTube Metadata Extraction:**
   - Extracts video title, thumbnail, duration
   - Parses artist and track name from title
   - Common patterns: "Artist - Title", "Title by Artist", "Artist: Title"

2. **Spotify Search:**
   - Searches Spotify for matching track
   - Gets Spotify URL and preview URL
   - Uses Client Credentials flow (no user login needed)

3. **Apple Music Search (Optional):**
   - Searches Apple Music for matching track
   - Gets Apple Music URL and preview URL

4. **Track Creation:**
   - Downloads cover image from YouTube thumbnail
   - Creates track in database with all metadata
   - Ready to play immediately!

## Example Workflow

```
Input: https://www.youtube.com/watch?v=dQw4w9WgXcQ

↓ YouTube API extracts:
- Title: "Rick Astley - Never Gonna Give You Up"
- Thumbnail: https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg
- Duration: 213 seconds

↓ Parse artist and title:
- Artist: "Rick Astley"
- Title: "Never Gonna Give You Up"

↓ Spotify API searches:
- Spotify URL: https://open.spotify.com/track/...
- Preview URL: https://p.scdn.co/mp3-preview/...

↓ Create track in database:
✅ Track created with YouTube, Spotify, and cover image!
```

Enjoy bulk importing tracks! 🎵

