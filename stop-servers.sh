#!/bin/bash

# Script to stop all JAMZ.fun servers

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping JAMZ.fun servers...${NC}"
echo ""

# Function to kill process on port
kill_port() {
    if lsof -ti:$1 >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping process on port $1...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ Port $1 freed${NC}"
    else
        echo -e "${GREEN}✅ Port $1 already free${NC}"
    fi
}

# Stop frontend (port 3000)
kill_port 3000

# Stop backend (port 3001)
kill_port 3001

# Stop MongoDB if running on port 27018
if lsof -ti:27018 >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping MongoDB on port 27018...${NC}"
    mongod --shutdown --dbpath ./mongodb-data 2>/dev/null || lsof -ti:27018 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ MongoDB stopped${NC}"
fi

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"

