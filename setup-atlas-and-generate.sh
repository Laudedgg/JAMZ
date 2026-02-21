#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MongoDB Atlas Setup & Track Generation for JAMZ.fun       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Since Docker and local MongoDB are not available, we'll use MongoDB Atlas (cloud).${NC}"
echo ""
echo "MongoDB Atlas offers a FREE tier (M0) with 512MB storage - perfect for development!"
echo ""
echo -e "${BLUE}Steps to set up MongoDB Atlas:${NC}"
echo ""
echo "1. Go to: https://www.mongodb.com/cloud/atlas/register"
echo "2. Sign up for a free account (or log in if you have one)"
echo "3. Create a new project (e.g., 'JAMZ')"
echo "4. Click 'Build a Database'"
echo "5. Choose 'M0 FREE' tier"
echo "6. Select a cloud provider and region (any will work)"
echo "7. Click 'Create Cluster' (takes 1-3 minutes)"
echo "8. Click 'Database Access' → 'Add New Database User'"
echo "   - Username: jamzuser"
echo "   - Password: (generate a secure password)"
echo "   - Database User Privileges: 'Read and write to any database'"
echo "9. Click 'Network Access' → 'Add IP Address'"
echo "   - Click 'Allow Access from Anywhere' (0.0.0.0/0)"
echo "   - This is fine for development"
echo "10. Go back to 'Database' → Click 'Connect'"
echo "11. Choose 'Connect your application'"
echo "12. Copy the connection string (looks like):"
echo "    mongodb+srv://jamzuser:<password>@cluster0.xxxxx.mongodb.net/"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Have you completed the MongoDB Atlas setup? (y/n): " atlas_ready

if [ "$atlas_ready" != "y" ]; then
    echo ""
    echo "Please complete the MongoDB Atlas setup first, then run this script again."
    exit 0
fi

echo ""
read -p "Enter your MongoDB Atlas connection string: " connection_string

if [ -z "$connection_string" ]; then
    echo -e "${RED}❌ Connection string cannot be empty${NC}"
    exit 1
fi

# Add database name if not present
if [[ ! "$connection_string" =~ "/jamz-dev" ]]; then
    # Remove trailing slash if present
    connection_string="${connection_string%/}"
    # Add database name
    connection_string="${connection_string}/jamz-dev?retryWrites=true&w=majority"
fi

echo ""
echo -e "${BLUE}Updating backend/.env with MongoDB Atlas connection...${NC}"

# Backup original .env
cp backend/.env backend/.env.backup

# Update MONGODB_URI in backend/.env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=${connection_string}|" backend/.env
else
    # Linux
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=${connection_string}|" backend/.env
fi

echo -e "${GREEN}✅ Updated backend/.env${NC}"
echo ""

# Check if backend is running
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}Backend server is running. Restarting to connect to MongoDB Atlas...${NC}"
    echo ""
    
    # Kill backend
    lsof -ti:3001 | xargs kill -9
    sleep 2
    
    # Start backend in background
    cd backend
    npm run dev > ../backend-atlas.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    echo "Waiting for backend to connect to MongoDB Atlas..."
    sleep 5
    
    # Check if backend is running
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend restarted and connected to MongoDB Atlas${NC}"
    else
        echo -e "${RED}❌ Backend failed to start. Check backend-atlas.log for errors${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Starting backend server...${NC}"
    cd backend
    npm run dev > ../backend-atlas.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    echo "Waiting for backend to start..."
    sleep 5
    
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started and connected to MongoDB Atlas${NC}"
    else
        echo -e "${RED}❌ Backend failed to start. Check backend-atlas.log for errors${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Generating 10 tracks for Discovery page...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

cd backend
node scripts/generate10Tracks.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully generated 10 tracks!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Visit http://localhost:3000/discovery to see your tracks${NC}"
    echo ""
    echo -e "${GREEN}Your MongoDB Atlas connection is now active!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Failed to generate tracks${NC}"
    echo "Check the error message above for details"
    echo "Backend logs: tail -f backend-atlas.log"
    exit 1
fi

