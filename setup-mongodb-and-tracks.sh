#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}║         MongoDB Setup & Track Generation for JAMZ.fun         ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if MongoDB is already running
if lsof -ti:27018 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is already running on port 27018${NC}"
    MONGODB_RUNNING=true
else
    echo -e "${YELLOW}⚠️  MongoDB is not running on port 27018${NC}"
    MONGODB_RUNNING=false
fi

# If MongoDB is not running, offer options
if [ "$MONGODB_RUNNING" = false ]; then
    echo ""
    echo -e "${YELLOW}Choose an option to set up MongoDB:${NC}"
    echo ""
    echo "1. Start MongoDB locally (requires MongoDB to be installed)"
    echo "2. Start MongoDB with Docker"
    echo "3. I'll use MongoDB Atlas (cloud) - just generate tracks"
    echo "4. Exit and set up MongoDB manually"
    echo ""
    read -p "Enter your choice (1-4): " choice

    case $choice in
        1)
            echo ""
            echo -e "${BLUE}Starting MongoDB locally...${NC}"
            
            # Check if MongoDB is installed
            if ! command -v mongod &> /dev/null; then
                echo -e "${RED}❌ MongoDB is not installed${NC}"
                echo ""
                echo "Install MongoDB with:"
                echo "  brew tap mongodb/brew"
                echo "  brew install mongodb-community@7.0"
                echo ""
                exit 1
            fi
            
            # Create data directory
            mkdir -p mongodb-data
            
            # Start MongoDB in background
            echo "Starting MongoDB on port 27018..."
            mongod --port 27018 --dbpath ./mongodb-data --logpath ./mongodb-data/mongodb.log --fork
            
            # Wait for MongoDB to start
            sleep 3
            
            if lsof -ti:27018 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ MongoDB started successfully${NC}"
                MONGODB_RUNNING=true
            else
                echo -e "${RED}❌ Failed to start MongoDB${NC}"
                echo "Check logs: tail -f ./mongodb-data/mongodb.log"
                exit 1
            fi
            ;;
            
        2)
            echo ""
            echo -e "${BLUE}Starting MongoDB with Docker...${NC}"
            
            # Check if Docker is installed
            if ! command -v docker &> /dev/null; then
                echo -e "${RED}❌ Docker is not installed${NC}"
                echo ""
                echo "Install Docker from: https://www.docker.com/products/docker-desktop"
                echo ""
                exit 1
            fi
            
            # Create data directory
            mkdir -p mongodb-data
            
            # Stop existing container if any
            docker stop jamz-mongodb 2>/dev/null
            docker rm jamz-mongodb 2>/dev/null
            
            # Start MongoDB container
            docker run -d \
              --name jamz-mongodb \
              -p 27018:27017 \
              -v "$(pwd)/mongodb-data:/data/db" \
              mongo:7.0
            
            # Wait for MongoDB to start
            echo "Waiting for MongoDB to start..."
            sleep 5
            
            if lsof -ti:27018 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ MongoDB Docker container started successfully${NC}"
                MONGODB_RUNNING=true
            else
                echo -e "${RED}❌ Failed to start MongoDB Docker container${NC}"
                echo "Check Docker logs: docker logs jamz-mongodb"
                exit 1
            fi
            ;;
            
        3)
            echo ""
            echo -e "${YELLOW}Using MongoDB Atlas${NC}"
            echo ""
            echo "Make sure you've updated backend/.env with your MongoDB Atlas connection string:"
            echo "  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jamz-dev"
            echo ""
            read -p "Have you updated backend/.env? (y/n): " atlas_ready
            
            if [ "$atlas_ready" != "y" ]; then
                echo ""
                echo "Please update backend/.env first, then run this script again."
                exit 0
            fi
            
            MONGODB_RUNNING=true
            ;;
            
        4)
            echo ""
            echo "See GENERATE_TRACKS_GUIDE.md for manual setup instructions"
            exit 0
            ;;
            
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
fi

# Generate tracks
if [ "$MONGODB_RUNNING" = true ]; then
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Generating 10 tracks for Discovery page...${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    cd backend
    node scripts/generate10Tracks.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Tracks generated successfully!${NC}"
        echo ""
        echo -e "${BLUE}🌐 Visit http://localhost:3000/discovery to see your tracks${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Failed to generate tracks${NC}"
        echo "Check the error message above for details"
        exit 1
    fi
fi

