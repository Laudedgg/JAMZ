#!/bin/bash

# JAMZ.fun Setup and Start Script
# This script sets up the environment and starts both frontend and backend servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     JAMZ.fun Server Setup Script      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        echo -e "${YELLOW}⚠️  Port $1 is in use. Killing process...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"
echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"

# Check MongoDB
echo ""
echo -e "${BLUE}🗄️  Checking MongoDB...${NC}"
if command_exists mongod; then
    echo -e "${GREEN}✅ MongoDB is installed${NC}"
    MONGODB_INSTALLED=true
else
    echo -e "${YELLOW}⚠️  MongoDB not found locally. Make sure MONGODB_URI is configured for remote database.${NC}"
    MONGODB_INSTALLED=false
fi

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Fix environment configuration
echo ""
echo -e "${BLUE}🔧 Configuring environment...${NC}"

# Update frontend .env to use correct backend URL
if [ -f .env ]; then
    if grep -q "REACT_APP_API_URL=http://localhost:5004/api" .env; then
        echo -e "${YELLOW}Updating frontend API URL to port 3001...${NC}"
        sed -i.bak 's|REACT_APP_API_URL=http://localhost:5004/api|REACT_APP_API_URL=http://localhost:3001/api|g' .env
        rm -f .env.bak
    fi
fi

echo -e "${GREEN}✅ Environment configured${NC}"

# Kill processes on ports if they exist
echo ""
echo -e "${BLUE}🧹 Cleaning up ports...${NC}"
kill_port 3000
kill_port 3001
echo -e "${GREEN}✅ Ports cleaned${NC}"

# Start MongoDB if installed locally
if [ "$MONGODB_INSTALLED" = true ]; then
    echo ""
    echo -e "${BLUE}🗄️  Starting MongoDB...${NC}"
    if ! port_in_use 27018; then
        mkdir -p mongodb-data
        mongod --port 27018 --dbpath ./mongodb-data --fork --logpath ./mongodb-data/mongodb.log
        echo -e "${GREEN}✅ MongoDB started on port 27018${NC}"
    else
        echo -e "${GREEN}✅ MongoDB already running on port 27018${NC}"
    fi
fi

# Start servers
echo ""
echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""

# Create a function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}Starting backend server on port 3001...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting frontend server on port 3000...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Display status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎉 Servers Started Successfully!   ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "   API:       ${GREEN}http://localhost:3001/api${NC}"
if [ "$MONGODB_INSTALLED" = true ]; then
    echo -e "   MongoDB:   ${GREEN}mongodb://localhost:27018/jamz-dev${NC}"
fi
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Frontend:  ${BLUE}tail -f frontend.log${NC}"
echo -e "   Backend:   ${BLUE}tail -f backend.log${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for processes
wait

