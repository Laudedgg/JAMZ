# MongoDB Setup for JAMZ.fun

Your servers are running, but MongoDB needs to be configured. Choose one of the options below:

## ✅ Current Status
- ✅ Frontend: Running on http://localhost:3000
- ✅ Backend: Running on http://localhost:3001
- ❌ MongoDB: Not connected

## Option 1: Install MongoDB Locally (Recommended for Development)

### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB on port 27018
mongod --port 27018 --dbpath ./mongodb-data
```

### Alternative: Start MongoDB as a Service
```bash
# Start MongoDB service
brew services start mongodb-community@7.0

# Then configure it to use port 27018
# Edit /usr/local/etc/mongod.conf and change port to 27018
# Or run manually:
mongod --port 27018 --dbpath ./mongodb-data
```

## Option 2: Use MongoDB Atlas (Cloud Database)

### Steps:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier available)
4. Get your connection string
5. Update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jamz-dev?retryWrites=true&w=majority
```

Replace `username`, `password`, and `cluster` with your actual values.

## Option 3: Use Docker

```bash
# Run MongoDB in Docker on port 27018
docker run -d \
  --name jamz-mongodb \
  -p 27018:27017 \
  -v $(pwd)/mongodb-data:/data/db \
  mongo:7.0
```

## Verify MongoDB Connection

After starting MongoDB, restart the backend:

```bash
# Stop backend (Ctrl+C in the backend terminal)
# Or kill the process
lsof -ti:3001 | xargs kill -9

# Start backend again
cd backend
npm run dev
```

You should see:
```
Connected to MongoDB successfully
```

## Quick Test

Once MongoDB is running, test the connection:

```bash
# Using mongosh (MongoDB Shell)
mongosh --port 27018

# Or using mongo (older client)
mongo --port 27018
```

## Current Configuration

Your backend is configured to use:
```
MONGODB_URI=mongodb://localhost:27018/jamz-dev
```

This expects MongoDB to be running locally on port 27018.

## Troubleshooting

### MongoDB Not Starting
```bash
# Check if port 27018 is already in use
lsof -ti:27018

# Check MongoDB logs
tail -f ./mongodb-data/mongodb.log
```

### Permission Issues
```bash
# Fix mongodb-data directory permissions
sudo chown -R $(whoami) ./mongodb-data
chmod -R 755 ./mongodb-data
```

### Connection Still Failing
1. Verify MongoDB is running: `lsof -ti:27018`
2. Check backend/.env has correct MONGODB_URI
3. Restart backend server
4. Check backend logs for errors

## Next Steps

1. **Choose an option above** to set up MongoDB
2. **Restart the backend** after MongoDB is running
3. **Refresh your browser** at http://localhost:3000
4. **Create sample data** (optional):
   ```bash
   cd backend
   npm run create-sample-data
   ```

## Note

The app will load without MongoDB, but database operations (user auth, saving data, etc.) won't work until MongoDB is connected.

