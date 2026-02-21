#!/bin/bash

# Script to check the status of JAMZ.fun servers

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     JAMZ.fun Server Status Check      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -ti:$1 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $2 running on port $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $2 not running on port $1${NC}"
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ $2 responding at $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $2 not responding at $1${NC}"
        return 1
    fi
}

# Check ports
echo -e "${BLUE}📡 Checking ports...${NC}"
check_port 3000 "Frontend"
check_port 3001 "Backend"
check_port 27018 "MongoDB"
echo ""

# Check HTTP endpoints
echo -e "${BLUE}🌐 Checking HTTP endpoints...${NC}"
check_endpoint "http://localhost:3000" "Frontend"
check_endpoint "http://localhost:3001/api/health" "Backend API"
echo ""

# Check MongoDB connection
echo -e "${BLUE}🗄️  Checking MongoDB...${NC}"
if command -v mongosh >/dev/null 2>&1; then
    if mongosh --port 27018 --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB connection successful${NC}"
    else
        echo -e "${RED}❌ MongoDB connection failed${NC}"
    fi
elif command -v mongo >/dev/null 2>&1; then
    if mongo --port 27018 --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB connection successful${NC}"
    else
        echo -e "${RED}❌ MongoDB connection failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MongoDB client not found (mongosh/mongo)${NC}"
fi
echo ""

# Check environment files
echo -e "${BLUE}📝 Checking environment files...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ Frontend .env exists${NC}"
else
    echo -e "${RED}❌ Frontend .env missing${NC}"
fi

if [ -f backend/.env ]; then
    echo -e "${GREEN}✅ Backend .env exists${NC}"
else
    echo -e "${RED}❌ Backend .env missing${NC}"
fi
echo ""

# Check node_modules
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ -d node_modules ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Frontend dependencies not installed (run: npm install)${NC}"
fi

if [ -d backend/node_modules ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Backend dependencies not installed (run: cd backend && npm install)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Quick Links               ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "API:       ${GREEN}http://localhost:3001/api${NC}"
echo -e "Health:    ${GREEN}http://localhost:3001/api/health${NC}"
echo ""

