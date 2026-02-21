# Generate 10 Tracks for Discovery Page

I've created a script to generate 10 popular tracks for your Discovery page. However, **MongoDB needs to be running** first.

## 🎯 Quick Start

### Option 1: Install MongoDB Locally (Recommended)

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community@7.0

# Create data directory
mkdir -p mongodb-data

# Start MongoDB on port 27018
mongod --port 27018 --dbpath ./mongodb-data
```

**Then in a new terminal:**
```bash
cd backend
node scripts/generate10Tracks.js
```

### Option 2: Use MongoDB Atlas (Cloud)

1. **Sign up for MongoDB Atlas** (free tier available)
   - Go to: https://www.mongodb.com/cloud/atlas
   - Create a free account
   - Create a new cluster (M0 Free tier)

2. **Get your connection string**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

3. **Update backend/.env**
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/jamz-dev?retryWrites=true&w=majority
   ```
   Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual values

4. **Restart backend server**
   ```bash
   # Stop the backend (Ctrl+C in terminal 14)
   # Or kill it:
   lsof -ti:3001 | xargs kill -9
   
   # Start again
   cd backend
   npm run dev
   ```

5. **Generate tracks**
   ```bash
   cd backend
   node scripts/generate10Tracks.js
   ```

### Option 3: Use Docker

```bash
# Start MongoDB in Docker
docker run -d \
  --name jamz-mongodb \
  -p 27018:27017 \
  -v $(pwd)/mongodb-data:/data/db \
  mongo:7.0

# Wait a few seconds for MongoDB to start
sleep 5

# Generate tracks
cd backend
node scripts/generate10Tracks.js
```

## 📋 What Tracks Will Be Generated?

The script will create 10 popular tracks:

1. **Midnight City** - M83 (4:04)
2. **Starboy** - The Weeknd ft. Daft Punk (3:50)
3. **Sunflower** - Post Malone & Swae Lee (2:38)
4. **Bohemian Rhapsody** - Queen (5:54)
5. **Shape of You** - Ed Sheeran (3:54)
6. **Believer** - Imagine Dragons (3:24)
7. **Counting Stars** - OneRepublic (4:17)
8. **Radioactive** - Imagine Dragons (3:07)
9. **Uptown Funk** - Mark Ronson ft. Bruno Mars (4:29)
10. **Someone Like You** - Adele (4:45)

Each track includes:
- ✅ YouTube URL (for playback)
- ✅ Spotify URL
- ✅ Apple Music URL
- ✅ Cover image
- ✅ Duration
- ✅ Vote scores (upvotes/downvotes)

## 🔍 Verify Tracks Were Created

After running the script, you can verify the tracks:

```bash
# Check in MongoDB (if using local MongoDB)
mongosh --port 27018
use jamz-dev
db.tracks.countDocuments()
db.tracks.find().pretty()
exit
```

Or just refresh your browser at http://localhost:3000/discovery

## 🎵 View Tracks on Discovery Page

Once tracks are generated:
1. Open http://localhost:3000/discovery
2. You should see all 10 tracks
3. Click any track to play it via YouTube

## 🔧 Troubleshooting

### "MongoDB connection error"
- Make sure MongoDB is running on port 27018
- Check with: `lsof -ti:27018`
- If nothing shows, MongoDB is not running

### "Tracks already exist"
If you want to regenerate tracks, first delete existing ones:

```bash
mongosh --port 27018
use jamz-dev
db.tracks.deleteMany({})
exit
```

Then run the script again.

### Backend not connecting to MongoDB
1. Check backend logs (terminal 14)
2. Verify MONGODB_URI in backend/.env
3. Restart backend server

## 📝 Alternative: Manual Track Creation

If you prefer to create tracks manually through the UI:
1. Make sure you're logged in as an admin
2. Go to http://localhost:3000/admin
3. Use the "Add Track" form
4. Fill in track details and submit

## 🚀 Next Steps

After generating tracks:
1. ✅ Tracks appear on Discovery page
2. ✅ Users can play tracks via YouTube
3. ✅ Users can vote on tracks (upvote/downvote)
4. ✅ Tracks are sorted by vote score

Enjoy your music discovery platform! 🎵

