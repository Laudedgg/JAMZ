#!/bin/bash

# Simple script to start both frontend and backend servers
# Run this after initial setup

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting JAMZ.fun servers...${NC}"
echo ""

# Function to handle cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}Starting backend on port 3001...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo -e "${GREEN}Starting frontend on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

sleep 2

echo ""
echo -e "${GREEN}✅ Servers running!${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "   Backend:  ${BLUE}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Wait for processes
wait

